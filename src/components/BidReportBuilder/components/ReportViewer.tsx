// src/components/BidReportBuilder/components/ReportViewer.tsx
/**
 * @fileoverview Visualizador de relatórios com suporte a paginação, zoom,
 * parâmetros dinâmicos e drill-down.
 */

'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Printer,
  RefreshCw,
  Search,
  Filter,
  Maximize2,
  Minimize2,
  Table,
  FileText,
  Loader2,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';

import type { 
  ReportDefinition, 
  ViewerState, 
  ExportFormat, 
  ReportParameter,
  TableConfig,
} from '@/types/report-builder.types';

// ============================================================================
// TYPES
// ============================================================================

interface ReportViewerProps {
  definition: ReportDefinition;
  data?: { rows: Record<string, unknown>[]; totalCount: number };
  parameters?: ReportParameter[];
  onParameterChange?: (params: Record<string, unknown>) => void;
  onExport?: (format: ExportFormat) => void;
  onDrillDown?: (field: string, value: unknown, rowData: Record<string, unknown>) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ReportViewer({
  definition,
  data,
  parameters = [],
  onParameterChange,
  onExport,
  onDrillDown,
  onRefresh,
  isLoading = false,
  error = null,
  className,
}: ReportViewerProps) {
  
  // State
  const [viewerState, setViewerState] = useState<ViewerState>({
    zoom: 100,
    currentPage: 1,
    pageSize: 50,
    searchTerm: '',
    selectedRows: [],
    visibleColumns: [],
    sortColumn: undefined,
    sortDirection: 'asc',
    parameterValues: {},
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isParametersOpen, setIsParametersOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const tableConfig = useMemo(() => {
    const tableElement = definition.elements.find(el => el.type === 'table');
    return tableElement?.properties?.tableConfig as TableConfig | undefined;
  }, [definition]);

  const columns = useMemo(() => {
    if (tableConfig?.columns) {
      return tableConfig.columns.map(col => ({
        field: col.fieldBinding,
        header: col.header,
        width: col.width,
        format: col.format,
        sortable: true,
        drillDown: col.drillDown,
      }));
    }
    
    // Fallback: inferir colunas dos dados
    if (data?.rows?.[0]) {
      return Object.keys(data.rows[0]).map(key => ({
        field: key,
        header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        sortable: true,
        width: 'auto',
        drillDown: undefined,
        format: undefined,
      }));
    }
    
    return [];
  }, [tableConfig, data]);

  const filteredData = useMemo(() => {
    if (!data?.rows) return [];
    
    let result = [...data.rows];
    
    // Apply search filter
    if (viewerState.searchTerm) {
      const searchLower = viewerState.searchTerm.toLowerCase();
      result = result.filter(row => 
        Object.values(row).some(value => 
          String(value).toLowerCase().includes(searchLower)
        )
      );
    }
    
    // Apply sorting
    if (viewerState.sortColumn) {
      result.sort((a, b) => {
        const aVal = a[viewerState.sortColumn!];
        const bVal = b[viewerState.sortColumn!];
        
        if (aVal === bVal) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        
        const aStr = String(aVal);
        const bStr = String(bVal);
        const comparison = aStr < bStr ? -1 : 1;
        return viewerState.sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    return result;
  }, [data, viewerState.searchTerm, viewerState.sortColumn, viewerState.sortDirection]);

  const paginatedData = useMemo(() => {
    const start = (viewerState.currentPage - 1) * viewerState.pageSize;
    const end = start + viewerState.pageSize;
    return filteredData.slice(start, end);
  }, [filteredData, viewerState.currentPage, viewerState.pageSize]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredData.length / viewerState.pageSize);
  }, [filteredData.length, viewerState.pageSize]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleZoomIn = useCallback(() => {
    setViewerState(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom + 10, 200),
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setViewerState(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom - 10, 50),
    }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setViewerState(prev => ({
      ...prev,
      currentPage: Math.max(1, Math.min(page, totalPages)),
    }));
  }, [totalPages]);

  const handleSort = useCallback((column: string) => {
    setViewerState(prev => ({
      ...prev,
      sortColumn: column,
      sortDirection: prev.sortColumn === column && prev.sortDirection === 'asc' ? 'desc' : 'asc',
      currentPage: 1,
    }));
  }, []);

  const handleSearch = useCallback((text: string) => {
    setViewerState(prev => ({
      ...prev,
      searchTerm: text,
      currentPage: 1,
    }));
  }, []);

  const handleCellClick = useCallback((column: typeof columns[0], value: unknown, row: Record<string, unknown>) => {
    if (column.drillDown && onDrillDown) {
      onDrillDown(column.field, value, row);
    }
  }, [onDrillDown]);

  const handleExport = useCallback((format: ExportFormat) => {
    onExport?.(format);
  }, [onExport]);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen && containerRef.current) {
      containerRef.current.requestFullscreen?.();
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const handleParameterSubmit = useCallback((params: Record<string, unknown>) => {
    setViewerState(prev => ({
      ...prev,
      parameterValues: params,
      currentPage: 1,
    }));
    onParameterChange?.(params);
    setIsParametersOpen(false);
  }, [onParameterChange]);

  // ============================================================================
  // FORMAT HELPERS
  // ============================================================================

  const formatCellValue = useCallback((value: unknown, format?: string): string => {
    if (value === null || value === undefined) return '-';
    
    // Date formatting
    if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        if (format === 'datetime') return date.toLocaleString('pt-BR');
        if (format === 'time') return date.toLocaleTimeString('pt-BR');
        return date.toLocaleDateString('pt-BR');
      }
    }
    
    // Number formatting
    if (typeof value === 'number') {
      if (format === 'currency') {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
      }
      if (format === 'percent') {
        return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2 }).format(value / 100);
      }
      if (format === 'decimal') {
        return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(value);
      }
    }
    
    // Boolean
    if (typeof value === 'boolean') {
      return value ? 'Sim' : 'Não';
    }
    
    return String(value);
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  const renderToolbar = () => (
    <div className="flex items-center justify-between gap-4 px-4 py-3 border-b bg-card">
      {/* Left: Search & Filters */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={viewerState.searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8 w-64"
          />
        </div>
        
        {parameters.length > 0 && (
          <Sheet open={isParametersOpen} onOpenChange={setIsParametersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Parâmetros
                {Object.keys(viewerState.parameterValues).length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {Object.keys(viewerState.parameterValues).length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Parâmetros do Relatório</SheetTitle>
                <SheetDescription>
                  Configure os filtros para gerar o relatório.
                </SheetDescription>
              </SheetHeader>
              <ParametersPanel 
                parameters={parameters}
                values={viewerState.parameterValues}
                onSubmit={handleParameterSubmit}
              />
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Center: Pagination */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(viewerState.currentPage - 1)}
          disabled={viewerState.currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <span className="text-sm text-muted-foreground min-w-[100px] text-center">
          Página {viewerState.currentPage} de {totalPages || 1}
        </span>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(viewerState.currentPage + 1)}
          disabled={viewerState.currentPage >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 border rounded-md">
          <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={viewerState.zoom <= 50}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs min-w-[40px] text-center">{viewerState.zoom}%</span>
          <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={viewerState.zoom >= 200}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <Button variant="ghost" size="icon" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport('PDF')}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('XLSX')}>
              <Table className="h-4 w-4 mr-2" />
              Excel (XLSX)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('CSV')}>
              <FileText className="h-4 w-4 mr-2" />
              CSV
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleExport('HTML')}>
              <FileText className="h-4 w-4 mr-2" />
              HTML
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );

  const renderTable = () => (
    <div 
      className="overflow-auto"
      style={{ transform: `scale(${viewerState.zoom / 100})`, transformOrigin: 'top left' }}
    >
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-muted/50">
            {columns.map((col) => (
              <th
                key={col.field}
                className="px-4 py-3 text-left text-sm font-medium text-foreground border-b cursor-pointer hover:bg-muted/70 transition-colors"
                style={{ width: col.width }}
                onClick={() => col.sortable && handleSort(col.field)}
              >
                <div className="flex items-center gap-2">
                  {col.header}
                  {viewerState.sortColumn === col.field && (
                    <span className="text-xs">
                      {viewerState.sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              className="border-b hover:bg-muted/30 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col.field}
                  className={`px-4 py-3 text-sm ${col.drillDown ? 'text-primary cursor-pointer hover:underline' : ''}`}
                  onClick={() => col.drillDown && handleCellClick(col, row[col.field], row)}
                >
                  {formatCellValue(row[col.field], col.format)}
                </td>
              ))}
            </tr>
          ))}
          {paginatedData.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                Nenhum registro encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderSummary = () => (
    <div className="px-4 py-3 border-t bg-muted/30 flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Exibindo {paginatedData.length} de {filteredData.length} registros
        {filteredData.length !== (data?.totalCount ?? 0) && ` (filtrado de ${data?.totalCount})`}
      </span>
      <Select
        value={String(viewerState.pageSize)}
        onValueChange={(value) => setViewerState(prev => ({ ...prev, pageSize: parseInt(value), currentPage: 1 }))}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="25">25 por página</SelectItem>
          <SelectItem value="50">50 por página</SelectItem>
          <SelectItem value="100">100 por página</SelectItem>
          <SelectItem value="200">200 por página</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  // Loading state
  if (isLoading && !data) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando relatório...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex justify-center mt-4">
            <Button onClick={onRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card ref={containerRef} className={`flex flex-col ${className}`}>
      {renderToolbar()}
      <ScrollArea className="flex-1">
        {renderTable()}
      </ScrollArea>
      {renderSummary()}
    </Card>
  );
}

// ============================================================================
// PARAMETERS PANEL SUB-COMPONENT
// ============================================================================

interface ParametersPanelProps {
  parameters: ReportParameter[];
  values: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void;
}

function ParametersPanel({ parameters, values, onSubmit }: ParametersPanelProps) {
  const [localValues, setLocalValues] = useState<Record<string, unknown>>(values);

  const handleChange = (name: string, value: unknown) => {
    setLocalValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(localValues);
  };

  const handleClear = () => {
    const clearedValues: Record<string, unknown> = {};
    parameters.forEach(param => {
      clearedValues[param.name] = param.defaultValue ?? '';
    });
    setLocalValues(clearedValues);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {parameters.map((param) => (
        <div key={param.name} className="space-y-2">
          <Label htmlFor={param.name}>
            {param.label}
            {param.isRequired && <span className="text-destructive ml-1">*</span>}
          </Label>
          
          {param.type === 'TEXT' && (
            <Input
              id={param.name}
              value={String(localValues[param.name] ?? param.defaultValue ?? '')}
              onChange={(e) => handleChange(param.name, e.target.value)}
              placeholder={param.label}
              required={param.isRequired}
            />
          )}

          {param.type === 'NUMBER' && (
            <Input
              id={param.name}
              type="number"
              value={String(localValues[param.name] ?? param.defaultValue ?? '')}
              onChange={(e) => handleChange(param.name, e.target.valueAsNumber)}
              placeholder={param.label}
              required={param.isRequired}
            />
          )}

          {param.type === 'DATE' && (
            <Input
              id={param.name}
              type="date"
              value={String(localValues[param.name] ?? param.defaultValue ?? '')}
              onChange={(e) => handleChange(param.name, e.target.value)}
              required={param.isRequired}
            />
          )}

          {param.type === 'BOOLEAN' && (
            <Select
              value={String(localValues[param.name] ?? param.defaultValue ?? '')}
              onValueChange={(v) => handleChange(param.name, v === 'true')}
            >
              <SelectTrigger id={param.name}>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Sim</SelectItem>
                <SelectItem value="false">Não</SelectItem>
              </SelectContent>
            </Select>
          )}

          {param.type === 'SELECT' && param.options && (
            <Select
              value={String(localValues[param.name] ?? param.defaultValue ?? '')}
              onValueChange={(v) => handleChange(param.name, v)}
            >
              <SelectTrigger id={param.name}>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {param.options.map((opt) => (
                  <SelectItem key={String(opt.value)} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {param.helpText && (
            <p className="text-xs text-muted-foreground">{param.helpText}</p>
          )}
        </div>
      ))}

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          Aplicar
        </Button>
        <Button type="button" variant="outline" onClick={handleClear}>
          Limpar
        </Button>
      </div>
    </form>
  );
}

export default ReportViewer;
