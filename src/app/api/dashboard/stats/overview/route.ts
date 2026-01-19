import { NextRequest } from 'next/server';
import { authenticatedGET } from '@/lib/auth/handlers';
import { db } from '@/lib/db';

/**
 * GET /api/dashboard/stats/overview - Estatísticas gerais do dashboard
 */
export async function GET(request: NextRequest) {
  return authenticatedGET(request, async (req, apiKey) => {
    try {
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

      // Buscar estatísticas agregadas
      const [totalKeys, activeKeys, totalRequests, totalErrors, recentActivity] = await Promise.all([
        db.aPIKey.count(),
        db.aPIKey.count({ where: { isActive: true } }),
        db.apiLog.count({ where: { timestamp: { gte: startDate } } }),
        db.apiLog.count({ where: { timestamp: { gte: startDate }, statusCode: { gte: 400 } } }),
        db.apiLog.findMany({
          where: { timestamp: { gte: startDate } },
          orderBy: { timestamp: 'desc' },
          take: 20,
          include: {
            apiKey: {
              select: {
                id: true,
                name: true,
                keyPrefix: true,
              },
            },
          },
        }),
      ]);

      // Buscar endpoints mais utilizados
      const topEndpoints = await db.endpointUsage.groupBy({
        by: ['endpoint'],
        where: {
          lastUsedAt: { gte: startDate },
        },
        _sum: {
          requestCount: true,
        },
        orderBy: {
          _sum: {
            requestCount: 'desc',
          },
        },
        take: 10,
      });

      // Buscar estatísticas por API Key
      const keysStats = await db.aPIKey.findMany({
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          isActive: true,
          totalRequests: true,
          totalErrors: true,
          lastUsedAt: true,
          createdAt: true,
          _count: {
            select: {
              apiLogs: {
                where: { timestamp: { gte: startDate } },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Calcular tempo médio de resposta
      const avgResponseTime = await db.apiLog.aggregate({
        where: { timestamp: { gte: startDate } },
        _avg: {
          responseTime: true,
        },
      });

      // Taxa de sucesso
      const successRate = totalRequests > 0
        ? ((totalRequests - totalErrors) / totalRequests) * 100
        : 100;

      return Response.json({
        success: true,
        data: {
          period,
          summary: {
            totalKeys,
            activeKeys,
            inactiveKeys: totalKeys - activeKeys,
            totalRequests,
            totalErrors,
            successRate: Math.round(successRate * 100) / 100,
            avgResponseTime: avgResponseTime._avg.responseTime || 0,
          },
          topEndpoints: topEndpoints.map((item) => ({
            endpoint: item.endpoint,
            totalRequests: item._sum.requestCount || 0,
          })),
          keys: keysStats.map((key) => ({
            id: key.id,
            name: key.name,
            keyPrefix: key.keyPrefix,
            isActive: key.isActive,
            periodRequests: key._count.apiLogs,
            totalRequests: key.totalRequests,
            totalErrors: key.totalErrors,
            lastUsedAt: key.lastUsedAt,
            createdAt: key.createdAt,
          })),
          recentActivity: recentActivity.map((log) => ({
            id: log.id,
            endpoint: log.endpoint,
            method: log.method,
            statusCode: log.statusCode,
            responseTime: log.responseTime,
            timestamp: log.timestamp,
            apiKey: {
              id: log.apiKey.id,
              name: log.apiKey.name,
              keyPrefix: log.apiKey.keyPrefix,
            },
          })),
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return Response.json(
        {
          success: false,
          error: 'Failed to fetch dashboard stats',
          code: 'FETCH_ERROR',
        },
        { status: 500 }
      );
    }
  }, { requireAuth: false });
}
