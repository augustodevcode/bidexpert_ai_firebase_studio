/**
 * @fileoverview Protege a área /profile e subrotas exigindo sessão autenticada.
 */

import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/auth/actions';

export const dynamic = 'force-dynamic';

export default async function ProfileLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login?redirect=/profile');
  }

  return children;
}