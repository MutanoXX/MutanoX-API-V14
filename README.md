# MutanoX API V14

[![Version](https://img.shields.io/badge/version-14.0.0-blue)](https://github.com/MutanoXX/MutanoX-API-V14)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red)](LICENSE)

Sistema completo de autenticação e monitoramento de API Keys com dashboard moderno. Desenvolvido com Next.js 16, TypeScript, Prisma e shadcn/ui.

## ✨ Características

- 🔐 Sistema de autenticação por API Keys
- 📊 Dashboard moderno com monitoramento em tempo real
- ⚡ Rate limiting configurável por API Key
- 🛡️ Proteção avançada sem JWT
- 📈 Estatísticas detalhadas de uso
- 🔄 Rotacionamento automático de API Keys
- 🎨 Interface responsiva com Dark Mode
- 🌐 Suporte a WebSocket (Socket.IO)

## 🚀 Quick Start

```bash
# Clonar repositório
git clone https://github.com/MutanoXX/MutanoX-API-V14.git
cd MutanoX-API-V14

# Instalar dependências
bun install

# Configurar banco de dados
bun run db:push

# Iniciar servidor
bun run dev
```

## 🔑 Acesso ao Dashboard

Acesse `http://localhost:3000` e use a API Key Admin:

```
API Key Admin: MutanoX3397
```

## 📖 Documentação Completa

Para documentação completa da API, veja [API-README.md](./API-README.md)

### Principais Endpoints

#### Gestão de API Keys
- `GET /api/dashboard/api-keys` - Listar API Keys
- `POST /api/dashboard/api-keys/create` - Criar API Key
- `PATCH /api/dashboard/api-keys/[id]` - Atualizar API Key
- `DELETE /api/dashboard/api-keys/[id]` - Deletar API Key
- `POST /api/dashboard/api-keys/[id]/rotate` - Rotacionar API Key

#### Monitoramento
- `GET /api/dashboard/stats/overview` - Estatísticas gerais
- `GET /api/dashboard/stats/[id]` - Estatísticas por API Key
- `GET /api/dashboard/logs` - Logs de requisições

## 🏗️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Linguagem**: TypeScript 5
- **UI**: shadcn/ui + Tailwind CSS 4
- **Banco de Dados**: SQLite + Prisma ORM
- **Real-time**: Socket.IO
- **Deploy**: Discloud

## 🔒 Segurança

- API Keys armazenadas com hash SHA-256
- Validação de User-Agent e timestamp
- Proteção contra replay attacks
- Rate limiting configurável
- Logs detalhados de requisições

## 📦 Deploy

### Discloud

O projeto está configurado para deployment automático na Discloud através do arquivo `discloud.config`.

## 📄 Licença

© 2026 MutanoXX - Todos os direitos reservados.

## 🤝 Contribuições

Este é um projeto proprietário. Entre em contato com MutanoXX para mais informações.

---

Desenvolvido com 💜 por MutanoXX em 2026
