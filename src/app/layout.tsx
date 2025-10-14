// src/app/layout.tsx
/**
 * @fileoverview O layout raiz da aplicação.
 * Este componente Server-Side é o ponto de entrada para toda a aplicação.
 * Ele busca dados essenciais como configurações da plataforma e o estado de
 * autenticação do usuário, envolve a aplicação com providers de contexto
 * (Autenticação, Tooltip) e renderiza a estrutura HTML base. Também inclui
 * o `AppContentWrapper` que decide qual layout principal renderizar (público ou admin)
 * e o `SubscriptionPopup` para capturar novos inscritos.
 */
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
import SubscriptionPopup from '@/components/subscription-popup'; // Importar o novo componente
import { getCurrentUser } from '@/app/auth/actions';

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
  const user = await getCurrentUser();
  const session = await getSession();
  
  return { 
    initialUser: user, 
    initialTenantId: session?.tenantId || '1' 
  };
}


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  const { initialUser, initialTenantId } = await getInitialAuthData();
  const { platformSettings } = await getLayoutData();
  
  // Agora, a conclusão do setup é verificada através do banco de dados, não de uma variável de ambiente.
  const isSetupComplete = platformSettings?.isSetupComplete ?? false;

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
            <SubscriptionPopup />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
