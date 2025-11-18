// src/app/dashboard/page.tsx
/**
 * @fileoverview Página principal do dashboard do arrematante
 * Central hub para todas as funcionalidades do bidder
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { bidderService } from '@/services/bidder.service';
import { BidderDashboard } from '@/components/dashboard/bidder/bidder-dashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  try {
    const userId = BigInt(session.user.id);
    const overview = await bidderService.getBidderDashboardOverview(userId);

    return (
      <div className="container mx-auto px-4 py-8">
        <BidderDashboard overview={overview} />
      </div>
    );
  } catch (error) {
    console.error('Error loading bidder dashboard:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            Erro ao carregar dashboard
          </h1>
          <p className="text-muted-foreground">
            Ocorreu um erro ao carregar os dados do seu dashboard.
            Tente novamente em alguns instantes.
          </p>
        </div>
      </div>
    );
  }
}
