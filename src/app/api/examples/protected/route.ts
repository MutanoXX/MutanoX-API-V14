import { NextRequest } from 'next/server';
import { authenticatedGET, authenticatedPOST } from '@/lib/auth/handlers';

/**
 * GET /api/examples/protected - Endpoint protegido com autenticação por API Key
 *
 * Exemplo de uso:
 * curl -H "X-API-Key: sua-chave-aqui" http://localhost:3000/api/examples/protected
 */
export async function GET(request: NextRequest) {
  return authenticatedGET(request, async (req, apiKey) => {
    return Response.json({
      success: true,
      message: 'Autenticação realizada com sucesso!',
      data: {
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          keyPrefix: apiKey.keyPrefix,
        },
        timestamp: new Date().toISOString(),
        request: {
          method: req.method,
          url: req.url.toString(),
        },
      },
    });
  });
}

/**
 * POST /api/examples/protected - Endpoint protegido com autenticação por API Key
 *
 * Exemplo de uso:
 * curl -X POST -H "X-API-Key: sua-chave-aqui" -H "Content-Type: application/json" \
 *   -d '{"message": "Hello World"}' http://localhost:3000/api/examples/protected
 */
export async function POST(request: NextRequest) {
  return authenticatedPOST(request, async (req, apiKey) => {
    const body = await req.json();

    return Response.json({
      success: true,
      message: 'Requisição POST processada com sucesso!',
      data: {
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          keyPrefix: apiKey.keyPrefix,
        },
        requestBody: body,
        timestamp: new Date().toISOString(),
      },
    });
  });
}
