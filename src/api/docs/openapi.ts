/**
 * OpenAPI 3.0 Specification for Azore Blockchain Service
 */

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Azore Blockchain Service API',
    description: `
# Azore Blockchain Service

![Azore Logo](/images/logo-dark.png)

API completa para integração com a blockchain Azore (EVM-compatible).

## Funcionalidades

- **Wallet**: Criação e gerenciamento de carteiras
- **Blockchain**: Consultas à blockchain (saldos, blocos, transações)
- **Token**: Operações com tokens ERC-20 (transfer, mint, burn)
- **Transaction**: Envio e gerenciamento de transações
- **Contract**: Deploy e interação com contratos inteligentes
- **Explorer**: Integração com AzoreScan API

## Redes Suportadas

| Rede | Chain ID | RPC | Explorer |
|------|----------|-----|----------|
| Testnet | 88001 | https://rpc-testnet.azore.technology | https://floripa.azorescan.com |
| Mainnet | 8800 | https://rpc-mainnet.azore.technology | https://azorescan.com |

## Token Nativo

O token nativo da blockchain Azore é o **AZE** (Azore), usado para pagar taxas de gas.

## Autenticação

Esta API não requer autenticação para endpoints de leitura.
Para operações que requerem assinatura, envie a \`privateKey\` no body da requisição.

⚠️ **Atenção**: Nunca compartilhe sua private key. Em produção, use um backend seguro.
    `,
    version: '1.0.0',
    contact: {
      name: 'Azore Support',
      url: 'https://azore.technology',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    'x-logo': {
      url: '/images/logo-dark.png',
      altText: 'Azore Logo',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local Development Server',
    },
    {
      url: 'https://api.azore.technology',
      description: 'Production Server',
    },
  ],
  tags: [
    {
      name: 'Wallet',
      description: 'Criação e gerenciamento de carteiras',
    },
    {
      name: 'Blockchain',
      description: 'Consultas à blockchain',
    },
    {
      name: 'Token',
      description: 'Operações com tokens ERC-20',
    },
    {
      name: 'Transaction',
      description: 'Envio e gerenciamento de transações',
    },
    {
      name: 'Contract',
      description: 'Deploy e interação com contratos',
    },
    {
      name: 'Explorer',
      description: 'Integração com AzoreScan',
    },
  ],
  paths: {
    // ========================================
    // WALLET ENDPOINTS
    // ========================================
    '/api/wallet/create': {
      post: {
        tags: ['Wallet'],
        summary: 'Criar nova carteira',
        description: 'Cria uma nova carteira com endereço, private key e mnemonic',
        responses: {
          200: {
            description: 'Carteira criada com sucesso',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/WalletResponse',
                },
                example: {
                  success: true,
                  data: {
                    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f5bE91',
                    privateKey: '0x...',
                    mnemonic: 'word1 word2 word3 ...',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/wallet/balance/{address}': {
      get: {
        tags: ['Wallet'],
        summary: 'Obter saldo da carteira',
        description: 'Retorna o saldo em AZE/AZE-t da carteira',
        parameters: [
          {
            name: 'address',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            example: '0x742d35Cc6634C0532925a3b844Bc9e7595f5bE91',
          },
          {
            $ref: '#/components/parameters/network',
          },
        ],
        responses: {
          200: {
            description: 'Saldo obtido com sucesso',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/BalanceResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/wallet/validate/{address}': {
      get: {
        tags: ['Wallet'],
        summary: 'Validar endereço',
        description: 'Verifica se um endereço Ethereum é válido',
        parameters: [
          {
            name: 'address',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            example: '0x742d35Cc6634C0532925a3b844Bc9e7595f5bE91',
          },
        ],
        responses: {
          200: {
            description: 'Validação concluída',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f5bE91',
                    isValid: true,
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/wallet/sign': {
      post: {
        tags: ['Wallet'],
        summary: 'Assinar mensagem',
        description: 'Assina uma mensagem com a private key',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['privateKey', 'message'],
                properties: {
                  privateKey: {
                    type: 'string',
                    description: 'Private key da carteira',
                  },
                  message: {
                    type: 'string',
                    description: 'Mensagem a ser assinada',
                  },
                },
              },
              example: {
                privateKey: '0x...',
                message: 'Hello Azore!',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Mensagem assinada',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    signature: '0x...',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/wallet/mnemonic/generate': {
      get: {
        tags: ['Wallet'],
        summary: 'Gerar mnemonic',
        description: 'Gera uma frase mnemonic de 12 palavras',
        responses: {
          200: {
            description: 'Mnemonic gerado',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
                  },
                },
              },
            },
          },
        },
      },
    },

    // ========================================
    // BLOCKCHAIN ENDPOINTS
    // ========================================
    '/api/blockchain/connection': {
      get: {
        tags: ['Blockchain'],
        summary: 'Testar conexão',
        description: 'Testa a conexão com a blockchain',
        parameters: [{ $ref: '#/components/parameters/network' }],
        responses: {
          200: {
            description: 'Conexão testada',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    success: true,
                    chainId: 88001,
                    blockNumber: 10222000,
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/blockchain/network': {
      get: {
        tags: ['Blockchain'],
        summary: 'Informações da rede',
        description: 'Retorna informações da rede blockchain',
        parameters: [{ $ref: '#/components/parameters/network' }],
        responses: {
          200: {
            description: 'Informações da rede',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    name: 'azore-testnet',
                    chainId: 88001,
                    rpcUrl: 'https://rpc-testnet.azore.technology',
                    nativeCurrency: {
                      name: 'Azore Testnet',
                      symbol: 'AZE-t',
                      decimals: 18,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/blockchain/balance/{address}': {
      get: {
        tags: ['Blockchain'],
        summary: 'Obter saldo',
        description: 'Retorna o saldo nativo (AZE) de um endereço',
        parameters: [
          {
            name: 'address',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            example: '0x742d35Cc6634C0532925a3b844Bc9e7595f5bE91',
          },
          { $ref: '#/components/parameters/network' },
        ],
        responses: {
          200: {
            description: 'Saldo obtido',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BalanceResponse' },
              },
            },
          },
        },
      },
    },
    '/api/blockchain/gas-price': {
      get: {
        tags: ['Blockchain'],
        summary: 'Preço do gas',
        description: 'Retorna o preço atual do gas',
        parameters: [{ $ref: '#/components/parameters/network' }],
        responses: {
          200: {
            description: 'Preço do gas',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    gasPriceWei: '12000000000',
                    gasPriceGwei: '12.0',
                    network: 'testnet',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/blockchain/block/{blockNumber}': {
      get: {
        tags: ['Blockchain'],
        summary: 'Informações de bloco',
        description: 'Retorna informações de um bloco específico',
        parameters: [
          {
            name: 'blockNumber',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            example: 'latest',
            description: 'Número do bloco ou "latest"',
          },
          { $ref: '#/components/parameters/network' },
        ],
        responses: {
          200: {
            description: 'Informações do bloco',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    number: 10222000,
                    hash: '0x...',
                    timestamp: 1700000000,
                    transactions: 5,
                  },
                },
              },
            },
          },
        },
      },
    },

    // ========================================
    // TOKEN ENDPOINTS
    // ========================================
    '/api/token/info/{tokenAddress}': {
      get: {
        tags: ['Token'],
        summary: 'Informações do token',
        description: 'Retorna informações de um token ERC-20',
        parameters: [
          {
            name: 'tokenAddress',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            example: '0x...',
            description: 'Endereço do contrato do token',
          },
          { $ref: '#/components/parameters/network' },
        ],
        responses: {
          200: {
            description: 'Informações do token',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    address: '0x...',
                    name: 'My Token',
                    symbol: 'MTK',
                    decimals: '18',
                    totalSupply: '1000000000000000000000000',
                    network: 'testnet',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/token/balance/{tokenAddress}/{walletAddress}': {
      get: {
        tags: ['Token'],
        summary: 'Saldo de token',
        description: 'Retorna o saldo de um token específico para uma carteira',
        parameters: [
          {
            name: 'tokenAddress',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Endereço do contrato do token',
          },
          {
            name: 'walletAddress',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Endereço da carteira',
          },
          { $ref: '#/components/parameters/network' },
        ],
        responses: {
          200: {
            description: 'Saldo do token',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    contractAddress: '0x...',
                    tokenName: 'My Token',
                    tokenSymbol: 'MTK',
                    tokenDecimals: 18,
                    balanceWei: '1000000000000000000',
                    balanceEth: '1.0',
                    userAddress: '0x...',
                    network: 'testnet',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/token/transfer': {
      post: {
        tags: ['Token'],
        summary: 'Transferir tokens',
        description: 'Transfere tokens ERC-20 para outro endereço',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TokenTransferRequest',
              },
              example: {
                tokenAddress: '0x...',
                privateKey: '0x...',
                toAddress: '0x...',
                amount: '100.0',
                network: 'testnet',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Transferência realizada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TransactionReceipt' },
              },
            },
          },
        },
      },
    },
    '/api/token/allowance/{tokenAddress}/{ownerAddress}/{spenderAddress}': {
      get: {
        tags: ['Token'],
        summary: 'Consultar allowance',
        description: 'Consulta o allowance aprovado para um spender',
        parameters: [
          {
            name: 'tokenAddress',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'ownerAddress',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'spenderAddress',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          { $ref: '#/components/parameters/network' },
        ],
        responses: {
          200: {
            description: 'Allowance consultado',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    allowanceWei: '1000000000000000000',
                    allowanceEth: '1.0',
                  },
                },
              },
            },
          },
        },
      },
    },

    // ========================================
    // TRANSACTION ENDPOINTS
    // ========================================
    '/api/transaction/send': {
      post: {
        tags: ['Transaction'],
        summary: 'Enviar transação',
        description: 'Envia uma transação de AZE nativo',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SendTransactionRequest',
              },
              example: {
                privateKey: '0x...',
                to: '0x742d35Cc6634C0532925a3b844Bc9e7595f5bE91',
                amount: '1.0',
                network: 'testnet',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Transação enviada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TransactionReceipt' },
              },
            },
          },
        },
      },
    },
    '/api/transaction/{txHash}': {
      get: {
        tags: ['Transaction'],
        summary: 'Obter transação',
        description: 'Retorna informações de uma transação',
        parameters: [
          {
            name: 'txHash',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            example: '0x...',
          },
          { $ref: '#/components/parameters/network' },
        ],
        responses: {
          200: {
            description: 'Informações da transação',
          },
        },
      },
    },
    '/api/transaction/gas/price': {
      get: {
        tags: ['Transaction'],
        summary: 'Preço do gas',
        description: 'Retorna o preço atual do gas',
        parameters: [{ $ref: '#/components/parameters/network' }],
        responses: {
          200: {
            description: 'Preço do gas obtido',
          },
        },
      },
    },
    '/api/transaction/gas/estimate': {
      post: {
        tags: ['Transaction'],
        summary: 'Estimar gas',
        description: 'Estima o gas necessário para uma transação',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                to: '0x742d35Cc6634C0532925a3b844Bc9e7595f5bE91',
                value: '1.0',
                data: '0x',
                network: 'testnet',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Gas estimado',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    gasLimit: '21000',
                    gasLimitNumber: 21000,
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/transaction/nonce/{address}': {
      get: {
        tags: ['Transaction'],
        summary: 'Obter nonce',
        description: 'Retorna o nonce atual de um endereço',
        parameters: [
          {
            name: 'address',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          { $ref: '#/components/parameters/network' },
        ],
        responses: {
          200: {
            description: 'Nonce obtido',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: { nonce: 42 },
                },
              },
            },
          },
        },
      },
    },

    // ========================================
    // CONTRACT ENDPOINTS
    // ========================================
    '/api/contract/call': {
      post: {
        tags: ['Contract'],
        summary: 'Chamar função (read-only)',
        description: 'Chama uma função view/pure de um contrato',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ContractCallRequest',
              },
              example: {
                contractAddress: '0x...',
                abi: [
                  {
                    name: 'balanceOf',
                    type: 'function',
                    inputs: [{ name: 'account', type: 'address' }],
                    outputs: [{ name: '', type: 'uint256' }],
                    stateMutability: 'view',
                  },
                ],
                functionName: 'balanceOf',
                params: ['0x742d35Cc6634C0532925a3b844Bc9e7595f5bE91'],
                network: 'testnet',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Resultado da chamada',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    result: '1000000000000000000',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/contract/execute': {
      post: {
        tags: ['Contract'],
        summary: 'Executar função (write)',
        description: 'Executa uma função que altera o estado do contrato',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ContractExecuteRequest',
              },
              example: {
                contractAddress: '0x...',
                abi: [
                  {
                    name: 'transfer',
                    type: 'function',
                    inputs: [
                      { name: 'to', type: 'address' },
                      { name: 'amount', type: 'uint256' },
                    ],
                    outputs: [{ name: '', type: 'bool' }],
                    stateMutability: 'nonpayable',
                  },
                ],
                functionName: 'transfer',
                params: ['0x...', '1000000000000000000'],
                privateKey: '0x...',
                network: 'testnet',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Transação executada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TransactionReceipt' },
              },
            },
          },
        },
      },
    },
    '/api/contract/is-contract/{address}': {
      get: {
        tags: ['Contract'],
        summary: 'Verificar se é contrato',
        description: 'Verifica se um endereço é um contrato',
        parameters: [
          {
            name: 'address',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          { $ref: '#/components/parameters/network' },
        ],
        responses: {
          200: {
            description: 'Verificação concluída',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    address: '0x...',
                    isContract: true,
                  },
                },
              },
            },
          },
        },
      },
    },

    // ========================================
    // EXPLORER ENDPOINTS
    // ========================================
    '/api/explorer/balances/{address}': {
      get: {
        tags: ['Explorer'],
        summary: 'Saldos completos',
        description: 'Retorna todos os saldos (nativo + tokens) de um endereço',
        parameters: [
          {
            name: 'address',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          { $ref: '#/components/parameters/network' },
        ],
        responses: {
          200: {
            description: 'Saldos obtidos',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    address: '0x...',
                    network: 'testnet',
                    azeBalance: {
                      balanceWei: '1000000000000000000',
                      balanceEth: '1.0',
                    },
                    tokenBalances: [],
                    totalTokens: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/explorer/transactions/{address}': {
      get: {
        tags: ['Explorer'],
        summary: 'Histórico de transações',
        description: 'Retorna o histórico de transações de um endereço',
        parameters: [
          {
            name: 'address',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          { $ref: '#/components/parameters/network' },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'offset',
            in: 'query',
            schema: { type: 'integer', default: 10 },
          },
        ],
        responses: {
          200: {
            description: 'Transações obtidas',
          },
        },
      },
    },
    '/api/explorer/holders/{contractAddress}': {
      get: {
        tags: ['Explorer'],
        summary: 'Holders de um token',
        description: 'Retorna a lista de holders de um token',
        parameters: [
          {
            name: 'contractAddress',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          { $ref: '#/components/parameters/network' },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'offset',
            in: 'query',
            schema: { type: 'integer', default: 10 },
          },
        ],
        responses: {
          200: {
            description: 'Holders obtidos',
          },
        },
      },
    },
    '/api/explorer/contract/{address}/abi': {
      get: {
        tags: ['Explorer'],
        summary: 'ABI de contrato verificado',
        description: 'Retorna o ABI de um contrato verificado no AzoreScan',
        parameters: [
          {
            name: 'address',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          { $ref: '#/components/parameters/network' },
        ],
        responses: {
          200: {
            description: 'ABI obtido',
          },
        },
      },
    },
  },
  components: {
    parameters: {
      network: {
        name: 'network',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
          enum: ['testnet', 'mainnet'],
          default: 'testnet',
        },
        description: 'Rede blockchain (testnet ou mainnet)',
      },
    },
    schemas: {
      WalletResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              address: { type: 'string' },
              privateKey: { type: 'string' },
              mnemonic: { type: 'string' },
            },
          },
        },
      },
      BalanceResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              address: { type: 'string' },
              balanceWei: { type: 'string' },
              balanceEth: { type: 'string' },
              network: { type: 'string' },
            },
          },
        },
      },
      TransactionReceipt: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              transactionHash: { type: 'string' },
              blockNumber: { type: 'integer' },
              gasUsed: { type: 'string' },
              status: { type: 'string', enum: ['success', 'failed'] },
              from: { type: 'string' },
              to: { type: 'string' },
              network: { type: 'string' },
            },
          },
        },
      },
      TokenTransferRequest: {
        type: 'object',
        required: ['tokenAddress', 'privateKey', 'toAddress', 'amount'],
        properties: {
          tokenAddress: { type: 'string' },
          privateKey: { type: 'string' },
          toAddress: { type: 'string' },
          amount: { type: 'string' },
          network: { type: 'string', default: 'testnet' },
          options: {
            type: 'object',
            properties: {
              gasLimit: { type: 'integer' },
              gasPrice: { type: 'string' },
            },
          },
        },
      },
      SendTransactionRequest: {
        type: 'object',
        required: ['privateKey', 'to', 'amount'],
        properties: {
          privateKey: { type: 'string' },
          to: { type: 'string' },
          amount: { type: 'string' },
          network: { type: 'string', default: 'testnet' },
          options: {
            type: 'object',
            properties: {
              gasLimit: { type: 'integer' },
              gasPrice: { type: 'string' },
              data: { type: 'string' },
              nonce: { type: 'integer' },
            },
          },
        },
      },
      ContractCallRequest: {
        type: 'object',
        required: ['contractAddress', 'abi', 'functionName'],
        properties: {
          contractAddress: { type: 'string' },
          abi: { type: 'array', items: { type: 'object' } },
          functionName: { type: 'string' },
          params: { type: 'array', items: {} },
          network: { type: 'string', default: 'testnet' },
        },
      },
      ContractExecuteRequest: {
        type: 'object',
        required: ['contractAddress', 'abi', 'functionName', 'privateKey'],
        properties: {
          contractAddress: { type: 'string' },
          abi: { type: 'array', items: { type: 'object' } },
          functionName: { type: 'string' },
          params: { type: 'array', items: {} },
          privateKey: { type: 'string' },
          network: { type: 'string', default: 'testnet' },
          options: {
            type: 'object',
            properties: {
              gasLimit: { type: 'integer' },
              gasPrice: { type: 'string' },
              value: { type: 'string' },
            },
          },
        },
      },
    },
  },
};
