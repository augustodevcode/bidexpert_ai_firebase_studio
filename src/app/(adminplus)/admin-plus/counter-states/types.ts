/**
 * @fileoverview Tipos serializados para listagem de CounterState — Admin Plus.
 */
export interface CounterStateRow {
  id: string;
  entityType: string;
  currentValue: number;
  createdAt: string;
  updatedAt: string;
}
