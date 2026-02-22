/**
 * @fileoverview Botão reutilizável para acesso ao pregão online.
 * Exibe CTA apenas para usuário autenticado e habilitado, dentro da janela temporal do leilão.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Wifi } from 'lucide-react';
import type { Auction } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/auth-context';
import { checkHabilitationForAuctionAction } from '@/app/admin/habilitations/actions';
import { cn } from '@/lib/utils';
import { isAuctionInPregaoWindow } from '@/lib/ui-helpers';

interface GoToLiveAuctionButtonProps {
  auction: Pick<Auction, 'id' | 'publicId' | 'status' | 'openDate' | 'actualOpenDate' | 'endDate' | 'auctionDate'>;
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive' | 'mapGhost';
  requireHabilitation?: boolean;
  label?: string;
  dataAiId?: string;
}

export default function GoToLiveAuctionButton({
  auction,
  className,
  size = 'sm',
  variant = 'outline',
  requireHabilitation = true,
  label = 'Ir para pregão online',
  dataAiId = 'go-live-auction-btn',
}: GoToLiveAuctionButtonProps) {
  const { userProfileWithPermissions } = useAuth();
  const [isHabilitated, setIsHabilitated] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const isInLiveWindow = useMemo(() => isAuctionInPregaoWindow(auction), [auction]);

  useEffect(() => {
    if (!isInLiveWindow || !userProfileWithPermissions?.id) {
      setIsHabilitated(false);
      return;
    }

    if (!requireHabilitation) {
      setIsHabilitated(true);
      return;
    }

    let mounted = true;
    setIsChecking(true);

    checkHabilitationForAuctionAction(userProfileWithPermissions.id, auction.id)
      .then((result) => {
        if (mounted) {
          setIsHabilitated(result);
        }
      })
      .catch(() => {
        if (mounted) {
          setIsHabilitated(false);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsChecking(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [auction.id, isInLiveWindow, requireHabilitation, userProfileWithPermissions?.id]);

  if (!isInLiveWindow || !userProfileWithPermissions?.id || isChecking || !isHabilitated) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild size={size} variant={variant} className={cn('gap-2', className)} data-ai-id={dataAiId}>
            <Link href={`/auctions/${auction.publicId || auction.id}/live`} data-ai-id={`${dataAiId}-link`}>
              <Wifi className="h-4 w-4" />
              <span>{label}</span>
              <Badge className="animate-pulse [animation-duration:2.5s]">Online</Badge>
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Entrar no pregão ao vivo deste leilão</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
