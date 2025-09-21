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

/**
 * Server-side function to get initial authentication data from the session cookie.
 * This function avoids hitting the database for every page load.
 * @returns An object with the initial user profile (from session) and tenant ID.
 */
async function getInitialAuthData() {
  const session = await getSession();
  
  if (!session) {
    return { initialUser: null, initialTenantId: '1' };
  }

  // The AuthProvider will now be responsible for fetching the full user profile if needed,
  // but we can pass the session data as the initial state to avoid a loading screen.
  const initialUserFromSession: Partial<UserProfileWithPermissions> = {
      id: session.userId,
      uid: session.userId,
      email: session.email,
      roleNames: session.roleNames,
      permissions: session.permissions,
  };

  return { 
    initialUser: initialUserFromSession as UserProfileWithPermissions, 
    initialTenantId: session.tenantId || '1' 
  };
}


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  const { initialUser, initialTenantId } = await getInitialAuthData();

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