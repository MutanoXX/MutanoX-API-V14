import { validateApiKey, incrementUsage } from './apiKeys.js';
import { errorResponse } from './response.js';

/**
 * MEGA PROMPT: Criar middleware de autenticação com API Keys

REQUISITOS:
- Validar API Keys em cada requisição protegida
- Extrair API Key do header (X-API-Key)
- Verificar se chave está ativa e não expirada
- Rastrear uso de cada chave (incrementar contador)
- Verificar rate limit por chave (não global)
- Desbloquear requisições para chaves válidas
- Retornar informações da chave para o endpoint
- Tratar erros de forma clara

IMPLEMENTAÇÃO:
- authMiddleware() - Middleware principal de autenticação
- optionalAuthMiddleware() - Autenticação opcional
- rateLimitByApiKey() - Rate limit específico por chave
- checkRateLimit() - Verifica se excedeu limite

VANTAGENS:
- Não há rate limit global para chaves válidas
- Cada chave tem seu próprio rate limit
- Monitoramento de uso por chave
- Fácil gerenciamento de múltiplos clientes
- Chaves podem ter permissões específicas
- Chaves podem expirar (data opcional)
*/

/**
 * Verifica se uma API Key excedeu o rate limit
 */
function checkRateLimit(apiKey) {
  if (!apiKey) {
    return {
      exceeded: false
    };
  }

  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minuto

  // Em produção, use Redis para tracking de rate limit
  // key = `ratelimit:${apiKey.id}:${Math.floor(now / windowMs)}`

  if (apiKey.usageCount >= apiKey.rateLimit) {
    return {
      exceeded: true,
      limit: apiKey.rateLimit,
      usageCount: apiKey.usageCount
    };
  }

  return {
    exceeded: false
  };
}

/**
 * Rate limit específico por API Key
 * Implementa cache em memória para rate limit por minuto
 * Em produção, use Redis para distribuído
 */
const rateLimitCache = new Map();

export async function rateLimitByApiKey(apiKey) {
  if (!apiKey) {
    return false;
  }

  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minuto
  const key = apiKey.id;
  const window = Math.floor(now / windowMs);

  // Buscar contador atual ou inicializar
  let count = rateLimitCache.get(key);

  if (!count) {
    count = {
      requests: 0,
      resetTime: now + windowMs
    };
    rateLimitCache.set(key, count);
  }

  // Verificar se a janela expirou
  if (now >= count.resetTime) {
    count = {
      requests: 0,
      resetTime: now + windowMs
    };
    rateLimitCache.set(key, count);
  }

  // Verificar se excedeu
  if (count.requests >= apiKey.rateLimit) {
    return {
      exceeded: true,
      limit: apiKey.rateLimit,
      resetIn: Math.ceil((count.resetTime - now) / 1000)
    };
  }

  // Incrementar contador
  count.requests++;
  rateLimitCache.set(key, count);

  return {
    exceeded: false
  };
}

/**
 * Middleware de autenticação com API Keys
 * Extrai a API Key do header X-API-Key
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Extrair API Key do header
    const apiKeyHeader = req.headers['x-api-key'];

    if (!apiKeyHeader) {
      return errorResponse(res, 'API Key não fornecida. Use o header: X-API-Key', 401);
    }

    // Validar API Key
    const validation = await validateApiKey(apiKeyHeader);

    if (!validation.valid) {
      return errorResponse(res, validation.error, 401);
    }

    // Verificar rate limit específico da chave
    const rateLimitCheck = await rateLimitByApiKey(validation.apiKey);

    if (rateLimitCheck.exceeded) {
      return errorResponse(
        res,
        `Rate limit excedido para esta API Key. Limite: ${rateLimitCheck.limit} requisições/minuto` + 
        (rateLimitCheck.resetIn ? `. Tente novamente em ${rateLimitCheck.resetIn} segundos.` : ''),
        429
      );
    }

    // Adicionar informações da API Key ao request
    req.apiKey = validation.apiKey;
    req.apiKeyInfo = {
      id: validation.apiKey.id,
      name: validation.apiKey.name,
      rateLimit: validation.apiKey.rateLimit,
      usageCount: validation.apiKey.usageCount,
      permissions: validation.apiKey.permissions
    };

    // Incrementar uso de forma assíncrona (não bloquear a requisição)
    incrementUsage(apiKeyHeader).catch(err => {
      console.error('Erro ao incrementar uso:', err);
    });

    next();
  } catch (error) {
    return errorResponse(res, 'Erro na autenticação', 500, error);
  }
};

/**
 * Middleware opcional de autenticação
 * Permite acesso sem API Key, mas adiciona apiKeyInfo se houver
 */
export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const apiKeyHeader = req.headers['x-api-key'];

    if (!apiKeyHeader) {
      req.apiKey = null;
      req.apiKeyInfo = null;
      return next();
    }

    const validation = await validateApiKey(apiKeyHeader);

    if (!validation.valid) {
      req.apiKey = null;
      req.apiKeyInfo = null;
      return next();
    }

    req.apiKey = validation.apiKey;
    req.apiKeyInfo = {
      id: validation.apiKey.id,
      name: validation.apiKey.name,
      rateLimit: validation.apiKey.rateLimit,
      usageCount: validation.apiKey.usageCount,
      permissions: validation.apiKey.permissions
    };

    next();
  } catch (error) {
    console.error('Erro na autenticação opcional:', error);
    req.apiKey = null;
    req.apiKeyInfo = null;
    next();
  }
};

/**
 * Limpa o cache de rate limit (deve ser chamado periodicamente)
 */
export function clearRateLimitCache() {
  rateLimitCache.clear();
}

/**
 * Retorna estatísticas de rate limit
 */
export function getRateLimitStats() {
  const stats = [];
  
  for (const [key, value] of rateLimitCache.entries()) {
    stats.push({
      apiKeyId: key,
      requests: value.requests,
      resetIn: Math.max(0, Math.ceil((value.resetTime - Date.now()) / 1000))
    });
  }
  
  return stats;
}
