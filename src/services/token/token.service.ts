/**
 * Token Service
 * Serviço para operações com tokens ERC20
 */

import { ethers } from 'ethers';
import { Network, TokenInfo, TokenBalanceInfo, TransactionReceipt, TransactionOptions } from '../../types';
import { logger } from '../../utils/logger';
import { providerManager } from '../../core/provider';
import { isValidAddress } from '../../utils';
import { ERROR_MESSAGES } from '../../utils/constants';
import { ABIS } from '../../config/abis';

export class TokenService {
  /**
   * Obtém informações de um token ERC20
   */
  async getTokenInfo(tokenAddress: string, network?: Network): Promise<TokenInfo> {
    try {
      if (!isValidAddress(tokenAddress)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      logger.debug(`Getting token info for ${tokenAddress}`);

      const provider = providerManager.getProvider(network);
      const contract = new ethers.Contract(tokenAddress, ABIS.ERC20, provider);

      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply(),
      ]);

      const networkInfo = providerManager.getNetworkInfo(network);

      return {
        address: tokenAddress,
        name,
        symbol,
        decimals: decimals.toString(),
        totalSupply: totalSupply.toString(),
        network: networkInfo.name.includes('testnet') ? 'testnet' : 'mainnet',
      };
    } catch (error: any) {
      logger.error('Error getting token info:', { error: error.message });
      throw new Error(`Failed to get token info: ${error.message}`);
    }
  }

  /**
   * Obtém o saldo de um token para um endereço
   */
  async getBalance(
    tokenAddress: string,
    walletAddress: string,
    network?: Network
  ): Promise<TokenBalanceInfo> {
    try {
      if (!isValidAddress(tokenAddress)) {
        throw new Error('Invalid token address');
      }

      if (!isValidAddress(walletAddress)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      logger.debug(`Getting token balance for ${walletAddress}`);

      const provider = providerManager.getProvider(network);
      const contract = new ethers.Contract(tokenAddress, ABIS.ERC20, provider);

      const [name, symbol, decimals, balance] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.balanceOf(walletAddress),
      ]);

      const networkInfo = providerManager.getNetworkInfo(network);

      return {
        contractAddress: tokenAddress,
        tokenName: name,
        tokenSymbol: symbol,
        tokenDecimals: Number(decimals),
        balanceWei: balance.toString(),
        balanceEth: ethers.formatUnits(balance, decimals),
        userAddress: walletAddress,
        network: networkInfo.name.includes('testnet') ? 'testnet' : 'mainnet',
      };
    } catch (error: any) {
      logger.error('Error getting token balance:', { error: error.message });
      throw new Error(`Failed to get token balance: ${error.message}`);
    }
  }

  /**
   * Transfere tokens ERC20
   */
  async transfer(
    tokenAddress: string,
    fromPrivateKey: string,
    toAddress: string,
    amount: string,
    network?: Network,
    options?: TransactionOptions
  ): Promise<TransactionReceipt> {
    try {
      if (!isValidAddress(tokenAddress)) {
        throw new Error('Invalid token address');
      }

      if (!isValidAddress(toAddress)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      logger.info(`Transferring ${amount} tokens to ${toAddress}`);

      const signer = providerManager.getSigner(fromPrivateKey, network);
      const contract = new ethers.Contract(tokenAddress, ABIS.ERC20, signer);

      // Obter decimals do token
      const decimals = await contract.decimals();
      const amountInWei = ethers.parseUnits(amount, decimals);

      // Preparar transação
      const tx: any = {
        gasLimit: options?.gasLimit,
        gasPrice: options?.gasPrice ? ethers.parseUnits(options.gasPrice, 'gwei') : undefined,
        nonce: options?.nonce,
      };

      // Remover propriedades undefined
      Object.keys(tx).forEach((key) => tx[key] === undefined && delete tx[key]);

      const transaction = await contract.transfer(toAddress, amountInWei, tx);

      logger.info(`Transfer transaction sent: ${transaction.hash}`);

      const receipt = await transaction.wait();

      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      logger.info(`Transfer confirmed at block ${receipt.blockNumber}`);

      const networkInfo = providerManager.getNetworkInfo(network);

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'success' : 'failed',
        from: await signer.getAddress(),
        to: toAddress,
        network: networkInfo.name.includes('testnet') ? 'testnet' : 'mainnet',
      };
    } catch (error: any) {
      logger.error('Error transferring tokens:', { error: error.message });
      throw new Error(`Failed to transfer tokens: ${error.message}`);
    }
  }

  /**
   * Aprova gasto de tokens (allowance)
   */
  async approve(
    tokenAddress: string,
    ownerPrivateKey: string,
    spenderAddress: string,
    amount: string,
    network?: Network,
    options?: TransactionOptions
  ): Promise<TransactionReceipt> {
    try {
      if (!isValidAddress(tokenAddress)) {
        throw new Error('Invalid token address');
      }

      if (!isValidAddress(spenderAddress)) {
        throw new Error('Invalid spender address');
      }

      logger.info(`Approving ${amount} tokens for ${spenderAddress}`);

      const signer = providerManager.getSigner(ownerPrivateKey, network);
      const contract = new ethers.Contract(tokenAddress, ABIS.ERC20, signer);

      // Obter decimals do token
      const decimals = await contract.decimals();
      const amountInWei = ethers.parseUnits(amount, decimals);

      // Preparar transação
      const tx: any = {
        gasLimit: options?.gasLimit,
        gasPrice: options?.gasPrice ? ethers.parseUnits(options.gasPrice, 'gwei') : undefined,
        nonce: options?.nonce,
      };

      // Remover propriedades undefined
      Object.keys(tx).forEach((key) => tx[key] === undefined && delete tx[key]);

      const transaction = await contract.approve(spenderAddress, amountInWei, tx);

      logger.info(`Approval transaction sent: ${transaction.hash}`);

      const receipt = await transaction.wait();

      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      logger.info(`Approval confirmed at block ${receipt.blockNumber}`);

      const networkInfo = providerManager.getNetworkInfo(network);

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'success' : 'failed',
        from: await signer.getAddress(),
        to: spenderAddress,
        network: networkInfo.name.includes('testnet') ? 'testnet' : 'mainnet',
      };
    } catch (error: any) {
      logger.error('Error approving tokens:', { error: error.message });
      throw new Error(`Failed to approve tokens: ${error.message}`);
    }
  }

  /**
   * Obtém o allowance aprovado
   */
  async getAllowance(
    tokenAddress: string,
    ownerAddress: string,
    spenderAddress: string,
    network?: Network
  ): Promise<{ allowanceWei: string; allowanceEth: string }> {
    try {
      if (!isValidAddress(tokenAddress)) {
        throw new Error('Invalid token address');
      }

      if (!isValidAddress(ownerAddress)) {
        throw new Error('Invalid owner address');
      }

      if (!isValidAddress(spenderAddress)) {
        throw new Error('Invalid spender address');
      }

      logger.debug(`Getting allowance for ${spenderAddress} from ${ownerAddress}`);

      const provider = providerManager.getProvider(network);
      const contract = new ethers.Contract(tokenAddress, ABIS.ERC20, provider);

      const [allowance, decimals] = await Promise.all([
        contract.allowance(ownerAddress, spenderAddress),
        contract.decimals(),
      ]);

      return {
        allowanceWei: allowance.toString(),
        allowanceEth: ethers.formatUnits(allowance, decimals),
      };
    } catch (error: any) {
      logger.error('Error getting allowance:', { error: error.message });
      throw new Error(`Failed to get allowance: ${error.message}`);
    }
  }

  /**
   * Faz mint de tokens (requer permissão MINTER_ROLE)
   */
  async mint(
    tokenAddress: string,
    minterPrivateKey: string,
    toAddress: string,
    amount: string,
    network?: Network,
    options?: TransactionOptions
  ): Promise<TransactionReceipt> {
    try {
      if (!isValidAddress(tokenAddress)) {
        throw new Error('Invalid token address');
      }

      if (!isValidAddress(toAddress)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      logger.info(`Minting ${amount} tokens to ${toAddress}`);

      const signer = providerManager.getSigner(minterPrivateKey, network);
      const contract = new ethers.Contract(tokenAddress, ABIS.ERC20, signer);

      // Obter decimals do token
      const decimals = await contract.decimals();
      const amountInWei = ethers.parseUnits(amount, decimals);

      // Preparar transação
      const tx: any = {
        gasLimit: options?.gasLimit,
        gasPrice: options?.gasPrice ? ethers.parseUnits(options.gasPrice, 'gwei') : undefined,
        nonce: options?.nonce,
      };

      // Remover propriedades undefined
      Object.keys(tx).forEach((key) => tx[key] === undefined && delete tx[key]);

      const transaction = await contract.mint(toAddress, amountInWei, tx);

      logger.info(`Mint transaction sent: ${transaction.hash}`);

      const receipt = await transaction.wait();

      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      logger.info(`Mint confirmed at block ${receipt.blockNumber}`);

      const networkInfo = providerManager.getNetworkInfo(network);

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'success' : 'failed',
        from: await signer.getAddress(),
        to: toAddress,
        network: networkInfo.name.includes('testnet') ? 'testnet' : 'mainnet',
      };
    } catch (error: any) {
      logger.error('Error minting tokens:', { error: error.message });
      throw new Error(`Failed to mint tokens: ${error.message}`);
    }
  }

  /**
   * Faz burn de tokens
   */
  async burn(
    tokenAddress: string,
    ownerPrivateKey: string,
    amount: string,
    network?: Network,
    options?: TransactionOptions
  ): Promise<TransactionReceipt> {
    try {
      if (!isValidAddress(tokenAddress)) {
        throw new Error('Invalid token address');
      }

      logger.info(`Burning ${amount} tokens`);

      const signer = providerManager.getSigner(ownerPrivateKey, network);
      const contract = new ethers.Contract(tokenAddress, ABIS.ERC20, signer);

      // Obter decimals do token
      const decimals = await contract.decimals();
      const amountInWei = ethers.parseUnits(amount, decimals);

      // Preparar transação
      const tx: any = {
        gasLimit: options?.gasLimit,
        gasPrice: options?.gasPrice ? ethers.parseUnits(options.gasPrice, 'gwei') : undefined,
        nonce: options?.nonce,
      };

      // Remover propriedades undefined
      Object.keys(tx).forEach((key) => tx[key] === undefined && delete tx[key]);

      const transaction = await contract.burn(amountInWei, tx);

      logger.info(`Burn transaction sent: ${transaction.hash}`);

      const receipt = await transaction.wait();

      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      logger.info(`Burn confirmed at block ${receipt.blockNumber}`);

      const networkInfo = providerManager.getNetworkInfo(network);
      const signerAddress = await signer.getAddress();

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
      logger.error('Error burning tokens:', { error: error.message });
      throw new Error(`Failed to burn tokens: ${error.message}`);
    }
  }

  /**
   * Aumenta o allowance aprovado
   */
  async increaseAllowance(
    tokenAddress: string,
    ownerPrivateKey: string,
    spenderAddress: string,
    addedAmount: string,
    network?: Network,
    options?: TransactionOptions
  ): Promise<TransactionReceipt> {
    try {
      if (!isValidAddress(tokenAddress)) {
        throw new Error('Invalid token address');
      }

      if (!isValidAddress(spenderAddress)) {
        throw new Error('Invalid spender address');
      }

      logger.info(`Increasing allowance by ${addedAmount} for ${spenderAddress}`);

      const signer = providerManager.getSigner(ownerPrivateKey, network);
      const contract = new ethers.Contract(tokenAddress, ABIS.ERC20, signer);

      // Obter decimals do token
      const decimals = await contract.decimals();
      const amountInWei = ethers.parseUnits(addedAmount, decimals);

      // Preparar transação
      const tx: any = {
        gasLimit: options?.gasLimit,
        gasPrice: options?.gasPrice ? ethers.parseUnits(options.gasPrice, 'gwei') : undefined,
        nonce: options?.nonce,
      };

      // Remover propriedades undefined
      Object.keys(tx).forEach((key) => tx[key] === undefined && delete tx[key]);

      const transaction = await contract.increaseAllowance(spenderAddress, amountInWei, tx);

      logger.info(`Increase allowance transaction sent: ${transaction.hash}`);

      const receipt = await transaction.wait();

      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      logger.info(`Increase allowance confirmed at block ${receipt.blockNumber}`);

      const networkInfo = providerManager.getNetworkInfo(network);

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'success' : 'failed',
        from: await signer.getAddress(),
        to: spenderAddress,
        network: networkInfo.name.includes('testnet') ? 'testnet' : 'mainnet',
      };
    } catch (error: any) {
      logger.error('Error increasing allowance:', { error: error.message });
      throw new Error(`Failed to increase allowance: ${error.message}`);
    }
  }

  /**
   * Diminui o allowance aprovado
   */
  async decreaseAllowance(
    tokenAddress: string,
    ownerPrivateKey: string,
    spenderAddress: string,
    subtractedAmount: string,
    network?: Network,
    options?: TransactionOptions
  ): Promise<TransactionReceipt> {
    try {
      if (!isValidAddress(tokenAddress)) {
        throw new Error('Invalid token address');
      }

      if (!isValidAddress(spenderAddress)) {
        throw new Error('Invalid spender address');
      }

      logger.info(`Decreasing allowance by ${subtractedAmount} for ${spenderAddress}`);

      const signer = providerManager.getSigner(ownerPrivateKey, network);
      const contract = new ethers.Contract(tokenAddress, ABIS.ERC20, signer);

      // Obter decimals do token
      const decimals = await contract.decimals();
      const amountInWei = ethers.parseUnits(subtractedAmount, decimals);

      // Preparar transação
      const tx: any = {
        gasLimit: options?.gasLimit,
        gasPrice: options?.gasPrice ? ethers.parseUnits(options.gasPrice, 'gwei') : undefined,
        nonce: options?.nonce,
      };

      // Remover propriedades undefined
      Object.keys(tx).forEach((key) => tx[key] === undefined && delete tx[key]);

      const transaction = await contract.decreaseAllowance(spenderAddress, amountInWei, tx);

      logger.info(`Decrease allowance transaction sent: ${transaction.hash}`);

      const receipt = await transaction.wait();

      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      logger.info(`Decrease allowance confirmed at block ${receipt.blockNumber}`);

      const networkInfo = providerManager.getNetworkInfo(network);

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'success' : 'failed',
        from: await signer.getAddress(),
        to: spenderAddress,
        network: networkInfo.name.includes('testnet') ? 'testnet' : 'mainnet',
      };
    } catch (error: any) {
      logger.error('Error decreasing allowance:', { error: error.message });
      throw new Error(`Failed to decrease allowance: ${error.message}`);
    }
  }

  /**
   * Transfere tokens de uma conta para outra usando allowance (transferFrom)
   */
  async transferFrom(
    tokenAddress: string,
    spenderPrivateKey: string,
    fromAddress: string,
    toAddress: string,
    amount: string,
    network?: Network,
    options?: TransactionOptions
  ): Promise<TransactionReceipt> {
    try {
      if (!isValidAddress(tokenAddress)) {
        throw new Error('Invalid token address');
      }

      if (!isValidAddress(fromAddress)) {
        throw new Error('Invalid from address');
      }

      if (!isValidAddress(toAddress)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      logger.info(`Transferring ${amount} tokens from ${fromAddress} to ${toAddress}`);

      const signer = providerManager.getSigner(spenderPrivateKey, network);
      const contract = new ethers.Contract(tokenAddress, ABIS.ERC20, signer);

      // Obter decimals do token
      const decimals = await contract.decimals();
      const amountInWei = ethers.parseUnits(amount, decimals);

      // Preparar transação
      const tx: any = {
        gasLimit: options?.gasLimit,
        gasPrice: options?.gasPrice ? ethers.parseUnits(options.gasPrice, 'gwei') : undefined,
        nonce: options?.nonce,
      };

      // Remover propriedades undefined
      Object.keys(tx).forEach((key) => tx[key] === undefined && delete tx[key]);

      const transaction = await contract.transferFrom(fromAddress, toAddress, amountInWei, tx);

      logger.info(`TransferFrom transaction sent: ${transaction.hash}`);

      const receipt = await transaction.wait();

      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      logger.info(`TransferFrom confirmed at block ${receipt.blockNumber}`);

      const networkInfo = providerManager.getNetworkInfo(network);

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'success' : 'failed',
        from: fromAddress,
        to: toAddress,
        network: networkInfo.name.includes('testnet') ? 'testnet' : 'mainnet',
      };
    } catch (error: any) {
      logger.error('Error transferring tokens from:', { error: error.message });
      throw new Error(`Failed to transfer tokens from: ${error.message}`);
    }
  }
}

// Exportar instância singleton
export const tokenService = new TokenService();
