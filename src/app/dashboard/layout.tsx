// src/app/dashboard/layout.tsx
/**
 * @fileoverview Layout principal para o Painel do Usuário.
 * Este componente de cliente envolve todas as páginas do dashboard do arrematante,
 * como "Meus Lances" e "Meus Arremates". Ele é responsável por verificar a
 * autenticação do usuário, exibindo um estado de carregamento ou redirecionando
 * para o login se o usuário não estiver autenticado. Uma vez autenticado,
 * ele renderiza a barra lateral específica do usuário (`DashboardSidebar`)
 * e o conteúdo da página solicitada.
 */
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname, redirect } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import DashboardSidebar from '@/components/layout/dashboard-sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userProfileWithPermissions, loading } = useAuth();
  const pathname = usePathname();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
         <p className="ml-3 text-muted-foreground">Carregando seu painel...</p>
      </div>
    );
  }

  if (!userProfileWithPermissions) {
    // Se o código chegar aqui no lado do servidor, o redirect será usado.
    // No lado do cliente, o useEffect em AuthProvider já pode ter redirecionado.
    redirect(`/auth/login?redirect=${pathname}`);
  }

  // Se we reach here, loading is false and user exists. Render the dashboard.
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-4 sm:p-6 md:p-8 bg-muted/30 md:pl-8">
        {children}
      </main>
    </div>
  );
}
