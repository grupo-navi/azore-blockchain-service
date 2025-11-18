/**
 * Express Application
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { logger } from '../utils/logger';
import { openApiSpec } from './docs';

// Import routes
import { walletRouter } from './routes/wallet.routes';
import { blockchainRouter } from './routes/blockchain.routes';
import { tokenRouter } from './routes/token.routes';
import { contractRouter } from './routes/contract.routes';
import { explorerRouter } from './routes/explorer.routes';
import { transactionRouter } from './routes/transaction.routes';

// Import middlewares
import { errorHandler } from './middlewares/error.middleware';
import { requestLogger } from './middlewares/logger.middleware';

export function createApp(): Express {
  const app = express();

  // Security middlewares
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allow Swagger UI
    })
  );
  app.use(cors());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Static files (Interactive Tester)
  app.use(express.static(path.join(__dirname, '../../public')));

  // Request logging
  app.use(requestLogger);

  // Health check
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  // API Documentation (Swagger UI)
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin: 20px 0 }
        .swagger-ui .info .title { font-size: 2.5em }
        .swagger-ui .info img { max-width: 200px; margin: 20px 0 }
        .swagger-ui .info hgroup.main { display: flex; align-items: center; gap: 20px }
        .swagger-ui .info hgroup.main a { display: flex; align-items: center }
      `,
      customSiteTitle: 'Azore Blockchain API Docs',
      customfavIcon: '/images/AZE.png',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
      },
    })
  );

  // OpenAPI spec JSON endpoint
  app.get('/openapi.json', (req: Request, res: Response) => {
    res.json(openApiSpec);
  });

  // API routes
  app.use('/api/wallet', walletRouter);
  app.use('/api/blockchain', blockchainRouter);
  app.use('/api/token', tokenRouter);
  app.use('/api/contract', contractRouter);
  app.use('/api/explorer', explorerRouter);
  app.use('/api/transaction', transactionRouter);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: 'Route not found',
      path: req.path,
    });
  });

  // Error handler
  app.use(errorHandler);

  return app;
}

// Start server function
export function startServer(port: number = 3000): void {
  const app = createApp();

  app.listen(port, () => {
    logger.info(`Azore Blockchain Service API running on port ${port}`);
    logger.info(`Interactive Tester: http://localhost:${port}/`);
    logger.info(`API Documentation: http://localhost:${port}/docs`);
    logger.info(`Health check: http://localhost:${port}/health`);
    logger.info(`OpenAPI spec: http://localhost:${port}/openapi.json`);
  });
}
