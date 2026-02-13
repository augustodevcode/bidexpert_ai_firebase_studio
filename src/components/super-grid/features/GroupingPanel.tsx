/**
 * @fileoverview Painel de agrupamento do SuperGrid.
 * Chips com drag que mostram colunas agrupadas com botão de remover.
 */
'use client';

import { Layers, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { GridColumn } from '../SuperGrid.types';

interface GroupingPanelProps {
  columns: GridColumn[];
  grouping: string[];
  onGroupingChange: (grouping: string[]) => void;
  enabled: boolean;
}

export function GroupingPanel({
  columns,
  grouping,
  onGroupingChange,
  enabled,
}: GroupingPanelProps) {
  if (!enabled) return null;

  const groupableColumns = columns.filter(col => col.groupable !== false);
  const availableColumns = groupableColumns.filter(
    col => !grouping.includes(col.id)
  );

  const removeGroup = (columnId: string) => {
    onGroupingChange(grouping.filter(g => g !== columnId));
  };

  const addGroup = (columnId: string) => {
    onGroupingChange([...grouping, columnId]);
  };

  const clearGrouping = () => {
    onGroupingChange([]);
  };

  const getColumnHeader = (columnId: string): string => {
    return columns.find(c => c.id === columnId)?.header || columnId;
  };

  return (
    <div
      className="flex items-center gap-2 flex-wrap"
      data-ai-id="supergrid-grouping-panel"
    >
      <span className="text-sm text-muted-foreground flex items-center gap-1">
        <Layers className="h-4 w-4" />
        Agrupado por:
      </span>

      {grouping.length === 0 && (
        <span className="text-sm text-muted-foreground italic">
          Nenhum agrupamento
        </span>
      )}

      {grouping.map(columnId => (
        <Badge
          key={columnId}
          variant="secondary"
          className="flex items-center gap-1 px-2 py-1"
          data-ai-id={`supergrid-group-chip-${columnId}`}
        >
          {getColumnHeader(columnId)}
          <button
            onClick={() => removeGroup(columnId)}
            className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {availableColumns.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              data-ai-id="supergrid-add-group-btn"
            >
              <Plus className="h-3 w-3 mr-1" />
              Adicionar
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1" align="start">
            {availableColumns.map(col => (
              <button
                key={col.id}
                onClick={() => addGroup(col.id)}
                className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-muted/50 transition-colors"
                data-ai-id={`supergrid-group-option-${col.id}`}
              >
                {col.header}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      )}

      {grouping.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearGrouping}
          className="h-7 px-2 text-destructive"
          data-ai-id="supergrid-clear-groups-btn"
        >
          <X className="h-3 w-3 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  );
}
