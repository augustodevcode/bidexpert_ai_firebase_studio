// src/app/admin/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, redirect } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, ShieldAlert } from 'lucide-react';
import { hasPermission } from '@/lib/permissions';
import DevInfoIndicator from '@/components/layout/dev-info-indicator';
import AdminHeader from '@/components/layout/admin-header';
import { featureFlagService } from '@/services/feature-flags.service';
import AdminSidebar from '@/components/layout/admin-sidebar';
import { WidgetPreferencesProvider } from '@/contexts/widget-preferences-context';
import WidgetConfigurationModal from '@/components/admin/dashboard/WidgetConfigurationModal';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userProfileWithPermissions, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isWidgetConfigModalOpen, setIsWidgetConfigModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !userProfileWithPermissions) {
      redirect(`/auth/login?redirect=${pathname}`);
    }
  }, [userProfileWithPermissions, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!userProfileWithPermissions) {
    return null; // Don't render anything while redirecting
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
    <WidgetPreferencesProvider>
        <div className="flex min-h-screen bg-secondary">
          <AdminSidebar />
          <div className="flex flex-1 flex-col">
            <AdminHeader 
                onSearchClick={() => setCommandPaletteOpen(true)} 
                onSettingsClick={() => setIsWidgetConfigModalOpen(true)}
            />
            <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
              <div className="mx-auto max-w-7xl">
                {children}
                <DevInfoIndicator />
              </div>
            </main>
          </div>
        </div>
        <WidgetConfigurationModal 
            isOpen={isWidgetConfigModalOpen}
            onClose={() => setIsWidgetConfigModalOpen(false)}
        />
    </WidgetPreferencesProvider>
  );
}
