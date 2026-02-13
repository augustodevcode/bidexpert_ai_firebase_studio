/**
 * @fileoverview Toolbar completa do SuperGrid.
 * Orquestra busca rápida, query builder, exportação, visibilidade de colunas,
 * densidade, agrupamento, adicionar novo registro e contagem de resultados.
 */
'use client';

import { Search, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExportMenu } from './ExportMenu';
import { ColumnVisibility } from './ColumnVisibility';
import { DensitySelector } from './DensitySelector';
import { QueryBuilderPanel } from './QueryBuilderPanel';
import { GroupingPanel } from './GroupingPanel';
import type { VisibilityState } from '@tanstack/react-table';
import type { SuperGridConfig, GridDensity, ExportConfig, QueryBuilderConfig, GridColumn } from '../SuperGrid.types';

interface GridToolbarProps {
  config: SuperGridConfig;
  // Quick filter
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  // Query builder
  isQueryBuilderOpen: boolean;
  onQueryBuilderOpenChange: (open: boolean) => void;
  queryBuilderState: Record<string, unknown>;
  onQueryBuilderChange: (query: Record<string, unknown>) => void;
  // Column visibility
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: (visibility: VisibilityState) => void;
  // Density
  density: GridDensity;
  onDensityChange: (density: GridDensity) => void;
  // Grouping
  grouping: string[];
  onGroupingChange: (grouping: string[]) => void;
  // Export
  onExport: (format: 'excel' | 'csv') => void;
  isExporting: boolean;
  // CRUD
  onAddNew: () => void;
  onRefresh: () => void;
  // Counts
  totalCount: number;
  isFetching: boolean;
  // Permissions
  canCreate: boolean;
  canExport: boolean;
}

export function GridToolbar({
  config,
  globalFilter,
  onGlobalFilterChange,
  isQueryBuilderOpen,
  onQueryBuilderOpenChange,
  queryBuilderState,
  onQueryBuilderChange,
  columnVisibility,
  onColumnVisibilityChange,
  density,
  onDensityChange,
  grouping,
  onGroupingChange,
  onExport,
  isExporting,
  onAddNew,
  onRefresh,
  totalCount,
  isFetching,
  canCreate,
  canExport,
}: GridToolbarProps) {
  const features = config.features;

  return (
    <div className="space-y-3" data-ai-id="supergrid-toolbar">
      {/* Row 1: Title + Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {config.title && (
            <h2
              className="text-lg font-semibold"
              data-ai-id="supergrid-title"
            >
              {config.title}
            </h2>
          )}
          <span className="text-sm text-muted-foreground" data-ai-id="supergrid-total-count">
            {totalCount.toLocaleString('pt-BR')} {totalCount === 1 ? 'registro' : 'registros'}
          </span>
          {isFetching && (
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="flex items-center gap-2">
          {features.editing.enabled && features.editing.allowAdd && canCreate && (
            <Button
              size="sm"
              onClick={onAddNew}
              data-ai-id="supergrid-add-new-btn"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo
            </Button>
          )}

          {canExport && (
            <ExportMenu
              config={features.export}
              onExport={onExport}
              isExporting={isExporting}
            />
          )}

          <ColumnVisibility
            columns={config.columns as GridColumn[]}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={onColumnVisibilityChange}
          />

          <DensitySelector
            density={density}
            onDensityChange={onDensityChange}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isFetching}
            data-ai-id="supergrid-refresh-btn"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Row 2: Quick Filter + Query Builder toggle */}
      <div className="flex items-center gap-3">
        {features.filtering.quickFilter && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar em todos os campos..."
              value={globalFilter}
              onChange={e => onGlobalFilterChange(e.target.value)}
              className="pl-9 h-9"
              data-ai-id="supergrid-quick-filter"
            />
          </div>
        )}

        {features.filtering.queryBuilder.enabled && (
          <QueryBuilderPanel
            config={features.filtering.queryBuilder as QueryBuilderConfig}
            isOpen={isQueryBuilderOpen}
            onOpenChange={onQueryBuilderOpenChange}
            query={queryBuilderState}
            onQueryChange={onQueryBuilderChange}
          />
        )}
      </div>

      {/* Row 3: Grouping panel (conditional) */}
      {features.grouping.enabled && (
        <GroupingPanel
          columns={config.columns as GridColumn[]}
          grouping={grouping}
          onGroupingChange={onGroupingChange}
          enabled={features.grouping.enabled}
        />
      )}
    </div>
  );
}
