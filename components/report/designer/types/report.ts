// components/report/designer/types/report.ts

export interface ReportElement {
  id: string;
  type: 'text' | 'table' | 'chart';
  x: number;
  y: number;
  width: number;
  height: number;
  // Add common properties like styles, data source binding
}

export interface TextElement extends ReportElement {
  type: 'text';
  content: string; // Static text or data placeholder
}

export interface TableElement extends ReportElement {
  type: 'table';
  dataSourceId: string;
  columns: Array<{
    field: string;
    label: string;
    // Add column-specific properties
  }>;
  // Add table-specific properties like pagination, sorting
}

export interface ChartElement extends ReportElement {
  type: 'chart';
  dataSourceId: string;
  chartType: 'bar' | 'line' | 'pie';
  // Add chart-specific properties
}

export interface DataSource {
  id: string;
  name: string;
  type: 'sample' | 'api' | 'database';
  // Add connection details or data here for sample type
  data?: any[];
}

export interface Filter {
  id: string;
  dataSourceId: string;
  field: string;
  operator: string; // e.g., '=', '>', '<', 'contains'
  value: any;
}

export interface Report {
  id: string;
  name: string;
  elements: ReportElement[];
  dataSources: DataSource[];
  filters: Filter[];
  styles: any; // Define a more specific style type later
}