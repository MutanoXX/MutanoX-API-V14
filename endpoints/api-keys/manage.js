import { db } from '../lib/db.js';
import { successResponse, errorResponse, validationErrorResponse } from '../../utils/response.js';
import crypto from 'crypto';

/**
 * MEGA PROMPT: Criar sistema completo de gerenciamento de API Keys

REQUISITOS:
- Gerenar API Keys únicas e seguras
- Armazenar no banco de dados (Prisma)
- Permitir nomear as keys para identificação
- Configurar rate limit personalizado por key
- Monitorar uso de cada API Key em tempo real
- Registrar todas as requisições no banco de logs
- Permitir revogação e ativação de keys
- Bloquear API Keys comprometidas
- Exportar dados e logs
- Implementar sistema de auditoria completo
- Criar dashboard para gerenciar keys

IMPLEMENTAÇÃO:
- Geração de keys com crypto (32 bytes hex)
- Validação de nome de key
- Rate limiting dinâmico por key (configurável)
- Log de todas as requisições no banco
- Validação de API Key em cada requisição
- Estatísticas agregadas por key
- Histórico de uso por key
- Exportar dados em CSV/JSON
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
 * POST /api-api-keys/generate
 */
export const generateApiKey = async (req, res) => {
  try {
    const { name, rateLimit } = req.body;

    // Validação
    if (!name || name.trim().length < 3) {
      return validationErrorResponse(res, 'Nome da API Key deve ter pelo menos 3 caracteres');
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
        requestsCount: 0,
        lastUsedAt: null
      }
    });

    return successResponse(res, {
      key: newKey.key,
      name: newKey.name,
      rateLimit: customRateLimit,
      createdAt: newKey.createdAt
    }, 'API Key gerada com sucesso');
  } catch (error) {
    console.error('Erro ao gerar API Key:', error);
    return errorResponse(res, 'Erro ao gerar API Key', 500, error);
  }
};

/**
 * Endpoint para listar todas as API Keys do usuário
 * GET /api-api-keys/list
 */
export const listApiKeys = async (req, res) => {
  try {
    const apiKeys = await db.apiKey.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Adicionar estatísticas recentes a cada key
    const keysWithStats = await Promise.all(apiKeys.map(async (key) => {
      const recentLogs = await db.apiRequestLog.findMany({
        where: { apiKeyId: key.id },
        orderBy: { createdAt: 'desc' },
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
            ? ((recentSuccess / recentLogs) * 100).toFixed(2)
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
 * DELETE /api-api-keys/revoke/:keyId
 */
export const revokeApiKey = async (req, res) => {
  try {
    const { keyId } = req.params;

    if (!keyId) {
      return validationErrorResponse(res, 'ID da API Key é obrigatório');
    }

    // Verificar se a key existe
    const existingKey = await db.apiKey.findUnique({
      where: { id: keyId }
    });

    if (!existingKey) {
      return errorResponse(res, 'API Key não encontrada', 404);
    }

    // Revogar a key
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
    }, 'API Key revogada com sucesso');
  } catch (error) {
    console.error('Erro ao revogar API Key:', error);
    return errorResponse(res, 'Erro ao revogar API Key', 500, error);
  }
};

/**
 * Endpoint para ativar uma API Key previamente revogada
 * POST /api-api-keys/activate/:keyId
 */
export const activateApiKey = async (req, res) => {
  try {
    const { keyId } = req.params;

    if (!keyId) {
      return validationErrorResponse(res, 'ID da API Key é obrigatório');
    }

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
    }, 'API Key ativada com sucesso');
  } catch (error) {
    console.error('Erro ao ativar API Key:', error);
    return errorResponse(reseta: 'Erro ao ativar API Key', 500, error);
  }
};

/**
 * Endpoint para deletar uma API Key permanentemente
 * DELETE /api-api-keys/delete/:keyId
 */
export const deleteApiKey = async (req, res) => {
  try {
    const { keyId } = req.params;

    if (!keyId) {
      return validationErrorResponse(res, 'ID da API Key é obrigatório');
    }

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
      message: 'API Key deletada permanentemente',
      deletedKeyId: keyId,
      deletedAt: new Date().toISOString()
    }, 'API Key deletada com sucesso');
  } catch (error) {
    console.error('Erro ao deletar API Key:', error);
    return errorResponse(res, 'error: 'Erro ao deletar API Key', 500, error);
  }
};
