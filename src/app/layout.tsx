// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/auth-context';
import { headers } from 'next/headers';
import { AppContentWrapper } from './app-content-wrapper';
import { getSession } from '@/server/lib/session'; // Usando a função direta do servidor
import { prisma as basePrisma } from '@/lib/prisma';
import type { UserProfileWithPermissions, Role, Tenant } from '@/types';

console.log('[layout.tsx] LOG: RootLayout component is rendering/executing.');

export const metadata: Metadata = {
  title: 'BidExpert - Leilões Online',
  description: 'Seu parceiro especialista em leilões online.',
};

function formatUserWithPermissions(user: any): UserProfileWithPermissions | null {
    if (!user) return null;
    const roles: Role[] = user.roles?.map((ur: any) => ur.role) || [];
    const permissions = Array.from(new Set(roles.flatMap((r: any) => r.permissions || [])));
    const tenants: Tenant[] = user.tenants?.map((ut: any) => ut.tenant) || [];
    return {
        ...user, id: user.id, uid: user.id, roles, tenants,
        roleIds: roles.map((r: any) => r.id),
        roleNames: roles.map((r: any) => r.name),
        permissions, roleName: roles[0]?.name,
    };
}

// Esta função agora é a única fonte da verdade para o contexto da aplicação.
async function getLayoutData() {
  const session = await getSession();
  
  // Se não há sessão, não há usuário nem tenant específico
  if (!session?.userId) {
    return { initialUser: null, initialTenantId: '1' };
  }

  // Se há sessão, buscamos o usuário completo para popular o AuthProvider
  const user = await basePrisma.user.findUnique({
      where: { id: session.userId },
      include: {
          roles: { include: { role: true } },
          tenants: { include: { tenant: true } }
      }
  });

  const initialUser = formatUserWithPermissions(user);
  // O tenantId da sessão tem precedência
  const initialTenantId = session.tenantId || '1';

  return { initialUser, initialTenantId };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  const { initialUser, initialTenantId } = await getLayoutData();

  // A verificação do setup agora é feita no AppContentWrapper e no middleware
  const isSetupComplete = process.env.NEXT_PUBLIC_FORCE_SETUP !== 'true';

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider initialUser={initialUser} initialTenantId={initialTenantId}>
          <TooltipProvider delayDuration={0}>
            <AppContentWrapper isSetupComplete={isSetupComplete}>
              {children}
            </AppContentWrapper>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}