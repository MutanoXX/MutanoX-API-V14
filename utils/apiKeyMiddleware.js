import { validateAPIKey, recordAPIKeyUsage } from './apiKeys.js';

/**
 * MEGA PROMPT: Sistema de API Keys - Criar middleware de validação de API Keys

REQUISITOS:
- Middleware para verificar API Key nos headers
- Validação de formato (UUID v4)
- Verificação de status (ativo/inativo)
- Validação de expiração
- Registra uso da key em cada requisição
- Não aplica rate limit para requisições com API Key válida
- Retorna dados da key no req para uso posterior

IMPLEMENTAÇÃO:
- Extrai API Key do header Authorization
- Valida formato e existência
- Verifica se está ativa
- Registra timestamp de uso e resposta
- Adiciona informações da key ao objeto request
- Suporta formato: Bearer <key> ou x-api-key: <key>
- Mensagens de erro claras e específicas
*/

/**
 * Extrai API Key do header Authorization
 * Suporta os formatos:
 * - Authorization: Bearer <api-key>
 * - x-api-key: <api-key>
 */
function extractAPIKey(authHeader) {
  if (!authHeader) {
    return null;
  }

  // Tentar formato Bearer
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.substring(7).trim();
  }

  // Tentar formato x-api-key
  const apiKeyMatch = authHeader.toLowerCase().match(/^x-api-key:\s*(.+)$/i);
  if (apiKeyMatch) {
    return apiKeyMatch[1].trim();
  }

  return null;
}

/**
 * Middleware para validar API Key
 * Diferente do authMiddleware que usa JWT, este valida API Keys de terceiros
 */
export const apiKeyMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  try {
    // Extrair API Key do header
    const authHeader = req.headers['authorization'] || req.headers['x-api-key'];
    const apiKey = extractAPIKey(authHeader);

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API Key não fornecida',
        error: 'Missing x-api-key header'
      });
    }

    // Validar formato da API Key
    const validation = validateAPIKey(apiKey);
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'API Key inválida',
        error: validation.error
      });
    }

    // Buscar API Key no banco de dados
    const apiKeyData = getAPIKeyById(validation.key);
    
    if (!apiKeyData.success) {
      return res.status(401).json({
        success: false,
        message: 'API Key não encontrada ou inválida',
        error: 'Invalid API Key'
      });
    }

    const key = apiKeyData.key;
    
    // Verificar se está ativa
    if (key.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'API Key está desativada',
        error: 'API Key is inactive',
        keyName: key.name
      });
    }

    // Verificar expiração (se definida)
    if (key.expiresAt) {
      const now = new Date();
      const expiresAt = new Date(key.expiresAt);
      
      if (now > expiresAt) {
        return res.status(403).json({
          success: false,
          message: 'API Key expirada',
          error: 'API Key expired',
          keyName: key.name
        });
      }
    }

    // Adicionar informações da key ao request para uso posterior
    req.apiKey = {
      id: key.id,
      name: key.name,
      key: key.key,
      createdAt: key.createdAt,
      stats: key.stats
    };

    // Middleware para capturar o response e registrar uso
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;

    // Override res.send para registrar uso
    res.send = function (data) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Registrar uso da key
      recordAPIKeyUsage(key.id, req.path, true, responseTime);

      // Chamar o método original
      return originalSend.call(this, data);
    };

    // Override res.json para registrar uso
    res.json = function (data) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Registrar uso da key
      recordAPIKeyUsage(key.id, req.path, true, responseTime);

      // Chamar o método original
      return originalJson.call(this, data);
    };

    // Override res.end para registrar uso (útil para streaming)
    res.end = function (chunk, encoding) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Registrar uso da key
      recordAPIKeyUsage(key.id, req.path, true, responseTime);

      // Chamar o método original
      return originalEnd.call(this, chunk, encoding);
    };

    // Registrar que a requisição passou pela validação
    console.log(`🔑 API Key "${key.name}" usada em: ${req.method} ${req.path}`);

    next();
  } catch (error) {
    console.error('Erro no middleware de API Key:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro na validação de API Key',
      error: error.message
    });
  }
};

/**
 * Middleware opcional que permite requisição sem API Key
 * Útil para endpoints públicos ou para debugging
 */
export const optionalApiKeyMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['x-api-key'];
    const apiKey = extractAPIKey(authHeader);

    if (!apiKey) {
      req.apiKey = null;
      return next();
    }

    // Validar formato
    const validation = validateAPIKey(apiKey);
    
    if (!validation.valid) {
      req.apiKey = null;
      return next();
    }

    // Buscar API Key
    const apiKeyData = getAPIKeyById(validation.key);
    
    if (apiKeyData.success) {
      const key = apiKeyData.key;
      
      if (key.status === 'active') {
        req.apiKey = {
          id: key.id,
          name: key.name,
          key: key.key,
          createdAt: key.createdAt,
          stats: key.stats
        };
      } else {
        req.apiKey = null;
      }
    } else {
      req.apiKey = null;
    }

    next();
  } catch (error) {
    req.apiKey = null;
    next();
  }
};

/**
 * Middleware para identificar requisições autenticadas vs não autenticadas
 * Adiciona um flag req.isAuthenticated para uso no logging
 */
export const authTypeMiddleware = (req, res, next) => {
  // Verificar se tem API Key
  if (req.apiKey) {
    req.authType = 'apikey';
  } else {
    req.authType = 'none';
  }
  
  next();
};
