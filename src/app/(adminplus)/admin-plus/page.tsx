/**
 * @fileoverview Página raiz do Admin Plus. Redireciona para o dashboard.
 */
import { redirect } from 'next/navigation';

export default function AdminPlusRootPage() {
  redirect('/admin-plus/dashboard');
}
