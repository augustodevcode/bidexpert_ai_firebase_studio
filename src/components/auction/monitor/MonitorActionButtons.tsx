
'use client';

import { Button } from '@/components/ui/button';
import { Power, ArrowRight, ShieldCheck } from 'lucide-react';

interface MonitorActionButtonsProps {
    onBid: () => void;
    onHabilitate: () => void;
    isHabilitado: boolean;
    bidLabel: string;
}

export default function MonitorActionButtons({ onBid, onHabilitate, isHabilitado, bidLabel }: MonitorActionButtonsProps) {
    return (
        <div className="flex gap-4 h-full">
            <Button
                onClick={onBid}
                className="flex-1 bg-[#00474F] hover:bg-[#00383F] text-white flex items-center justify-center gap-3 py-8 rounded-lg shadow-lg group transition-all"
            >
                <span className="text-2xl font-black uppercase tracking-tight">{bidLabel}</span>
                <ArrowRight className="h-8 w-8 group-hover:translate-x-1 transition-transform" />
            </Button>

            {!isHabilitado ? (
                <Button
                    onClick={onHabilitate}
                    className="flex-1 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white flex items-center justify-center gap-3 py-8 rounded-lg shadow-lg group transition-all"
                >
                    <span className="text-2xl font-black uppercase tracking-tight">Habilite-se para enviar</span>
                    <Power className="h-8 w-8 group-hover:scale-110 transition-transform text-emerald-400" />
                </Button>
            ) : (
                <Button
                    disabled
                    className="flex-1 bg-emerald-100 text-emerald-800 border-2 border-emerald-200 flex items-center justify-center gap-3 py-8 rounded-lg shadow-inner cursor-default"
                >
                    <ShieldCheck className="h-8 w-8 text-emerald-600" />
                    <span className="text-2xl font-black uppercase tracking-tight">Você está habilitado</span>
                </Button>
            )}
        </div>
    );
}
