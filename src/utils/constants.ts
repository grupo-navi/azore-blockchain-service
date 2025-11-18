/**
 * Constantes do Azore Blockchain Service
 */

/**
 * Roles para contratos com AccessControl
 * Baseado no padrão OpenZeppelin AccessControl
 */
export const ROLES = {
  DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
  MINTER_ROLE: '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6',
  BURNER_ROLE: '0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848',
  TRANSFER_ROLE: '0x8502233096d909befbda0999bb8ea2f3a6be3c138b9fbf003752a4c8bce86f6c',
} as const;

/**
 * Mapeamento de nomes de roles para hashes
 */
export const ROLE_NAMES: Record<string, string> = {
  admin: ROLES.DEFAULT_ADMIN_ROLE,
  minter: ROLES.MINTER_ROLE,
  burner: ROLES.BURNER_ROLE,
  transfer: ROLES.TRANSFER_ROLE,
};

/**
 * Configurações padrão para transações
 */
export const TRANSACTION_DEFAULTS = {
  GAS_LIMIT: 200000,
  CONFIRMATIONS: 3,
  TIMEOUT: 300000, // 5 minutos
  NATIVE_TRANSFER_GAS: 21000,
} as const;

/**
 * Configurações de retry
 */
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 1000, // 1 segundo
  MAX_DELAY: 10000, // 10 segundos
  MULTIPLIER: 2,
} as const;

/**
 * Eventos comuns de contratos ERC20
 */
export const ERC20_EVENTS = {
  TRANSFER: 'Transfer',
  APPROVAL: 'Approval',
} as const;

/**
 * Eventos comuns de contratos ERC721
 */
export const ERC721_EVENTS = {
  TRANSFER: 'Transfer',
  APPROVAL: 'Approval',
  APPROVAL_FOR_ALL: 'ApprovalForAll',
} as const;

/**
 * Status de transações
 */
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
} as const;

/**
 * Tipos de webhooks
 */
export const WEBHOOK_EVENTS = {
  TRANSACTION_PENDING: 'transaction.pending',
  TRANSACTION_CONFIRMED: 'transaction.confirmed',
  TRANSACTION_FAILED: 'transaction.failed',
  TRANSFER_TOKEN: 'transfer.token',
  CONTRACT_EVENT: 'contract.event',
  BLOCK_NEW: 'block.new',
} as const;

/**
 * Erros comuns
 */
export const ERROR_MESSAGES = {
  INVALID_ADDRESS: 'Invalid Ethereum address',
  INVALID_PRIVATE_KEY: 'Invalid private key',
  INVALID_NETWORK: 'Invalid network',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  TRANSACTION_FAILED: 'Transaction failed',
  CONTRACT_NOT_FOUND: 'Contract not found',
  FUNCTION_NOT_FOUND: 'Function not found in contract',
  PROVIDER_ERROR: 'Provider connection error',
} as const;

/**
 * Regex patterns
 */
export const PATTERNS = {
  ETHEREUM_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  TRANSACTION_HASH: /^0x[a-fA-F0-9]{64}$/,
  PRIVATE_KEY: /^(0x)?[a-fA-F0-9]{64}$/,
} as const;

/**
 * Cache TTLs (em milissegundos)
 */
export const CACHE_TTL = {
  DEFAULT: 60000, // 1 minuto
  BALANCE: 30000, // 30 segundos
  TOKEN_INFO: 300000, // 5 minutos
  BLOCK_INFO: 60000, // 1 minuto
  TRANSACTION: 300000, // 5 minutos
  GAS_PRICE: 10000, // 10 segundos
  TOKEN_LIST: 60000, // 1 minuto
  CONTRACT_CODE: 3600000, // 1 hora
  HOLDERS: 120000, // 2 minutos
} as const;

/**
 * Limites de API
 */
export const API_LIMITS = {
  MAX_BATCH_SIZE: 100,
  MAX_BLOCK_RANGE: 10000,
  RATE_LIMIT_WINDOW: 60000, // 1 minuto
  RATE_LIMIT_MAX_REQUESTS: 100,
} as const;
