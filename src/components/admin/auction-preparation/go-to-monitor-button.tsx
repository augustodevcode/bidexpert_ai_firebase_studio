/**
 * @fileoverview Botão administrativo para acesso direto ao Monitor V2 do pregão.
 * Diferente do GoToLiveAuctionButton (público, com check de habilitação),
 * este botão é exclusivo para administradores e não exige habilitação.
 * Abre o Monitor V2 em nova aba com badge dinâmico por status do leilão.
 */
'use client';

import Link from 'next/link';
import { Tv, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/** Statuses nos quais o botão do monitor é visível */
const MONITOR_VISIBLE_STATUSES = [
  'EM_PREPARACAO',
  'EM_BREVE',
  'ABERTO',
  'ABERTO_PARA_LANCES',
  'EM_PREGAO',
] as const;

type MonitorVisibleStatus = (typeof MONITOR_VISIBLE_STATUSES)[number];

/** Configuração de badge por status */
const STATUS_BADGE_CONFIG: Record<MonitorVisibleStatus, {
  label: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  pulse: boolean;
}> = {
  EM_PREPARACAO: { label: 'Preview', variant: 'secondary', pulse: false },
  EM_BREVE: { label: 'Em Breve', variant: 'outline', pulse: false },
  ABERTO: { label: 'Aberto', variant: 'default', pulse: false },
  ABERTO_PARA_LANCES: { label: 'AO VIVO', variant: 'destructive', pulse: true },
  EM_PREGAO: { label: 'AO VIVO', variant: 'destructive', pulse: true },
};

interface GoToMonitorButtonProps {
  auction: {
    id: string;
    publicId?: string | null;
    status: string;
  };
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  label?: string;
  showBadge?: boolean;
  showExternalIcon?: boolean;
  dataAiId?: string;
}

export default function GoToMonitorButton({
  auction,
  className,
  size = 'sm',
  variant = 'outline',
  label = 'Monitor do Pregão',
  showBadge = true,
  showExternalIcon = true,
  dataAiId = 'go-to-monitor-btn',
}: GoToMonitorButtonProps) {
  const isVisible = MONITOR_VISIBLE_STATUSES.includes(auction.status as MonitorVisibleStatus);

  if (!isVisible) {
    return null;
  }

  const badgeConfig = STATUS_BADGE_CONFIG[auction.status as MonitorVisibleStatus];
  const identifier = auction.publicId || auction.id;
  const monitorUrl = `/auctions/${identifier}/monitor`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            size={size}
            variant={variant}
            className={cn('gap-2', className)}
            data-ai-id={dataAiId}
          >
            <Link
              href={monitorUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-ai-id={`${dataAiId}-link`}
            >
              <Tv className="h-4 w-4" />
              <span>{label}</span>
              {showBadge && badgeConfig && (
                <Badge
                  variant={badgeConfig.variant}
                  className={cn(
                    badgeConfig.pulse && 'animate-pulse [animation-duration:2.5s]'
                  )}
                >
                  {badgeConfig.label}
                </Badge>
              )}
              {showExternalIcon && <ExternalLink className="h-3 w-3 opacity-60" />}
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Abrir Monitor V2 do pregão em nova aba (Admin)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
