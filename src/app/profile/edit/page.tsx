/**
 * @fileoverview Rota legada para edição de perfil.
 * Mantida apenas para compatibilidade, redirecionando para a área administrativa
 * do painel do usuário em `/dashboard/profile/edit`.
 */

import { redirect } from 'next/navigation';

export default function LegacyEditProfileRedirectPage() {
  redirect('/dashboard/profile/edit');
}
