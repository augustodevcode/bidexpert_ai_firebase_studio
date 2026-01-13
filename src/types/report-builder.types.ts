// src/types/report-builder.types.ts
/**
 * @fileoverview Tipos TypeScript para o módulo de Report Builder.
 * Define interfaces e tipos para criação, edição e visualização de relatórios.
 */

// ============================================================================
// ENUMS
// ============================================================================

export type ReportType = 
  | 'TABLE'
  | 'MASTER_DETAIL'
  | 'CROSS_TAB'
  | 'FORM'
  | 'CHART'
  | 'LABEL'
  | 'LETTER'
  | 'INVOICE'
  | 'DASHBOARD'
  | 'HIERARCHICAL';

export type ParameterType = 
  | 'TEXT'
  | 'NUMBER'
  | 'DATE'
  | 'DATE_RANGE'
  | 'BOOLEAN'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'CASCADE'
  | 'ENTITY';

export type ElementType = 
  | 'text'
  | 'field'
  | 'image'
  | 'shape'
  | 'table'
  | 'chart'
  | 'barcode'
  | 'qrcode'
  | 'subreport'
  | 'richtext'
  | 'checkbox'
  | 'signature'
  | 'line'
  | 'rectangle'
  | 'ellipse';

export type BandType = 
  | 'reportHeader'
  | 'pageHeader'
  | 'groupHeader'
  | 'detail'
  | 'groupFooter'
  | 'pageFooter'
  | 'reportFooter';

export type ExportFormat = 'PDF' | 'XLSX' | 'DOCX' | 'CSV' | 'HTML' | 'PNG' | 'JPG';

export type ChartType = 
  | 'bar'
  | 'line'
  | 'pie'
  | 'doughnut'
  | 'area'
  | 'scatter'
  | 'radar'
  | 'gauge';

export type AggregationType = 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'FIRST' | 'LAST';

// ============================================================================
// INTERFACES - ESTRUTURA DO RELATÓRIO
// ============================================================================

export interface ReportDefinition {
  id?: string;
  version: string;
  reportType?: ReportType;
  dataSource?: string;
  pageSize?: 'A4' | 'Letter' | 'Legal' | 'Custom';
  orientation?: 'portrait' | 'landscape';
  margins?: PageMargins;
  layout?: {
    pageSize: 'A4' | 'Letter' | 'Legal' | 'Custom';
    orientation: 'portrait' | 'landscape';
    margins: PageMargins;
  };
  bands?: ReportBands | ReportBand[];
  elements: ReportElement[];
  styles?: Record<string, any>;
  parameters?: ReportParameter[];
  calculatedFields?: CalculatedField[];
  groupings?: Grouping[];
  sorting?: SortField[];
  filters?: FilterCondition[];
  scripts?: ReportScript[];
  watermark?: WatermarkConfig;
  theme?: ReportTheme;
}

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ReportBands {
  reportHeader?: Band;
  pageHeader?: Band;
  groupHeaders?: GroupBand[];
  detail: Band;
  groupFooters?: GroupBand[];
  pageFooter?: Band;
  reportFooter?: Band;
}

export interface Band {
  id: string;
  type?: string;
  height: number;
  backgroundColor?: string;
  visible?: boolean;
  printCondition?: string;
  keepTogether?: boolean;
}

export type ReportBand = Band;

export interface GroupBand extends Band {
  groupField: string;
  groupExpression?: string;
  sortOrder: 'asc' | 'desc';
  repeatHeader?: boolean;
  startNewPage?: boolean;
}

// ============================================================================
// INTERFACES - ELEMENTOS
// ============================================================================

export interface ReportElement {
  id: string;
  type: ElementType;
  bandId: string;
  position: Position;
  size: Size;
  properties: ElementProperties;
  conditionalFormatting?: ConditionalFormat[];
  interactivity?: InteractivityConfig;
}

export interface Position {
  x: number;
  y: number;
  anchor?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}

export interface Size {
  width: number;
  height: number;
  growMode?: 'none' | 'vertical' | 'horizontal' | 'both';
  minHeight?: number;
  maxHeight?: number;
}

export interface ElementProperties {
  // Texto e conteúdo
  content?: string;
  fieldBinding?: string;
  expression?: string;
  format?: string;
  
  // Estilo de fonte
  font?: FontStyle;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  wordWrap?: boolean;
  
  // Bordas e fundo
  borders?: BorderStyle;
  background?: string;
  backgroundImage?: string;
  
  // Visibilidade
  visible?: boolean;
  visibility?: string; // Expressão condicional
  
  // Específicos por tipo
  imageUrl?: string;
  imageScaleMode?: 'none' | 'fill' | 'fit' | 'stretch';
  chartConfig?: ChartConfig;
  tableConfig?: TableConfig;
  barcodeConfig?: BarcodeConfig;
  shapeConfig?: ShapeConfig;
  subreportConfig?: SubreportConfig;
}

export interface FontStyle {
  family: string;
  size: number;
  weight?: 'normal' | 'bold' | number;
  style?: 'normal' | 'italic';
  underline?: boolean;
  strikethrough?: boolean;
  color?: string;
}

export interface BorderStyle {
  top?: BorderSide;
  right?: BorderSide;
  bottom?: BorderSide;
  left?: BorderSide;
  all?: BorderSide;
  radius?: number;
}

export interface BorderSide {
  width: number;
  style: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
  color: string;
}

export interface ConditionalFormat {
  id: string;
  condition: string;
  style: Partial<ElementProperties>;
  priority: number;
}

export interface InteractivityConfig {
  drillDown?: {
    enabled: boolean;
    targetField: string;
  };
  drillThrough?: {
    enabled: boolean;
    targetReportId: string;
    parameters?: Record<string, string>;
  };
  sortable?: boolean;
  tooltip?: string;
  hyperlink?: string;
}

// ============================================================================
// INTERFACES - GRÁFICOS
// ============================================================================

export interface ChartConfig {
  type: ChartType;
  title?: string;
  subtitle?: string;
  legend?: LegendConfig;
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  series: ChartSeries[];
  colors?: string[];
  animate?: boolean;
  showDataLabels?: boolean;
  showGrid?: boolean;
}

export interface LegendConfig {
  visible: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export interface AxisConfig {
  title?: string;
  labelFormat?: string;
  min?: number;
  max?: number;
  gridLines?: boolean;
}

export interface ChartSeries {
  name: string;
  valueField: string;
  labelField?: string;
  color?: string;
  type?: ChartType; // Para gráficos mistos
}

// ============================================================================
// INTERFACES - TABELAS
// ============================================================================

export interface TableConfig {
  columns: TableColumn[];
  showHeader?: boolean;
  showFooter?: boolean;
  alternateRowColors?: boolean;
  alternateRowColor?: string;
  showGridLines?: boolean;
  headerStyle?: Partial<FontStyle>;
  footerStyle?: Partial<FontStyle>;
  cellPadding?: number;
  borderCollapse?: boolean;
}

export interface TableColumn {
  id: string;
  fieldBinding: string;
  header: string;
  width: number | 'auto' | string; // número, 'auto', ou '20%'
  format?: string;
  alignment?: 'left' | 'center' | 'right';
  sortable?: boolean;
  aggregation?: AggregationType;
  visible?: boolean;
  style?: Partial<ElementProperties>;
  drillDown?: unknown;
}

// ============================================================================
// INTERFACES - OUTROS ELEMENTOS
// ============================================================================

export interface BarcodeConfig {
  type: 'code128' | 'code39' | 'ean13' | 'ean8' | 'upc' | 'qr';
  value: string;
  showText?: boolean;
  height?: number;
  moduleWidth?: number;
}

export interface ShapeConfig {
  shapeType: 'rectangle' | 'ellipse' | 'line' | 'arrow';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  startPoint?: Position;
  endPoint?: Position;
}

export interface SubreportConfig {
  reportId: string;
  parameters?: Record<string, string>;
  connectionMode?: 'inherit' | 'custom';
}

export interface WatermarkConfig {
  type: 'text' | 'image';
  content: string;
  opacity: number;
  position: 'center' | 'diagonal' | 'tile';
  fontSize?: number;
  color?: string;
}

// ============================================================================
// INTERFACES - CAMPOS E DADOS
// ============================================================================

export interface CalculatedField {
  id: string;
  name: string;
  expression: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  format?: string;
}

export interface Grouping {
  id: string;
  field: string;
  sortOrder: 'asc' | 'desc';
  pageBreakBefore?: boolean;
  pageBreakAfter?: boolean;
  keepTogether?: boolean;
}

export interface SortField {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: unknown;
  logicalOperator?: 'AND' | 'OR';
}

export type FilterOperator = 
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'lessThan'
  | 'lessThanOrEqual'
  | 'between'
  | 'in'
  | 'notIn'
  | 'isNull'
  | 'isNotNull';

// ============================================================================
// INTERFACES - SCRIPTS
// ============================================================================

export interface ReportScript {
  id: string;
  name: string;
  event: ScriptEvent;
  code: string;
  enabled: boolean;
}

export type ScriptEvent = 
  | 'beforeRender'
  | 'afterRender'
  | 'beforePrint'
  | 'beforeExport'
  | 'onDataBound'
  | 'onRowCreated'
  | 'onClick';

// ============================================================================
// INTERFACES - PARÂMETROS
// ============================================================================

export interface ReportParameter {
  id: string;
  name: string;
  label: string;
  type: ParameterType;
  defaultValue?: unknown;
  isRequired: boolean;
  isMultiple: boolean;
  isVisible: boolean;
  sortOrder: number;
  helpText?: string;
  
  // Para SELECT e MULTI_SELECT
  options?: ParameterOption[];
  dataSourceQuery?: string;
  
  // Para CASCADE
  cascadeFrom?: string;
  cascadeField?: string;
  
  // Para DATE_RANGE
  minDate?: string;
  maxDate?: string;
  
  // Para NUMBER
  minValue?: number;
  maxValue?: number;
  step?: number;
  
  // Validação
  validationRules?: ValidationRule[];
}

export interface ParameterOption {
  value: unknown;
  label: string;
  disabled?: boolean;
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
}

// ============================================================================
// INTERFACES - TEMA
// ============================================================================

export interface ReportTheme {
  id: string;
  name: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  spacing: ThemeSpacing;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  headerBackground?: string;
  footerBackground?: string;
  alternateRow?: string;
}

export interface ThemeFonts {
  heading: FontStyle;
  body: FontStyle;
  caption: FontStyle;
  monospace: FontStyle;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

// ============================================================================
// INTERFACES - WIZARD
// ============================================================================

export interface WizardState {
  currentStep: number;
  totalSteps: number;
  data: WizardData;
  isValid: boolean;
  errors: Record<string, string>;
}

export interface WizardData {
  // Step 1 - Informações básicas
  name: string;
  description?: string;
  dataSource: string;
  icon?: string;
  category?: string;
  
  // Step 2 - Tipo de layout
  reportType: ReportType;
  
  // Step 3 - Seleção de campos
  selectedFields: SelectedField[];
  groupings?: Grouping[];
  
  // Step 4 - Tema e cabeçalho
  theme: string;
  title: string;
  subtitle?: string;
  logoUrl?: string;
  pageSize: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
}

export interface SelectedField {
  fieldName: string;
  label: string;
  format?: string;
  width?: number;
  sortOrder: number;
  visible: boolean;
  aggregation?: AggregationType;
}

// ============================================================================
// INTERFACES - VIEWER
// ============================================================================

export interface ViewerState {
  currentPage: number;
  totalPages: number;
  zoom: number;
  viewMode: 'single' | 'continuous' | 'thumbnails';
  isLoading: boolean;
  searchTerm?: string;
  searchResults?: SearchResult[];
  selectedParameters: Record<string, unknown>;
  pageSize?: number;
  selectedRows?: unknown[];
  visibleColumns?: string[];
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  parameterValues?: Record<string, unknown>;
}

export interface SearchResult {
  page: number;
  elementId: string;
  text: string;
  position: Position;
}

// ============================================================================
// INTERFACES - DATA SOURCES
// ============================================================================

export interface DataSourceConfig {
  id: string;
  name: string;
  type: 'prisma' | 'api' | 'json' | 'csv' | 'custom';
  config: PrismaDataSourceConfig | ApiDataSourceConfig | FileDataSourceConfig;
}

export interface PrismaDataSourceConfig {
  modelName: string;
  fields: DataSourceField[];
  relations?: DataSourceRelation[];
}

export interface ApiDataSourceConfig {
  endpoint: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  bodyTemplate?: string;
}

export interface FileDataSourceConfig {
  fileType: 'json' | 'csv' | 'xml';
  filePath?: string;
  delimiter?: string;
}

export interface DataSourceField {
  name: string;
  type: string;
  label: string;
  format?: string;
  isKey?: boolean;
  isSortable?: boolean;
  isFilterable?: boolean;
}

export interface DataSourceRelation {
  name: string;
  targetModel: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  foreignKey: string;
}

// ============================================================================
// INTERFACES - PREDEFINED REPORTS
// ============================================================================

export interface PredefinedReportConfig {
  code: string;
  name: string;
  description?: string;
  category: string;
  module?: string;
  type: ReportType;
  definition: ReportDefinition;
  dataSource: string;
  queryConfig?: QueryConfig;
  parameters?: ReportParameter[];
  theme?: ReportTheme;
  scripts?: ReportScript[];
  iconName?: string;
  sortOrder: number;
  tenantId?: string | null; // null = global
}

export interface QueryConfig {
  select?: string[];
  where?: FilterCondition[];
  orderBy?: SortField[];
  groupBy?: string[];
  having?: FilterCondition[];
  limit?: number;
  offset?: number;
  include?: string[];
}

// ============================================================================
// INTERFACES - EXPORT
// ============================================================================

export interface ExportOptions {
  format: ExportFormat;
  fileName?: string;
  pageRange?: { start: number; end: number };
  includeHeader?: boolean;
  includeFooter?: boolean;
  quality?: 'low' | 'medium' | 'high';
  
  // PDF específico
  pdfOptions?: {
    embedFonts?: boolean;
    compress?: boolean;
    pdfACompliant?: boolean;
    digitalSignature?: DigitalSignatureConfig;
  };
  
  // Excel específico
  excelOptions?: {
    includeFormulas?: boolean;
    freezeHeader?: boolean;
    autoFitColumns?: boolean;
    sheetName?: string;
  };
  
  // CSV específico
  csvOptions?: {
    delimiter?: string;
    includeHeaders?: boolean;
    encoding?: string;
  };
}

export interface DigitalSignatureConfig {
  enabled: boolean;
  certificate?: string;
  reason?: string;
  location?: string;
}

// ============================================================================
// INTERFACES - SCHEDULE
// ============================================================================

export interface ReportScheduleConfig {
  id?: string;
  reportId: string;
  name: string;
  cronExpression: string;
  format: ExportFormat;
  recipients: string[];
  parameters?: Record<string, any>;
  isActive: boolean;
  emailSubject?: string;
  emailBody?: string;
}

// ============================================================================
// INTERFACES - PERMISSIONS
// ============================================================================

export interface ReportPermissions {
  view: string[];
  edit: string[];
  delete: string[];
  export: string[];
  share: string[];
  schedule: string[];
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isTableConfig(config: unknown): config is TableConfig {
  return config != null && Array.isArray((config as any).columns);
}

export function isChartConfig(config: unknown): config is ChartConfig {
  return config != null && typeof (config as any).type === 'string' && Array.isArray((config as any).series);
}

export function isBarcodeConfig(config: unknown): config is BarcodeConfig {
  return config != null && typeof (config as any).type === 'string' && typeof (config as any).value === 'string';
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  TABLE: 'Tabela',
  MASTER_DETAIL: 'Mestre-Detalhe',
  CROSS_TAB: 'Tabela Dinâmica',
  FORM: 'Formulário',
  CHART: 'Gráfico',
  LABEL: 'Etiquetas',
  LETTER: 'Carta',
  INVOICE: 'Fatura',
  DASHBOARD: 'Dashboard',
  HIERARCHICAL: 'Hierárquico',
};

export const PARAMETER_TYPE_LABELS: Record<ParameterType, string> = {
  TEXT: 'Texto',
  NUMBER: 'Número',
  DATE: 'Data',
  DATE_RANGE: 'Período',
  BOOLEAN: 'Sim/Não',
  SELECT: 'Lista',
  MULTI_SELECT: 'Lista Múltipla',
  CASCADE: 'Lista Cascata',
  ENTITY: 'Entidade',
};

export const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  PDF: 'PDF',
  XLSX: 'Excel',
  DOCX: 'Word',
  CSV: 'CSV',
  HTML: 'HTML',
  PNG: 'Imagem PNG',
  JPG: 'Imagem JPG',
};

export const DEFAULT_THEME: ReportTheme = {
  id: 'default',
  name: 'Padrão',
  colors: {
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#f59e0b',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    headerBackground: '#1e40af',
    footerBackground: '#f1f5f9',
    alternateRow: '#f8fafc',
  },
  fonts: {
    heading: { family: 'Inter', size: 16, weight: 'bold', color: '#1e293b' },
    body: { family: 'Inter', size: 12, weight: 'normal', color: '#1e293b' },
    caption: { family: 'Inter', size: 10, weight: 'normal', color: '#64748b' },
    monospace: { family: 'JetBrains Mono', size: 11, weight: 'normal', color: '#1e293b' },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

export const AVAILABLE_THEMES: ReportTheme[] = [
  DEFAULT_THEME,
  {
    id: 'professional',
    name: 'Profissional',
    colors: {
      primary: '#0f172a',
      secondary: '#475569',
      accent: '#3b82f6',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      textMuted: '#475569',
      border: '#cbd5e1',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      headerBackground: '#0f172a',
      footerBackground: '#f1f5f9',
      alternateRow: '#f8fafc',
    },
    fonts: {
      heading: { family: 'Inter', size: 16, weight: 'bold', color: '#0f172a' },
      body: { family: 'Inter', size: 12, weight: 'normal', color: '#0f172a' },
      caption: { family: 'Inter', size: 10, weight: 'normal', color: '#475569' },
      monospace: { family: 'JetBrains Mono', size: 11, weight: 'normal', color: '#0f172a' },
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  },
  {
    id: 'modern',
    name: 'Moderno',
    colors: {
      primary: '#7c3aed',
      secondary: '#a78bfa',
      accent: '#f472b6',
      background: '#ffffff',
      surface: '#faf5ff',
      text: '#1e1b4b',
      textMuted: '#6b7280',
      border: '#e9d5ff',
      success: '#10b981',
      warning: '#fbbf24',
      error: '#f43f5e',
      headerBackground: '#7c3aed',
      footerBackground: '#faf5ff',
      alternateRow: '#faf5ff',
    },
    fonts: {
      heading: { family: 'Poppins', size: 16, weight: 600, color: '#1e1b4b' },
      body: { family: 'Poppins', size: 12, weight: 'normal', color: '#1e1b4b' },
      caption: { family: 'Poppins', size: 10, weight: 'normal', color: '#6b7280' },
      monospace: { family: 'Fira Code', size: 11, weight: 'normal', color: '#1e1b4b' },
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  },
];
