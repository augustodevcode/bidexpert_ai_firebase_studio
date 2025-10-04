// src/app/dashboard/layout.tsx
/**
 * @fileoverview Layout principal para o Painel do Usuário (Arrematante).
 * Este componente de cliente envolve todas as páginas do dashboard do arrematante.
 * Ele renderiza a barra lateral (`DashboardSidebar`), o novo cabeçalho (`AdminHeader`),
 * e o conteúdo da página, garantindo uma experiência de usuário consistente e
 * separada da área pública do site.
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, redirect } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import DashboardSidebar from '@/components/layout/dashboard-sidebar';
import DevInfoIndicator from '@/components/layout/dev-info-indicator';
import AdminHeader from '@/components/layout/admin-header'; // Reutilizando o header
import CommandPalette from '@/components/layout/command-palette';
import { WidgetPreferencesProvider } from '@/contexts/widget-preferences-context';
import WidgetConfigurationModal from '@/components/admin/dashboard/WidgetConfigurationModal';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userProfileWithPermissions, loading } = useAuth();
  const pathname = usePathname();
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isWidgetConfigModalOpen, setIsWidgetConfigModalOpen] = useState(false);

  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
         <p className="ml-3 text-muted-foreground">Carregando seu painel...</p>
      </div>
    );
  }

  if (!userProfileWithPermissions) {
    redirect(`/auth/login?redirect=${pathname}`);
  }

  return (
    <WidgetPreferencesProvider>
        <div className="flex min-h-screen bg-secondary">
          <DashboardSidebar />
           <div className="flex flex-1 flex-col">
            <AdminHeader 
                onSearchClick={() => setCommandPaletteOpen(true)} 
                onSettingsClick={() => setIsWidgetConfigModalOpen(true)}
            />
            <main className="flex-1 p-4 sm:p-6 md:p-8 bg-muted/30 overflow-y-auto">
                <div className="mx-auto max-w-7xl">
                    {children}
                    <DevInfoIndicator />
                </div>
            </main>
           </div>
        </div>
        <CommandPalette 
            isOpen={isCommandPaletteOpen}
            onOpenChange={setCommandPaletteOpen}
        />
        {/* O modal de configuração não é relevante para o usuário comum neste dashboard */}
         <WidgetConfigurationModal 
            isOpen={isWidgetConfigModalOpen}
            onClose={() => setIsWidgetConfigModalOpen(false)}
        />
    </WidgetPreferencesProvider>
  );
}
