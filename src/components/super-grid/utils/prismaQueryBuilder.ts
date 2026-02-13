/**
 * @fileoverview Conversor de regras do react-querybuilder para formato Prisma Where.
 * Suporta operadores: equals, notEqual, contains, beginsWith, endsWith,
 * greaterThan, lessThan, between, in, notIn, null, notNull.
 * Trata grupos AND/OR aninhados e coerção de tipos.
 */

import type { FieldType } from '../SuperGrid.types';

interface QueryRule {
  field: string;
  operator: string;
  value: unknown;
  valueSource?: string;
}

interface QueryRuleGroup {
  combinator: 'and' | 'or';
  rules: Array<QueryRule | QueryRuleGroup>;
  not?: boolean;
}

/** Mapa de tipo de campo → configuração de busca Prisma */
const FIELD_TYPE_MAP: Record<string, FieldType> = {};

/** Registra tipos de campo para coerção correta */
export function registerFieldTypes(fields: Array<{ name: string; type: FieldType }>): void {
  fields.forEach(f => { FIELD_TYPE_MAP[f.name] = f.type; });
}

/** Converte um RuleGroupType do react-querybuilder para Prisma WHERE */
export function convertQueryBuilderToPrisma(
  ruleGroup: QueryRuleGroup | null | undefined,
  fieldTypes?: Array<{ name: string; type: FieldType }>
): Record<string, unknown> {
  if (!ruleGroup || !ruleGroup.rules || ruleGroup.rules.length === 0) {
    return {};
  }

  if (fieldTypes) {
    registerFieldTypes(fieldTypes);
  }

  const result = processGroup(ruleGroup);
  return result;
}

function processGroup(group: QueryRuleGroup): Record<string, unknown> {
  const conditions: Record<string, unknown>[] = [];

  for (const rule of group.rules) {
    if ('combinator' in rule) {
      // Grupo aninhado
      const nested = processGroup(rule as QueryRuleGroup);
      if (Object.keys(nested).length > 0) {
        conditions.push(nested);
      }
    } else {
      // Regra simples
      const condition = processRule(rule as QueryRule);
      if (condition) {
        conditions.push(condition);
      }
    }
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) {
    const result = conditions[0];
    return group.not ? { NOT: result } : result;
  }

  const combinator = group.combinator.toUpperCase();
  const result = combinator === 'AND'
    ? { AND: conditions }
    : { OR: conditions };

  return group.not ? { NOT: result } : result;
}

function processRule(rule: QueryRule): Record<string, unknown> | null {
  const { field, operator, value } = rule;

  if (!field || !operator) return null;

  // Resolve chave aninhada (e.g., "Auctioneer.name" → { Auctioneer: { name: ... } })
  const fieldParts = field.split('.');

  const condition = buildOperatorCondition(operator, value, FIELD_TYPE_MAP[field]);

  if (!condition) return null;

  // Construir objeto aninhado para campos com ponto
  if (fieldParts.length > 1) {
    let result: Record<string, unknown> = condition;
    for (let i = fieldParts.length - 1; i >= 0; i--) {
      if (i === fieldParts.length - 1) {
        result = { [fieldParts[i]]: condition };
      } else {
        result = { [fieldParts[i]]: result };
      }
    }
    return result;
  }

  return { [field]: condition };
}

function buildOperatorCondition(
  operator: string,
  value: unknown,
  fieldType?: FieldType
): Record<string, unknown> | null {
  const coercedValue = coerceValue(value, fieldType);

  switch (operator) {
    case '=':
    case 'equals':
      return { equals: coercedValue };

    case '!=':
    case 'notEqual':
    case 'doesNotEqual':
      return { not: coercedValue };

    case 'contains':
      return { contains: String(value ?? '') };

    case 'doesNotContain':
      return { not: { contains: String(value ?? '') } };

    case 'beginsWith':
    case 'startsWith':
      return { startsWith: String(value ?? '') };

    case 'endsWith':
      return { endsWith: String(value ?? '') };

    case '>':
    case 'greaterThan':
      return { gt: coercedValue };

    case '>=':
    case 'greaterThanOrEqual':
      return { gte: coercedValue };

    case '<':
    case 'lessThan':
      return { lt: coercedValue };

    case '<=':
    case 'lessThanOrEqual':
      return { lte: coercedValue };

    case 'between': {
      if (Array.isArray(value) && value.length === 2) {
        return {
          gte: coerceValue(value[0], fieldType),
          lte: coerceValue(value[1], fieldType),
        };
      }
      // Se for string separada por vírgula
      if (typeof value === 'string') {
        const parts = value.split(',').map(v => v.trim());
        if (parts.length === 2) {
          return {
            gte: coerceValue(parts[0], fieldType),
            lte: coerceValue(parts[1], fieldType),
          };
        }
      }
      return null;
    }

    case 'notBetween': {
      if (Array.isArray(value) && value.length === 2) {
        return {
          OR: [
            { lt: coerceValue(value[0], fieldType) },
            { gt: coerceValue(value[1], fieldType) },
          ],
        };
      }
      return null;
    }

    case 'in': {
      const inValues = Array.isArray(value)
        ? value.map(v => coerceValue(v, fieldType))
        : typeof value === 'string'
          ? value.split(',').map(v => coerceValue(v.trim(), fieldType))
          : [coercedValue];
      return { in: inValues };
    }

    case 'notIn': {
      const notInValues = Array.isArray(value)
        ? value.map(v => coerceValue(v, fieldType))
        : typeof value === 'string'
          ? value.split(',').map(v => coerceValue(v.trim(), fieldType))
          : [coercedValue];
      return { notIn: notInValues };
    }

    case 'null':
    case 'isNull':
      return { equals: null };

    case 'notNull':
    case 'isNotNull':
      return { not: null };

    default:
      console.warn(`[SuperGrid] Operador desconhecido: ${operator}`);
      return { equals: coercedValue };
  }
}

function coerceValue(value: unknown, fieldType?: FieldType): unknown {
  if (value === null || value === undefined) return value;

  switch (fieldType) {
    case 'number':
    case 'currency':
    case 'percentage': {
      const num = Number(value);
      return isNaN(num) ? value : num;
    }

    case 'boolean':
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      return Boolean(value);

    case 'date':
    case 'datetime': {
      if (value instanceof Date) return value;
      const date = new Date(String(value));
      return isNaN(date.getTime()) ? value : date;
    }

    default:
      return value;
  }
}
