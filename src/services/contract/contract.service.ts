/**
 * Contract Service
 * Serviço para deploy e interação com contratos inteligentes
 */

import { ethers } from 'ethers';
import {
  Network,
  TransactionReceipt,
  TransactionOptions,
  DeployContractParams,
  ContractEvent,
} from '../../types';
import { logger } from '../../utils/logger';
import { providerManager } from '../../core/provider';
import { isValidAddress } from '../../utils';
import { ERROR_MESSAGES, ROLE_HASHES } from '../../utils/constants';

export class ContractService {
  /**
   * Faz deploy de um contrato
   */
  async deploy(
    privateKey: string,
    params: DeployContractParams,
    network?: Network
  ): Promise<{
    contractAddress: string;
    transactionHash: string;
    blockNumber: number;
    gasUsed: string;
  }> {
    try {
      logger.info('Deploying contract');

      const signer = providerManager.getSigner(privateKey, network);

      // Criar ContractFactory
      const factory = new ethers.ContractFactory(params.abi, params.bytecode, signer);

      // Preparar opções de transação
      const tx: any = {};
      if (params.options?.gasLimit) tx.gasLimit = params.options.gasLimit;
      if (params.options?.gasPrice)
        tx.gasPrice = ethers.parseUnits(params.options.gasPrice, 'gwei');
      if (params.options?.nonce !== undefined) tx.nonce = params.options.nonce;

      // Deploy
      const contract = await factory.deploy(...(params.constructorArgs || []), tx);

      logger.info(`Deploy transaction sent: ${contract.deploymentTransaction()?.hash}`);

      // Aguardar deploy
      await contract.waitForDeployment();

      const address = await contract.getAddress();
      const deployTx = contract.deploymentTransaction();

      if (!deployTx) {
        throw new Error('Deployment transaction not found');
      }

      const receipt = await deployTx.wait();

      if (!receipt) {
        throw new Error('Deployment receipt not found');
      }

      logger.info(`Contract deployed at ${address}`);

      return {
        contractAddress: address,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error: any) {
      logger.error('Error deploying contract:', { error: error.message });
      throw new Error(`Failed to deploy contract: ${error.message}`);
    }
  }

  /**
   * Chama uma função de leitura (view/pure) do contrato
   */
  async call(
    contractAddress: string,
    abi: any[],
    functionName: string,
    params: any[] = [],
    network?: Network
  ): Promise<any> {
    try {
      if (!isValidAddress(contractAddress)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      logger.debug(`Calling ${functionName} on ${contractAddress}`);

      const provider = providerManager.getProvider(network);
      const contract = new ethers.Contract(contractAddress, abi, provider);

      const result = await contract[functionName](...params);

      return result;
    } catch (error: any) {
      logger.error('Error calling contract function:', { error: error.message });
      throw new Error(`Failed to call contract function: ${error.message}`);
    }
  }

  /**
   * Executa uma função de escrita do contrato (transação)
   */
  async execute(
    contractAddress: string,
    abi: any[],
    functionName: string,
    params: any[],
    privateKey: string,
    network?: Network,
    options?: TransactionOptions
  ): Promise<TransactionReceipt> {
    try {
      if (!isValidAddress(contractAddress)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      logger.info(`Executing ${functionName} on ${contractAddress}`);

      const signer = providerManager.getSigner(privateKey, network);
      const contract = new ethers.Contract(contractAddress, abi, signer);

      // Preparar opções de transação
      const tx: any = {};
      if (options?.gasLimit) tx.gasLimit = options.gasLimit;
      if (options?.gasPrice) tx.gasPrice = ethers.parseUnits(options.gasPrice, 'gwei');
      if (options?.nonce !== undefined) tx.nonce = options.nonce;
      if (options?.value) tx.value = ethers.parseEther(options.value);

      const transaction = await contract[functionName](...params, tx);

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
        to: contractAddress,
        network: networkInfo.name.includes('testnet') ? 'testnet' : 'mainnet',
      };
    } catch (error: any) {
      logger.error('Error executing contract function:', { error: error.message });
      throw new Error(`Failed to execute contract function: ${error.message}`);
    }
  }

  /**
   * Estima o gas necessário para uma chamada de contrato
   */
  async estimateGas(
    contractAddress: string,
    abi: any[],
    functionName: string,
    params: any[],
    fromAddress?: string,
    network?: Network,
    value?: string
  ): Promise<{ gasLimit: string; gasLimitNumber: number }> {
    try {
      if (!isValidAddress(contractAddress)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      logger.debug(`Estimating gas for ${functionName}`);

      const provider = providerManager.getProvider(network);
      const contract = new ethers.Contract(contractAddress, abi, provider);

      // Preparar opções
      const overrides: any = {};
      if (fromAddress) overrides.from = fromAddress;
      if (value) overrides.value = ethers.parseEther(value);

      const gasEstimate = await contract[functionName].estimateGas(...params, overrides);

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
   * Obtém eventos/logs de um contrato
   */
  async getEvents(
    contractAddress: string,
    abi: any[],
    eventName: string,
    fromBlock: number | 'latest' = 0,
    toBlock: number | 'latest' = 'latest',
    network?: Network
  ): Promise<ContractEvent[]> {
    try {
      if (!isValidAddress(contractAddress)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      logger.debug(`Getting ${eventName} events from ${contractAddress}`);

      const provider = providerManager.getProvider(network);
      const contract = new ethers.Contract(contractAddress, abi, provider);

      const filter = contract.filters[eventName]();
      const events = await contract.queryFilter(filter, fromBlock, toBlock);

      return events.map((event) => ({
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        logIndex: event.index,
        args: (event as any).args,
        timestamp: new Date().toISOString(),
      }));
    } catch (error: any) {
      logger.error('Error getting events:', { error: error.message });
      throw new Error(`Failed to get events: ${error.message}`);
    }
  }

  /**
   * Obtém o bytecode de um contrato deployado
   */
  async getCode(contractAddress: string, network?: Network): Promise<string> {
    try {
      if (!isValidAddress(contractAddress)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      logger.debug(`Getting code for ${contractAddress}`);

      const provider = providerManager.getProvider(network);
      const code = await provider.getCode(contractAddress);

      return code;
    } catch (error: any) {
      logger.error('Error getting contract code:', { error: error.message });
      throw new Error(`Failed to get contract code: ${error.message}`);
    }
  }

  /**
   * Verifica se um endereço é um contrato
   */
  async isContract(address: string, network?: Network): Promise<boolean> {
    try {
      if (!isValidAddress(address)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      const code = await this.getCode(address, network);
      return code !== '0x';
    } catch (error: any) {
      logger.error('Error checking if address is contract:', { error: error.message });
      return false;
    }
  }

  // ========================================
  // Métodos de AccessControl
  // ========================================

  /**
   * Verifica se um endereço tem uma role específica
   */
  async hasRole(
    contractAddress: string,
    abi: any[],
    role: string,
    account: string,
    network?: Network
  ): Promise<boolean> {
    try {
      if (!isValidAddress(contractAddress)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      if (!isValidAddress(account)) {
        throw new Error('Invalid account address');
      }

      logger.debug(`Checking if ${account} has role ${role}`);

      const roleHash = this.getRoleHash(role);
      const result = await this.call(contractAddress, abi, 'hasRole', [roleHash, account], network);

      return result;
    } catch (error: any) {
      logger.error('Error checking role:', { error: error.message });
      throw new Error(`Failed to check role: ${error.message}`);
    }
  }

  /**
   * Concede uma role a um endereço
   */
  async grantRole(
    contractAddress: string,
    abi: any[],
    role: string,
    account: string,
    adminPrivateKey: string,
    network?: Network,
    options?: TransactionOptions
  ): Promise<TransactionReceipt> {
    try {
      if (!isValidAddress(contractAddress)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      if (!isValidAddress(account)) {
        throw new Error('Invalid account address');
      }

      logger.info(`Granting role ${role} to ${account}`);

      const roleHash = this.getRoleHash(role);

      return await this.execute(
        contractAddress,
        abi,
        'grantRole',
        [roleHash, account],
        adminPrivateKey,
        network,
        options
      );
    } catch (error: any) {
      logger.error('Error granting role:', { error: error.message });
      throw new Error(`Failed to grant role: ${error.message}`);
    }
  }

  /**
   * Revoga uma role de um endereço
   */
  async revokeRole(
    contractAddress: string,
    abi: any[],
    role: string,
    account: string,
    adminPrivateKey: string,
    network?: Network,
    options?: TransactionOptions
  ): Promise<TransactionReceipt> {
    try {
      if (!isValidAddress(contractAddress)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      if (!isValidAddress(account)) {
        throw new Error('Invalid account address');
      }

      logger.info(`Revoking role ${role} from ${account}`);

      const roleHash = this.getRoleHash(role);

      return await this.execute(
        contractAddress,
        abi,
        'revokeRole',
        [roleHash, account],
        adminPrivateKey,
        network,
        options
      );
    } catch (error: any) {
      logger.error('Error revoking role:', { error: error.message });
      throw new Error(`Failed to revoke role: ${error.message}`);
    }
  }

  /**
   * Renuncia a uma role (própria conta)
   */
  async renounceRole(
    contractAddress: string,
    abi: any[],
    role: string,
    accountPrivateKey: string,
    network?: Network,
    options?: TransactionOptions
  ): Promise<TransactionReceipt> {
    try {
      if (!isValidAddress(contractAddress)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      const signer = providerManager.getSigner(accountPrivateKey, network);
      const account = await signer.getAddress();

      logger.info(`Renouncing role ${role} for ${account}`);

      const roleHash = this.getRoleHash(role);

      return await this.execute(
        contractAddress,
        abi,
        'renounceRole',
        [roleHash, account],
        accountPrivateKey,
        network,
        options
      );
    } catch (error: any) {
      logger.error('Error renouncing role:', { error: error.message });
      throw new Error(`Failed to renounce role: ${error.message}`);
    }
  }

  /**
   * Obtém o admin de uma role
   */
  async getRoleAdmin(
    contractAddress: string,
    abi: any[],
    role: string,
    network?: Network
  ): Promise<string> {
    try {
      if (!isValidAddress(contractAddress)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      logger.debug(`Getting admin for role ${role}`);

      const roleHash = this.getRoleHash(role);
      const result = await this.call(contractAddress, abi, 'getRoleAdmin', [roleHash], network);

      return result;
    } catch (error: any) {
      logger.error('Error getting role admin:', { error: error.message });
      throw new Error(`Failed to get role admin: ${error.message}`);
    }
  }

  /**
   * Converte nome da role para hash
   */
  private getRoleHash(role: string): string {
    // Verificar se é uma role conhecida
    const normalizedRole = role.toUpperCase().replace(/_ROLE$/, '') + '_ROLE';

    if (normalizedRole in ROLE_HASHES) {
      return ROLE_HASHES[normalizedRole as keyof typeof ROLE_HASHES];
    }

    // Se não for conhecida, calcular o hash
    if (role === 'DEFAULT_ADMIN_ROLE') {
      return ethers.ZeroHash;
    }

    return ethers.keccak256(ethers.toUtf8Bytes(role));
  }

  // ========================================
  // Métodos de Pausable
  // ========================================

  /**
   * Pausa o contrato
   */
  async pause(
    contractAddress: string,
    abi: any[],
    pauserPrivateKey: string,
    network?: Network,
    options?: TransactionOptions
  ): Promise<TransactionReceipt> {
    try {
      logger.info(`Pausing contract ${contractAddress}`);

      return await this.execute(
        contractAddress,
        abi,
        'pause',
        [],
        pauserPrivateKey,
        network,
        options
      );
    } catch (error: any) {
      logger.error('Error pausing contract:', { error: error.message });
      throw new Error(`Failed to pause contract: ${error.message}`);
    }
  }

  /**
   * Despausa o contrato
   */
  async unpause(
    contractAddress: string,
    abi: any[],
    pauserPrivateKey: string,
    network?: Network,
    options?: TransactionOptions
  ): Promise<TransactionReceipt> {
    try {
      logger.info(`Unpausing contract ${contractAddress}`);

      return await this.execute(
        contractAddress,
        abi,
        'unpause',
        [],
        pauserPrivateKey,
        network,
        options
      );
    } catch (error: any) {
      logger.error('Error unpausing contract:', { error: error.message });
      throw new Error(`Failed to unpause contract: ${error.message}`);
    }
  }

  /**
   * Verifica se o contrato está pausado
   */
  async isPaused(contractAddress: string, abi: any[], network?: Network): Promise<boolean> {
    try {
      logger.debug(`Checking if contract ${contractAddress} is paused`);

      return await this.call(contractAddress, abi, 'paused', [], network);
    } catch (error: any) {
      logger.error('Error checking paused status:', { error: error.message });
      throw new Error(`Failed to check paused status: ${error.message}`);
    }
  }

  // ========================================
  // Métodos utilitários
  // ========================================

  /**
   * Codifica dados de função
   */
  encodeFunctionData(abi: any[], functionName: string, params: any[] = []): string {
    try {
      const iface = new ethers.Interface(abi);
      return iface.encodeFunctionData(functionName, params);
    } catch (error: any) {
      logger.error('Error encoding function data:', { error: error.message });
      throw new Error(`Failed to encode function data: ${error.message}`);
    }
  }

  /**
   * Decodifica dados de função
   */
  decodeFunctionData(abi: any[], functionName: string, data: string): any {
    try {
      const iface = new ethers.Interface(abi);
      return iface.decodeFunctionData(functionName, data);
    } catch (error: any) {
      logger.error('Error decoding function data:', { error: error.message });
      throw new Error(`Failed to decode function data: ${error.message}`);
    }
  }

  /**
   * Decodifica logs/eventos
   */
  decodeLogs(abi: any[], logs: any[]): any[] {
    try {
      const iface = new ethers.Interface(abi);
      return logs.map((log) => {
        try {
          return iface.parseLog({ topics: log.topics, data: log.data });
        } catch {
          return null;
        }
      }).filter(Boolean);
    } catch (error: any) {
      logger.error('Error decoding logs:', { error: error.message });
      throw new Error(`Failed to decode logs: ${error.message}`);
    }
  }
}

// Exportar instância singleton
export const contractService = new ContractService();
