// packages/ui/src/components/auction/auction-stages-timeline.tsx
'use client';

import type { AuctionStage } from '@bidexpert/core';
import { CalendarDays, DollarSign } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import React, { useState, useEffect } from 'react';

interface AuctionStageItemProps {
  stage: AuctionStage;
  isCompleted: boolean;
  isActive: boolean;
}

const AuctionStageItem: React.FC<AuctionStageItemProps> = ({ stage, isCompleted, isActive }) => {
  const [formattedDate, setFormattedDate] = useState<string>('N/D');
  const [formattedTime, setFormattedTime] = useState<string>('');

  useEffect(() => {
    if (stage.endDate) {
      const dateObj = stage.endDate instanceof Date ? stage.endDate : new Date(stage.endDate as string);
      if (!isNaN(dateObj.getTime())) {
        setFormattedDate(format(dateObj, "dd/MM", { locale: ptBR }));
        setFormattedTime(format(dateObj, "HH:mm", { locale: ptBR }));
      }
    }
  }, [stage.endDate]);

  return (
    <div className="flex items-start gap-2 flex-1 min-w-0 px-1 text-xs">
        <div className="flex flex-col items-center gap-1 mt-1">
            <div className={cn(
                "h-3.5 w-3.5 rounded-full border-2",
                isCompleted ? "bg-primary border-primary" : (isActive ? "bg-background border-primary ring-2 ring-primary/30" : "bg-background border-border")
            )} />
        </div>
        <div className="flex-grow">
            <p className={cn(
                "font-semibold truncate w-full",
                isActive ? 'text-primary' : (isCompleted ? 'text-muted-foreground line-through' : 'text-foreground')
            )} title={stage.name || ''}>
                {stage.name || `Etapa`}
            </p>
            <p className="text-muted-foreground">{formattedDate} - {formattedTime}</p>
            {stage.evaluationValue && (
                <p className="text-primary font-medium">R$ {stage.evaluationValue.toLocaleString('pt-br')}</p>
            )}
        </div>
    </div>
  );
};

interface AuctionStagesTimelineProps {
  stages: AuctionStage[];
}

export default function AuctionStagesTimeline({ stages }: AuctionStagesTimelineProps) {
  if (!stages || stages.length === 0) {
    return null;
  }

  const processedStages = stages
    .map(stage => ({
      ...stage,
      startDate: stage.startDate ? new Date(stage.startDate as string) : null,
      endDate: stage.endDate ? new Date(stage.endDate as string) : null,
    }))
    .sort((a, b) => (a.startDate?.getTime() || 0) - (b.startDate?.getTime() || 0));

  const now = new Date();
  let activeStageIndex = processedStages.findIndex(stage => 
    stage.startDate && stage.endDate && now >= stage.startDate && now < stage.endDate
  );
  
  if (activeStageIndex === -1) {
    const nextStageIndex = processedStages.findIndex(stage => stage.startDate && now < stage.startDate);
    if (nextStageIndex !== -1) {
      activeStageIndex = nextStageIndex;
    } else if (processedStages.every(s => s.endDate && isPast(s.endDate))) {
      activeStageIndex = processedStages.length;
    }
  }


  return (
    <div>
        <h4 className="text-xs font-semibold mb-2 flex items-center text-muted-foreground"><CalendarDays className="h-3 w-3 mr-1.5" />ETAPAS DO LEILÃO</h4>
        <div className="relative flex flex-col space-y-2">
            {/* Linha vertical */}
            <div className="absolute left-[6px] top-2 bottom-2 w-0.5 bg-border -z-10"></div>
            {processedStages.map((stage, index) => {
                const isCompleted = stage.endDate ? isPast(stage.endDate) : false;
                const isActive = index === activeStageIndex;
                return (
                    <AuctionStageItem key={stage.name || index} stage={stage} isActive={isActive} isCompleted={isCompleted} />
                )
            })}
        </div>
    </div>
  );
}
