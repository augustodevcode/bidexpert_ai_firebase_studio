// src/services/ai-report.service.ts
/**
 * @fileoverview Serviço de IA para relatórios.
 * Fornece funcionalidades de summarização, tradução e geração automática.
 */

import type { ReportDefinition, ReportElement } from '@/types/report-builder.types';

// ============================================================================
// TYPES
// ============================================================================

interface AISummaryResult {
  success: boolean;
  message: string;
  summary?: string;
  keyInsights?: string[];
}

interface AITranslationResult {
  success: boolean;
  message: string;
  translatedText?: string;
  targetLanguage?: string;
}

interface AIGenerationResult {
  success: boolean;
  message: string;
  definition?: ReportDefinition;
  suggestions?: string[];
}

interface DataRow {
  [key: string]: unknown;
}

// ============================================================================
// SERVICE
// ============================================================================

export class AIReportService {
  
  /**
   * Gera um resumo executivo dos dados do relatório
   */
  async summarizeReport(
    data: DataRow[],
    options?: {
      maxLength?: number;
      language?: string;
      focusAreas?: string[];
    }
  ): Promise<AISummaryResult> {
    try {
      // Análise estatística básica dos dados
      const statistics = this.analyzeData(data);
      const keyInsights = this.generateInsights(data, statistics);
      
      // Gera resumo baseado nos insights
      const summary = this.formatSummary(statistics, keyInsights, options?.language);
      
      return {
        success: true,
        message: 'Resumo gerado com sucesso.',
        summary,
        keyInsights,
      };
    } catch (error: any) {
      console.error('Erro ao gerar resumo:', error);
      return {
        success: false,
        message: error.message || 'Erro ao gerar resumo.',
      };
    }
  }

  /**
   * Traduz o conteúdo do relatório para outro idioma
   */
  async translateReport(
    content: string | string[],
    targetLanguage: string
  ): Promise<AITranslationResult> {
    try {
      // Implementação simplificada - em produção usar Google Translate API ou similar
      const translations: Record<string, Record<string, string>> = {
        'en': {
          'Total': 'Total',
          'Média': 'Average',
          'Máximo': 'Maximum',
          'Mínimo': 'Minimum',
          'Registros': 'Records',
          'Data': 'Date',
          'Nome': 'Name',
          'Valor': 'Value',
        },
        'es': {
          'Total': 'Total',
          'Média': 'Promedio',
          'Máximo': 'Máximo',
          'Mínimo': 'Mínimo',
          'Registros': 'Registros',
          'Data': 'Fecha',
          'Nome': 'Nombre',
          'Valor': 'Valor',
        },
      };

      const texts = Array.isArray(content) ? content : [content];
      let translatedText = texts.join('\n');

      const langTranslations = translations[targetLanguage] || {};
      Object.entries(langTranslations).forEach(([pt, translated]) => {
        translatedText = translatedText.replace(new RegExp(pt, 'gi'), translated);
      });

      return {
        success: true,
        message: `Traduzido para ${targetLanguage}.`,
        translatedText,
        targetLanguage,
      };
    } catch (error: any) {
      console.error('Erro na tradução:', error);
      return {
        success: false,
        message: error.message || 'Erro na tradução.',
      };
    }
  }

  /**
   * Sugere layout de relatório baseado na estrutura dos dados
   */
  async suggestReportLayout(
    dataSource: string,
    sampleData: DataRow[]
  ): Promise<AIGenerationResult> {
    try {
      if (!sampleData || sampleData.length === 0) {
        return {
          success: false,
          message: 'Dados de amostra necessários para sugestão.',
        };
      }

      const columns = Object.keys(sampleData[0]);
      const suggestions: string[] = [];
      
      // Analisa tipos de dados
      const columnTypes = this.inferColumnTypes(sampleData);
      
      // Sugere tipo de relatório
      const hasNumericColumns = Object.values(columnTypes).some(t => t === 'number');
      const hasDateColumns = Object.values(columnTypes).some(t => t === 'date');
      
      if (hasNumericColumns && hasDateColumns) {
        suggestions.push('Relatório com gráfico de linha (evolução temporal)');
      }
      if (hasNumericColumns) {
        suggestions.push('Relatório com totalizadores e médias');
      }
      if (columns.length > 5) {
        suggestions.push('Considere agrupar colunas relacionadas');
      }

      // Gera definição sugerida
      const definition = this.generateSuggestedDefinition(dataSource, columns, columnTypes);

      return {
        success: true,
        message: 'Sugestões geradas com sucesso.',
        definition,
        suggestions,
      };
    } catch (error: any) {
      console.error('Erro ao gerar sugestões:', error);
      return {
        success: false,
        message: error.message || 'Erro ao gerar sugestões.',
      };
    }
  }

  /**
   * Detecta anomalias nos dados do relatório
   */
  async detectAnomalies(data: DataRow[]): Promise<{
    success: boolean;
    message: string;
    anomalies?: Array<{ field: string; value: any; reason: string }>;
  }> {
    try {
      const anomalies: Array<{ field: string; value: any; reason: string }> = [];
      
      if (!data || data.length < 3) {
        return {
          success: true,
          message: 'Dados insuficientes para detecção de anomalias.',
          anomalies: [],
        };
      }

      const columns = Object.keys(data[0]);
      
      columns.forEach(col => {
        const values = data.map(row => row[col]).filter(v => typeof v === 'number');
        
        if (values.length > 0) {
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          const stdDev = Math.sqrt(
            values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length
          );
          
          // Detecta outliers (> 3 desvios padrão)
          data.forEach((row, idx) => {
            const val = row[col];
            if (typeof val === 'number' && Math.abs(val - mean) > 3 * stdDev) {
              anomalies.push({
                field: col,
                value: val,
                reason: `Valor fora do padrão (média: ${mean.toFixed(2)}, desvio: ${stdDev.toFixed(2)})`,
              });
            }
          });
        }
      });

      return {
        success: true,
        message: `${anomalies.length} anomalia(s) detectada(s).`,
        anomalies,
      };
    } catch (error: any) {
      console.error('Erro na detecção de anomalias:', error);
      return {
        success: false,
        message: error.message || 'Erro na detecção de anomalias.',
      };
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private analyzeData(data: DataRow[]): Record<string, any> {
    if (!data || data.length === 0) {
      return { totalRecords: 0 };
    }

    const columns = Object.keys(data[0]);
    const stats: Record<string, any> = {
      totalRecords: data.length,
      columns: {},
    };

    columns.forEach(col => {
      const values = data.map(row => row[col]);
      const numericValues = values.filter(v => typeof v === 'number') as number[];
      
      if (numericValues.length > 0) {
        stats.columns[col] = {
          type: 'numeric',
          sum: numericValues.reduce((a, b) => a + b, 0),
          avg: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
        };
      } else {
        const uniqueValues = new Set(values);
        stats.columns[col] = {
          type: 'text',
          uniqueCount: uniqueValues.size,
        };
      }
    });

    return stats;
  }

  private generateInsights(data: DataRow[], statistics: Record<string, any>): string[] {
    const insights: string[] = [];

    if (statistics.totalRecords > 0) {
      insights.push(`Total de ${statistics.totalRecords} registros analisados.`);
    }

    if (statistics.columns) {
      Object.entries(statistics.columns).forEach(([col, colStats]: [string, any]) => {
        if (colStats.type === 'numeric') {
          insights.push(`${col}: soma total de ${colStats.sum.toFixed(2)}, média de ${colStats.avg.toFixed(2)}`);
          
          if (colStats.max > colStats.avg * 2) {
            insights.push(`⚠️ ${col} possui valores muito acima da média (máx: ${colStats.max.toFixed(2)})`);
          }
        }
      });
    }

    return insights;
  }

  private formatSummary(
    statistics: Record<string, any>,
    insights: string[],
    language?: string
  ): string {
    const header = language === 'en' 
      ? '## Executive Summary\n\n' 
      : '## Resumo Executivo\n\n';

    const body = insights.join('\n- ');
    
    return `${header}- ${body}`;
  }

  private inferColumnTypes(data: DataRow[]): Record<string, string> {
    if (!data || data.length === 0) return {};

    const columns = Object.keys(data[0]);
    const types: Record<string, string> = {};

    columns.forEach(col => {
      const sampleValue = data.find(row => row[col] !== null && row[col] !== undefined)?.[col];
      
      if (typeof sampleValue === 'number') {
        types[col] = 'number';
      } else if (sampleValue instanceof Date || (typeof sampleValue === 'string' && !isNaN(Date.parse(sampleValue)))) {
        types[col] = 'date';
      } else if (typeof sampleValue === 'boolean') {
        types[col] = 'boolean';
      } else {
        types[col] = 'string';
      }
    });

    return types;
  }

  private generateSuggestedDefinition(
    dataSource: string,
    columns: string[],
    columnTypes: Record<string, string>
  ): ReportDefinition {
    const elements: ReportElement[] = [];
    
    // Header
    elements.push({
      id: 'title-1',
      type: 'text',
      bandId: 'reportHeader',
      position: { x: 0, y: 0 },
      size: { width: 800, height: 40 },
      properties: {
        content: 'Relatório Sugerido',
        font: { family: 'Inter', size: 24, weight: 'bold' },
        textAlign: 'center',
      },
    });

    // Table
    elements.push({
      id: 'table-1',
      type: 'table',
      bandId: 'detail',
      position: { x: 0, y: 50 },
      size: { width: 800, height: 400 },
      properties: {
        tableConfig: {
          columns: columns.map((col, idx) => ({
            id: `col-${idx}`,
            fieldBinding: col,
            header: col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, ' '),
            width: Math.floor(800 / columns.length),
            visible: true,
            format: columnTypes[col] === 'number' ? 'decimal' : undefined,
          })),
          alternateRowColors: true,
          showGridLines: true,
        },
      },
    });

    return {
      id: 'suggested-report',
      version: '1.0.0',
      reportType: 'TABLE',
      dataSource,
      layout: {
        pageSize: 'A4',
        orientation: 'landscape',
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
      },
      bands: {
        reportHeader: { id: 'reportHeader', height: 60 },
        detail: { id: 'detail', height: 400 },
        reportFooter: { id: 'reportFooter', height: 40 },
      },
      elements,
      styles: {
        default: {
          fontFamily: 'Inter',
          fontSize: 12,
          color: '#1e293b',
        },
      },
      parameters: [],
    };
  }
}

// Singleton
export const aiReportService = new AIReportService();
