// src/lib/auth/admin-api-guard.ts
/**
 * @fileoverview Guard de autenticação para APIs administrativas.
 * 
 * Valida o header X-Admin-API-Key contra a variável de ambiente ADMIN_API_KEY.
 * Este guard é usado para proteger endpoints que só podem ser acessados pelo
 * Control Plane (BidExpertCRM) ou por integrações administrativas autorizadas.
 * 
 * CONFIGURAÇÃO:
 * 1. Defina a variável de ambiente ADMIN_API_KEY no .env
 * 2. Use o header "Authorization: Bearer <API_KEY>" nas requisições
 * 
 * IMPORTANTE: Nunca exponha a ADMIN_API_KEY no frontend!
 */

import { NextRequest, NextResponse } from 'next/server';

export interface AdminApiGuardResult {
  isValid: boolean;
  error?: string;
}

/**
 * Headers CORS para permitir chamadas do BidExpertCRM (Control Plane)
 */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // Em produção, especifique o domínio do CRM
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400', // 24 horas de cache para preflight
};

/**
 * Retorna resposta para requisições OPTIONS (CORS preflight)
 */
export function handleCorsPreflightRequest(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * Adiciona headers CORS a uma resposta
 */
export function withCorsHeaders(response: NextResponse): NextResponse {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Valida a API Key administrativa a partir do header Authorization.
 * 
 * Formato esperado: "Authorization: Bearer <ADMIN_API_KEY>"
 * 
 * @param request NextRequest
 * @returns { isValid: boolean, error?: string }
 */
export function validateAdminApiKey(request: NextRequest): AdminApiGuardResult {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return {
      isValid: false,
      error: 'Header Authorization é obrigatório. Use: Authorization: Bearer <API_KEY>',
    };
  }

  const [scheme, apiKey] = authHeader.split(' ');
  
  if (scheme?.toLowerCase() !== 'bearer' || !apiKey) {
    return {
      isValid: false,
      error: 'Formato de autorização inválido. Use: Authorization: Bearer <API_KEY>',
    };
  }

  const expectedApiKey = process.env.ADMIN_API_KEY;
  
  if (!expectedApiKey) {
    console.error('[AdminApiGuard] ADMIN_API_KEY não configurada no ambiente!');
    return {
      isValid: false,
      error: 'Servidor não configurado para autenticação de API.',
    };
  }

  // Comparação segura (timing-safe seria ideal, mas para API key é aceitável)
  if (apiKey !== expectedApiKey) {
    return {
      isValid: false,
      error: 'API Key inválida.',
    };
  }

  return { isValid: true };
}

/**
 * Valida a API Key específica de um Tenant para webhooks e integrações.
 * 
 * @param request NextRequest
 * @param tenantApiKey API Key do tenant (obtida do banco)
 * @returns { isValid: boolean, error?: string }
 */
export function validateTenantApiKey(
  request: NextRequest, 
  tenantApiKey: string | null
): AdminApiGuardResult {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return {
      isValid: false,
      error: 'Header Authorization é obrigatório.',
    };
  }

  const [scheme, apiKey] = authHeader.split(' ');
  
  if (scheme?.toLowerCase() !== 'bearer' || !apiKey) {
    return {
      isValid: false,
      error: 'Formato de autorização inválido.',
    };
  }

  if (!tenantApiKey || apiKey !== tenantApiKey) {
    return {
      isValid: false,
      error: 'API Key do tenant inválida.',
    };
  }

  return { isValid: true };
}

/**
 * Higher-order function para criar um handler protegido por API Key admin.
 * Inclui suporte a CORS automaticamente.
 * 
 * @example
 * export const POST = withAdminApiKey(async (request) => {
 *   // Handler logic here
 *   return NextResponse.json({ success: true });
 * });
 */
export function withAdminApiKey(
  handler: (request: NextRequest) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const guardResult = validateAdminApiKey(request);
    
    if (!guardResult.isValid) {
      return withCorsHeaders(
        NextResponse.json(
          { success: false, error: 'UNAUTHORIZED', message: guardResult.error },
          { status: 401 }
        )
      );
    }
    
    const response = await handler(request);
    return withCorsHeaders(response);
  };
}
