
'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getLotStatusColor, getAuctionStatusText } from '@/lib/ui-helpers';
import { LotStatus } from '@/types';

interface MonitorBidDisplayProps {
    status: LotStatus;
    user: string;
    amount: number;
}

export default function MonitorBidDisplay({ status, user, amount }: MonitorBidDisplayProps) {
    return (
        <Card className="h-full bg-white border-none shadow-sm flex flex-col items-center justify-center p-6 text-center">
            <Badge variant="outline" className={`mb-4 px-4 py-1 text-sm font-medium border-none uppercase tracking-wider ${getLotStatusColor(status)} bg-opacity-20`}>
                {getAuctionStatusText(status)}
            </Badge>

            <div className="space-y-1">
                <p className="text-gray-500 font-bold text-lg uppercase tracking-tight">Usuário: <span className="text-gray-900">{user || '---'}</span></p>
                <p className="text-gray-600 font-medium text-base">Lance Atual:</p>
                <p className="text-5xl md:text-6xl font-black text-[#00474F] tracking-tighter">
                    R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
            </div>
        </Card>
    );
}
