import { NextRequest } from 'next/server';
import { authenticatedGET } from '@/lib/auth/handlers';
import { db } from '@/lib/db';

/**
 * GET /api/dashboard/api-keys - Listar todas as API Keys
 */
export async function GET(request: NextRequest) {
  return authenticatedGET(request, async (req, apiKey) => {
    try {
      // Buscar todas as API Keys com estatísticas
      const apiKeys = await db.aPIKey.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              apiLogs: true,
              endpointUsage: true,
            },
          },
        },
      });

      return Response.json({
        success: true,
        data: apiKeys.map((key) => ({
          id: key.id,
          name: key.name,
          keyPrefix: key.keyPrefix,
          isActive: key.isActive,
          rateLimitEnabled: key.rateLimitEnabled,
          rateLimitPerHour: key.rateLimitPerHour,
          totalRequests: key.totalRequests,
          totalErrors: key.totalErrors,
          lastUsedAt: key.lastUsedAt,
          lastUsedIp: key.lastUsedIp,
          expiresAt: key.expiresAt,
          createdAt: key.createdAt,
          updatedAt: key.updatedAt,
          logsCount: key._count.apiLogs,
          endpointsUsed: key._count.endpointUsage,
        })),
      });
    } catch (error) {
      console.error('Error fetching API keys:', error);
      return Response.json(
        {
          success: false,
          error: 'Failed to fetch API keys',
          code: 'FETCH_ERROR',
        },
        { status: 500 }
      );
    }
  }, { requireAuth: false }); // Dashboard não requer autenticação por API Key
}
