/**
 * @fileoverview Painel do Query Builder visual do SuperGrid.
 * Usa react-querybuilder com controles ShadCN (Collapsible + Card).
 */
'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Trash2 } from 'lucide-react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import QueryBuilder, {
  type RuleGroupType,
  type Field,
  type Translations,
} from 'react-querybuilder';
import type { QueryBuilderConfig } from '../SuperGrid.types';
import type { GridLocale } from '../SuperGrid.i18n';
import type { SavedGridFilter } from '../utils/savedFilterHelpers';

interface QueryBuilderPanelProps {
  gridId: string;
  config: QueryBuilderConfig;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  query: Record<string, unknown>;
  onQueryChange: (query: Record<string, unknown>) => void;
  locale: GridLocale;
}

const DEFAULT_OPERATOR_NAMES = [
  '=',
  '!=',
  '<',
  '>',
  '<=',
  '>=',
  'contains',
  'beginsWith',
  'endsWith',
  'doesNotContain',
  'doesNotBeginWith',
  'doesNotEndWith',
  'null',
  'notNull',
  'in',
  'notIn',
  'between',
  'notBetween',
] as const;

async function parseApiResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const payload = (await response.json().catch(() => null)) as { data?: T; error?: string } | null;

  if (!response.ok) {
    throw new Error(payload?.error || fallbackMessage);
  }

  return payload?.data as T;
}

async function getSavedGridFiltersRequest(gridId: string): Promise<SavedGridFilter[]> {
  const response = await fetch(`/api/admin/super-grid/filters?gridId=${encodeURIComponent(gridId)}`, {
    method: 'GET',
    cache: 'no-store',
  });

  return parseApiResponse<SavedGridFilter[]>(response, 'Não foi possível carregar os filtros salvos.');
}

async function saveGridFilterRequest(input: {
  gridId: string;
  filterId?: string;
  name: string;
  query: Record<string, unknown>;
}): Promise<SavedGridFilter> {
  const response = await fetch('/api/admin/super-grid/filters', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return parseApiResponse<SavedGridFilter>(response, 'Não foi possível salvar o filtro.');
}

async function deleteGridFilterRequest(input: { gridId: string; filterId: string }): Promise<void> {
  const response = await fetch('/api/admin/super-grid/filters', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  await parseApiResponse<{ success: true }>(response, 'Não foi possível excluir o filtro.');
}

/** Converte fields da config para formato do react-querybuilder */
function toQBFields(config: QueryBuilderConfig, locale?: GridLocale): Field[] {
  return config.fields.map(f => ({
    name: f.name,
    label: f.label,
    inputType: mapInputType(f.type),
    valueEditorType: f.valueEditorType as Field['valueEditorType'],
    values: f.values,
    operators: (f.operators ?? [...DEFAULT_OPERATOR_NAMES])
      .map(op => ({ name: op, label: getOperatorLabel(op, locale) })),
  }));
}

function mapInputType(type: string): string {
  switch (type) {
    case 'number':
    case 'currency':
    case 'percentage':
      return 'number';
    case 'date':
    case 'datetime':
      return 'date';
    default:
      return 'text';
  }
}

function getOperatorLabel(op: string, locale?: GridLocale): string {
  if (locale?.queryBuilder.operators[op]) {
    return locale.queryBuilder.operators[op];
  }
  const labels: Record<string, string> = {
    '=': 'Igual a',
    '!=': 'Diferente de',
    contains: 'Contém',
    doesNotContain: 'Não contém',
    beginsWith: 'Começa com',
    doesNotBeginWith: 'Não começa com',
    endsWith: 'Termina com',
    doesNotEndWith: 'Não termina com',
    '>': 'Maior que',
    '>=': 'Maior ou igual',
    '<': 'Menor que',
    '<=': 'Menor ou igual',
    between: 'Entre',
    notBetween: 'Não está entre',
    in: 'Em',
    notIn: 'Não está em',
    null: 'É nulo',
    notNull: 'Não é nulo',
  };
  return labels[op] || op;
}

function getQueryBuilderTranslations(locale: GridLocale): Partial<Translations> {
  return {
    fields: {
      title: 'Campo',
      placeholderName: '~',
      placeholderLabel: 'Selecione',
      placeholderGroupLabel: 'Selecione',
    },
    operators: {
      title: 'Operador',
      placeholderName: '~',
      placeholderLabel: 'Selecione',
      placeholderGroupLabel: 'Selecione',
    },
    values: {
      title: 'Valores',
      placeholderName: '~',
      placeholderLabel: 'Selecione',
      placeholderGroupLabel: 'Selecione',
    },
    value: {
      title: 'Valor',
    },
    combinators: {
      title: 'Conector',
    },
    addRule: {
      label: '+ Regra',
      title: 'Adicionar regra',
    },
    addGroup: {
      label: '+ Grupo',
      title: 'Adicionar grupo',
    },
    removeRule: {
      label: 'Remover',
      title: 'Remover regra',
    },
    removeGroup: {
      label: 'Remover',
      title: 'Remover grupo',
    },
    notToggle: {
      label: 'Não',
      title: 'Inverter este grupo',
    },
    cloneRule: {
      label: 'Duplicar',
      title: 'Duplicar regra',
    },
    cloneRuleGroup: {
      label: 'Duplicar',
      title: 'Duplicar grupo',
    },
    shiftActionUp: {
      label: 'Subir',
      title: 'Mover para cima',
    },
    shiftActionDown: {
      label: 'Descer',
      title: 'Mover para baixo',
    },
    dragHandle: {
      label: 'Arrastar',
      title: 'Arrastar',
    },
    lockRule: {
      label: 'Bloquear',
      title: 'Bloquear regra',
    },
    lockGroup: {
      label: 'Bloquear',
      title: 'Bloquear grupo',
    },
    lockRuleDisabled: {
      label: 'Desbloquear',
      title: 'Desbloquear regra',
    },
    lockGroupDisabled: {
      label: 'Desbloquear',
      title: 'Desbloquear grupo',
    },
    muteRule: {
      label: 'Silenciar',
      title: 'Silenciar regra',
    },
    muteGroup: {
      label: 'Silenciar',
      title: 'Silenciar grupo',
    },
    unmuteRule: {
      label: 'Reativar',
      title: 'Reativar regra',
    },
    unmuteGroup: {
      label: 'Reativar',
      title: 'Reativar grupo',
    },
    valueSourceSelector: {
      title: 'Origem do valor',
    },
    matchMode: {
      title: 'Modo de correspondência',
    },
    matchThreshold: {
      title: 'Limite de correspondência',
    },
  };
}

function countActiveRules(query: Record<string, unknown>): number {
  const rules = query.rules as Array<Record<string, unknown>> | undefined;
  if (!rules) return 0;
  return rules.reduce((count: number, rule) => {
    if (rule.rules) {
      return count + countActiveRules(rule as Record<string, unknown>);
    }
    return count + 1;
  }, 0);
}

export function QueryBuilderPanel({
  gridId,
  config,
  isOpen,
  onOpenChange,
  query,
  onQueryChange,
  locale,
}: QueryBuilderPanelProps) {
  const isEnabled = config.enabled;
  const fields = toQBFields(config, locale);
  const activeRuleCount = countActiveRules(query);
  const translations = getQueryBuilderTranslations(locale);
  const queryClient = useQueryClient();
  const [selectedFilterId, setSelectedFilterId] = useState('');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState('');

  const { data: savedFilters = [], isFetching: isFetchingSavedFilters } = useQuery({
    queryKey: ['super-grid-saved-filters', gridId],
    queryFn: () => getSavedGridFiltersRequest(gridId),
    enabled: isEnabled,
    staleTime: 30_000,
  });

  const selectedFilter = useMemo(
    () => savedFilters.find(filter => filter.id === selectedFilterId) ?? null,
    [savedFilters, selectedFilterId]
  );

  const saveMutation = useMutation({
    mutationFn: (payload: { filterId?: string; name: string }) =>
      saveGridFilterRequest({
        gridId,
        filterId: payload.filterId,
        name: payload.name,
        query,
      }),
    onSuccess: savedFilter => {
      setSelectedFilterId(savedFilter.id);
      setIsSaveDialogOpen(false);
      setFilterName(savedFilter.name);
      toast.success(locale.queryBuilder.savedSuccess);
      void queryClient.invalidateQueries({ queryKey: ['super-grid-saved-filters', gridId] });
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar o filtro.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (filterId: string) => deleteGridFilterRequest({ gridId, filterId }),
    onSuccess: () => {
      setSelectedFilterId('');
      toast.success(locale.queryBuilder.deletedSuccess);
      void queryClient.invalidateQueries({ queryKey: ['super-grid-saved-filters', gridId] });
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Não foi possível excluir o filtro.');
    },
  });

  const clearQuery = () => {
    onQueryChange({ combinator: 'and', rules: [] });
  };

  const handleOpenSaveDialog = () => {
    setFilterName(selectedFilter?.name ?? '');
    setIsSaveDialogOpen(true);
  };

  const handleApplySavedFilter = (filterId: string) => {
    setSelectedFilterId(filterId);

    const filter = savedFilters.find(item => item.id === filterId);
    if (filter) {
      onQueryChange(filter.query);
    }
  };

  const handleSaveFilter = () => {
    const normalizedName = filterName.trim();
    if (!normalizedName) {
      toast.error('Informe um nome para o filtro.');
      return;
    }

    saveMutation.mutate({
      filterId: selectedFilter?.id,
      name: normalizedName,
    });
  };

  if (!isEnabled) return null;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onOpenChange}
      data-ai-id="supergrid-query-builder-panel"
    >
      <div className="flex items-center gap-2">
        <CollapsibleTrigger asChild>
          <Button
            variant={activeRuleCount > 0 ? 'default' : 'outline'}
            size="sm"
            data-ai-id="supergrid-query-builder-toggle"
          >
            <Filter className="mr-2 h-4 w-4" />
            {locale.queryBuilder.advancedFilter}
            {activeRuleCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                {activeRuleCount}
              </Badge>
            )}
            {isOpen ? (
              <ChevronUp className="ml-1 h-3 w-3" />
            ) : (
              <ChevronDown className="ml-1 h-3 w-3" />
            )}
          </Button>
        </CollapsibleTrigger>
        {activeRuleCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearQuery}
            className="h-8 px-2"
            data-ai-id="supergrid-query-builder-clear"
          >
            <X className="h-4 w-4" />
            {locale.queryBuilder.clear}
          </Button>
        )}
      </div>

      <CollapsibleContent className="mt-2">
        <div className="rounded-md border bg-card p-4">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end">
            <div className="min-w-0 flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">
                {locale.queryBuilder.savedFilters}
              </Label>
              <Select value={selectedFilterId} onValueChange={handleApplySavedFilter}>
                <SelectTrigger data-ai-id="supergrid-saved-filter-select">
                  <SelectValue placeholder={locale.queryBuilder.savedFiltersPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {savedFilters.length === 0 ? (
                    <SelectItem value="__empty" disabled>
                      {isFetchingSavedFilters
                        ? locale.states.loading
                        : locale.queryBuilder.noSavedFilters}
                    </SelectItem>
                  ) : (
                    savedFilters.map((filter: SavedGridFilter) => (
                      <SelectItem key={filter.id} value={filter.id}>
                        {filter.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenSaveDialog}
                disabled={activeRuleCount === 0 || saveMutation.isPending}
                data-ai-id="supergrid-save-filter-btn"
              >
                <Save className="mr-2 h-4 w-4" />
                {locale.queryBuilder.saveCurrent}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedFilterId && deleteMutation.mutate(selectedFilterId)}
                disabled={!selectedFilterId || deleteMutation.isPending}
                data-ai-id="supergrid-delete-filter-btn"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {locale.queryBuilder.deleteSaved}
              </Button>
            </div>
          </div>

          <QueryBuilder
            fields={fields}
            combinators={[
              { name: 'and', label: locale.queryBuilder.combinators.and },
              { name: 'or', label: locale.queryBuilder.combinators.or },
            ]}
            query={query as unknown as RuleGroupType}
            onQueryChange={(q: RuleGroupType) => onQueryChange(q as unknown as Record<string, unknown>)}
            translations={translations}
            controlClassnames={{
              queryBuilder: 'supergrid-qb',
              ruleGroup: 'border rounded-md p-3 mb-2 bg-muted/30',
              combinators: 'rounded border px-2 py-1 text-sm bg-background',
              addRule: 'text-sm text-primary hover:underline cursor-pointer',
              addGroup: 'text-sm text-primary hover:underline cursor-pointer ml-2',
              removeGroup: 'text-destructive hover:text-destructive/80 cursor-pointer',
              removeRule: 'text-destructive hover:text-destructive/80 cursor-pointer',
              fields: 'rounded border px-2 py-1 text-sm bg-background',
              operators: 'rounded border px-2 py-1 text-sm bg-background mx-1',
              value: 'rounded border px-2 py-1 text-sm bg-background mx-1',
            }}
          />
        </div>
      </CollapsibleContent>

      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent data-ai-id="supergrid-save-filter-dialog">
          <DialogHeader>
            <DialogTitle>{locale.queryBuilder.saveDialogTitle}</DialogTitle>
            <DialogDescription>{locale.queryBuilder.saveDialogDescription}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="supergrid-filter-name">{locale.queryBuilder.filterNameLabel}</Label>
            <Input
              id="supergrid-filter-name"
              value={filterName}
              onChange={event => setFilterName(event.target.value)}
              placeholder={locale.queryBuilder.filterNamePlaceholder}
              data-ai-id="supergrid-filter-name-input"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              {locale.editing.cancel}
            </Button>
            <Button onClick={handleSaveFilter} disabled={saveMutation.isPending} data-ai-id="supergrid-filter-save-confirm">
              {locale.queryBuilder.saveConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Collapsible>
  );
}

export default QueryBuilderPanel;
