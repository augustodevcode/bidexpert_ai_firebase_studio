/**
 * @fileoverview Tooltip administrativo para títulos de seções públicas, exibindo
 * regras de negócio reais da consulta/filtro quando o usuário possui permissão de edição.
 */
'use client';

import type { ReactElement, ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/auth-context';
import { hasAnyPermission } from '@/lib/permissions';

const DEFAULT_EDIT_PERMISSIONS = [
  'manage_all',
  'auctions:update',
  'lots:update',
  'sellers:update',
  'auctioneers:update',
  'categories:update',
  'settings:update',
];

interface PublicSectionAdminTooltipProps {
  children: ReactElement;
  description: ReactNode;
  sectionId: string;
  requiredPermissions?: string[];
}

export default function PublicSectionAdminTooltip({
  children,
  description,
  sectionId,
  requiredPermissions = DEFAULT_EDIT_PERMISSIONS,
}: PublicSectionAdminTooltipProps) {
  const { userProfileWithPermissions } = useAuth();
  const canSeeAdminTooltip = hasAnyPermission(userProfileWithPermissions, requiredPermissions);

  if (!canSeeAdminTooltip) {
    return children;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        align="start"
        side="top"
        className="max-w-md"
        data-ai-id={`public-section-admin-tooltip-${sectionId}`}
      >
        <p className="text-sm leading-relaxed">{description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
