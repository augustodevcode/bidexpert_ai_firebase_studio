/**
 * @fileoverview Barrel export do componente SuperGrid.
 * Exporta o componente principal e todos os tipos necessários
 * para configuração declarativa por qualquer entidade.
 */
export { SuperGrid, default } from './SuperGrid';
export type {
  SuperGridConfig,
  GridColumn,
  GridDensity,
  FieldType,
  AggregationFn,
  FieldFormatConfig,
  GroupingConfig,
  EditingConfig,
  ExportConfig,
  QueryBuilderConfig,
  QueryBuilderFieldConfig,
  RowAction,
  GridFetchParams,
  GridFetchResult,
  FreezePanesConfig,
  HighlightConfig,
  HighlightRule,
} from './SuperGrid.types';
export { mergeWithDefaults, DEFAULT_GRID_CONFIG } from './SuperGrid.config';
export { PT_BR_LOCALE, EN_US_LOCALE } from './SuperGrid.i18n';
export type { GridLocale } from './SuperGrid.i18n';
