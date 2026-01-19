import { NextRequest } from 'next/server';
import { authenticatedPOST } from '@/lib/auth/handlers';
import { db } from '@/lib/db';
import { generateAPIKey, hashAPIKey, API_KEY_PREFIX_LENGTH } from '@/lib/auth/api-key';
import { z } from 'zod';

const createAPIKeySchema = z.object({
  name: z.string().min(1).max(100),
  rateLimitEnabled: z.boolean().optional().default(false),
  rateLimitPerHour: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
});

/**
 * POST /api/dashboard/api-keys/create - Criar uma nova API Key
 */
export async function POST(request: NextRequest) {
  return authenticatedPOST(request, async (req, apiKey) => {
    try {
      const body = await req.json();

      // Validar dados de entrada
      const validationResult = createAPIKeySchema.safeParse(body);
      if (!validationResult.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid input data',
            details: validationResult.error.issues,
            code: 'VALIDATION_ERROR',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const { name, rateLimitEnabled, rateLimitPerHour, expiresAt } = validationResult.data;

      // Gerar nova API Key
      const newApiKey = generateAPIKey();
      const keyPrefix = newApiKey.substring(0, API_KEY_PREFIX_LENGTH);
      const keyHash = hashAPIKey(newApiKey);

      // Criar registro no banco
      const apiKeyRecord = await db.aPIKey.create({
        data: {
          name,
          keyHash,
          keyPrefix,
          rateLimitEnabled,
          rateLimitPerHour: rateLimitEnabled ? rateLimitPerHour : null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      });

      // Retornar API Key (somente uma vez)
      return new Response(JSON.stringify({
        success: true,
        data: {
          id: apiKeyRecord.id,
          name: apiKeyRecord.name,
          apiKey: newApiKey, // Chave completa (só retornar na criação)
          keyPrefix: apiKeyRecord.keyPrefix,
          isActive: apiKeyRecord.isActive,
          rateLimitEnabled: apiKeyRecord.rateLimitEnabled,
          rateLimitPerHour: apiKeyRecord.rateLimitPerHour,
          expiresAt: apiKeyRecord.expiresAt,
          createdAt: apiKeyRecord.createdAt,
        },
      }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
      console.error('Error creating API key:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create API key',
          code: 'CREATE_ERROR',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }, { requireAuth: false });
}
