
'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Lot } from '@/types';
import { getLotStatusColor, getAuctionStatusText } from '@/lib/ui-helpers';

interface MonitorLotListProps {
    lots: Lot[];
    currentLotId: string;
}

export default function MonitorLotList({ lots, currentLotId }: MonitorLotListProps) {
    return (
        <div className="flex flex-col h-full bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b">
                <h2 className="text-xl font-bold text-gray-800">Lista de lotes</h2>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {lots.map((lot) => {
                        const isCurrent = lot.id === currentLotId;
                        return (
                            <div
                                key={lot.id}
                                className={`p-4 rounded-none border-b transition-colors relative ${isCurrent ? 'bg-[#00474F] text-white' : 'hover:bg-gray-50 text-gray-800'
                                    }`}
                            >
                                {isCurrent && (
                                    <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                                )}

                                <div className="flex flex-col gap-1 pr-8">
                                    <p className={`text-base font-bold truncate ${isCurrent ? 'text-white' : 'text-gray-800'}`}>
                                        {lot.title} | Cód do leilão: {lot.code || lot.publicId || lot.id}
                                    </p>

                                    <div className="flex items-center justify-between mt-1">
                                        <Badge
                                            className={`px-3 py-0.5 text-[10px] font-bold uppercase rounded-full border-none ring-1 ring-inset ${isCurrent
                                                    ? 'bg-white text-[#00474F] ring-white/20'
                                                    : `${getLotStatusColor(lot.status)} ring-current/10`
                                                }`}
                                        >
                                            {getAuctionStatusText(lot.status)}
                                        </Badge>

                                        <span className={`text-sm font-black ${isCurrent ? 'text-white/80' : 'text-gray-400'}`}>
                                            {lot.number || lot.id.slice(-3)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
