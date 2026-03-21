// src/components/auction/auction-stages-form.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2 } from 'lucide-react';
import { getFormStageVisualState, getStageVisualConfig } from '@/components/auction/auction-stage-visuals';

interface AuctionStage {
  name: string;
  startDate: Date;
  endDate: Date;
  initialPrice?: number | null;
  discountPercent?: number | null;
}

interface AuctionStagesFormProps {
  stages: AuctionStage[];
  onAddStage: () => void;
  onRemoveStage: (index: number) => void;
  onStageChange: (index: number, field: keyof AuctionStage, value: any) => void;
}

export default function AuctionStagesForm({
  stages,
  onAddStage,
  onRemoveStage,
  onStageChange,
}: AuctionStagesFormProps) {
  const [draftDateValues, setDraftDateValues] = React.useState<Record<string, string>>({});

  const formatDateForInput = (date: Date | null | undefined): string => {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      // Format as YYYY-MM-DDTHH:mm for datetime-local input
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  const parseDateTimeLocal = (value: string): Date | null => {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
    if (!match) {
      return null;
    }

    const [, yearText, monthText, dayText, hourText, minuteText] = match;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const hour = Number(hourText);
    const minute = Number(minuteText);

    const parsed = new Date(year, month - 1, day, hour, minute, 0, 0);

    if (
      Number.isNaN(parsed.getTime()) ||
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== month - 1 ||
      parsed.getDate() !== day ||
      parsed.getHours() !== hour ||
      parsed.getMinutes() !== minute
    ) {
      return null;
    }

    return parsed;
  };

  React.useEffect(() => {
    const nextDraftValues: Record<string, string> = {};

    stages.forEach((stage, index) => {
      nextDraftValues[`${index}-startDate`] = formatDateForInput(stage.startDate);
      nextDraftValues[`${index}-endDate`] = formatDateForInput(stage.endDate);
    });

    setDraftDateValues(nextDraftValues);
  }, [stages]);

  const handleDateChange = (index: number, field: 'startDate' | 'endDate', value: string) => {
    setDraftDateValues((current) => ({
      ...current,
      [`${index}-${field}`]: value,
    }));

    const date = parseDateTimeLocal(value);
    if (date) {
      onStageChange(index, field, date);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Praças do Leilão</h3>
        <Button type="button" variant="outline" size="sm" onClick={onAddStage}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Adicionar Praça
        </Button>
      </div>

      {stages.length === 0 && (
        <div className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-md">
          Nenhuma praça adicionada. Clique em "Adicionar Praça" para começar.
        </div>
      )}

      {stages.map((stage, index) => (
        <div key={index} className="border rounded-md p-4 space-y-4 bg-muted/30">
          {(() => {
            const visualState = getFormStageVisualState(stage);
            const visual = getStageVisualConfig(visualState);
            const VisualIcon = visual.icon;

            return (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={visual.chipClassName} data-ai-id={`auction-stage-form-icon-${index}`}>
                <VisualIcon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                <h4 className="font-medium text-sm">Praça {index + 1}</h4>
                <Badge className={visual.badgeClassName}>{visual.label}</Badge>
              </div>
            </div>
            {stages.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveStage(index)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
            );
          })()}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`stage-${index}-name`}>Nome da Praça</Label>
              <Input
                id={`stage-${index}-name`}
                type="text"
                value={stage.name || ''}
                onChange={(e) => onStageChange(index, 'name', e.target.value)}
                placeholder={`Praça ${index + 1}`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`stage-${index}-initialPrice`}>
                Preço Inicial (Opcional)
              </Label>
              <Input
                id={`stage-${index}-initialPrice`}
                type="number"
                step="0.01"
                value={stage.initialPrice ?? ''}
                onChange={(e) =>
                  onStageChange(
                    index,
                    'initialPrice',
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
                placeholder="R$ 0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`stage-${index}-discountPercent`}>
                % do Valor Original
              </Label>
              <Input
                id={`stage-${index}-discountPercent`}
                type="number"
                step="1"
                min="1"
                max="100"
                value={stage.discountPercent ?? (index === 0 ? 100 : 60)}
                onChange={(e) =>
                  onStageChange(
                    index,
                    'discountPercent',
                    e.target.value ? parseInt(e.target.value, 10) : null
                  )
                }
                placeholder="100"
              />
              <p className="text-xs text-muted-foreground">
                {index === 0 
                  ? '100% = valor integral (1ª praça)'
                  : '60% = 60% do valor original (desconto de 40%)'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`stage-${index}-startDate`}>
                Data/Hora de Início <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`stage-${index}-startDate`}
                type="text"
                value={draftDateValues[`${index}-startDate`] ?? formatDateForInput(stage.startDate)}
                onChange={(e) => handleDateChange(index, 'startDate', e.target.value)}
                data-ai-id={`auction-stage-start-date-${index}`}
                placeholder="2026-03-30T23:22"
                autoComplete="off"
                required
              />
              <p className="text-xs text-muted-foreground">Use o formato AAAA-MM-DDTHH:mm.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`stage-${index}-endDate`}>
                Data/Hora de Término <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`stage-${index}-endDate`}
                type="text"
                value={draftDateValues[`${index}-endDate`] ?? formatDateForInput(stage.endDate)}
                onChange={(e) => handleDateChange(index, 'endDate', e.target.value)}
                data-ai-id={`auction-stage-end-date-${index}`}
                placeholder="2026-03-31T23:22"
                autoComplete="off"
                required
              />
              <p className="text-xs text-muted-foreground">Use o formato AAAA-MM-DDTHH:mm.</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
