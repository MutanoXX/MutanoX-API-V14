import { NextRequest, NextResponse } from 'next/server';
import { verifyAPIKey, checkRateLimit, logApiRequest, updateAPIKeyUsage } from '@/lib/auth/api-key';

/**
 * Middleware de autenticação por API Key
 * Extrai a API Key do header 'X-API-Key' ou do query parameter 'api_key'
 */
export async function withAPIAuth(
  request: NextRequest,
  handler: (request: NextRequest, apiKey: any) => Promise<NextResponse>,
  options?: {
    requireAuth?: boolean;
    bypassRateLimit?: boolean;
  }
): Promise<NextResponse> {
  const { requireAuth = true, bypassRateLimit = false } = options || {};

  // Extrair API Key
  const apiKeyHeader = request.headers.get('x-api-key');
  const apiKeyQuery = request.nextUrl.searchParams.get('api_key');
  const apiKey = apiKeyHeader || apiKeyQuery;

  // Se não requer autenticação e não há API Key, continua sem validação
  if (!requireAuth && !apiKey) {
    return handler(request, null);
  }

  // Se requer autenticação mas não há API Key, retorna erro
  if (!apiKey) {
    return NextResponse.json(
      { error: 'API Key is required', code: 'MISSING_API_KEY' },
      { status: 401 }
    );
  }

  // Verificar API Key
  const apiKeyRecord = await verifyAPIKey(apiKey);
  if (!apiKeyRecord) {
    return NextResponse.json(
      { error: 'Invalid or expired API Key', code: 'INVALID_API_KEY' },
      { status: 401 }
    );
  }

  // Verificar rate limit (se não estiver bypassing)
  if (!bypassRateLimit) {
    const rateLimit = await checkRateLimit(apiKeyRecord.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: 3600, // 1 hora em segundos
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Limit': apiKeyRecord.rateLimitPerHour?.toString() || 'unlimited',
            'X-RateLimit-Reset': Math.ceil((Date.now() + 3600000) / 1000).toString(),
          },
        }
      );
    }
  }

  // Executar handler e medir tempo de resposta
  const startTime = Date.now();
  const response = await handler(request, apiKeyRecord);
  const responseTime = Date.now() - startTime;

  // Atualizar estatísticas
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') ||
                   'unknown';
  const userAgent = request.headers.get('user-agent') || undefined;

  await updateAPIKeyUsage(apiKeyRecord.id, ipAddress);

  // Registrar log da requisição
  await logApiRequest({
    apiKeyId: apiKeyRecord.id,
    endpoint: request.nextUrl.pathname,
    method: request.method,
    statusCode: response.status,
    responseTime,
    ipAddress,
    userAgent,
  });

  // Adicionar headers de rate limit na resposta
  if (!bypassRateLimit && apiKeyRecord.rateLimitEnabled && apiKeyRecord.rateLimitPerHour) {
    const rateLimit = await checkRateLimit(apiKeyRecord.id);
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Limit', apiKeyRecord.rateLimitPerHour.toString());
    response.headers.set('X-RateLimit-Reset', Math.ceil((Date.now() + 3600000) / 1000).toString());
  }

  return response;
}

/**
 * Proteção avançada para endpoints em tempo real
 * Valida IP, User-Agent e implementa verificações de segurança adicionais
 */
export async function withAdvancedProtection(
  request: NextRequest,
  handler: (request: NextRequest, apiKey: any) => Promise<NextResponse>
): Promise<NextResponse> {
  // Verificar headers essenciais
  const userAgent = request.headers.get('user-agent');
  if (!userAgent || userAgent.length < 10) {
    return NextResponse.json(
      { error: 'Invalid User-Agent', code: 'INVALID_USER_AGENT' },
      { status: 400 }
    );
  }

  // Verificar timestamp para prevenir replay attacks
  const timestamp = request.headers.get('x-timestamp');
  if (timestamp) {
    const requestTime = parseInt(timestamp, 10);
    const now = Date.now();
    const timeDiff = Math.abs(now - requestTime);

    // Rejeitar requisições com mais de 5 minutos de diferença
    if (timeDiff > 300000) {
      return NextResponse.json(
        { error: 'Request timestamp too old', code: 'TIMESTAMP_TOO_OLD' },
        { status: 400 }
      );
    }
  }

  // Verificar se é uma requisição WebSocket válida
  if (request.headers.get('upgrade')?.toLowerCase() === 'websocket') {
    const origin = request.headers.get('origin');
    // Adicionar validação de origin se necessário
  }

  // Continuar com autenticação padrão de API Key
  return withAPIAuth(request, handler, { bypassRateLimit: false });
}

/**
 * Extrai informações do cliente da requisição
 */
export function getClientInfo(request: NextRequest): {
  ipAddress: string;
  userAgent: string;
  referer?: string;
} {
  return {
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    referer: request.headers.get('referer') || undefined,
  };
}
