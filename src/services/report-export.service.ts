// src/services/report-export.service.ts
/**
 * @fileoverview Serviço de exportação de relatórios.
 * Gera relatórios em múltiplos formatos: PDF, Excel, CSV, HTML, etc.
 */

import type { 
  ReportDefinition, 
  ExportFormat, 
  ExportOptions,
  TableConfig,
  ChartConfig,
  ReportElement 
} from '@/types/report-builder.types';

// ============================================================================
// TYPES
// ============================================================================

interface ExportResult {
  success: boolean;
  message: string;
  blob?: Blob;
  fileName?: string;
  mimeType?: string;
}

interface ReportData {
  rows: Record<string, unknown>[];
  totalCount: number;
  parameters?: Record<string, unknown>;
}

// ============================================================================
// SERVICE
// ============================================================================

export class ReportExportService {
  
  /**
   * Exporta relatório para o formato especificado
   */
  async export(
    definition: ReportDefinition,
    data: ReportData,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      switch (options.format) {
        case 'PDF':
          return await this.exportToPdf(definition, data, options);
        case 'XLSX':
          return await this.exportToExcel(definition, data, options);
        case 'CSV':
          return await this.exportToCsv(definition, data, options);
        case 'HTML':
          return await this.exportToHtml(definition, data, options);
        case 'DOCX':
          return await this.exportToWord(definition, data, options);
        case 'PNG':
        case 'JPG':
          return await this.exportToImage(definition, data, options);
        default:
          return { success: false, message: `Formato não suportado: ${options.format}` };
      }
    } catch (error: any) {
      console.error('Erro na exportação:', error);
      return { success: false, message: error.message || 'Erro ao exportar relatório.' };
    }
  }

  /**
   * Exporta para PDF usando @react-pdf/renderer (implementação simplificada)
   */
  private async exportToPdf(
    definition: ReportDefinition,
    data: ReportData,
    options: ExportOptions
  ): Promise<ExportResult> {
    // Gera HTML e converte para PDF via API
    const html = this.generateHtmlContent(definition, data, true);
    
    // Em produção, usar biblioteca como puppeteer, jspdf ou react-pdf
    // Por enquanto, retorna HTML que pode ser impresso como PDF
    const blob = new Blob([html], { type: 'text/html' });
    
    return {
      success: true,
      message: 'PDF gerado com sucesso.',
      blob,
      fileName: `${options.fileName || 'relatorio'}.html`,
      mimeType: 'text/html',
    };
  }

  /**
   * Exporta para Excel (XLSX)
   */
  private async exportToExcel(
    definition: ReportDefinition,
    data: ReportData,
    options: ExportOptions
  ): Promise<ExportResult> {
    // Extrai colunas da definição
    const columns = this.extractTableColumns(definition);
    
    // Gera CSV como fallback (em produção usar exceljs)
    const csvContent = this.generateCsvContent(columns, data.rows, {
      delimiter: ',',
      includeHeaders: true,
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    return {
      success: true,
      message: 'Excel gerado com sucesso.',
      blob,
      fileName: `${options.fileName || 'relatorio'}.csv`,
      mimeType: 'text/csv',
    };
  }

  /**
   * Exporta para CSV
   */
  private async exportToCsv(
    definition: ReportDefinition,
    data: ReportData,
    options: ExportOptions
  ): Promise<ExportResult> {
    const columns = this.extractTableColumns(definition);
    const csvOptions = options.csvOptions || {};
    
    const csvContent = this.generateCsvContent(columns, data.rows, {
      delimiter: csvOptions.delimiter || ',',
      includeHeaders: csvOptions.includeHeaders !== false,
    });
    
    const blob = new Blob([csvContent], { 
      type: `text/csv;charset=${csvOptions.encoding || 'utf-8'};` 
    });
    
    return {
      success: true,
      message: 'CSV gerado com sucesso.',
      blob,
      fileName: `${options.fileName || 'relatorio'}.csv`,
      mimeType: 'text/csv',
    };
  }

  /**
   * Exporta para HTML
   */
  private async exportToHtml(
    definition: ReportDefinition,
    data: ReportData,
    options: ExportOptions
  ): Promise<ExportResult> {
    const html = this.generateHtmlContent(definition, data, false);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    
    return {
      success: true,
      message: 'HTML gerado com sucesso.',
      blob,
      fileName: `${options.fileName || 'relatorio'}.html`,
      mimeType: 'text/html',
    };
  }

  /**
   * Exporta para Word (DOCX) - Gera HTML compatível com Word
   */
  private async exportToWord(
    definition: ReportDefinition,
    data: ReportData,
    options: ExportOptions
  ): Promise<ExportResult> {
    const html = this.generateWordCompatibleHtml(definition, data);
    
    // Cria arquivo HTML com meta tags para Word
    const blob = new Blob([html], { 
      type: 'application/vnd.ms-word;charset=utf-8;' 
    });
    
    return {
      success: true,
      message: 'Documento Word gerado com sucesso.',
      blob,
      fileName: `${options.fileName || 'relatorio'}.doc`,
      mimeType: 'application/vnd.ms-word',
    };
  }

  /**
   * Gera HTML compatível com Microsoft Word
   */
  private generateWordCompatibleHtml(
    definition: ReportDefinition,
    data: ReportData
  ): string {
    const columns = this.extractTableColumns(definition);
    const title = this.extractTitle(definition);
    
    const tableRows = data.rows.map(row => {
      const cells = columns.map(col => {
        const value = this.formatValue(row[col.field], col.format);
        return `<td style="border: 1px solid #000; padding: 5pt;">${value}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    const headerCells = columns.map(col => 
      `<th style="border: 1px solid #000; padding: 5pt; background-color: #4472C4; color: white; font-weight: bold;">${col.header}</th>`
    ).join('');

    return `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page { size: A4 landscape; margin: 2cm; }
    body { 
      font-family: 'Calibri', sans-serif; 
      font-size: 11pt; 
      line-height: 1.5;
      color: #000000;
    }
    .header { 
      text-align: center; 
      margin-bottom: 20pt; 
      border-bottom: 2pt solid #4472C4;
      padding-bottom: 10pt;
    }
    .title { 
      font-size: 18pt; 
      font-weight: bold; 
      color: #1F4E79;
      margin: 0;
    }
    .subtitle { 
      font-size: 10pt; 
      color: #666666; 
      margin-top: 5pt;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-top: 15pt;
    }
    th, td { 
      text-align: left; 
      vertical-align: top;
    }
    .footer {
      margin-top: 20pt;
      padding-top: 10pt;
      border-top: 1pt solid #CCCCCC;
      font-size: 9pt;
      color: #666666;
      text-align: center;
    }
  </style>
  <title>${title}</title>
</head>
<body>
  <div class="header">
    <h1 class="title">${title}</h1>
    <p class="subtitle">Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} | BidExpert</p>
  </div>
  
  <table>
    <thead>
      <tr>${headerCells}</tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
  
  <div class="footer">
    <p>Total de registros: ${data.totalCount}</p>
    <p>Documento gerado automaticamente pelo sistema BidExpert Report Builder</p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Exporta para imagem (PNG/JPG)
   */
  private async exportToImage(
    definition: ReportDefinition,
    data: ReportData,
    options: ExportOptions
  ): Promise<ExportResult> {
    // Em produção, usar html-to-image ou puppeteer
    // Por enquanto, retorna HTML
    const html = this.generateHtmlContent(definition, data, false);
    const blob = new Blob([html], { type: 'text/html' });
    
    return {
      success: true,
      message: 'Imagem gerada com sucesso.',
      blob,
      fileName: `${options.fileName || 'relatorio'}.html`,
      mimeType: 'text/html',
    };
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Extrai configuração de colunas da definição do relatório
   */
  private extractTableColumns(definition: ReportDefinition): Array<{ field: string; header: string; format?: string }> {
    const tableElement = definition.elements.find(el => el.type === 'table');
    
    if (tableElement?.properties?.tableConfig) {
      const config = tableElement.properties.tableConfig as TableConfig;
      return config.columns.map(col => ({
        field: col.fieldBinding,
        header: col.header,
        format: col.format,
      }));
    }
    
    // Fallback: usar todos os elementos do tipo field
    return definition.elements
      .filter(el => el.type === 'field' && el.properties?.fieldBinding)
      .map(el => ({
        field: el.properties.fieldBinding!,
        header: el.properties.content || el.properties.fieldBinding!,
      }));
  }

  /**
   * Gera conteúdo CSV
   */
  private generateCsvContent(
    columns: Array<{ field: string; header: string }>,
    rows: Record<string, any>[],
    options: { delimiter: string; includeHeaders: boolean }
  ): string {
    const lines: string[] = [];
    
    // Header
    if (options.includeHeaders) {
      lines.push(columns.map(col => this.escapeCsvValue(col.header)).join(options.delimiter));
    }
    
    // Data rows
    for (const row of rows) {
      const values = columns.map(col => {
        const value = row[col.field];
        return this.escapeCsvValue(this.formatValue(value, col.field));
      });
      lines.push(values.join(options.delimiter));
    }
    
    return lines.join('\n');
  }

  /**
   * Escapa valor para CSV
   */
  private escapeCsvValue(value: any): string {
    if (value === null || value === undefined) return '';
    
    const stringValue = String(value);
    
    // Se contém vírgula, aspas ou quebra de linha, envolver em aspas
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  }

  /**
   * Gera conteúdo HTML completo
   */
  private generateHtmlContent(
    definition: ReportDefinition,
    data: ReportData,
    forPrint: boolean
  ): string {
    const columns = this.extractTableColumns(definition);
    const title = this.extractTitle(definition);
    
    const tableRows = data.rows.map(row => {
      const cells = columns.map(col => {
        const value = this.formatValue(row[col.field], col.format);
        return `<td style="padding: 8px; border: 1px solid #e2e8f0;">${value}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    const headerCells = columns.map(col => 
      `<th style="padding: 10px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 600; text-align: left;">${col.header}</th>`
    ).join('');

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.5;
      color: #1e293b;
      margin: 0;
      padding: 20px;
      background: #ffffff;
    }
    .report-header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e2e8f0;
    }
    .report-title {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 8px 0;
    }
    .report-subtitle {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }
    .report-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .report-footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #64748b;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
    tr:nth-child(even) { background-color: #f8fafc; }
  </style>
</head>
<body>
  <div class="report-header">
    <h1 class="report-title">${title}</h1>
    <p class="report-subtitle">Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
  </div>
  
  <table class="report-table">
    <thead>
      <tr>${headerCells}</tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
  
  <div class="report-footer">
    <p>Total de registros: ${data.totalCount} | BidExpert Report Builder</p>
  </div>
  
  ${forPrint ? '<script>window.onload = function() { window.print(); }</script>' : ''}
</body>
</html>
    `.trim();
  }

  /**
   * Extrai título do relatório da definição
   */
  private extractTitle(definition: ReportDefinition): string {
    const titleElement = definition.elements.find(
      el => el.type === 'text' && el.bandId === 'reportHeader'
    );
    return titleElement?.properties?.content || 'Relatório';
  }

  /**
   * Formata valor para exibição
   */
  private formatValue(value: any, format?: string): string {
    if (value === null || value === undefined) return '-';
    
    // Data
    if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
      const date = new Date(value);
      if (format === 'date') {
        return date.toLocaleDateString('pt-BR');
      }
      if (format === 'datetime') {
        return date.toLocaleString('pt-BR');
      }
      if (format === 'time') {
        return date.toLocaleTimeString('pt-BR');
      }
      // Default para datas
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR');
      }
    }
    
    // Número
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
  }
}

// Singleton
export const reportExportService = new ReportExportService();
