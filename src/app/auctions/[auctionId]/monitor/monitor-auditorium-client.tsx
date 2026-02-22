
/**
 * monitor-auditorium-client.tsx
 * Componente cliente principal do Monitor de Pregão V2.
 * Integra: WebSocket/Polling real-time, idempotência, soft-close visual,
 * feedback sonoro, proxy-bidding panel, bid log, connection status.
 */
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Auction, Lot, BidInfo, LotStatus } from '@/types';
import MonitorBidDisplay from '@/components/auction/monitor/MonitorBidDisplay';
import MonitorVideoBox from '@/components/auction/monitor/MonitorVideoBox';
import MonitorLotList from '@/components/auction/monitor/MonitorLotList';
import MonitorActionButtons from '@/components/auction/monitor/MonitorActionButtons';
import MonitorConnectionStatus from '@/components/auction/monitor/MonitorConnectionStatus';
import MonitorBidLog from '@/components/auction/monitor/MonitorBidLog';
import MonitorAutoBidPanel from '@/components/auction/monitor/MonitorAutoBidPanel';
import MonitorSoftCloseAlert from '@/components/auction/monitor/MonitorSoftCloseAlert';
import { useRealtimeBids } from '@/hooks/use-realtime-bids';
import { useBidSubmission } from '@/hooks/use-bid-submission';
import { useBidSounds } from '@/hooks/use-bid-sounds';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';
import { LogIn, Trophy, ChevronRight, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getBidsForLot } from '@/app/auctions/[auctionId]/lots/[lotId]/actions';
import { calculateMinimumBid } from '@/lib/ui-helpers';
import { habilitateForAuctionAction } from '@/app/admin/habilitations/actions';
import { formatCurrency } from '@/lib/format';

interface MonitorAuditoriumClientProps {
    auction: Auction;
    initialCurrentLot: Lot;
    initialUpcomingLots: Lot[];
    initialIsHabilitado: boolean;
    communicationStrategy?: 'WEBSOCKET' | 'POLLING';
    proxyBiddingEnabled?: boolean;
    idempotencyStrategy?: 'SERVER_HASH' | 'CLIENT_UUID';
}

export default function MonitorAuditoriumClient({
    auction,
    initialCurrentLot,
    initialUpcomingLots,
    initialIsHabilitado,
    communicationStrategy = 'WEBSOCKET',
    proxyBiddingEnabled = true,
    idempotencyStrategy = 'SERVER_HASH',
}: MonitorAuditoriumClientProps) {
    const { userProfileWithPermissions } = useAuth();
    const { toast } = useToast();
    const sounds = useBidSounds({ enabled: true, volume: 0.3 });
    const [allLots, setAllLots] = useState<Lot[]>(
        [initialCurrentLot, ...initialUpcomingLots].sort((a, b) => (a.number || '').localeCompare(b.number || ''))
    );
    const [currentLot, setCurrentLot] = useState<Lot>(initialCurrentLot);
    const [isHabilitado, setIsHabilitado] = useState(initialIsHabilitado);
    const [bidHistory, setBidHistory] = useState<BidInfo[]>([]);
    const [isHabilitando, setIsHabilitando] = useState(false);
    const [showWinnerBanner, setShowWinnerBanner] = useState(false);
    const [winnerName, setWinnerName] = useState<string>('');
    const prevLotStatusRef = useRef<string>(initialCurrentLot.status);

    // V2 Real-time hook
    const {
        bids: realtimeBids,
        lotState,
        softCloseAlert,
        isConnected,
        connectionType,
        clearSoftCloseAlert,
    } = useRealtimeBids({
        lotId: currentLot.publicId || currentLot.id,
        auctionId: auction.publicId || auction.id,
        enabled: true,
        strategy: communicationStrategy,
        pollingIntervalMs: 3000,
    });

    // V2 Bid submission hook
    const { submitBid, isSubmitting } = useBidSubmission({
        lotId: currentLot.publicId || currentLot.id,
        auctionId: auction.publicId || auction.id,
        userId: userProfileWithPermissions?.id || '',
        userName: userProfileWithPermissions?.fullName || 'Usuário Anônimo',
        idempotencyStrategy,
        onSuccess: (result) => {
            sounds.playMyBidAccepted();
            if (result?.updatedLot) {
                setCurrentLot(prev => ({ ...prev, ...result.updatedLot }));
            }
            fetchBidHistory();
        },
        onError: () => {
            sounds.playError();
        },
    });

    // Sound effect on new realtime bid
    useEffect(() => {
        if (realtimeBids.length > 0) {
            const latest = realtimeBids[0];
            if (latest.bidderId !== userProfileWithPermissions?.id) {
                sounds.playNewBid();
            }
        }
    }, [realtimeBids[0]?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Sound + visual on soft-close
    useEffect(() => {
        if (softCloseAlert) {
            sounds.playSoftClose();
        }
    }, [softCloseAlert]); // eslint-disable-line react-hooks/exhaustive-deps

    // Update lot state from realtime data
    useEffect(() => {
        if (lotState) {
            setCurrentLot(prev => ({
                ...prev,
                price: lotState.price,
                bidsCount: lotState.bidsCount,
                status: lotState.status as any,
                endDate: lotState.endDate ? new Date(lotState.endDate) : prev.endDate,
            }));
        }
    }, [lotState]);

    const fetchBidHistory = useCallback(async () => {
        if (!currentLot?.id) return;
        try {
            const history = await getBidsForLot(currentLot.publicId || currentLot.id);
            setBidHistory(history);

            // Auto-advance: detect when lot closes
            if (prevLotStatusRef.current === 'ABERTO_PARA_LANCES' && currentLot.status !== 'ABERTO_PARA_LANCES') {
                if (history.length > 0) {
                    const winner = history[0]?.bidderDisplay || 'Arrematante';
                    setWinnerName(winner);
                    setShowWinnerBanner(true);
                    sounds.playLotSold();
                    toast({
                        title: 'Lote Arrematado!',
                        description: `Vencedor: ${winner} — ${formatCurrency(history[0].amount)}`,
                    });
                    setTimeout(() => setShowWinnerBanner(false), 8000);
                }
                const nextOpenLot = allLots.find(l => l.id !== currentLot.id && (l.status as string) === 'ABERTO_PARA_LANCES');
                if (nextOpenLot) {
                    setTimeout(() => {
                        setCurrentLot(nextOpenLot);
                        setBidHistory([]);
                        prevLotStatusRef.current = nextOpenLot.status;
                        toast({ title: 'Próximo lote', description: `Avançando para: ${nextOpenLot.title}` });
                    }, 5000);
                }
            }
            prevLotStatusRef.current = currentLot.status;
        } catch (error) {
            console.error('Erro ao buscar histórico de lances:', error);
        }
    }, [currentLot?.id, currentLot?.publicId, currentLot?.status, allLots, toast, sounds]);

    // Only poll bid history when using POLLING strategy (WS gets real-time events)
    useEffect(() => {
        prevLotStatusRef.current = currentLot.status;
        fetchBidHistory();
        // Keep a slower background sync for bid history (covers action-based bids)
        const interval = setInterval(fetchBidHistory, communicationStrategy === 'POLLING' ? 3000 : 10000);
        return () => clearInterval(interval);
    }, [fetchBidHistory, communicationStrategy]);

    const nextMinimumBid = calculateMinimumBid(
        currentLot,
        null,
        bidHistory.length,
        bidHistory[0]?.amount ?? currentLot?.price ?? null
    );

    const handleLotSelect = useCallback((lot: Lot) => {
        setCurrentLot(lot);
        setBidHistory([]);
        prevLotStatusRef.current = lot.status;
    }, []);

    const handleBid = useCallback(async () => {
        if (!userProfileWithPermissions) {
            toast({ title: 'Atenção', description: 'Faça login para dar lances.', variant: 'destructive' });
            return;
        }
        if (!isHabilitado) {
            toast({ title: 'Atenção', description: 'Habilite-se para dar lances.', variant: 'destructive' });
            return;
        }
        if (currentLot.status !== 'ABERTO_PARA_LANCES') {
            toast({ title: 'Atenção', description: 'Lote não está aberto para lances.', variant: 'destructive' });
            return;
        }
        await submitBid(nextMinimumBid);
    }, [userProfileWithPermissions, isHabilitado, currentLot, nextMinimumBid, toast, submitBid]);

    const handleHabilitate = useCallback(async () => {
        if (!userProfileWithPermissions?.id || !auction?.id) return;
        setIsHabilitando(true);
        const result = await habilitateForAuctionAction(userProfileWithPermissions.id, auction.id);
        if (result.success) {
            toast({ title: 'Sucesso!', description: 'Você está habilitado para dar lances neste leilão.' });
            setIsHabilitado(true);
        } else {
            toast({ title: 'Erro', description: result.message, variant: 'destructive' });
        }
        setIsHabilitando(false);
    }, [userProfileWithPermissions, auction, toast]);

    const currentLotIndex = allLots.findIndex(l => l.id === currentLot.id);
    const lotProgress = `${currentLotIndex + 1} / ${allLots.length}`;

    return (
        <div data-ai-id="monitor-auditorium" className="flex flex-col h-screen bg-muted/50 overflow-hidden">

            {/* Banner de Vencedor */}
            {showWinnerBanner && (
                <div
                    data-ai-id="monitor-winner-banner"
                    className="fixed top-0 left-0 right-0 z-50 bg-amber-400 text-amber-900 px-6 py-3 flex items-center justify-center gap-3 shadow-2xl animate-in slide-in-from-top duration-500"
                >
                    <Trophy className="h-6 w-6 text-amber-700" />
                    <span className="text-xl font-black uppercase tracking-tight">
                        ARREMATADO! Vencedor: {winnerName}
                    </span>
                    <Trophy className="h-6 w-6 text-amber-700" />
                </div>
            )}

            {/* Header */}
            <header data-ai-id="monitor-header" className="bg-primary text-primary-foreground p-4 shadow-xl flex justify-between items-center z-20">
                <div className="flex items-center gap-6">
                    <div className="bg-white/10 p-2 rounded-md">
                        <p className="text-xs font-bold text-white/60 uppercase tracking-widest leading-none mb-1">Leilão</p>
                        <p className="text-lg font-black text-white leading-none truncate max-w-[200px]" title={auction.title}>
                            {auction.title || 'Monitor de Pregão'}
                        </p>
                    </div>

                    <div className="h-10 w-px bg-white/20" />

                    <div>
                        <p className="text-xs font-bold text-white/60 uppercase tracking-widest leading-none mb-1">
                            Lote {currentLot.number || currentLotIndex + 1}
                        </p>
                        <p className="text-xl font-black text-white leading-none uppercase tracking-tight truncate max-w-[300px]">
                            {currentLot.title}
                        </p>
                    </div>

                    <div className="hidden md:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                        <ChevronRight className="h-4 w-4 text-white/60" />
                        <span className="text-sm font-bold text-white/80" data-ai-id="monitor-lot-progress">
                            {lotProgress} lotes
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <MonitorConnectionStatus connectionType={connectionType} isConnected={isConnected} />

                    {userProfileWithPermissions ? (
                        <div data-ai-id="monitor-user-info" className="hidden md:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                            <Users className="h-4 w-4 text-white/70" />
                            <span className="text-sm font-bold text-white">
                                {userProfileWithPermissions.fullName || 'Usuário'}
                            </span>
                        </div>
                    ) : (
                        <Button
                            data-ai-id="monitor-login-button"
                            asChild
                            variant="secondary"
                            className="bg-primary-foreground text-primary hover:bg-muted font-bold px-5 py-2 rounded-full text-sm"
                        >
                            <Link href="/auth/login">
                                Fazer Login <LogIn className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                </div>
            </header>

            {/* Grid Principal */}
            <div data-ai-id="monitor-main-grid" className="flex-1 grid grid-cols-12 gap-4 p-4 lg:gap-6 lg:p-6 overflow-hidden">

                {/* Esquerda: Branding + Bid + Video + Histórico + Ações */}
                <div className="col-span-12 lg:col-span-9 flex flex-col gap-4 lg:gap-6 overflow-hidden">

                    {/* Top Row: Bid Display + Video + Soft-Close */}
                    <div className="grid grid-cols-12 gap-4 lg:gap-6 min-h-[200px] lg:h-[40%]">
                        {/* Logo / Branding */}
                        <div className="hidden lg:block col-span-3">
                            <Card className="h-full bg-card border-none shadow-sm flex items-center justify-center p-8">
                                <Image
                                    src="/logo.svg"
                                    alt="Logo do leilão"
                                    width={200}
                                    height={80}
                                    className="opacity-20 grayscale"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = `https://placehold.co/200x80.png?text=${encodeURIComponent(auction.title?.slice(0, 12) || 'Leilao')}`;
                                    }}
                                />
                            </Card>
                        </div>

                        {/* Bid Display + Countdown */}
                        <div className="col-span-12 sm:col-span-6 lg:col-span-4 flex flex-col gap-2">
                            <MonitorBidDisplay
                                status={currentLot.status as LotStatus}
                                user={realtimeBids[0]?.bidderDisplay || bidHistory[0]?.bidderDisplay || '---'}
                                amount={realtimeBids[0]?.amount || bidHistory[0]?.amount || currentLot.price || 0}
                                endDate={currentLot.endDate}
                                bidCount={lotState?.bidsCount ?? bidHistory.length}
                            />
                            <MonitorSoftCloseAlert
                                softCloseEvent={softCloseAlert}
                                endDate={currentLot.endDate}
                                onDismiss={clearSoftCloseAlert}
                            />
                        </div>

                        {/* Video */}
                        <div className="col-span-12 sm:col-span-6 lg:col-span-5">
                            <MonitorVideoBox isActive={false} />
                        </div>
                    </div>

                    {/* Bottom Row: Lot Info + Bid Log + Actions */}
                    <div className="grid grid-cols-12 gap-4 lg:gap-6 flex-1 overflow-hidden">

                        {/* Info do Lote + Auto-bid */}
                        <div className="col-span-12 sm:col-span-4 lg:col-span-3 flex flex-col gap-4">
                            <Card data-ai-id="monitor-lot-info" className="flex-1 bg-card border-none shadow-sm overflow-hidden flex flex-col">
                                <div className="p-4 border-b bg-muted/30">
                                    <h3 className="text-lg font-bold text-foreground">Descrição do lote</h3>
                                </div>
                                <ScrollArea className="flex-1">
                                    <div className="p-4">
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            {currentLot.description || 'Nenhuma descrição disponível.'}
                                        </p>
                                    </div>
                                </ScrollArea>
                                <div className="p-3 mt-auto border-t text-center">
                                    <Button variant="link" className="text-primary font-bold text-sm p-0 h-auto" asChild>
                                        <Link href={`/auctions/${auction.publicId || auction.id}/lots/${currentLot.publicId || currentLot.id}`} target="_blank">
                                            Ver detalhes completos
                                        </Link>
                                    </Button>
                                </div>
                            </Card>

                            {/* V2: Auto-bid Panel */}
                            <MonitorAutoBidPanel
                                lotId={currentLot.publicId || currentLot.id}
                                auctionId={auction.publicId || auction.id}
                                currentPrice={currentLot.price || 0}
                                minimumIncrement={50} // TODO: read from platform settings
                                isEnabled={proxyBiddingEnabled}
                            />
                        </div>

                        {/* Bid Log (V2: real-time + historical tabs) */}
                        <div className="col-span-12 sm:col-span-8 lg:col-span-9 flex flex-col gap-4 overflow-hidden">
                            <Card data-ai-id="monitor-bid-history-card" className="flex-1 bg-card border-none shadow-sm overflow-hidden flex flex-col">
                                <Tabs defaultValue="realtime" className="flex flex-col h-full">
                                    <TabsList className="w-full justify-start rounded-none h-12 bg-muted/30 p-0 border-b">
                                        <TabsTrigger value="realtime" className="h-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none border-r font-bold text-sm">
                                            Lances ao Vivo
                                            {realtimeBids.length > 0 && (
                                                <Badge className="ml-2 bg-emerald-500 text-white text-xs px-1.5">{realtimeBids.length}</Badge>
                                            )}
                                        </TabsTrigger>
                                        <TabsTrigger value="history" className="h-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none border-r font-bold text-sm">
                                            Histórico Completo
                                            {bidHistory.length > 0 && (
                                                <Badge variant="secondary" className="ml-2 text-xs px-1.5">{bidHistory.length}</Badge>
                                            )}
                                        </TabsTrigger>
                                        <TabsTrigger value="proposals" className="h-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none font-bold text-sm">
                                            Propostas
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="realtime" data-ai-id="monitor-realtime-bids" className="flex-1 m-0 p-0 overflow-hidden">
                                        <MonitorBidLog
                                            bids={realtimeBids}
                                            currentUserId={userProfileWithPermissions?.id}
                                        />
                                    </TabsContent>

                                    <TabsContent value="history" data-ai-id="monitor-bid-history" className="flex-1 m-0 p-0 overflow-hidden">
                                        <ScrollArea className="h-full">
                                            <div className="p-4 space-y-3">
                                                {bidHistory.length > 0 ? (
                                                    bidHistory.map((bid, index) => (
                                                        <div
                                                            key={bid.id}
                                                            data-ai-id={`monitor-bid-item-${index}`}
                                                            className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                                                                index === 0 ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : 'bg-card border-border/50'
                                                            }`}
                                                        >
                                                            <div className={`text-white px-4 py-2.5 rounded flex flex-col items-start min-w-[160px] ${
                                                                index === 0 ? 'bg-emerald-600' : 'bg-primary'
                                                            }`}>
                                                                <span className="text-[10px] uppercase font-bold text-white/60 leading-none mb-1">
                                                                    {index === 0 ? 'Maior Lance' : `Lance #${bidHistory.length - index}`}
                                                                </span>
                                                                <span className="text-xl font-black leading-none">
                                                                    {formatCurrency(bid.amount)}
                                                                </span>
                                                            </div>
                                                            <div className="flex-1 grid grid-cols-3 gap-4 text-muted-foreground">
                                                                <div>
                                                                    <p className="text-xs uppercase font-bold text-muted-foreground/60">Tipo</p>
                                                                    <p className="font-bold text-foreground text-sm">À vista</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs uppercase font-bold text-muted-foreground/60">Data/Hora</p>
                                                                    <p className="font-bold text-foreground text-sm">
                                                                        {format(new Date(bid.timestamp), 'dd/MM/yyyy - HH:mm:ss', { locale: ptBR })}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs uppercase font-bold text-muted-foreground/60">Usuário</p>
                                                                    <p className="font-bold text-foreground text-sm" data-ai-id={`monitor-bid-bidder-${index}`}>
                                                                        {bid.bidderDisplay || '---'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div data-ai-id="monitor-no-bids" className="flex items-center justify-center h-full text-muted-foreground italic py-8">
                                                        Nenhum lance registrado ainda. Seja o primeiro!
                                                    </div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </TabsContent>

                                    <TabsContent value="proposals" className="flex-1 m-0 p-0">
                                        <div className="flex items-center justify-center h-full text-muted-foreground italic">
                                            Nenhuma proposta enviada.
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </Card>

                            {/* Botões de Ação */}
                            <div data-ai-id="monitor-action-buttons-wrapper" className="h-24 lg:h-28 shrink-0">
                                <MonitorActionButtons
                                    onBid={handleBid}
                                    onHabilitate={handleHabilitate}
                                    isHabilitado={isHabilitado}
                                    bidLabel={isSubmitting ? 'Enviando...' : `Dar Lance  ${formatCurrency(nextMinimumBid)}`}
                                    disabled={isSubmitting || currentLot.status !== 'ABERTO_PARA_LANCES'}
                                    isHabilitando={isHabilitando}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Direita: Lista de Lotes com navegação */}
                <div data-ai-id="monitor-lot-list-wrapper" className="col-span-12 lg:col-span-3 h-full overflow-hidden">
                    <MonitorLotList
                        lots={allLots}
                        currentLotId={currentLot.id}
                        onLotSelect={handleLotSelect}
                    />
                </div>

            </div>

            {/* Mobile Sticky Bid Bar */}
            <div
                data-ai-id="monitor-mobile-sticky-bar"
                className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t shadow-lg p-3 flex items-center gap-3"
            >
                <div className="flex-1 text-center">
                    <p className="text-xs text-muted-foreground">Próximo lance</p>
                    <p className="text-lg font-black text-foreground">{formatCurrency(nextMinimumBid)}</p>
                </div>
                <Button
                    data-ai-id="monitor-mobile-bid-btn"
                    onClick={handleBid}
                    disabled={isSubmitting || currentLot.status !== 'ABERTO_PARA_LANCES' || !isHabilitado}
                    className="px-8 py-6 text-base font-black"
                >
                    {isSubmitting ? 'Enviando...' : 'DAR LANCE'}
                </Button>
            </div>
        </div>
    );
}
