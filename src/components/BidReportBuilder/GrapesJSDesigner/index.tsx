// src/components/BidReportBuilder/GrapesJSDesigner/index.tsx
/**
 * @fileoverview Componente principal do Report Designer baseado em GrapesJS.
 * Fornece interface visual drag-and-drop para criação de relatórios.
 * 
 * Arquitetura: Composite (GrapesJS + Puppeteer + Handlebars)
 * @see REPORT_BUILDER_ARCHITECTURE.md
 */
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Save,
  Eye,
  Download,
  Undo,
  Redo,
  FileText,
  Maximize2,
  Minimize2,
  Settings,
  Palette,
  Layers,
  Code,
  Monitor,
  Tablet,
  Smartphone,
  Loader2,
} from 'lucide-react';

import type { ReportDefinition } from '@/types/report-builder.types';
import { 
  REPORT_CONTEXTS, 
  type ReportContextType,
} from '@/lib/report-builder/schemas/auction-context.schema';
import {
  zodSchemaToGrapesJSBlocks,
  UTILITY_BLOCKS,
  LAYOUT_BLOCKS,
  UTILITY_CATEGORIES,
  type GrapesJSBlock,
  type BlockCategory,
} from '@/lib/report-builder/utils/zod-to-grapesjs';

// ============================================================================
// TYPES
// ============================================================================

interface GrapesJSDesignerProps {
  reportId?: string;
  initialDefinition?: ReportDefinition;
  initialHtml?: string;
  initialCss?: string;
  contextType?: ReportContextType;
  onSave?: (data: { html: string; css: string; definition: ReportDefinition }) => Promise<void>;
  onPreview?: () => void;
  onExport?: (format: 'pdf' | 'html') => void;
  className?: string;
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

// ============================================================================
// CONSTANTS
// ============================================================================

const VIEWPORT_SIZES: Record<ViewportSize, { width: string; label: string; icon: React.ElementType }> = {
  desktop: { width: '210mm', label: 'A4 (Desktop)', icon: Monitor },
  tablet: { width: '768px', label: 'Tablet', icon: Tablet },
  mobile: { width: '375px', label: 'Mobile', icon: Smartphone },
};

const PAGE_SIZES = {
  A4: { width: '210mm', height: '297mm' },
  Letter: { width: '8.5in', height: '11in' },
  Legal: { width: '8.5in', height: '14in' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function GrapesJSDesigner({
  reportId,
  initialDefinition,
  initialHtml,
  initialCss,
  contextType = 'AUCTION',
  onSave,
  onPreview,
  onExport,
  className,
}: GrapesJSDesignerProps) {
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const grapesInstanceRef = useRef<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedContext, setSelectedContext] = useState<ReportContextType>(contextType);
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [pageSize, setPageSize] = useState<keyof typeof PAGE_SIZES>('A4');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePanel, setActivePanel] = useState<'blocks' | 'styles' | 'layers' | 'settings'>('blocks');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // ============================================================================
  // GRAPESJS INITIALIZATION
  // ============================================================================

  const initializeEditor = useCallback(async () => {
    if (!editorRef.current) return;

    try {
      // Import GrapesJS dynamically (client-side only)
      const grapesjs = (await import('grapesjs')).default;
      
      // Generate blocks from selected context
      const contextConfig = REPORT_CONTEXTS[selectedContext];
      const { blocks: contextBlocks, categories: contextCategories } = zodSchemaToGrapesJSBlocks(
        contextConfig.schema,
        {
          contextName: selectedContext.toLowerCase(),
          contextLabel: contextConfig.name,
          includeNestedObjects: true,
          includeArrays: true,
        }
      );

      // Combine all blocks and categories
      const allBlocks: GrapesJSBlock[] = [
        ...UTILITY_BLOCKS,
        ...LAYOUT_BLOCKS,
        ...contextBlocks,
      ];
      
      const allCategories: BlockCategory[] = [
        ...UTILITY_CATEGORIES,
        ...contextCategories,
      ];

      // Initialize GrapesJS editor
      const editor = grapesjs.init({
        container: editorRef.current,
        height: '100%',
        width: 'auto',
        fromElement: false,
        storageManager: false,
        
        // Canvas configuration
        canvas: {
          styles: [
            'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
          ],
        },
        
        // Device manager for responsive preview
        deviceManager: {
          devices: [
            { name: 'A4 Portrait', width: '210mm' },
            { name: 'A4 Landscape', width: '297mm' },
            { name: 'Letter', width: '8.5in' },
          ],
        },
        
        // Panel configuration
        panels: {
          defaults: [],
        },
        
        // Block manager configuration
        blockManager: {
          appendTo: '#gjs-blocks-container',
          blocks: allBlocks.map(block => ({
            id: block.id,
            label: block.label,
            category: block.category,
            content: block.content,
            media: block.media,
            attributes: block.attributes || {},
          })),
        },
        
        // Style manager configuration
        styleManager: {
          appendTo: '#gjs-styles-container',
          sectors: [
            {
              name: 'Dimensões',
              open: true,
              properties: ['width', 'height', 'min-width', 'min-height', 'max-width', 'max-height', 'padding', 'margin'],
            },
            {
              name: 'Tipografia',
              open: true,
              properties: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height', 'text-align', 'text-decoration'],
            },
            {
              name: 'Fundo',
              open: false,
              properties: ['background-color', 'background-image', 'background-repeat', 'background-position', 'background-size'],
            },
            {
              name: 'Bordas',
              open: false,
              properties: ['border', 'border-radius', 'box-shadow'],
            },
            {
              name: 'Layout',
              open: false,
              properties: ['display', 'flex-direction', 'justify-content', 'align-items', 'gap'],
            },
          ],
        },
        
        // Layer manager configuration
        layerManager: {
          appendTo: '#gjs-layers-container',
        },
        
        // Asset manager for images
        assetManager: {
          uploadFile: async (e: any) => {
            const files = e.dataTransfer ? e.dataTransfer.files : e.target.files;
            if (!files.length) return;
            
            // TODO: Implement file upload to storage
            toast({
              title: 'Upload de imagem',
              description: 'Funcionalidade em desenvolvimento',
            });
          },
        },
      });

      // Add custom components
      editor.DomComponents.addType('report-variable', {
        isComponent: (el: HTMLElement) => el.dataset?.gjsType === 'report-variable',
        model: {
          defaults: {
            tagName: 'span',
            draggable: true,
            droppable: false,
            traits: [
              { name: 'data-field-path', label: 'Campo' },
              { name: 'data-field-type', label: 'Tipo' },
            ],
          },
        },
      });

      editor.DomComponents.addType('report-dynamic-table', {
        isComponent: (el: HTMLElement) => el.dataset?.gjsType === 'report-dynamic-table',
        model: {
          defaults: {
            tagName: 'div',
            draggable: true,
            droppable: false,
            traits: [
              { name: 'data-array-path', label: 'Array' },
              { name: 'data-item-name', label: 'Item' },
            ],
          },
        },
      });

      // Load initial content
      if (initialHtml) {
        editor.setComponents(initialHtml);
      }
      if (initialCss) {
        editor.setStyle(initialCss);
      }

      // Track changes
      editor.on('change', () => {
        setHasUnsavedChanges(true);
      });

      // Set canvas styles for A4 paper simulation
      const wrapper = editor.getWrapper();
      wrapper.setStyle({
        'width': PAGE_SIZES[pageSize].width,
        'min-height': PAGE_SIZES[pageSize].height,
        'margin': '0 auto',
        'background': 'white',
        'box-shadow': '0 0 10px rgba(0,0,0,0.1)',
        'padding': '20mm',
        'font-family': 'Arial, sans-serif',
        'font-size': '12pt',
        'line-height': '1.5',
      });

      grapesInstanceRef.current = editor;
      setIsLoading(false);

    } catch (error) {
      console.error('Erro ao inicializar GrapesJS:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar o editor de relatórios',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  }, [selectedContext, initialHtml, initialCss, pageSize, toast]);

  useEffect(() => {
    initializeEditor();
    
    return () => {
      if (grapesInstanceRef.current) {
        grapesInstanceRef.current.destroy();
      }
    };
  }, [initializeEditor]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSave = async () => {
    if (!grapesInstanceRef.current || !onSave) return;

    setIsSaving(true);
    try {
      const editor = grapesInstanceRef.current;
      const html = editor.getHtml();
      const css = editor.getCss();
      
      await onSave({
        html,
        css,
        definition: {
          version: '1.0',
          pageSize,
          orientation: 'portrait',
          margins: { top: 20, right: 15, bottom: 20, left: 15 },
          elements: [],
        },
      });
      
      setHasUnsavedChanges(false);
      toast({
        title: 'Salvo!',
        description: 'Template salvo com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao salvar o template',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUndo = () => {
    grapesInstanceRef.current?.UndoManager.undo();
  };

  const handleRedo = () => {
    grapesInstanceRef.current?.UndoManager.redo();
  };

  const handleViewportChange = (size: ViewportSize) => {
    setViewport(size);
    if (grapesInstanceRef.current) {
      const canvas = grapesInstanceRef.current.Canvas;
      canvas.setDevice(VIEWPORT_SIZES[size].width);
    }
  };

  const handleContextChange = (context: ReportContextType) => {
    setSelectedContext(context);
    // Reinitialize editor with new context blocks
    if (grapesInstanceRef.current) {
      grapesInstanceRef.current.destroy();
      grapesInstanceRef.current = null;
      setIsLoading(true);
      setTimeout(() => initializeEditor(), 100);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div 
      className={`grapesjs-designer flex flex-col h-full bg-background ${isFullscreen ? 'fixed inset-0 z-50' : ''} ${className || ''}`}
      data-ai-id="grapesjs-report-designer"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
        {/* Left: Actions */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleUndo}
            title="Desfazer (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRedo}
            title="Refazer (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Select value={selectedContext} onValueChange={(v) => handleContextChange(v as ReportContextType)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Contexto de dados" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(REPORT_CONTEXTS).map(([key, ctx]) => (
                <SelectItem key={key} value={key}>
                  {ctx.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={pageSize} onValueChange={(v) => setPageSize(v as keyof typeof PAGE_SIZES)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Tamanho" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(PAGE_SIZES).map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Center: Viewport */}
        <div className="flex items-center gap-1 bg-muted rounded-md p-1">
          {Object.entries(VIEWPORT_SIZES).map(([key, { label, icon: Icon }]) => (
            <Button
              key={key}
              variant={viewport === key ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleViewportChange(key as ViewportSize)}
              title={label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        {/* Right: Save & Export */}
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Badge variant="secondary" className="mr-2">
              Não salvo
            </Badge>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          
          {onPreview && (
            <Button variant="outline" size="sm" onClick={onPreview}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          )}
          
          {onExport && (
            <Button variant="outline" size="sm" onClick={() => onExport('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          )}
          
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Blocks/Styles/Layers */}
        <div className="w-72 border-r bg-card flex flex-col">
          <Tabs value={activePanel} onValueChange={(v) => setActivePanel(v as typeof activePanel)} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-4 mx-2 mt-2">
              <TabsTrigger value="blocks" title="Blocos">
                <FileText className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="styles" title="Estilos">
                <Palette className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="layers" title="Camadas">
                <Layers className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="settings" title="Configurações">
                <Settings className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="blocks" className="flex-1 mt-0">
              <ScrollArea className="h-full">
                <div id="gjs-blocks-container" className="p-2" />
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="styles" className="flex-1 mt-0">
              <ScrollArea className="h-full">
                <div id="gjs-styles-container" className="p-2" />
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="layers" className="flex-1 mt-0">
              <ScrollArea className="h-full">
                <div id="gjs-layers-container" className="p-2" />
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="settings" className="flex-1 mt-0 p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Tamanho da Página</label>
                  <Select value={pageSize} onValueChange={(v) => setPageSize(v as keyof typeof PAGE_SIZES)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(PAGE_SIZES).map((size) => (
                        <SelectItem key={size} value={size}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Contexto de Dados</label>
                  <Select value={selectedContext} onValueChange={(v) => handleContextChange(v as ReportContextType)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(REPORT_CONTEXTS).map(([key, ctx]) => (
                        <SelectItem key={key} value={key}>
                          {ctx.name} - {ctx.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                <div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => {
                    const editor = grapesInstanceRef.current;
                    if (editor) {
                      console.log('HTML:', editor.getHtml());
                      console.log('CSS:', editor.getCss());
                    }
                  }}>
                    <Code className="h-4 w-4 mr-2" />
                    Ver Código
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-muted/50 overflow-auto p-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div 
              ref={editorRef} 
              className="gjs-editor-container h-full"
              style={{ 
                minHeight: '500px',
                background: '#f0f0f0',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default GrapesJSDesigner;
