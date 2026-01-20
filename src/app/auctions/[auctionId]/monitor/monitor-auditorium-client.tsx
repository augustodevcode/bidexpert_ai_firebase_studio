
'use client';

import { useState, useCallback, useMemo } from 'react';
import type { Auction, Lot, BidInfo } from '@/types';
import MonitorBidDisplay from '@/components/auction/monitor/MonitorBidDisplay';
import MonitorVideoBox from '@/components/auction/monitor/MonitorVideoBox';
import MonitorLotList from '@/components/auction/monitor/MonitorLotList';
import MonitorActionButtons from '@/components/auction/monitor/MonitorActionButtons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';
import { LogIn } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
    const [currentLot, setCurrentLot] = useState<Lot>(initialCurrentLot);
    const [upcomingLots, setUpcomingLots] = useState<Lot[]>(initialUpcomingLots);
    const [isHabilitado, setIsHabilitado] = useState(initialIsHabilitado);
    const [bidHistory, setBidHistory] = useState<BidInfo[]>([]);

    const handleBid = useCallback(() => {
        console.log("Clique para dar lance");
        // Implementação de lance viria aqui vinculada ao server action
    }, []);

    const handleHabilitate = useCallback(() => {
        console.log("Clique para se habilitar");
    }, []);

    return (
        <div className="flex flex-col h-screen bg-[#F0F2F5] overflow-hidden">
            {/* Header Estilizado */}
            <header className="bg-[#00474F] text-white p-4 shadow-xl flex justify-between items-center z-20">
                <div className="flex items-center gap-6">
                    <div className="bg-white/10 p-2 rounded-md">
                        <p className="text-xs font-bold text-white/60 uppercase tracking-widest leading-none mb-1">Empresa</p>
                        <p className="text-xl font-black text-white leading-none">DEGRAU</p>
                    </div>

                    <div className="h-10 w-px bg-white/20"></div>

                    <div>
                        <p className="text-xs font-bold text-white/60 uppercase tracking-widest leading-none mb-1">
                            {currentLot.number || '003'}
                        </p>
                        <p className="text-xl font-black text-white leading-none uppercase tracking-tight">
                            {currentLot.title}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="text-right">
                        <span className="text-5xl font-black text-white leading-none">1</span>
                    </div>

                    <Button asChild variant="secondary" className="bg-white text-[#00474F] hover:bg-gray-100 font-bold px-6 py-6 rounded-full text-base">
                        <Link href="/auth/login">
                            Fazer Login <LogIn className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </header>

            {/* Grid Principal */}
            <div className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">

                {/* Lado Esquerdo: Branding + Bid + Video */}
                <div className="col-span-12 lg:col-span-9 grid grid-cols-12 gap-6 overflow-hidden">

                    {/* Top Row: Logo, Bid Display, Video */}
                    <div className="col-span-12 grid grid-cols-12 gap-6 h-[45%]">
                        <div className="col-span-3">
                            <Card className="h-full bg-white border-none shadow-sm flex items-center justify-center p-8">
                                <Image
                                    src="/logo-placeholder.png"
                                    alt="Logo"
                                    width={200}
                                    height={80}
                                    className="opacity-20 grayscale"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'https://placehold.co/200x80.png?text=DEGRAU';
                                    }}
                                />
                            </Card>
                        </div>

                        <div className="col-span-4">
                            <MonitorBidDisplay
                                status={currentLot.status}
                                user="otaviofavero"
                                amount={currentLot.price || 5555.55}
                            />
                        </div>

                        <div className="col-span-5">
                            <MonitorVideoBox isActive={false} />
                        </div>
                    </div>

                    {/* Bottom Row: Info, History, Actions */}
                    <div className="col-span-12 grid grid-cols-12 gap-6 h-[55%] overflow-hidden">

                        {/* Info Box */}
                        <div className="col-span-3 flex flex-col gap-4">
                            <Card className="flex-1 bg-white border-none shadow-sm overflow-hidden flex flex-col">
                                <div className="p-4 border-b bg-gray-50/50">
                                    <h3 className="text-xl font-bold text-gray-800">Descrição do lote</h3>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div>
                                        <p className="flex items-center gap-2 text-gray-600 font-bold mb-2">
                                            <span className="bg-blue-100 text-blue-700 p-1 rounded">📁</span> Informações
                                        </p>
                                        <p className="text-gray-500 text-base leading-relaxed">
                                            {currentLot.description || 'Nenhuma descrição disponível.'}
                                        </p>
                                    </div>
                                </div>
                                <div className="p-4 mt-auto border-t text-center">
                                    <Button variant="link" className="text-[#00474F] font-black text-lg p-0 h-auto">
                                        👁️ Ver mais
                                    </Button>
                                </div>
                            </Card>
                        </div>

                        {/* History Tabs */}
                        <div className="col-span-9 flex flex-col gap-6 overflow-hidden">
                            <Card className="flex-1 bg-white border-none shadow-sm overflow-hidden flex flex-col">
                                <Tabs defaultValue="bids" className="flex flex-col h-full">
                                    <TabsList className="w-full justify-start rounded-none h-14 bg-gray-50 p-0 border-b">
                                        <TabsTrigger value="bids" className="h-full px-8 data-[state=active]:bg-[#00474F] data-[state=active]:text-white rounded-none border-r font-bold text-lg">
                                            Histórico de Lances
                                        </TabsTrigger>
                                        <TabsTrigger value="proposals" className="h-full px-8 data-[state=active]:bg-[#00474F] data-[state=active]:text-white rounded-none font-bold text-lg">
                                            Histórico de Propostas
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="bids" className="flex-1 m-0 p-0 overflow-hidden">
                                        <ScrollArea className="h-full">
                                            <div className="p-4 space-y-3">
                                                {/* Simulação de um lance no histórico conforme a imagem */}
                                                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border">
                                                    <div className="bg-[#1A5F68] text-white px-4 py-3 rounded flex flex-col items-start min-w-[180px]">
                                                        <span className="text-[10px] uppercase font-bold text-white/60 leading-none mb-1">Lance</span>
                                                        <span className="text-2xl font-black leading-none">R$ 5.555,55</span>
                                                    </div>
                                                    <div className="flex-1 grid grid-cols-3 gap-4 text-gray-500">
                                                        <div>
                                                            <p className="text-xs uppercase font-bold text-gray-400">Tipo</p>
                                                            <p className="font-bold text-gray-700">À vista</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs uppercase font-bold text-gray-400">Data/Hora</p>
                                                            <p className="font-bold text-gray-700">12/01/2026 - 11:54:03</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs uppercase font-bold text-gray-400">Usuário</p>
                                                            <p className="font-bold text-gray-700">otaviofavero</p>
                                                        </div>
                                                    </div>
                                                </div>
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

                            {/* Botões de Ação Gigantes */}
                            <div className="h-28">
                                <MonitorActionButtons
                                    onBid={handleBid}
                                    onHabilitate={handleHabilitate}
                                    isHabilitado={isHabilitado}
                                    bidLabel="Clique para dar um lance"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lado Direito: Lista de Lotes Proeminente */}
                <div className="col-span-12 lg:col-span-3 h-full overflow-hidden">
                    <MonitorLotList
                        lots={[...upcomingLots, currentLot].sort((a, b) => (a.number || '').localeCompare(b.number || ''))}
                        currentLotId={currentLot.id}
                    />
                </div>

            </div>
        </div>
    );
}
