// src/lib/report-builder/utils/zod-to-grapesjs.ts
/**
 * @fileoverview Utilitário para converter Zod Schemas em blocos GrapesJS.
 * Transforma esquemas de dados em componentes arrastáveis para o designer visual.
 * 
 * Arquitetura: Composite (GrapesJS + Puppeteer + Handlebars)
 * @see REPORT_BUILDER_ARCHITECTURE.md
 */

import { z } from 'zod';
import type { ZodObject, ZodTypeAny, ZodArray } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

export interface GrapesJSBlock {
  id: string;
  label: string;
  category: string;
  content: string;
  attributes?: Record<string, string>;
  media?: string;
  type?: string;
}

export interface FieldDefinition {
  id: string;
  name: string;
  path: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  description?: string;
  children?: FieldDefinition[];
}

export interface BlockCategory {
  id: string;
  label: string;
  open: boolean;
  order?: number;
}

// ============================================================================
// ICONS (SVG inline para GrapesJS)
// ============================================================================

const ICONS = {
  text: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>`,
  number: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 17l6-10 4 8 6-12"/></svg>`,
  date: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
  boolean: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3 8-8"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`,
  array: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>`,
  object: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extrai a descrição de um schema Zod
 */
function getDescription(schema: ZodTypeAny): string | undefined {
  return schema._def.description;
}

/**
 * Determina o tipo base de um schema Zod
 */
function getZodType(schema: ZodTypeAny): FieldDefinition['type'] {
  const typeName = schema._def.typeName;
  
  switch (typeName) {
    case 'ZodString':
      return 'text';
    case 'ZodNumber':
    case 'ZodBigInt':
      return 'number';
    case 'ZodDate':
      return 'date';
    case 'ZodBoolean':
      return 'boolean';
    case 'ZodArray':
      return 'array';
    case 'ZodObject':
      return 'object';
    case 'ZodEnum':
      return 'text';
    case 'ZodNullable':
    case 'ZodOptional':
      return getZodType(schema._def.innerType);
    default:
      return 'text';
  }
}

/**
 * Extrai campos de um schema Zod recursivamente
 */
export function extractFieldsFromZodSchema(
  schema: ZodTypeAny,
  parentPath: string = '',
  depth: number = 0
): FieldDefinition[] {
  const fields: FieldDefinition[] = [];
  
  // Limitar profundidade para evitar loops infinitos
  if (depth > 5) return fields;
  
  // Desembrulhar nullable/optional
  let innerSchema = schema;
  if (schema._def.typeName === 'ZodNullable' || schema._def.typeName === 'ZodOptional') {
    innerSchema = schema._def.innerType;
  }
  
  // Se for objeto, extrair shape
  if (innerSchema._def.typeName === 'ZodObject') {
    const shape = (innerSchema as ZodObject<any>).shape;
    
    for (const [key, value] of Object.entries(shape)) {
      const fieldPath = parentPath ? `${parentPath}.${key}` : key;
      const fieldType = getZodType(value as ZodTypeAny);
      const description = getDescription(value as ZodTypeAny);
      
      const field: FieldDefinition = {
        id: fieldPath.replace(/\./g, '_'),
        name: key,
        path: fieldPath,
        type: fieldType,
        description,
      };
      
      // Processar filhos se for objeto ou array de objetos
      if (fieldType === 'object') {
        field.children = extractFieldsFromZodSchema(value as ZodTypeAny, fieldPath, depth + 1);
      } else if (fieldType === 'array') {
        const arraySchema = value as ZodArray<any>;
        const elementSchema = arraySchema._def.type;
        if (elementSchema._def.typeName === 'ZodObject') {
          field.children = extractFieldsFromZodSchema(elementSchema, `${fieldPath}[]`, depth + 1);
        }
      }
      
      fields.push(field);
    }
  }
  
  return fields;
}

/**
 * Gera o conteúdo HTML de um bloco de variável para GrapesJS
 */
function generateBlockContent(field: FieldDefinition, contextName: string): string {
  const varPath = `${contextName}.${field.path}`;
  const displayName = field.description || field.name;
  
  // Classes CSS para estilização visual no editor
  const baseClasses = 'report-variable inline-block px-2 py-1 rounded text-sm';
  const typeClasses = {
    text: 'bg-blue-100 text-blue-800 border border-blue-300',
    number: 'bg-green-100 text-green-800 border border-green-300',
    date: 'bg-purple-100 text-purple-800 border border-purple-300',
    boolean: 'bg-orange-100 text-orange-800 border border-orange-300',
    array: 'bg-pink-100 text-pink-800 border border-pink-300',
    object: 'bg-gray-100 text-gray-800 border border-gray-300',
  };
  
  return `<span 
    class="${baseClasses} ${typeClasses[field.type]}" 
    data-gjs-type="report-variable"
    data-field-path="${field.path}"
    data-field-type="${field.type}"
    data-context="${contextName}"
    title="${displayName}"
  >{{${varPath}}}</span>`;
}

/**
 * Gera o conteúdo HTML de um bloco de tabela dinâmica (loop)
 */
function generateTableBlockContent(field: FieldDefinition, contextName: string): string {
  const varPath = `${contextName}.${field.path}`;
  const itemName = field.path.split('.').pop()?.replace(/s$/, '') || 'item';
  
  // Gerar colunas baseadas nos filhos do array
  const columns = field.children?.map(child => ({
    header: child.description || child.name,
    binding: `${itemName}.${child.name}`,
  })) || [];
  
  const headerRow = columns.map(col => 
    `<th class="border border-gray-300 px-3 py-2 bg-gray-100 font-semibold text-left">${col.header}</th>`
  ).join('');
  
  const dataRow = columns.map(col => 
    `<td class="border border-gray-300 px-3 py-2">{{${col.binding}}}</td>`
  ).join('');
  
  return `<div 
    class="report-dynamic-table" 
    data-gjs-type="report-dynamic-table"
    data-array-path="${field.path}"
    data-item-name="${itemName}"
    data-context="${contextName}"
  >
    <table class="w-full border-collapse">
      <thead>
        <tr>${headerRow}</tr>
      </thead>
      <tbody data-gjs-type="report-loop" data-loop-var="${varPath}" data-loop-item="${itemName}">
        {{#each ${varPath}}}
        <tr class="hover:bg-gray-50">${dataRow}</tr>
        {{/each}}
      </tbody>
    </table>
  </div>`;
}

// ============================================================================
// MAIN CONVERSION FUNCTION
// ============================================================================

export interface ZodToGrapesJSOptions {
  contextName: string;
  contextLabel: string;
  includeNestedObjects?: boolean;
  includeArrays?: boolean;
  maxDepth?: number;
}

/**
 * Converte um Zod Schema em blocos GrapesJS
 */
export function zodSchemaToGrapesJSBlocks(
  schema: ZodTypeAny,
  options: ZodToGrapesJSOptions
): { blocks: GrapesJSBlock[]; categories: BlockCategory[] } {
  const { contextName, contextLabel, includeNestedObjects = true, includeArrays = true } = options;
  
  const blocks: GrapesJSBlock[] = [];
  const categories: BlockCategory[] = [];
  
  // Categoria principal para este contexto
  const mainCategory: BlockCategory = {
    id: `ctx-${contextName.toLowerCase()}`,
    label: `📋 ${contextLabel}`,
    open: true,
    order: 0,
  };
  categories.push(mainCategory);
  
  // Extrair campos do schema
  const fields = extractFieldsFromZodSchema(schema);
  
  // Processar campos
  const processFields = (
    fieldsToProcess: FieldDefinition[],
    categoryId: string,
    depth: number = 0
  ) => {
    for (const field of fieldsToProcess) {
      // Campos simples (texto, número, data, boolean)
      if (['text', 'number', 'date', 'boolean'].includes(field.type)) {
        blocks.push({
          id: `blk-${contextName}-${field.id}`,
          label: `${field.description || field.name}`,
          category: categoryId,
          content: generateBlockContent(field, contextName),
          media: ICONS[field.type],
          attributes: {
            class: 'gjs-block-variable',
            title: `Arraste para inserir {{${contextName}.${field.path}}}`,
          },
        });
      }
      
      // Arrays (tabelas dinâmicas)
      if (field.type === 'array' && includeArrays && field.children?.length) {
        // Criar subcategoria para o array
        const arrayCategory: BlockCategory = {
          id: `ctx-${contextName}-${field.id}`,
          label: `📊 ${field.description || field.name}`,
          open: false,
          order: depth + 1,
        };
        categories.push(arrayCategory);
        
        // Bloco de tabela dinâmica
        blocks.push({
          id: `blk-${contextName}-${field.id}-table`,
          label: `Tabela: ${field.description || field.name}`,
          category: arrayCategory.id,
          content: generateTableBlockContent(field, contextName),
          media: ICONS.array,
          type: 'report-dynamic-table',
          attributes: {
            class: 'gjs-block-table',
            title: `Arraste para inserir tabela dinâmica de ${field.name}`,
          },
        });
        
        // Blocos individuais para campos do array (para uso dentro de loops)
        const itemName = field.path.split('.').pop()?.replace(/s$/, '') || 'item';
        for (const child of field.children) {
          blocks.push({
            id: `blk-${contextName}-${field.id}-${child.id}`,
            label: child.description || child.name,
            category: arrayCategory.id,
            content: `<span 
              class="report-variable inline-block px-2 py-1 rounded text-sm bg-pink-100 text-pink-800 border border-pink-300"
              data-gjs-type="report-variable"
              data-field-path="${itemName}.${child.name}"
              data-field-type="${child.type}"
              data-context="${contextName}"
              title="${child.description || child.name}"
            >{{${itemName}.${child.name}}}</span>`,
            media: ICONS[child.type],
          });
        }
      }
      
      // Objetos aninhados
      if (field.type === 'object' && includeNestedObjects && field.children?.length && depth < 2) {
        const objCategory: BlockCategory = {
          id: `ctx-${contextName}-${field.id}`,
          label: `📁 ${field.description || field.name}`,
          open: false,
          order: depth + 1,
        };
        categories.push(objCategory);
        
        processFields(field.children, objCategory.id, depth + 1);
      }
    }
  };
  
  processFields(fields, mainCategory.id);
  
  return { blocks, categories };
}

// ============================================================================
// UTILITY BLOCKS (Elementos genéricos)
// ============================================================================

export const UTILITY_BLOCKS: GrapesJSBlock[] = [
  {
    id: 'blk-text',
    label: 'Texto',
    category: 'util-elements',
    content: '<p class="report-text" data-gjs-type="text">Clique para editar o texto...</p>',
    media: ICONS.text,
  },
  {
    id: 'blk-heading',
    label: 'Título',
    category: 'util-elements',
    content: '<h1 class="report-heading text-2xl font-bold" data-gjs-type="text">Título do Relatório</h1>',
    media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h8M4 18V6M12 18V6M20 7.5V6h-6v1.5M17 6v12"/></svg>`,
  },
  {
    id: 'blk-image',
    label: 'Imagem',
    category: 'util-elements',
    content: '<img class="report-image" data-gjs-type="image" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiNFNUU3RUIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZCNzI4MCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPkltYWdlbTwvdGV4dD48L3N2Zz4=" alt="Imagem do relatório"/>',
    media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>`,
  },
  {
    id: 'blk-line',
    label: 'Linha',
    category: 'util-elements',
    content: '<hr class="report-line border-t-2 border-gray-300 my-4"/>',
    media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>`,
  },
  {
    id: 'blk-page-break',
    label: 'Quebra de Página',
    category: 'util-elements',
    content: '<div class="report-page-break" style="page-break-before: always; border-top: 2px dashed #ccc; margin: 20px 0; padding: 10px; text-align: center; color: #999; font-size: 12px;">[Quebra de Página]</div>',
    media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9h16M4 15h16M12 4v4M12 16v4"/></svg>`,
  },
  {
    id: 'blk-date-now',
    label: 'Data Atual',
    category: 'util-elements',
    content: '<span class="report-variable inline-block px-2 py-1 rounded text-sm bg-purple-100 text-purple-800 border border-purple-300" data-gjs-type="report-variable" data-field-type="date-now">{{formatDate now "DD/MM/YYYY"}}</span>',
    media: ICONS.date,
  },
  {
    id: 'blk-page-number',
    label: 'Nº da Página',
    category: 'util-elements',
    content: '<span class="report-page-number text-sm text-gray-500">Página {{pageNumber}} de {{totalPages}}</span>',
    media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>`,
  },
];

// ============================================================================
// LAYOUT BLOCKS (Estruturas de layout)
// ============================================================================

export const LAYOUT_BLOCKS: GrapesJSBlock[] = [
  {
    id: 'blk-header-band',
    label: 'Cabeçalho',
    category: 'util-layout',
    content: `<header class="report-header border-b-2 border-gray-300 pb-4 mb-4" data-gjs-type="report-band" data-band-type="header">
      <div class="flex justify-between items-center">
        <div class="report-logo-area">
          <img src="" alt="Logo" class="h-12" data-gjs-type="image"/>
        </div>
        <div class="text-right">
          <h1 class="text-xl font-bold" data-gjs-type="text">Título do Relatório</h1>
          <p class="text-sm text-gray-500" data-gjs-type="text">Subtítulo ou data</p>
        </div>
      </div>
    </header>`,
    media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="6" rx="1"/><path d="M3 12h18M3 18h18"/></svg>`,
  },
  {
    id: 'blk-footer-band',
    label: 'Rodapé',
    category: 'util-layout',
    content: `<footer class="report-footer border-t-2 border-gray-300 pt-4 mt-4" data-gjs-type="report-band" data-band-type="footer" style="position: fixed; bottom: 0; left: 0; right: 0;">
      <div class="flex justify-between items-center text-sm text-gray-500">
        <span>Gerado em: {{formatDate now "DD/MM/YYYY HH:mm"}}</span>
        <span>Página {{pageNumber}} de {{totalPages}}</span>
      </div>
    </footer>`,
    media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18"/><rect x="3" y="15" width="18" height="6" rx="1"/></svg>`,
  },
  {
    id: 'blk-two-columns',
    label: '2 Colunas',
    category: 'util-layout',
    content: `<div class="report-row flex gap-4" data-gjs-type="row">
      <div class="report-column flex-1 p-2 border border-dashed border-gray-300" data-gjs-type="column">Coluna 1</div>
      <div class="report-column flex-1 p-2 border border-dashed border-gray-300" data-gjs-type="column">Coluna 2</div>
    </div>`,
    media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/></svg>`,
  },
  {
    id: 'blk-three-columns',
    label: '3 Colunas',
    category: 'util-layout',
    content: `<div class="report-row flex gap-4" data-gjs-type="row">
      <div class="report-column flex-1 p-2 border border-dashed border-gray-300" data-gjs-type="column">Coluna 1</div>
      <div class="report-column flex-1 p-2 border border-dashed border-gray-300" data-gjs-type="column">Coluna 2</div>
      <div class="report-column flex-1 p-2 border border-dashed border-gray-300" data-gjs-type="column">Coluna 3</div>
    </div>`,
    media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="4" height="18" rx="1"/><rect x="10" y="3" width="4" height="18" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>`,
  },
  {
    id: 'blk-section',
    label: 'Seção',
    category: 'util-layout',
    content: `<section class="report-section my-6" data-gjs-type="section">
      <h2 class="text-lg font-semibold border-b border-gray-200 pb-2 mb-4" data-gjs-type="text">Título da Seção</h2>
      <div class="section-content" data-gjs-type="content">
        <p data-gjs-type="text">Conteúdo da seção...</p>
      </div>
    </section>`,
    media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>`,
  },
];

// ============================================================================
// CATEGORIES FOR UTILITY BLOCKS
// ============================================================================

export const UTILITY_CATEGORIES: BlockCategory[] = [
  { id: 'util-elements', label: '✏️ Elementos', open: true, order: 100 },
  { id: 'util-layout', label: '📐 Layout', open: false, order: 101 },
];
