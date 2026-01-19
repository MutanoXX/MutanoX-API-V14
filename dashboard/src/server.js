import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { verifyToken } from '../../utils/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = 3003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, '../public')));

// Armazenamento de métricas em tempo real
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  endpoints: {},
  recentRequests: [],
  activeConnections: 0,
  responseTimeHistory: [],
  hourlyRequests: {}
};

// Endpoints disponíveis na API
const availableEndpoints = {
  tools: [
    { path: '/api/tools/bypass', method: 'GET', description: 'Cloudflare Bypass', params: ['url', 'type', 'apikey'] },
    { path: '/api/tools/stalkDiscord', method: 'GET', description: 'Discord Stalk', params: ['id', 'apikey'] }
  ],
  ai: [
    { path: '/api/ai/chat', method: 'GET/POST', description: 'Chat AI', params: ['question', 'model', 'apikey'] },
    { path: '/api/ai/perplexity', method: 'GET', description: 'Perplexity AI', params: ['prompt', 'apikey'] },
    { path: '/api/ai/cici', method: 'GET', description: 'Cici AI', params: ['prompt', 'apikey'] },
    { path: '/api/ai/felo', method: 'GET', description: 'Felo AI', params: ['prompt', 'apikey'] },
    { path: '/api/ai/jeeves', method: 'GET', description: 'Jeeves AI', params: ['prompt', 'apikey'] }
  ],
  search: [
    { path: '/api/search/brainly', method: 'GET', description: 'Brainly Search', params: ['query', 'apikey'] },
    { path: '/api/search/douyin', method: 'GET', description: 'Douyin Search', params: ['query', 'apikey'] },
    { path: '/api/search/github', method: 'GET', description: 'GitHub Search', params: ['username', 'apikey'] },
    { path: '/api/search/gimage', method: 'GET', description: 'Google Image Search', params: ['query', 'apikey'] }
  ],
  br: [
    { path: '/api/br/infoff', method: 'GET', description: 'Free Fire Info', params: ['id'] },
    { path: '/api/br/numero', method: 'GET', description: 'Phone Query', params: ['q'] },
    { path: '/api/br/nome-completo', method: 'GET', description: 'Name Query', params: ['q'] },
    { path: '/api/br/consultarcpf', method: 'GET', description: 'CPF Query', params: ['cpf'] }
  ]
};

// Função para registrar métricas de requisição
function recordRequest(endpoint, method, statusCode, responseTime, requestData) {
  const now = new Date();
  const hour = now.getHours();
  const timestamp = now.toISOString();

  // Atualizar contadores gerais
  metrics.totalRequests++;
  if (statusCode >= 200 && statusCode < 400) {
    metrics.successfulRequests++;
  } else {
    metrics.failedRequests++;
  }

  // Atualizar métricas por endpoint
  if (!metrics.endpoints[endpoint]) {
    metrics.endpoints[endpoint] = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastRequest: null,
      hourlyRequests: {}
    };
  }

  const endpointMetrics = metrics.endpoints[endpoint];
  endpointMetrics.totalRequests++;
  endpointMetrics.lastRequest = timestamp;

  if (statusCode >= 200 && statusCode < 400) {
    endpointMetrics.successfulRequests++;
  } else {
    endpointMetrics.failedRequests++;
  }

  // Calcular média de tempo de resposta
  const totalRequests = endpointMetrics.totalRequests;
  const currentAvg = endpointMetrics.averageResponseTime;
  endpointMetrics.averageResponseTime = (currentAvg * (totalRequests - 1) + responseTime) / totalRequests;

  // Atualizar requisições por hora
  if (!endpointMetrics.hourlyRequests[hour]) {
    endpointMetrics.hourlyRequests[hour] = 0;
  }
  endpointMetrics.hourlyRequests[hour]++;

  if (!metrics.hourlyRequests[hour]) {
    metrics.hourlyRequests[hour] = 0;
  }
  metrics.hourlyRequests[hour]++;

  // Adicionar ao histórico de tempo de resposta
  metrics.responseTimeHistory.push({
    timestamp,
    responseTime,
    endpoint,
    statusCode
  });

  // Manter apenas os últimos 1000 registros
  if (metrics.responseTimeHistory.length > 1000) {
    metrics.responseTimeHistory.shift();
  }

  // Adicionar às requisições recentes
  metrics.recentRequests.unshift({
    timestamp,
    endpoint,
    method,
    statusCode,
    responseTime,
    requestData: {
      ...requestData,
      apikey: requestData.apikey ? '***HIDDEN***' : undefined
    }
  });

  // Manter apenas as últimas 50 requisições
  if (metrics.recentRequests.length > 50) {
    metrics.recentRequests.pop();
  }

  // Emitir atualização para clientes conectados
  io.emit('metrics:update', {
    endpoint,
    metrics: {
      totalRequests: metrics.totalRequests,
      successfulRequests: metrics.successfulRequests,
      failedRequests: metrics.failedRequests,
      activeConnections: metrics.activeConnections
    },
    endpointMetrics: endpointMetrics
  });
}

// API endpoint para registrar requisições da API principal
app.post('/api/log-request', (req, res) => {
  const { endpoint, method, statusCode, responseTime, requestData } = req.body;

  if (endpoint && method && statusCode) {
    recordRequest(endpoint, method, statusCode, responseTime, requestData);
    res.json({ success: true, message: 'Request logged successfully' });
  } else {
    res.status(400).json({ success: false, message: 'Missing required fields' });
  }
});

// API endpoint para obter métricas atuais
app.get('/api/metrics', (req, res) => {
  res.json(metrics);
});

// API endpoint para obter endpoints disponíveis
app.get('/api/endpoints', (req, res) => {
  res.json(availableEndpoints);
});

// Socket.io connection handling
io.use((socket, next) => {
  try {
    // Verificar token na conexão WebSocket
    const auth = socket.handshake.auth;
    const token = auth.token;

    if (!token) {
      return next(new Error('Token de autenticação não fornecido'));
    }

    // Verificar token
    const verification = verifyToken(token);

    if (!verification.valid) {
      return next(new Error('Token inválido ou expirado'));
    }

    // Adicionar informações do usuário ao socket
    socket.user = verification.decoded;
    console.log(`✅ Usuário autenticado: ${verification.decoded.username}`);
    next();
  } catch (error) {
    console.error('Erro na autenticação WebSocket:', error);
    next(error);
  }
});

io.on('connection', (socket) => {
  metrics.activeConnections++;
  console.log(`Client connected. Total connections: ${metrics.activeConnections}`);

  // Enviar métricas iniciais
  socket.emit('metrics:initial', metrics);

  socket.on('disconnect', () => {
    metrics.activeConnections--;
    console.log(`Client disconnected. Total connections: ${metrics.activeConnections}`);
    io.emit('connection:update', { activeConnections: metrics.activeConnections });
  });

  // Enviar dados de um endpoint específico
  socket.on('get:endpoint-details', (endpoint) => {
    socket.emit('endpoint:details', {
      endpoint,
      metrics: metrics.endpoints[endpoint] || null
    });
  });

  // Limpar histórico
  socket.on('clear:history', () => {
    metrics.recentRequests = [];
    metrics.responseTimeHistory = [];
    io.emit('history:cleared');
  });
});

// Enviar atualizações periódicas para gráficos
setInterval(() => {
  io.emit('dashboard:update', {
    timestamp: new Date().toISOString(),
    totalRequests: metrics.totalRequests,
    successRate: metrics.totalRequests > 0
      ? ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2)
      : 0,
    activeConnections: metrics.activeConnections,
    hourlyData: metrics.hourlyRequests,
    endpointMetrics: metrics.endpoints
  });
}, 1000);

httpServer.listen(PORT, () => {
  console.log(`🚀 API Dashboard Server running on port ${PORT}`);
  console.log(`📊 Dashboard available at http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server ready for connections`);
});

export { app, io, metrics };
