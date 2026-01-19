import { NextRequest } from 'next/server';
import { authenticatedGET } from '@/lib/auth/handlers';
import { db } from '@/lib/db';

/**
 * GET /api/dashboard/stats/[id] - Estatísticas de uma API Key específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return authenticatedGET(request, async (req, apiKey) => {
    try {
      const { id } = params;
      const searchParams = req.nextUrl.searchParams;
      const period = searchParams.get('period') || '24h'; // 1h, 24h, 7d, 30d

      // Calcular período de tempo
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case '1h':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      // Buscar API Key
      const apiKeyData = await db.aPIKey.findUnique({
        where: { id },
        include: {
          endpointUsage: {
            orderBy: { lastUsedAt: 'desc' },
            take: 20,
          },
        },
      });

      if (!apiKeyData) {
        return new Response(JSON.stringify(
          {
            success: false,
            error: 'API Key not found',
            code: 'NOT_FOUND',
          },
          { status: 404 }
        );
      }

      // Buscar logs recentes
      const recentLogs = await db.apiLog.findMany({
        where: {
          apiKeyId: id,
          timestamp: { gte: startDate },
        },
        orderBy: { timestamp: 'desc' },
        take: 50,
      });

      // Buscar estatísticas de uso por endpoint
      const endpointStats = await db.endpointUsage.findMany({
        where: { apiKeyId: id },
        orderBy: { lastUsedAt: 'desc' },
      });

      // Buscar logs agrupados por hora para o gráfico
      const hourlyStats = await db.apiLog.groupBy({
        by: ['statusCode'],
        where: {
          apiKeyId: id,
          timestamp: { gte: startDate },
        },
        _count: {
          id: true,
        },
      });

      // Buscar taxa de erro por endpoint
      const errorRates = await db.endpointUsage.findMany({
        where: {
          apiKeyId: id,
          errorCount: { gt: 0 },
        },
        orderBy: {
          errorCount: 'desc',
        },
        take: 10,
      });

      // Calcular tempo médio de resposta
      const avgResponseTime = await db.apiLog.aggregate({
        where: {
          apiKeyId: id,
          timestamp: { gte: startDate },
        },
        _avg: {
          responseTime: true,
        },
      });

      // Buscar IPs mais comuns
      const topIPs = await db.apiLog.groupBy({
        by: ['ipAddress'],
        where: {
          apiKeyId: id,
          timestamp: { gte: startDate },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      });

      return new Response(JSON.stringify({
        success: true,
        data: {
          apiKey: {
            id: apiKeyData.id,
            name: apiKeyData.name,
            keyPrefix: apiKeyData.keyPrefix,
            isActive: apiKeyData.isActive,
            rateLimitEnabled: apiKeyData.rateLimitEnabled,
            rateLimitPerHour: apiKeyData.rateLimitPerHour,
            totalRequests: apiKeyData.totalRequests,
            totalErrors: apiKeyData.totalErrors,
            lastUsedAt: apiKeyData.lastUsedAt,
            lastUsedIp: apiKeyData.lastUsedIp,
            expiresAt: apiKeyData.expiresAt,
            createdAt: apiKeyData.createdAt,
            updatedAt: apiKeyData.updatedAt,
          },
          period,
          stats: {
            periodRequests: recentLogs.length,
            avgResponseTime: avgResponseTime._avg.responseTime || 0,
            topIPs: topIPs.map((item) => ({
              ipAddress: item.ipAddress || 'unknown',
              count: item._count.id,
            })),
          },
          endpointUsage: endpointStats.map((endpoint) => ({
            endpoint: endpoint.endpoint,
            requestCount: endpoint.requestCount,
            errorCount: endpoint.errorCount,
            avgResponseTime: endpoint.totalResponseTime / endpoint.requestCount,
            lastUsedAt: endpoint.lastUsedAt,
          })),
          recentLogs: recentLogs.map((log) => ({
            id: log.id,
            endpoint: log.endpoint,
            method: log.method,
            statusCode: log.statusCode,
            responseTime: log.responseTime,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            timestamp: log.timestamp,
          })),
        },
      });
    } catch (error) {
      console.error('Error fetching API key stats:', error);
      return new Response(JSON.stringify(
        {
          success: false,
          error: 'Failed to fetch API key stats',
          code: 'FETCH_ERROR',
        },
        { status: 500 }
      );
    }
  }, { requireAuth: false });
}
