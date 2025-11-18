import { ethers } from 'ethers';
import { Network, NetworkConfig } from '../types';
import { getNetworkConfig, getDefaultNetwork } from '../config/networks';

/**
 * Gerenciador de providers para a blockchain Azore
 */
export class ProviderManager {
  private providers: Map<Network, ethers.JsonRpcProvider>;
  private defaultNetwork: Network;

  constructor() {
    this.providers = new Map();
    this.defaultNetwork = getDefaultNetwork();
  }

  /**
   * Obtém ou cria um provider para uma rede
   * @param network - Rede desejada
   * @returns Provider do ethers.js
   */
  getProvider(network?: Network): ethers.JsonRpcProvider {
    const selectedNetwork = network || this.defaultNetwork;

    // Verificar se já existe um provider em cache
    if (this.providers.has(selectedNetwork)) {
      return this.providers.get(selectedNetwork)!;
    }

    // Criar novo provider
    const config = getNetworkConfig(selectedNetwork);
    const provider = new ethers.JsonRpcProvider(config.rpcUrl, {
      chainId: config.chainId,
      name: config.name,
    });

    // Armazenar em cache
    this.providers.set(selectedNetwork, provider);

    return provider;
  }

  /**
   * Obtém um signer a partir de uma private key
   * @param privateKey - Chave privada
   * @param network - Rede desejada
   * @returns Signer do ethers.js
   */
  getSigner(privateKey: string, network?: Network): ethers.Wallet {
    const provider = this.getProvider(network);
    return new ethers.Wallet(privateKey, provider);
  }

  /**
   * Testa a conexão com uma rede
   * @param network - Rede para testar
   * @returns Informações da rede se conectado
   */
  async testConnection(network?: Network): Promise<{
    success: boolean;
    chainId?: number;
    blockNumber?: number;
    error?: string;
  }> {
    try {
      const provider = this.getProvider(network);
      const [chainId, blockNumber] = await Promise.all([
        provider.getNetwork().then((n) => Number(n.chainId)),
        provider.getBlockNumber(),
      ]);

      return {
        success: true,
        chainId,
        blockNumber,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtém informações da rede configurada
   * @param network - Rede desejada
   * @returns Informações da rede
   */
  getNetworkInfo(network?: Network): NetworkConfig {
    const selectedNetwork = network || this.defaultNetwork;
    return getNetworkConfig(selectedNetwork);
  }

  /**
   * Obtém o saldo de um endereço
   * @param address - Endereço da carteira
   * @param network - Rede para consultar
   * @returns Saldo em Wei
   */
  async getBalance(address: string, network?: Network): Promise<bigint> {
    const provider = this.getProvider(network);
    return await provider.getBalance(address);
  }

  /**
   * Obtém informações de um bloco
   * @param blockNumber - Número do bloco ou 'latest'
   * @param network - Rede para consultar
   * @returns Informações do bloco
   */
  async getBlock(
    blockNumber: number | string = 'latest',
    network?: Network
  ): Promise<ethers.Block | null> {
    const provider = this.getProvider(network);
    return await provider.getBlock(blockNumber);
  }

  /**
   * Obtém informações de uma transação
   * @param txHash - Hash da transação
   * @param network - Rede para consultar
   * @returns Informações da transação
   */
  async getTransaction(
    txHash: string,
    network?: Network
  ): Promise<ethers.TransactionResponse | null> {
    const provider = this.getProvider(network);
    return await provider.getTransaction(txHash);
  }

  /**
   * Obtém o recibo de uma transação
   * @param txHash - Hash da transação
   * @param network - Rede para consultar
   * @returns Recibo da transação
   */
  async getTransactionReceipt(
    txHash: string,
    network?: Network
  ): Promise<ethers.TransactionReceipt | null> {
    const provider = this.getProvider(network);
    return await provider.getTransactionReceipt(txHash);
  }

  /**
   * Obtém o preço atual do gas
   * @param network - Rede para consultar
   * @returns Fee data
   */
  async getFeeData(network?: Network): Promise<ethers.FeeData> {
    const provider = this.getProvider(network);
    return await provider.getFeeData();
  }

  /**
   * Aguarda uma transação ser confirmada
   * @param txHash - Hash da transação
   * @param confirmations - Número de confirmações desejadas
   * @param network - Rede para consultar
   * @param timeout - Timeout em milissegundos
   * @returns Recibo da transação
   */
  async waitForTransaction(
    txHash: string,
    confirmations?: number,
    network?: Network,
    timeout?: number
  ): Promise<ethers.TransactionReceipt | null> {
    const provider = this.getProvider(network);
    const config = this.getNetworkInfo(network);
    const requiredConfirmations = confirmations || config.confirmations || 3;

    return await provider.waitForTransaction(txHash, requiredConfirmations, timeout);
  }

  /**
   * Limpa o cache de providers
   */
  clearCache(): void {
    this.providers.clear();
  }

  /**
   * Define a rede padrão
   * @param network - Nova rede padrão
   */
  setDefaultNetwork(network: Network): void {
    this.defaultNetwork = network;
  }

  /**
   * Obtém a rede padrão atual
   * @returns Rede padrão
   */
  getDefaultNetwork(): Network {
    return this.defaultNetwork;
  }
}

// Exportar instância singleton
export const providerManager = new ProviderManager();
