/**
 * @file Conteúdo do tooltip de ajuda administrativa.
 * @description Renderiza explicação semântica da regra da seção usando tooltip acessível.
 */
'use client';

import type { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AdminSectionHelpTooltipContentProps {
  message: string;
  children: ReactNode;
}

export default function AdminSectionHelpTooltipContent({
  message,
  children,
}: AdminSectionHelpTooltipContentProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          className="max-w-xs text-left"
          data-ai-id="admin-section-help-tooltip-content"
        >
          <p>{message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
