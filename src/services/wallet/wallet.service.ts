/**
 * Wallet Service
 * Serviço para criação e gerenciamento de carteiras
 */

import { ethers } from 'ethers';
import { WalletInfo, BalanceInfo, Network } from '../../types';
import { logger } from '../../utils/logger';
import { isValidAddress, isValidPrivateKey } from '../../utils';
import { ERROR_MESSAGES } from '../../utils/constants';
import { blockchainService } from '../blockchain/blockchain.service';

export class WalletService {
  /**
   * Cria uma nova carteira
   */
  createWallet(): WalletInfo {
    try {
      logger.info('Creating new wallet');

      const wallet = ethers.Wallet.createRandom();

      const walletInfo: WalletInfo = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic?.phrase,
      };

      logger.info(`Wallet created: ${wallet.address}`);

      return walletInfo;
    } catch (error: any) {
      logger.error('Error creating wallet:', { error: error.message });
      throw new Error(`Failed to create wallet: ${error.message}`);
    }
  }

  /**
   * Cria múltiplas carteiras
   */
  createWallets(count: number): WalletInfo[] {
    try {
      logger.info(`Creating ${count} wallets`);

      const wallets: WalletInfo[] = [];

      for (let i = 0; i < count; i++) {
        wallets.push(this.createWallet());
      }

      logger.info(`${count} wallets created successfully`);

      return wallets;
    } catch (error: any) {
      logger.error('Error creating wallets:', { error: error.message });
      throw new Error(`Failed to create wallets: ${error.message}`);
    }
  }

  /**
   * Importa uma carteira a partir de uma private key
   */
  importFromPrivateKey(privateKey: string): WalletInfo {
    try {
      if (!isValidPrivateKey(privateKey)) {
        throw new Error(ERROR_MESSAGES.INVALID_PRIVATE_KEY);
      }

      logger.info('Importing wallet from private key');

      const wallet = new ethers.Wallet(privateKey);

      const walletInfo: WalletInfo = {
        address: wallet.address,
        privateKey: wallet.privateKey,
      };

      logger.info(`Wallet imported: ${wallet.address}`);

      return walletInfo;
    } catch (error: any) {
      logger.error('Error importing wallet from private key:', { error: error.message });
      throw new Error(`Failed to import wallet: ${error.message}`);
    }
  }

  /**
   * Importa uma carteira a partir de um mnemonic
   */
  importFromMnemonic(mnemonic: string, index: number = 0): WalletInfo {
    try {
      logger.info('Importing wallet from mnemonic');

      // Criar HDNodeWallet a partir do mnemonic
      const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);

      // Derivar o caminho específico se index > 0
      let derivedWallet: ethers.HDNodeWallet;
      if (index > 0) {
        // Derivar caminho completo: m/44'/60'/0'/0/index
        derivedWallet = hdNode.derivePath(`44'/60'/0'/0/${index}`);
      } else {
        // Usar o primeiro endereço diretamente
        derivedWallet = hdNode;
      }

      const walletInfo: WalletInfo = {
        address: derivedWallet.address,
        privateKey: derivedWallet.privateKey,
        mnemonic: mnemonic,
      };

      logger.info(`Wallet imported: ${derivedWallet.address}`);

      return walletInfo;
    } catch (error: any) {
      logger.error('Error importing wallet from mnemonic:', { error: error.message });
      throw new Error(`Failed to import wallet from mnemonic: ${error.message}`);
    }
  }

  /**
   * Importa uma carteira a partir de um JSON criptografado
   */
  async importFromEncryptedJson(json: string, password: string): Promise<WalletInfo> {
    try {
      logger.info('Importing wallet from encrypted JSON');

      const wallet = await ethers.Wallet.fromEncryptedJson(json, password);

      const walletInfo: WalletInfo = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic?.phrase,
      };

      logger.info(`Wallet imported: ${wallet.address}`);

      return walletInfo;
    } catch (error: any) {
      logger.error('Error importing wallet from encrypted JSON:', { error: error.message });
      throw new Error(`Failed to import wallet from encrypted JSON: ${error.message}`);
    }
  }

  /**
   * Exporta uma carteira como JSON criptografado
   */
  async encryptWallet(
    privateKey: string,
    password: string,
    progressCallback?: (progress: number) => void
  ): Promise<string> {
    try {
      if (!isValidPrivateKey(privateKey)) {
        throw new Error(ERROR_MESSAGES.INVALID_PRIVATE_KEY);
      }

      logger.info('Encrypting wallet');

      const wallet = new ethers.Wallet(privateKey);

      const encryptedJson = await wallet.encrypt(password, progressCallback);

      logger.info('Wallet encrypted successfully');

      return encryptedJson;
    } catch (error: any) {
      logger.error('Error encrypting wallet:', { error: error.message });
      throw new Error(`Failed to encrypt wallet: ${error.message}`);
    }
  }

  /**
   * Descriptografa uma carteira
   */
  async decryptWallet(json: string, password: string): Promise<WalletInfo> {
    return await this.importFromEncryptedJson(json, password);
  }

  /**
   * Obtém o saldo de uma carteira (nativo)
   */
  async getBalance(address: string, network?: Network): Promise<BalanceInfo> {
    try {
      if (!isValidAddress(address)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      return await blockchainService.getBalance(address, network);
    } catch (error: any) {
      logger.error('Error getting wallet balance:', { error: error.message });
      throw new Error(`Failed to get wallet balance: ${error.message}`);
    }
  }

  /**
   * Obtém o saldo de um token específico
   */
  async getTokenBalance(
    address: string,
    tokenAddress: string,
    tokenABI: any[],
    network?: Network
  ) {
    try {
      if (!isValidAddress(address)) {
        throw new Error('Invalid wallet address');
      }

      if (!isValidAddress(tokenAddress)) {
        throw new Error('Invalid token address');
      }

      return await blockchainService.getTokenBalance(address, tokenAddress, tokenABI, network);
    } catch (error: any) {
      logger.error('Error getting token balance:', { error: error.message });
      throw new Error(`Failed to get token balance: ${error.message}`);
    }
  }

  /**
   * Valida um endereço
   */
  isValidAddress(address: string): boolean {
    return isValidAddress(address);
  }

  /**
   * Valida uma private key
   */
  isValidPrivateKey(privateKey: string): boolean {
    return isValidPrivateKey(privateKey);
  }

  /**
   * Obtém o endereço a partir de uma private key
   */
  getAddressFromPrivateKey(privateKey: string): string {
    try {
      if (!isValidPrivateKey(privateKey)) {
        throw new Error(ERROR_MESSAGES.INVALID_PRIVATE_KEY);
      }

      const wallet = new ethers.Wallet(privateKey);
      return wallet.address;
    } catch (error: any) {
      logger.error('Error getting address from private key:', { error: error.message });
      throw new Error(`Failed to get address: ${error.message}`);
    }
  }

  /**
   * Assina uma mensagem
   */
  async signMessage(privateKey: string, message: string): Promise<string> {
    try {
      if (!isValidPrivateKey(privateKey)) {
        throw new Error(ERROR_MESSAGES.INVALID_PRIVATE_KEY);
      }

      const wallet = new ethers.Wallet(privateKey);
      const signature = await wallet.signMessage(message);

      logger.debug('Message signed successfully');

      return signature;
    } catch (error: any) {
      logger.error('Error signing message:', { error: error.message });
      throw new Error(`Failed to sign message: ${error.message}`);
    }
  }

  /**
   * Verifica a assinatura de uma mensagem
   */
  verifyMessage(message: string, signature: string): string {
    try {
      const address = ethers.verifyMessage(message, signature);

      logger.debug(`Message verified, signer: ${address}`);

      return address;
    } catch (error: any) {
      logger.error('Error verifying message:', { error: error.message });
      throw new Error(`Failed to verify message: ${error.message}`);
    }
  }

  /**
   * Gera um mnemonic aleatório
   */
  generateMnemonic(): string {
    try {
      const mnemonic = ethers.Wallet.createRandom().mnemonic;

      if (!mnemonic) {
        throw new Error('Failed to generate mnemonic');
      }

      return mnemonic.phrase;
    } catch (error: any) {
      logger.error('Error generating mnemonic:', { error: error.message });
      throw new Error(`Failed to generate mnemonic: ${error.message}`);
    }
  }

  /**
   * Valida um mnemonic
   */
  isValidMnemonic(mnemonic: string): boolean {
    try {
      ethers.Wallet.fromPhrase(mnemonic);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Deriva múltiplas carteiras a partir de um mnemonic
   */
  deriveWalletsFromMnemonic(mnemonic: string, count: number = 1): WalletInfo[] {
    try {
      if (!this.isValidMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }

      logger.info(`Deriving ${count} wallets from mnemonic`);

      const wallets: WalletInfo[] = [];

      for (let i = 0; i < count; i++) {
        wallets.push(this.importFromMnemonic(mnemonic, i));
      }

      logger.info(`${count} wallets derived successfully`);

      return wallets;
    } catch (error: any) {
      logger.error('Error deriving wallets:', { error: error.message });
      throw new Error(`Failed to derive wallets: ${error.message}`);
    }
  }
}

// Exportar instância singleton
export const walletService = new WalletService();
