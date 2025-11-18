/**
 * Cache System
 * Sistema de cache em memória com TTL configurável
 */

import { logger } from './logger';
import { CACHE_TTL } from './constants';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheManager {
  private cache: Map<string, CacheEntry<any>>;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cache = new Map();
    // Limpar cache expirado a cada minuto
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Armazena um valor no cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || CACHE_TTL.DEFAULT,
    };

    this.cache.set(key, entry);
    logger.debug(`Cache set: ${key} (TTL: ${entry.ttl}ms)`);
  }

  /**
   * Obtém um valor do cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      logger.debug(`Cache expired: ${key}`);
      return null;
    }

    logger.debug(`Cache hit: ${key}`);
    return entry.data as T;
  }

  /**
   * Verifica se uma chave existe e não expirou
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Remove um valor do cache
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    if (result) {
      logger.debug(`Cache deleted: ${key}`);
    }
    return result;
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
    logger.debug('Cache cleared');
  }

  /**
   * Remove entradas expiradas
   */
  cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug(`Cache cleanup: ${removed} expired entries removed`);
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats(): {
    size: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Invalida cache por padrão de chave
   */
  invalidateByPattern(pattern: string): number {
    let removed = 0;
    const regex = new RegExp(pattern);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug(`Cache invalidated by pattern "${pattern}": ${removed} entries removed`);
    }

    return removed;
  }

  /**
   * Obtém ou define um valor no cache (útil para cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Verificar cache
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Buscar dados
    const data = await fetcher();

    // Armazenar no cache
    this.set(key, data, ttl);

    return data;
  }

  /**
   * Para o cleanup interval (para testes)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Exportar instância singleton
export const cacheManager = new CacheManager();

/**
 * Gera chave de cache para balance
 */
export function balanceCacheKey(address: string, network: string): string {
  return `balance:${network}:${address.toLowerCase()}`;
}

/**
 * Gera chave de cache para token balance
 */
export function tokenBalanceCacheKey(
  tokenAddress: string,
  walletAddress: string,
  network: string
): string {
  return `tokenBalance:${network}:${tokenAddress.toLowerCase()}:${walletAddress.toLowerCase()}`;
}

/**
 * Gera chave de cache para token info
 */
export function tokenInfoCacheKey(tokenAddress: string, network: string): string {
  return `tokenInfo:${network}:${tokenAddress.toLowerCase()}`;
}

/**
 * Gera chave de cache para transações
 */
export function transactionsCacheKey(
  address: string,
  network: string,
  page: number,
  offset: number
): string {
  return `transactions:${network}:${address.toLowerCase()}:${page}:${offset}`;
}

/**
 * Gera chave de cache para holders
 */
export function holdersCacheKey(
  contractAddress: string,
  network: string,
  page: number,
  offset: number
): string {
  return `holders:${network}:${contractAddress.toLowerCase()}:${page}:${offset}`;
}

/**
 * Gera chave de cache para contract code
 */
export function contractCodeCacheKey(address: string, network: string): string {
  return `contractCode:${network}:${address.toLowerCase()}`;
}

/**
 * Gera chave de cache para gas price
 */
export function gasPriceCacheKey(network: string): string {
  return `gasPrice:${network}`;
}

/**
 * Gera chave de cache para block
 */
export function blockCacheKey(blockNumber: string | number, network: string): string {
  return `block:${network}:${blockNumber}`;
}
