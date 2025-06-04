
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, ShieldAlert } from 'lucide-react';
import ConsignorSidebar from '@/components/layout/consignor-sidebar';

// Idealmente, estas constantes viriam de um local compartilhado (ex: src/lib/auth-roles.ts)
const ALLOWED_EMAILS_FOR_ADMIN_ACCESS = ['admin@bidexpert.com', 'analyst@bidexpert.com', 'augusto.devcode@gmail.com'];
const EXAMPLE_CONSIGNOR_EMAIL = 'consignor@bidexpert.com'; // Email do comitente de exemplo

export default function ConsignorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/consignor-dashboard/overview');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Verificando autenticação...</p>
      </div>
    );
  }

  if (!user) {
    // Este caso é mais para fallback se o useEffect não redirecionar a tempo.
    // O redirecionamento principal acontece no useEffect.
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Redirecionando para login...</p>
      </div>
    );
  }

  const userEmailLower = user.email?.toLowerCase();
  const isAdminOrAnalyst = userEmailLower && ALLOWED_EMAILS_FOR_ADMIN_ACCESS.map(e => e.toLowerCase()).includes(userEmailLower);
  
  // Em um sistema real, você verificaria se user.uid está associado a um SellerProfileInfo.id
  // ou se o UserProfileData tem role === 'CONSIGNOR'.
  // Por agora, usamos um e-mail de exemplo para simular "o próprio comitente".
  const isTheExampleConsignor = userEmailLower === EXAMPLE_CONSIGNOR_EMAIL.toLowerCase();
  
  const canAccessConsignorDashboard = isAdminOrAnalyst || isTheExampleConsignor;

  if (!canAccessConsignorDashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
        <p className="text-muted-foreground mt-2">
          Você não tem permissão para acessar o Painel do Comitente.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          (E-mail verificado: {user.email || 'N/A'})
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
      <main className="flex-1 p-6 md:p-8 bg-muted/30">
        {children}
      </main>
    </div>
  );
}
