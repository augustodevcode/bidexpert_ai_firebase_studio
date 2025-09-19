// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/auth-context';
import { headers } from 'next/headers';
import { AppContentWrapper } from './app-content-wrapper';
import { getSession } from '@/app/auth/actions';

console.log('[layout.tsx] LOG: RootLayout component is rendering/executing.');

export const metadata: Metadata = {
  title: 'BidExpert - Leilões Online',
  description: 'Seu parceiro especialista em leilões online.',
};

// Esta função agora é a única fonte da verdade para o contexto da aplicação.
async function getLayoutData() {
  const session = await getSession();
  const initialUser = session ? {
      id: session.userId,
      uid: session.userId,
      email: session.email,
      roleNames: session.roleNames,
      permissions: session.permissions,
  } as any : null;
  // Correção: Garante que sempre haverá um tenantId, usando '1' (Landlord) como padrão.
  const initialTenantId = session?.tenantId || '1';

  return { initialUser, initialTenantIdForProvider: initialTenantId };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  const { initialUser, initialTenantIdForProvider } = await getLayoutData();

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
        <AuthProvider initialUser={initialUser} initialTenantId={initialTenantIdForProvider}>
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
