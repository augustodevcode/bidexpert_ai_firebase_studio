// src/components/admin/auction-preparation/tabs/analytics-tab.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  Download,
  TrendingUp,
  Users,
  Eye,
  MousePointerClick,
  Clock,
  Activity,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type {
  Auction,
  AuctionPreparationBid,
  AuctionPreparationHabilitation,
  AuctionPreparationWin,
} from '@/types';

interface AnalyticsTabProps {
  auction: Auction;
  bids: AuctionPreparationBid[];
  habilitations: AuctionPreparationHabilitation[];
  userWins: AuctionPreparationWin[];
}

const numberFormatter = new Intl.NumberFormat('pt-BR');

const periodDurations: Record<string, number | null> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  all: null,
};

export function AnalyticsTab({ auction, bids, habilitations, userWins }: AnalyticsTabProps) {
  const [period, setPeriod] = useState('7d');

  const { bidsInPeriod, habilitationsInPeriod, winsInPeriod } = useMemo(() => {
    const duration = periodDurations[period];
    if (!duration) {
      return {
        bidsInPeriod: bids,
        habilitationsInPeriod: habilitations,
        winsInPeriod: userWins,
      };
    }
    const startTimestamp = Date.now() - duration;
    const isWithinPeriod = (value: string | undefined) => {
      if (!value) return false;
      return new Date(value).getTime() >= startTimestamp;
    };

    return {
      bidsInPeriod: bids.filter((bid) => isWithinPeriod(bid.timestamp)),
      habilitationsInPeriod: habilitations.filter((hab) => isWithinPeriod(hab.createdAt)),
      winsInPeriod: userWins.filter((win) => isWithinPeriod(win.winDate)),
    };
  }, [period, bids, habilitations, userWins]);

  const analytics = useMemo(() => {
    const visits = auction.visits ?? 0; // Métrica agregada do leilão; ainda não temos visitas por período.
    const totalBids = bidsInPeriod.length;
    const uniqueBidders = new Set(bidsInPeriod.map((bid) => bid.bidderId)).size;
    const lotsWithBids = new Set(bidsInPeriod.map((bid) => bid.lotId)).size;
    const totalBidValue = bidsInPeriod.reduce((sum, bid) => sum + (bid.amount || 0), 0);
    const totalRevenue = winsInPeriod.reduce((sum, win) => sum + (win.value || 0), 0);
    const conversionDenominator = visits || (auction.totalHabilitatedUsers ?? habilitations.length) || 1;
    const conversionRate = (habilitationsInPeriod.length / conversionDenominator) * 100;
    const totalHabilitationRequests = Math.max(
      auction.totalHabilitatedUsers ?? 0,
      habilitationsInPeriod.length,
    );

    const averageBidIntervalMs = (() => {
      if (bidsInPeriod.length < 2) return 0;
      const sorted = [...bidsInPeriod].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
      const totalDiff =
        new Date(sorted[sorted.length - 1].timestamp).getTime() -
        new Date(sorted[0].timestamp).getTime();
      return totalDiff / (sorted.length - 1);
    })();

    return {
      visits,
      totalBids,
      uniqueBidders,
      lotsWithBids,
      totalBidValue,
      totalRevenue,
      conversionRate,
      totalHabilitationRequests,
      averageBidIntervalMs,
    };
  }, [auction, bidsInPeriod, habilitations, habilitationsInPeriod.length, winsInPeriod]);

  const engagementSegments = useMemo(() => {
    const segments = [
      { label: 'Visitas totais', value: analytics.visits, color: 'bg-blue-600' },
      { label: 'Habilitações no período', value: habilitationsInPeriod.length, color: 'bg-green-600' },
      { label: 'Participantes únicos', value: analytics.uniqueBidders, color: 'bg-purple-600' },
      { label: 'Lances registrados', value: analytics.totalBids, color: 'bg-orange-600' },
      { label: 'Arremates confirmados', value: winsInPeriod.length, color: 'bg-red-600' },
    ];
    const total = segments.reduce((sum, item) => sum + item.value, 0) || 1;
    return { segments, total };
  }, [analytics, habilitationsInPeriod.length, winsInPeriod.length]);

  const funnelData = useMemo(() => {
    const stages = [
      { stage: 'Visitou Página do Leilão', count: analytics.visits, color: 'bg-blue-600' },
      {
        stage: 'Solicitou Habilitação',
        count: analytics.totalHabilitationRequests,
        color: 'bg-green-600',
      },
      {
        stage: 'Completou Habilitação',
        count: habilitationsInPeriod.length,
        color: 'bg-yellow-600',
      },
      { stage: 'Deu Lance', count: analytics.totalBids, color: 'bg-purple-600' },
      { stage: 'Arrematou', count: winsInPeriod.length, color: 'bg-red-600' },
    ];
    const maxValue = stages.reduce((max, item) => Math.max(max, item.count), 1);
    return { stages, maxValue };
  }, [analytics, habilitationsInPeriod.length, winsInPeriod.length]);

  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics e Relatórios
              </CardTitle>
              <CardDescription>Análise completa do desempenho do leilão</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Últimas 24h</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="all">Todo período</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visualizações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{numberFormatter.format(analytics.visits)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Dados totais desde o início
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Visitantes Únicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{numberFormatter.format(analytics.uniqueBidders)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Participantes ativos no período selecionado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" />
              Taxa de Cliques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Visitas x habilitações aprovadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tempo Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.averageBidIntervalMs > 0
                ? formatDuration(analytics.averageBidIntervalMs)
                : '0m 0s'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Tempo médio entre lances</p>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Engajamento</CardTitle>
          <CardDescription>Onde os participantes estão mais ativos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {engagementSegments.segments.map((segment) => (
              <div key={segment.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{segment.label}</span>
                  <span className="font-medium">{numberFormatter.format(segment.value)}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full ${segment.color}`}
                    style={{
                      width: `${Math.min(100, (segment.value / engagementSegments.total) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Behavior */}
      <Card>
        <CardHeader>
          <CardTitle>Comportamento do Usuário</CardTitle>
          <CardDescription>Ações mais realizadas pelos visitantes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <span className="text-sm">Visualizou Lotes</span>
              <span className="font-medium">{numberFormatter.format(analytics.lotsWithBids)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <span className="text-sm">Clicou em Dar Lance</span>
              <span className="font-medium">{numberFormatter.format(analytics.totalBids)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <span className="text-sm">Iniciou Cadastro</span>
              <span className="font-medium">{numberFormatter.format(analytics.totalHabilitationRequests)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <span className="text-sm">Completou Habilitação</span>
              <span className="font-medium">{numberFormatter.format(habilitationsInPeriod.length)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device & Browser placeholders */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dispositivos</CardTitle>
            <CardDescription>Distribuição por tipo de dispositivo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            A coleta detalhada de dispositivos será habilitada quando o módulo de analytics do
            front público estiver ativo neste ambiente.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Navegadores</CardTitle>
            <CardDescription>Navegadores mais utilizados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            Assim que houver eventos client-side instrumentados, exibiremos a divisão por
            navegador aqui.
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Funil de Conversão</CardTitle>
          <CardDescription>Jornada do visitante até o arremate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnelData.stages.map((stage) => (
              <div key={stage.stage} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{stage.stage}</span>
                  <span className="font-medium">{numberFormatter.format(stage.count)}</span>
                </div>
                <div className="h-8 bg-secondary rounded-md overflow-hidden flex items-center px-3">
                  <div
                    className={`h-full ${stage.color} transition-all`}
                    style={{
                      width: `${stage.count === 0 ? 2 : (stage.count / funnelData.maxValue) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
