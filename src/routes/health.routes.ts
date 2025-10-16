import { Router, Request, Response } from 'express';
import { EmailOrchestratorService } from '../services/email-orchestrator.service';
import { logger } from '../utils/logger';

export class HealthRoutes {
  public router: Router;
  private orchestrator: EmailOrchestratorService;

  constructor(orchestrator: EmailOrchestratorService) {
    this.router = Router();
    this.orchestrator = orchestrator;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.get('/', this.getHealth.bind(this));
  }

  private async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.orchestrator.getHealth();
      
      res.json({
        success: true,
        data: health
      });
    } catch (error: any) {
      logger.error('Error in getHealth:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}
