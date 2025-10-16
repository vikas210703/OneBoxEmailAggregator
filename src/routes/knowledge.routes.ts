import { Router, Request, Response } from 'express';
import { EmailOrchestratorService } from '../services/email-orchestrator.service';
import { logger } from '../utils/logger';

export class KnowledgeRoutes {
  public router: Router;
  private orchestrator: EmailOrchestratorService;

  constructor(orchestrator: EmailOrchestratorService) {
    this.router = Router();
    this.orchestrator = orchestrator;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Get knowledge base
    this.router.get('/', this.getKnowledgeBase.bind(this));

    // Add knowledge
    this.router.post('/', this.addKnowledge.bind(this));
  }

  private async getKnowledgeBase(req: Request, res: Response): Promise<void> {
    try {
      const knowledge = this.orchestrator.getKnowledgeBase();
      
      res.json({
        success: true,
        data: knowledge
      });
    } catch (error: any) {
      logger.error('Error in getKnowledgeBase:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  private async addKnowledge(req: Request, res: Response): Promise<void> {
    try {
      const { text, metadata } = req.body;

      if (!text) {
        res.status(400).json({
          success: false,
          error: 'Text is required'
        });
        return;
      }

      await this.orchestrator.addKnowledge(text, metadata || { type: 'custom' });
      
      res.json({
        success: true,
        message: 'Knowledge added successfully'
      });
    } catch (error: any) {
      logger.error('Error in addKnowledge:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}
