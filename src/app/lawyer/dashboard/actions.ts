'use server';

import { lawyerDashboardService } from '@/services/lawyer-dashboard.service';
import { adminImpersonationService } from '@/services/admin-impersonation.service';
import type { LawyerDashboardOverview } from '@/types/lawyer-dashboard';
import { getCurrentUser } from '@/app/auth/actions';

export async function getLawyerDashboardOverviewAction(
  userId: string,
  impersonateUserId?: string
): Promise<LawyerDashboardOverview> {
  if (!userId) {
    throw new Error('Identificador do usuário é obrigatório para carregar o painel do advogado.');
  }

  let targetUserId = userId;

  // Se está tentando impersonar outro usuário
  if (impersonateUserId && impersonateUserId !== userId) {
    const canImpersonate = await adminImpersonationService.canImpersonate(
      userId,
      impersonateUserId
    );

    if (!canImpersonate) {
      throw new Error('Você não tem permissão para visualizar o painel deste usuário.');
    }

    targetUserId = impersonateUserId;
  }

  return lawyerDashboardService.getOverview(targetUserId);
}

export async function getImpersonatableLawyersAction() {
  const user = await getCurrentUser();
  
  if (!user?.id) {
    throw new Error('Usuário não autenticado.');
  }

  const isAdmin = await adminImpersonationService.isAdmin(user.id);
  if (!isAdmin) {
    throw new Error('Acesso negado. Apenas administradores podem acessar este recurso.');
  }

  return adminImpersonationService.getImpersonatableLawyers(user.id);
}
