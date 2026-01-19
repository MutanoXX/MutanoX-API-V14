import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger, log } from './utils/logger.js';
import { apiKeyAuthMiddleware, apiLoggingMiddleware, streamingLoggingMiddleware } from './utils/api-key-auth.js';

// Import API Keys endpoints
import { generateApiKey, listApiKeys, revokeApiKey, activateApiKey, deleteApiKey, getApiKeyStats } from './endpoints/api-keys/manage.js';
import { getGlobalStats, clearOldLogs } from './endpoints/api-keys/stats.js';

// Import endpoints
import { bypassCloudflare } from './endpoints/tools/bypass.js';
import { stalkDiscord } from './endpoints/tools/discord.js';

import { getFreeFireInfo } from './endpoints/br/freefire.js';
import { queryPhone } from './endpoints/br/phone.js';
import { queryFullName } from './endpoints/br/name.js';
import { queryCPF } from './endpoints/br/cpf.js';

import { chatAI } from './endpoints/ai/chat.js';
import { perplexityAI } from './endpoints/ai/perplexity.js';
import { ciciAI } from './endpoints/ai/cici.js';
import { feloAI } from './endpoints/ai/felo.js';
import { jeevesAI } from './endpoints/ai/jeeves.js';

import { brainlySearch } from './endpoints/search/brainly.js';
import { douyinSearch } from './endpoints/search/douyin.js';
import { githubSearch } from './endpoints/search/github.js';
import { googleImageSearch } from './endpoints/search/gimage.js';

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Security middlewares
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// API Logging middleware - Registra requisições de endpoints normais
app.use(apiLoggingMiddleware);

// Dashboard logging middleware - Logs todas as requisições para o dashboard em tempo real
app.use(loggingMiddleware);

// Rate limiting global (para requisições sem API Key válida)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

app.use('/api/', limiter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'MutanoX-API v14',
    version: '14.0.0',
    description: 'Premium API with multiple endpoints for various services',
    author: 'MutanoX',
    authentication: {
      type: 'API Key',
      required: true,
      headerName: 'X-API-Key',
      documentation: '/api/api-keys/docs'
    },
    endpoints: {
      apiKeys: {
        'POST /api/api-keys/generate': 'Gerar nova API Key',
        'GET /api/api-keys/list': 'Listar todas as API Keys',
        'POST /api/api-keys/revoke/:keyId': 'Revogar API Key',
        'POST /api/api-keys/activate/:keyId': 'Ativar API Key',
        'DELETE /api/api-keys/delete/:keyId': 'Deletar API Key',
        'GET /api/api-keys/stats/:keyId': 'Estatísticas da API Key',
        'GET /api/api-keys/global-stats': 'Estatísticas globais',
        'DELETE /api/api-keys/clear-logs': 'Limpar logs antigos'
      },
      tools: {
        '/api/tools/bypass': 'Cloudflare Bypass',
        '/api/tools/stalkDiscord': 'Discord User Stalk'
      },
      ai: {
        '/api/ai/chat': 'AI Chat (GET/POST)',
        '/api/ai/perplexity': 'Perplexity AI',
        '/api/ai/cici': 'Cici AI',
        '/api/ai/felo': 'Felo AI',
        '/api/ai/jeeves': 'Jeeves AI'
      },
      search: {
        '/api/search/brainly': 'Brainly Search',
        '/api/search/douyin': 'Douyin Search',
        '/api/search/github': 'GitHub User Search',
        '/api/search/gimage': 'Google Image Search'
      },
      br: {
        '/api/br/infoff': 'Free Fire Info',
        '/api/br/numero': 'Phone Number Query',
        '/api/br/nome-completo': 'Full Name Query',
        '/api/br/consultarcpf': 'CPF Query'
      }
    },
    documentation: 'See README.md for detailed documentation'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ==================== API KEYS ENDPOINTS ====================

// Gerar nova API Key
app.post('/api/api-keys/generate', apiKeyAuthMiddleware, generateApiKey);

// Listar todas as API Keys
app.get('/api/api-keys/list', apiKeyAuthMiddleware, listApiKeys);

// Revogar API Key
app.post('/api/api-keys/revoke/:keyId', apiKeyAuthMiddleware, revokeApiKey);

// Ativar API Key
app.post('/api/api-keys/activate/:keyId', apiKeyAuthMiddleware, activateApiKey);

// Deletar API Key
app.delete('/api/api-keys/delete/:keyId', apiKeyAuthMiddleware, deleteApiKey);

// Estatísticas de uma API Key específica
app.get('/api/api-keys/stats/:keyId', apiKeyAuthMiddleware, getApiKeyStats);

// Estatísticas globais
app.get('/api/api-keys/global-stats', apiKeyAuthMiddleware, getGlobalStats);

// Limpar logs antigos
app.delete('/api/api-keys/clear-logs', apiKeyAuthMiddleware, clearOldLogs);

// ==================== TOOLS ENDPOINTS ====================

// Cloudflare Bypass
app.get('/api/tools/bypass', apiKeyAuthMiddleware, bypassCloudflare);

// Discord Stalk
app.get('/api/tools/stalkDiscord', apiKeyAuthMiddleware, stalkDiscord);

// ==================== AI ENDPOINTS ====================

// AI Chat (GET and POST for streaming)
app.get('/api/ai/chat', apiKeyAuthMiddleware, chatAI);
app.post('/api/ai/chat', apiKeyAuthMiddleware, chatAI);

// Perplexity AI
app.get('/api/ai/perplexity', apiKeyAuthMiddleware, perplexityAI);

// Cici AI
app.get('/api/ai/cici', apiKeyAuthMiddleware, ciciAI);

// Felo AI
app.get('/api/ai/felo', apiKeyAuthMiddleware, feloAI);

// Jeeves AI
app.get('/api/ai/jeeves', apiKeyAuthMiddleware, jeevesAI);

// ==================== SEARCH ENDPOINTS ====================

// Brainly Search
app.get('/api/search/brainly', apiKeyAuthMiddleware, brainlySearch);

// Douyin Search
app.get('/api/search/douyin', apiKeyAuthMiddleware, douyinSearch);

// GitHub Search
app.get('/api/search/github', apiKeyAuthMiddleware, githubSearch);

// Google Image Search
app.get('/api/search/gimage', apiKeyAuthMiddleware, googleImageSearch);

// ==================== BRAZIL ENDPOINTS ====================

// Free Fire Info
app.get('/api/br/infoff', apiKeyAuthMiddleware, getFreeFireInfo);

// Phone Number Query
app.get('/api/br/numero', apiKeyAuthMiddleware, queryPhone);

// Full Name Query
app.get('/api/br/nome-completo', apiKeyAuthMiddleware, queryFullName);

// CPF Query
app.get('/api/br/consultarcpf', apiKeyAuthMiddleware, queryCPF);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    availableEndpoints: '/health, /api/api-keys/*',
    documentation: 'See README.md for detailed documentation'
  });
});

// Error handler
app.use((err, req, res, next) => {
  log.error('Unhandled error', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// Start server
app.listen(PORT, () => {
  log.info(`🚀 MutanoX-API v14 running on port ${PORT}`);
  log.info(`📚 Documentation available at http://localhost:${PORT}/`);
  log.info(`🔑 Sistema de autenticação: API Keys ativado`);
});

export default app;
