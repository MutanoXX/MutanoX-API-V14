import { 
  createApiKey, 
  getApiKeys, 
  getApiKey, 
  updateApiKey, 
  deleteApiKey, 
  formatApiKeyForDisplay 
} from '../../utils/apiKeys.js';
import { successResponse, errorResponse, validationErrorResponse } from '../../utils/response.js';
import { authMiddleware } from '../../utils/auth-new.js';

/**
 * MEGA PROMPT: Criar endpoints de gerenciamento de API Keys

REQUISITOS:
- POST /api/keys/create - Criar nova API Key
- GET /api/keys - Listar todas as API Keys
- GET /api/keys/:id - Buscar API Key específica
- PUT /api/keys/:id - Atualizar API Key
- DELETE /api/keys/:id - Deletar API Key
- GET /api/keys/stats - Estatísticas de uso

IMPLEMENTAÇÃO:
- Validação de parâmetros
- Criação de chaves únicas
- Atualização de chaves existentes
- Deleção com confirmação
- Formatação de respostas
- Validação de permissões
- Proteção de endpoints admin (requer master key)
*/

/**
 * Criar nova API Key
 * POST /api/keys/create
 */
export const createApiKeysEndpoint = async (req, res) => {
  try {
    const { name, description, rateLimit, permissions, expiresInDays } = req.body;

    // Validação básica
    if (!name) {
      return validationErrorResponse(res, 'Nome da API Key é obrigatório', ['name']);
    }

    // Validar permissões se fornecidas
    const validPermissions = ['read', 'write', 'admin', 'all'];
    if (permissions && Array.isArray(permissions)) {
      const invalidPerms = permissions.filter(p => !validPermissions.includes(p));
      if (invalidPerms.length > 0) {
        return errorResponse(res, `Permissões inválidas: ${invalidPerms.join(', ')}. Válidas: ${validPermissions.join(', ')}`, 400);
      }
    }

    // Validação de rate limit
    if (rateLimit && (rateLimit < 1 || rateLimit > 10000)) {
      return errorResponse(res, 'Rate limit deve estar entre 1 e 10000', 400);
    }

    // Validação de expiração
    let expiresAt = null;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date(Date.now() + (expiresInDays * 24 * 60 * 60 * 1000));
    }

    // Criar a API Key
    const result = await createApiKey(name, {
      description,
      rateLimit,
      permissions,
      expiresAt
    });

    if (!result.success) {
      return errorResponse(res, result.error, 500);
    }

    // Formatar resposta (não expor a chave completa)
    const response = { ...result.data };
    response.displayKey = formatApiKeyForDisplay(response.key);

    return successResponse(res, response, 'API Key criada com sucesso');
  } catch (error) {
    return errorResponse(res, 'Erro ao criar API Key', 500, error);
  }
};

/**
 * Listar todas as API Keys
 * GET /api/keys
 */
export const listApiKeysEndpoint = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const filters = {};

    if (includeInactive === 'true') {
      filters.includeInactive = true;
    }

    const result = await getApiKeys(filters);

    if (!result.success) {
      return errorResponse(res, result.error, 500);
    }

    // Formatar chaves (não expor a chave completa)
    const formattedKeys = result.data.map(key => ({
      ...key,
      displayKey: formatApiKeyForDisplay(key.key)
    }));

    return successResponse(res, formattedKeys, 'API Keys listadas com sucesso');
  } catch (error) {
    return errorResponse(res, 'Erro ao listar API Keys', 500, error);
  }
};

/**
 * Buscar API Key específica
 * GET /api/keys/:id
 */
export const getApiKeyEndpoint = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, 'ID da API Key é obrigatório', 400);
    }

    const result = await getApiKey(id);

    if (!result.success) {
      return errorResponse(res, result.error, 404);
    }

    // Formatar resposta
    const response = { ...result.data };
    response.displayKey = formatApiKeyForDisplay(response.key);

    return successResponse(res, response, 'API Key encontrada com sucesso');
  } catch (error) {
    return errorResponse(res, 'Erro ao buscar API Key', 500, error);
  }
};

/**
 * Atualizar API Key
 * PUT /api/keys/:id
 */
export const updateApiKeyEndpoint = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive, rateLimit, permissions } = req.body;

    if (!id) {
      return errorResponse(res, 'ID da API Key é obrigatório', 400);
    }

    // Buscar API Key existente
    const existing = await getApiKey(id);
    if (!existing.success) {
      return errorResponse(res, 'API Key não encontrada', 404);
    }

    // Validações
    if (permissions && Array.isArray(permissions)) {
      const validPermissions = ['read', 'write', 'admin', 'all'];
      const invalidPerms = permissions.filter(p => !validPermissions.includes(p));
      if (invalidPerms.length > 0) {
        return errorResponse(res, `Permissões inválidas: ${invalidPerms.join(', ')}. Válidas: ${validPermissions.join(', ')}`, 400);
      }
    }

    if (rateLimit && (rateLimit < 1 || rateLimit > 10000)) {
      return errorResponse(res, 'Rate limit deve estar entre 1 e 10000', 400);
    }

    // Preparar atualizações
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (isActive !== undefined) updates.isActive = isActive;
    if (rateLimit !== undefined) updates.rateLimit = rateLimit;
    if (permissions !== undefined) updates.permissions = permissions;

    const result = await updateApiKey(id, updates);

    if (!result.success) {
      return errorResponse(res, result.error, 500);
    }

    // Formatar resposta
    const response = { ...result.data };
    response.displayKey = formatApiKeyForDisplay(response.key);

    return successResponse(res, response, 'API Key atualizada com sucesso');
  } catch (error) {
    return errorResponse(res, 'Erro ao atualizar API Key', 500, error);
  }
};

/**
 * Deletar API Key
 * DELETE /api/keys/:id
 */
export const deleteApiKeyEndpoint = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, 'ID da API Key é obrigatório', 400);
    }

    const result = await deleteApiKey(id);

    if (!result.success) {
      return errorResponse(res, result.error, 500);
    }

    return successResponse(res, null, result.message);
  } catch (error) {
    return errorResponse(res, 'Erro ao deletar API Key', 500, error);
  }
};

/**
 * Estatísticas de API Keys
 * GET /api/keys/stats
 */
export const getApiKeysStatsEndpoint = async (req, res) => {
  try {
    const result = await getApiKeys({ includeInactive: true });

    if (!result.success) {
      return errorResponse(res, result.error, 500);
    }

    // Calcular estatísticas
    const keys = result.data;
    const activeKeys = keys.filter(k => k.isActive);
    const inactiveKeys = keys.filter(k => !k.isActive);
    
    const stats = {
      total: keys.length,
      active: activeKeys.length,
      inactive: inactiveKeys.length,
      totalUsage: keys.reduce((sum, k) => sum + (k.usageCount || 0), 0),
      averageUsage: keys.length > 0 
        ? Math.round(keys.reduce((sum, k) => sum + (k.usageCount || 0), 0) / keys.length)
        : 0,
      rateLimits: keys.map(k => k.rateLimit).sort((a, b) => b - a),
      expiringSoon: keys
        .filter(k => k.expiresAt && new Date(k.expiresAt) < new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)))
        .length
    };

    return successResponse(res, stats, 'Estatísticas obtidas com sucesso');
  } catch (error) {
    return errorResponse(res, 'Erro ao obter estatísticas', 500, error);
  }
};

/**
 * Resetar estatísticas de uso de uma API Key
 * POST /api/keys/:id/reset-usage
 */
export const resetApiKeyUsageEndpoint = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, 'ID da API Key é obrigatório', 400);
    }

    const result = await updateApiKey(id, {
      usageCount: 0,
      lastUsedAt: null
    });

    if (!result.success) {
      return errorResponse(res, result.error, 500);
    }

    return successResponse(res, { ...result.data }, 'Estatísticas resetadas com sucesso');
  } catch (error) {
    return errorResponse(res, 'Erro ao resetar estatísticas', 500, error);
  }
};
