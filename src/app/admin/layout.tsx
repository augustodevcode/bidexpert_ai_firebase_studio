// src/app/admin/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, ShieldAlert } from 'lucide-react';
import AdminSidebar from '@/components/layout/admin-sidebar';
import { hasPermission } from '@/lib/permissions'; 
import DevInfoIndicator from '@/components/layout/dev-info-indicator';

export default function AdminLayout({
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
      <div className="container-loading-auth">
        <Loader2 className="icon-loading-spinner-large" />
        <p className="text-loading-status">Verificando autenticação e permissões...</p>
      </div>
    );
  }

  if (!userProfileWithPermissions) {
    return (
      <div className="container-redirect-login">
        <p className="text-muted-foreground">Redirecionando para login...</p>
      </div>
    );
  }
  
  // Use a granular permission or the master admin permission
  const hasAdminAccess = hasPermission(userProfileWithPermissions, 'manage_all');

  if (!hasAdminAccess) {
    return (
      <div className="container-access-denied">
        <ShieldAlert className="icon-access-denied" />
        <h1 className="title-access-denied">Acesso Negado</h1>
        <p className="text-access-denied-reason">
          Você não tem permissão para acessar esta área.
        </p>
        <p className="text-user-role-info">
          (Perfil: {userProfileWithPermissions?.roleNames?.join(', ') || 'N/A'})
        </p>
        <button
          onClick={() => router.push('/')}
          className="btn-back-home"
        >
          Voltar para a Página Inicial
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 md:p-8 bg-muted/30">
        {children}
        <DevInfoIndicator />
      </main>
    </div>
  );
}
