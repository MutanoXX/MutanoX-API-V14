import { db } from '@/lib/db';
import { APIKey } from '@prisma/client';
import crypto from 'crypto';

export const API_KEY_PREFIX_LENGTH = 8;
export const API_KEY_LENGTH = 64;

/**
 * Gera uma nova API Key segura
 */
export function generateAPIKey(): string {
  return crypto.randomBytes(API_KEY_LENGTH).toString('hex');
}

/**
 * Cria o hash da API Key para armazenamento seguro
 */
export function hashAPIKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Verifica se uma API Key é válida
 */
export async function verifyAPIKey(apiKey: string): Promise<APIKey | null> {
  if (!apiKey) {
    return null;
  }

  const hash = hashAPIKey(apiKey);
  const keyRecord = await db.aPIKey.findUnique({
    where: { keyHash: hash },
    include: {
      apiLogs: {
        orderBy: { timestamp: 'desc' },
        take: 10,
      },
      endpointUsage: {
        orderBy: { lastUsedAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!keyRecord) {
    return null;
  }

  // Verificar se a chave está ativa
  if (!keyRecord.isActive) {
    return null;
  }

  // Verificar expiração
  if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
    return null;
  }

  return keyRecord;
}

/**
 * Atualiza estatísticas de uso da API Key
 */
export async function updateAPIKeyUsage(
  apiKeyId: string,
  ipAddress: string | null = null
): Promise<void> {
  await db.aPIKey.update({
    where: { id: apiKeyId },
    data: {
      lastUsedAt: new Date(),
      lastUsedIp: ipAddress,
      totalRequests: { increment: 1 },
    },
  });
}

/**
 * Registra erro de uso da API Key
 */
export async function incrementAPIKeyErrors(apiKeyId: string): Promise<void> {
  await db.aPIKey.update({
    where: { id: apiKeyId },
    data: {
      totalErrors: { increment: 1 },
    },
  });
}

/**
 * Verifica rate limit para uma API Key
 * Se rateLimitEnabled for false ou rateLimitPerHour for null, não há limite
 */
export async function checkRateLimit(apiKeyId: string): Promise<{ allowed: boolean; remaining: number }> {
  const apiKey = await db.aPIKey.findUnique({
    where: { id: apiKeyId },
  });

  if (!apiKey) {
    return { allowed: false, remaining: 0 };
  }

  // Se rate limit não está habilitado, permite tudo
  if (!apiKey.rateLimitEnabled || !apiKey.rateLimitPerHour) {
    return { allowed: true, remaining: -1 }; // -1 = ilimitado
  }

  // Contar requisições na última hora
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentRequests = await db.apiLog.count({
    where: {
      apiKeyId,
      timestamp: { gte: oneHourAgo },
    },
  });

  const remaining = Math.max(0, apiKey.rateLimitPerHour - recentRequests);
  const allowed = remaining > 0;

  return { allowed, remaining };
}

/**
 * Registra um log de requisição da API
 */
export async function logApiRequest(params: {
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  ipAddress?: string;
  userAgent?: string;
  requestBody?: string;
}): Promise<void> {
  await db.apiLog.create({
    data: {
      apiKeyId: params.apiKeyId,
      endpoint: params.endpoint,
      method: params.method,
      statusCode: params.statusCode,
      responseTime: params.responseTime,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      requestBody: params.requestBody,
    },
  });

  // Atualizar estatísticas de uso do endpoint
  await db.endpointUsage.upsert({
    where: {
      apiKeyId_endpoint: {
        apiKeyId: params.apiKeyId,
        endpoint: params.endpoint,
      },
    },
    create: {
      apiKeyId: params.apiKeyId,
      endpoint: params.endpoint,
      requestCount: 1,
      errorCount: params.statusCode >= 400 ? 1 : 0,
      totalResponseTime: params.responseTime,
    },
    update: {
      requestCount: { increment: 1 },
      errorCount: params.statusCode >= 400 ? { increment: 1 } : undefined,
      totalResponseTime: { increment: params.responseTime },
      lastUsedAt: new Date(),
    },
  });
}
