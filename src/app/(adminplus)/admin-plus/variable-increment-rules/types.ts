/**
 * @fileoverview Tipos serializados para listagem de VariableIncrementRule — Admin Plus.
 */
export interface VariableIncrementRuleRow {
  id: string;
  from: number;
  to: number | null;
  increment: number;
  platformSettingsId: string;
}
