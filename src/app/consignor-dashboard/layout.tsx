// src/app/consignor-dashboard/layout.tsx
/**
 * @fileoverview Layout principal para o Painel do Comitente.
 * Este componente de cliente envolve todas as páginas do dashboard do comitente.
 * Ele é responsável por verificar a autenticação e as permissões do usuário,
 * exibindo um estado de carregamento ou uma mensagem de acesso negado se
 * as condições não forem atendidas. Se o acesso for permitido, ele renderiza
 * a barra lateral (`ConsignorSidebar`) e o conteúdo da página filha.
 */
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, ShieldAlert } from 'lucide-react';
import ConsignorSidebar from '@/components/layout/consignor-sidebar';
import { hasAnyPermission } from '@/lib/permissions'; 
import DevInfoIndicator from '@/components/layout/dev-info-indicator';

export default function ConsignorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userProfileWithPermissions, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !userProfileWithPermissions) {
      router.push(`/auth/login?redirect=${pathname}`);
    }
  }, [userProfileWithPermissions, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Verificando autenticação e permissões...</p>
      </div>
    );
  }

  if (!userProfileWithPermissions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Redirecionando para login...</p>
      </div>
    );
  }
  
  const canAccessConsignorDashboard = hasAnyPermission(userProfileWithPermissions, [
      'manage_all',
      'consignor_dashboard:view'
  ]);

  if (!canAccessConsignorDashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
        <p className="text-muted-foreground mt-2">
          Você não tem permissão para acessar o Painel do Comitente.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          (Perfil: {userProfileWithPermissions?.roleNames?.join(', ') || 'N/A'})
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Voltar para a Página Inicial
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <ConsignorSidebar />
      <main className="flex-1 p-4 sm:p-6 md:p-8 bg-muted/30">
        {children}
        <DevInfoIndicator />
      </main>
    </div>
  );
}
