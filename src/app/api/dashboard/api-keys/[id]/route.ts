import { NextRequest } from 'next/server';
import { authenticatedPATCH } from '@/lib/auth/handlers';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateAPIKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  rateLimitEnabled: z.boolean().optional(),
  rateLimitPerHour: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

/**
 * PATCH /api/dashboard/api-keys/[id] - Atualizar uma API Key
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return authenticatedPATCH(request, async (req, apiKey) => {
    try {
      const { id } = params;
      const body = await req.json();

      // Validar dados de entrada
      const validationResult = updateAPIKeySchema.safeParse(body);
      if (!validationResult.success) {
        return Response.json(
          {
            success: false,
            error: 'Invalid input data',
            details: validationResult.error.errors,
            code: 'VALIDATION_ERROR',
          },
          { status: 400 }
        );
      }

      const data = validationResult.data;

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

      // Preparar dados de atualização
      const updateData: any = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.rateLimitEnabled !== undefined) {
        updateData.rateLimitEnabled = data.rateLimitEnabled;
      }
      if (data.rateLimitPerHour !== undefined) {
        updateData.rateLimitPerHour = data.rateLimitPerHour;
      }
      if (data.expiresAt !== undefined) {
        updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
      }

      // Atualizar API Key
      const updatedKey = await db.aPIKey.update({
        where: { id },
        data: updateData,
      });

      return Response.json({
        success: true,
        data: {
          id: updatedKey.id,
          name: updatedKey.name,
          keyPrefix: updatedKey.keyPrefix,
          isActive: updatedKey.isActive,
          rateLimitEnabled: updatedKey.rateLimitEnabled,
          rateLimitPerHour: updatedKey.rateLimitPerHour,
          totalRequests: updatedKey.totalRequests,
          totalErrors: updatedKey.totalErrors,
          lastUsedAt: updatedKey.lastUsedAt,
          expiresAt: updatedKey.expiresAt,
          createdAt: updatedKey.createdAt,
          updatedAt: updatedKey.updatedAt,
        },
      });
    } catch (error) {
      console.error('Error updating API key:', error);
      return Response.json(
        {
          success: false,
          error: 'Failed to update API key',
          code: 'UPDATE_ERROR',
        },
        { status: 500 }
      );
    }
  }, { requireAuth: false });
}

/**
 * DELETE /api/dashboard/api-keys/[id] - Deletar uma API Key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return authenticatedDELETE(request, async (req, apiKey) => {
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

      // Deletar API Key (cascata apagará logs e estatísticas)
      await db.aPIKey.delete({
        where: { id },
      });

      return Response.json({
        success: true,
        message: 'API Key deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting API key:', error);
      return Response.json(
        {
          success: false,
          error: 'Failed to delete API key',
          code: 'DELETE_ERROR',
        },
        { status: 500 }
      );
    }
  }, { requireAuth: false });
}
