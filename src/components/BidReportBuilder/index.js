// src/components/BidReportBuilder/index.js
'use client';

import React, { useState } from 'react';
import Toolbar from './components/Toolbar';
import DesignSurface from './components/DesignSurface';
import PropertiesPanel from './components/PropertiesPanel';
import DataSourceManager from './components/DataSourceManager';
import MediaLibrary from './components/MediaLibrary';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createReportAction, updateReportAction } from '@/app/admin/reports/actions';
import ReportSaveDialog from './components/ReportSaveDialog';
import ReportLoadDialog from './components/ReportLoadDialog';
import type { Report } from '@/types';

// Type Definitions
export interface ReportElement {
    id: string;
    type: 'TextBox' | 'Image' | 'Chart' | 'Table';
    content: string;
    x: number;
    y: number;
    width: number;
    height: number;
    imageUrl?: string;
}

export interface ReportDefinition {
    elements: ReportElement[];
}

const BidReportBuilder = () => {
    const [reportDefinition, setReportDefinition] = useState<ReportDefinition>({ elements: [] });
    const [selectedElement, setSelectedElement] = useState<ReportElement | null>(null);
    const [currentReport, setCurrentReport] = useState<Report | null>(null);

    const { toast } = useToast();
    
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);

    const handleAddElement = (elementType: 'TextBox' | 'Image' | 'Chart' | 'Table', x?: number, y?: number, content?: string) => {
        const newElement: ReportElement = {
            id: `el-${uuidv4()}`,
            type: elementType,
            content: content || `Novo ${elementType}`,
            x: x || 50,
            y: y || 50,
            width: elementType === 'Table' ? 400 : 150,
            height: elementType === 'Table' ? 200 : 40
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
        
        if (selectedElement && selectedElement.id === elementId && updatedElement) {
            setSelectedElement(updatedElement);
        }
    };

    const handleSelectImage = (image: { alt: string; src: string }) => {
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

    const handleSaveReport = async (details: { name: string, description?: string }) => {
        const dataToSave = {
            ...details,
            definition: reportDefinition as any, // Cast to any to match Prisma Json type
        };

        const result = currentReport
            ? await updateReportAction(currentReport.id, dataToSave)
            : await createReportAction(dataToSave);
        
        if (result.success) {
            toast({ title: "Sucesso!", description: result.message });
            if (!currentReport && (result as any).report) {
                setCurrentReport((result as any).report);
            }
        } else {
             toast({ title: "Erro ao Salvar", description: result.message, variant: "destructive" });
        }
        return result.success;
    };
    
    const handleLoadReport = (report: Report) => {
        setCurrentReport(report);
        setReportDefinition(report.definition as ReportDefinition);
        setSelectedElement(null);
        setIsLoadModalOpen(false);
        toast({ title: "Relatório Carregado!", description: `O relatório "${report.name}" foi carregado.`});
    };

    const handleExportReport = () => {
        toast({
            title: "Funcionalidade em Desenvolvimento",
            description: "A exportação para PDF será implementada em breve.",
        });
    };

    return (
        <>
            <DndProvider backend={HTML5Backend}>
                <div data-ai-id="report-builder-container" className="flex flex-col h-[80vh] bg-muted/30 rounded-lg border">
                    <Toolbar onAddElement={handleAddElement as any} onSave={() => setIsSaveModalOpen(true)} onLoad={() => setIsLoadModalOpen(true)} onExport={handleExportReport} />
                    <div className="flex flex-grow overflow-hidden">
                        <main className="flex-grow flex flex-col border-r" data-ai-id="report-builder-main-panel">
                            <div className="flex-grow relative">
                                <DesignSurface 
                                    elements={reportDefinition.elements} 
                                    onAddElement={handleAddElement as any}
                                    onSelectElement={setSelectedElement}
                                    selectedElementId={selectedElement?.id || null}
                                    onElementChange={handleElementChange}
                                />
                            </div>
                        </main>
                        <aside className="w-80 flex-shrink-0 bg-card border-l flex flex-col" data-ai-id="report-builder-sidebar">
                            <Tabs defaultValue="properties" className="w-full h-full flex flex-col">
                                <TabsList className="flex-shrink-0 mx-2 mt-2">
                                    <TabsTrigger value="properties" className="flex-1 text-xs">Propriedades</TabsTrigger>
                                    <TabsTrigger value="datasources" className="flex-1 text-xs">Dados</TabsTrigger>
                                    <TabsTrigger value="media" className="flex-1 text-xs">Mídia</TabsTrigger>
                                </TabsList>
                                <TabsContent value="properties" className="flex-grow overflow-y-auto" data-ai-id="report-builder-properties-tab">
                                    <PropertiesPanel 
                                        selectedElement={selectedElement} 
                                        onElementChange={handleElementChange}
                                    />
                                </TabsContent>
                                <TabsContent value="datasources" className="flex-grow overflow-y-auto" data-ai-id="report-builder-variables-tab">
                                    <DataSourceManager onAddElement={handleAddElement as any} />
                                </TabsContent>
                                <TabsContent value="media" className="flex-grow overflow-y-auto" data-ai-id="report-builder-media-tab">
                                    <MediaLibrary onSelectImage={handleSelectImage} />
                                </TabsContent>
                            </Tabs>
                        </aside>
                    </div>
                </div>
            </DndProvider>

            <ReportSaveDialog
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onSave={handleSaveReport}
                initialName={currentReport?.name}
                initialDescription={currentReport?.description || ''}
            />

            <ReportLoadDialog
                isOpen={isLoadModalOpen}
                onClose={() => setIsLoadModalOpen(false)}
                onLoad={handleLoadReport}
            />
        </>
    );
};

export default BidReportBuilder;
