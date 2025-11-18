/**
 * Transaction Service
 * Serviço para gerenciamento de transações na blockchain
 */

import { ethers } from 'ethers';
import { Network, TransactionInfo, TransactionReceipt, GasInfo } from '../../types';
import { logger } from '../../utils/logger';
import { providerManager } from '../../core/provider';
import { isValidAddress, isValidTransactionHash, ethToWei } from '../../utils';
import { ERROR_MESSAGES, TRANSACTION_DEFAULTS } from '../../utils/constants';

export class TransactionService {
  /**
   * Envia uma transação simples
   */
  async sendTransaction(
    privateKey: string,
    to: string,
    value: string,
    network?: Network,
    options: {
      gasLimit?: number;
      gasPrice?: string;
      data?: string;
      nonce?: number;
    } = {}
  ): Promise<TransactionReceipt> {
    try {
      if (!isValidAddress(to)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      logger.info(`Sending transaction to ${to}`);

      const signer = providerManager.getSigner(privateKey, network);
      const valueInWei = ethToWei(value);

      const tx: any = {
        to,
        value: valueInWei,
      };

      if (options.gasLimit) tx.gasLimit = options.gasLimit;
      if (options.gasPrice) tx.gasPrice = ethers.parseUnits(options.gasPrice, 'gwei');
      if (options.data) tx.data = options.data;
      if (options.nonce !== undefined) tx.nonce = options.nonce;

      const transaction = await signer.sendTransaction(tx);

      logger.info(`Transaction sent: ${transaction.hash}`);

      const receipt = await transaction.wait();

      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      logger.info(`Transaction confirmed at block ${receipt.blockNumber}`);

      const networkInfo = providerManager.getNetworkInfo(network);

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'success' : 'failed',
        from: await signer.getAddress(),
        to,
        network: networkInfo.name.includes('testnet') ? 'testnet' : 'mainnet',
      };
    } catch (error: any) {
      logger.error('Error sending transaction:', { error: error.message });
      throw new Error(`Failed to send transaction: ${error.message}`);
    }
  }

  /**
   * Obtém informações de uma transação
   */
  async getTransaction(txHash: string, network?: Network): Promise<TransactionInfo | null> {
    try {
      if (!isValidTransactionHash(txHash)) {
        throw new Error('Invalid transaction hash');
      }

      logger.debug(`Getting transaction: ${txHash}`);

      const provider = providerManager.getProvider(network);
      const tx = await provider.getTransaction(txHash);

      if (!tx) {
        return null;
      }

      const receipt = await provider.getTransactionReceipt(txHash);
      const networkInfo = providerManager.getNetworkInfo(network);

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to || '',
        value: tx.value.toString(),
        valueEth: ethers.formatEther(tx.value),
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
      logger.error('Error getting transaction:', { error: error.message });
      throw new Error(`Failed to get transaction: ${error.message}`);
    }
  }

  /**
   * Obtém o recibo de uma transação
   */
  async getTransactionReceipt(
    txHash: string,
    network?: Network
  ): Promise<TransactionReceipt | null> {
    try {
      if (!isValidTransactionHash(txHash)) {
        throw new Error('Invalid transaction hash');
      }

      logger.debug(`Getting transaction receipt: ${txHash}`);

      const receipt = await providerManager.getTransactionReceipt(txHash, network);

      if (!receipt) {
        return null;
      }

      const networkInfo = providerManager.getNetworkInfo(network);

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'success' : 'failed',
        from: receipt.from,
        to: receipt.to || '',
        contractAddress: receipt.contractAddress || undefined,
        network: networkInfo.name.includes('testnet') ? 'testnet' : 'mainnet',
      };
    } catch (error: any) {
      logger.error('Error getting transaction receipt:', { error: error.message });
      throw new Error(`Failed to get transaction receipt: ${error.message}`);
    }
  }

  /**
   * Aguarda uma transação ser confirmada
   */
  async waitForTransaction(
    txHash: string,
    confirmations?: number,
    network?: Network,
    timeout?: number
  ): Promise<TransactionReceipt | null> {
    try {
      if (!isValidTransactionHash(txHash)) {
        throw new Error('Invalid transaction hash');
      }

      const requiredConfirmations = confirmations || TRANSACTION_DEFAULTS.CONFIRMATIONS;

      logger.info(`Waiting for ${requiredConfirmations} confirmations for tx: ${txHash}`);

      const receipt = await providerManager.waitForTransaction(
        txHash,
        requiredConfirmations,
        network,
        timeout || TRANSACTION_DEFAULTS.TIMEOUT
      );

      if (!receipt) {
        return null;
      }

      logger.info(`Transaction ${txHash} confirmed with ${requiredConfirmations} confirmations`);

      const networkInfo = providerManager.getNetworkInfo(network);

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'success' : 'failed',
        from: receipt.from,
        to: receipt.to || '',
        contractAddress: receipt.contractAddress || undefined,
        network: networkInfo.name.includes('testnet') ? 'testnet' : 'mainnet',
      };
    } catch (error: any) {
      logger.error('Error waiting for transaction:', { error: error.message });
      throw new Error(`Failed to wait for transaction: ${error.message}`);
    }
  }

  /**
   * Obtém o preço atual do gas
   */
  async getGasPrice(network?: Network): Promise<GasInfo> {
    try {
      logger.debug('Getting gas price');

      const feeData = await providerManager.getFeeData(network);
      const networkInfo = providerManager.getNetworkInfo(network);

      return {
        gasPriceWei: feeData.gasPrice?.toString() || '0',
        gasPriceGwei: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : '0',
        maxFeePerGas: feeData.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
        network: networkInfo.name.includes('testnet') ? 'testnet' : 'mainnet',
      };
    } catch (error: any) {
      logger.error('Error getting gas price:', { error: error.message });
      throw new Error(`Failed to get gas price: ${error.message}`);
    }
  }

  /**
   * Estima o gas necessário para uma transação
   */
  async estimateGas(
    to: string,
    data: string = '0x',
    from?: string,
    value?: string,
    network?: Network
  ): Promise<{
    gasLimit: string;
    gasLimitNumber: number;
  }> {
    try {
      logger.debug('Estimating gas');

      const provider = providerManager.getProvider(network);

      const tx: any = {
        to,
        data,
      };

      if (from) tx.from = from;
      if (value) tx.value = ethToWei(value);

      const gasEstimate = await provider.estimateGas(tx);

      return {
        gasLimit: gasEstimate.toString(),
        gasLimitNumber: Number(gasEstimate),
      };
    } catch (error: any) {
      logger.error('Error estimating gas:', { error: error.message });
      throw new Error(`Failed to estimate gas: ${error.message}`);
    }
  }

  /**
   * Obtém o nonce de um endereço
   */
  async getNonce(address: string, network?: Network): Promise<number> {
    try {
      if (!isValidAddress(address)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      logger.debug(`Getting nonce for ${address}`);

      const provider = providerManager.getProvider(network);
      const nonce = await provider.getTransactionCount(address, 'latest');

      return nonce;
    } catch (error: any) {
      logger.error('Error getting nonce:', { error: error.message });
      throw new Error(`Failed to get nonce: ${error.message}`);
    }
  }

  /**
   * Obtém o número de confirmações de uma transação
   */
  async getConfirmations(txHash: string, network?: Network): Promise<number> {
    try {
      if (!isValidTransactionHash(txHash)) {
        throw new Error('Invalid transaction hash');
      }

      logger.debug(`Getting confirmations for ${txHash}`);

      const provider = providerManager.getProvider(network);
      const tx = await provider.getTransaction(txHash);

      if (!tx) {
        return 0;
      }

      return await tx.confirmations();
    } catch (error: any) {
      logger.error('Error getting confirmations:', { error: error.message });
      throw new Error(`Failed to get confirmations: ${error.message}`);
    }
  }

  /**
   * Verifica se uma transação foi minerada
   */
  async isTransactionMined(txHash: string, network?: Network): Promise<boolean> {
    try {
      if (!isValidTransactionHash(txHash)) {
        throw new Error('Invalid transaction hash');
      }

      const receipt = await this.getTransactionReceipt(txHash, network);

      return receipt !== null;
    } catch (error: any) {
      logger.error('Error checking if transaction is mined:', { error: error.message });
      return false;
    }
  }

  /**
   * Cancela uma transação pendente (enviando transação com mesmo nonce e gas price maior)
   */
  async cancelTransaction(
    privateKey: string,
    pendingTxHash: string,
    network?: Network
  ): Promise<TransactionReceipt> {
    try {
      if (!isValidTransactionHash(pendingTxHash)) {
        throw new Error('Invalid transaction hash');
      }

      logger.info(`Attempting to cancel transaction: ${pendingTxHash}`);

      // Obter transação pendente
      const pendingTx = await this.getTransaction(pendingTxHash, network);

      if (!pendingTx) {
        throw new Error('Transaction not found');
      }

      if (pendingTx.blockNumber !== null) {
        throw new Error('Transaction already mined, cannot cancel');
      }

      const signer = providerManager.getSigner(privateKey, network);
      const signerAddress = await signer.getAddress();

      if (pendingTx.from.toLowerCase() !== signerAddress.toLowerCase()) {
        throw new Error('Transaction not sent by this wallet');
      }

      // Enviar transação com mesmo nonce mas gas price maior e value 0 para si mesmo
      const currentGasPrice = BigInt(pendingTx.gasPrice);
      const newGasPrice = (currentGasPrice * 110n) / 100n; // 10% maior

      const cancelTx = await signer.sendTransaction({
        to: signerAddress,
        value: 0,
        nonce: pendingTx.nonce,
        gasPrice: newGasPrice,
        gasLimit: TRANSACTION_DEFAULTS.NATIVE_TRANSFER_GAS,
      });

      logger.info(`Cancel transaction sent: ${cancelTx.hash}`);

      const receipt = await cancelTx.wait();

      if (!receipt) {
        throw new Error('Cancel transaction receipt not found');
      }

      logger.info(`Cancel transaction confirmed at block ${receipt.blockNumber}`);

      const networkInfo = providerManager.getNetworkInfo(network);

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'success' : 'failed',
        from: signerAddress,
        to: signerAddress,
        network: networkInfo.name.includes('testnet') ? 'testnet' : 'mainnet',
      };
    } catch (error: any) {
      logger.error('Error canceling transaction:', { error: error.message });
      throw new Error(`Failed to cancel transaction: ${error.message}`);
    }
  }

  /**
   * Acelera uma transação pendente (enviando transação com mesmo nonce e gas price maior)
   */
  async speedUpTransaction(
    privateKey: string,
    pendingTxHash: string,
    gasPriceMultiplier: number = 1.2, // 20% maior por padrão
    network?: Network
  ): Promise<TransactionReceipt> {
    try {
      if (!isValidTransactionHash(pendingTxHash)) {
        throw new Error('Invalid transaction hash');
      }

      logger.info(`Attempting to speed up transaction: ${pendingTxHash}`);

      // Obter transação pendente
      const pendingTx = await this.getTransaction(pendingTxHash, network);

      if (!pendingTx) {
        throw new Error('Transaction not found');
      }

      if (pendingTx.blockNumber !== null) {
        throw new Error('Transaction already mined, cannot speed up');
      }

      const signer = providerManager.getSigner(privateKey, network);
      const signerAddress = await signer.getAddress();

      if (pendingTx.from.toLowerCase() !== signerAddress.toLowerCase()) {
        throw new Error('Transaction not sent by this wallet');
      }

      // Enviar transação idêntica mas com gas price maior
      const currentGasPrice = BigInt(pendingTx.gasPrice);
      const newGasPrice = (currentGasPrice * BigInt(Math.floor(gasPriceMultiplier * 100))) / 100n;

      const speedUpTx = await signer.sendTransaction({
        to: pendingTx.to,
        value: BigInt(pendingTx.value),
        data: pendingTx.data,
        nonce: pendingTx.nonce,
        gasPrice: newGasPrice,
        gasLimit: BigInt(pendingTx.gasLimit),
      });

      logger.info(`Speed up transaction sent: ${speedUpTx.hash}`);

      const receipt = await speedUpTx.wait();

      if (!receipt) {
        throw new Error('Speed up transaction receipt not found');
      }

      logger.info(`Speed up transaction confirmed at block ${receipt.blockNumber}`);

      const networkInfo = providerManager.getNetworkInfo(network);

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'success' : 'failed',
        from: signerAddress,
        to: pendingTx.to,
        network: networkInfo.name.includes('testnet') ? 'testnet' : 'mainnet',
      };
    } catch (error: any) {
      logger.error('Error speeding up transaction:', { error: error.message });
      throw new Error(`Failed to speed up transaction: ${error.message}`);
    }
  }
}

// Exportar instância singleton
export const transactionService = new TransactionService();
