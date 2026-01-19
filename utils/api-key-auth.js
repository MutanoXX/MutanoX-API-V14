import { db } from '../lib/db.js';

/**
 * MEGA PROMPT: Criar middleware de validação de API Keys

REQUISITOS:
- Validar API Key em cada requisição protegida
- Verificar se a key está ativa
- Verificar rate limit personalizado da key
- Atualizar estatísticas da key
- Log de auditoria no banco de dados
- Bloquear requisições que excedem rate limit
- Não bloquear o sistema se key for inválida

IMPLEMENTAÇÃO:
- Extração de API Key do header X-API-Key
- Validação no banco de dados
- Contagem de requisições por janela de tempo
- Verificação de isActive
- Rate limiting dinâmico por key
- Log automático no banco
- Tratamento de erros sem bloquear sistema
*/

const RATE_LIMIT_WINDOWS = {}; // Contadores por key em janela de 1 minuto

/**
 * Verifica se uma requisição deve ser rate limited baseada na API Key
 */
async function shouldRateLimit(apiKeyId) {
  try {
    // Buscar a API Key
    const apiKey = await db.apiKey.findUnique({
      where: { id: apiKeyId }
    });

    if (!apiKey || !apiKey.isActive) {
      return { shouldLimit: false, reason: null };
    }

    // Inicializar contador se não existir
    if (!RATE_LIMIT_WINDOWS[apiKeyId]) {
      RATE_LIMIT_WINDOWS[apiKeyId] = {
        count: 0,
        windowStart: Date.now(),
        windowEnd: Date.now() + 60000 // 1 minuto
      };
    }

    const window = RATE_LIMIT_WINDOWS[apiKeyId];

    // Verificar se janela expirou, reiniciar se necessário
    if (Date.now() > window.windowEnd) {
      window.count = 0;
      window.windowStart = Date.now();
      window.windowEnd = Date.now() + 60000;
    }

    // Verificar rate limit
    if (window.count >= apiKey.rateLimit) {
      const waitTime = Math.ceil((window.windowEnd - Date.now()) / 1000);
      return {
        shouldLimit: true,
        reason: `Rate limit excedido. Mximo de ${apiKey.rateLimit} requisições por minuto. Tente novamente em ${waitTime} segundos.`,
        retryAfter: window.windowEnd
      };
    }

    // Incrementar contador
    window.count++;

    return { shouldLimit: false, reason: null };
  } catch (error) {
    console.error('Erro ao verificar rate limit:', error);
    return { shouldLimit: false, reason: null };
  }
}

/**
 * Loga uma requisição de API no banco de dados
 */
async function logApiRequest(apiKeyId, endpoint, method, statusCode, responseTime, req) {
  try {
    await db.apiRequestLog.create({
      data: {
        apiKeyId,
        endpoint,
        method,
        statusCode,
        responseTime,
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        success: statusCode >= 200 && statusCode < 400
      }
    });

    // Atualizar lastUsedAt da API Key
    await db.apiKey.update({
      where: { id: apiKeyId },
      data: {
        lastUsedAt: new Date(),
        requestsCount: {
          increment: 1
        }
      }
    });
  } catch (error) {
    console.error('Erro ao logar requisição:', error);
    // Não bloquear a requisição se o log falhar
  }
}

/**
 * Middleware de autenticação por API Key
 * Valida API Keys, aplica rate limiting e log auditoria
 */
export const apiKeyAuthMiddleware = async (req, res, next) => {
  try {
    const startTime = Date.now();

    // Extrair API Key do header X-API-Key
    const apiKeyHeader = req.headers['x-api-key'];

    if (!apiKeyHeader) {
      return res.status(401).json({
        success: false,
        message: 'API Key não fornecida no header X-API-Key',
        error: 'Missing API Key'
      });
    }

    // Buscar API Key no banco de dados
    const apiKey = await db.apiKey.findUnique({
      where: { key: apiKeyHeader }
    });

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API Key inválida',
        error: 'Invalid API Key'
      });
    }

    // Verificar se a key está ativa
    if (!apiKey.isActive) {
      return res.status(403).json({
        success: false,
        message: 'API Key está desativada',
        error: 'Inactive API Key'
      });
    }

    // Verificar rate limit
    const rateLimitCheck = await shouldRateLimit(apiKey.id);

    if (rateLimitCheck.shouldLimit) {
      // Logar tentativa de rate limit
      await logApiRequest(apiKey.id, req.path, req.method, 429, Date.now() - startTime, req);

      return res.status(429).json({
        success: false,
        message: rateLimitCheck.reason,
        error: 'Rate Limit Exceeded',
        retryAfter: rateLimitCheck.retryAfter
      });
    }

    // Adicionar informações da API Key ao request
    req.apiKey = {
      id: apiKey.id,
      name: apiKey.name,
      rateLimit: apiKey.rateLimit,
      createdAt: apiKey.createdAt
    };

    // Prosseguir para o próximo middleware
    next();
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    // Não bloquear o sistema em caso de erro no middleware
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Middleware para logging de requisições (chamado após o processamento)
 * Registra as requisições no banco de dados
 */
export const apiLoggingMiddleware = async (req, res, next) => {
  // Armazenar o tempo de início para logging posterior
  req.startTime = Date.now();

  // Sobrescrever o método res.json para logging
  const originalJson = res.json;
  res.json = function (data) {
    const responseTime = Date.now() - req.startTime;

    // Logar requisição no banco de dados
    if (req.apiKey) {
      logApiRequest(
        req.apiKey.id,
        req.path,
        req.method,
        res.statusCode,
        responseTime,
        req
      ).catch(err => {
        console.error('Erro ao logar:', err);
      });
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Middleware para logging de endpoints de streaming
 * Intercepts res.end para endpoints que usam streaming
 */
export const streamingLoggingMiddleware = (req, res, next) => {
  const startTime = Date.now();

  // Sobrescrever o método res.end
  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    const responseTime = Date.now() - req.startTime;

    // Logar requisição no banco de dados
    if (req.apiKey) {
      logApiRequest(
        req.apiKey.id,
        req.path,
        req.method,
        res.statusCode,
        responseTime,
        req
      ).catch(err => {
        console.error('Erro ao logar:', err);
      });
    }

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

export { RATE_LIMIT_WINDOWS, shouldRateLimit };
