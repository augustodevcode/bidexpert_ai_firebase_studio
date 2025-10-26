// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { tenantContext } from '@/lib/tenant-context';
import { getSession } from '@/server/lib/session';

// Adicione aqui os caminhos que devem ser ignorados pelo middleware
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|assets|uploads).*)',
  ],
};

async function getTenantIdFromHostname(hostname: string): Promise<string> {
    const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:9002';
    const LANDLORD_URL = process.env.LANDLORD_URL || 'bidexpert.com.br';

    if (hostname === LANDLORD_URL || hostname === `www.${LANDLORD_URL}` || hostname === APP_DOMAIN) {
        return '1'; // Landlord Tenant ID
    }

    const subdomainMatch = hostname.match(`^(?!www\\.)(.+)\\.${APP_DOMAIN.replace('.', '\\.')}`);
    const subdomain = subdomainMatch ? subdomainMatch[1] : null;

    if (subdomain) {
        // Em um app real, você buscaria o tenant pelo subdomínio.
        // Por agora, vamos assumir um mapeamento ou retornar um valor padrão.
        // Esta lógica será expandida no futuro.
        // Ex: const tenant = await prisma.tenant.findUnique({ where: { subdomain }});
        // return tenant?.id || '1';
        return '1'; // Provisoriamente, todos subdomínios resolvem para o landlord
    }

    return '1'; // Default to landlord
}

export async function middleware(req: NextRequest) {
    const hostname = req.headers.get('host') || '';
    let tenantId = await getTenantIdFromHostname(hostname);

    // getSession agora lida com o auto-login em dev.
    const session = await getSession();
    
    // A sessão do usuário tem precedência para definir o tenant ativo
    if (session?.tenantId) {
        tenantId = session.tenantId;
    }

    // Armazena o tenantId no AsyncLocalStorage para ser usado pelo Prisma
    return tenantContext.run({ tenantId }, () => {
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set('x-tenant-id', tenantId);

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    });
}
