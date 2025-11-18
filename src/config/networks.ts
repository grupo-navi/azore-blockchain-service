import { NetworkConfig } from '../types';

/**
 * Configurações das redes Azore
 */
export const NETWORKS: Record<string, NetworkConfig> = {
  testnet: {
    name: 'azore-testnet',
    chainId: 88001,
    rpcUrl: process.env.AZORE_TESTNET_RPC_URL || 'https://rpc-testnet.azore.technology',
    explorerUrl: process.env.AZORE_TESTNET_EXPLORER_URL || 'https://floripa.azorescan.com',
    explorerApiUrl: process.env.AZORE_TESTNET_EXPLORER_API_URL || 'https://floripa.azorescan.com/api',
    nativeCurrency: {
      name: 'Azore Testnet',
      symbol: 'AZE-t',
      decimals: 18,
    },
    blockTime: 3, // ~3 segundos por bloco (estimativa)
    confirmations: 3, // Número de confirmações recomendadas
  },

  mainnet: {
    name: 'azore-mainnet',
    chainId: 8800,
    rpcUrl: process.env.AZORE_MAINNET_RPC_URL || 'https://rpc-mainnet.azore.technology',
    explorerUrl: process.env.AZORE_MAINNET_EXPLORER_URL || 'https://azorescan.com',
    explorerApiUrl: process.env.AZORE_MAINNET_EXPLORER_API_URL || 'https://azorescan.com/api',
    nativeCurrency: {
      name: 'Azore',
      symbol: 'AZE',
      decimals: 18,
    },
    blockTime: 3, // ~3 segundos por bloco (estimativa)
    confirmations: 5, // Mais confirmações na mainnet para segurança
  },
};

/**
 * Obtém a configuração de uma rede
 * @param network - Nome da rede
 * @returns Configuração da rede
 */
export function getNetworkConfig(network: 'testnet' | 'mainnet' = 'testnet'): NetworkConfig {
  const config = NETWORKS[network];

  if (!config) {
    throw new Error(`Network ${network} not found`);
  }

  return config;
}

/**
 * Obtém a rede padrão configurada
 * @returns Nome da rede padrão
 */
export function getDefaultNetwork(): 'testnet' | 'mainnet' {
  const defaultNetwork = process.env.NETWORK || process.env.DEFAULT_NETWORK || 'testnet';

  if (defaultNetwork !== 'testnet' && defaultNetwork !== 'mainnet') {
    console.warn(`Invalid default network ${defaultNetwork}, using testnet`);
    return 'testnet';
  }

  return defaultNetwork as 'testnet' | 'mainnet';
}

/**
 * Valida se uma rede é suportada
 * @param network - Nome da rede
 * @returns True se a rede é suportada
 */
export function isValidNetwork(network: string): network is 'testnet' | 'mainnet' {
  return network === 'testnet' || network === 'mainnet';
}
