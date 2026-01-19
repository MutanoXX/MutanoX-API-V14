import { db } from '../../lib/db.js';
import { successResponse, errorResponse, validationErrorResponse } from '../../utils/response.js';
import crypto from 'crypto';

/**
 * MEGA PROMPT: Criar sistema de gerenciamento de API Keys

REQUISITOS:
- Gerar API Keys únicas e seguras
- Armazenar no banco de dados
- Permitir nomear as keys para identificação
- Configurar rate limit personalizado por key
- Registrar todas as requisições por key
- Revogar (desativar) API Keys
- Listar todas as API Keys
- Logs de auditoria por key

IMPLEMENTAÇÃO:
- Geração de keys com crypto (32 bytes hex)
- Validação de key antes de usar
- Rate limiting dinâmico por key
- Log de todas as requisições no banco
- Validação de permissões
- Tratamento de erros robusto
*/

/**
 * Gera uma API Key única e segura
 */
function generateApiKey() {
  const key = crypto.randomBytes(32).toString('hex');
  return `mxapi_${key}`;
}

/**
 * Endpoint para gerar uma nova API Key
 * POST /api/api-keys/generate
 */
export const generateApiKey = async (req, res) => {
  try {
    const { name, rateLimit } = req.body;

    // Validação
    if (!name || name.trim().length < 3) {
      return validationErrorResponse(res, 'Nome da API Key é obrigatório (mínimo 3 caracteres)');
    }

    const sanitizedName = name.trim();
    const customRateLimit = rateLimit ? parseInt(rateLimit) : 60;

    // Gerar API Key
    const apiKey = generateApiKey();

    // Salvar no banco de dados
    const newKey = await db.apiKey.create({
      data: {
        key: apiKey,
        name: sanitizedName,
        rateLimit: customRateLimit,
        isActive: true,
        requestsCount: 0
      }
    });

    return successResponse(res, {
      key: newKey.key,
      name: newKey.name,
      rateLimit: newKey.rateLimit,
      createdAt: newKey.createdAt
    }, 'API Key gerada com sucesso');
  } catch (error) {
    console.error('Erro ao gerar API Key:', error);
    return errorResponse(res, 'Erro ao gerar API Key', 500, error);
  }
};

/**
 * Endpoint para listar todas as API Keys
 * GET /api/api-keys/list
 */
export const listApiKeys = async (req, res) => {
  try {
    const apiKeys = await db.apiKey.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Adicionar estatísticas recentes
    const keysWithStats = await Promise.all(apiKeys.map(async (key) => {
      const recentLogs = await db.apiRequestLog.findMany({
        where: {
          apiKeyId: key.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });

      const recentSuccess = recentLogs.filter(log => log.success).length;
      const recentErrors = recentLogs.filter(log => !log.success).length;
      const avgResponseTime = recentLogs.length > 0
        ? recentLogs.reduce((sum, log) => sum + log.responseTime, 0) / recentLogs.length
        : 0;

      return {
        ...key,
        stats: {
          recentRequests: recentLogs.length,
          recentSuccess,
          recentErrors,
          avgResponseTime,
          successRate: recentLogs.length > 0
            ? ((recentSuccess / recentLogs.length) * 100).toFixed(2)
            : '100.00'
        }
      };
    }));

    return successResponse(res, keysWithStats, 'API Keys listadas com sucesso');
  } catch (error) {
    console.error('Erro ao listar API Keys:', error);
    return errorResponse(res, 'Erro ao listar API Keys', 500, error);
  }
};

/**
 * Endpoint para revogar (desativar) uma API Key
 * POST /api/api-keys/revoke
 */
export const revokeApiKey = async (req, res) => {
  try {
    const { keyId } = req.body;

    if (!keyId) {
      return validationErrorResponse(res, 'ID da API Key é obrigatório', ['keyId']);
    }

    // Verificar se a key existe
    const existingKey = await db.apiKey.findUnique({
      where: { id: keyId }
    });

    if (!existingKey) {
      return errorResponse(res, 'API Key não encontrada', 404);
    }

    // Desativar a key
    await db.apiKey.update({
      where: { id: keyId },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    return successResponse(res, {
      message: 'API Key revogada com sucesso',
      keyId: existingKey.id,
      revokedAt: new Date().toISOString()
    }, 'API Key revogada');
  } catch (error) {
    console.error('Erro ao revogar API Key:', error);
    return errorResponse(res, 'Erro ao revogar API Key', 500, error);
  }
};

/**
 * Endpoint para ativar uma API Key previamente revogada
 * POST /api/api-keys/activate
 */
export const activateApiKey = async (req, res) => {
  try {
    const { keyId } = req.body;

    if (!keyId) {
      return validationErrorResponse(res, 'ID da API Key é obrigatório', ['keyId']);
    }

    // Verificar se a key existe
    const existingKey = await db.apiKey.findUnique({
      where: { id: keyId }
    });

    if (!existingKey) {
      return errorResponse(res, 'API Key não encontrada', 404);
    }

    // Ativar a key
    await db.apiKey.update({
      where: { id: keyId },
      data: {
        isActive: true,
        updatedAt: new Date()
      }
    });

    return successResponse(res, {
      message: 'API Key ativada com sucesso',
      keyId: existingKey.id,
      activatedAt: new Date().toISOString()
    }, 'API Key ativada');
  } catch (error) {
    console.error('Erro ao ativar API Key:', error);
    return errorResponse(res, 'Erro ao ativar API Key', 500, error);
  }
};

/**
 * Endpoint para deletar uma API Key permanentemente
 * DELETE /api/api-keys/delete
 */
export const deleteApiKey = async (req, res) => {
  try {
    const { keyId } = req.params;

    if (!keyId) {
      return errorResponse(res, 'ID da API Key é obrigatório', 400);
    }

    // Verificar se a key existe
    const existingKey = await db.apiKey.findUnique({
      where: { id: keyId }
    });

    if (!existingKey) {
      return errorResponse(res, 'API Key não encontrada', 404);
    }

    // Deletar logs associados
    await db.apiRequestLog.deleteMany({
      where: { apiKeyId: keyId }
    });

    // Deletar a key
    await db.apiKey.delete({
      where: { id: keyId }
    });

    return successResponse(res, {
      message: 'API Key deletada com sucesso',
      deletedKeyId: keyId,
      deletedAt: new Date().toISOString()
    }, 'API Key deletada');
  } catch (error) {
    console.error('Erro ao deletar API Key:', error);
    return errorResponse(res, 'Erro ao deletar API Key', 500, error);
  }
};

/**
 * Endpoint para obter estatísticas de uma API Key específica
 * GET /api/api-keys/stats/:keyId
 */
export const getApiKeyStats = async (req, res) => {
  try {
    const { keyId } = req.params;

    if (!keyId) {
      return errorResponse(res, 'API Key ID é obrigatório', 400);
    }

    // Buscar a API Key
    const apiKey = await db.apiKey.findUnique({
      where: { id: keyId }
    });

    if (!apiKey) {
      return errorResponse(res, 'API Key não encontrada', 404);
    }

    // Buscar logs recentes
    const recentLogs = await db.apiRequestLog.findMany({
      where: { apiKeyId: keyId },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    // Calcular estatísticas
    const totalRequests = recentLogs.length;
    const successfulRequests = recentLogs.filter(log => log.success).length;
    const failedRequests = recentLogs.filter(log => !log.success).length;
    const avgResponseTime = totalRequests > 0
      ? recentLogs.reduce((sum, log) => sum + log.responseTime, 0) / totalRequests
      : 0;

    // Contagem por endpoint
    const endpointCounts = {};
    recentLogs.forEach(log => {
      const endpoint = log.endpoint;
      if (!endpointCounts[endpoint]) {
        endpointCounts[endpoint] = { total: 0, success: 0, error: 0 };
      }
      endpointCounts[endpoint].total++;
      if (log.success) {
        endpointCounts[endpoint].success++;
      } else {
        endpointCounts[endpoint].error++;
      }
    });

    return successResponse(res, {
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        key: apiKey.key,
        isActive: apiKey.isActive,
        rateLimit: apiKey.rateLimit,
        createdAt: apiKey.createdAt,
        updatedAt: apiKey.updatedAt,
        requestsCount: apiKey.requestsCount,
        lastUsedAt: apiKey.lastUsedAt
      },
      stats: {
        totalRequests,
        successfulRequests,
        failedRequests,
        successRate: totalRequests > 0
          ? ((successfulRequests / totalRequests) * 100).toFixed(2)
          : '0.00',
        avgResponseTime: avgResponseTime.toFixed(2) + 'ms',
        endpointCounts
      },
      recentLogs: recentLogs.slice(0, 20)
    }, 'Estatísticas da API Key');
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return errorResponse(res, 'Erro ao buscar estatísticas', 500, error);
  }
};
