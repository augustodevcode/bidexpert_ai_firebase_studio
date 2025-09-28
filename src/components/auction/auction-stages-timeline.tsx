// src/components/auction/auction-stages-timeline.tsx
'use client';

import type { AuctionStage } from '@/types';
import { CalendarDays, PlusCircle, Trash2, CalendarIcon } from 'lucide-react';
import { format, isPast, isFuture, parseISO, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

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
            const time = field === 'startDate' ? startDate : endDate;
            const newDate = setMinutes(setHours(date, time?.getHours() || 0), time?.getMinutes() || 0);
            if (field === 'startDate') setStartDate(newDate);
            else setEndDate(newDate);
            onStageChange(index, field, newDate);
        }
    };
    
    return (
        <div className="p-3 border rounded-md bg-background relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-medium">Nome da Etapa</label>
                    <Input 
                        defaultValue={stage.name} 
                        onBlur={(e) => onStageChange(index, 'name', e.target.value)}
                        placeholder={`Praça ${index + 1}`}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium">Lance Inicial (Opcional)</label>
                    <Input 
                        type="number"
                        defaultValue={stage.initialPrice ?? ''} 
                        onBlur={(e) => onStageChange(index, 'initialPrice', parseFloat(e.target.value))}
                        placeholder="Ex: 5000.00"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium">Data de Início</label>
                    <Popover>
                        <PopoverTrigger asChild>
                           <Button variant="outline" className="w-full justify-start text-left font-normal h-9">
                               <CalendarIcon className="mr-2 h-4 w-4" />
                               {startDate ? format(startDate, 'dd/MM/yyyy HH:mm') : <span>Selecione</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={(d) => handleDateChange('startDate', d)} initialFocus /></PopoverContent>
                    </Popover>
                </div>
                 <div className="space-y-1">
                    <label className="text-xs font-medium">Data de Fim</label>
                     <Popover>
                        <PopoverTrigger asChild>
                           <Button variant="outline" className="w-full justify-start text-left font-normal h-9">
                               <CalendarIcon className="mr-2 h-4 w-4" />
                               {endDate ? format(endDate, 'dd/MM/yyyy HH:mm') : <span>Selecione</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={(d) => handleDateChange('endDate', d)} initialFocus /></PopoverContent>
                    </Popover>
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
}

const AuctionStageItem: React.FC<AuctionStageItemProps> = ({ stage, isCompleted, isActive }) => {
  const endDate = stage.endDate ? new Date(stage.endDate) : null;
  return (
    <div className="flex items-start gap-2 flex-1 min-w-0 px-1 text-xs">
      <div className="flex flex-col items-center gap-1 mt-1">
        <div className={cn(
          "h-3.5 w-3.5 rounded-full border-2",
          isCompleted ? "bg-primary border-primary" : (isActive ? "bg-background border-primary ring-2 ring-primary/30" : "bg-background border-border")
        )} />
      </div>
      <div className="flex-grow">
        <p className={cn("font-semibold truncate w-full", isActive ? 'text-primary' : (isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'))} title={stage.name || ''}>
          {stage.name || `Etapa`}
        </p>
        <p className="text-muted-foreground">{endDate ? `${format(endDate, 'dd/MM', { locale: ptBR })} às ${format(endDate, 'HH:mm')}` : 'Data indefinida'}</p>
        {stage.initialPrice != null && (
          <p className="text-primary font-medium">R$ {Number(stage.initialPrice).toLocaleString('pt-br')}</p>
        )}
      </div>
    </div>
  );
};

interface AuctionStagesTimelineProps {
  stages: Partial<AuctionStage>[];
  auctionOverallStartDate?: Date;
  isEditable?: boolean;
  onStageChange?: (index: number, field: keyof AuctionStage, value: any) => void;
  onAddStage?: () => void;
  onRemoveStage?: (index: number) => void;
}

export default function AuctionStagesTimeline({ 
  stages, 
  auctionOverallStartDate, 
  isEditable = false,
  onStageChange,
  onAddStage,
  onRemoveStage,
}: AuctionStagesTimelineProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient && !isEditable) {
    return <div className="h-10 w-full bg-muted rounded-md animate-pulse"></div>;
  }
  
  const processedStages = stages
    .map(stage => ({
      ...stage,
      startDate: stage.startDate ? (stage.startDate instanceof Date ? stage.startDate : parseISO(stage.startDate as string)) : null,
      endDate: stage.endDate ? (stage.endDate instanceof Date ? stage.endDate : parseISO(stage.endDate as string)) : null,
    }))
    .sort((a, b) => (a.startDate?.getTime() || 0) - (b.startDate?.getTime() || 0));

  if (!stages || stages.length === 0) {
    return (
      <div className="p-4 border rounded-md text-center">
        <p className="text-sm text-muted-foreground">Nenhuma etapa de leilão definida.</p>
        {isEditable && onAddStage && (
          <Button type="button" variant="secondary" size="sm" onClick={onAddStage} className="mt-2">
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Primeira Etapa
          </Button>
        )}
      </div>
    );
  }

  const now = new Date();
  let activeStageIndex = processedStages.findIndex(stage => 
    stage.startDate && stage.endDate && now >= stage.startDate && now < stage.endDate
  );

  if (activeStageIndex === -1) {
    const nextStageIndex = processedStages.findIndex(stage => stage.startDate && isFuture(stage.startDate));
    if (nextStageIndex !== -1) {
      activeStageIndex = nextStageIndex;
    } else if (processedStages.every(s => s.endDate && isPast(s.endDate))) {
      activeStageIndex = processedStages.length;
    }
  }

  if (isEditable && onStageChange) {
    return (
      <div className="space-y-3">
        {stages.map((stage, index) => (
          <StageField key={stage.id || index} stage={stage} index={index} onStageChange={onStageChange} onRemoveStage={onRemoveStage} />
        ))}
        {onAddStage && (
          <Button type="button" variant="outline" size="sm" onClick={onAddStage}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Etapa/Praça
          </Button>
        )}
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-xs font-semibold mb-2 flex items-center text-muted-foreground"><CalendarDays className="h-3 w-3 mr-1.5" />ETAPAS DO LEILÃO</h4>
      <div className="relative flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="absolute left-[6px] sm:left-1/2 sm:top-[7px] sm:bottom-auto sm:w-full sm:h-0.5 w-0.5 top-2 bottom-2 bg-border -translate-x-0 sm:-translate-x-1/2 sm:-translate-y-1/2 -z-10"></div>
        {processedStages.map((stage, index) => {
          const isCompleted = stage.endDate ? isPast(stage.endDate) : false;
          const isActive = index === activeStageIndex;
          return (
            <AuctionStageItem key={(stage.id as string) || index} stage={stage} isActive={isActive} isCompleted={isCompleted} />
          );
        })}
      </div>
    </div>
  );
}
