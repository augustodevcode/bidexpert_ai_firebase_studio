/**
 * @fileoverview Rota legada de edição de perfil, protegida por sessão autenticada.
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/auth/actions';

export const dynamic = 'force-dynamic';

export default async function LegacyEditProfileRedirectPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login?redirect=/profile/edit');
  }

  redirect('/dashboard/profile/edit');
}
