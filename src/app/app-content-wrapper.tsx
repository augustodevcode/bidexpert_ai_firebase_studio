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

  // For public pages, render the full site layout without the ThemeProvider
  // to enforce the default light theme.
  return (
    <>
      <SetupRedirect isSetupComplete={isSetupComplete} />
      <div className="flex flex-col min-h-screen">
        <Suspense fallback={<div className="flex items-center justify-center h-24 border-b"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
            <Header 
              platformSettings={platformSettings}
            />
        </Suspense>
        <main className="flex-grow container mx-auto px-4 py-8" data-ai-id="main-content">
          {children}
        </main>
        <SubscriptionForm />
        <Footer />
        <FloatingSupportButtons />
      </div>
    </>
  );
}
