// src/components/admin/auction-preparation/tabs/dashboard-tab.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Package,
  Users,
  Gavel,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Pencil,
} from 'lucide-react';
import Link from 'next/link';
import type {
  AuctionPreparationBid,
  AuctionPreparationHabilitation,
  AuctionPreparationWin,
} from '@/types';
import GoToMonitorButton from '@/components/admin/auction-preparation/go-to-monitor-button';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

interface DashboardTabProps {
  auction: any;
  bids: AuctionPreparationBid[];
  habilitations: AuctionPreparationHabilitation[];
  userWins: AuctionPreparationWin[];
}

export function DashboardTab({ auction, bids, habilitations, userWins }: DashboardTabProps) {
  const totalLots = auction?.lots?.length ?? 0;
  const totalBids = bids.length;
  const highestBidsByLot = bids.reduce<Record<string, number>>((map, bid) => {
    const current = map[bid.lotId] ?? 0;
    if (bid.amount > current) map[bid.lotId] = bid.amount;
    return map;
  }, {});
  const totalLotValue = (auction?.lots || []).reduce((sum: number, lot: any) => {
    const baseValue = lot.initialPrice ?? lot.price ?? 0;
    return sum + baseValue;
  }, 0);
  const currentRevenue = Object.values(highestBidsByLot).reduce((sum, value) => sum + value, 0);

  const stats = [
    {
      title: 'Total de Lotes',
      value: totalLots.toString(),
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      link: '#lots',
    },
    {
      title: 'Habilitados',
      value: habilitations.length.toString(),
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      link: '#habilitations',
    },
    {
      title: 'Lances Recebidos',
      value: totalBids.toString(),
      icon: Gavel,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      link: '#auction',
    },
    {
      title: 'Valor Total',
      value: currencyFormatter.format(currentRevenue || totalLotValue || 0),
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      link: '#financial',
    },
  ];

  const identifier = auction?.publicId || auction?.id;
  const quickActions = [
    { label: 'Criar Lote', href: `/admin/auctions/${identifier}/lots/new`, icon: Package },
    { label: 'Gerenciar Loteamento', href: `#lotting`, icon: Package },
    { label: 'Ver Habilitações', href: `#habilitations`, icon: Users },
    { label: 'Configurar Marketing', href: `#marketing`, icon: ExternalLink },
    { label: 'Editar Leilão', href: `/admin/auctions-v2/${identifier}`, icon: Pencil },
  ];

  const alerts = [] as { type: 'warning' | 'info'; message: string; action?: string }[];
  if (totalLots === 0) {
    alerts.push({
      type: 'warning',
      message: 'Ainda não há lotes cadastrados para este leilão.',
      action: 'Criar primeiro lote',
    });
  }
  if (habilitations.length === 0) {
    alerts.push({
      type: 'info',
      message: 'Nenhuma habilitação recebida até o momento.',
      action: 'Convidar participantes',
    });
  }
  if (totalBids === 0 && totalLots > 0) {
    alerts.push({
      type: 'warning',
      message: 'Lotes aguardando primeiros lances.',
      action: 'Configurar marketing',
    });
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-md`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <a href={stat.link} className="text-xs text-muted-foreground hover:underline">
                Ver detalhes →
              </a>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Alertas e Pendências
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-md"
              >
                <p className="text-sm">{alert.message}</p>
                {alert.action && (
                  <Button variant="outline" size="sm">
                    {alert.action}
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Acesso rápido às principais funcionalidades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-3" data-ai-id="dashboard-monitor-btn-container">
            <GoToMonitorButton auction={auction} variant="default" className="w-full md:w-auto" dataAiId="admin-dashboard-go-monitor-btn" />
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href}>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Auction Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Linha do Tempo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Leilão Criado</p>
                <p className="text-sm text-muted-foreground">
                  {auction?.createdAt
                    ? new Date(auction.createdAt).toLocaleDateString('pt-BR')
                    : 'Data não informada'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium">Configuração Pendente</p>
                <p className="text-sm text-muted-foreground">
                  Complete o cadastro de lotes e configurações
                </p>
              </div>
            </div>
            {userWins.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium">Arremates Registrados</p>
                  <p className="text-sm text-muted-foreground">
                    {userWins.length} lotes com arrematantes confirmados
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
