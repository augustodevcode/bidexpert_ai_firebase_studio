/**
 * @fileoverview Custom ReactFlow node for the Auction Lineage visualization.
 * Renders a styled card with icon, label, subtitle, and status badge.
 * Supports hover to show details popover and drag to reposition.
 */
'use client';

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { LineageNodeData, LineageNodeType } from '@/types/auction-lineage';
import {
  Gavel,
  User,
  Hammer,
  Tag,
  MapPin,
  Map,
  Package,
  Clock,
  Users,
  Box,
  Scale,
  Building2,
  Landmark,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

/** Icon map per node type */
const iconMap: Record<LineageNodeType, React.ElementType> = {
  auction: Gavel,
  seller: User,
  auctioneer: Hammer,
  category: Tag,
  city: MapPin,
  state: Map,
  lot: Package,
  stage: Clock,
  habilitation: Users,
  asset: Box,
  'judicial-process': Scale,
  'judicial-branch': Building2,
  court: Landmark,
};

/** Default color scheme per node type (used when no theme override) */
const defaultColors: Record<LineageNodeType, { bg: string; border: string; text: string }> = {
  auction: { bg: 'bg-primary/10', border: 'border-primary', text: 'text-primary' },
  seller: { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-400', text: 'text-blue-700 dark:text-blue-300' },
  auctioneer: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-400', text: 'text-emerald-700 dark:text-emerald-300' },
  category: { bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-400', text: 'text-purple-700 dark:text-purple-300' },
  city: { bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-400', text: 'text-rose-700 dark:text-rose-300' },
  state: { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-400', text: 'text-amber-700 dark:text-amber-300' },
  lot: { bg: 'bg-indigo-50 dark:bg-indigo-950/30', border: 'border-indigo-400', text: 'text-indigo-700 dark:text-indigo-300' },
  stage: { bg: 'bg-teal-50 dark:bg-teal-950/30', border: 'border-teal-400', text: 'text-teal-700 dark:text-teal-300' },
  habilitation: { bg: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-400', text: 'text-cyan-700 dark:text-cyan-300' },
  asset: { bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-400', text: 'text-orange-700 dark:text-orange-300' },
  'judicial-process': { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-400', text: 'text-red-700 dark:text-red-300' },
  'judicial-branch': { bg: 'bg-pink-50 dark:bg-pink-950/30', border: 'border-pink-400', text: 'text-pink-700 dark:text-pink-300' },
  court: { bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-400', text: 'text-violet-700 dark:text-violet-300' },
};

function LineageNodeComponent({ data, selected }: NodeProps<LineageNodeData>) {
  const Icon = iconMap[data.nodeType] || Box;
  const colors = defaultColors[data.nodeType] || defaultColors.asset;

  return (
    <div
      data-ai-id={`lineage-node-${data.nodeType}`}
      className={cn(
        'rounded-lg border-2 px-4 py-3 shadow-sm transition-all duration-200 min-w-[160px] max-w-[220px]',
        colors.bg,
        colors.border,
        selected && 'ring-2 ring-ring ring-offset-2',
        'hover:shadow-md cursor-grab active:cursor-grabbing'
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground !w-2 !h-2" />

      <div className="flex items-start gap-2">
        <div className={cn('mt-0.5 shrink-0', colors.text)}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-semibold truncate', colors.text)} title={data.label}>
            {data.label}
          </p>
          {data.subtitle && (
            <p className="text-xs text-muted-foreground truncate" title={data.subtitle}>
              {data.subtitle}
            </p>
          )}
          {data.count != null && (
            <Badge variant="secondary" className="mt-1 text-xs">
              {data.count}
            </Badge>
          )}
          {data.status && (
            <Badge variant="outline" className="mt-1 text-xs">
              {data.status.replace(/_/g, ' ')}
            </Badge>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground !w-2 !h-2" />
    </div>
  );
}

export const LineageNode = memo(LineageNodeComponent);
LineageNode.displayName = 'LineageNode';
