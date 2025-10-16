import express, { Application } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { config } from './config/config';
import { logger } from './utils/logger';
import { EmailOrchestratorService } from './services/email-orchestrator.service';
import { EmailRoutes } from './routes/email.routes';
import { KnowledgeRoutes } from './routes/knowledge.routes';
import { HealthRoutes } from './routes/health.routes';
import path from 'path';

class Server {
  private app: Application;
  private orchestrator: EmailOrchestratorService;

  constructor() {
    this.app = express();
    this.orchestrator = new EmailOrchestratorService();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    
    // Serve static files from frontend
    this.app.use(express.static(path.join(__dirname, '../frontend/dist')));
  }

  private setupRoutes(): void {
    // API routes
    const emailRoutes = new EmailRoutes(this.orchestrator);
    const knowledgeRoutes = new KnowledgeRoutes(this.orchestrator);
    const healthRoutes = new HealthRoutes(this.orchestrator);

    this.app.use('/api/emails', emailRoutes.router);
    this.app.use('/api/knowledge', knowledgeRoutes.router);
    this.app.use('/api/health', healthRoutes.router);

    // Serve frontend for all other routes
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    });
  }

  async start(): Promise<void> {
    try {
      logger.info('Starting Email Onebox Server...');

      // Initialize orchestrator
      await this.orchestrator.initialize();
      logger.info('Email orchestrator initialized');

      // Start email synchronization
      await this.orchestrator.startSync();
      logger.info('Email synchronization started');

      // Start HTTP server
      const port = config.port;
      this.app.listen(port, () => {
        logger.info(`Server running on port ${port}`);
        logger.info(`API available at http://localhost:${port}/api`);
        logger.info(`Frontend available at http://localhost:${port}`);
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        logger.info('Shutting down gracefully...');
        await this.orchestrator.stop();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        logger.info('Shutting down gracefully...');
        await this.orchestrator.stop();
        process.exit(0);
      });

    } catch (error) {
      logger.error('Error starting server:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new Server();
server.start();
