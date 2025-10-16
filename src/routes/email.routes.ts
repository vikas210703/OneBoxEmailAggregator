import { Router, Request, Response } from 'express';
import { EmailOrchestratorService } from '../services/email-orchestrator.service';
import { logger } from '../utils/logger';

export class EmailRoutes {
  public router: Router;
  private orchestrator: EmailOrchestratorService;

  constructor(orchestrator: EmailOrchestratorService) {
    this.router = Router();
    this.orchestrator = orchestrator;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Search emails
    this.router.get('/search', this.searchEmails.bind(this));

    // Categorize all emails
    this.router.post('/categorize-all', this.categorizeAllEmails.bind(this));

    // Get email by ID
    this.router.get('/:id', this.getEmailById.bind(this));

    // Categorize email
    this.router.post('/:id/categorize', this.categorizeEmail.bind(this));

    // Get suggested reply
    this.router.get('/:id/suggest-reply', this.suggestReply.bind(this));

    // Get all emails (with pagination)
    this.router.get('/', this.getAllEmails.bind(this));
  }

  private async searchEmails(req: Request, res: Response): Promise<void> {
    try {
      const { query, account, folder, category, from, size } = req.query;

      const searchQuery: any = {
        query: query as string,
        account: account as string,
        folder: folder as string,
        category: category as any,
        from: from ? parseInt(from as string) : 0,
        size: size ? parseInt(size as string) : 20
      };

      const result = await this.orchestrator.searchEmails(searchQuery);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Error in searchEmails:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  private async getAllEmails(req: Request, res: Response): Promise<void> {
    try {
      const { account, folder, category, from, size } = req.query;

      const searchQuery: any = {
        account: account as string,
        folder: folder as string,
        category: category as any,
        from: from ? parseInt(from as string) : 0,
        size: size ? parseInt(size as string) : 20
      };

      const result = await this.orchestrator.searchEmails(searchQuery);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Error in getAllEmails:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  private async getEmailById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const email = await this.orchestrator.getEmailById(id);

      if (!email) {
        res.status(404).json({
          success: false,
          error: 'Email not found'
        });
        return;
      }

      res.json({
        success: true,
        data: email
      });
    } catch (error: any) {
      logger.error('Error in getEmailById:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  private async categorizeEmail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const category = await this.orchestrator.categorizeEmail(id);

      res.json({
        success: true,
        data: { category }
      });
    } catch (error: any) {
      logger.error('Error in categorizeEmail:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  private async suggestReply(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const suggestion = await this.orchestrator.suggestReply(id);

      res.json({
        success: true,
        data: suggestion
      });
    } catch (error: any) {
      logger.error('Error in suggestReply:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  private async categorizeAllEmails(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Starting bulk categorization of all emails...');
      
      // Get all emails
      const result = await this.orchestrator.searchEmails({ size: 1000 });
      const emails = result.emails;
      
      logger.info(`Categorizing ${emails.length} emails...`);
      
      // Categorize in batches
      let categorized = 0;
      for (const email of emails) {
        try {
          await this.orchestrator.categorizeEmail(email.id);
          categorized++;
          
          if (categorized % 10 === 0) {
            logger.info(`Categorized ${categorized}/${emails.length} emails`);
          }
        } catch (error) {
          logger.error(`Error categorizing email ${email.id}:`, error);
        }
      }

      res.json({
        success: true,
        data: {
          total: emails.length,
          categorized
        }
      });
    } catch (error: any) {
      logger.error('Error in categorizeAllEmails:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}
