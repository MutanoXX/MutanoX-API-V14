# MutanoX API V14 - Sistema de Autenticação por API Keys

Sistema completo de autenticação e monitoramento de API Keys com dashboard moderno para gestão e controle.

## 🚀 Funcionalidades

- ✅ Autenticação de endpoints por API Keys
- ✅ Rate limiting condicional (sem limite para API Keys válidas)
- ✅ Dashboard moderno para gestão de API Keys
- ✅ Monitoramento em tempo real de requisições
- ✅ Estatísticas detalhadas de uso
- ✅ Proteção avançada para endpoints em tempo real (WebSocket)
- ✅ Logs completos de requisições
- ✅ Interface moderna com shadcn/ui

## 📋 Pré-requisitos

- Node.js 18+ ou Bun
- Next.js 16
- Prisma
- SQLite (configurado por padrão)

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone https://github.com/MutanoXX/MutanoX-API-V14.git
cd MutanoX-API-V14
```

2. Instale as dependências:
```bash
bun install
# ou
npm install
```

3. Configure o banco de dados:
```bash
bun run db:push
```

4. Inicie o servidor de desenvolvimento:
```bash
bun run dev
```

5. Acesse o dashboard em: `http://localhost:3000`

## 📊 Dashboard

O dashboard permite:

- **Visão Geral**: Estatísticas globais da API
- **API Keys**: Criar, editar, ativar/desativar e deletar API Keys
- **Logs**: Visualizar histórico completo de requisições
- **Configurações**: Ajustar parâmetros do sistema

### Criar uma API Key

1. Acesse o dashboard em `http://localhost:3000`
2. Clique em "Nova API Key"
3. Preencha o nome e configure o rate limit (opcional)
4. Clique em "Criar API Key"
5. **Importante**: Copie a API Key gerada, pois ela será exibida apenas uma vez

## 🔐 Autenticação por API Key

### Header de Autenticação

Use o header `X-API-Key` para autenticar suas requisições:

```bash
curl -H "X-API-Key: sua-chave-aqui" http://localhost:3000/api/examples/protected
```

### Query Parameter

Também é possível usar o query parameter `api_key`:

```bash
curl "http://localhost:3000/api/examples/protected?api_key=sua-chave-aqui"
```

### Exemplo de Requisição

```javascript
const response = await fetch('http://localhost:3000/api/examples/protected', {
  headers: {
    'X-API-Key': 'sua-chave-aqui',
  },
});

const data = await response.json();
console.log(data);
```

## 🔄 Rate Limiting

O sistema implementa rate limiting condicional:

- **API Keys válidas**: Sem rate limit por padrão (ilimitado)
- **Rate limit habilitado**: Limite configurável por hora
- **Sem rate limit**: Requisições ilimitadas para API Keys ativas

### Configurar Rate Limit

Ao criar uma API Key, você pode habilitar o rate limit:

```json
{
  "name": "App Produção",
  "rateLimitEnabled": true,
  "rateLimitPerHour": 1000
}
```

## 📡 WebSocket (Tempo Real)

O serviço de WebSocket roda na porta 3003 e oferece proteção avançada:

### Conectar ao WebSocket

```javascript
const io = require('socket.io-client');

const socket = io('/', {
  path: '/',
  query: {
    XTransformPort: 3003
  },
  auth: {
    apiKey: 'sua-chave-aqui',
    timestamp: Date.now()
  }
});

socket.on('connect', () => {
  console.log('Conectado ao WebSocket!');
});

socket.on('message', (data) => {
  console.log('Mensagem recebida:', data);
});
```

### Iniciar o Serviço WebSocket

```bash
cd mini-services/realtime-service
bun install
bun run dev
```

## 📡 API Endpoints

### Dashboard

- `GET /api/dashboard/stats/overview` - Estatísticas gerais
- `GET /api/dashboard/stats/[id]` - Estatísticas de uma API Key específica
- `GET /api/dashboard/api-keys` - Listar todas as API Keys
- `POST /api/dashboard/api-keys/create` - Criar nova API Key
- `PATCH /api/dashboard/api-keys/[id]` - Atualizar API Key
- `DELETE /api/dashboard/api-keys/[id]` - Deletar API Key
- `POST /api/dashboard/api-keys/[id]/rotate` - Rotacionar API Key
- `GET /api/dashboard/logs` - Buscar logs de requisições

### Exemplos

- `GET /api/examples/protected` - Endpoint protegido de exemplo
- `POST /api/examples/protected` - Endpoint POST protegido de exemplo

## 🛡️ Proteção Avançada

Para endpoints em tempo real, o sistema implementa:

- Validação de User-Agent
- Verificação de timestamp (previne replay attacks)
- Rate limit por sessão
- Monitoramento de IP
- Logs detalhados de conexões

## 📊 Monitoramento

### Estatísticas Disponíveis

- Total de requisições
- Taxa de sucesso
- Tempo médio de resposta
- Top endpoints utilizados
- Erros por endpoint
- IPs mais comuns
- Atividade em tempo real

### Visualização

O dashboard oferece visualizações em tempo real com:

- Cards de estatísticas
- Tabelas de API Keys
- Gráficos de uso
- Logs de requisições
- Atividade recente

## 🔧 Desenvolvimento

### Estrutura do Projeto

```
src/
├── lib/
│   ├── auth/
│   │   ├── api-key.ts       # Funções de autenticação de API Key
│   │   ├── middleware.ts    # Middleware de autenticação
│   │   └── handlers.ts      # Wrappers para rotas
├── app/
│   ├── api/
│   │   ├── dashboard/       # Endpoints do dashboard
│   │   └── examples/        # Endpoints de exemplo
│   └── page.tsx             # Dashboard frontend
└── prisma/
    └── schema.prisma        # Schema do banco de dados

mini-services/
└── realtime-service/        # Serviço WebSocket
```

### Adicionar Autenticação a um Endpoint

```typescript
import { NextRequest } from 'next/server';
import { authenticatedGET } from '@/lib/auth/handlers';

export async function GET(request: NextRequest) {
  return authenticatedGET(request, async (req, apiKey) => {
    // Seu código aqui
    // apiKey contém os dados da API Key autenticada
    
    return Response.json({
      success: true,
      data: { message: 'Autenticado!' }
    });
  });
}
```

### Middleware Customizado

```typescript
import { withAPIAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return withAPIAuth(request, async (req, apiKey) => {
    // Seu código aqui
    return Response.json({ success: true });
  }, {
    requireAuth: true,
    bypassRateLimit: false
  });
}
```

## 📝 Schema do Banco de Dados

O sistema utiliza os seguintes modelos:

### APIKey
- ID, nome, hash da chave
- Prefixo para exibição
- Status (ativo/inativo)
- Configurações de rate limit
- Estatísticas de uso
- Data de expiração

### ApiLog
- ID, API Key
- Endpoint, método, status code
- Tempo de resposta
- IP, User-Agent
- Timestamp

### EndpointUsage
- ID, API Key
- Endpoint
- Contagem de requisições
- Contagem de erros
- Tempo total de resposta

## 🔒 Segurança

- API Keys são armazenadas como hash SHA-256
- Chaves completas são exibidas apenas na criação/rotação
- Logs de IP e User-Agent para auditoria
- Rate limit por IP quando configurado
- Proteção contra replay attacks em WebSocket
- Validação de timestamp em tempo real

## 📈 Performance

- Sistema otimizado com Prisma
- Cache em memória para verificações frequentes
- Logs assíncronos para não bloquear requisições
- Consultas otimizadas com índices

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 👨‍💻 Autor

MutanoXX - [GitHub](https://github.com/MutanoXX)

## 🙏 Agradecimentos

- Next.js
- Prisma
- shadcn/ui
- Socket.IO
