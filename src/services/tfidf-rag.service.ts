import { TfIdf } from 'natural';
import { config } from '../config/config';
import { Email, SuggestedReply } from '../types/email';
import { logger } from '../utils/logger';
import { GeminiAIService } from './gemini-ai.service';

interface KnowledgeEntry {
  id: string;
  text: string;
  metadata: {
    type: 'product' | 'agenda' | 'template';
    category?: string;
  };
}

export class TfIdfRAGService {
  private gemini: GeminiAIService;
  private knowledgeBase: KnowledgeEntry[] = [];
  private tfidf: TfIdf;

  constructor() {
    this.gemini = new GeminiAIService();
    this.tfidf = new TfIdf();
    this.initializeKnowledgeBase();
  }

  private initializeKnowledgeBase(): void {
    // Initialize with product and outreach information
    this.knowledgeBase = [
      {
        id: 'product-info',
        text: `Product: ${config.rag.productName}. This is an email management and automation tool.`,
        metadata: { type: 'product' }
      },
      {
        id: 'outreach-agenda',
        text: config.rag.outreachAgenda,
        metadata: { type: 'agenda' }
      },
      {
        id: 'template-interested',
        text: 'When someone shows interest, thank them warmly and provide the meeting booking link. Express enthusiasm about discussing further.',
        metadata: { type: 'template', category: 'interested' }
      },
      {
        id: 'template-meeting',
        text: 'For meeting requests, share your calendar link and suggest available time slots. Be flexible and accommodating.',
        metadata: { type: 'template', category: 'meeting' }
      },
      {
        id: 'template-followup',
        text: 'For follow-ups, be polite and reference the previous conversation. Ask if they need any additional information.',
        metadata: { type: 'template', category: 'followup' }
      },
      {
        id: 'template-interview',
        text: 'For interview-related emails, express enthusiasm about the opportunity. Share your availability and confirm your interest in the position.',
        metadata: { type: 'template', category: 'interview' }
      },
      {
        id: 'meeting-link',
        text: 'Include meeting booking link: https://cal.com/example when someone is interested in scheduling a call or meeting.',
        metadata: { type: 'agenda' }
      }
    ];
  }

  async initialize(): Promise<void> {
    try {
      // Add all knowledge entries to TF-IDF
      for (const entry of this.knowledgeBase) {
        this.tfidf.addDocument(entry.text);
      }
      
      logger.info('TF-IDF RAG service initialized (free, no API costs)');
    } catch (error) {
      logger.error('Error initializing TF-IDF RAG service:', error);
      throw error;
    }
  }

  async suggestReply(email: Email): Promise<SuggestedReply> {
    try {
      // Find relevant context using TF-IDF similarity
      const context = this.searchContext(email);
      
      // Generate reply using Gemini
      const suggestion = await this.generateReply(email, context);
      
      // Calculate confidence based on TF-IDF scores
      const confidence = this.calculateConfidence(context);

      return {
        emailId: email.id,
        suggestion,
        confidence,
        context: context.map(entry => entry.text)
      };
    } catch (error) {
      logger.error('Error suggesting reply:', error);
      
      // Fallback to template-based reply
      const fallbackReply = this.generateFallbackReply(email);
      return {
        emailId: email.id,
        suggestion: fallbackReply,
        confidence: 0.5,
        context: ['Using template-based fallback']
      };
    }
  }

  private searchContext(email: Email, topK: number = 3): Array<KnowledgeEntry & { score: number }> {
    const query = `${email.subject} ${email.body}`;
    const scores: Array<{ entry: KnowledgeEntry; score: number }> = [];

    // Calculate TF-IDF similarity for each knowledge entry
    this.tfidf.tfidfs(query, (i, measure) => {
      if (i < this.knowledgeBase.length) {
        scores.push({
          entry: this.knowledgeBase[i],
          score: measure
        });
      }
    });

    // Sort by score and return top K
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(item => ({ ...item.entry, score: item.score }));
  }

  private calculateConfidence(context: Array<{ score: number }>): number {
    if (context.length === 0) return 0.3;
    
    // Use the highest TF-IDF score as confidence
    const maxScore = Math.max(...context.map(c => c.score));
    
    // Normalize to 0-1 range (TF-IDF scores are typically 0-10)
    const normalized = Math.min(maxScore / 10, 1);
    
    // Ensure minimum confidence of 0.5 if we have context
    return Math.max(normalized, 0.5);
  }

  private async generateReply(email: Email, context: Array<KnowledgeEntry & { score: number }>): Promise<string> {
    try {
      const contextText = context
        .filter(c => c.score > 0)
        .map(entry => entry.text)
        .join('\n\n');
      
      // If no relevant context found, use generic guidance
      if (context.length === 0 || context[0].score === 0) {
        return await this.gemini.generateReply(email, 
          'Generate a professional, polite reply acknowledging the email and offering assistance.');
      }
      
      return await this.gemini.generateReply(email, contextText);
    } catch (error) {
      logger.error('Error generating reply with Gemini:', error);
      
      // Fallback to template-based reply
      return this.generateFallbackReply(email);
    }
  }

  private generateFallbackReply(email: Email): string {
    const subject = email.subject.toLowerCase();
    const body = email.body.toLowerCase();
    
    // Check for interested keywords
    if (body.includes('interested') || body.includes('sounds good') || body.includes('let\'s talk')) {
      return `Thank you for your interest! I'm excited to discuss this further with you.\n\nYou can book a time that works best for you here: https://cal.com/example\n\nLooking forward to our conversation!\n\nBest regards`;
    }
    
    // Check for meeting keywords
    if (body.includes('meeting') || body.includes('schedule') || body.includes('call')) {
      return `Thank you for reaching out! I'd be happy to schedule a meeting.\n\nPlease feel free to book a convenient time slot here: https://cal.com/example\n\nLooking forward to connecting!\n\nBest regards`;
    }
    
    // Check for interview keywords
    if (subject.includes('interview') || body.includes('interview')) {
      return `Thank you for considering my application! I'm very interested in this opportunity and would love to schedule an interview.\n\nI'm available at your convenience. Please let me know what times work best for you, or feel free to book directly: https://cal.com/example\n\nLooking forward to speaking with you!\n\nBest regards`;
    }
    
    // Generic professional reply
    return `Thank you for your email. I appreciate you reaching out.\n\nI'd be happy to discuss this further. Please let me know how I can assist you.\n\nBest regards`;
  }

  addKnowledge(text: string, metadata: { type: 'product' | 'agenda' | 'template'; category?: string }): void {
    const entry: KnowledgeEntry = {
      id: `custom-${Date.now()}`,
      text,
      metadata
    };
    
    this.knowledgeBase.push(entry);
    this.tfidf.addDocument(text);
    
    logger.info('Added new knowledge entry to TF-IDF RAG');
  }

  getKnowledgeBase(): KnowledgeEntry[] {
    return this.knowledgeBase;
  }
}
