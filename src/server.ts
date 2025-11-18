/**
 * Server Entry Point
 */

import { startServer } from './api';
import { env, validateConfig } from './config/env';
import { logger } from './utils/logger';

// Validate configuration
try {
  validateConfig();
} catch (error: any) {
  logger.error('Configuration validation failed:', { error: error.message });
  process.exit(1);
}

// Start server
const port = parseInt(process.env.PORT || '3000', 10);
startServer(port);
