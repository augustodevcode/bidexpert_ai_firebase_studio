// src/app/app-content-wrapper.tsx
/**
 * @fileoverview Este componente de cliente age como um invólucro para o conteúdo
 * principal da aplicação. Ele determina qual layout renderizar com base na rota atual
 * (público vs. painéis de admin/dashboard) e lida com o redirecionamento
 * para a página de setup se a configuração inicial da plataforma não estiver completa.
 * Também integra o formulário de inscrição de newsletter no rodapé das páginas públicas.
 */
'use client'; 

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { SetupRedirect } from './setup/setup-redirect';
import type { PlatformSettings } from '@/types';
import { Loader2 } from 'lucide-react';
import DevInfoIndicator from '@/components/layout/dev-info-indicator';
import SubscriptionForm from '@/components/subscription-form'; 
import { ThemeProvider } from '@/components/theme-provider';
import FloatingSupportButtons from '@/components/support/floating-support-buttons';
import { FloatingActionsProvider } from '@/components/floating-actions/floating-actions-provider';
import { cn } from '@/lib/utils';

export function AppContentWrapper({ 
  children, 
  isSetupComplete,
  platformSettings,
}: { 
  children: React.ReactNode, 
  isSetupComplete: boolean,
  platformSettings: PlatformSettings | null,
}) {
  const pathname = usePathname();
  const isMapSearchPage = pathname.startsWith('/map-search');

  // If we are on the setup page, we don't want to render the main layout.
  if (pathname === '/setup') {
    return <>{children}</>;
  }

  // Determine if the current path is a special dashboard/admin layout
  const isDashboardLayout = pathname.startsWith('/admin') || pathname.startsWith('/dashboard') || pathname.startsWith('/consignor-dashboard') || pathname.startsWith('/lawyer');

  if (isDashboardLayout) {
    return (
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div className="flex min-h-screen flex-col bg-muted/40">
          {children}
        </div>
      </ThemeProvider>
    );
  }

  // For public pages, render the full site layout with ThemeProvider
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <FloatingActionsProvider>
        <SetupRedirect isSetupComplete={isSetupComplete} />
        <div className="flex flex-col min-h-screen">
          <Suspense fallback={<div className="flex items-center justify-center h-24 border-b"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
              <Header 
                platformSettings={platformSettings}
              />
          </Suspense>
          <main
            className={cn(
              'flex-grow w-full transition-all duration-300',
              isMapSearchPage ? 'max-w-[1680px] mx-auto px-2 sm:px-6 lg:px-10 py-6' : 'container mx-auto px-4 py-8'
            )}
            data-ai-id="main-content"
            data-layout={isMapSearchPage ? 'map-search' : 'default'}
          >
            {children}
          </main>
          <SubscriptionForm />
          <Footer />
          <FloatingSupportButtons />
        </div>
      </FloatingActionsProvider>
    </ThemeProvider>
  );
}
