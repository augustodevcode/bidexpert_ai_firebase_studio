// src/app/layout.tsx
/**
 * @fileoverview O layout raiz da aplicação.
 * Este componente Server-Side é o ponto de entrada para toda a aplicação.
 * Ele busca dados essenciais como configurações da plataforma e o estado de
 * autenticação do usuário, envolve a aplicação com providers de contexto
 * (Autenticação, Tooltip) e renderiza a estrutura HTML base.
 */
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/auth-context';
import { AppContentWrapper } from './app-content-wrapper';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import SubscriptionPopup from '@/components/subscription-popup';
import { generateThemeCssFromSettings } from '@/lib/theme-injector';
import { Analytics } from '@vercel/analytics/next';

export const dynamic = 'force-dynamic';

console.log('[layout.tsx] LOG: RootLayout component is rendering/executing.');

export const metadata: Metadata = {
  title: 'BidExpert - Leilões Online',
  description: 'Sua plataforma especialista em leilões online.',
};

// PWA viewport config
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#000000',
};


async function getLayoutData() {
  try {
    const settings = await getPlatformSettings();
    return {
      platformSettings: settings,
      isSetupComplete: settings?.isSetupComplete || false,
    };
  } catch (error) {
    console.warn("[Layout Data Fetch] Could not fetch platform settings (this is expected on first run):", error);
    return {
      platformSettings: null,
      isSetupComplete: false,
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const { platformSettings, isSetupComplete } = await getLayoutData();
  const platformThemeCss = generateThemeCssFromSettings(platformSettings);

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BidExpert" />
        {platformThemeCss ? (
          <style
            id="platform-theme-css"
            dangerouslySetInnerHTML={{ __html: platformThemeCss }}
          />
        ) : null}
      </head>
      <body>
        <AuthProvider>
          <TooltipProvider delayDuration={0}>
            <AppContentWrapper
              isSetupComplete={true}
              platformSettings={platformSettings}
            >
              {children}
            </AppContentWrapper>
            {/* <SubscriptionPopup /> */}
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
