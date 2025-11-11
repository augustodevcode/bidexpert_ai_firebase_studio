// src/app/auctions/[auctionId]/components/auction-stats-card.tsx
/**
 * @fileoverview Card com estatísticas agregadas do leilão.
 */
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import type { Auction } from '@/types';

interface AuctionStatsCardProps {
  auction: Auction;
}

export default function AuctionStatsCard({ auction }: AuctionStatsCardProps) {
  const lots = auction.lots || [];
  const soldLots = lots.filter(l => l.status === 'VENDIDO').length;
  const unsoldLots = lots.filter(l => l.status === 'NAO_VENDIDO').length;
  const successRate = lots.length > 0 ? Math.round((soldLots / lots.length) * 100) : 0;
  
  // Valores (usar from DB se disponível)
  const estimatedRevenue = auction.estimatedRevenue || 0;
  const actualRevenue = auction.achievedRevenue || 0;

  const stats = [
    {
      label: 'Lotes Vendidos',
      value: soldLots,
      total: lots.length,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    {
      label: 'Lotes Não Vendidos',
      value: unsoldLots,
      total: lots.length,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950',
    },
    {
      label: 'Taxa de Sucesso',
      value: `${successRate}%`,
      total: '100%',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      label: 'Valor Arrecadado',
      value: `R$ ${actualRevenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
      total: `Est. R$ ${estimatedRevenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
    },
  ];

  return (
    <Card className="shadow-md border-0">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Estatísticas do Leilão
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className={`${stat.bgColor} rounded-lg p-4 border border-gray-200 dark:border-gray-700`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {stat.label}
                  </span>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="space-y-1">
                  <p className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                  {stat.total && (
                    <p className="text-xs text-muted-foreground">
                      de {stat.total}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
