'use client';

import { Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImpersonationBannerProps {
  impersonatedName: string;
  onExit: () => void;
  className?: string;
}

export function ImpersonationBanner({
  impersonatedName,
  onExit,
  className,
}: ImpersonationBannerProps) {
  return (
    <div
      className={cn(
        'bg-amber-100 border-b border-amber-200 text-amber-900 px-4 py-2 flex items-center justify-between text-sm sticky top-0 z-50 shadow-sm',
        className
      )}
      data-ai-id="impersonation-banner"
    >
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 fill-amber-900/20" />
        <span className="font-medium">
          Modo de Impersonação Ativo:
          <span className="font-normal ml-1">
            Você está visualizando o painel como <strong>{impersonatedName}</strong>
          </span>
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onExit}
        className="h-7 px-2 hover:bg-amber-200/50 text-amber-900 hover:text-amber-950"
        data-ai-id="exit-impersonation-button"
      >
        <X className="h-3.5 w-3.5 mr-1.5" />
        Sair da visualização
      </Button>
    </div>
  );
}
