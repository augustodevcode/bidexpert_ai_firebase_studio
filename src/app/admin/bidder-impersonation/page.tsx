// src/app/admin/bidder-impersonation/page.tsx
/**
 * @fileoverview Página de visualização como arrematante para administradores
 * Permite que admins vejam o dashboard como se fossem um arrematante específico
 */

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BidderImpersonationDashboard } from '@/components/admin/bidder-impersonation/bidder-impersonation-dashboard';

export default async function BidderImpersonationPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  // TODO: Verificar se usuário tem permissão de admin
  // const userRole = await checkUserRole(session.user.id);
  // if (!userRole?.permissions.includes('IMPERSONATE_BIDDER')) {
  //   redirect('/admin');
  // }

  try {
    // Buscar todos os bidders para seleção
    const bidders = await prisma.bidderProfile.findMany({
      include: {
        user: true,
        _count: {
          select: {
            wonLots: true,
            notifications: true,
            paymentMethods: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return (
      <div className="container mx-auto px-4 py-8">
        <BidderImpersonationDashboard bidders={bidders} />
      </div>
    );
  } catch (error) {
    console.error('Error loading bidder impersonation:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            Erro ao carregar visualização
          </h1>
          <p className="text-muted-foreground">
            Ocorreu um erro ao carregar os dados dos arrematantes.
            Tente novamente em alguns instantes.
          </p>
        </div>
      </div>
    );
  }
}
