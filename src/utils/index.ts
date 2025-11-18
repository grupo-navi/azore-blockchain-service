import { ethers } from 'ethers';
import { PATTERNS, ERROR_MESSAGES } from './constants';

// Export cache utilities
export * from './cache';

/**
 * Validação de endereço Ethereum
 */
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

/**
 * Validação de private key
 */
export function isValidPrivateKey(privateKey: string): boolean {
  try {
    new ethers.Wallet(privateKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validação de hash de transação
 */
export function isValidTransactionHash(hash: string): boolean {
  return PATTERNS.TRANSACTION_HASH.test(hash);
}

/**
 * Converte ETH para Wei
 */
export function ethToWei(ethValue: string | number): bigint {
  return ethers.parseEther(ethValue.toString());
}

/**
 * Converte Wei para ETH
 */
export function weiToEth(weiValue: string | bigint): string {
  return ethers.formatEther(weiValue);
}

/**
 * Converte valor para Wei considerando decimals
 */
export function toWei(value: string | number, decimals: number = 18): bigint {
  return ethers.parseUnits(value.toString(), decimals);
}

/**
 * Converte Wei para valor considerando decimals
 */
export function fromWei(value: string | bigint, decimals: number = 18): string {
  return ethers.formatUnits(value, decimals);
}

/**
 * Converte Wei para Gwei
 */
export function weiToGwei(weiValue: string | bigint): string {
  return ethers.formatUnits(weiValue, 'gwei');
}

/**
 * Converte Gwei para Wei
 */
export function gweiToWei(gweiValue: string | number): bigint {
  return ethers.parseUnits(gweiValue.toString(), 'gwei');
}

/**
 * Normaliza endereço para lowercase
 */
export function normalizeAddress(address: string): string {
  if (!isValidAddress(address)) {
    throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
  }
  return address.toLowerCase();
}

/**
 * Converte endereço para checksum format
 */
export function toChecksumAddress(address: string): string {
  if (!isValidAddress(address)) {
    throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
  }
  return ethers.getAddress(address);
}

/**
 * Formata saldo para exibição
 */
export function formatBalance(balance: string | bigint, decimals: number = 18, maxDecimals: number = 4): string {
  const formatted = fromWei(balance, decimals);
  const num = parseFloat(formatted);

  if (num === 0) return '0';

  // Se o número é muito pequeno, mostrar notação científica
  if (num < 0.0001) {
    return num.toExponential(2);
  }

  // Caso contrário, formatar com decimais limitados
  return num.toFixed(maxDecimals).replace(/\.?0+$/, '');
}

/**
 * Adiciona prefixo 0x se não existir
 */
export function add0x(value: string): string {
  return value.startsWith('0x') ? value : `0x${value}`;
}

/**
 * Remove prefixo 0x se existir
 */
export function remove0x(value: string): string {
  return value.startsWith('0x') ? value.slice(2) : value;
}

/**
 * Sleep helper
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry com backoff exponencial
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelay: number = 1000,
  maxDelay: number = 10000,
  multiplier: number = 2
): Promise<T> {
  let attempt = 0;
  let delay = initialDelay;

  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      attempt++;

      if (attempt >= maxAttempts) {
        throw error;
      }

      await sleep(Math.min(delay, maxDelay));
      delay *= multiplier;
    }
  }

  throw new Error('Max retry attempts reached');
}

/**
 * Trunca endereço para exibição
 * @example truncateAddress('0x1234...5678', 6, 4) => '0x1234...5678'
 */
export function truncateAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (!isValidAddress(address)) {
    return address;
  }

  if (address.length <= startChars + endChars) {
    return address;
  }

  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Formata timestamp para data legível
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

/**
 * Calcula porcentagem de mudança
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Valida ABI
 */
export function isValidABI(abi: any): boolean {
  if (!Array.isArray(abi)) return false;
  if (abi.length === 0) return true; // ABI vazio é válido

  return abi.every((item) => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof item.type === 'string'
    );
  });
}

/**
 * Extrai nome da função do ABI
 */
export function extractFunctionNames(abi: any[]): string[] {
  return abi
    .filter((item) => item.type === 'function')
    .map((item) => item.name);
}

/**
 * Extrai nomes de eventos do ABI
 */
export function extractEventNames(abi: any[]): string[] {
  return abi
    .filter((item) => item.type === 'event')
    .map((item) => item.name);
}

/**
 * Cria hash de role a partir do nome
 */
export function getRoleHash(roleName: string): string {
  return ethers.id(roleName);
}

/**
 * Compara dois endereços (case insensitive)
 */
export function isSameAddress(address1: string, address2: string): boolean {
  if (!isValidAddress(address1) || !isValidAddress(address2)) {
    return false;
  }
  return normalizeAddress(address1) === normalizeAddress(address2);
}

/**
 * Sanitiza entrada de usuário
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[^\w\s.-]/gi, '');
}

/**
 * Valida e formata JSON
 */
export function safeJSONParse<T = any>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
}

/**
 * Converte BigInt para string em JSON
 */
export function bigIntToJSON(obj: any): any {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}
