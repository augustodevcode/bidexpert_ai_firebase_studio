/**
 * @file Guard semântico para conteúdo administrativo.
 * @description Renderiza conteúdo somente para sessão autenticada com papel administrativo.
 */

import type { ReactNode } from 'react';
import { auth } from '@/lib/auth';

interface AdminGuardProps {
  children: ReactNode;
}

function isAdminRole(roles?: string[]) {
  if (!roles || roles.length === 0) {
    return false;
  }

  return roles.includes('admin') || roles.includes('manage_all');
}

export default async function AdminGuard({ children }: AdminGuardProps) {
  const session = await auth();
  const roles = ((session?.user as { roles?: string[] } | undefined)?.roles) ?? [];

  if (!isAdminRole(roles)) {
    return null;
  }

  return <>{children}</>;
}
