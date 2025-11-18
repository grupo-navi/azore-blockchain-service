/**
 * Tipos globais do Azore Blockchain Service
 */

/**
 * Redes suportadas
 */
export type Network = 'testnet' | 'mainnet';

/**
 * Configuração de uma rede
 */
export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  explorerApiUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockTime?: number;
  confirmations?: number;
}

/**
 * Configuração do cliente Azore
 */
export interface AzoreClientConfig {
  network?: Network;
  rpcUrl?: string;
  chainId?: number;
  privateKey?: string;
}

/**
 * Informações de saldo
 */
export interface BalanceInfo {
  address: string;
  balanceWei: string;
  balanceEth: string;
  network: Network;
}

/**
 * Informações de saldo de token
 */
export interface TokenBalanceInfo {
  contractAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  balanceWei: string;
  balanceEth: string;
  userAddress: string;
  network: Network;
}

/**
 * Informações completas de saldos
 */
export interface CompleteBalancesInfo {
  address: string;
  network: Network;
  azeBalance: {
    balanceWei: string;
    balanceEth: string;
  };
  tokenBalances: TokenBalanceInfo[];
  balancesTable: Record<string, string>;
  totalTokens: number;
  timestamp: string;
  fromCache: boolean;
}

/**
 * Informações de transação
 */
export interface TransactionInfo {
  hash: string;
  from: string;
  to: string;
  value: string;
  valueEth: string;
  gasPrice: string;
  gasLimit: string;
  nonce: number;
  data: string;
  blockNumber: number | null;
  confirmations: number;
  status: 'pending' | 'success' | 'failed';
  gasUsed?: string;
  effectiveGasPrice?: string;
  network: Network;
}

/**
 * Recibo de transação
 */
export interface TransactionReceipt {
  transactionHash: string;
  blockNumber: number;
  gasUsed: string;
  status: 'success' | 'failed';
  from: string;
  to: string;
  contractAddress?: string;
  network: Network;
}

/**
 * Informações de gas
 */
export interface GasInfo {
  gasPriceWei: string;
  gasPriceGwei: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  network: Network;
}

/**
 * Informações de bloco
 */
export interface BlockInfo {
  number: number;
  hash: string;
  timestamp: number;
  transactions: number;
  gasLimit: string;
  gasUsed: string;
  miner: string;
  difficulty?: string;
  totalDifficulty?: string;
  network: Network;
}

/**
 * Informações de carteira
 */
export interface WalletInfo {
  address: string;
  privateKey: string;
  mnemonic?: string;
}

/**
 * Informações de token
 */
export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: string;
  totalSupply: string;
  network: Network;
}

/**
 * Resultado de operação genérica
 */
export interface OperationResult<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * Opções de transação
 */
export interface TransactionOptions {
  gasLimit?: number | string;
  gasPrice?: string;
  nonce?: number;
  value?: string;
}

/**
 * Parâmetros de deploy de contrato
 */
export interface DeployContractParams {
  abi: any[];
  bytecode: string;
  constructorArgs?: any[];
  options?: TransactionOptions;
}

/**
 * Evento de contrato
 */
export interface ContractEvent {
  transactionHash: string;
  blockNumber: number;
  logIndex: number;
  args: any;
  timestamp: string;
}

/**
 * Configuração de webhook
 */
export interface WebhookConfig {
  url: string;
  events: string[];
  secret?: string;
}

/**
 * Evento de webhook
 */
export interface WebhookEvent {
  event: string;
  data: any;
  timestamp: string;
  network: Network;
}
