// src/components/admin/bidder-impersonation/bidder-impersonation-dashboard.tsx
/**
 * @fileoverview Componente de visualização como arrematante para administradores.
 * Permite que admins naveguem pelo dashboard como se fossem um arrematante específico.
 */
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Eye, EyeOff, Users, Trophy, CreditCard, FileText, Bell, History, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import type { UserProfileWithPermissions } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getUserHabilitationStatusInfo } from '@/lib/ui-helpers';
import { getDashboardOverviewDataAction, type DashboardOverviewData } from '@/app/dashboard/overview/actions';

interface BidderImpersonationDashboardProps {
  bidders: UserProfileWithPermissions[];
}

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <Card className="bg-secondary/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

export function BidderImpersonationDashboard({ bidders }: BidderImpersonationDashboardProps) {
  const [selectedBidderId, setSelectedBidderId] = useState<string | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [bidderOverview, setBidderOverview] = useState<DashboardOverviewData | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const { toast } = useToast();

  const selectedBidder = bidders.find(b => b.id === selectedBidderId);

  const handleStartImpersonation = useCallback(async () => {
    if (!selectedBidderId) {
        toast({ title: "Selecione um arrematante", variant: "destructive" });
        return;
    }
    setLoadingData(true);
    try {
        const overviewData = await getDashboardOverviewDataAction(selectedBidderId);
        setBidderOverview(overviewData);
        setIsImpersonating(true);
        toast({ title: "Visualização Ativada", description: `Agora você está vendo o painel como ${selectedBidder?.fullName || selectedBidder?.email}.` });
    } catch(err: any) {
        toast({ title: "Erro ao buscar dados", description: err.message, variant: "destructive" });
    } finally {
        setLoadingData(false);
    }
  }, [selectedBidderId, selectedBidder, toast]);

  const handleExitImpersonation = () => {
    setIsImpersonating(false);
    setBidderOverview(null);
  };
  
  const HabilitationStatusBadge = ({ status }: { status: UserProfileWithPermissions['habilitationStatus'] }) => {
    const statusInfo = getUserHabilitationStatusInfo(status);
    const Icon = statusInfo.icon;
    return <Badge variant="outline" className={`border-l-2 ${statusInfo.textColor.replace('text-', 'border-')}`}><Icon className={`mr-1 h-3 w-3 ${statusInfo.textColor}`} />{statusInfo.text}</Badge>
  }

  if (isImpersonating && selectedBidder && bidderOverview) {
    return (
      <div className="space-y-4">
        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-900/30">
          <Eye className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-blue-800 dark:text-blue-200">
                Visualizando como: {selectedBidder.fullName || selectedBidder.email}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleExitImpersonation}>
              <EyeOff className="h-4 w-4 mr-2" />
              Sair da Visualização
            </Button>
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Lances Ativos" value={bidderOverview.activeBidsCount} icon={Gavel} />
            <StatCard title="Lotes Arrematados" value={bidderOverview.auctionsWonCount} icon={Trophy} />
            <StatCard title="Pagamentos Pendentes" value={bidderOverview.pendingWinsCount} icon={CreditCard} />
            <StatCard title="Notificações não Lidas" value={0} icon={Bell} />
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Atividades Recentes</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">O painel detalhado de atividades do usuário será implementado aqui.</p>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Visualização como Arrematante
          </CardTitle>
          <CardDescription>
            Selecione um arrematante para visualizar seu dashboard e dados como se você fosse ele.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-w-lg">
             <div className="space-y-2">
              <label className="text-sm font-medium">Selecione o Arrematante</label>
              <Select value={selectedBidderId || ''} onValueChange={setSelectedBidderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um arrematante..." />
                </SelectTrigger>
                <SelectContent>
                  {bidders.map((bidder) => (
                    <SelectItem key={bidder.id} value={bidder.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{bidder.fullName || bidder.email}</span>
                        <HabilitationStatusBadge status={bidder.habilitationStatus} />
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleStartImpersonation}
              disabled={loadingData || !selectedBidderId}
            >
              {loadingData ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Eye className="h-4 w-4 mr-2"/>}
              Iniciar Visualização
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
