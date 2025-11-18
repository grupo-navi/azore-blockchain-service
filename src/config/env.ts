import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Configurações de ambiente do serviço
 */
export const env = {
  // Network
  network: (process.env.NETWORK || process.env.DEFAULT_NETWORK || 'testnet') as 'testnet' | 'mainnet',

  // Testnet
  testnet: {
    rpcUrl: process.env.AZORE_TESTNET_RPC_URL || 'https://rpc-testnet.azore.technology',
    chainId: parseInt(process.env.AZORE_TESTNET_CHAIN_ID || '88001', 10),
    explorerUrl: process.env.AZORE_TESTNET_EXPLORER_URL || 'https://floripa.azorescan.com',
    explorerApiUrl: process.env.AZORE_TESTNET_EXPLORER_API_URL || 'https://floripa.azorescan.com/api',
  },

  // Mainnet
  mainnet: {
    rpcUrl: process.env.AZORE_MAINNET_RPC_URL || 'https://rpc-mainnet.azore.technology',
    chainId: parseInt(process.env.AZORE_MAINNET_CHAIN_ID || '8800', 10),
    explorerUrl: process.env.AZORE_MAINNET_EXPLORER_URL || 'https://azorescan.com',
    explorerApiUrl: process.env.AZORE_MAINNET_EXPLORER_API_URL || 'https://azorescan.com/api',
  },

  // API Server
  api: {
    port: parseInt(process.env.API_PORT || '3000', 10),
    host: process.env.API_HOST || '0.0.0.0',
    prefix: process.env.API_PREFIX || '/api/v1',
    key: process.env.API_KEY,
  },

  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    encryptionKey: process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key-change-this',
    webhookSecret: process.env.WEBHOOK_SECRET || 'your-webhook-secret-key',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    toFile: process.env.LOG_TO_FILE === 'true',
    filePath: process.env.LOG_FILE_PATH || './logs',
  },

  // Blockchain Settings
  blockchain: {
    defaultConfirmations: parseInt(process.env.DEFAULT_CONFIRMATIONS || '3', 10),
    transactionTimeout: parseInt(process.env.TRANSACTION_TIMEOUT || '300', 10) * 1000, // Convert to ms
    defaultGasLimit: parseInt(process.env.DEFAULT_GAS_LIMIT || '200000', 10),
  },

  // Cache
  cache: {
    enabled: process.env.ENABLE_CACHE !== 'false',
    ttl: parseInt(process.env.CACHE_TTL || '300', 10),
  },

  // Webhooks
  webhooks: {
    retryAttempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS || '3', 10),
    retryDelay: parseInt(process.env.WEBHOOK_RETRY_DELAY || '5000', 10),
  },

  // Database (opcional)
  database: {
    url: process.env.DATABASE_URL,
    enabled: process.env.DB_ENABLE === 'true',
  },

  // Monitoring (opcional)
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    enabled: process.env.ENABLE_MONITORING === 'true',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },

  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

/**
 * Valida se as configurações essenciais estão presentes
 */
export function validateConfig(): void {
  const errors: string[] = [];

  // Validar RPC URLs
  if (!env.testnet.rpcUrl) {
    errors.push('AZORE_TESTNET_RPC_URL is not configured');
  }

  if (!env.mainnet.rpcUrl) {
    errors.push('AZORE_MAINNET_RPC_URL is not configured');
  }

  // Validar Chain IDs
  if (isNaN(env.testnet.chainId)) {
    errors.push('AZORE_TESTNET_CHAIN_ID is not a valid number');
  }

  if (isNaN(env.mainnet.chainId)) {
    errors.push('AZORE_MAINNET_CHAIN_ID is not a valid number');
  }

  // Avisar sobre chaves de segurança em produção
  if (env.isProduction) {
    if (env.security.jwtSecret === 'your-super-secret-jwt-key-change-this-in-production') {
      errors.push('JWT_SECRET should be changed in production');
    }

    if (env.security.encryptionKey === 'your-32-character-encryption-key-change-this') {
      errors.push('ENCRYPTION_KEY should be changed in production');
    }
  }

  if (errors.length > 0) {
    console.warn('Configuration warnings:');
    errors.forEach((error) => console.warn(`  - ${error}`));

    if (env.isProduction) {
      throw new Error('Critical configuration errors in production environment');
    }
  }
}

// Exportar configuração padrão
export default env;
