import { NextRequest } from 'next/server';
import { authenticatedGET } from '@/lib/auth/handlers';
import { db } from '@/lib/db';

/**
 * GET /api/dashboard/logs - Buscar logs de requisições
 */
export async function GET(request: NextRequest) {
  return authenticatedGET(request, async (req, apiKey) => {
    try {
      const searchParams = req.nextUrl.searchParams;
      const apiKeyId = searchParams.get('apiKeyId');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const endpoint = searchParams.get('endpoint');
      const statusCode = searchParams.get('statusCode');
      const method = searchParams.get('method');

      // Calcular período de tempo
      const period = searchParams.get('period') || '24h'; // 1h, 24h, 7d, 30d
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

      // Construir filtros
      const where: any = {
        timestamp: { gte: startDate },
      };

      if (apiKeyId) {
        where.apiKeyId = apiKeyId;
      }

      if (endpoint) {
        where.endpoint = { contains: endpoint };
      }

      if (statusCode) {
        where.statusCode = parseInt(statusCode);
      }

      if (method) {
        where.method = method;
      }

      // Buscar total de registros
      const total = await db.apiLog.count({ where });

      // Buscar logs com paginação
      const logs = await db.apiLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          apiKey: {
            select: {
              id: true,
              name: true,
              keyPrefix: true,
            },
          },
        },
      });

      // Calcular estatísticas
      const [successCount, errorCount, avgResponseTime] = await Promise.all([
        db.apiLog.count({
          where: { ...where, statusCode: { lt: 400 } },
        }),
        db.apiLog.count({
          where: { ...where, statusCode: { gte: 400 } },
        }),
        db.apiLog.aggregate({
          where,
          _avg: { responseTime: true },
        }),
      ]);

      return new Response(JSON.stringify({
        success: true,
        data: {
          logs: logs.map((log) => ({
            id: log.id,
            endpoint: log.endpoint,
            method: log.method,
            statusCode: log.statusCode,
            responseTime: log.responseTime,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            timestamp: log.timestamp,
            apiKey: {
              id: log.apiKey.id,
              name: log.apiKey.name,
              keyPrefix: log.apiKey.keyPrefix,
            },
          })),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
          stats: {
            total,
            successCount,
            errorCount,
            successRate: total > 0 ? ((successCount / total) * 100).toFixed(2) : '100',
            avgResponseTime: avgResponseTime._avg.responseTime || 0,
          },
        },
      }), { headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
      console.error('Error fetching logs:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch logs',
          code: 'FETCH_ERROR',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }, { requireAuth: false });
}
