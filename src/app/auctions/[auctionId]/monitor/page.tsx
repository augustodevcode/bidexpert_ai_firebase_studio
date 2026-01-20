
'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Auction, Lot } from '@/types';
import { getAuction } from '@/app/admin/auctions/actions';
import { getLots } from '@/app/admin/lots/actions';
import { getCurrentUser } from '@/app/auth/actions';
import { checkHabilitationForAuctionAction } from '@/app/admin/habilitations/actions';
import MonitorAuditoriumClient from './monitor-auditorium-client';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AuctionMonitorPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const auctionId = typeof params.auctionId === 'string' ? params.auctionId : '';
    const targetLotId = searchParams.get('lotId');

    const [data, setData] = useState<{
        auction: Auction;
        currentLot: Lot;
        upcomingLots: Lot[];
        isHabilitado: boolean;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function init() {
            if (!auctionId) return;
            setLoading(true);
            try {
                const [auction, lots, user] = await Promise.all([
                    getAuction(auctionId),
                    getLots(auctionId),
                    getCurrentUser()
                ]);

                if (!auction) throw new Error("Leilão não encontrado.");
                if (lots.length === 0) throw new Error("Este leilão não possui lotes.");

                const isHabilitado = user ? await checkHabilitationForAuctionAction(user.uid, auction.id) : false;

                let currentLot = lots.find(l => l.id === targetLotId || l.publicId === targetLotId) || lots[0];
                const upcomingLots = lots.filter(l => l.id !== currentLot.id).slice(0, 10);

                setData({ auction, currentLot, upcomingLots, isHabilitado });
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        init();
    }, [auctionId, targetLotId]);

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-[#00474F] text-white">
                <Loader2 className="h-12 w-12 animate-spin mb-4" />
                <p className="text-xl font-bold">Carregando Layout de Monitor...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-6 text-center">
                <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Erro ao carregar monitor</h1>
                <p className="text-gray-600 mb-6">{error || 'Dados insuficientes.'}</p>
                <Button asChild>
                    <Link href={`/auctions/${auctionId}`}>Voltar para o Leilão</Link>
                </Button>
            </div>
        );
    }

    return (
        <MonitorAuditoriumClient
            auction={data.auction}
            initialCurrentLot={data.currentLot}
            initialUpcomingLots={data.upcomingLots}
            initialIsHabilitado={data.isHabilitado}
        />
    );
}
