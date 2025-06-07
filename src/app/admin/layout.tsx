
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, ShieldAlert } from 'lucide-react';
import AdminSidebar from '@/components/layout/admin-sidebar';

// TODO: Replace this with actual role fetching and checking from Firestore
const ALLOWED_EMAILS_FOR_ADMIN_ACCESS = ['admin@bidexpert.com', 'analyst@bidexpert.com', 'augusto.devcode@gmail.com'];
const SUPER_TEST_USER_EMAIL = 'augusto.devcode@gmail.com';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Se não estiver carregando e não houver usuário, redirecione para login
      // Adicionando o redirect para voltar ao dashboard admin após o login
      router.push('/auth/login?redirect=/admin/dashboard');
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Redirecionando para login...</p>
      </div>
    );
  }

  // Placeholder for role check (case-insensitive email check)
  const userEmailLower = user.email?.toLowerCase();
  const isSuperTestUser = userEmailLower === SUPER_TEST_USER_EMAIL.toLowerCase();
  const isAdminByList = userEmailLower && ALLOWED_EMAILS_FOR_ADMIN_ACCESS.map(e => e.toLowerCase()).includes(userEmailLower);
  
  // Grant access if super test user OR if they are in the admin list (and userProfileWithPermissions has manage_all)
  // For development, we'll simplify to grant access if email matches or is in list.
  // In a real app, the `userProfileWithPermissions.permissions.includes('manage_all')` would be more robust after role assignment.
  const hasAdminAccess = isSuperTestUser || isAdminByList;


  if (!hasAdminAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
        <p className="text-muted-foreground mt-2">
          Você não tem permissão para acessar esta área.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          (Email verificado: {user.email || 'N/A'}, Permissão: {hasAdminAccess ? 'Concedida' : 'Negada'})
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
      <AdminSidebar />
      <main className="flex-1 p-6 md:p-8 bg-muted/30">
        {children}
      </main>
    </div>
  );
}
