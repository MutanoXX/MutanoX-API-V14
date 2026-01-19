# MutanoX API V14 - Dashboard Premium

Sistema completo de autenticação e monitoramento de API Keys com dashboard moderno, desenvolvido com Next.js 16, TypeScript, Prisma e shadcn/ui.

## 🚀 Funcionalidades

### Sistema de Autenticação por API Keys
- **Gestão de API Keys**: Criar, editar, rotacionar e deletar API Keys
- **Rate Limiting**: Controle de taxa de requisições configurável por API Key
- **Sem rate limit para API Keys válidas**: API Keys autenticadas sem restrições de taxa por padrão
- **Proteção Avançada**: Verificação de User-Agent, timestamp para prevenir replay attacks

### Dashboard Moderno (2026)
- **Login Administrativo**: Autenticação via API Key Admin (`MutanoX3397`)
- **Interface Responsiva**: Design adaptável para mobile e desktop
- **Monitoramento em Tempo Real**: Estatísticas atualizadas automaticamente
- **Dark Mode**: Suporte a tema escuro

### Estatísticas e Monitoramento
- **Cards de Métricas**: API Keys, Total Requisições, Taxa de Sucesso, Tempo Médio
- **Top Endpoints**: Visualização dos endpoints mais utilizados
- **Atividade Recente**: Log das últimas requisições processadas
- **Períodos Configuráveis**: 1h, 24h, 7d, 30d

### API Endpoints

#### Autenticação
Todos os endpoints de API requerem autenticação via header `X-API-Key` ou query parameter `api_key`.

**Exemplo de uso:**
```bash
curl -H "X-API-Key: sua-api-key-aqui" http://localhost:3000/api/dashboard/stats/overview
```

#### Gestão de API Keys
- `GET /api/dashboard/api-keys` - Listar todas as API Keys
- `POST /api/dashboard/api-keys/create` - Criar nova API Key
- `PATCH /api/dashboard/api-keys/[id]` - Atualizar API Key
- `DELETE /api/dashboard/api-keys/[id]` - Deletar API Key
- `POST /api/dashboard/api-keys/[id]/rotate` - Rotacionar API Key

#### Monitoramento
- `GET /api/dashboard/stats/overview?period=24h` - Estatísticas gerais
- `GET /api/dashboard/stats/[id]?period=24h` - Estatísticas de uma API Key específica
- `GET /api/dashboard/logs?page=1&limit=50` - Logs de requisições

#### Exemplos
- `GET /api/examples/protected` - Endpoint de exemplo protegido

## 🔐 Credenciais

- **API Key Admin**: `MutanoX3397` (Para acessar o dashboard)

## 📦 Instalação

```bash
# Instalar dependências
bun install

# Configurar banco de dados
bun run db:push

# Iniciar servidor de desenvolvimento
bun run dev

# Iniciar serviço de tempo real
cd mini-services/realtime-service
bun install
bun run dev
```

## 🏗️ Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── dashboard/
│   │   │   ├── api-keys/       # CRUD de API Keys
│   │   │   ├── stats/          # Estatísticas e monitoramento
│   │   │   └── logs/           # Logs de requisições
│   │   └── examples/
│   │       └── protected/       # Exemplos de endpoints protegidos
│   ├── components/
│   │   ├── Login.tsx           # Componente de login
│   │   └── ui/                # Componentes shadcn/ui
│   ├── layout.tsx
│   └── page.tsx               # Dashboard principal
├── lib/
│   ├── auth/
│   │   ├── api-key.ts          # Funções de API Key
│   │   ├── handlers.ts         # Wrappers de autenticação
│   │   └── middleware.ts      # Middleware de autenticação
│   └── db.ts                 # Cliente Prisma
prisma/
└── schema.prisma              # Schema do banco de dados

mini-services/
└── realtime-service/          # Serviço WebSocket (Socket.IO)
    ├── index.ts
    └── package.json
```

## 🗄️ Banco de Dados

O sistema utiliza **SQLite** com **Prisma ORM**.

### Modelos
- **APIKey**: Gerenciamento de chaves de API
- **ApiLog**: Logs de requisições
- **EndpointUsage**: Estatísticas de uso por endpoint

## 🔒 Segurança

- API Keys armazenadas com hash SHA-256
- Verificação de expiração de chaves
- Proteção contra replay attacks
- Validação de User-Agent
- Rate limiting configurável

## 🌐 Deploy

### Discloud
O projeto está configurado para deployment na Discloud com o arquivo `discloud.config`.

**Configurações:**
```
ID=mutano-x-99
TYPE=site
MAIN=index.js
NAME=MutanoX-Premium
RAM=512
VERSION=latest
AUTORESTART=true
APT=tools
START=node index.js
```

## 📝 Desenvolvimento

### Criar novo endpoint protegido
```typescript
import { authenticatedGET } from '@/lib/auth/handlers';

export async function GET(request: NextRequest) {
  return authenticatedGET(request, async (req, apiKey) => {
    return Response.json({
      message: 'Endpoint protegido!',
      apiKey: apiKey.name,
    });
  });
}
```

### Usar rate limiting customizado
```typescript
import { checkRateLimit } from '@/lib/auth/api-key';

const rateLimit = await checkRateLimit(apiKey.id);
if (!rateLimit.allowed) {
  return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
}
```

## 📄 Licença

© 2026 MutanoXX - Todos os direitos reservados.

---

Desenvolvido com 💜 por MutanoXX em 2026
