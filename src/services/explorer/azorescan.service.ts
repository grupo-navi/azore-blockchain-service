/**
 * AzoreScan Service
 * Serviço para integração com a API do AzoreScan (Explorer da Azore)
 * Adaptado de services-externos/azorescan.service.js
 */

import axios, { AxiosInstance } from 'axios';
import { Network, CompleteBalancesInfo, TokenBalanceInfo } from '../../types';
import { logger } from '../../utils/logger';
import { getNetworkConfig } from '../../config/networks';
import {
  retryWithBackoff,
  cacheManager,
  balanceCacheKey,
  tokenBalanceCacheKey,
  transactionsCacheKey,
  holdersCacheKey,
} from '../../utils';
import { CACHE_TTL } from '../../utils/constants';

export class AzoreScanService {
  private apiUrls: Record<Network, string>;
  private explorerUrls: Record<Network, string>;
  private axiosInstance: AxiosInstance;

  constructor() {
    const testnetConfig = getNetworkConfig('testnet');
    const mainnetConfig = getNetworkConfig('mainnet');

    this.apiUrls = {
      testnet: testnetConfig.explorerApiUrl,
      mainnet: mainnetConfig.explorerApiUrl,
    };

    this.explorerUrls = {
      testnet: testnetConfig.explorerUrl,
      mainnet: mainnetConfig.explorerUrl,
    };

    this.axiosInstance = axios.create({
      timeout: 30000, // 30 segundos
    });
  }

  /**
   * Obtém URL da API para a rede especificada
   */
  getApiUrl(network: Network = 'testnet'): string {
    return this.apiUrls[network];
  }

  /**
   * Obtém URL do explorer para links de visualização
   */
  getExplorerUrl(network: Network = 'testnet'): string {
    return this.explorerUrls[network];
  }

  /**
   * Faz requisição para a API do AzoreScan com retry
   */
  private async makeRequest<T = any>(
    params: Record<string, string>,
    network: Network = 'testnet'
  ): Promise<{
    success: boolean;
    data?: T;
    error?: string;
  }> {
    try {
      const apiUrl = this.getApiUrl(network);

      const response = await retryWithBackoff(async () => {
        return await this.axiosInstance.get(apiUrl, {
          params,
        });
      });

      if (response.data.status === '1' && response.data.message === 'OK') {
        return {
          success: true,
          data: response.data.result,
        };
      } else {
        logger.warn(`AzoreScan returned error: ${response.data.message}`);
        return {
          success: false,
          error: response.data.message || 'Unknown error',
        };
      }
    } catch (error: any) {
      logger.error(`Error querying AzoreScan ${network}:`, { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtém balance nativo (AZE/AZE-t) de um endereço
   */
  async getBalance(
    address: string,
    network: Network = 'testnet',
    useCache: boolean = true
  ): Promise<{
    success: boolean;
    data?: {
      balanceWei: string;
      balanceEth: string;
      address: string;
      network: Network;
      fromCache: boolean;
    };
    error?: string;
  }> {
    try {
      // Check cache
      const cacheKey = balanceCacheKey(address, network);
      if (useCache) {
        const cached = cacheManager.get<any>(cacheKey);
        if (cached) {
          return {
            success: true,
            data: { ...cached, fromCache: true },
          };
        }
      }

      const params = {
        module: 'account',
        action: 'balance',
        address: address,
      };

      const response = await this.makeRequest<string>(params, network);

      if (response.success && response.data) {
        const balanceWei = response.data;
        const balanceEth = (parseFloat(balanceWei) / Math.pow(10, 18)).toString();

        const result = {
          balanceWei,
          balanceEth,
          address,
          network,
          fromCache: false,
        };

        // Store in cache
        cacheManager.set(cacheKey, result, CACHE_TTL.BALANCE);

        return {
          success: true,
          data: result,
        };
      }

      return {
        success: false,
        error: response.error,
      };
    } catch (error: any) {
      logger.error(`Error getting balance from AzoreScan:`, { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtém lista de tokens ERC-20 que um endereço possui
   */
  async getTokenList(
    address: string,
    network: Network = 'testnet'
  ): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      const params = {
        module: 'account',
        action: 'tokenlist',
        address: address,
      };

      const response = await this.makeRequest<any[]>(params, network);

      if (response.success) {
        return response;
      }

      logger.warn(`Error getting token list: ${response.error}`);
      return response;
    } catch (error: any) {
      logger.error(`Error getting token list from AzoreScan:`, { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtém balance de um token específico
   */
  async getTokenBalance(
    contractAddress: string,
    address: string,
    network: Network = 'testnet'
  ): Promise<{
    success: boolean;
    data?: string;
    error?: string;
  }> {
    try {
      const params = {
        module: 'account',
        action: 'tokenbalance',
        contractaddress: contractAddress,
        address: address,
      };

      const response = await this.makeRequest<string>(params, network);

      return response;
    } catch (error: any) {
      logger.error(`Error getting token balance from AzoreScan:`, { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtém informações completas de balances de um endereço
   * OTIMIZADO: Apenas 2 chamadas à API
   * 1. Balance nativo (AZE/AZE-t)
   * 2. Lista de tokens (já inclui os balances!)
   */
  async getCompleteBalances(
    address: string,
    network: Network = 'testnet'
  ): Promise<{
    success: boolean;
    data?: CompleteBalancesInfo;
    error?: string;
  }> {
    try {
      logger.debug(`Getting complete balances for ${address} on ${network}`);

      // 1. Obter balance nativo (AZE/AZE-t)
      const azeBalanceResponse = await this.getBalance(address, network);

      let azeBalance = {
        balanceWei: '0',
        balanceEth: '0.0',
      };

      if (azeBalanceResponse.success && azeBalanceResponse.data) {
        azeBalance = {
          balanceWei: azeBalanceResponse.data.balanceWei,
          balanceEth: azeBalanceResponse.data.balanceEth,
        };
      } else {
        logger.warn(`Error getting AZE balance: ${azeBalanceResponse.error}`);
      }

      // 2. Obter TODOS os tokens em uma única chamada (tokenlist já retorna balances!)
      const tokenListResponse = await this.getTokenList(address, network);

      let tokenBalances: TokenBalanceInfo[] = [];
      const nativeSymbol = network === 'testnet' ? 'AZE-t' : 'AZE';
      let balancesTable: Record<string, string> = { [nativeSymbol]: azeBalance.balanceEth };

      if (tokenListResponse.success && tokenListResponse.data && tokenListResponse.data.length > 0) {
        logger.debug(`Processing ${tokenListResponse.data.length} tokens from list`);

        // 3. Processar tokens (já vêm com balance na resposta!)
        tokenBalances = tokenListResponse.data
          .map((token: any) => {
            try {
              const balanceWei = token.balance || '0';
              const decimals = parseInt(token.decimals) || 18;
              const balanceEth = (parseFloat(balanceWei) / Math.pow(10, decimals)).toString();

              // Adicionar à tabela de balances
              balancesTable[token.symbol] = balanceEth;

              return {
                contractAddress: token.contractAddress,
                tokenName: token.name,
                tokenSymbol: token.symbol,
                tokenDecimals: decimals,
                balanceWei,
                balanceEth,
                userAddress: address,
                network,
              };
            } catch (error: any) {
              logger.error(`Error processing token ${token.symbol}:`, { error: error.message });
              return null;
            }
          })
          .filter((token): token is TokenBalanceInfo => token !== null);
      } else {
        logger.debug(`No ERC-20 tokens found for ${address}`);
      }

      const result: CompleteBalancesInfo = {
        address,
        network,
        azeBalance,
        tokenBalances,
        balancesTable,
        totalTokens: tokenBalances.length + 1, // +1 for native token
        timestamp: new Date().toISOString(),
        fromCache: false,
      };

      logger.debug(
        `Complete balances obtained: ${result.totalTokens} tokens (${tokenBalances.length} ERC-20 + 1 ${nativeSymbol})`
      );

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      logger.error(`Error in getCompleteBalances:`, { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtém transações de um endereço
   */
  async getAddressTransactions(
    address: string,
    network: Network = 'testnet',
    page: number = 1,
    offset: number = 10
  ): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      const params = {
        module: 'account',
        action: 'txlist',
        address: address,
        page: page.toString(),
        offset: offset.toString(),
        sort: 'desc',
      };

      const response = await this.makeRequest<any[]>(params, network);

      return response;
    } catch (error: any) {
      logger.error(`Error getting address transactions:`, { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtém informações de uma transação
   */
  async getTransaction(
    txHash: string,
    network: Network = 'testnet'
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const params = {
        module: 'transaction',
        action: 'gettxinfo',
        txhash: txHash,
      };

      const response = await this.makeRequest<any>(params, network);

      return response;
    } catch (error: any) {
      logger.error(`Error getting transaction info:`, { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtém holders de um token
   */
  async getTokenHolders(
    contractAddress: string,
    network: Network = 'testnet',
    page: number = 1,
    offset: number = 10,
    useCache: boolean = true
  ): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      // Check cache
      const cacheKey = holdersCacheKey(contractAddress, network, page, offset);
      if (useCache) {
        const cached = cacheManager.get<any[]>(cacheKey);
        if (cached) {
          return { success: true, data: cached };
        }
      }

      const params = {
        module: 'token',
        action: 'getTokenHolders',
        contractaddress: contractAddress,
        page: page.toString(),
        offset: offset.toString(),
      };

      const response = await this.makeRequest<any[]>(params, network);

      if (response.success && response.data) {
        cacheManager.set(cacheKey, response.data, CACHE_TTL.HOLDERS);
      }

      return response;
    } catch (error: any) {
      logger.error(`Error getting token holders:`, { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtém transações internas de um endereço
   */
  async getInternalTransactions(
    address: string,
    network: Network = 'testnet',
    page: number = 1,
    offset: number = 10
  ): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      const params = {
        module: 'account',
        action: 'txlistinternal',
        address: address,
        page: page.toString(),
        offset: offset.toString(),
        sort: 'desc',
      };

      const response = await this.makeRequest<any[]>(params, network);

      return response;
    } catch (error: any) {
      logger.error(`Error getting internal transactions:`, { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtém transferências de token ERC-20
   */
  async getTokenTransfers(
    address: string,
    network: Network = 'testnet',
    contractAddress?: string,
    page: number = 1,
    offset: number = 10
  ): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      const params: Record<string, string> = {
        module: 'account',
        action: 'tokentx',
        address: address,
        page: page.toString(),
        offset: offset.toString(),
        sort: 'desc',
      };

      if (contractAddress) {
        params.contractaddress = contractAddress;
      }

      const response = await this.makeRequest<any[]>(params, network);

      return response;
    } catch (error: any) {
      logger.error(`Error getting token transfers:`, { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtém transferências de token ERC-721 (NFT)
   */
  async getNFTTransfers(
    address: string,
    network: Network = 'testnet',
    contractAddress?: string,
    page: number = 1,
    offset: number = 10
  ): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      const params: Record<string, string> = {
        module: 'account',
        action: 'tokennfttx',
        address: address,
        page: page.toString(),
        offset: offset.toString(),
        sort: 'desc',
      };

      if (contractAddress) {
        params.contractaddress = contractAddress;
      }

      const response = await this.makeRequest<any[]>(params, network);

      return response;
    } catch (error: any) {
      logger.error(`Error getting NFT transfers:`, { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtém ABI de um contrato verificado
   */
  async getContractABI(
    contractAddress: string,
    network: Network = 'testnet'
  ): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      const params = {
        module: 'contract',
        action: 'getabi',
        address: contractAddress,
      };

      const response = await this.makeRequest<string>(params, network);

      if (response.success && response.data) {
        try {
          const abi = JSON.parse(response.data);
          return {
            success: true,
            data: abi,
          };
        } catch {
          return {
            success: false,
            error: 'Invalid ABI format',
          };
        }
      }

      return {
        success: false,
        error: response.error || 'Contract not verified',
      };
    } catch (error: any) {
      logger.error(`Error getting contract ABI:`, { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtém código fonte de um contrato verificado
   */
  async getContractSourceCode(
    contractAddress: string,
    network: Network = 'testnet'
  ): Promise<{
    success: boolean;
    data?: {
      SourceCode: string;
      ABI: string;
      ContractName: string;
      CompilerVersion: string;
      OptimizationUsed: string;
      Runs: string;
      ConstructorArguments: string;
      EVMVersion: string;
      Library: string;
      LicenseType: string;
      Proxy: string;
      Implementation: string;
      SwarmSource: string;
    };
    error?: string;
  }> {
    try {
      const params = {
        module: 'contract',
        action: 'getsourcecode',
        address: contractAddress,
      };

      const response = await this.makeRequest<any[]>(params, network);

      if (response.success && response.data && response.data.length > 0) {
        return {
          success: true,
          data: response.data[0],
        };
      }

      return {
        success: false,
        error: response.error || 'Contract not verified',
      };
    } catch (error: any) {
      logger.error(`Error getting contract source code:`, { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtém logs de eventos
   */
  async getLogs(
    contractAddress: string,
    network: Network = 'testnet',
    fromBlock: number = 0,
    toBlock: number | 'latest' = 'latest',
    topic0?: string
  ): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      const params: Record<string, string> = {
        module: 'logs',
        action: 'getLogs',
        address: contractAddress,
        fromBlock: fromBlock.toString(),
        toBlock: toBlock.toString(),
      };

      if (topic0) {
        params.topic0 = topic0;
      }

      const response = await this.makeRequest<any[]>(params, network);

      return response;
    } catch (error: any) {
      logger.error(`Error getting logs:`, { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtém informações de um bloco
   */
  async getBlockByNumber(
    blockNumber: number | 'latest',
    network: Network = 'testnet'
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const params = {
        module: 'block',
        action: 'getblockreward',
        blockno: blockNumber.toString(),
      };

      const response = await this.makeRequest<any>(params, network);

      return response;
    } catch (error: any) {
      logger.error(`Error getting block info:`, { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtém múltiplos balances em uma única chamada
   */
  async getMultiBalance(
    addresses: string[],
    network: Network = 'testnet'
  ): Promise<{
    success: boolean;
    data?: Array<{
      account: string;
      balance: string;
      balanceEth: string;
    }>;
    error?: string;
  }> {
    try {
      if (addresses.length === 0) {
        return { success: true, data: [] };
      }

      if (addresses.length > 20) {
        return {
          success: false,
          error: 'Maximum 20 addresses allowed',
        };
      }

      const params = {
        module: 'account',
        action: 'balancemulti',
        address: addresses.join(','),
      };

      const response = await this.makeRequest<any[]>(params, network);

      if (response.success && response.data) {
        const balances = response.data.map((item: any) => ({
          account: item.account,
          balance: item.balance,
          balanceEth: (parseFloat(item.balance) / Math.pow(10, 18)).toString(),
        }));

        return {
          success: true,
          data: balances,
        };
      }

      return {
        success: false,
        error: response.error,
      };
    } catch (error: any) {
      logger.error(`Error getting multi balance:`, { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtém informações de um token
   */
  async getTokenInfo(
    contractAddress: string,
    network: Network = 'testnet'
  ): Promise<{
    success: boolean;
    data?: {
      name: string;
      symbol: string;
      decimals: string;
      totalSupply: string;
      contractAddress: string;
    };
    error?: string;
  }> {
    try {
      const params = {
        module: 'token',
        action: 'getToken',
        contractaddress: contractAddress,
      };

      const response = await this.makeRequest<any>(params, network);

      if (response.success && response.data) {
        return {
          success: true,
          data: {
            name: response.data.name,
            symbol: response.data.symbol,
            decimals: response.data.decimals,
            totalSupply: response.data.totalSupply,
            contractAddress: response.data.contractAddress || contractAddress,
          },
        };
      }

      return {
        success: false,
        error: response.error,
      };
    } catch (error: any) {
      logger.error(`Error getting token info:`, { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Gera URL do explorer para uma transação
   */
  getTransactionUrl(txHash: string, network: Network = 'testnet'): string {
    return `${this.getExplorerUrl(network)}/tx/${txHash}`;
  }

  /**
   * Gera URL do explorer para um endereço
   */
  getAddressUrl(address: string, network: Network = 'testnet'): string {
    return `${this.getExplorerUrl(network)}/address/${address}`;
  }

  /**
   * Gera URL do explorer para um token
   */
  getTokenUrl(contractAddress: string, network: Network = 'testnet'): string {
    return `${this.getExplorerUrl(network)}/token/${contractAddress}`;
  }

  /**
   * Gera URL do explorer para um bloco
   */
  getBlockUrl(blockNumber: number, network: Network = 'testnet'): string {
    return `${this.getExplorerUrl(network)}/block/${blockNumber}`;
  }

  /**
   * Invalida cache para um endereço
   */
  invalidateAddressCache(address: string, network?: Network): void {
    const pattern = network
      ? `.*:${network}:${address.toLowerCase()}.*`
      : `.*:${address.toLowerCase()}.*`;
    cacheManager.invalidateByPattern(pattern);
    logger.debug(`Cache invalidated for address ${address}`);
  }

  /**
   * Limpa todo o cache do explorer
   */
  clearCache(): void {
    cacheManager.invalidateByPattern('^(balance|tokenBalance|transactions|holders):');
    logger.debug('Explorer cache cleared');
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats(): { size: number; keys: string[] } {
    return cacheManager.getStats();
  }
}

// Exportar instância singleton
export const azoreScanService = new AzoreScanService();
