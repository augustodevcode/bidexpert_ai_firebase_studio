// src/app/admin/admin-layout.client.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, ShieldAlert } from 'lucide-react';
import { hasPermission, hasAnyPermission } from '@/lib/permissions';
import AdminHeader from '@/components/layout/admin-header';
import AdminSidebar from '@/components/layout/admin-sidebar';
import { WidgetPreferencesProvider } from '@/contexts/widget-preferences-context';
import WidgetConfigurationModal from '@/components/admin/dashboard/WidgetConfigurationModal';
import { ThemeProvider } from '@/components/theme-provider';
import dynamic from 'next/dynamic';

// Lazy-load query monitor so it doesn't affect the bundle when disabled
const AdminQueryMonitor = dynamic(() => import('@/components/support/admin-query-monitor'), { ssr: false });

const QUERY_MONITOR_LS_KEY = 'admin_query_monitor_enabled';
// Can be force-enabled via env var, otherwise reads from localStorage toggle in General Settings
const ENV_QUERY_MONITOR = process.env.NEXT_PUBLIC_QUERY_MONITOR_ENABLED === 'true';
import DevInfoIndicator from '@/components/layout/dev-info-indicator';

interface AdminLayoutClientProps {
  children: React.ReactNode;
}

const ADMIN_ACCESS_PERMISSIONS = [
  'manage_all',
  'auctions:read',
  'lots:read',
  'view_reports',
  'users:read',
  'sellers:read',
  'auctioneers:read',
  'categories:read',
  'assets:read',
  'judicial_processes:read'
];

export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const { userProfileWithPermissions, activeTenantId, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isWidgetConfigModalOpen, setIsWidgetConfigModalOpen] = useState(false);
  const [queryMonitorEnabled, setQueryMonitorEnabled] = useState(ENV_QUERY_MONITOR);

  const isFullWidth = pathname?.includes('/auction-control-center');
  
  // Read localStorage toggle for query monitor (client-side only)
  useEffect(() => {
    if (!ENV_QUERY_MONITOR) {
      const stored = localStorage.getItem(QUERY_MONITOR_LS_KEY);
      setQueryMonitorEnabled(stored === 'true');

      // Listen for changes from the settings page without a full reload
      const handleStorage = (e: StorageEvent) => {
        if (e.key === QUERY_MONITOR_LS_KEY) {
          setQueryMonitorEnabled(e.newValue === 'true');
        }
      };
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
  }, []);

  const handleQueryMonitorToggle = (enabled: boolean) => {
    setQueryMonitorEnabled(enabled);
    localStorage.setItem(QUERY_MONITOR_LS_KEY, enabled ? 'true' : 'false');
  };

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

  const canAccessAdmin = hasAnyPermission(userProfileWithPermissions, ADMIN_ACCESS_PERMISSIONS);
  const resolvedTenantId =
    activeTenantId ||
    userProfileWithPermissions.tenants?.[0]?.tenant?.id?.toString() ||
    '1';
  const resolvedUserEmail = userProfileWithPermissions.email || 'admin@bidexpert.ai';

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
          <div className="flex flex-1 flex-col pb-[var(--admin-query-monitor-height,0px)]">
            <AdminHeader
              onSearchClick={() => setCommandPaletteOpen(true)}
              onSettingsClick={() => setIsWidgetConfigModalOpen(true)}
              queryMonitorEnabled={queryMonitorEnabled}
              onQueryMonitorToggle={handleQueryMonitorToggle}
            />
            <main
              className={
                isFullWidth
                  ? 'flex flex-1 min-h-0 flex-col overflow-hidden p-4 pb-[calc(var(--admin-query-monitor-height,0px)+1rem)] sm:p-6 md:p-8'
                  : 'flex-1 overflow-y-auto p-4 pb-[calc(var(--admin-query-monitor-height,0px)+1rem)] sm:p-6 md:p-8'
              }
            >
              <div className={isFullWidth ? 'flex min-h-0 w-full flex-1 flex-col' : 'w-full'}>
                {children}
                <DevInfoIndicator
                  tenantId={resolvedTenantId}
                  userEmail={resolvedUserEmail}
                />
              </div>
            </main>
            {queryMonitorEnabled && <AdminQueryMonitor />}
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
