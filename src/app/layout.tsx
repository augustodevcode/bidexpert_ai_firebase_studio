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

console.log('[layout.tsx] LOG: RootLayout component is rendering/executing.');

export const metadata: Metadata = {
  title: 'BidExpert - Leilões Online',
  description: 'Sua plataforma especialista em leilões online.',
};

/**
 * Fetches only the essential data for the main layout, which is platform settings.
 * Other data will be fetched on the client side.
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

  // Simplified user object from session, no DB call needed here.
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
  const { platformSettings } = await getLayoutData();

  // Força o setup se a variável de ambiente estiver definida, senão assume que está completo
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
