/**
 * @fileoverview Layout server-side do Admin Plus.
 * Responsável pela verificação de autenticação e permissões antes de renderizar
 * qualquer página do Admin Plus. Redireciona para login se não autenticado,
 * ou mostra tela de acesso negado se sem permissão.
 */
import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { getCurrentUser } from '@/app/auth/actions';
import { hasAnyPermission } from '@/lib/permissions';
import { AdminPlusShell } from '@/components/admin-plus/layout/admin-shell';

interface AdminPlusLayoutProps {
  children: ReactNode;
}

const ADMIN_PLUS_ACCESS_PERMISSIONS = [
  'manage_all',
  'auctions:read',
  'lots:read',
  'view_reports',
  'users:read',
  'sellers:read',
  'auctioneers:read',
  'categories:read',
  'assets:read',
  'judicial_processes:read',
];

export const dynamic = 'force-dynamic';

export default async function AdminPlusLayout({ children }: AdminPlusLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login?redirect=/admin-plus');
  }

  if (!hasAnyPermission(user, ADMIN_PLUS_ACCESS_PERMISSIONS)) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen text-center p-4"
        data-ai-id="admin-plus-access-denied"
      >
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
        <p className="text-muted-foreground mt-2">
          Você não tem permissão para acessar o Admin Plus.
        </p>
        <Link
          href="/dashboard/overview"
          className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Ir para seu Painel
        </Link>
      </div>
    );
  }

  return <AdminPlusShell>{children}</AdminPlusShell>;
}
