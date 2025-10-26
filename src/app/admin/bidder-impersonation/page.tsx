// src/app/admin/bidder-impersonation/page.tsx
/**
 * @fileoverview Página de visualização como arrematante para administradores
 * Permite que admins vejam o dashboard como se fossem um arrematante específico
 */
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { BidderImpersonationDashboard } from '@/components/admin/bidder-impersonation/bidder-impersonation-dashboard';
import { getCurrentUser } from '@/app/auth/actions';
import { hasPermission } from '@/lib/permissions';
import { SellerService } from '@/services/seller.service';

export default async function BidderImpersonationPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Verificar se o usuário tem permissão de admin
  if (!hasPermission(user, 'manage_all')) {
     redirect('/dashboard/overview');
  }

  try {
    const sellerService = new SellerService();
    // No nosso sistema, 'Bidders' são 'Sellers' que não são judiciais
    const tenantId = user.tenants?.[0]?.id?.toString() || '1';
    const bidders = await sellerService.getSellers(tenantId);
    
    // Convertendo para o formato esperado pelo BidderImpersonationDashboard, se necessário,
    // ou ajustando o componente para aceitar SellerProfileInfo diretamente.
    // Por simplicidade, faremos um cast. A estrutura é similar.
    const biddersAsProfiles = bidders.map(b => ({
      ...b,
      userId: b.userId || '',
      documentStatus: 'APPROVED', // Placeholder
      _count: {
        wonLots: 0,
        notifications: 0,
        paymentMethods: 0,
      }
    })) as any[];

    return (
      <div className="container mx-auto px-4 py-8">
        <BidderImpersonationDashboard bidders={biddersAsProfiles} />
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
            Ocorreu um erro ao carregar os dados dos comitentes.
            Tente novamente em alguns instantes.
          </p>
        </div>
      </div>
    );
  }
}
