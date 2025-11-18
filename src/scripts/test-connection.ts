/**
 * Script para testar conexão com a blockchain Azore
 */

import { providerManager } from '../core/provider';
import { logger } from '../utils/logger';
import { validateConfig } from '../config/env';

async function testConnection() {
  logger.info('='.repeat(60));
  logger.info('AZORE BLOCKCHAIN CONNECTION TEST');
  logger.info('='.repeat(60));

  try {
    // Validar configurações
    logger.info('Validating configuration...');
    validateConfig();
    logger.info('Configuration validated successfully');

    // Testar Testnet
    logger.info('');
    logger.info('-'.repeat(60));
    logger.info('Testing TESTNET connection...');
    logger.info('-'.repeat(60));

    const testnetResult = await providerManager.testConnection('testnet');

    if (testnetResult.success) {
      logger.info(`✓ Testnet connection successful`);
      logger.info(`  Chain ID: ${testnetResult.chainId}`);
      logger.info(`  Current Block: ${testnetResult.blockNumber}`);

      const testnetInfo = providerManager.getNetworkInfo('testnet');
      logger.info(`  RPC URL: ${testnetInfo.rpcUrl}`);
      logger.info(`  Explorer: ${testnetInfo.explorerUrl}`);
      logger.info(`  Native Currency: ${testnetInfo.nativeCurrency.symbol}`);
    } else {
      logger.error(`✗ Testnet connection failed: ${testnetResult.error}`);
    }

    // Testar Mainnet
    logger.info('');
    logger.info('-'.repeat(60));
    logger.info('Testing MAINNET connection...');
    logger.info('-'.repeat(60));

    const mainnetResult = await providerManager.testConnection('mainnet');

    if (mainnetResult.success) {
      logger.info(`✓ Mainnet connection successful`);
      logger.info(`  Chain ID: ${mainnetResult.chainId}`);
      logger.info(`  Current Block: ${mainnetResult.blockNumber}`);

      const mainnetInfo = providerManager.getNetworkInfo('mainnet');
      logger.info(`  RPC URL: ${mainnetInfo.rpcUrl}`);
      logger.info(`  Explorer: ${mainnetInfo.explorerUrl}`);
      logger.info(`  Native Currency: ${mainnetInfo.nativeCurrency.symbol}`);
    } else {
      logger.error(`✗ Mainnet connection failed: ${mainnetResult.error}`);
    }

    // Teste de Gas Price
    logger.info('');
    logger.info('-'.repeat(60));
    logger.info('Testing Gas Price fetch...');
    logger.info('-'.repeat(60));

    try {
      const feeData = await providerManager.getFeeData('testnet');
      logger.info(`✓ Gas price fetched successfully`);
      logger.info(`  Gas Price: ${feeData.gasPrice?.toString()} wei`);

      if (feeData.maxFeePerGas) {
        logger.info(`  Max Fee Per Gas: ${feeData.maxFeePerGas.toString()} wei`);
      }
    } catch (error: any) {
      logger.error(`✗ Gas price fetch failed: ${error.message}`);
    }

    logger.info('');
    logger.info('='.repeat(60));
    logger.info('TEST COMPLETED');
    logger.info('='.repeat(60));

    process.exit(0);
  } catch (error: any) {
    logger.error('');
    logger.error('='.repeat(60));
    logger.error('TEST FAILED');
    logger.error('='.repeat(60));
    logger.error(`Error: ${error.message}`);

    if (error.stack) {
      logger.debug(error.stack);
    }

    process.exit(1);
  }
}

// Executar teste
testConnection();
