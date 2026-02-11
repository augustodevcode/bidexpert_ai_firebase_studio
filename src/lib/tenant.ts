/**
 * @file tenant.ts
 * @description Utilitários para obter contexto de tenant em server components/actions.
 */
'use server';

import { headers } from 'next/headers';

export interface TenantContext {
  tenantId: string;
  subdomain: string;
  name?: string;
}

/**
 * Obtém o contexto do tenant atual a partir dos headers da requisição.
 * Usado em Server Actions e Server Components.
 */
export async function getCurrentTenant(): Promise<TenantContext | null> {
  try {
    const headersList = await headers();
    const tenantId = headersList.get('x-tenant-id') || '';
    const subdomain = headersList.get('x-tenant-subdomain') || '';

    if (!tenantId && !subdomain) {
      // Em ambiente de desenvolvimento, usar tenant padrão
      return {
        tenantId: '1',
        subdomain: 'demo',
        name: 'Demo Tenant'
      };
    }

    return {
      tenantId,
      subdomain,
      name: undefined
    };
  } catch (error) {
    console.warn('[getCurrentTenant] Error getting headers:', error);
    // Fallback para desenvolvimento
    return {
      tenantId: '1',
      subdomain: 'demo',
      name: 'Demo Tenant'
    };
  }
}

/**
 * Obtém apenas o ID do tenant atual.
 */
export async function getCurrentTenantId(): Promise<string> {
  const tenant = await getCurrentTenant();
  return tenant?.tenantId || '1';
}
