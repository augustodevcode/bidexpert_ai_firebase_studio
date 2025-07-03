// src/components/admin/wizard/FlowStepNode.tsx
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Check, Loader, Circle, Workflow, CircleDot } from 'lucide-react';
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface NodeData {
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  details: { label: string; value?: string | number }[];
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
  const { title, status, details } = data;
  const config = statusConfig[status];

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <Card className={cn("w-64 shadow-md transition-all", config.cardBorder, config.opacity)}>
        <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className={cn("text-base font-semibold flex items-center gap-2", config.titleColor)}>
            {config.icon} {title}
          </CardTitle>
          <Badge variant={config.badgeVariant} className="text-xs">{config.badgeText}</Badge>
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
