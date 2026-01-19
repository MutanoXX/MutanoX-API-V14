import { successResponse, errorResponse, validationErrorResponse } from '../../utils/response.js';
import { 
  generateAPIKey, 
  listAPIKeys, 
  getAPIKeyById, 
  updateAPIKey, 
  deleteAPIKey,
  deactivateAPIKey,
  activateAPIKey,
  getAPIKeysStats,
  searchAPIKeys,
  getAPIKeyAuditLog,
  getGeneralAuditLog,
  cleanupExpiredKeys
} from '../../utils/apiKeys.js';

/**
 * MEGA PROMPT: Sistema de API Keys - Criar endpoints de gerenciamento de keys

REQUISITOS:
- Endpoint para criar nova API Key
- Endpoint para listar todas as keys
- Endpoint para buscar key específica
- Endpoint para atualizar key (nome, status)
- Endpoint para desativar key
- Endpoint para reativar key
- Endpoint para deletar key
- Endpoint para obter estatísticas
- Endpoint para buscar audit log
- Endpoint para resetar estatísticas de uma key
- Validação de parâmetros
- Auditoria completa de todas as operações

IMPLEMENTAÇÃO:
- POST /api/keys/create - Criar nova key
- GET /api/keys - Listar todas as keys
- GET /api/keys/:id - Buscar key específica
- PUT /api/keys/:id - Atualizar key
- DELETE /api/keys/:id - Deletar key
- GET /api/keys/stats - Estatísticas gerais
- POST /api/keys/:id/deactivate - Desativar
- POST /api/keys/:id/activate - Reativar
- GET /api/keys/:id/audit - Auditoria da key
- GET /api/keys/audit - Auditoria geral
- POST /api/keys/:id/reset-usage - Resetar stats
- Validação de entrada em todos os endpoints
- Auditoria de todas as operações
*/

/**
 * POST /api/keys/create - Criar nova API Key
 */
export const createApiKeysEndpoint = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validação
    if (!name || name.trim().length < 3) {
      return errorResponse(res, 'Nome deve ter no mínimo 3 caracteres', 400);
    }

    if (name.length > 50) {
      return errorResponse(res, 'Nome deve ter no máximo 50 caracteres', 400);
    }

    // Criar nova API Key
    const newKey = generateAPIKey();

    // Adicionar descrição se fornecida
    if (description && description.trim().length > 0) {
      newKey.name = name.trim();
      // Em produção, poderíamos salvar a descrição
    }

    const result = {
      ...newKey,
      key: newKey.key.substring(0, 8) + '...' + newKey.key.substring(32)
    };

    return successResponse(res, result, 'API Key criada com sucesso');
  } catch (error) {
    return errorResponse(res, 'Erro ao criar API Key', 500, error);
  }
};

/**
 * GET /api/keys - Listar todas as API Keys
 */
export const listApiKeysEndpoint = async (req, res) => {
  try {
    const { status, limit } = req.query;
    const keys = listAPIKeys();

    // Aplicar filtros se fornecidos
    let filteredKeys = keys.keys;

    if (status && ['active', 'inactive'].includes(status)) {
      const filtered = filterAPIKeysByStatus(status);
      filteredKeys = filtered.keys;
    }

    // Aplicar limite se fornecido
    if (limit && !isNaN(parseInt(limit))) {
      filteredKeys = filteredKeys.slice(0, parseInt(limit));
    }

    const result = {
      total: keys.total,
      active: keys.active,
      inactive: keys.inactive,
      filtered: filteredKeys.length,
      keys: filteredKeys
    };

    return successResponse(res, result, 'API Keys listadas com sucesso');
  } catch (error) {
    return errorResponse(res, 'Erro ao listar API Keys', 500, error);
  }
};

/**
 * GET /api/keys/:id - Buscar API Key específica
 */
export const getApiKeyEndpoint = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return errorResponse(res, 'ID da API Key não fornecido', 400);
    }

    const result = getAPIKeyById(id);

    if (!result.success) {
      return errorResponse(res, result.message, 404);
    }

    return successResponse(res, result, 'API Key encontrada');
  } catch (error) {
    return errorResponse(res, 'Erro ao buscar API Key', 500, error);
  }
};

/**
 * PUT /api/keys/:id - Atualizar API Key
 */
export const updateApiKeyEndpoint = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return errorResponse(res, 'ID da API Key não fornecido', 400);
    }

    if (!updates || Object.keys(updates).length === 0) {
      return errorResponse(res, 'Nenhum campo para atualizar foi fornecido', 400);
    }

    // Validações
    if (updates.name && (updates.name.length < 3 || updates.name.length > 50)) {
      return errorResponse(res, 'Nome deve ter entre 3 e 50 caracteres', 400);
    }

    if (updates.status && !['active', 'inactive'].includes(updates.status)) {
      return errorResponse(res, 'Status deve ser "active" ou "inactive"', 400);
    }

    const result = updateAPIKey(id, updates);

    if (!result.success) {
      return errorResponse(res, result.message, 400);
    }

    return successResponse(res, result, 'API Key atualizada com sucesso');
  } catch (error) {
    return errorResponse(res, 'Erro ao atualizar API Key', 500, error);
  }
};

/**
 * DELETE /api/keys/:id - Deletar API Key
 */
export const deleteApiKeyEndpoint = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return errorResponse(res, 'ID da API Key não fornecido', 400);
    }

    const result = deleteAPIKey(id);

    if (!result.success) {
      return errorResponse(res, result.message, 404);
    }

    return successResponse(res, result.message, 'API Key deletada com sucesso');
  } catch (error) {
    return errorResponse(res, 'Erro ao deletar API Key', 500, error);
  }
};

/**
 * POST /api/keys/:id/deactivate - Desativar API Key
 */
export const deactivateApiKeyEndpoint = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return errorResponse(res, 'ID da API Key não fornecido', 400);
    }

    const result = deactivateAPIKey(id);

    if (!result.success) {
      return errorResponse(res, result.message, 400);
    }

    return successResponse(res, result.message, 'API Key desativada com sucesso');
  } catch (error) {
    return errorResponse(res, 'Erro ao desativar API Key', 500, error);
  }
};

/**
 * POST /api/keys/:id/activate - Reativar API Key
 */
export const activateApiKeyEndpoint = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return errorResponse(res, 'ID da API Key não fornecido', 400);
    }

    const result = activateAPIKey(id);

    if (!result.success) {
      return errorResponse(res, result.message, 400);
    }

    return successResponse(res, result.message, 'API Key reativada com sucesso');
  } catch (error) {
    return errorResponse(res, 'Erro ao reativar API Key', 500, error);
  }
};

/**
 * GET /api/keys/stats - Estatísticas gerais de API Keys
 */
export const getApiKeysStatsEndpoint = async (req, res) => {
  try {
    const stats = getAPIKeysStats();

    return successResponse(res, stats, 'Estatísticas obtidas com sucesso');
  } catch (error) {
    return errorResponse(res, 'Erro ao obter estatísticas', 500, error);
  }
};

/**
 * GET /api/keys/:id/audit - Auditoria de API Key específica
 */
export const getApiKeyAuditEndpoint = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit } = req.query;

    if (!id) {
      return errorResponse(res, 'ID da API Key não fornecido', 400);
    }

    const auditLog = getAPIKeyAuditLog(id);

    if (!auditLog.success) {
      return errorResponse(res, auditLog.message, 404);
    }

    let filteredLogs = auditLog.auditLog;

    // Aplicar limite se fornecido
    if (limit && !isNaN(parseInt(limit))) {
      filteredLogs = filteredLogs.slice(0, parseInt(limit));
    }

    const result = {
      keyId: id,
      keyName: auditLog.keyName,
      total: filteredLogs.length,
      logs: filteredLogs
    };

    return successResponse(res, result, 'Auditoria obtida com sucesso');
  } catch (error) {
    return errorResponse(res, 'Erro ao obter auditoria', 500, error);
  }
};

/**
 * GET /api/keys/audit - Auditoria geral
 */
export const getGeneralAuditLogEndpoint = async (req, res) => {
  try {
    const { limit, action, keyId } = req.query;
    const generalAudit = getGeneralAuditLog(limit);

    let filteredLogs = generalAudit.logs;

    // Filtrar por tipo de ação se fornecido
    if (action) {
      filteredLogs = filteredLogs.filter(log => 
        log.action === action.toUpperCase()
      );
    }

    // Filtrar por API Key específica se fornecido
    if (keyId) {
      filteredLogs = filteredLogs.filter(log => 
        log.details.keyId === keyId
      );
    }

    // Aplicar limite se fornecido
    if (limit && !isNaN(parseInt(limit))) {
      filteredLogs = filteredLogs.slice(0, parseInt(limit));
    }

    const result = {
      total: generalAudit.total,
      filtered: filteredLogs.length,
      logs: filteredLogs
    };

    return successResponse(res, result, 'Auditoria geral obtida com sucesso');
  } catch (error) {
    return errorResponse(res, 'Erro ao obter auditoria geral', 500, error);
  }
};

/**
 * POST /api/keys/:id/reset-usage - Resetar estatísticas de uma API Key
 */
export const resetApiKeyUsageEndpoint = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return errorResponse(res, 'ID da API Key não fornecido', 400);
    }

    const result = updateAPIKey(id, {
      stats: {
        totalUsage: 0,
        successCount: 0,
        failureCount: 0,
        lastUsedAt: null,
        avgResponseTime: 0
      }
    });

    if (!result.success) {
      return errorResponse(res, result.message, 400);
    }

    return successResponse(res, result.message, 'Estatísticas resetadas com sucesso');
  } catch (error) {
    return errorResponse(res, 'Erro ao resetar estatísticas', 500, error);
  }
};
