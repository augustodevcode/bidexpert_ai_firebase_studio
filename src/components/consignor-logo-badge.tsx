// src/components/consignor-logo-badge.tsx
/**
 * @fileoverview Badge reutilizável para exibir o logo do comitente sobre imagens (cards e list items).
 * Mostra apenas o logotipo; o nome aparece no hover via tooltip.
 */
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ConsignorLogoBadgeProps {
  href?: string;
  logoUrl?: string | null;
  fallbackInitial?: string;
  name?: string | null;
  dataAiHint?: string;
  anchorClassName?: string;
}

export function ConsignorLogoBadge({
  href,
  logoUrl,
  fallbackInitial = 'C',
  name,
  dataAiHint,
  anchorClassName = 'absolute top-2 left-2',
}: ConsignorLogoBadgeProps) {
  if (!logoUrl) return null;

  const content = (
    <Avatar className="h-10 w-10 border-2 bg-background border-border shadow-md">
      <AvatarImage src={logoUrl} alt={name || 'Logo Comitente'} data-ai-hint={dataAiHint || 'logo comitente'} />
      <AvatarFallback>{fallbackInitial}</AvatarFallback>
    </Avatar>
  );

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          {href ? (
            <Link href={href} onClick={(e) => e.stopPropagation()} className={`${anchorClassName} z-10`}>
              {content}
            </Link>
          ) : (
            <div className={`${anchorClassName} z-10`}>{content}</div>
          )}
        </TooltipTrigger>
        <TooltipContent>
          <p>Comitente: {name || 'Não informado'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ConsignorLogoBadge;
