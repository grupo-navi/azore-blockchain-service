import ERC20_ABI from './ERC20.json';
import ERC721_ABI from './ERC721.json';

/**
 * ABIs padrão disponíveis
 */
export const ABIS = {
  ERC20: ERC20_ABI,
  ERC721: ERC721_ABI,
} as const;

/**
 * Tipos de contratos suportados
 */
export type ContractType = keyof typeof ABIS;

/**
 * Obtém ABI por tipo de contrato
 * @param type - Tipo do contrato
 * @returns ABI do contrato
 */
export function getABI(type: ContractType): any[] {
  const abi = ABIS[type];

  if (!abi) {
    throw new Error(`ABI not found for contract type: ${type}`);
  }

  return abi;
}

/**
 * Verifica se um tipo de contrato é suportado
 * @param type - Tipo do contrato
 * @returns True se o tipo é suportado
 */
export function isSupportedContractType(type: string): type is ContractType {
  return type in ABIS;
}

/**
 * Lista todos os tipos de contratos suportados
 * @returns Array com os tipos suportados
 */
export function getSupportedContractTypes(): ContractType[] {
  return Object.keys(ABIS) as ContractType[];
}
