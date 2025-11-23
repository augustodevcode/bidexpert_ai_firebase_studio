// src/components/admin/auction-preparation/tabs/auction-tab.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, AlertTriangle, Gavel, Target, Activity } from 'lucide-react';

interface AuctionTabProps {
  auction: any;
}

export function AuctionTab({ auction }: AuctionTabProps) {
  // Mock data - será substituído por dados reais
  const revenueTarget = 1000000; // R$ 1.000.000,00
  const currentRevenue = 0;
  const progress = (currentRevenue / revenueTarget) * 100;

  return (
    <div className="space-y-6">
      {/* Live Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Lances em Tempo Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Lances recebidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Gavel className="h-4 w-4" />
              Participantes Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Usuários dando lances</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Valor Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-xs text-muted-foreground mt-1">Soma dos maiores lances</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Target */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Meta de Faturamento
          </CardTitle>
          <CardDescription>Acompanhe o progresso em relação à meta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso</span>
              <span className="font-medium">{progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Meta</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(revenueTarget)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Realizado</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(currentRevenue)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Alertas de Risco
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                Nenhum alerta no momento. O pregão está funcionando normalmente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Lots by Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Lotes Mais Ativos</CardTitle>
          <CardDescription>Lotes com maior número de lances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhum lance registrado ainda
          </div>
        </CardContent>
      </Card>

      {/* Bidding Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade de Lances</CardTitle>
          <CardDescription>Últimos lances recebidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Aguardando início dos lances
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
