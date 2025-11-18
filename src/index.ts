/**
 * Azore Blockchain Service
 * Microserviço para integração com a blockchain Azore
 */

// Core
export { providerManager, ProviderManager } from './core/provider';

// Config
export { NETWORKS, getNetworkConfig, getDefaultNetwork, isValidNetwork } from './config/networks';
export { env, validateConfig } from './config/env';
export { ABIS, getABI, isSupportedContractType, getSupportedContractTypes } from './config/abis';

// Services
export { blockchainService, BlockchainService } from './services/blockchain/blockchain.service';
export { azoreScanService, AzoreScanService } from './services/explorer/azorescan.service';
export { walletService, WalletService } from './services/wallet/wallet.service';
export { transactionService, TransactionService } from './services/transaction/transaction.service';
export { tokenService, TokenService } from './services/token/token.service';
export { contractService, ContractService } from './services/contract/contract.service';

// Utils
export * from './utils';
export { logger } from './utils/logger';
export * from './utils/constants';

// Types
export * from './types';

// API
export { createApp, startServer } from './api';

// SDK
export { AzoreClient, createAzoreClient } from './sdk';

// Webhooks
export { webhookManager, WebhookManager, WEBHOOK_EVENTS } from './webhooks';
