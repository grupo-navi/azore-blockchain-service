/**
 * Azore Blockchain SDK Client
 * Client para integração com a API do Azore Blockchain Service
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Network } from '../types';

export interface AzoreClientConfig {
  baseUrl: string;
  network?: Network;
  timeout?: number;
  headers?: Record<string, string>;
}

export class AzoreClient {
  private client: AxiosInstance;
  private network: Network;

  constructor(config: AzoreClientConfig) {
    this.network = config.network || 'testnet';

    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });
  }

  // ========================================
  // Wallet Methods
  // ========================================

  async createWallet() {
    const response = await this.client.post('/api/wallet/create');
    return response.data;
  }

  async createWallets(count: number) {
    const response = await this.client.post('/api/wallet/create-multiple', { count });
    return response.data;
  }

  async importFromPrivateKey(privateKey: string) {
    const response = await this.client.post('/api/wallet/import/private-key', { privateKey });
    return response.data;
  }

  async importFromMnemonic(mnemonic: string, index: number = 0) {
    const response = await this.client.post('/api/wallet/import/mnemonic', { mnemonic, index });
    return response.data;
  }

  async getWalletBalance(address: string) {
    const response = await this.client.get(`/api/wallet/balance/${address}`, {
      params: { network: this.network },
    });
    return response.data;
  }

  async validateAddress(address: string) {
    const response = await this.client.get(`/api/wallet/validate/${address}`);
    return response.data;
  }

  async signMessage(privateKey: string, message: string) {
    const response = await this.client.post('/api/wallet/sign', { privateKey, message });
    return response.data;
  }

  async verifyMessage(message: string, signature: string) {
    const response = await this.client.post('/api/wallet/verify', { message, signature });
    return response.data;
  }

  async generateMnemonic() {
    const response = await this.client.get('/api/wallet/mnemonic/generate');
    return response.data;
  }

  async deriveWallets(mnemonic: string, count: number = 1) {
    const response = await this.client.post('/api/wallet/mnemonic/derive', { mnemonic, count });
    return response.data;
  }

  // ========================================
  // Blockchain Methods
  // ========================================

  async testConnection() {
    const response = await this.client.get('/api/blockchain/connection', {
      params: { network: this.network },
    });
    return response.data;
  }

  async getNetworkInfo() {
    const response = await this.client.get('/api/blockchain/network', {
      params: { network: this.network },
    });
    return response.data;
  }

  async getBalance(address: string) {
    const response = await this.client.get(`/api/blockchain/balance/${address}`, {
      params: { network: this.network },
    });
    return response.data;
  }

  async getGasPrice() {
    const response = await this.client.get('/api/blockchain/gas-price', {
      params: { network: this.network },
    });
    return response.data;
  }

  async getBlock(blockNumber: number | 'latest') {
    const response = await this.client.get(`/api/blockchain/block/${blockNumber}`, {
      params: { network: this.network },
    });
    return response.data;
  }

  // ========================================
  // Token Methods
  // ========================================

  async getTokenInfo(tokenAddress: string) {
    const response = await this.client.get(`/api/token/info/${tokenAddress}`, {
      params: { network: this.network },
    });
    return response.data;
  }

  async getTokenBalance(tokenAddress: string, walletAddress: string) {
    const response = await this.client.get(`/api/token/balance/${tokenAddress}/${walletAddress}`, {
      params: { network: this.network },
    });
    return response.data;
  }

  async transferTokens(
    tokenAddress: string,
    privateKey: string,
    toAddress: string,
    amount: string,
    options?: any
  ) {
    const response = await this.client.post('/api/token/transfer', {
      tokenAddress,
      privateKey,
      toAddress,
      amount,
      options,
      network: this.network,
    });
    return response.data;
  }

  async approveTokens(
    tokenAddress: string,
    privateKey: string,
    spenderAddress: string,
    amount: string,
    options?: any
  ) {
    const response = await this.client.post('/api/token/approve', {
      tokenAddress,
      privateKey,
      spenderAddress,
      amount,
      options,
      network: this.network,
    });
    return response.data;
  }

  async getAllowance(tokenAddress: string, ownerAddress: string, spenderAddress: string) {
    const response = await this.client.get(
      `/api/token/allowance/${tokenAddress}/${ownerAddress}/${spenderAddress}`,
      { params: { network: this.network } }
    );
    return response.data;
  }

  async mintTokens(
    tokenAddress: string,
    privateKey: string,
    toAddress: string,
    amount: string,
    options?: any
  ) {
    const response = await this.client.post('/api/token/mint', {
      tokenAddress,
      privateKey,
      toAddress,
      amount,
      options,
      network: this.network,
    });
    return response.data;
  }

  async burnTokens(tokenAddress: string, privateKey: string, amount: string, options?: any) {
    const response = await this.client.post('/api/token/burn', {
      tokenAddress,
      privateKey,
      amount,
      options,
      network: this.network,
    });
    return response.data;
  }

  // ========================================
  // Transaction Methods
  // ========================================

  async sendTransaction(privateKey: string, to: string, amount: string, options?: any) {
    const response = await this.client.post('/api/transaction/send', {
      privateKey,
      to,
      amount,
      options,
      network: this.network,
    });
    return response.data;
  }

  async getTransaction(txHash: string) {
    const response = await this.client.get(`/api/transaction/${txHash}`, {
      params: { network: this.network },
    });
    return response.data;
  }

  async getTransactionReceipt(txHash: string) {
    const response = await this.client.get(`/api/transaction/${txHash}/receipt`, {
      params: { network: this.network },
    });
    return response.data;
  }

  async waitForTransaction(txHash: string, confirmations?: number, timeout?: number) {
    const response = await this.client.post('/api/transaction/wait', {
      txHash,
      confirmations,
      timeout,
      network: this.network,
    });
    return response.data;
  }

  async estimateGas(to: string, data?: string, from?: string, value?: string) {
    const response = await this.client.post('/api/transaction/gas/estimate', {
      to,
      data,
      from,
      value,
      network: this.network,
    });
    return response.data;
  }

  async getNonce(address: string) {
    const response = await this.client.get(`/api/transaction/nonce/${address}`, {
      params: { network: this.network },
    });
    return response.data;
  }

  // ========================================
  // Contract Methods
  // ========================================

  async deployContract(privateKey: string, abi: any[], bytecode: string, constructorArgs?: any[], options?: any) {
    const response = await this.client.post('/api/contract/deploy', {
      privateKey,
      abi,
      bytecode,
      constructorArgs,
      options,
      network: this.network,
    });
    return response.data;
  }

  async callContract(contractAddress: string, abi: any[], functionName: string, params?: any[]) {
    const response = await this.client.post('/api/contract/call', {
      contractAddress,
      abi,
      functionName,
      params,
      network: this.network,
    });
    return response.data;
  }

  async executeContract(
    contractAddress: string,
    abi: any[],
    functionName: string,
    params: any[],
    privateKey: string,
    options?: any
  ) {
    const response = await this.client.post('/api/contract/execute', {
      contractAddress,
      abi,
      functionName,
      params,
      privateKey,
      options,
      network: this.network,
    });
    return response.data;
  }

  async isContract(address: string) {
    const response = await this.client.get(`/api/contract/is-contract/${address}`, {
      params: { network: this.network },
    });
    return response.data;
  }

  // ========================================
  // Explorer Methods
  // ========================================

  async getCompleteBalances(address: string) {
    const response = await this.client.get(`/api/explorer/balances/${address}`, {
      params: { network: this.network },
    });
    return response.data;
  }

  async getTokenList(address: string) {
    const response = await this.client.get(`/api/explorer/tokens/${address}`, {
      params: { network: this.network },
    });
    return response.data;
  }

  async getAddressTransactions(address: string, page: number = 1, offset: number = 10) {
    const response = await this.client.get(`/api/explorer/transactions/${address}`, {
      params: { network: this.network, page, offset },
    });
    return response.data;
  }

  async getTokenTransfers(address: string, contractAddress?: string, page: number = 1, offset: number = 10) {
    const response = await this.client.get(`/api/explorer/transfers/${address}`, {
      params: { network: this.network, contractAddress, page, offset },
    });
    return response.data;
  }

  async getTokenHolders(contractAddress: string, page: number = 1, offset: number = 10) {
    const response = await this.client.get(`/api/explorer/holders/${contractAddress}`, {
      params: { network: this.network, page, offset },
    });
    return response.data;
  }

  async getContractABI(address: string) {
    const response = await this.client.get(`/api/explorer/contract/${address}/abi`, {
      params: { network: this.network },
    });
    return response.data;
  }

  // ========================================
  // Utility Methods
  // ========================================

  setNetwork(network: Network) {
    this.network = network;
  }

  getNetwork(): Network {
    return this.network;
  }
}

// Factory function
export function createAzoreClient(config: AzoreClientConfig): AzoreClient {
  return new AzoreClient(config);
}
