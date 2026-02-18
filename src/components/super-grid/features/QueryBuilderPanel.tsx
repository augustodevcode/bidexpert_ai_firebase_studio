/**
 * @fileoverview Painel do Query Builder visual do SuperGrid.
 * Usa react-querybuilder com controles ShadCN (Collapsible + Card).
 */
'use client';

import { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import QueryBuilder, {
  type RuleGroupType,
  type Field,
} from 'react-querybuilder';
import 'react-querybuilder/dist/query-builder.css';
import type { QueryBuilderConfig } from '../SuperGrid.types';
import type { GridLocale } from '../SuperGrid.i18n';

interface QueryBuilderPanelProps {
  config: QueryBuilderConfig;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  query: Record<string, unknown>;
  onQueryChange: (query: Record<string, unknown>) => void;
  locale: GridLocale;
}

/** Converte fields da config para formato do react-querybuilder */
function toQBFields(config: QueryBuilderConfig, locale?: GridLocale): Field[] {
  return config.fields.map(f => ({
    name: f.name,
    label: f.label,
    inputType: mapInputType(f.type),
    valueEditorType: f.valueEditorType as Field['valueEditorType'],
    values: f.values,
    operators: f.operators
      ? f.operators.map(op => ({ name: op, label: getOperatorLabel(op, locale) }))
      : undefined,
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
    beginsWith: 'Começa com',
    endsWith: 'Termina com',
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
  config,
  isOpen,
  onOpenChange,
  query,
  onQueryChange,
  locale,
}: QueryBuilderPanelProps) {
  if (!config.enabled) return null;

  const fields = toQBFields(config, locale);
  const activeRuleCount = countActiveRules(query);

  const clearQuery = () => {
    onQueryChange({ combinator: 'and', rules: [] });
  };

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
          <QueryBuilder
            fields={fields}
            query={query as unknown as RuleGroupType}
            onQueryChange={(q: RuleGroupType) => onQueryChange(q as unknown as Record<string, unknown>)}
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
    </Collapsible>
  );
}
