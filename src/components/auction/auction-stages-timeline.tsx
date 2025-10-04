// src/components/auction/auction-stages-timeline.tsx
'use client';

import type { AuctionStage, PlatformSettings } from '@/types';
import { CalendarDays, PlusCircle, Trash2, CalendarIcon } from 'lucide-react';
import { format, isPast, isFuture, parseISO, setHours, setMinutes, addDays, differenceInMilliseconds, formatDistanceStrict, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

// Componente de edição para cada etapa
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


// Componente de visualização para cada item da timeline
const AuctionStageItem: React.FC<{
  stage: Partial<AuctionStage>;
  isCompleted: boolean;
  isActive: boolean;
  timelineStyle: { left: string; width: string };
}> = ({ stage, isCompleted, isActive, timelineStyle }) => {
    const endDate = stage.endDate ? new Date(stage.endDate) : null;
    const statusColor = isActive ? 'bg-primary' : isCompleted ? 'bg-muted-foreground' : 'bg-border';
    const ringColor = isActive ? 'ring-primary/50' : 'ring-transparent';

    return (
        <div className="absolute top-1/2 -translate-y-1/2 h-full flex items-center" style={timelineStyle}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="w-full h-full flex flex-col justify-center items-center">
                            <div className={cn("w-full h-0.5", statusColor)}></div>
                            <div className={cn("absolute left-0 h-3 w-3 rounded-full border-2 border-background", statusColor, ringColor, isActive && 'ring-2')}></div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="font-semibold">{stage.name}</p>
                        <p className="text-xs">{endDate ? `Fim: ${format(endDate, 'dd/MM HH:mm')}` : 'Data indefinida'}</p>
                        {isActive && <p className="text-xs text-primary font-bold">ETAPA ATUAL</p>}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-center text-xs w-20">
                <p className={cn("font-medium truncate", isActive ? "text-primary" : "text-muted-foreground")} title={stage.name || ''}>
                    {stage.name || `Etapa`}
                </p>
            </div>
        </div>
    );
};


interface AuctionStagesTimelineProps {
  auctionOverallStartDate: Date;
  stages: Partial<AuctionStage>[];
  isEditable?: boolean;
  platformSettings?: PlatformSettings | null;
  onStageChange?: (index: number, field: keyof AuctionStage, value: any) => void;
  onAddStage?: () => void;
  onRemoveStage?: (index: number) => void;
}

export default function AuctionStagesTimeline({ 
  auctionOverallStartDate,
  stages, 
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
  

  const processedStages = useMemo(() => stages
    .map(stage => ({
      ...stage,
      startDate: stage.startDate ? new Date(stage.startDate) : null,
      endDate: stage.endDate ? new Date(stage.endDate) : null,
    }))
    .sort((a, b) => (a.startDate?.getTime() || 0) - (b.startDate?.getTime() || 0)), [stages]);

  const { overallStart, overallEnd, totalDuration, now } = useMemo(() => {
    if (!isClient || processedStages.length === 0) return { overallStart: 0, overallEnd: 0, totalDuration: 0, now: new Date() };

    const validDates = processedStages.flatMap(s => [s.startDate, s.endDate]).filter(d => d && isValid(d)) as Date[];
    if (validDates.length < 2) return { overallStart: 0, overallEnd: 0, totalDuration: 0, now: new Date() };
    
    const start = Math.min(...validDates.map(d => d.getTime()));
    const end = Math.max(...validDates.map(d => d.getTime()));
    const duration = end - start;
    
    return { overallStart: start, overallEnd: end, totalDuration: duration, now: new Date() };
  }, [isClient, processedStages]);

  const activeStageIndex = useMemo(() => {
    if (!isClient) return -1;
    const nowTime = now.getTime();
    const activeIndex = processedStages.findIndex(stage => 
      stage.startDate && stage.endDate && nowTime >= stage.startDate.getTime() && nowTime < stage.endDate.getTime()
    );
    if (activeIndex !== -1) return activeIndex;

    const firstStageStart = processedStages[0]?.startDate;
    if (firstStageStart && isFuture(firstStageStart)) return -1;

    const lastStageEnd = processedStages[processedStages.length - 1]?.endDate;
    if (lastStageEnd && isPast(lastStageEnd)) return processedStages.length;
    
    return -1;
  }, [isClient, processedStages, now]);


  // Renderiza o modo de edição se isEditable for true
  if (isEditable) {
    return (
        <div className="space-y-2">
            {stages.map((stage, index) => (
                <StageField key={stage.id || index} stage={stage} index={index} onStageChange={onStageChange!} onRemoveStage={onRemoveStage} />
            ))}
            {onAddStage && (
                <Button type="button" variant="outline" size="sm" onClick={onAddStage}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Etapa/Praça
                </Button>
            )}
        </div>
    );
  }

  // Renderiza o modo de visualização (timeline)
  if (!isClient || totalDuration <= 0) {
      return <div className="text-xs text-muted-foreground">Etapas do leilão não definidas.</div>
  }

  return (
    <div className="space-y-3">
      <div className="relative w-full h-12 pt-4">
        {processedStages.map((stage, index) => {
            if (!stage.startDate || !stage.endDate) return null;
            
            const stageStart = stage.startDate.getTime();
            const stageEnd = stage.endDate.getTime();
            
            const leftPercent = ((stageStart - overallStart) / totalDuration) * 100;
            const widthPercent = ((stageEnd - stageStart) / totalDuration) * 100;
            
            const isCompleted = isPast(stage.endDate);
            const isActive = index === activeStageIndex;

            return (
                <AuctionStageItem
                    key={(stage.id as string) || index}
                    stage={stage as AuctionStage}
                    isActive={isActive}
                    isCompleted={isCompleted}
                    timelineStyle={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                />
            );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>{format(overallStart, 'dd/MM')}</span>
        <span className="font-medium">Duração: {formatDistanceStrict(overallEnd, overallStart, {locale: ptBR})}</span>
        <span>{format(overallEnd, 'dd/MM')}</span>
      </div>
    </div>
  );
}
