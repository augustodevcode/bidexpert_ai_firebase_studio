// src/components/admin/wizard/FlowStepNode.tsx
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Check, Loader, Circle, Workflow, CircleDot, Pencil } from 'lucide-react';
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface NodeData {
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  details: { label: string; value?: string | number }[];
  entityType?: 'judicial-processes';
  entityId?: string;
}

const statusConfig = {
  done: {
    icon: <Check className="h-4 w-4" />,
    badgeVariant: 'secondary',
    badgeText: 'Concluído',
    cardBorder: 'border-green-500/50',
    titleColor: 'text-muted-foreground',
    opacity: 'opacity-70',
  },
  in_progress: {
    icon: <CircleDot className="h-4 w-4 text-primary animate-pulse" />,
    badgeVariant: 'default',
    badgeText: 'Em Andamento',
    cardBorder: 'border-primary ring-2 ring-primary/20',
    titleColor: 'text-primary',
    opacity: 'opacity-100',
  },
  todo: {
    icon: <Circle className="h-4 w-4" />,
    badgeVariant: 'outline',
    badgeText: 'A Fazer',
    cardBorder: 'border-border',
    titleColor: 'text-muted-foreground',
    opacity: 'opacity-50',
  },
};

const FlowStepNode = ({ data }: NodeProps<NodeData>) => {
  const { title, status, details, entityType, entityId } = data;
  const config = statusConfig[status];
  const hasLink = entityType && entityId;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <Card className={cn("w-64 shadow-md transition-all group/nodestep relative", config.cardBorder, config.opacity)}>
         {hasLink && (
            <Link href={`/admin/${entityType}/${entityId}/edit`} passHref legacyBehavior>
                <a target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="absolute top-2 right-2 z-10" aria-label={`Editar ${title}`}>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/nodestep:opacity-100 transition-opacity bg-background/50 hover:bg-accent">
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="sr-only">Editar {title}</span>
                    </Button>
                </a>
            </Link>
        )}
        <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0 gap-2">
          <CardTitle className={cn("text-base font-semibold flex items-center gap-2 truncate", config.titleColor)}>
            {config.icon} <span className="truncate">{title}</span>
          </CardTitle>
          <Badge variant={config.badgeVariant} className="text-xs shrink-0">{config.badgeText}</Badge>
        </CardHeader>
        <CardContent className="p-3 pt-0 text-xs text-muted-foreground space-y-1">
          {details && details.map((detail, index) => (
            <div key={index} className="flex justify-between">
              <span className="truncate">{detail.label}:</span>
              <span className="font-medium text-foreground truncate pl-2">{detail.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
    </>
  );
};

export default memo(FlowStepNode);
