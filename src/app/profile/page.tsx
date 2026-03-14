/**
 * @fileoverview Página server-side que exige autenticação antes de renderizar o perfil.
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/auth/actions';
import ProfilePageClient from './ProfilePageClient';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login?redirect=/profile');
  }

  return <ProfilePageClient />;
}
