import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger, log } from './utils/logger.js';
import { loggingMiddleware } from './utils/dashboard-logger.js';
import { authMiddleware, optionalAuthMiddleware } from './utils/auth.js';

// Import auth endpoints
import { login, verifyTokenEndpoint, logout } from './endpoints/auth/login.js';

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

// Dashboard logging middleware - Logs todas as requisições para o dashboard em tempo real
// Nota: Este middleware é aplicado globalmente. Para logar apenas endpoints /api/*,
// mova esta linha depois da definição dos endpoints de sistema (/health, /)
app.use(loggingMiddleware);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

// Rate limiting específico para login (mais restrito)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login attempts per windowMs
  message: {
    success: false,
    message: 'Muitas tentativas de login. Tente novamente mais tarde.'
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
      required: true,
      loginEndpoint: '/api/auth/login',
      method: 'POST',
      credentials: {
        username: 'ADMIN',
        password: 'MutanoX3397'
      }
    },
    endpoints: {
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
    auth: {
      '/api/auth/login': 'Login (POST)',
      '/api/auth/verify': 'Verify Token (POST)',
      '/api/auth/logout': 'Logout (POST)'
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

// ==================== AUTH ENDPOINTS ====================

// Login - Sem autenticação requerida
app.post('/api/auth/login', loginLimiter, login);

// Verify Token - Sem autenticação requerida
app.post('/api/auth/verify', verifyTokenEndpoint);

// Logout - Requer autenticação
app.post('/api/auth/logout', authMiddleware, logout);

// ==================== TOOLS ENDPOINTS ====================

// Cloudflare Bypass
app.get('/api/tools/bypass', authMiddleware, bypassCloudflare);

// Discord Stalk
app.get('/api/tools/stalkDiscord', authMiddleware, stalkDiscord);

// ==================== AI ENDPOINTS ====================

// AI Chat (GET and POST for streaming)
app.get('/api/ai/chat', authMiddleware, chatAI);
app.post('/api/ai/chat', authMiddleware, chatAI);

// Perplexity AI
app.get('/api/ai/perplexity', authMiddleware, perplexityAI);

// Cici AI
app.get('/api/ai/cici', authMiddleware, ciciAI);

// Felo AI
app.get('/api/ai/felo', authMiddleware, feloAI);

// Jeeves AI
app.get('/api/ai/jeeves', authMiddleware, jeevesAI);

// ==================== SEARCH ENDPOINTS ====================

// Brainly Search
app.get('/api/search/brainly', authMiddleware, brainlySearch);

// Douyin Search
app.get('/api/search/douyin', authMiddleware, douyinSearch);

// GitHub Search
app.get('/api/search/github', authMiddleware, githubSearch);

// Google Image Search
app.get('/api/search/gimage', authMiddleware, googleImageSearch);

// ==================== BRAZIL ENDPOINTS ====================

// Free Fire Info
app.get('/api/br/infoff', authMiddleware, getFreeFireInfo);

// Phone Number Query
app.get('/api/br/numero', authMiddleware, queryPhone);

// Full Name Query
app.get('/api/br/nome-completo', authMiddleware, queryFullName);

// CPF Query
app.get('/api/br/consultarcpf', authMiddleware, queryCPF);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    availableEndpoints: '/health',
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
});

export default app;
