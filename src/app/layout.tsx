// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/auth-context';
import { AppContentWrapper } from './app-content-wrapper';
import { getSession } from '@/server/lib/session';
import type { UserProfileWithPermissions, PlatformSettings } from '@/types';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { UserService } from '@/services/user.service';

console.log('[layout.tsx] LOG: RootLayout component is rendering/executing.');

export const metadata: Metadata = {
  title: 'BidExpert - Leilões Online',
  description: 'Sua plataforma especialista em leilões online.',
};

/**
 * Fetches only the essential data for the main layout, which is platform settings.
 */
async function getLayoutData() {
  try {
    const settings = await getPlatformSettings();
    return { 
      platformSettings: settings, 
    };
  } catch (error) {
    console.error("[Layout Data Fetch] Failed to fetch layout data:", error);
    return {
      platformSettings: null,
    };
  }
}

async function getInitialAuthData() {
  const session = await getSession();
  
  if (!session) {
    return { initialUser: null, initialTenantId: '1' };
  }

  // No servidor, vamos buscar o usuário completo para ter todos os dados na primeira carga
  const userService = new UserService();
  const fullUser = await userService.getUserById(session.userId);

  return { 
    initialUser: fullUser, 
    initialTenantId: session.tenantId || '1' 
  };
}


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  const { initialUser, initialTenantId } = await getInitialAuthData();
  const { platformSettings } = await getLayoutData();

  const isSetupComplete = !!process.env.DB_INIT_COMPLETE;

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
            <AppContentWrapper 
              isSetupComplete={isSetupComplete}
              platformSettings={platformSettings}
            >
              {children}
            </AppContentWrapper>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
