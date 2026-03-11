/**
 * @fileoverview Hover card / popover for lineage nodes.
 * Shows detailed metadata when hovering over a lineage node.
 */
'use client';

import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { LineageNodeData } from '@/types/auction-lineage';
import { Badge } from '@/components/ui/badge';

interface LineageHoverCardProps {
  node: LineageNodeData | null;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LineageHoverCard({ node, children, open, onOpenChange }: LineageHoverCardProps) {
  if (!node) return <>{children}</>;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-72"
        data-ai-id="lineage-hover-card"
        side="right"
        sideOffset={8}
      >
        <div className="space-y-2">
          <div>
            <h4 className="text-sm font-semibold">{node.label}</h4>
            {node.subtitle && (
              <p className="text-xs text-muted-foreground">{node.subtitle}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs capitalize">
              {node.nodeType.replace(/-/g, ' ')}
            </Badge>
            {node.status && (
              <Badge variant="outline" className="text-xs">
                {node.status.replace(/_/g, ' ')}
              </Badge>
            )}
            {node.count != null && (
              <Badge className="text-xs">{node.count} registros</Badge>
            )}
          </div>

          {node.metadata && Object.keys(node.metadata).length > 0 && (
            <div className="border-t pt-2 space-y-1">
              {Object.entries(node.metadata).map(([key, value]) =>
                value != null ? (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-muted-foreground capitalize">{key}</span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ) : null
              )}
            </div>
          )}

          {node.entityId && (
            <p className="text-xs text-muted-foreground border-t pt-2">
              ID: {node.entityId}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
