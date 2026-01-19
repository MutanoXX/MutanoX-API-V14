# MutanoX-API v14 🚀

API Premium extremamente organizada com múltiplos endpoints para diversos serviços.

## 📋 Índice

- [Características](#características)
- [Instalação](#instalação)
- [Endpoints](#endpoints)
  - [Ferramentas](#ferramentas)
  - [Inteligência Artificial](#inteligência-artificial)
  - [Busca](#busca)
  - [Consultas Brasileiras](#consultas-brasileiras)
- [Configuração](#configuração)
- [Respostas da API](#respostas-da-api)

## ✨ Características

- ✅ API extremamente organizada e estruturada
- ✅ Validação de parâmetros
- ✅ Rate limiting integrado
- ✅ Logs detalhados
- ✅ Tratamento de erros robusto
- ✅ Suporte a streaming em endpoints de IA
- ✅ Validação de CPF brasileiro
- ✅ Múltiplos modelos de IA
- ✅ Fácil deployment no Discloud

## 📦 Instalação

### Localmente

```bash
# Clone o repositório
git clone https://github.com/MutanoXX/MutanoX-API-V14.git
cd MutanoX-API-V14

# Instale as dependências
npm install

# Execute a API
npm start
```

### Discloud

Basta fazer push para o repositório e o Discloud detectará automaticamente o `discloud.config`.

## 🎯 Endpoints

### Ferramentas

#### 1. Bypass Cloudflare

**Endpoint:** `GET /api/tools/bypass`

**Parâmetros:**
- `url` (obrigatório): URL protegida pelo Cloudflare
- `siteKey` (opcional): SiteKey para captcha (padrão: `0x4AAAAAAAdJZmNxW54o-Gvd`)
- `type` (obrigatório): Tipo de captcha/protection
  - Opções: `turnstile-min`, `turnstile-max`, `source`, `waf-session`, `hcaptcha-invisible`, `recaptcha-v3`, `recaptcha-v3-enterprise`
- `proxy` (opcional): Configuração de proxy (formato: `http://user:pass@host:port`)
- `apikey` (opcional): Chave de API (padrão: `freeApikey`)

**Exemplo:**
```bash
curl "http://localhost:3000/api/tools/bypass?url=https://lunaai.video/app&type=turnstile-min&apikey=freeApikey"
```

#### 2. Stalk Discord

**Endpoint:** `GET /api/tools/stalkDiscord`

**Parâmetros:**
- `id` (obrigatório): ID do usuário do Discord
- `apikey` (opcional): Chave de API (padrão: `MutanoX`)

**Exemplo:**
```bash
curl "http://localhost:3000/api/tools/stalkDiscord?id=123456789012345678&apikey=MutanoX"
```

---

### Inteligência Artificial

#### 3. Chat AI

**Endpoint:** `GET /api/ai/chat` ou `POST /api/ai/chat`

**Parâmetros (GET):**
- `question` (obrigatório): Pergunta para a IA
- `messages` (opcional): Array de mensagens para conversa multi-turno
- `model` (opcional): Modelo de IA (padrão: `google/gemini-2.5-flash-lite`)
- `apikey` (opcional): Chave de API (padrão: `freeApikey`)

**Parâmetros (POST - streaming):**
- `question` (obrigatório): Pergunta para a IA
- `messages` (opcional): Array de mensagens
- `model` (opcional): Modelo de IA
- `apikey` (opcional): Chave de API

**Exemplo (GET):**
```bash
curl "http://localhost:3000/api/ai/chat?question=Quem+inventou+a+lâmpada?&apikey=freeApikey"
```

**Exemplo (POST):**
```bash
curl -X POST "http://localhost:3000/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"question":"Como você está hoje?","apikey":"freeApikey"}'
```

#### 4. Perplexity AI

**Endpoint:** `GET /api/ai/perplexity`

**Parâmetros:**
- `prompt` (obrigatório): Prompt para a IA
- `apikey` (opcional): Chave de API (padrão: `freeApikey`)

**Exemplo:**
```bash
curl "http://localhost:3000/api/ai/perplexity?prompt=Quem+é+o+presidente+atual+do+Brasil?&apikey=freeApikey"
```

#### 5. Cici AI

**Endpoint:** `GET /api/ai/cici`

**Parâmetros:**
- `prompt` (obrigatório): Prompt para a IA
- `apikey` (opcional): Chave de API (padrão: `freeApikey`)

**Exemplo:**
```bash
curl "http://localhost:3000/api/ai/cici?prompt=Explique+o+que+é+Python&apikey=freeApikey"
```

#### 6. Felo AI

**Endpoint:** `GET /api/ai/felo`

**Parâmetros:**
- `prompt` (obrigatório): Prompt para a IA
- `apikey` (opcional): Chave de API (padrão: `freeApikey`)

**Exemplo:**
```bash
curl "http://localhost:3000/api/ai/felo?prompt=O+que+é+inteligência+artificial?&apikey=freeApikey"
```

#### 7. Jeeves AI

**Endpoint:** `GET /api/ai/jeeves`

**Parâmetros:**
- `prompt` (obrigatório): Prompt para a IA
- `apikey` (opcional): Chave de API (padrão: `freeApikey`)

**Exemplo:**
```bash
curl "http://localhost:3000/api/ai/jeeves?prompt=Como+funciona+o+blockchain?&apikey=freeApikey"
```

---

### Busca

#### 8. Brainly Search

**Endpoint:** `GET /api/search/brainly`

**Parâmetros:**
- `query` (obrigatório): Termo de busca
- `apikey` (opcional): Chave de API (padrão: `freeApikey`)

**Exemplo:**
```bash
curl "http://localhost:3000/api/search/brainly?query=Qual+é+a+capital+do+Brasil?&apikey=freeApikey"
```

#### 9. Douyin Search

**Endpoint:** `GET /api/search/douyin`

**Parâmetros:**
- `query` (obrigatório): Termo de busca para vídeos Douyin
- `apikey` (opcional): Chave de API (padrão: `freeApikey`)

**Exemplo:**
```bash
curl "http://localhost:3000/api/search/douyin?query=Fifty+Fifty&apikey=freeApikey"
```

#### 10. GitHub Search

**Endpoint:** `GET /api/search/github`

**Parâmetros:**
- `username` (obrigatório): Nome de usuário do GitHub
- `apikey` (opcional): Chave de API (padrão: `freeApikey`)

**Exemplo:**
```bash
curl "http://localhost:3000/api/search/github?username=NajmyW&apikey=freeApikey"
```

#### 11. Google Image Search

**Endpoint:** `GET /api/search/gimage`

**Parâmetros:**
- `query` (obrigatório): Termo de busca de imagens
- `apikey` (opcional): Chave de API (padrão: `freeApikey`)

**Exemplo:**
```bash
curl "http://localhost:3000/api/search/gimage?query=Cat&apikey=freeApikey"
```

---

### Consultas Brasileiras

#### 12. Free Fire Info

**Endpoint:** `GET /api/br/infoff`

**Parâmetros:**
- `id` (obrigatório): ID da conta do Free Fire

**Exemplo:**
```bash
curl "http://localhost:3000/api/br/infoff?id=8082446244"
```

**Estrutura de resposta:**
```json
{
  "success": true,
  "message": "Free Fire account information retrieved successfully",
  "data": {
    "basicInfo": {
      "accountId": "8082446244",
      "nickname": "✿┇ⓋﾠイwԾ9ﾠ⁷⁷",
      "level": 54,
      "rank": 312,
      "region": "BR",
      ...
    },
    "clanBasicInfo": {
      "clanName": "AMAZONAS_REI",
      "clanLevel": 5,
      ...
    },
    ...
  }
}
```

#### 13. Consulta de Telefone

**Endpoint:** `GET /api/br/numero`

**Parâmetros:**
- `q` (obrigatório): Número de telefone (com DDD)

**Exemplo:**
```bash
curl "http://localhost:3000/api/br/numero?q=11999999999"
```

#### 14. Consulta por Nome Completo

**Endpoint:** `GET /api/br/nome-completo`

**Parâmetros:**
- `q` (obrigatório): Nome completo para consulta

**Exemplo:**
```bash
curl "http://localhost:3000/api/br/nome-completo?q=João+Silva"
```

#### 15. Consulta de CPF

**Endpoint:** `GET /api/br/consultarcpf`

**Parâmetros:**
- `cpf` (obrigatório): CPF para consulta (pode ter ou não máscara)

**Exemplo:**
```bash
curl "http://localhost:3000/api/br/consultarcpf?cpf=07803272177"
```

**Estrutura de resposta:**
```json
{
  "success": true,
  "message": "CPF information retrieved successfully",
  "data": {
    "resultado": "🆔 CONSULTA - CPF\n\n👤 DADOS BÁSICOS\n• Nome: SABRINA MILENY SUAREZ VARGAS\n• CPF: 07803272177\n• CNS: 708508301597378\n• Data de Nascimento: 11/05/2010 (15 anos)\n• Sexo: F - FEMININO\n..."
  }
}
```

## ⚙️ Configuração

### Variáveis de Ambiente

- `PORT`: Porta do servidor (padrão: `3000`)

### Discloud Config

O projeto inclui configuração automática para Discloud:

```ini
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

## 📊 Respostas da API

### Formato de Resposta de Sucesso

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Formato de Resposta de Erro

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information",
  "missingFields": ["field1", "field2"]
}
```

### Códigos de Status HTTP

- `200`: Sucesso
- `400`: Bad Request (parâmetros inválidos)
- `404`: Não encontrado
- `429`: Muitas requisições (rate limit)
- `500`: Erro interno do servidor

## 🔒 Segurança

- Rate limiting configurado para 100 requisições por IP a cada 15 minutos
- Validação de entrada de dados
- Sanitização de parâmetros
- Headers de segurança configurados via Helmet

## 🤖 Integração com IA

O endpoint `/api/ai/chat` inclui um prompt de sistema personalizado que ensina a IA a entender e interagir com o sistema MutanoX-API v14, proporcionando respostas mais contextuais e úteis.

## 📝 Notas

- Todos os endpoints de IA suportam parâmetros opcionais como `apikey`
- Consultas brasileiras possuem validação específica (CPF, telefone, etc.)
- O endpoint de chat suporta streaming via método POST para respostas em tempo real
- Logs detalhados são gerados para todas as requisições

## 👨‍💻 Desenvolvido por

**MutanoX** - Versão 14.0.0

---

**Nota de Licença:** Esta API é fornecida "como está", sem garantias. Use com responsabilidade e em conformidade com os termos de serviço das APIs externas utilizadas.
