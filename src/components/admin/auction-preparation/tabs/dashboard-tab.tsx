/**
 * @fileoverview Dashboard principal da Central de Gerenciamento do Leilão.
 * Exibe KPIs, alertas operacionais e atalhos para as abas do control center.
 */
'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ExternalLink,
  Gavel,
  Package,
  Pencil,
  TrendingUp,
  Users,
} from 'lucide-react';
import GoToMonitorButton from '@/components/admin/auction-preparation/go-to-monitor-button';
import type {
  AuctionPreparationBid,
  AuctionPreparationHabilitation,
  AuctionPreparationWin,
} from '@/types';

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
  const auctionIdentifier = auction?.publicId || auction?.id;
  const controlCenterBasePath = auctionIdentifier
    ? `/admin/auctions/${auctionIdentifier}/auction-control-center`
    : '/admin/auctions';

  const tabLink = (tab: string) => `${controlCenterBasePath}?tab=${tab}`;
  const createLotHref = auction?.id
    ? {
        pathname: '/admin/lots/new',
        query: {
          auctionId: auction.id,
          returnTo: tabLink('lots'),
        },
      }
    : '/admin/lots/new';

  const totalLots = auction?.lots?.length ?? 0;
  const totalBids = bids.length;
  const totalHabilitations = habilitations.length;
  const currentRevenue = userWins.reduce((sum, win) => sum + (win.value || 0), 0);
  const projectedLotValue = (auction?.lots ?? []).reduce((sum: number, lot: any) => {
    const baseValue = lot?.initialPrice ?? lot?.price ?? 0;
    return sum + Number(baseValue || 0);
  }, 0);

  const stats = [
    {
      title: 'Total de Lotes',
      value: totalLots.toString(),
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      href: tabLink('lots'),
    },
    {
      title: 'Habilitados',
      value: totalHabilitations.toString(),
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      href: tabLink('habilitations'),
    },
    {
      title: 'Lances Recebidos',
      value: totalBids.toString(),
      icon: Gavel,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      href: tabLink('auction'),
    },
    {
      title: 'Valor Projetado',
      value: currencyFormatter.format(currentRevenue || projectedLotValue || 0),
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      href: tabLink('financial'),
    },
  ];

  const quickActions = [
    { label: 'Criar Lote', href: createLotHref, icon: Package },
    { label: 'Gerenciar Loteamento', href: tabLink('lotting'), icon: Package },
    { label: 'Configurar Marketing', href: tabLink('marketing'), icon: ExternalLink },
    {
      label: 'Editar Leilão',
      href: auctionIdentifier ? `/admin/auctions-v2/${auctionIdentifier}` : '/admin/auctions-v2',
      icon: Pencil,
    },
  ];

  const alerts = [] as { type: 'warning' | 'info'; message: string; action?: string; actionHref?: string }[];

  if (totalLots === 0) {
    alerts.push({
      type: 'warning',
      message: 'Ainda não há lotes cadastrados para este leilão.',
      action: 'Criar primeiro lote',
      actionHref: typeof createLotHref === 'string' ? createLotHref : '/admin/lots/new',
    });
  }

  if (habilitations.length === 0) {
    alerts.push({
      type: 'info',
      message: 'Nenhuma habilitação recebida até o momento.',
      action: 'Ver habilitações',
      actionHref: tabLink('habilitations'),
    });
  }

  if (totalBids === 0 && totalLots > 0) {
    alerts.push({
      type: 'warning',
      message: 'Lotes cadastrados aguardando primeiros lances.',
      action: 'Abrir pregão',
      actionHref: tabLink('auction'),
    });
  }

  return (
    <div className="space-y-6" data-ai-id="auction-control-center-dashboard-tab">
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
              <Link href={stat.href} className="text-xs text-muted-foreground hover:underline">
                Ver detalhes
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

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
                key={`${alert.type}-${idx}`}
                className="flex items-center justify-between gap-3 p-3 bg-amber-50 border border-amber-200 rounded-md"
              >
                <p className="text-sm">{alert.message}</p>
                {alert.action && alert.actionHref && (
                  <Link href={alert.actionHref}>
                    <Button variant="outline" size="sm">
                      {alert.action}
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Acesso rápido às principais funcionalidades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-3" data-ai-id="dashboard-monitor-btn-container">
            <GoToMonitorButton
              auction={auction}
              variant="default"
              className="w-full md:w-auto"
              dataAiId="admin-dashboard-go-monitor-btn"
            />
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
                <p className="font-medium">Leilão criado</p>
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
                <p className="font-medium">Configuração operacional</p>
                <p className="text-sm text-muted-foreground">
                  Complete lotes, habilitações e regras de pregão para iniciar com segurança.
                </p>
              </div>
            </div>

            {userWins.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium">Arremates registrados</p>
                  <p className="text-sm text-muted-foreground">
                    <Badge variant="secondary" className="mr-2">{userWins.length}</Badge>
                    lote(s) com arrematante confirmado.
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
