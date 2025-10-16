import { Client } from '@elastic/elasticsearch';
import { config } from '../config/config';
import { Email, EmailSearchQuery } from '../types/email';
import { logger } from '../utils/logger';

export class ElasticsearchService {
  private client: Client;
  private indexName: string;

  constructor() {
    this.client = new Client({ node: config.elasticsearch.node });
    this.indexName = config.elasticsearch.index;
  }

  async initialize(): Promise<void> {
    try {
      const indexExists = await this.client.indices.exists({ index: this.indexName });
      
      if (!indexExists) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            mappings: {
              properties: {
                id: { type: 'keyword' },
                messageId: { type: 'keyword' },
                account: { type: 'keyword' },
                folder: { type: 'keyword' },
                from: {
                  properties: {
                    name: { type: 'text' },
                    address: { type: 'keyword' }
                  }
                },
                to: {
                  type: 'nested',
                  properties: {
                    name: { type: 'text' },
                    address: { type: 'keyword' }
                  }
                },
                subject: { 
                  type: 'text',
                  fields: {
                    keyword: { type: 'keyword' }
                  }
                },
                body: { type: 'text' },
                bodyHtml: { type: 'text', index: false },
                date: { type: 'date' },
                category: { type: 'keyword' },
                read: { type: 'boolean' },
                attachments: {
                  type: 'nested',
                  properties: {
                    filename: { type: 'text' },
                    contentType: { type: 'keyword' },
                    size: { type: 'long' }
                  }
                },
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' }
              }
            }
          }
        });
        logger.info(`Elasticsearch index '${this.indexName}' created`);
      } else {
        logger.info(`Elasticsearch index '${this.indexName}' already exists`);
      }
    } catch (error) {
      logger.error('Error initializing Elasticsearch:', error);
      throw error;
    }
  }

  async indexEmail(email: Email): Promise<void> {
    try {
      await this.client.index({
        index: this.indexName,
        id: email.id,
        document: email
      });
      logger.info(`Email indexed: ${email.id}`);
    } catch (error) {
      logger.error('Error indexing email:', error);
      throw error;
    }
  }

  async bulkIndexEmails(emails: Email[]): Promise<void> {
    if (emails.length === 0) return;

    try {
      const operations = emails.flatMap(email => [
        { index: { _index: this.indexName, _id: email.id } },
        email
      ]);

      const response = await this.client.bulk({ operations });
      
      if (response.errors) {
        logger.error('Bulk indexing had errors');
      } else {
        logger.info(`Bulk indexed ${emails.length} emails`);
      }
    } catch (error) {
      logger.error('Error bulk indexing emails:', error);
      throw error;
    }
  }

  async searchEmails(searchQuery: EmailSearchQuery): Promise<{ emails: Email[], total: number }> {
    try {
      const must: any[] = [];
      
      if (searchQuery.query) {
        must.push({
          multi_match: {
            query: searchQuery.query,
            fields: ['subject^2', 'body', 'from.name', 'from.address']
          }
        });
      }

      if (searchQuery.account) {
        must.push({ term: { account: searchQuery.account } });
      }

      if (searchQuery.folder) {
        must.push({ term: { folder: searchQuery.folder } });
      }

      if (searchQuery.category) {
        must.push({ term: { category: searchQuery.category } });
      }

      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: must.length > 0 ? { bool: { must } } : { match_all: {} },
          from: searchQuery.from || 0,
          size: searchQuery.size || 20,
          sort: [{ date: { order: 'desc' } }]
        }
      });

      const emails = response.hits.hits.map(hit => hit._source as Email);
      const total = typeof response.hits.total === 'number' 
        ? response.hits.total 
        : response.hits.total?.value || 0;

      return { emails, total };
    } catch (error) {
      logger.error('Error searching emails:', error);
      throw error;
    }
  }

  async getEmailById(id: string): Promise<Email | null> {
    try {
      const response = await this.client.get({
        index: this.indexName,
        id
      });
      return response._source as Email;
    } catch (error: any) {
      if (error.meta?.statusCode === 404) {
        return null;
      }
      logger.error('Error getting email by ID:', error);
      throw error;
    }
  }

  async updateEmail(id: string, updates: Partial<Email>): Promise<void> {
    try {
      await this.client.update({
        index: this.indexName,
        id,
        doc: { ...updates, updatedAt: new Date() }
      });
      logger.info(`Email updated: ${id}`);
    } catch (error) {
      logger.error('Error updating email:', error);
      throw error;
    }
  }

  async emailExists(messageId: string, account: string): Promise<boolean> {
    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            bool: {
              must: [
                { term: { messageId } },
                { term: { account } }
              ]
            }
          },
          size: 1
        }
      });

      const total = response.hits.total;
      if (!total) return false;
      return total !== 0 && (typeof total === 'number' ? total > 0 : total.value > 0);
    } catch (error) {
      logger.error('Error checking email existence:', error);
      return false;
    }
  }

  async getHealth(): Promise<any> {
    try {
      return await this.client.cluster.health();
    } catch (error) {
      logger.error('Error getting Elasticsearch health:', error);
      throw error;
    }
  }
}
