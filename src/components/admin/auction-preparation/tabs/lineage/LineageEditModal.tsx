/**
 * @fileoverview Edit modal for lineage nodes, allowing users to view/edit
 * basic metadata of the selected entity. Uses CrudFormContainer for
 * consistent modal/sheet rendering.
 */
'use client';

import React from 'react';
import CrudFormContainer from '@/components/admin/CrudFormContainer';
import type { LineageNodeData } from '@/types/auction-lineage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface LineageEditModalProps {
  node: LineageNodeData | null;
  isOpen: boolean;
  onClose: () => void;
}

/** Maps node type to admin route for navigation */
function getAdminRoute(node: LineageNodeData): string | null {
  switch (node.nodeType) {
    case 'auction':
      return `/admin/auctions/${node.entityId}`;
    case 'lot':
      return `/admin/lots/${node.entityId}`;
    case 'seller':
      return `/admin/sellers/${node.entityId}`;
    case 'asset':
      return `/admin/assets/${node.entityId}`;
    case 'judicial-process':
      return `/admin/judicial-processes/${node.entityId}`;
    default:
      return null;
  }
}

export function LineageEditModal({ node, isOpen, onClose }: LineageEditModalProps) {
  if (!node) return null;

  const adminRoute = getAdminRoute(node);

  return (
    <CrudFormContainer
      isOpen={isOpen}
      onClose={onClose}
      mode="modal"
      title={node.label}
      description={`Detalhes do nó: ${node.nodeType.replace(/-/g, ' ')}`}
    >
      <div className="space-y-4 py-2" data-ai-id="lineage-edit-modal-content">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tipo</label>
            <p className="text-sm">
              <Badge variant="secondary" className="capitalize">
                {node.nodeType.replace(/-/g, ' ')}
              </Badge>
            </p>
          </div>

          {node.status && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <p className="text-sm">
                <Badge variant="outline">{node.status.replace(/_/g, ' ')}</Badge>
              </p>
            </div>
          )}

          {node.subtitle && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Subtítulo</label>
              <p className="text-sm">{node.subtitle}</p>
            </div>
          )}

          {node.entityId && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">ID</label>
              <p className="text-sm font-mono">{node.entityId}</p>
            </div>
          )}

          {node.count != null && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Quantidade</label>
              <p className="text-sm font-mono">{node.count}</p>
            </div>
          )}
        </div>

        {node.metadata && Object.keys(node.metadata).length > 0 && (
          <div className="border-t pt-3 space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Metadados</h4>
            {Object.entries(node.metadata).map(([key, value]) =>
              value != null ? (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-muted-foreground capitalize">{key}</span>
                  <span className="font-medium">{String(value)}</span>
                </div>
              ) : null
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t pt-4">
          {adminRoute && (
            <Button variant="outline" size="sm" asChild>
              <Link href={adminRoute}>
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                Abrir no Admin
              </Link>
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </CrudFormContainer>
  );
}
