import { db } from '../../lib/db.js';
import { successResponse, errorResponse } from '../../utils/response.js';

/**
 * MEGA PROMPT: Criar endpoint de estatísticas globais de API Keys

REQUISITOS:
- Obter métricas agregadas de todas as API Keys
- Contagem total de requisições
- Taxa de sucesso global
- Requisições por hora
- Top endpoints mais utilizados
- API Keys mais ativas
- Recursos por key

IMPLEMENTAÇÃO:
- Queries agregadas ao banco de dados
- Cálculos de estatísticas
- Retorno organizado e útil
- Performance otimizada
*/

/**
 * Endpoint para obter estatísticas globais de todas as API Keys
 * GET /api/api-keys/global-stats
 */
export const getGlobalStats = async (req, res) => {
  try {
    // Buscar todas as API Keys ativas
    const activeKeys = await db.apiKey.findMany({
      where: {
        isActive: true
      }
    });

    // Contagem total de requisições (ativas)
    const totalRequests = activeKeys.reduce((sum, key) => sum + (key.requestsCount || 0), 0);

    // Buscar logs recentes das últimas 24 horas
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLogs = await db.apiRequestLog.findMany({
      where: {
        createdAt: {
          gte: oneDayAgo
        }
      }
    });

    // Estatísticas por endpoint
    const endpointStats = {};
    recentLogs.forEach(log => {
      const endpoint = log.endpoint;
      if (!endpointStats[endpoint]) {
        endpointStats[endpoint] = { total: 0, success: 0, error: 0, avgTime: 0 };
      }
      endpointStats[endpoint].total++;
      if (log.success) {
        endpointStats[endpoint].success++;
      } else {
        endpointStats[endpoint].error++;
      }
      endpointStats[endpoint].avgTime += log.responseTime;
    });

    // Calcular médias
    Object.keys(endpointStats).forEach(endpoint => {
      const stats = endpointStats[endpoint];
      stats.avgTime = stats.total > 0 ? (stats.avgTime / stats.total) : 0;
      stats.successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(2) : '0.00';
    });

    // Buscar logs por hora das últimas 24 horas
    const hourlyStats = await db.apiRequestLog.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: oneDayAgo
        }
      },
      _count: true
    });

    // Agrupar por hora
    const requestsPerHour = {};
    Object.keys(hourlyStats).forEach(timestamp => {
      const hour = new Date(timestamp).getHours();
      if (!requestsPerHour[hour]) {
        requestsPerHour[hour] = 0;
      }
      requestsPerHour[hour] += hourlyStats[timestamp]._count;
    });

    // API Keys mais ativas
    const topKeys = [...activeKeys]
      .sort((a, b) => b.requestsCount - a.requestsCount)
      .slice(0, 10)
      .map(key => ({
        id: key.id,
        name: key.name,
        requestsCount: key.requestsCount,
        lastUsedAt: key.lastUsedAt,
        rateLimit: key.rateLimit
      }));

    return successResponse(res, {
      overview: {
        totalApiKeys: activeKeys.length,
        totalRequests,
        successRate: recentLogs.length > 0
          ? ((recentLogs.filter(log => log.success).length / recentLogs.length) * 100).toFixed(2)
          : '0.00'
      },
      apiKeys: activeKeys.map(key => ({
        id: key.id,
        name: key.name,
        key: key.key.substring(0, 8) + '...', // Mostrar apenas primeiros 8 caracteres
        isActive: key.isActive,
        rateLimit: key.rateLimit,
        requestsCount: key.requestsCount,
        createdAt: key.createdAt,
        lastUsedAt: key.lastUsedAt
      })),
      topApiKeys: topKeys,
      endpointStats: Object.entries(endpointStats)
        .map(([endpoint, stats]) => ({
          endpoint,
          total: stats.total,
          success: stats.success,
          error: stats.error,
          avgTime: stats.avgTime.toFixed(2) + 'ms',
          successRate: stats.successRate
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10),
      requestsPerHour: requestsPerHour,
      recentLogs: recentLogs.slice(0, 50),
      generatedAt: new Date().toISOString()
    }, 'Estatísticas globais obtidas com sucesso');
  } catch (error) {
    console.error('Erro ao buscar estatísticas globais:', error);
    return errorResponse(res, 'Erro ao buscar estatísticas globais', 500, error);
  }
};

/**
 * Endpoint para limpar logs antigos
 * DELETE /api/api-keys/clear-logs
 */
export const clearOldLogs = async (req, res) => {
  try {
    const { days = 7 } = req.query; // Padrão: 7 dias
    const daysAgo = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

    const result = await db.apiRequestLog.deleteMany({
      where: {
        createdAt: {
          lt: daysAgo
        }
      }
    });

    return successResponse(res, {
      message: `${result.count} logs antigos foram deletados`,
      deletedOlderThan: `${days} dias`,
      deletedAt: new Date().toISOString()
    }, 'Logs antigos limpos com sucesso');
  } catch (error) {
    console.error('Erro ao limpar logs antigos:', error);
    return errorResponse(res, 'Erro ao limpar logs antigos', 500, error);
  }
};
