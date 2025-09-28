// src/components/auction/auction-stages-timeline.tsx
'use client';

import type { AuctionStage, PlatformSettings } from '@/types';
import { CalendarDays, PlusCircle, Trash2, CalendarIcon } from 'lucide-react';
import { format, isPast, isFuture, parseISO, setHours, setMinutes, addDays, differenceInMilliseconds, formatDistanceStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StageFieldProps {
  stage: Partial<AuctionStage>;
  index: number;
  onStageChange: (index: number, field: keyof AuctionStage, value: any) => void;
  onRemoveStage?: (index: number) => void;
}

const StageField: React.FC<StageFieldProps> = ({ stage, index, onStageChange, onRemoveStage }) => {
    const [startDate, setStartDate] = useState<Date | undefined>(stage.startDate ? new Date(stage.startDate) : undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(stage.endDate ? new Date(stage.endDate) : undefined);

    useEffect(() => {
        if (stage.startDate) setStartDate(new Date(stage.startDate));
        if (stage.endDate) setEndDate(new Date(stage.endDate));
    }, [stage.startDate, stage.endDate]);

    const handleDateChange = (field: 'startDate' | 'endDate', date: Date | undefined) => {
        if (date) {
            const timeSource = field === 'startDate' ? startDate : endDate;
            const hours = timeSource ? timeSource.getHours() : (field === 'startDate' ? 9 : 18);
            const minutes = timeSource ? timeSource.getMinutes() : 0;
            const newDate = setMinutes(setHours(date, hours), minutes);
            
            if (field === 'startDate') setStartDate(newDate);
            else setEndDate(newDate);
            onStageChange(index, field, newDate);
        }
    };
    
    const handleTimeChange = (field: 'startDate' | 'endDate', time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        const dateToUpdate = field === 'startDate' ? startDate : endDate;
        if (dateToUpdate && !isNaN(hours) && !isNaN(minutes)) {
            const newDate = setMinutes(setHours(dateToUpdate, hours), minutes);
            if (field === 'startDate') setStartDate(newDate);
            else setEndDate(newDate);
            onStageChange(index, field, newDate);
        }
    };
    
    return (
        <div className="p-3 border rounded-md bg-background relative" data-ai-id={`stage-editor-${index}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-medium">Nome da Etapa</label>
                    <Input 
                        defaultValue={stage.name} 
                        onBlur={(e) => onStageChange(index, 'name', e.target.value)}
                        placeholder={`Praça ${index + 1}`}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium">Lance Inicial (R$) - Opcional</label>
                     <Input 
                        type="number"
                        defaultValue={stage.initialPrice ?? ''} 
                        onBlur={(e) => onStageChange(index, 'initialPrice', parseFloat(e.target.value) || null)}
                        placeholder="Herdará do lote se vazio"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium">Data/Hora de Início</label>
                    <div className="flex gap-1">
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal h-9">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, 'dd/MM/yyyy', { locale: ptBR }) : <span>Selecione</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={(d) => handleDateChange('startDate', d)} initialFocus /></PopoverContent>
                        </Popover>
                         <Input type="time" defaultValue={startDate ? format(startDate, 'HH:mm') : '09:00'} onChange={(e) => handleTimeChange('startDate', e.target.value)} className="w-28 h-9 shrink-0"/>
                    </div>
                </div>
                 <div className="space-y-1">
                    <label className="text-xs font-medium">Data/Hora de Fim</label>
                    <div className="flex gap-1">
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal h-9">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, 'dd/MM/yyyy') : <span>Selecione</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={(d) => handleDateChange('endDate', d)} initialFocus /></PopoverContent>
                        </Popover>
                        <Input type="time" defaultValue={endDate ? format(endDate, 'HH:mm') : '18:00'} onChange={(e) => handleTimeChange('endDate', e.target.value)} className="w-28 h-9 shrink-0"/>
                    </div>
                </div>
            </div>
            {onRemoveStage && (
                <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 text-destructive" onClick={() => onRemoveStage(index)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
};


interface AuctionStageItemProps {
  stage: AuctionStage;
  isCompleted: boolean;
  isActive: boolean;
  isFirst: boolean;
  isLast: boolean;
  timelineStyle: { left: string; width: string; };
}

const AuctionStageItem: React.FC<AuctionStageItemProps> = ({ stage, isCompleted, isActive, isFirst, isLast, timelineStyle }) => {
  const endDate = stage.endDate ? new Date(stage.endDate) : null;
  const statusColor = isCompleted ? 'bg-muted-foreground' : isActive ? 'bg-primary' : 'bg-border';
  const ringColor = isActive ? 'ring-primary/50' : 'ring-transparent';
  
  return (
    <div className="flex-1 min-w-0" style={{ flexBasis: timelineStyle.width }}>
      <TooltipProvider>
          <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative h-full flex flex-col items-center">
                    <div className={cn("absolute top-1/2 -translate-y-1/2 w-full h-0.5", isFirst ? "left-1/2" : "right-1/2", statusColor)}></div>
                    <div className={cn("relative h-3 w-3 rounded-full border-2 border-background", statusColor, ringColor, isActive && 'ring-2')}></div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                  <p className="font-semibold">{stage.name}</p>
                  <p className="text-xs">{endDate ? `Fim: ${format(endDate, 'dd/MM HH:mm')}` : 'Data indefinida'}</p>
                   {isActive && <p className="text-xs text-primary font-bold">ETAPA ATUAL</p>}
              </TooltipContent>
          </Tooltip>
      </TooltipProvider>
      <div className="mt-2 text-center text-xs px-1">
        <p className={cn("font-medium truncate", isActive ? "text-primary" : "text-muted-foreground")} title={stage.name || ''}>
            {stage.name || `Etapa`}
        </p>
      </div>
    </div>
  );
};

interface AuctionStagesTimelineProps {
  stages: Partial<AuctionStage>[];
  auctionOverallStartDate?: Date;
  isEditable?: boolean;
  platformSettings?: PlatformSettings | null;
  onStageChange?: (index: number, field: keyof AuctionStage, value: any) => void;
  onAddStage?: (stage: Partial<AuctionStage>) => void;
  onRemoveStage?: (index: number) => void;
}

export default function AuctionStagesTimeline({ 
  stages, 
  auctionOverallStartDate, 
  isEditable = false,
  platformSettings,
  onStageChange,
  onAddStage,
  onRemoveStage,
}: AuctionStagesTimelineProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handleAddStageWithDefaults = () => {
    if (!onAddStage) return;
    const lastStage = stages[stages.length - 1];
    const durationDays = platformSettings?.biddingSettings?.defaultStageDurationDays || 7;
    const intervalDays = platformSettings?.biddingSettings?.defaultDaysBetweenStages || 1;

    let newStartDate = new Date();
    if (lastStage?.endDate) {
      newStartDate = addDays(new Date(lastStage.endDate), intervalDays);
    }
    
    const newEndDate = addDays(newStartDate, durationDays);

    onAddStage({
      name: `Praça ${stages.length + 1}`,
      startDate: newStartDate,
      endDate: newEndDate,
      initialPrice: null
    });
  };

  if (isEditable) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground flex items-center"><CalendarDays className="h-4 w-4 mr-1.5" />ETAPAS DO LEILÃO</h4>
        {stages.map((stage, index) => (
          <StageField key={stage.id || index} stage={stage} index={index} onStageChange={onStageChange!} onRemoveStage={onRemoveStage} />
        ))}
        {onAddStage && (
          <Button type="button" variant="outline" size="sm" onClick={handleAddStageWithDefaults}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Etapa/Praça
          </Button>
        )}
      </div>
    );
  }
  
  if (!isClient) {
    return <div className="h-12 w-full bg-muted rounded-md animate-pulse"></div>;
  }
  
  const processedStages = stages
    .map(stage => ({
      ...stage,
      startDate: stage.startDate ? (stage.startDate instanceof Date ? stage.startDate : parseISO(stage.startDate as string)) : null,
      endDate: stage.endDate ? (stage.endDate instanceof Date ? stage.endDate : parseISO(stage.endDate as string)) : null,
    }))
    .sort((a, b) => (a.startDate?.getTime() || 0) - (b.startDate?.getTime() || 0));

  if (processedStages.length === 0 || !processedStages[0].startDate || !processedStages[processedStages.length - 1].endDate) {
    return <p className="text-xs text-muted-foreground">Datas das etapas não definidas.</p>;
  }

  const overallStart = processedStages[0].startDate.getTime();
  const overallEnd = processedStages[processedStages.length - 1].endDate!.getTime();
  const totalDuration = differenceInMilliseconds(overallEnd, overallStart);

  const now = new Date();
  let activeStageIndex = processedStages.findIndex(stage => 
    stage.startDate && stage.endDate && now >= stage.startDate && now < stage.endDate
  );

  if (activeStageIndex === -1 && isFuture(processedStages[0].startDate)) {
      activeStageIndex = -1; // Not started yet
  } else if (activeStageIndex === -1 && isPast(processedStages[processedStages.length - 1].endDate!)) {
      activeStageIndex = processedStages.length; // All finished
  }

  return (
    <div>
       <h4 className="text-xs font-semibold mb-2 flex items-center text-muted-foreground"><CalendarDays className="h-3 w-3 mr-1.5" />LINHA DO TEMPO</h4>
       <div className="relative flex w-full h-10 items-center">
            {processedStages.map((stage, index) => {
                if (!stage.startDate || !stage.endDate) return null;
                const prevStageEnd = index > 0 ? processedStages[index - 1].endDate!.getTime() : overallStart;
                const stageStart = stage.startDate.getTime();
                const stageEnd = stage.endDate.getTime();

                const stageWidth = totalDuration > 0 ? ((stageEnd - stageStart) / totalDuration) * 100 : 0;
                
                const isCompleted = isPast(stage.endDate);
                const isActive = index === activeStageIndex;

                return (
                    <AuctionStageItem
                        key={(stage.id as string) || index}
                        stage={stage as AuctionStage}
                        isActive={isActive}
                        isCompleted={isCompleted}
                        isFirst={index === 0}
                        isLast={index === processedStages.length - 1}
                        timelineStyle={{ left: '0%', width: `${stageWidth}%` }}
                    />
                );
            })}
       </div>
       <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{format(overallStart, 'dd/MM')}</span>
          <span className="font-medium">{formatDistanceStrict(overallEnd, overallStart, {locale: ptBR, unit: 'day'})} de duração</span>
          <span>{format(overallEnd, 'dd/MM')}</span>
       </div>
    </div>
  );
}
