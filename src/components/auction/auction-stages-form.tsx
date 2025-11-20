// src/components/auction/auction-stages-form.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface AuctionStage {
  name: string;
  startDate: Date;
  endDate: Date;
  initialPrice?: number | null;
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

  const handleDateChange = (index: number, field: 'startDate' | 'endDate', value: string) => {
    if (!value) return;
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
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
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Praça {index + 1}</h4>
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
              <Label htmlFor={`stage-${index}-startDate`}>
                Data/Hora de Início <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`stage-${index}-startDate`}
                type="datetime-local"
                value={formatDateForInput(stage.startDate)}
                onChange={(e) => handleDateChange(index, 'startDate', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`stage-${index}-endDate`}>
                Data/Hora de Término <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`stage-${index}-endDate`}
                type="datetime-local"
                value={formatDateForInput(stage.endDate)}
                onChange={(e) => handleDateChange(index, 'endDate', e.target.value)}
                required
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
