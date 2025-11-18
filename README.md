# Azore Blockchain Service

Microserviço completo para integração com a blockchain Azore (EVM-compatible). Este serviço oferece uma API REST completa, SDK client, sistema de webhooks e interface interativa para testes.

## Funcionalidades

### Core Services
- **Wallet Service**: Criação, importação e gerenciamento de carteiras
- **Blockchain Service**: Consultas à blockchain (saldos, blocos, gas)
- **Token Service**: Operações ERC-20 (transfer, mint, burn, approve)
- **Transaction Service**: Envio e monitoramento de transações
- **Contract Service**: Deploy e interação com contratos inteligentes
- **Explorer Service**: Integração com AzoreScan API

### Recursos
- **API REST**: 56+ endpoints documentados
- **Swagger UI**: Documentação interativa em `/docs`
- **Interactive Tester**: Interface web para testes em `/`
- **SDK Client**: Biblioteca TypeScript para integração
- **Webhooks**: Sistema de notificações em tempo real
- **Cache System**: Cache em memória com TTL

## Instalação

```bash
# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env
```

## Uso

### Iniciar o servidor

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm run build
npm start
```

### Acessar interfaces

| URL | Descrição |
|-----|-----------|
| http://localhost:3000/ | Interactive Tester |
| http://localhost:3000/docs | Swagger UI Documentation |
| http://localhost:3000/health | Health Check |
| http://localhost:3000/openapi.json | OpenAPI Spec |

## Redes Suportadas

| Rede | Chain ID | RPC | Explorer |
|------|----------|-----|----------|
| Testnet | 88001 | https://rpc-testnet.azore.technology | https://floripa.azorescan.com |
| Mainnet | 8800 | https://rpc-mainnet.azore.technology | https://azorescan.com |

## Obter Tokens AZE

| Rede | Token | Onde Obter |
|------|-------|------------|
| Testnet | AZE-t | https://faucet.azorescan.com/ |
| Mainnet | AZE | https://app.coinage.trade/ |

## API Endpoints

### Wallet
- `POST /api/wallet/create` - Criar nova carteira
- `POST /api/wallet/import` - Importar de private key
- `POST /api/wallet/import/mnemonic` - Importar de mnemonic
- `GET /api/wallet/:address/balance` - Consultar saldo
- `POST /api/wallet/encrypt` - Criptografar private key
- `POST /api/wallet/decrypt` - Descriptografar private key

### Blockchain
- `GET /api/blockchain/balance/:address` - Saldo nativo
- `GET /api/blockchain/block/:number` - Informações do bloco
- `GET /api/blockchain/block/latest` - Último bloco
- `GET /api/blockchain/gas-price` - Gas price atual
- `GET /api/blockchain/chain-id` - Chain ID
- `POST /api/blockchain/estimate-gas` - Estimar gas

### Token
- `GET /api/token/info/:address` - Informações do token
- `GET /api/token/balance/:token/:wallet` - Saldo de token
- `POST /api/token/transfer` - Transferir tokens
- `POST /api/token/approve` - Aprovar allowance
- `GET /api/token/allowance/:token/:owner/:spender` - Consultar allowance
- `POST /api/token/mint` - Mintar tokens
- `POST /api/token/burn` - Queimar tokens

### Transaction
- `POST /api/transaction/send` - Enviar transação
- `GET /api/transaction/:hash` - Consultar transação
- `GET /api/transaction/:hash/receipt` - Recibo da transação
- `GET /api/transaction/:hash/status` - Status da transação
- `POST /api/transaction/wait` - Aguardar confirmação
- `POST /api/transaction/decode` - Decodificar input data

### Contract
- `POST /api/contract/deploy` - Deploy de contrato
- `POST /api/contract/call` - Chamar função (read)
- `POST /api/contract/execute` - Executar função (write)
- `POST /api/contract/estimate-gas` - Estimar gas
- `GET /api/contract/:address/code` - Bytecode do contrato

### Explorer
- `GET /api/explorer/address/:address/transactions` - Histórico de transações
- `GET /api/explorer/address/:address/tokens` - Tokens do endereço
- `GET /api/explorer/contract/:address/abi` - ABI do contrato
- `GET /api/explorer/token/:address/info` - Info do token
- `GET /api/explorer/token/:address/holders` - Holders do token
- `GET /api/explorer/stats` - Estatísticas da rede

## SDK Client

```typescript
import { createAzoreClient } from './sdk/client';

const client = createAzoreClient({
  baseUrl: 'http://localhost:3000',
  network: 'testnet'
});

// Criar carteira
const wallet = await client.wallet.create();

// Consultar saldo
const balance = await client.blockchain.getBalance(wallet.address);

// Transferir tokens
const tx = await client.token.transfer({
  tokenAddress: '0x...',
  privateKey: wallet.privateKey,
  to: '0x...',
  amount: '100'
});
```

## Interação com Contratos

### Via API
```typescript
// Chamar função de leitura
const result = await fetch('/api/contract/call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contractAddress: '0x...',
    abi: [...],
    functionName: 'balanceOf',
    params: ['0x...'],
    network: 'testnet'
  })
});

// Executar função de escrita
const tx = await fetch('/api/contract/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contractAddress: '0x...',
    abi: [...],
    functionName: 'transfer',
    params: ['0x...', '1000000000000000000'],
    privateKey: '0x...',
    network: 'testnet'
  })
});
```

### Via Interactive Tester
1. Acesse http://localhost:3000/
2. Conecte MetaMask ou informe private key
3. Na aba Contract, cole o endereço do contrato
4. Clique em "Fetch ABI from Explorer" ou cole o ABI
5. Clique em "Load Functions"
6. Use as funções de leitura (azul) e escrita (laranja)

## Estrutura do Projeto

```
azore_service/
├── src/
│   ├── core/              # Provider, Network, Signer
│   ├── services/
│   │   ├── wallet/        # Wallet Service
│   │   ├── token/         # Token Service (ERC-20)
│   │   ├── contract/      # Contract Service
│   │   ├── transaction/   # Transaction Service
│   │   └── explorer/      # AzoreScan Integration
│   ├── api/
│   │   ├── routes/        # API Routes
│   │   ├── middlewares/   # Error, Logger
│   │   ├── validators/    # Joi Validators
│   │   └── docs/          # OpenAPI Spec
│   ├── sdk/               # SDK Client
│   ├── webhooks/          # Webhook Manager
│   ├── utils/             # Logger, Cache, Formatters
│   └── config/            # Network, Env configs
├── public/
│   ├── index.html         # Interactive Tester
│   └── images/            # Logos (AZE, Azore)
├── package.json
├── tsconfig.json
└── .env.example
```

## Scripts

```bash
npm run dev          # Desenvolvimento com hot reload
npm run build        # Compilar TypeScript
npm start            # Iniciar produção
npm run lint         # Verificar código
npm run lint:fix     # Corrigir lint
npm run format       # Formatar com Prettier
npm run type-check   # Verificar tipos
```

## Variáveis de Ambiente

```env
# Network
NETWORK=testnet

# Azore Testnet
AZORE_TESTNET_RPC_URL=https://rpc-testnet.azore.technology
AZORE_TESTNET_CHAIN_ID=88001
AZORE_TESTNET_EXPLORER_URL=https://floripa.azorescan.com
AZORE_TESTNET_EXPLORER_API_URL=https://floripa.azorescan.com/api

# Azore Mainnet
AZORE_MAINNET_RPC_URL=https://rpc-mainnet.azore.technology
AZORE_MAINNET_CHAIN_ID=8800
AZORE_MAINNET_EXPLORER_URL=https://azorescan.com
AZORE_MAINNET_EXPLORER_API_URL=https://azorescan.com/api

# API
API_PORT=3000
```

## Segurança

- Nunca compartilhe suas chaves privadas
- Use HTTPS em produção
- Configure rate limiting
- Valide todos os inputs
- Use o campo `privateKey` apenas em ambiente seguro

## Licença

MIT

---

**Versão**: 0.1.0
**Token Nativo**: AZE (Azore)
