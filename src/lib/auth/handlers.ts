import { NextRequest, NextResponse } from 'next/server';
import { withAPIAuth, withAdvancedProtection } from './middleware';

/**
 * Wrapper para rotas GET com autenticação por API Key
 */
export async function authenticatedGET(
  request: NextRequest,
  handler: (request: NextRequest, apiKey: any) => Promise<NextResponse>,
  options?: {
    requireAuth?: boolean;
    bypassRateLimit?: boolean;
    useAdvancedProtection?: boolean;
  }
): Promise<NextResponse> {
  const { useAdvancedProtection = false } = options || {};

  if (useAdvancedProtection) {
    return withAdvancedProtection(request, handler);
  }

  return withAPIAuth(request, handler, options);
}

/**
 * Wrapper para rotas POST com autenticação por API Key
 */
export async function authenticatedPOST(
  request: NextRequest,
  handler: (request: NextRequest, apiKey: any) => Promise<NextResponse>,
  options?: {
    requireAuth?: boolean;
    bypassRateLimit?: boolean;
    useAdvancedProtection?: boolean;
  }
): Promise<NextResponse> {
  const { useAdvancedProtection = false } = options || {};

  if (useAdvancedProtection) {
    return withAdvancedProtection(request, handler);
  }

  return withAPIAuth(request, handler, options);
}

/**
 * Wrapper para rotas PUT com autenticação por API Key
 */
export async function authenticatedPUT(
  request: NextRequest,
  handler: (request: NextRequest, apiKey: any) => Promise<NextResponse>,
  options?: {
    requireAuth?: boolean;
    bypassRateLimit?: boolean;
    useAdvancedProtection?: boolean;
  }
): Promise<NextResponse> {
  const { useAdvancedProtection = false } = options || {};

  if (useAdvancedProtection) {
    return withAdvancedProtection(request, handler);
  }

  return withAPIAuth(request, handler, options);
}

/**
 * Wrapper para rotas DELETE com autenticação por API Key
 */
export async function authenticatedDELETE(
  request: NextRequest,
  handler: (request: NextRequest, apiKey: any) => Promise<NextResponse>,
  options?: {
    requireAuth?: boolean;
    bypassRateLimit?: boolean;
    useAdvancedProtection?: boolean;
  }
): Promise<NextResponse> {
  const { useAdvancedProtection = false } = options || {};

  if (useAdvancedProtection) {
    return withAdvancedProtection(request, handler);
  }

  return withAPIAuth(request, handler, options);
}

/**
 * Wrapper para rotas PATCH com autenticação por API Key
 */
export async function authenticatedPATCH(
  request: NextRequest,
  handler: (request: NextRequest, apiKey: any) => Promise<NextResponse>,
  options?: {
    requireAuth?: boolean;
    bypassRateLimit?: boolean;
    useAdvancedProtection?: boolean;
  }
): Promise<NextResponse> {
  const { useAdvancedProtection = false } = options || {};

  if (useAdvancedProtection) {
    return withAdvancedProtection(request, handler);
  }

  return withAPIAuth(request, handler, options);
}
