
/**
 * MonitorBidDisplay.tsx
 * Exibe o lance atual, status do lote, contador de lances e countdown para encerramento.
 */
'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getLotStatusColor, getAuctionStatusText } from '@/lib/ui-helpers';
import { LotStatus } from '@/types';
import LotCountdown from '@/components/lot-countdown';
import { formatCurrency } from '@/lib/format';

interface MonitorBidDisplayProps {
    status: LotStatus;
    user: string;
    amount: number;
    endDate?: Date | string | null;
    bidCount?: number;
}

export default function MonitorBidDisplay({ status, user, amount, endDate, bidCount }: MonitorBidDisplayProps) {
    return (
        <Card data-ai-id="monitor-bid-display" className="h-full bg-card border-none shadow-sm flex flex-col items-center justify-center p-6 text-center">
            <Badge
                variant="outline"
                data-ai-id="monitor-lot-status-badge"
                className={`mb-4 px-4 py-1 text-sm font-medium border-none uppercase tracking-wider ${getLotStatusColor(status)} bg-opacity-20`}
            >
                {getAuctionStatusText(status)}
            </Badge>

            <div className="space-y-1 mb-4">
                <p className="text-muted-foreground font-bold text-lg uppercase tracking-tight">
                    Usuário: <span className="text-foreground" data-ai-id="monitor-leading-bidder">{user || '---'}</span>
                </p>
                <p className="text-muted-foreground font-medium text-base">Lance Atual:</p>
                <p data-ai-id="monitor-current-amount" className="text-5xl md:text-6xl font-black text-primary tracking-tighter">
                    {formatCurrency(amount)}
                </p>
                <p data-ai-id="monitor-bid-count" className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">
                    {bidCount ?? 0} lance{(bidCount ?? 0) !== 1 ? 's' : ''}
                </p>
            </div>

            {endDate && status === 'ABERTO_PARA_LANCES' && (
                <div data-ai-id="monitor-countdown" className="mt-2">
                    <LotCountdown endDate={endDate} status={status} variant="card" />
                </div>
            )}
        </Card>
    );
}
