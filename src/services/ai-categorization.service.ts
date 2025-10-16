import OpenAI from 'openai';
import { config } from '../config/config';
import { Email, EmailCategory } from '../types/email';
import { logger } from '../utils/logger';
import { GeminiAIService } from './gemini-ai.service';

export class AICategorizationService {
  private openai?: OpenAI;
  private gemini?: GeminiAIService;
  private provider: string;

  constructor() {
    this.provider = config.ai.provider;
    
    if (this.provider === 'gemini') {
      this.gemini = new GeminiAIService();
      logger.info('Using Gemini AI for categorization');
    } else {
      this.openai = new OpenAI({
        apiKey: config.ai.openaiKey
      });
      logger.info('Using OpenAI for categorization');
    }
  }

  async categorizeEmail(email: Email): Promise<EmailCategory> {
    try {
      // Use Gemini if configured
      if (this.provider === 'gemini' && this.gemini) {
        return await this.gemini.categorizeEmail(email);
      }
      
      // Otherwise use OpenAI
      if (!this.openai) {
        logger.warn('No AI provider configured');
        return EmailCategory.UNCATEGORIZED;
      }
      
      const prompt = this.buildCategorizationPrompt(email);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an email categorization assistant. Categorize emails into one of these categories:
- Interested: The sender shows interest in your product/service/proposal
- Meeting Booked: The email confirms or schedules a meeting
- Not Interested: The sender declines or shows no interest
- Spam: Promotional, unsolicited, or irrelevant emails
- Out of Office: Automated out-of-office replies

Respond with ONLY the category name, nothing else.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 50
      });

      const category = response.choices[0]?.message?.content?.trim() || 'Uncategorized';
      return this.mapToEmailCategory(category);
    } catch (error: any) {
      if (error?.status === 429) {
        logger.warn('OpenAI quota exceeded. Email categorization disabled.');
      } else {
        logger.error('Error categorizing email with AI:', error);
      }
      return EmailCategory.UNCATEGORIZED;
    }
  }

  async categorizeBatch(emails: Email[]): Promise<Map<string, EmailCategory>> {
    // Use Gemini batch processing if configured
    if (this.provider === 'gemini' && this.gemini) {
      return await this.gemini.categorizeBatch(emails);
    }
    
    const categorizations = new Map<string, EmailCategory>();
    
    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const promises = batch.map(async (email) => {
        const category = await this.categorizeEmail(email);
        categorizations.set(email.id, category);
      });
      
      await Promise.all(promises);
      
      // Small delay to respect rate limits
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return categorizations;
  }

  private buildCategorizationPrompt(email: Email): string {
    return `Subject: ${email.subject}
From: ${email.from.name || email.from.address}
Body: ${email.body.substring(0, 500)}`;
  }

  private mapToEmailCategory(category: string): EmailCategory {
    const normalized = category.toLowerCase().trim();
    
    if (normalized.includes('interested') && !normalized.includes('not')) {
      return EmailCategory.INTERESTED;
    }
    if (normalized.includes('meeting') || normalized.includes('booked')) {
      return EmailCategory.MEETING_BOOKED;
    }
    if (normalized.includes('not interested') || normalized.includes('decline')) {
      return EmailCategory.NOT_INTERESTED;
    }
    if (normalized.includes('spam')) {
      return EmailCategory.SPAM;
    }
    if (normalized.includes('out of office') || normalized.includes('ooo')) {
      return EmailCategory.OUT_OF_OFFICE;
    }
    
    return EmailCategory.UNCATEGORIZED;
  }

  async isInterested(email: Email): Promise<boolean> {
    const category = await this.categorizeEmail(email);
    return category === EmailCategory.INTERESTED;
  }
}
