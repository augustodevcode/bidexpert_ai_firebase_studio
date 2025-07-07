
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, ShieldAlert } from 'lucide-react';
import AdminSidebar from '@/components/layout/admin-sidebar';
import { hasPermission } from '@/lib/permissions'; 

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfileWithPermissions, loading } = useAuth();
  const router = useRouter();

  console.log('[AdminLayout Render] Auth State:', { 
    loading, 
    user: user?.email, 
    profileEmail: userProfileWithPermissions?.email,
    profilePermissions: userProfileWithPermissions?.permissions
  });

  const isAuthenticated = !!user || !!userProfileWithPermissions;

  useEffect(() => {
    console.log('[AdminLayout useEffect] Auth State Change:', { 
      loading, 
      isAuthenticated 
    });

    if (!loading && !isAuthenticated) {
      console.log('[AdminLayout useEffect] User not authenticated, redirecting to login.');
      router.push('/auth/login?redirect=/admin/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    console.log('[AdminLayout] Rendering: Auth Loading state.');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Verificando autenticação e permissões...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('[AdminLayout] Rendering: User not authenticated, redirect state or showing loader if redirect is about to happen.');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Redirecionando para login...</p>
      </div>
    );
  }
  
  if (!userProfileWithPermissions) {
    console.log('[AdminLayout] Rendering: User authenticated, but profile with permissions not yet loaded. Showing loader...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Carregando perfil do usuário...</p>
      </div>
    );
  }
  
  const hasAdminAccess = hasPermission(userProfileWithPermissions, 'manage_all');
  console.log('[AdminLayout] Rendering: Permission Check:', { 
    roleName: userProfileWithPermissions?.roleName, 
    permissions: userProfileWithPermissions?.permissions, 
    hasAdminAccess 
  });

  if (!hasAdminAccess) {
    console.log('[AdminLayout] Rendering: Access Denied.');
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
        <p className="text-muted-foreground mt-2">
          Você não tem permissão para acessar esta área.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          (Perfil: {userProfileWithPermissions?.roleName || 'N/A'}, Permissões: {userProfileWithPermissions?.permissions?.join(', ') || 'Nenhuma'})
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

  console.log('[AdminLayout] Rendering: Access Granted, showing children.');
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6 md:p-8 bg-muted/30">
        {children}
      </main>
    </div>
  );
}
