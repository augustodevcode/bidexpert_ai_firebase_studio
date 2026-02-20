
/**
 * monitor-auditorium-client.tsx
 * Componente cliente principal do Monitor de Pregão.
 * Funcionalidades: lances em tempo real (polling 3s), navegação de lotes,
 * auto-avanço de lote, anúncio de vencedor, status de conexão, habilitação.
 */
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Auction, Lot, BidInfo, LotStatus } from '@/types';
import MonitorBidDisplay from '@/components/auction/monitor/MonitorBidDisplay';
import MonitorVideoBox from '@/components/auction/monitor/MonitorVideoBox';
import MonitorLotList from '@/components/auction/monitor/MonitorLotList';
import MonitorActionButtons from '@/components/auction/monitor/MonitorActionButtons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';
import { LogIn, Wifi, WifiOff, Trophy, ChevronRight, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { placeBidOnLot, getBidsForLot } from '@/app/auctions/[auctionId]/lots/[lotId]/actions';
import { habilitateForAuctionAction } from '@/app/admin/habilitations/actions';
import { calculateMinimumBid } from '@/lib/ui-helpers';

interface MonitorAuditoriumClientProps {
    auction: Auction;
    initialCurrentLot: Lot;
    initialUpcomingLots: Lot[];
    initialIsHabilitado: boolean;
}

export default function MonitorAuditoriumClient({
    auction,
    initialCurrentLot,
    initialUpcomingLots,
    initialIsHabilitado,
}: MonitorAuditoriumClientProps) {
    const { userProfileWithPermissions } = useAuth();
    const { toast } = useToast();
    const [allLots, setAllLots] = useState<Lot[]>(
        [initialCurrentLot, ...initialUpcomingLots].sort((a, b) => (a.number || '').localeCompare(b.number || ''))
    );
    const [currentLot, setCurrentLot] = useState<Lot>(initialCurrentLot);
    const [isHabilitado, setIsHabilitado] = useState(initialIsHabilitado);
    const [bidHistory, setBidHistory] = useState<BidInfo[]>([]);
    const [isPlacingBid, setIsPlacingBid] = useState(false);
    const [isHabilitando, setIsHabilitando] = useState(false);
    const [isConnected, setIsConnected] = useState(true);
    const [showWinnerBanner, setShowWinnerBanner] = useState(false);
    const [winnerName, setWinnerName] = useState<string>('');
    const prevLotStatusRef = useRef<string>(initialCurrentLot.status);

    const fetchBidHistory = useCallback(async () => {
        if (!currentLot?.id) return;
        try {
            const history = await getBidsForLot(currentLot.publicId || currentLot.id);
            setBidHistory(history);
            setIsConnected(true);

            // Auto-avanço: detecta quando o lote fecha
            if (prevLotStatusRef.current === 'ABERTO_PARA_LANCES' && currentLot.status !== 'ABERTO_PARA_LANCES') {
                if (history.length > 0) {
                    const winner = history[0]?.bidderDisplay || 'Arrematante';
                    setWinnerName(winner);
                    setShowWinnerBanner(true);
                    toast({
                        title: '🏆 Lote Arrematado!',
                        description: `Vencedor: ${winner} — R$ ${history[0].amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    });
                    setTimeout(() => setShowWinnerBanner(false), 8000);
                }
                const nextOpenLot = allLots.find(l => l.id !== currentLot.id && (l.status as string) === 'ABERTO_PARA_LANCES');
                if (nextOpenLot) {
                    setTimeout(() => {
                        setCurrentLot(nextOpenLot);
                        setBidHistory([]);
                        prevLotStatusRef.current = nextOpenLot.status;
                        toast({ title: '⏭ Próximo lote', description: `Avançando para: ${nextOpenLot.title}` });
                    }, 5000);
                }
            }
            prevLotStatusRef.current = currentLot.status;
        } catch (error) {
            console.error('Erro ao buscar histórico de lances:', error);
            setIsConnected(false);
        }
    }, [currentLot?.id, currentLot?.publicId, currentLot?.status, allLots, toast]);

    useEffect(() => {
        prevLotStatusRef.current = currentLot.status;
        fetchBidHistory();
        const interval = setInterval(fetchBidHistory, 3000);
        return () => clearInterval(interval);
    }, [fetchBidHistory]);

    const nextMinimumBid = calculateMinimumBid(currentLot, null, bidHistory.length, currentLot?.price ?? null);

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
        setIsPlacingBid(true);
        const result = await placeBidOnLot(
            currentLot.publicId || currentLot.id,
            auction.publicId || auction.id,
            userProfileWithPermissions.id,
            userProfileWithPermissions.fullName || 'Usuário Anônimo',
            nextMinimumBid
        );
        setIsPlacingBid(false);
        if (result.success && result.updatedLot) {
            toast({ title: 'Sucesso!', description: 'Seu lance foi registrado.' });
            setCurrentLot(prev => ({ ...prev, ...result.updatedLot! }));
            fetchBidHistory();
        } else {
            toast({ title: 'Erro ao dar lance', description: result.message, variant: 'destructive' });
        }
    }, [userProfileWithPermissions, isHabilitado, currentLot, auction, nextMinimumBid, toast, fetchBidHistory]);

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
        <div data-ai-id="monitor-pregao-root" className="flex flex-col h-screen bg-[#F0F2F5] overflow-hidden">

            {/* Banner de Vencedor */}
            {showWinnerBanner && (
                <div
                    data-ai-id="monitor-winner-banner"
                    className="fixed top-0 left-0 right-0 z-50 bg-yellow-400 text-yellow-900 px-6 py-3 flex items-center justify-center gap-3 shadow-2xl"
                >
                    <Trophy className="h-6 w-6 text-yellow-700" />
                    <span className="text-xl font-black uppercase tracking-tight">
                        🏆 ARREMATADO! Vencedor: {winnerName}
                    </span>
                    <Trophy className="h-6 w-6 text-yellow-700" />
                </div>
            )}

            {/* Header */}
            <header data-ai-id="monitor-header" className="bg-[#00474F] text-white p-4 shadow-xl flex justify-between items-center z-20">
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
                    <div
                        data-ai-id="monitor-connection-status"
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${isConnected ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}
                    >
                        {isConnected
                            ? <Wifi className="h-4 w-4 text-emerald-400" />
                            : <WifiOff className="h-4 w-4 text-red-400 animate-pulse" />
                        }
                        <span className={`text-xs font-bold ${isConnected ? 'text-emerald-300' : 'text-red-300'}`}>
                            {isConnected ? 'Ao vivo' : 'Reconectando...'}
                        </span>
                    </div>

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
                            className="bg-white text-[#00474F] hover:bg-gray-100 font-bold px-5 py-2 rounded-full text-sm"
                        >
                            <Link href="/auth/login">
                                Fazer Login <LogIn className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                </div>
            </header>

            {/* Grid Principal */}
            <div data-ai-id="monitor-main-grid" className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">

                {/* Esquerda: Branding + Bid + Video + Histórico + Ações */}
                <div className="col-span-12 lg:col-span-9 grid grid-cols-12 gap-6 overflow-hidden">

                    {/* Top Row */}
                    <div className="col-span-12 grid grid-cols-12 gap-6 h-[45%]">
                        <div className="col-span-3">
                            <Card className="h-full bg-white border-none shadow-sm flex items-center justify-center p-8">
                                <Image
                                    src="/logo-placeholder.png"
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

                        <div className="col-span-4">
                            <MonitorBidDisplay
                                status={currentLot.status as LotStatus}
                                user={bidHistory[0]?.bidderDisplay || '---'}
                                amount={currentLot.price || 0}
                                endDate={currentLot.endDate}
                                bidCount={bidHistory.length}
                            />
                        </div>

                        <div className="col-span-5">
                            <MonitorVideoBox isActive={false} />
                        </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="col-span-12 grid grid-cols-12 gap-6 h-[55%] overflow-hidden">

                        {/* Info do Lote */}
                        <div className="col-span-3 flex flex-col gap-4">
                            <Card data-ai-id="monitor-lot-info" className="flex-1 bg-white border-none shadow-sm overflow-hidden flex flex-col">
                                <div className="p-4 border-b bg-gray-50/50">
                                    <h3 className="text-xl font-bold text-gray-800">Descrição do lote</h3>
                                </div>
                                <div className="p-4 space-y-4 flex-1 overflow-auto">
                                    <p className="text-gray-500 text-base leading-relaxed">
                                        {currentLot.description || 'Nenhuma descrição disponível.'}
                                    </p>
                                </div>
                                <div className="p-4 mt-auto border-t text-center">
                                    <Button variant="link" className="text-[#00474F] font-black text-lg p-0 h-auto" asChild>
                                        <Link href={`/auctions/${auction.publicId || auction.id}/lots/${currentLot.publicId || currentLot.id}`} target="_blank">
                                            👁️ Ver detalhes
                                        </Link>
                                    </Button>
                                </div>
                            </Card>
                        </div>

                        {/* Histórico de Lances */}
                        <div className="col-span-9 flex flex-col gap-6 overflow-hidden">
                            <Card data-ai-id="monitor-bid-history-card" className="flex-1 bg-white border-none shadow-sm overflow-hidden flex flex-col">
                                <Tabs defaultValue="bids" className="flex flex-col h-full">
                                    <TabsList className="w-full justify-start rounded-none h-14 bg-gray-50 p-0 border-b">
                                        <TabsTrigger value="bids" className="h-full px-8 data-[state=active]:bg-[#00474F] data-[state=active]:text-white rounded-none border-r font-bold text-lg">
                                            Histórico de Lances
                                            {bidHistory.length > 0 && (
                                                <Badge className="ml-2 bg-emerald-500 text-white text-xs px-2">{bidHistory.length}</Badge>
                                            )}
                                        </TabsTrigger>
                                        <TabsTrigger value="proposals" className="h-full px-8 data-[state=active]:bg-[#00474F] data-[state=active]:text-white rounded-none font-bold text-lg">
                                            Histórico de Propostas
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="bids" data-ai-id="monitor-bid-history-list" className="flex-1 m-0 p-0 overflow-hidden">
                                        <ScrollArea className="h-full">
                                            <div className="p-4 space-y-3">
                                                {bidHistory.length > 0 ? (
                                                    bidHistory.map((bid, index) => (
                                                        <div
                                                            key={bid.id}
                                                            data-ai-id={`monitor-bid-item-${index}`}
                                                            className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                                                                index === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100'
                                                            }`}
                                                        >
                                                            <div className={`text-white px-4 py-3 rounded flex flex-col items-start min-w-[180px] ${
                                                                index === 0 ? 'bg-emerald-600' : 'bg-[#1A5F68]'
                                                            }`}>
                                                                <span className="text-[10px] uppercase font-bold text-white/60 leading-none mb-1">
                                                                    {index === 0 ? '🏆 Maior Lance' : `Lance #${bidHistory.length - index}`}
                                                                </span>
                                                                <span className="text-2xl font-black leading-none">
                                                                    R$ {bid.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                            <div className="flex-1 grid grid-cols-3 gap-4 text-gray-500">
                                                                <div>
                                                                    <p className="text-xs uppercase font-bold text-gray-400">Tipo</p>
                                                                    <p className="font-bold text-gray-700">À vista</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs uppercase font-bold text-gray-400">Data/Hora</p>
                                                                    <p className="font-bold text-gray-700">
                                                                        {format(new Date(bid.timestamp), 'dd/MM/yyyy - HH:mm:ss', { locale: ptBR })}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs uppercase font-bold text-gray-400">Usuário</p>
                                                                    <p className="font-bold text-gray-700" data-ai-id={`monitor-bid-bidder-${index}`}>
                                                                        {bid.bidderDisplay || '---'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div data-ai-id="monitor-no-bids" className="flex items-center justify-center h-full text-gray-400 italic py-8">
                                                        Nenhum lance registrado ainda. Seja o primeiro!
                                                    </div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </TabsContent>

                                    <TabsContent value="proposals" className="flex-1 m-0 p-0">
                                        <div className="flex items-center justify-center h-full text-gray-400 italic">
                                            Nenhuma proposta enviada.
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </Card>

                            {/* Botões de Ação */}
                            <div data-ai-id="monitor-action-buttons-wrapper" className="h-28">
                                <MonitorActionButtons
                                    onBid={handleBid}
                                    onHabilitate={handleHabilitate}
                                    isHabilitado={isHabilitado}
                                    bidLabel={isPlacingBid ? 'Enviando...' : `Dar Lance  R$ ${nextMinimumBid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                    disabled={isPlacingBid || currentLot.status !== 'ABERTO_PARA_LANCES'}
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
        </div>
    );
}
