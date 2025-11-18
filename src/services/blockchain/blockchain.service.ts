/**
 * Blockchain Service
 * Serviço principal para operações na blockchain Azore
 * Adaptado de services-externos/blockchain.service.js
 */

import { ethers } from 'ethers';
import { providerManager } from '../../core/provider';
import { Network, BalanceInfo, TransactionInfo, BlockInfo, GasInfo } from '../../types';
import { logger } from '../../utils/logger';
import {
  isValidAddress,
  ethToWei,
  weiToEth,
  toWei,
  fromWei,
  normalizeAddress,
} from '../../utils';
import { ERROR_MESSAGES } from '../../utils/constants';

export class BlockchainService {
  /**
   * Testa a conexão com a blockchain
   */
  async testConnection(network?: Network): Promise<{
    success: boolean;
    chainId?: number;
    blockNumber?: number;
    error?: string;
  }> {
    try {
      return await providerManager.testConnection(network);
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtém informações da rede atual
   */
  getNetworkInfo(network?: Network) {
    return providerManager.getNetworkInfo(network);
  }

  /**
   * Obtém o saldo nativo (AZE) de um endereço
   */
  async getBalance(address: string, network?: Network): Promise<BalanceInfo> {
    try {
      if (!isValidAddress(address)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      const balanceWei = await providerManager.getBalance(address, network);
      const balanceEth = weiToEth(balanceWei);
      const networkInfo = this.getNetworkInfo(network);

      return {
        address: normalizeAddress(address),
        balanceWei: balanceWei.toString(),
        balanceEth,
        network: networkInfo.name.includes('testnet') ? 'testnet' : 'mainnet',
      };
    } catch (error: any) {
      logger.error(`Error getting balance for ${address}:`, { error: error.message });
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  /**
   * Obtém o saldo de um token ERC-20
   */
  async getTokenBalance(
    userAddress: string,
    tokenAddress: string,
    tokenABI: any[],
    network?: Network
  ): Promise<{
    contractAddress: string;
    tokenName: string;
    tokenSymbol: string;
    tokenDecimals: number;
    balanceWei: string;
    balanceEth: string;
    userAddress: string;
    network: Network;
  }> {
    try {
      if (!isValidAddress(userAddress)) {
        throw new Error('Invalid user address');
      }
      if (!isValidAddress(tokenAddress)) {
        throw new Error('Invalid token address');
      }

      const provider = providerManager.getProvider(network);
      const contract = new ethers.Contract(tokenAddress, tokenABI, provider);

      const [balance, decimals, name, symbol] = await Promise.all([
        contract.balanceOf(userAddress),
        contract.decimals(),
        contract.name(),
        contract.symbol(),
      ]);

      const balanceFormatted = fromWei(balance, Number(decimals));
      const networkInfo = this.getNetworkInfo(network);

      return {
        contractAddress: normalizeAddress(tokenAddress),
        tokenName: name,
        tokenSymbol: symbol,
        tokenDecimals: Number(decimals),
        balanceWei: balance.toString(),
        balanceEth: balanceFormatted,
        userAddress: normalizeAddress(userAddress),
        network: networkInfo.name.includes('testnet') ? 'testnet' : 'mainnet',
      };
    } catch (error: any) {
      logger.error(`Error getting token balance:`, { error: error.message });
      throw new Error(`Failed to get token balance: ${error.message}`);
    }
  }

  /**
   * Obtém informações de um bloco
   */
  async getBlock(blockNumber?: number | string, network?: Network): Promise<BlockInfo | null> {
    try {
      const block = await providerManager.getBlock(blockNumber || 'latest', network);

      if (!block) {
        return null;
      }

      const networkInfo = this.getNetworkInfo(network);

      return {
        number: block.number,
        hash: block.hash || '',
        timestamp: block.timestamp,
        transactions: block.transactions.length,
        gasLimit: block.gasLimit.toString(),
        gasUsed: block.gasUsed.toString(),
        miner: block.miner || '',
        difficulty: block.difficulty?.toString(),
        network: networkInfo.name.includes('testnet') ? 'testnet' : 'mainnet',
      };
    } catch (error: any) {
      logger.error(`Error getting block:`, { error: error.message });
      throw new Error(`Failed to get block: ${error.message}`);
    }
  }

  /**
   * Obtém informações de uma transação
   */
  async getTransaction(txHash: string, network?: Network): Promise<TransactionInfo | null> {
    try {
      const provider = providerManager.getProvider(network);
      const tx = await provider.getTransaction(txHash);

      if (!tx) {
        return null;
      }

      const receipt = await provider.getTransactionReceipt(txHash);
      const networkInfo = this.getNetworkInfo(network);

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to || '',
        value: tx.value.toString(),
        valueEth: weiToEth(tx.value),
        gasPrice: tx.gasPrice?.toString() || '0',
        gasLimit: tx.gasLimit.toString(),
        nonce: tx.nonce,
        data: tx.data,
        blockNumber: tx.blockNumber || null,
        confirmations: await tx.confirmations(),
        status: receipt ? (receipt.status === 1 ? 'success' : 'failed') : 'pending',
        gasUsed: receipt?.gasUsed.toString(),
        effectiveGasPrice: receipt?.gasPrice?.toString(),
        network: networkInfo.name.includes('testnet') ? 'testnet' : 'mainnet',
      };
    } catch (error: any) {
      logger.error(`Error getting transaction:`, { error: error.message });
      throw new Error(`Failed to get transaction: ${error.message}`);
    }
  }

  /**
   * Obtém o preço atual do gás
   */
  async getGasPrice(network?: Network): Promise<GasInfo> {
    try {
      const feeData = await providerManager.getFeeData(network);
      const networkInfo = this.getNetworkInfo(network);

      return {
        gasPriceWei: feeData.gasPrice?.toString() || '0',
        gasPriceGwei: feeData.gasPrice ? fromWei(feeData.gasPrice, 9) : '0',
        maxFeePerGas: feeData.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
        network: networkInfo.name.includes('testnet') ? 'testnet' : 'mainnet',
      };
    } catch (error: any) {
      logger.error(`Error getting gas price:`, { error: error.message });
      throw new Error(`Failed to get gas price: ${error.message}`);
    }
  }

  /**
   * Obtém informações da rede da blockchain
   */
  async getNetwork(network?: Network): Promise<{
    name: string;
    chainId: number;
    network: Network;
  }> {
    try {
      const provider = providerManager.getProvider(network);
      const networkInfo = await provider.getNetwork();

      return {
        name: networkInfo.name,
        chainId: Number(networkInfo.chainId),
        network: network || providerManager.getDefaultNetwork(),
      };
    } catch (error: any) {
      logger.error(`Error getting network info:`, { error: error.message });
      throw new Error(`Failed to get network info: ${error.message}`);
    }
  }

  /**
   * Valida se um endereço é válido
   */
  isValidAddress(address: string): boolean {
    return isValidAddress(address);
  }

  /**
   * Converte ETH para Wei
   */
  ethToWei(ethValue: string | number): bigint {
    return ethToWei(ethValue);
  }

  /**
   * Converte Wei para ETH
   */
  weiToEth(weiValue: string | bigint): string {
    return weiToEth(weiValue);
  }

  /**
   * Converte valor para Wei considerando decimals
   */
  toWei(value: string | number, decimals: number = 18): bigint {
    return toWei(value, decimals);
  }

  /**
   * Converte Wei para valor considerando decimals
   */
  fromWei(value: string | bigint, decimals: number = 18): string {
    return fromWei(value, decimals);
  }

  /**
   * Envia tokens nativos (AZE) de uma carteira para outra
   */
  async sendNativeToken(
    fromPrivateKey: string,
    toAddress: string,
    amount: string,
    network?: Network
  ): Promise<{
    transactionHash: string;
    blockNumber: number;
    gasUsed: string;
    status: 'success' | 'failed';
    from: string;
    to: string;
    value: string;
    valueWei: string;
    network: Network;
  }> {
    try {
      if (!isValidAddress(toAddress)) {
        throw new Error('Invalid destination address');
      }

      const signer = providerManager.getSigner(fromPrivateKey, network);
      const valueInWei = ethToWei(amount);

      logger.info(`Sending ${amount} native tokens to ${toAddress}`);

      const tx = await signer.sendTransaction({
        to: toAddress,
        value: valueInWei,
      });

      logger.info(`Transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      logger.info(`Transaction confirmed at block ${receipt.blockNumber}`);

      const networkInfo = this.getNetworkInfo(network);

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'success' : 'failed',
        from: await signer.getAddress(),
        to: toAddress,
        value: amount,
        valueWei: valueInWei.toString(),
        network: networkInfo.name.includes('testnet') ? 'testnet' : 'mainnet',
      };
    } catch (error: any) {
      logger.error(`Error sending native tokens:`, { error: error.message });
      throw new Error(`Failed to send native tokens: ${error.message}`);
    }
  }

  /**
   * Executa uma função em um contrato inteligente (read-only)
   */
  async callContractFunction(
    contractAddress: string,
    abi: any[],
    functionName: string,
    params: any[] = [],
    network?: Network
  ): Promise<any> {
    try {
      if (!isValidAddress(contractAddress)) {
        throw new Error('Invalid contract address');
      }

      const provider = providerManager.getProvider(network);
      const contract = new ethers.Contract(contractAddress, abi, provider);

      if (!contract[functionName]) {
        throw new Error(`Function ${functionName} not found in contract`);
      }

      logger.debug(`Calling ${functionName} on ${contractAddress}`, { params });

      const result = await contract[functionName](...params);

      return result;
    } catch (error: any) {
      logger.error(`Error calling contract function:`, { error: error.message });
      throw new Error(`Failed to call contract function: ${error.message}`);
    }
  }

  /**
   * Executa uma transação em um contrato inteligente (write)
   */
  async executeContractFunction(
    contractAddress: string,
    abi: any[],
    functionName: string,
    params: any[] = [],
    privateKey: string,
    network?: Network,
    options: {
      gasLimit?: number;
      gasPrice?: string;
      value?: string;
    } = {}
  ): Promise<{
    transactionHash: string;
    blockNumber: number;
    gasUsed: string;
    status: 'success' | 'failed';
    from: string;
    to: string;
    network: Network;
  }> {
    try {
      if (!isValidAddress(contractAddress)) {
        throw new Error('Invalid contract address');
      }

      const signer = providerManager.getSigner(privateKey, network);
      const contract = new ethers.Contract(contractAddress, abi, signer);

      if (!contract[functionName]) {
        throw new Error(`Function ${functionName} not found in contract`);
      }

      logger.info(`Executing ${functionName} on ${contractAddress}`, { params });

      const txOptions: any = {};
      if (options.gasLimit) txOptions.gasLimit = options.gasLimit;
      if (options.gasPrice) txOptions.gasPrice = toWei(options.gasPrice, 9); // Gwei to Wei
      if (options.value) txOptions.value = ethToWei(options.value);

      const tx = await contract[functionName](...params, txOptions);

      logger.info(`Transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      logger.info(`Transaction confirmed at block ${receipt.blockNumber}`);

      const networkInfo = this.getNetworkInfo(network);

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'success' : 'failed',
        from: await signer.getAddress(),
        to: contractAddress,
        network: networkInfo.name.includes('testnet') ? 'testnet' : 'mainnet',
      };
    } catch (error: any) {
      logger.error(`Error executing contract function:`, { error: error.message });
      throw new Error(`Failed to execute contract function: ${error.message}`);
    }
  }

  /**
   * Estima o gas necessário para uma transação
   */
  async estimateGas(
    to: string,
    data: string,
    from?: string,
    value?: string,
    network?: Network
  ): Promise<bigint> {
    try {
      const provider = providerManager.getProvider(network);

      const tx: any = {
        to,
        data,
      };

      if (from) tx.from = from;
      if (value) tx.value = ethToWei(value);

      const gasEstimate = await provider.estimateGas(tx);

      return gasEstimate;
    } catch (error: any) {
      logger.error(`Error estimating gas:`, { error: error.message });
      throw new Error(`Failed to estimate gas: ${error.message}`);
    }
  }
}

// Exportar instância singleton
export const blockchainService = new BlockchainService();
