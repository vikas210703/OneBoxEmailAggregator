import { ImapService } from './imap.service';
import { ElasticsearchService } from './elasticsearch.service';
import { AICategorizationService } from './ai-categorization.service';
import { NotificationService } from './notification.service';
import { RAGService } from './rag.service';
import { config } from '../config/config';
import { Email, EmailCategory } from '../types/email';
import { logger } from '../utils/logger';

export class EmailOrchestratorService {
  private imapServices: ImapService[] = [];
  private elasticsearchService: ElasticsearchService;
  private aiCategorizationService: AICategorizationService;
  private notificationService: NotificationService;
  private ragService: RAGService;

  constructor() {
    this.elasticsearchService = new ElasticsearchService();
    this.aiCategorizationService = new AICategorizationService();
    this.notificationService = new NotificationService();
    this.ragService = new RAGService();
  }

  async initialize(): Promise<void> {
    try {
      // Initialize Elasticsearch
      await this.elasticsearchService.initialize();
      logger.info('Elasticsearch initialized');

      // Initialize RAG service (optional - may fail if no quota)
      try {
        await this.ragService.initialize();
      } catch (error) {
        logger.warn('RAG service initialization failed, continuing without it');
      }
      logger.info('RAG service initialized');

      // Initialize IMAP connections for all accounts
      for (const account of config.emailAccounts) {
        const imapService = new ImapService(account);
        
        // Set up event listeners
        imapService.on('newEmails', async (emails: Email[]) => {
          await this.handleNewEmails(emails);
        });

        this.imapServices.push(imapService);
      }

      logger.info(`Initialized ${this.imapServices.length} IMAP connections`);
    } catch (error) {
      logger.error('Error initializing EmailOrchestratorService:', error);
      throw error;
    }
  }

  async startSync(): Promise<void> {
    try {
      // Connect all IMAP services
      for (const imapService of this.imapServices) {
        await imapService.connect();
        await imapService.openInbox();
        
        // Fetch recent emails (last 30 days)
        logger.info(`Fetching recent emails for ${imapService.getAccountEmail()}...`);
        const emails = await imapService.fetchRecentEmails(30);
        
        if (emails.length > 0) {
          await this.processEmails(emails);
        }
        
        // Start IDLE mode for real-time updates
        await imapService.startIdleMode();
        logger.info(`IDLE mode started for ${imapService.getAccountEmail()}`);
      }

      logger.info('Email synchronization started for all accounts');
    } catch (error) {
      logger.error('Error starting sync:', error);
      throw error;
    }
  }

  private async processEmails(emails: Email[]): Promise<void> {
    try {
      logger.info(`Processing ${emails.length} emails...`);

      // Filter out already indexed emails
      const newEmails: Email[] = [];
      for (const email of emails) {
        const exists = await this.elasticsearchService.emailExists(email.messageId, email.account);
        if (!exists) {
          newEmails.push(email);
        }
      }

      if (newEmails.length === 0) {
        logger.info('No new emails to process');
        return;
      }

      logger.info(`Found ${newEmails.length} new emails`);

      // Categorize emails using AI
      const categorizations = await this.aiCategorizationService.categorizeBatch(newEmails);
      
      // Update email categories
      newEmails.forEach(email => {
        email.category = categorizations.get(email.id) || EmailCategory.UNCATEGORIZED;
      });

      // Index emails in Elasticsearch
      await this.elasticsearchService.bulkIndexEmails(newEmails);

      // Send notifications for interested emails
      const interestedEmails = newEmails.filter(
        email => email.category === EmailCategory.INTERESTED
      );

      for (const email of interestedEmails) {
        await this.notificationService.notifyInterestedEmail(email);
      }

      logger.info(`Processed ${newEmails.length} emails, ${interestedEmails.length} interested`);
    } catch (error) {
      logger.error('Error processing emails:', error);
      throw error;
    }
  }

  private async handleNewEmails(emails: Email[]): Promise<void> {
    logger.info(`Handling ${emails.length} new emails from real-time sync`);
    await this.processEmails(emails);
  }

  async searchEmails(query: any): Promise<any> {
    return await this.elasticsearchService.searchEmails(query);
  }

  async getEmailById(id: string): Promise<Email | null> {
    return await this.elasticsearchService.getEmailById(id);
  }

  async categorizeEmail(emailId: string): Promise<EmailCategory> {
    const email = await this.elasticsearchService.getEmailById(emailId);
    if (!email) {
      throw new Error('Email not found');
    }

    const category = await this.aiCategorizationService.categorizeEmail(email);
    await this.elasticsearchService.updateEmail(emailId, { category });

    // If categorized as interested, send notifications
    if (category === EmailCategory.INTERESTED) {
      await this.notificationService.notifyInterestedEmail(email);
    }

    return category;
  }

  async suggestReply(emailId: string): Promise<any> {
    const email = await this.elasticsearchService.getEmailById(emailId);
    if (!email) {
      throw new Error('Email not found');
    }

    return await this.ragService.suggestReply(email);
  }

  async addKnowledge(text: string, metadata: any): Promise<void> {
    await this.ragService.addKnowledge(text, metadata);
  }

  getKnowledgeBase(): any[] {
    return this.ragService.getKnowledgeBase();
  }

  async getHealth(): Promise<any> {
    const esHealth = await this.elasticsearchService.getHealth();
    return {
      elasticsearch: esHealth,
      imapConnections: this.imapServices.map(service => ({
        account: service.getAccountEmail(),
        connected: true
      }))
    };
  }

  async stop(): Promise<void> {
    logger.info('Stopping email orchestrator...');
    
    for (const imapService of this.imapServices) {
      imapService.disconnect();
    }
    
    logger.info('Email orchestrator stopped');
  }
}
