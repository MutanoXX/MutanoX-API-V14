import { NextRequest } from 'next/server';
import { authenticatedPOST } from '@/lib/auth/handlers';
import { db } from '@/lib/db';
import { generateAPIKey, hashAPIKey, API_KEY_PREFIX_LENGTH } from '@/lib/auth/api-key';

/**
 * POST /api/dashboard/api-keys/[id]/rotate - Rotacionar uma API Key
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return authenticatedPOST(request, async (req, apiKey) => {
    try {
      const { id } = params;

      // Verificar se a API Key existe
      const existingKey = await db.aPIKey.findUnique({
        where: { id },
      });

      if (!existingKey) {
        return Response.json(
          {
            success: false,
            error: 'API Key not found',
            code: 'NOT_FOUND',
          },
          { status: 404 }
        );
      }

      // Gerar nova API Key
      const newApiKey = generateAPIKey();
      const keyPrefix = newApiKey.substring(0, API_KEY_PREFIX_LENGTH);
      const keyHash = hashAPIKey(newApiKey);

      // Atualizar API Key com novo hash
      const updatedKey = await db.aPIKey.update({
        where: { id },
        data: {
          keyHash,
          keyPrefix,
        },
      });

      return Response.json({
        success: true,
        data: {
          id: updatedKey.id,
          name: updatedKey.name,
          apiKey: newApiKey, // Nova chave completa (só retornar na rotação)
          keyPrefix: updatedKey.keyPrefix,
          isActive: updatedKey.isActive,
          rateLimitEnabled: updatedKey.rateLimitEnabled,
          rateLimitPerHour: updatedKey.rateLimitPerHour,
          expiresAt: updatedKey.expiresAt,
          rotatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error rotating API key:', error);
      return Response.json(
        {
          success: false,
          error: 'Failed to rotate API key',
          code: 'ROTATE_ERROR',
        },
        { status: 500 }
      );
    }
  }, { requireAuth: false });
}
