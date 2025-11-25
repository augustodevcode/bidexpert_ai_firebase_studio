// src/app/admin/admin-layout.client.tsx
'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, ShieldAlert } from 'lucide-react';
import { hasPermission } from '@/lib/permissions';
import DevInfoIndicator from '@/components/layout/dev-info-indicator';
import AdminHeader from '@/components/layout/admin-header';
import AdminSidebar from '@/components/layout/admin-sidebar';
import { WidgetPreferencesProvider } from '@/contexts/widget-preferences-context';
import WidgetConfigurationModal from '@/components/admin/dashboard/WidgetConfigurationModal';
import { ThemeProvider } from '@/components/theme-provider';
import AdminQueryMonitor from '@/components/support/admin-query-monitor';

interface AdminLayoutClientProps {
  children: React.ReactNode;
}

export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const { userProfileWithPermissions, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isWidgetConfigModalOpen, setIsWidgetConfigModalOpen] = useState(false);
  
  // Check if current page should be full-width
  const isFullWidth = pathname?.includes('/auction-control-center');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!userProfileWithPermissions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Sessão expirada</h1>
        <p className="text-muted-foreground mt-2">
          Não foi possível carregar suas informações. Faça login novamente para continuar.
        </p>
        <button
          onClick={() => router.push('/auth/login')}
          className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Ir para o Login
        </button>
      </div>
    );
  }

  const canAccessAdmin = hasPermission(userProfileWithPermissions, 'manage_all');

  if (!canAccessAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
        <p className="text-muted-foreground mt-2">
          Você não tem permissão para acessar o Painel de Administração.
        </p>
        <button
          onClick={() => router.push('/dashboard/overview')}
          className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Ir para seu Painel
        </button>
      </div>
    );
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <WidgetPreferencesProvider>
        <div className="flex min-h-screen bg-secondary">
          <AdminSidebar />
          <div className="flex flex-1 flex-col">
            <AdminHeader
              onSearchClick={() => setCommandPaletteOpen(true)}
              onSettingsClick={() => setIsWidgetConfigModalOpen(true)}
            />
            <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto pb-24">
              <div className="w-full">
                {children}
                <DevInfoIndicator />
              </div>
            </main>
            <AdminQueryMonitor />
          </div>
        </div>
        <WidgetConfigurationModal
          isOpen={isWidgetConfigModalOpen}
          onClose={() => setIsWidgetConfigModalOpen(false)}
        />
      </WidgetPreferencesProvider>
    </ThemeProvider>
  );
}
