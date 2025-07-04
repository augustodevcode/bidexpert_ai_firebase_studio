// src/components/admin/wizard/FlowStepNode.tsx
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Check, CircleDot, Circle, Plus, type LucideIcon, Pencil } from 'lucide-react';
import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useWizard } from './wizard-context'; // Import useWizard hook

export interface FlowNodeData {
  label?: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  icon?: LucideIcon;
  pathType: 'JUDICIAL' | 'EXTRAJUDICIAL' | 'PARTICULAR' | 'TOMADA_DE_PRECOS' | 'COMMON';
  isActivePath: boolean;
  isEntity?: boolean; // Flag to indicate if this node represents a created entity
  entityId?: string | number; // ID of the entity to link to
  entityType?: 'process' | 'auctioneer' | 'seller'; // Type of entity
}

const pathStyles: Record<string, { node: string, label: string }> = {
    JUDICIAL: { node: "border-blue-500/80", label: "bg-blue-500/80 text-white" },
    EXTRAJUDICIAL: { node: "border-emerald-500/80", label: "bg-emerald-500/80 text-white" },
    PARTICULAR: { node: "border-orange-500/80", label: "bg-orange-500/80 text-white" },
    TOMADA_DE_PRECOS: { node: "border-violet-500/80", label: "bg-violet-500/80 text-white" },
    COMMON: { node: "border-slate-400/80", label: "bg-slate-400/80 text-white" }
};

const statusIcons = {
  done: <Check className="h-4 w-4" />,
  in_progress: <CircleDot className="h-4 w-4 animate-pulse" />,
  todo: <Circle className="h-4 w-4" />,
};

const entityLinks: Record<string, string> = {
  process: '/admin/judicial-processes',
  auctioneer: '/admin/auctioneers',
  seller: '/admin/sellers',
};

const FlowStepNode = ({ data }: NodeProps<FlowNodeData>) => {
  const { label, title, status, icon: Icon, pathType, isActivePath, isEntity, entityId, entityType } = data;
  const { wizardData } = useWizard(); // Access wizardData
  
  const styles = pathStyles[pathType] || pathStyles.COMMON;
  const statusIcon = statusIcons[status];
  const highlightClass = isActivePath ? 'opacity-100' : 'opacity-40 hover:opacity-100';
  const [isHovered, setIsHovered] = useState(false);
  
  let finalTitle = title;
  
  if (entityType === 'process' && wizardData.judicialProcess) {
    finalTitle = `Proc: ${wizardData.judicialProcess.processNumber}`;
  } else if (entityType === 'auctioneer' && wizardData.auctionDetails?.auctioneer) {
    finalTitle = wizardData.auctionDetails.auctioneer;
  } else if (entityType === 'seller' && wizardData.auctionDetails?.seller) {
    finalTitle = wizardData.auctionDetails.seller;
  }

  const editLink = (isEntity && entityType && entityId) ? `${entityLinks[entityType]}/${entityId}/edit` : null;

  return (
    <>
      <Handle type="target" position={Position.Left} className="!bg-primary" />
      <div 
        className={cn("w-56 rounded-md bg-card border-2 shadow-sm p-0.5 transition-opacity relative", styles.node, highlightClass)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isHovered && editLink && (
            <Button asChild size="icon" variant="outline" className="absolute -top-3 -right-3 h-7 w-7 bg-background z-10">
                <Link href={editLink} target="_blank" title="Editar entidade">
                    <Pencil className="h-4 w-4 text-primary" />
                </Link>
            </Button>
        )}
        {label && (
          <div className={cn("px-2 py-0.5 text-xs font-semibold rounded-t-sm", styles.label)}>
            {label}
          </div>
        )}
        <div className="p-3 bg-card rounded-b-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-2 min-w-0">
              {Icon && <Icon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />}
              <p className="font-semibold text-sm whitespace-normal break-words" title={finalTitle}>
                {finalTitle}
              </p>
            </div>
            <div className="text-muted-foreground ml-2 flex-shrink-0">{statusIcon}</div>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-primary" />
    </>
  );
};

export default memo(FlowStepNode);