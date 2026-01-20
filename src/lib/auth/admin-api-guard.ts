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
  error?: NextResponse;
}

/**
 * Valida a API Key administrativa a partir do header Authorization.
 * 
 * Formato esperado: "Authorization: Bearer <ADMIN_API_KEY>"
 * 
 * @param request NextRequest
 * @returns { isValid: boolean, error?: NextResponse }
 */
export function validateAdminApiKey(request: NextRequest): AdminApiGuardResult {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return {
      isValid: false,
      error: NextResponse.json(
        { 
          success: false, 
          error: 'UNAUTHORIZED',
          message: 'Header Authorization é obrigatório. Use: Authorization: Bearer <API_KEY>' 
        },
        { status: 401 }
      ),
    };
  }

  const [scheme, apiKey] = authHeader.split(' ');
  
  if (scheme?.toLowerCase() !== 'bearer' || !apiKey) {
    return {
      isValid: false,
      error: NextResponse.json(
        { 
          success: false, 
          error: 'INVALID_AUTH_FORMAT',
          message: 'Formato de autorização inválido. Use: Authorization: Bearer <API_KEY>' 
        },
        { status: 401 }
      ),
    };
  }

  const expectedApiKey = process.env.ADMIN_API_KEY;
  
  if (!expectedApiKey) {
    console.error('[AdminApiGuard] ADMIN_API_KEY não configurada no ambiente!');
    return {
      isValid: false,
      error: NextResponse.json(
        { 
          success: false, 
          error: 'SERVER_MISCONFIGURED',
          message: 'Servidor não configurado para autenticação de API.' 
        },
        { status: 500 }
      ),
    };
  }

  // Comparação segura (timing-safe seria ideal, mas para API key é aceitável)
  if (apiKey !== expectedApiKey) {
    return {
      isValid: false,
      error: NextResponse.json(
        { 
          success: false, 
          error: 'INVALID_API_KEY',
          message: 'API Key inválida.' 
        },
        { status: 401 }
      ),
    };
  }

  return { isValid: true };
}

/**
 * Valida a API Key específica de um Tenant para webhooks e integrações.
 * 
 * @param request NextRequest
 * @param tenantApiKey API Key do tenant (obtida do banco)
 * @returns { isValid: boolean, error?: NextResponse }
 */
export function validateTenantApiKey(
  request: NextRequest, 
  tenantApiKey: string | null
): AdminApiGuardResult {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return {
      isValid: false,
      error: NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Header Authorization é obrigatório.' },
        { status: 401 }
      ),
    };
  }

  const [scheme, apiKey] = authHeader.split(' ');
  
  if (scheme?.toLowerCase() !== 'bearer' || !apiKey) {
    return {
      isValid: false,
      error: NextResponse.json(
        { success: false, error: 'INVALID_AUTH_FORMAT', message: 'Formato de autorização inválido.' },
        { status: 401 }
      ),
    };
  }

  if (!tenantApiKey || apiKey !== tenantApiKey) {
    return {
      isValid: false,
      error: NextResponse.json(
        { success: false, error: 'INVALID_API_KEY', message: 'API Key do tenant inválida.' },
        { status: 401 }
      ),
    };
  }

  return { isValid: true };
}

/**
 * Higher-order function para criar um handler protegido por API Key admin.
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
      return guardResult.error!;
    }
    
    return handler(request);
  };
}

/**
 * Adiciona headers CORS para respostas administrativas.
 * Essencial para que o Control Plane (CRM) possa consumir esta API.
 */
export function withCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*'); // Idealmente restringir ao domínio do CRM
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-API-Key');
  return response;
}

/**
 * Trata requisições OPTIONS (CORS Preflight).
 */
export function handleCorsPreflightRequest(): NextResponse {
  return withCorsHeaders(
    NextResponse.json({ message: 'Preflight OK' }, { status: 200 })
  );
}
