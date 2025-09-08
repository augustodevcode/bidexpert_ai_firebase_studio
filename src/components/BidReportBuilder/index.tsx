// src/components/BidReportBuilder/index.tsx
'use client';

import React from 'react';
import Toolbar from './components/Toolbar';
import DesignSurface from './components/DesignSurface';
import PropertiesPanel from './components/PropertiesPanel';
import VariablePanel from './components/VariablePanel';
import MediaLibrary from './components/MediaLibrary';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Definindo a interface para um elemento do relatório
interface ReportElement {
    id: string;
    type: 'TextBox' | 'Image' | 'Chart' | 'Table';
    content: string;
    x: number;
    y: number;
    width: number;
    height: number;
    imageUrl?: string;
}

/**
 * Componente principal do Construtor de Relatórios.
 * Orquestra a interação entre a barra de ferramentas, a área de design,
 * o painel de propriedades e a visualização.
 */
const BidReportBuilder = () => {
    const [reportDefinition, setReportDefinition] = React.useState<{ elements: ReportElement[] }>({ elements: [] });
    const [selectedElement, setSelectedElement] = React.useState<ReportElement | null>(null);
    const { toast } = useToast();

    const handleAddElement = (elementType: ReportElement['type'], x: number, y: number, content?: string) => {
        const newElement: ReportElement = {
            id: `el-${uuidv4()}`,
            type: elementType,
            content: content || `Novo ${elementType}`,
            x: x || 50,
            y: y || 50,
            width: elementType === 'Image' ? 200 : 150,
            height: elementType === 'Image' ? 150 : 40, // Aumentado altura padrão
        };
        setReportDefinition(prev => ({ ...prev, elements: [...prev.elements, newElement]}));
        setSelectedElement(newElement);
    };
    
    const handleElementChange = (elementId: string, newProps: Partial<ReportElement>) => {
        let updatedElement: ReportElement | undefined;
        const newElements = reportDefinition.elements.map(el => {
            if (el.id === elementId) {
                updatedElement = { ...el, ...newProps };
                return updatedElement;
            }
            return el;
        });

        setReportDefinition({ ...reportDefinition, elements: newElements });
        
        if (selectedElement && selectedElement.id === elementId) {
            setSelectedElement(updatedElement as ReportElement);
        }
    };

    const handleSelectImage = (image: { alt: string, src: string }) => {
        const newImageElement: ReportElement = {
            id: `el-${uuidv4()}`,
            type: 'Image',
            content: image.alt,
            x: 200,
            y: 200,
            width: 200,
            height: 150,
            imageUrl: image.src,
        };
        setReportDefinition(prev => ({ ...prev, elements: [...prev.elements, newImageElement]}));
        setSelectedElement(newImageElement);
         toast({
            title: "Imagem Adicionada!",
            description: `A imagem "${image.alt}" foi adicionada ao seu relatório.`,
        });
    };

    const handleSaveReport = () => {
        try {
            localStorage.setItem('bidReportBuilder_save', JSON.stringify(reportDefinition));
            toast({
                title: "Relatório Salvo!",
                description: "Seu layout foi salvo no armazenamento local do seu navegador.",
            });
        } catch (error) {
            toast({
                title: "Erro ao Salvar",
                description: "Não foi possível salvar o relatório.",
                variant: "destructive",
            });
        }
    };

    const handleLoadReport = () => {
        try {
            const savedReport = localStorage.getItem('bidReportBuilder_save');
            if (savedReport) {
                const parsedReport = JSON.parse(savedReport);
                setReportDefinition(parsedReport);
                setSelectedElement(null);
                toast({
                    title: "Relatório Carregado!",
                    description: "Seu layout salvo foi carregado com sucesso.",
                });
            } else {
                 toast({
                    title: "Nenhum Relatório Salvo",
                    description: "Não foi encontrado um relatório salvo no seu navegador.",
                    variant: "default",
                });
            }
        } catch (error) {
             toast({
                title: "Erro ao Carregar",
                description: "O formato do relatório salvo é inválido.",
                variant: "destructive",
            });
        }
    };

    const handleExportReport = () => {
        toast({
            title: "Funcionalidade em Desenvolvimento",
            description: "A exportação para PDF será implementada em breve.",
        });
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="flex h-[80vh] w-full" data-ai-id="report-builder-container">
                <Toolbar onSave={handleSaveReport} onLoad={handleLoadReport} onExport={handleExportReport} />

                <main className="flex-grow flex flex-col bg-muted/40 p-3" data-ai-id="report-builder-main-panel">
                     <div className="flex-grow border bg-background shadow-md rounded-md relative overflow-hidden" data-ai-id="report-builder-design-surface-wrapper">
                        <DesignSurface 
                            elements={reportDefinition.elements} 
                            onAddElement={handleAddElement}
                            onSelectElement={setSelectedElement}
                            selectedElementId={selectedElement?.id || null}
                        />
                    </div>
                </main>
                <aside className="w-80 flex-shrink-0 flex flex-col bg-card border-l" data-ai-id="report-builder-sidebar">
                     <Tabs defaultValue="properties" className="w-full h-full flex flex-col">
                        <TabsList className="flex-shrink-0 mx-2 mt-2">
                            <TabsTrigger value="properties">Propriedades</TabsTrigger>
                            <TabsTrigger value="data">Dados</TabsTrigger>
                            <TabsTrigger value="media">Mídia</TabsTrigger>
                        </TabsList>
                        <TabsContent value="properties" className="flex-grow overflow-y-auto">
                            <PropertiesPanel 
                                selectedElement={selectedElement} 
                                onElementChange={handleElementChange}
                            />
                        </TabsContent>
                        <TabsContent value="data" className="flex-grow overflow-y-auto">
                            <VariablePanel />
                        </TabsContent>
                         <TabsContent value="media" className="flex-grow overflow-y-auto">
                            <MediaLibrary onSelectImage={handleSelectImage} />
                        </TabsContent>
                    </Tabs>
                </aside>
            </div>
        </DndProvider>
    );
};

export default BidReportBuilder;
