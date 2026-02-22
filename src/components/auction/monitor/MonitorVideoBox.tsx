
'use client';

import { Card } from '@/components/ui/card';
import { VideoOff } from 'lucide-react';

interface MonitorVideoBoxProps {
    isActive?: boolean;
}

export default function MonitorVideoBox({ isActive = false }: MonitorVideoBoxProps) {
    return (
        <Card className="h-full bg-gradient-to-br from-primary/80 to-primary border-none shadow-sm flex flex-col items-center justify-center p-8 relative overflow-hidden group">
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-primary-foreground opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity"></div>

            <div className="z-10 flex flex-col items-center text-center">
                <div className="bg-primary-foreground/20 backdrop-blur-md px-4 py-1.5 rounded-full mb-6 flex items-center gap-2 border border-primary-foreground/10">
                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-muted-foreground'}`}></div>
                    <span className="text-primary-foreground text-xs font-bold uppercase tracking-widest leading-none">
                        {isActive ? 'Ao Vivo' : 'Transmissão Inativa'}
                    </span>
                </div>

                {!isActive ? (
                    <div className="space-y-4">
                        <VideoOff className="h-16 w-16 text-primary-foreground/20 mx-auto" />
                        <p className="text-primary-foreground text-xl md:text-2xl font-semibold max-w-xs leading-tight">
                            As lives de leilão de lotes podem ser transmitidas aqui.
                        </p>
                    </div>
                ) : (
                    <p className="text-primary-foreground/60 text-sm italic">Player de Vídeo aqui...</p>
                )}
            </div>
        </Card>
    );
}
