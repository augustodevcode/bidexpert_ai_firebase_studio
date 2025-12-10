// src/app/admin/auctions-v2/components/auction-analytics.tsx
/**
 * @fileoverview Componente de analytics do leilão.
 * Exibe métricas, gráficos e estatísticas do leilão.
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
// Tabs removidos pois não são usados neste componente
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Package,
  Gavel,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  PieChart,
} from 'lucide-react';
// Helper functions para formatação
const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('pt-BR').format(value);
};
import { cn } from '@/lib/utils';
import { getAuctionAnalyticsV2 } from '@/app/admin/auctions-v2/actions';

interface AuctionAnalyticsProps {
  auctionId: string;
}

interface AnalyticsData {
  totalLots: number;
  totalBids: number;
  totalHabilitatedUsers: number;
  totalRevenue: number;
  averageBidValue: number;
  conversionRate: number;
  lotsByStatus: { status: string; count: number }[];
  bidsByDay: { date: string; count: number }[];
}

// Status labels
const statusLabels: Record<string, string> = {
  DISPONIVEL: 'Disponível',
  ABERTO_PARA_LANCES: 'Aberto para Lances',
  ARREMATADO: 'Arrematado',
  NAO_VENDIDO: 'Não Vendido',
  RETIRADO: 'Retirado',
  PENDENTE: 'Pendente',
  DESCONHECIDO: 'Outros',
};

// Status colors
const statusColors: Record<string, string> = {
  DISPONIVEL: 'bg-green-500',
  ABERTO_PARA_LANCES: 'bg-blue-500',
  ARREMATADO: 'bg-purple-500',
  NAO_VENDIDO: 'bg-orange-500',
  RETIRADO: 'bg-red-500',
  PENDENTE: 'bg-yellow-500',
  DESCONHECIDO: 'bg-gray-500',
};

// Stat card component
function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendLabel,
  className,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  className?: string;
}) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        {trendLabel && trend && (
          <div className="mt-3 flex items-center text-sm">
            {trend === 'up' && (
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
            )}
            {trend === 'down' && (
              <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span
              className={cn(
                trend === 'up' && 'text-green-500',
                trend === 'down' && 'text-red-500'
              )}
            >
              {trendLabel}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AuctionAnalytics({ auctionId }: AuctionAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAuctionAnalyticsV2(auctionId);
      setAnalytics(data);
    } catch (e) {
      setError('Falha ao carregar analytics.');
      console.error('Error fetching analytics:', e);
    } finally {
      setIsLoading(false);
    }
  }, [auctionId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            {error || 'Não foi possível carregar os dados.'}
          </p>
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const maxBidsPerDay = Math.max(...analytics.bidsByDay.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics do Leilão
          </h3>
          <p className="text-sm text-muted-foreground">
            Métricas e estatísticas de desempenho
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAnalytics}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total de Lotes"
          value={formatNumber(analytics.totalLots)}
          icon={Package}
        />
        <StatCard
          title="Total de Lances"
          value={formatNumber(analytics.totalBids)}
          icon={Gavel}
        />
        <StatCard
          title="Usuários Habilitados"
          value={formatNumber(analytics.totalHabilitatedUsers)}
          icon={Users}
        />
        <StatCard
          title="Receita Total"
          value={formatCurrency(analytics.totalRevenue)}
          icon={DollarSign}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Valor Médio por Lance"
          value={formatCurrency(analytics.averageBidValue)}
          icon={TrendingUp}
          description="Média de todos os lances"
        />
        <StatCard
          title="Taxa de Conversão"
          value={`${analytics.conversionRate.toFixed(1)}%`}
          icon={Target}
          description="Lotes arrematados / total"
          trend={analytics.conversionRate >= 50 ? 'up' : analytics.conversionRate >= 25 ? 'neutral' : 'down'}
          trendLabel={analytics.conversionRate >= 50 ? 'Ótimo' : analytics.conversionRate >= 25 ? 'Regular' : 'Baixo'}
        />
        <StatCard
          title="Engajamento"
          value={analytics.totalLots > 0 ? (analytics.totalBids / analytics.totalLots).toFixed(1) : '0'}
          icon={Activity}
          description="Média de lances por lote"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lots by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Lotes por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.lotsByStatus.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum lote cadastrado
              </div>
            ) : (
              <div className="space-y-3">
                {analytics.lotsByStatus.map((item) => {
                  const percentage =
                    analytics.totalLots > 0
                      ? (item.count / analytics.totalLots) * 100
                      : 0;
                  const color = statusColors[item.status] || statusColors.DESCONHECIDO;
                  const label = statusLabels[item.status] || item.status;

                  return (
                    <div key={item.status} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={cn('w-3 h-3 rounded-full', color)} />
                          <span>{label}</span>
                        </div>
                        <span className="font-medium">
                          {item.count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bids by Day */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Lances por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.bidsByDay.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum lance registrado
              </div>
            ) : (
              <div className="space-y-2">
                {analytics.bidsByDay.slice(-7).map((item) => {
                  const percentage = (item.count / maxBidsPerDay) * 100;
                  const date = new Date(item.date).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                  });

                  return (
                    <div key={item.date} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{date}</span>
                        <span className="font-medium">{item.count} lances</span>
                      </div>
                      <div className="h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo de Desempenho</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Lotes Criados</div>
              <div className="text-xl font-bold">{analytics.totalLots}</div>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-950/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Arrematados</div>
              <div className="text-xl font-bold text-green-600">
                {analytics.lotsByStatus.find((s) => s.status === 'ARREMATADO')?.count || 0}
              </div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Em Disputa</div>
              <div className="text-xl font-bold text-blue-600">
                {analytics.lotsByStatus.find((s) => s.status === 'ABERTO_PARA_LANCES')?.count || 0}
              </div>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-950/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Não Vendidos</div>
              <div className="text-xl font-bold text-orange-600">
                {analytics.lotsByStatus.find((s) => s.status === 'NAO_VENDIDO')?.count || 0}
              </div>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Disponíveis</div>
              <div className="text-xl font-bold text-purple-600">
                {analytics.lotsByStatus.find((s) => s.status === 'DISPONIVEL')?.count || 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
