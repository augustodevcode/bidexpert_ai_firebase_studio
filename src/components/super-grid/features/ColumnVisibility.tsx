/**
 * @fileoverview Popover de visibilidade de colunas do SuperGrid.
 * Permite ao usuário mostrar/ocultar colunas via checkboxes.
 */
'use client';

import { Columns3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { VisibilityState } from '@tanstack/react-table';
import type { GridColumn } from '../SuperGrid.types';
import type { GridLocale } from '../SuperGrid.i18n';

interface ColumnVisibilityProps {
  columns: GridColumn[];
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: (visibility: VisibilityState) => void;
  locale: GridLocale;
}

export function ColumnVisibility({
  columns,
  columnVisibility,
  onColumnVisibilityChange,
  locale,
}: ColumnVisibilityProps) {
  const toggleColumn = (columnId: string) => {
    const isCurrentlyVisible = columnVisibility[columnId] !== false;
    onColumnVisibilityChange({
      ...columnVisibility,
      [columnId]: !isCurrentlyVisible,
    });
  };

  const visibleCount = columns.filter(
    col => columnVisibility[col.id] !== false
  ).length;

  const showAll = () => {
    const visibility: VisibilityState = {};
    columns.forEach(col => {
      visibility[col.id] = true;
    });
    onColumnVisibilityChange(visibility);
  };

  const hideAll = () => {
    const visibility: VisibilityState = {};
    columns.forEach(col => {
      visibility[col.id] = false;
    });
    onColumnVisibilityChange(visibility);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          data-ai-id="supergrid-column-visibility-btn"
        >
          <Columns3 className="mr-2 h-4 w-4" />
          Colunas ({visibleCount}/{columns.length})
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-0"
        align="end"
        data-ai-id="supergrid-column-visibility-panel"
      >
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">{locale.columnVisibility.visibleColumns}</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={showAll} className="h-7 text-xs px-2">
              {locale.columnVisibility.showAll}
            </Button>
            <Button variant="ghost" size="sm" onClick={hideAll} className="h-7 text-xs px-2">
              {locale.columnVisibility.hideAll}
            </Button>
          </div>
        </div>
        <ScrollArea className="max-h-64">
          <div className="p-2 space-y-1">
            {columns.map(col => {
              const isVisible = columnVisibility[col.id] !== false;
              return (
                <div
                  key={col.id}
                  className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleColumn(col.id)}
                  data-ai-id={`supergrid-col-toggle-${col.id}`}
                >
                  <Checkbox
                    checked={isVisible}
                    onCheckedChange={() => toggleColumn(col.id)}
                    id={`col-vis-${col.id}`}
                  />
                  <Label
                    htmlFor={`col-vis-${col.id}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {col.header}
                  </Label>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
