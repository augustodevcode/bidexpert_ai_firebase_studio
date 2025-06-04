
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCircle, Bell, ShoppingBag, Gavel, AlertCircle, Star, Settings, Loader2, CheckCircle2, Clock, FileText, FileWarning, ShieldAlert, HelpCircle } from 'lucide-react'; // Added more icons
import Link from 'next/link';
import Image from 'next/image';
import { sampleLots, sampleUserWins, sampleUserBids, sampleUserHabilitationStatus, getUserHabilitationStatusInfo } from '@/lib/sample-data';
import type { Lot, UserWin, UserBid } from '@/types';
import { useEffect, useState } from 'react';
import { format, differenceInHours, differenceInMinutes, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge'; 

function TimeRemaining({ endDate }: { endDate: Date }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const calculate = () => {
      const now = new Date();
      if (isPast(endDate)) {
        setRemaining('Encerrado');
        return;
      }
      const hours = differenceInHours(endDate, now);
      const minutes = differenceInMinutes(endDate, now) % 60;

      if (hours > 24) {
        setRemaining(`${Math.floor(hours / 24)}d ${hours % 24}h`);
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

export default function DashboardOverviewPage() {
  const [upcomingLots, setUpcomingLots] = useState<Lot[]>([]);
  const [pendingWinsCount, setPendingWinsCount] = useState(0);
  const [recommendedLots, setRecommendedLots] = useState<Lot[]>([]);
  const [activeBidsCount, setActiveBidsCount] = useState(0);
  const [habilitationInfo, setHabilitationInfo] = useState(getUserHabilitationStatusInfo(sampleUserHabilitationStatus));


  useEffect(() => {
    // Próximos Encerramentos
    const openLots = sampleLots
      .filter(lot => lot.status === 'ABERTO_PARA_LANCES' && !isPast(new Date(lot.endDate)))
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    setUpcomingLots(openLots.slice(0, 3));

    // Arremates Pendentes
    const pending = sampleUserWins.filter(win => win.paymentStatus === 'PENDENTE');
    setPendingWinsCount(pending.length);

    // Recomendações
    setRecommendedLots(sampleLots.filter(lot => lot.isFeatured).slice(0, 3));

    // Lances Ativos
    const currentActiveBids = sampleUserBids.filter(bid => 
      bid.bidStatus === 'GANHANDO' || bid.bidStatus === 'PERDENDO' || bid.bidStatus === 'SUPERADO'
    ).length;
    setActiveBidsCount(currentActiveBids);

    // Status da Habilitação (já definido no useState inicial, mas poderia ser atualizado aqui se fosse dinâmico)
    setHabilitationInfo(getUserHabilitationStatusInfo(sampleUserHabilitationStatus));

  }, []);
  
  const auctionsWonCount = sampleUserWins.filter(win => win.paymentStatus === 'PAGO').length;
  const HabilitationIcon = habilitationInfo.icon; // Alias for JSX rendering

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link href="/dashboard/bids" className="block hover:no-underline">
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Meus Lances Ativos</CardTitle>
                  <Gavel className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{activeBidsCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Acompanhe seus lances em andamento.
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/wins" className="block hover:no-underline">
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Meus Arremates</CardTitle>
                  <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{auctionsWonCount}</div>
                   <p className="text-xs text-muted-foreground mt-1">
                    Lotes que você arrematou e pagou.
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/documents" className="block hover:no-underline">
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status da Habilitação</CardTitle>
                  {HabilitationIcon && <HabilitationIcon className="h-5 w-5 text-muted-foreground" />}
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${habilitationInfo.color}`}>{habilitationInfo.text}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Verifique e gerencie seus documentos.
                  </p>
                </CardContent>
              </Card>
            </Link>
             <Link href="/dashboard/wins" className="block hover:no-underline">
                <Card className="hover:shadow-md transition-shadow h-full bg-amber-50 dark:bg-amber-900/30 border-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">Arremates Pendentes</CardTitle>
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{pendingWinsCount}</div>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        Pagamentos ou retiradas pendentes.
                    </p>
                    </CardContent>
                </Card>
            </Link>
          </div>
        </CardContent>
      </Card>

      {upcomingLots.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              <Clock className="h-5 w-5 mr-2 text-primary" /> Próximos Encerramentos
            </CardTitle>
            <CardDescription>Lotes com lances terminando em breve.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingLots.map(lot => (
              <Card key={lot.id} className="overflow-hidden">
                <Link href={`/auctions/${lot.auctionId}/lots/${lot.id}`}>
                  <div className="relative aspect-video bg-muted">
                    <Image src={lot.imageUrl} alt={lot.title} fill className="object-cover" data-ai-hint={lot.dataAiHint || "lote proximo encerramento"} />
                  </div>
                  <div className="p-3">
                    <h4 className="text-sm font-semibold truncate mb-1">{lot.title}</h4>
                    <p className="text-xs text-muted-foreground">Leilão: {lot.auctionName}</p>
                    <div className="mt-2 flex justify-between items-center">
                        <p className="text-lg font-bold text-primary">R$ {lot.price.toLocaleString('pt-BR')}</p>
                        <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" /> <TimeRemaining endDate={new Date(lot.endDate)} />
                        </Badge>
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
      
      {recommendedLots.length > 0 && (
         <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              <Star className="h-5 w-5 mr-2 text-amber-500" /> Recomendações para Você
            </CardTitle>
            <CardDescription>Lotes selecionados que podem te interessar.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {recommendedLots.map(lot => (
              <Card key={lot.id} className="overflow-hidden">
                <Link href={`/auctions/${lot.auctionId}/lots/${lot.id}`}>
                  <div className="relative aspect-video bg-muted">
                    <Image src={lot.imageUrl} alt={lot.title} fill className="object-cover" data-ai-hint={lot.dataAiHint || "lote recomendado"} />
                  </div>
                  <div className="p-3">
                    <h4 className="text-sm font-semibold truncate mb-1">{lot.title}</h4>
                    <p className="text-xs text-muted-foreground">Local: {lot.location}</p>
                    <p className="text-lg font-bold text-primary mt-1">R$ {lot.price.toLocaleString('pt-BR')}</p>
                  </div>
                </Link>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

       <Card className="shadow-md">
        <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
                <Bell className="h-5 w-5 mr-2 text-primary" />
                Atividade Recente e Notificações
            </CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
                Esta seção mostrará suas últimas ações (lances, arremates, envio de documentos) e notificações importantes do sistema.
                (Em desenvolvimento)
            </p>
            <ul className="mt-4 space-y-3 text-xs">
                <li className="flex items-center p-2 bg-secondary/30 rounded-md">
                    <Gavel className="h-4 w-4 mr-3 text-green-500"/>
                    <span>Você deu um lance de R$ 5.200 no Lote #LOTEVEI001 - Audi A4.</span>
                </li>
                <li className="flex items-center p-2 bg-secondary/30 rounded-md">
                    <FileText className="h-4 w-4 mr-3 text-blue-500"/>
                    <span>Seu Documento de Identidade (Frente) foi aprovado.</span>
                </li>
                 <li className="flex items-center p-2 bg-secondary/30 rounded-md">
                    <ShoppingBag className="h-4 w-4 mr-3 text-amber-500"/>
                    <span>Pagamento pendente para o Lote #LOTE002 - Casa Lauro de Freitas.</span>
                </li>
            </ul>
             <div className="mt-4 text-right">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/notifications">Ver Todas Notificações</Link>
                </Button>
            </div>
        </CardContent>
       </Card>
    </div>
  );
}

