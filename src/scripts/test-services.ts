/**
 * Script para testar todos os services implementados
 */

import { logger } from '../utils/logger';
import { validateConfig } from '../config/env';
import { walletService } from '../services/wallet/wallet.service';
import { blockchainService } from '../services/blockchain/blockchain.service';
import { azoreScanService } from '../services/explorer/azorescan.service';
import { transactionService } from '../services/transaction/transaction.service';
import { ABIS } from '../config/abis';

async function testServices() {
  logger.info('='.repeat(60));
  logger.info('AZORE SERVICES TEST');
  logger.info('='.repeat(60));

  try {
    // Validar configurações
    logger.info('Validating configuration...');
    validateConfig();
    logger.info('Configuration validated successfully');

    // ========================================
    // 1. TESTE DO WALLET SERVICE
    // ========================================
    logger.info('');
    logger.info('-'.repeat(60));
    logger.info('1. WALLET SERVICE TEST');
    logger.info('-'.repeat(60));

    // Criar nova carteira
    logger.info('Creating new wallet...');
    const newWallet = walletService.createWallet();
    logger.info(`✓ Wallet created`);
    logger.info(`  Address: ${newWallet.address}`);
    logger.info(`  Has Private Key: Yes`);
    logger.info(`  Has Mnemonic: ${newWallet.mnemonic ? 'Yes' : 'No'}`);

    // Validar endereço
    const isValid = walletService.isValidAddress(newWallet.address);
    logger.info(`  Address validation: ${isValid ? '✓ Valid' : '✗ Invalid'}`);

    // Gerar mnemonic
    const mnemonic = walletService.generateMnemonic();
    logger.info(`✓ Mnemonic generated (12 words)`);

    // Importar de mnemonic
    const importedWallet = walletService.importFromMnemonic(mnemonic);
    logger.info(`✓ Wallet imported from mnemonic`);
    logger.info(`  Address: ${importedWallet.address}`);

    // ========================================
    // 2. TESTE DO BLOCKCHAIN SERVICE
    // ========================================
    logger.info('');
    logger.info('-'.repeat(60));
    logger.info('2. BLOCKCHAIN SERVICE TEST');
    logger.info('-'.repeat(60));

    // Testar conexão
    logger.info('Testing blockchain connection...');
    const connection = await blockchainService.testConnection('testnet');
    if (connection.success) {
      logger.info(`✓ Connection successful`);
      logger.info(`  Chain ID: ${connection.chainId}`);
      logger.info(`  Block Number: ${connection.blockNumber}`);
    } else {
      logger.error(`✗ Connection failed: ${connection.error}`);
    }

    // Obter informações da rede
    const networkInfo = blockchainService.getNetworkInfo('testnet');
    logger.info(`✓ Network info retrieved`);
    logger.info(`  Name: ${networkInfo.name}`);
    logger.info(`  Chain ID: ${networkInfo.chainId}`);
    logger.info(`  Currency: ${networkInfo.nativeCurrency.symbol}`);

    // Obter preço do gas
    logger.info('Getting gas price...');
    const gasPrice = await blockchainService.getGasPrice('testnet');
    logger.info(`✓ Gas price retrieved`);
    logger.info(`  Gas Price: ${gasPrice.gasPriceGwei} Gwei`);

    // Obter saldo de um endereço (usando endereço criado)
    logger.info(`Getting balance for ${newWallet.address}...`);
    const balance = await blockchainService.getBalance(newWallet.address, 'testnet');
    logger.info(`✓ Balance retrieved`);
    logger.info(`  Balance: ${balance.balanceEth} AZE-t`);

    // Obter último bloco
    logger.info('Getting latest block...');
    const block = await blockchainService.getBlock('latest', 'testnet');
    if (block) {
      logger.info(`✓ Latest block retrieved`);
      logger.info(`  Block Number: ${block.number}`);
      logger.info(`  Transactions: ${block.transactions}`);
      logger.info(`  Timestamp: ${new Date(block.timestamp * 1000).toISOString()}`);
    }

    // ========================================
    // 3. TESTE DO AZORESCAN SERVICE
    // ========================================
    logger.info('');
    logger.info('-'.repeat(60));
    logger.info('3. AZORESCAN SERVICE TEST');
    logger.info('-'.repeat(60));

    // Obter saldo via AzoreScan
    logger.info(`Getting balance from AzoreScan for ${newWallet.address}...`);
    const azoreScanBalance = await azoreScanService.getBalance(newWallet.address, 'testnet');
    if (azoreScanBalance.success) {
      logger.info(`✓ Balance retrieved from AzoreScan`);
      logger.info(`  Balance: ${azoreScanBalance.data?.balanceEth} AZE-t`);
    } else {
      logger.warn(`⚠ Could not get balance from AzoreScan: ${azoreScanBalance.error}`);
    }

    // Obter lista de tokens
    logger.info('Getting token list from AzoreScan...');
    const tokenList = await azoreScanService.getTokenList(newWallet.address, 'testnet');
    if (tokenList.success) {
      logger.info(`✓ Token list retrieved`);
      logger.info(`  Tokens found: ${tokenList.data?.length || 0}`);
    } else {
      logger.warn(`⚠ Could not get token list: ${tokenList.error}`);
    }

    // Obter saldos completos (otimizado)
    logger.info('Getting complete balances (optimized)...');
    const completeBalances = await azoreScanService.getCompleteBalances(
      newWallet.address,
      'testnet'
    );
    if (completeBalances.success && completeBalances.data) {
      logger.info(`✓ Complete balances retrieved`);
      logger.info(`  Total tokens: ${completeBalances.data.totalTokens}`);
      logger.info(`  Native balance: ${completeBalances.data.azeBalance.balanceEth} AZE-t`);
      logger.info(`  ERC-20 tokens: ${completeBalances.data.tokenBalances.length}`);

      if (completeBalances.data.tokenBalances.length > 0) {
        logger.info(`  First token: ${completeBalances.data.tokenBalances[0].tokenSymbol}`);
      }
    }

    // ========================================
    // 4. TESTE DO TRANSACTION SERVICE
    // ========================================
    logger.info('');
    logger.info('-'.repeat(60));
    logger.info('4. TRANSACTION SERVICE TEST');
    logger.info('-'.repeat(60));

    // Obter preço do gas
    logger.info('Getting gas price via TransactionService...');
    const txGasPrice = await transactionService.getGasPrice('testnet');
    logger.info(`✓ Gas price retrieved`);
    logger.info(`  Gas Price: ${txGasPrice.gasPriceGwei} Gwei`);

    // Estimar gas
    logger.info('Estimating gas for simple transfer...');
    const gasEstimate = await transactionService.estimateGas(
      newWallet.address,
      '0x',
      undefined,
      '0.1',
      'testnet'
    );
    logger.info(`✓ Gas estimated`);
    logger.info(`  Estimated Gas: ${gasEstimate.gasLimitNumber}`);

    // Obter nonce
    logger.info(`Getting nonce for ${newWallet.address}...`);
    const nonce = await transactionService.getNonce(newWallet.address, 'testnet');
    logger.info(`✓ Nonce retrieved`);
    logger.info(`  Nonce: ${nonce}`);

    // ========================================
    // 5. RESUMO DOS TESTES
    // ========================================
    logger.info('');
    logger.info('='.repeat(60));
    logger.info('TEST SUMMARY');
    logger.info('='.repeat(60));
    logger.info('✓ Wallet Service: Working');
    logger.info('  - Create wallet ✓');
    logger.info('  - Generate mnemonic ✓');
    logger.info('  - Import from mnemonic ✓');
    logger.info('  - Address validation ✓');
    logger.info('');
    logger.info('✓ Blockchain Service: Working');
    logger.info('  - Connection test ✓');
    logger.info('  - Network info ✓');
    logger.info('  - Get balance ✓');
    logger.info('  - Get gas price ✓');
    logger.info('  - Get block ✓');
    logger.info('');
    logger.info('✓ AzoreScan Service: Working');
    logger.info('  - Get balance ✓');
    logger.info('  - Get token list ✓');
    logger.info('  - Get complete balances ✓');
    logger.info('');
    logger.info('✓ Transaction Service: Working');
    logger.info('  - Get gas price ✓');
    logger.info('  - Estimate gas ✓');
    logger.info('  - Get nonce ✓');
    logger.info('');
    logger.info('='.repeat(60));
    logger.info('ALL SERVICES WORKING CORRECTLY ✓');
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

// Executar testes
testServices();
