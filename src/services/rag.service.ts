import { Email, SuggestedReply } from '../types/email';
import { logger } from '../utils/logger';
import { TfIdfRAGService } from './tfidf-rag.service';

/**
 * RAG (Retrieval-Augmented Generation) Service
 * Uses TF-IDF vector-based retrieval (free, no API costs for embeddings)
 * Combined with Gemini LLM for reply generation
 */
export class RAGService {
  private tfidfService: TfIdfRAGService;

  constructor() {
    // Use free TF-IDF based RAG (no embeddings API needed)
    this.tfidfService = new TfIdfRAGService();
    logger.info('RAG service created with TF-IDF vector database');
  }

  async initialize(): Promise<void> {
    try {
      await this.tfidfService.initialize();
      logger.info('RAG service initialized successfully');
    } catch (error) {
      logger.error('Error initializing RAG service:', error);
      logger.warn('RAG service will be disabled. Suggested replies will not be available.');
      // Don't throw - allow app to continue without RAG
    }
  }

  async suggestReply(email: Email): Promise<SuggestedReply> {
    return await this.tfidfService.suggestReply(email);
  }

  addKnowledge(text: string, metadata: { type: 'product' | 'agenda' | 'template'; category?: string }): void {
    this.tfidfService.addKnowledge(text, metadata);
  }

  getKnowledgeBase(): Array<{ id: string; text: string; metadata: any }> {
    return this.tfidfService.getKnowledgeBase();
  }
}
