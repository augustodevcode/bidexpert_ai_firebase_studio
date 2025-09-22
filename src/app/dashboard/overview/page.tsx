
// src/app/dashboard/overview/page.tsx
/**
 * @fileoverview Página "Visão Geral" do Painel do Usuário (Arrematante).
 * Este componente de cliente serve como a página inicial do dashboard,
 * exibindo um resumo das principais informações e atividades do usuário, como
 * status da habilitação, lances ativos, arremates pendentes, e listas
 * de lotes recomendados e próximos do encerramento.
 */
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCircle, Bell, ShoppingBag, Gavel, AlertCircle, Star, Settings, Loader2, CheckCircle2, Clock, FileText, FileWarning, ShieldAlert, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getUserHabilitationStatusInfo } from '@/lib/ui-helpers';
import type { Lot, UserWin, UserBid, UserHabilitationStatus } from '@/types';
import { useEffect, useState, useCallback } from 'react';
import { format, differenceInHours, differenceInMinutes, isPast, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { getDashboardOverviewDataAction, type DashboardOverviewData } from './actions';
import { useToast } from '@/hooks/use-toast';

function TimeRemaining({ endDate }: { endDate: Date | string | null | undefined }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!endDate) return;
    
    // Assegura que a data é um objeto Date válido.
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    if (!isValid(end)) {
        setRemaining('Data inválida');
        return;
    }

    const calculate = () => {
      const now = new Date();
      if (isPast(end)) {
        setRemaining('Encerrado');
        return;
      }
      const hours = differenceInHours(end, now);
      const minutes = differenceInMinutes(end, now) % 60;
      const days = differenceInDays(end, now);

      if (days > 0) {
        setRemaining(`${days}d ${hours % 24}h`);
      } else if (hours > 0) {
        setRemaining(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setRemaining(`${minutes}m`);
      } else {
        setRemaining('Encerrando');
      }
    };
    calculate();
    const interval = setInterval(calculate, 60000);
    return () => clearInterval(interval);
  }, [endDate]);

  return <span className="font-semibold">{remaining}</span>;
}


const initialData: DashboardOverviewData = {
    upcomingLots: [],
    pendingWinsCount: 0,
    recommendedLots: [],
    activeBidsCount: 0,
    habilitationStatus: null,
    auctionsWonCount: 0,
};

export default function DashboardOverviewPage() {
    const { userProfileWithPermissions, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [dashboardData, setDashboardData] = useState<DashboardOverviewData>(initialData);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async (userId: string) => {
        setIsLoading(true);
        try {
            const data = await getDashboardOverviewDataAction(userId);
            setDashboardData(data);
        } catch (error) {
            console.error("Error fetching dashboard overview data:", error);
            toast({ title: "Erro", description: "Não foi possível carregar os dados do painel.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (!authLoading && userProfileWithPermissions?.uid) {
            fetchData(userProfileWithPermissions.uid);
        } else if (!authLoading) {
            setIsLoading(false); // No user, stop loading
        }
    }, [userProfileWithPermissions, authLoading, fetchData]);

    const habilitationInfo = getUserHabilitationStatusInfo(dashboardData.habilitationStatus || undefined);
    const HabilitationIcon = habilitationInfo.icon;

    if (authLoading || isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Carregando painel...</p>
            </div>
        );
    }

  return (
    <div className="space-y-8" data-ai-id="user-dashboard-overview-page">
      <Card className="shadow-lg" data-ai-id="user-dashboard-header-card">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <UserCircle className="h-7 w-7 mr-3 text-primary" />
            Visão Geral do Dashboard
          </CardTitle>
          <CardDescription>
            Bem-vindo ao seu painel BidExpert. Aqui você pode gerenciar suas atividades de leilão.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-ai-id="user-dashboard-stats-grid">
            <Link href="/dashboard/bids" className="block hover:no-underline">
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Meus Lances Ativos</CardTitle><Gavel className="h-5 w-5 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-3xl font-bold text-primary">{dashboardData.activeBidsCount}</div><p className="text-xs text-muted-foreground mt-1">Acompanhe seus lances em andamento.</p></CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/wins" className="block hover:no-underline">
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Meus Arremates</CardTitle><ShoppingBag className="h-5 w-5 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-3xl font-bold text-primary">{dashboardData.auctionsWonCount}</div><p className="text-xs text-muted-foreground mt-1">Total de lotes que você arrematou.</p></CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/documents" className="block hover:no-underline">
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Status da Habilitação</CardTitle>{HabilitationIcon && <HabilitationIcon className="h-5 w-5 text-muted-foreground" />}</CardHeader>
                <CardContent><div className={`text-2xl font-bold ${habilitationInfo.textColor}`}>{habilitationInfo.text}</div><p className="text-xs text-muted-foreground mt-1">Verifique e gerencie seus documentos.</p></CardContent>
              </Card>
            </Link>
             <Link href="/dashboard/wins" className="block hover:no-underline">
                <Card className="hover:shadow-md transition-shadow h-full bg-amber-50 dark:bg-amber-900/30 border-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">Arremates Pendentes</CardTitle><AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" /></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{dashboardData.pendingWinsCount}</div><p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Pagamentos ou retiradas pendentes.</p></CardContent>
                </Card>
            </Link>
          </div>
        </CardContent>
      </Card>

      {dashboardData.upcomingLots.length > 0 && (
        <Card className="shadow-md" data-ai-id="user-dashboard-upcoming-lots-card">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center"><Clock className="h-5 w-5 mr-2 text-primary" /> Próximos Encerramentos</CardTitle>
            <CardDescription>Lotes com lances terminando em breve.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.upcomingLots.map(lot => (
              <Card key={lot.id} className="overflow-hidden">
                <Link href={`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`}>
                  <div className="relative aspect-video bg-muted"><Image src={lot.imageUrl || 'https://placehold.co/600x400.png'} alt={lot.title} fill className="object-cover" data-ai-hint={lot.dataAiHint || "lote proximo encerramento"} /></div>
                  <div className="p-3"><h4 className="text-sm font-semibold truncate mb-1">{lot.title}</h4><p className="text-xs text-muted-foreground">Leilão: {lot.auctionName}</p><div className="mt-2 flex justify-between items-center"><p className="text-lg font-bold text-primary">R$ {lot.price.toLocaleString('pt-BR')}</p><Badge variant="outline" className="text-xs"><Clock className="h-3 w-3 mr-1" /> <TimeRemaining endDate={lot.endDate} /></Badge></div></div>
                </Link>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
      
      {dashboardData.recommendedLots.length > 0 && (
         <Card className="shadow-md" data-ai-id="user-dashboard-recommendations-card">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center"><Star className="h-5 w-5 mr-2 text-amber-500" /> Recomendações para Você</CardTitle>
            <CardDescription>Lotes selecionados que podem te interessar.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {dashboardData.recommendedLots.map(lot => (
              <Card key={lot.id} className="overflow-hidden">
                <Link href={`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`}>
                  <div className="relative aspect-video bg-muted"><Image src={lot.imageUrl || 'https://placehold.co/600x400.png'} alt={lot.title} fill className="object-cover" data-ai-hint={lot.dataAiHint || "lote recomendado"} /></div>
                  <div className="p-3"><h4 className="text-sm font-semibold truncate mb-1">{lot.title}</h4><p className="text-xs text-muted-foreground">Local: {lot.cityName} - {lot.stateUf}</p><p className="text-lg font-bold text-primary mt-1">R$ {lot.price.toLocaleString('pt-BR')}</p></div>
                </Link>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
