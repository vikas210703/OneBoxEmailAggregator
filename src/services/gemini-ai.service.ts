import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/config';
import { Email, EmailCategory } from '../types/email';
import { logger } from '../utils/logger';

export class GeminiAIService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.ai.geminiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  async categorizeEmail(email: Email): Promise<EmailCategory> {
    try {
      const prompt = this.buildCategorizationPrompt(email);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const category = response.text().trim();
      
      return this.mapToEmailCategory(category);
    } catch (error: any) {
      logger.error('Error categorizing email with Gemini:', error);
      return EmailCategory.UNCATEGORIZED;
    }
  }

  async categorizeBatch(emails: Email[]): Promise<Map<string, EmailCategory>> {
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
    return `You are an email categorization assistant. Categorize the following email into ONE of these categories:
- Interested: The sender shows interest in your product/service/proposal
- Meeting Booked: The email confirms or schedules a meeting
- Not Interested: The sender declines or shows no interest
- Spam: Promotional, unsolicited, or irrelevant emails
- Out of Office: Automated out-of-office replies

Respond with ONLY the category name, nothing else.

Email:
Subject: ${email.subject}
From: ${email.from.name || email.from.address}
Body: ${email.body.substring(0, 500)}

Category:`;
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

  async generateReply(email: Email, context: string): Promise<string> {
    try {
      const prompt = `You are an AI email assistant. Generate a professional, concise reply to the email based on the provided context.

Context:
${context}

Guidelines:
- Be professional and friendly
- Keep the response concise
- If a meeting link is mentioned in the context, include it in the reply
- Match the tone of the incoming email
- Don't make up information not in the context

Email Subject: ${email.subject}
From: ${email.from.name || email.from.address}
Body: ${email.body}

Generate a suitable reply:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      logger.error('Error generating reply with Gemini:', error);
      throw error;
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    try {
      const embeddingModel = this.genAI.getGenerativeModel({ model: 'embedding-001' });
      const result = await embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      logger.error('Error getting embedding from Gemini:', error);
      throw error;
    }
  }
}
