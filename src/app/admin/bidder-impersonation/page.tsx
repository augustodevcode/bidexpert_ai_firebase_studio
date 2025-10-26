// src/app/admin/bidder-impersonation/page.tsx
/**
 * @fileoverview Página de visualização como arrematante para administradores.
 * Permite que administradores vejam o dashboard como se fossem um arrematante específico.
 */
import { redirect } from 'next/navigation';
import { BidderImpersonationDashboard } from '@/components/admin/bidder-impersonation/bidder-impersonation-dashboard';
import { getCurrentUser } from '@/app/auth/actions';
import { hasPermission } from '@/lib/permissions';
import { getUsersWithRoles } from '@/app/admin/users/actions';
import { UserProfileWithPermissions } from '@/types';

export default async function BidderImpersonationPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login?redirect=/admin/bidder-impersonation');
  }

  // Verificar se o usuário tem permissão de admin
  if (!hasPermission(user, 'manage_all')) {
     redirect('/dashboard/overview');
  }

  try {
    // Busca todos os usuários e filtra aqueles que possuem o perfil "Bidder"
    const allUsers = await getUsersWithRoles();
    const bidders = allUsers.filter(u => u.roleNames?.includes('BIDDER'));

    return (
      <div className="container mx-auto px-4 py-8">
        <BidderImpersonationDashboard bidders={bidders as UserProfileWithPermissions[]} />
      </div>
    );
  } catch (error) {
    console.error('Error loading bidder impersonation:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            Erro ao Carregar Dados
          </h1>
          <p className="text-muted-foreground">
            Ocorreu um erro ao carregar a lista de arrematantes.
            Tente novamente em alguns instantes.
          </p>
        </div>
      </div>
    );
  }
}
