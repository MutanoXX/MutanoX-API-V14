import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import crypto from 'crypto';

const PORT = 3003;

// Armazenamento em memória de sessões ativas (em produção, usar Redis)
const activeSessions = new Map<string, { apiKey: string; connectedAt: number }>();

// Função para fazer hash da API Key (igual ao backend)
function hashAPIKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

// Base de dados simulada de API Keys (em produção, conectar ao Prisma)
const apiKeysDatabase = new Map<string, {
  keyHash: string;
  name: string;
  isActive: boolean;
  rateLimitEnabled: boolean;
  rateLimitPerHour: number | null;
}>();

// Função para verificar API Key
function verifyAPIKey(apiKey: string) {
  if (!apiKey) return null;

  const hash = hashAPIKey(apiKey);
  return apiKeysDatabase.get(hash) || null;
}

// Função para verificar rate limit
function checkRateLimit(apiKeyHash: string, sessionId: string): boolean {
  const apiKeyData = apiKeysDatabase.get(apiKeyHash);
  if (!apiKeyData) return false;

  // Se rate limit não está habilitado, permite tudo
  if (!apiKeyData.rateLimitEnabled || !apiKeyData.rateLimitPerHour) {
    return true;
  }

  // Em produção, usar Redis para contar requisições por hora
  // Aqui simplificamos com contador em memória por sessão
  const session = activeSessions.get(sessionId);
  if (!session) return true;

  // Simplificado: verificar se a sessão está ativa há menos de 1 hora
  const oneHour = 60 * 60 * 1000;
  const activeTime = Date.now() - session.connectedAt;

  return activeTime < oneHour;
}

// Criar servidor HTTP
const httpServer = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('MutanoX Realtime Service - WebSocket endpoint');
});

// Criar servidor Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// Middleware de autenticação para Socket.IO
io.use(async (socket, next) => {
  try {
    const apiKey = socket.handshake.auth.apiKey || socket.handshake.headers['x-api-key'];

    if (!apiKey) {
      console.log('❌ WebSocket connection rejected: No API Key provided');
      return next(new Error('API Key is required'));
    }

    // Verificar API Key
    const apiKeyData = verifyAPIKey(apiKey);

    if (!apiKeyData) {
      console.log('❌ WebSocket connection rejected: Invalid API Key');
      return next(new Error('Invalid API Key'));
    }

    // Verificar se a chave está ativa
    if (!apiKeyData.isActive) {
      console.log(`❌ WebSocket connection rejected: API Key inactive (${apiKeyData.name})`);
      return next(new Error('API Key is inactive'));
    }

    // Verificar User-Agent
    const userAgent = socket.handshake.headers['user-agent'];
    if (!userAgent || userAgent.length < 10) {
      console.log('❌ WebSocket connection rejected: Invalid User-Agent');
      return next(new Error('Invalid User-Agent'));
    }

    // Verificar timestamp para prevenir replay attacks
    const timestamp = socket.handshake.auth.timestamp;
    if (timestamp) {
      const requestTime = parseInt(timestamp, 10);
      const now = Date.now();
      const timeDiff = Math.abs(now - requestTime);

      // Rejeitar requisições com mais de 5 minutos de diferença
      if (timeDiff > 300000) {
        console.log('❌ WebSocket connection rejected: Timestamp too old');
        return next(new Error('Request timestamp too old'));
      }
    }

    // Verificar rate limit
    const apiKeyHash = hashAPIKey(apiKey);
    if (!checkRateLimit(apiKeyHash, socket.id)) {
      console.log('❌ WebSocket connection rejected: Rate limit exceeded');
      return next(new Error('Rate limit exceeded'));
    }

    // Adicionar dados da API Key ao socket
    socket.data.apiKey = apiKey;
    socket.data.apiKeyData = apiKeyData;
    socket.data.apiKeyHash = apiKeyHash;

    console.log(`✅ WebSocket connection authenticated: ${apiKeyData.name}`);

    next();
  } catch (error) {
    console.error('❌ WebSocket authentication error:', error);
    next(new Error('Authentication failed'));
  }
});

// Handler de conexão
io.on('connection', (socket) => {
  const sessionId = socket.id;
  const apiKeyData = socket.data.apiKeyData;

  console.log(`🔗 Client connected: ${sessionId} (${apiKeyData.name})`);

  // Registrar sessão ativa
  activeSessions.set(sessionId, {
    apiKey: socket.data.apiKey,
    connectedAt: Date.now(),
  });

  // Enviar mensagem de boas-vindas
  socket.emit('connected', {
    message: 'Connected to MutanoX Realtime Service',
    sessionId,
    timestamp: Date.now(),
  });

  // Handler para assinar canais
  socket.on('subscribe', (data: { channels: string[] }) => {
    console.log(`📢 Client ${sessionId} subscribed to:`, data.channels);

    data.channels.forEach((channel) => {
      socket.join(channel);
    });

    socket.emit('subscribed', {
      channels: data.channels,
      timestamp: Date.now(),
    });
  });

  // Handler para cancelar assinatura de canais
  socket.on('unsubscribe', (data: { channels: string[] }) => {
    console.log(`🚫 Client ${sessionId} unsubscribed from:`, data.channels);

    data.channels.forEach((channel) => {
      socket.leave(channel);
    });

    socket.emit('unsubscribed', {
      channels: data.channels,
      timestamp: Date.now(),
    });
  });

  // Handler para enviar mensagens para canais
  socket.on('broadcast', (data: { channel: string; message: any }) => {
    console.log(`📤 Broadcasting to ${data.channel}:`, data.message);

    // Broadcast para todos os clientes no canal (exceto o remetente)
    socket.to(data.channel).emit('message', {
      channel: data.channel,
      message: data.message,
      from: sessionId,
      timestamp: Date.now(),
    });

    // Confirmar ao remetente
    socket.emit('broadcasted', {
      channel: data.channel,
      timestamp: Date.now(),
    });
  });

  // Handler de ping/pong para manter conexão ativa
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });

  // Handler de desconexão
  socket.on('disconnect', (reason) => {
    console.log(`🔌 Client disconnected: ${sessionId} (${reason})`);

    // Remover sessão ativa
    activeSessions.delete(sessionId);

    // Notificar outros clientes sobre a desconexão
    socket.broadcast.emit('user_disconnected', {
      sessionId,
      timestamp: Date.now(),
    });
  });

  // Handler de erro
  socket.on('error', (error) => {
    console.error(`❌ Socket error for ${sessionId}:`, error);
  });
});

// Endpoint REST para enviar mensagens para canais (protegido por API Key)
httpServer.on('request', async (req, res) => {
  if (req.url?.startsWith('/api/broadcast')) {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API Key is required' }));
      return;
    }

    const apiKeyData = verifyAPIKey(apiKey);

    if (!apiKeyData || !apiKeyData.isActive) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid or inactive API Key' }));
      return;
    }

    // Apenas método POST é permitido
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    // Ler corpo da requisição
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { channel, message } = data;

        if (!channel || !message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'channel and message are required' }));
          return;
        }

        // Broadcast para o canal
        io.to(channel).emit('message', {
          channel,
          message,
          timestamp: Date.now(),
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Message broadcasted',
          channel,
          recipients: io.sockets.adapter.rooms.get(channel)?.size || 0,
        }));
      } catch (error) {
        console.error('Error processing broadcast:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
  }
});

// Iniciar servidor
httpServer.listen(PORT, () => {
  console.log('🚀 MutanoX Realtime Service running on port', PORT);
  console.log('📡 WebSocket endpoint: ws://localhost:' + PORT);
  console.log('🔐 Authentication: API Key required (X-API-Key header)');
  console.log('');
  console.log('⚠️  NOTE: Add API Keys to the database via dashboard before testing');
});

// Tratamento de erros do servidor
httpServer.on('error', (error) => {
  console.error('❌ Server error:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  io.close(() => {
    console.log('✅ Socket.IO server closed');
    httpServer.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  io.close(() => {
    console.log('✅ Socket.IO server closed');
    httpServer.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  });
});
