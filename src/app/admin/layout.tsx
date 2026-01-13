// src/app/admin/layout.tsx
import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { getCurrentUser } from '@/app/auth/actions';
import { hasAnyPermission } from '@/lib/permissions';
import { AdminLayoutClient } from './admin-layout.client';

interface AdminLayoutProps {
  children: ReactNode;
}

const ADMIN_ACCESS_PERMISSIONS = [
  'manage_all',
  'auctions:read',
  'lots:read',
  'view_reports',
  'users:read',
  'sellers:read',
  'auctioneers:read',
  'categories:read',
  'assets:read',
  'judicial_processes:read'
];

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login?redirect=/admin');
  }

  if (!hasAnyPermission(user, ADMIN_ACCESS_PERMISSIONS)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
        <p className="text-muted-foreground mt-2">
          Você não tem permissão para acessar o Painel de Administração.
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

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
