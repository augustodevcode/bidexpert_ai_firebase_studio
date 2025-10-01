// src/app/admin/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, ShieldAlert } from 'lucide-react';
import AdminSidebar from '@/components/layout/admin-sidebar';
import { hasPermission } from '@/lib/permissions'; 
import DevInfoIndicator from '@/components/layout/dev-info-indicator';
import AdminHeader from '@/components/layout/admin-header';
import CommandPalette from '@/components/layout/command-palette'; // Importar a Command Palette

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userProfileWithPermissions, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    if (!loading && !userProfileWithPermissions) {
      router.push(`/auth/login?redirect=${pathname}`);
    }
  }, [userProfileWithPermissions, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Verificando autenticação e permissões...</p>
      </div>
    );
  }

  if (!userProfileWithPermissions) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Redirecionando para login...</p>
      </div>
    );
  }
  
  const hasAdminAccess = hasPermission(userProfileWithPermissions, 'manage_all');

  if (!hasAdminAccess) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-center p-4">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
        <p className="text-muted-foreground mt-2">
          Você não tem permissão para acessar esta área.
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
    <>
      <div className="flex min-h-screen bg-secondary">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <AdminHeader onSearchClick={() => setCommandPaletteOpen(true)} />
          <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
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
    </>
  );
}
