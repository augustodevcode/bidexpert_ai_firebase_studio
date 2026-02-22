
/**
 * MonitorActionButtons.tsx
 * Botões de ação do monitor: dar lance e se habilitar.
 * Exibe estado de carregamento, habilitação e desabilitáveis conforme contexto.
 */
'use client';

import { Button } from '@/components/ui/button';
import { Power, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';

interface MonitorActionButtonsProps {
    onBid: () => void;
    onHabilitate: () => void;
    isHabilitado: boolean;
    bidLabel: string;
    disabled?: boolean;
    isHabilitando?: boolean;
}

export default function MonitorActionButtons({
    onBid,
    onHabilitate,
    isHabilitado,
    bidLabel,
    disabled = false,
    isHabilitando = false,
}: MonitorActionButtonsProps) {
    return (
        <div data-ai-id="monitor-action-buttons" className="flex gap-4 h-full">
            <Button
                data-ai-id="monitor-bid-button"
                onClick={onBid}
                disabled={disabled}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-3 py-8 rounded-lg shadow-lg group transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {disabled && bidLabel.includes('Enviando') && (
                    <Loader2 className="h-6 w-6 animate-spin" />
                )}
                <span className="text-2xl font-black uppercase tracking-tight">{bidLabel}</span>
                {!disabled && <ArrowRight className="h-8 w-8 group-hover:translate-x-1 transition-transform" />}
            </Button>

            {!isHabilitado ? (
                <Button
                    data-ai-id="monitor-habilitate-button"
                    onClick={onHabilitate}
                    disabled={isHabilitando}
                    className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground flex items-center justify-center gap-3 py-8 rounded-lg shadow-lg group transition-all disabled:opacity-50"
                >
                    {isHabilitando
                        ? <Loader2 className="h-8 w-8 animate-spin" />
                        : <Power className="h-8 w-8 group-hover:scale-110 transition-transform text-emerald-400" />
                    }
                    <span className="text-2xl font-black uppercase tracking-tight">
                        {isHabilitando ? 'Habilitando...' : 'Habilite-se para enviar'}
                    </span>
                </Button>
            ) : (
                <Button
                    data-ai-id="monitor-habilitado-badge"
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
