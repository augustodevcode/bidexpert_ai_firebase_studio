// src/components/BidReportBuilder/index.js
'use client';

import React from 'react';
import Toolbar from './components/Toolbar';
import DesignSurface from './components/DesignSurface';
import PropertiesPanel from './components/PropertiesPanel';
import PreviewPanel from './components/PreviewPanel';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';

/**
 * Componente principal do Construtor de Relatórios.
 * Orquestra a interação entre a barra de ferramentas, a área de design,
 * o painel de propriedades e a visualização.
 */
const BidReportBuilder = () => {
    const [reportDefinition, setReportDefinition] = React.useState({ elements: [] });
    const [selectedElement, setSelectedElement] = React.useState(null);
    const { toast } = useToast();

    const handleAddElement = (elementType, x, y) => {
        const designSurface = document.querySelector('[data-ai-id="report-design-surface"]');
        let dropX = x;
        let dropY = y;
        
        if (designSurface) {
            const rect = designSurface.getBoundingClientRect();
            dropX = x - rect.left;
            dropY = y - rect.top;
        }

        const newElement = {
            id: `el-${uuidv4()}`,
            type: elementType,
            content: `Novo ${elementType}`,
            x: dropX,
            y: dropY,
            width: 150,
            height: 30
        };
        // @ts-ignore
        setReportDefinition(prev => ({ ...prev, elements: [...prev.elements, newElement]}));
        setSelectedElement(newElement);
    };
    
    const handleElementChange = (elementId, newProps) => {
        let updatedElement;
        const newElements = reportDefinition.elements.map(el => {
            if (el.id === elementId) {
                updatedElement = { ...el, ...newProps };
                return updatedElement;
            }
            return el;
        });

        setReportDefinition({ ...reportDefinition, elements: newElements });
        
        if (selectedElement && selectedElement.id === elementId) {
            setSelectedElement(updatedElement);
        }
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
                setSelectedElement(null); // Deselecionar qualquer elemento ao carregar
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
        // Lógica de exportação para PDF (a ser implementada)
        toast({
            title: "Funcionalidade em Desenvolvimento",
            description: "A exportação para PDF será implementada em breve.",
        });
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="flex flex-col h-[75vh] bg-muted/30 rounded-lg border">
                <Toolbar onSave={handleSaveReport} onLoad={handleLoadReport} onExport={handleExportReport} />
                <div className="flex flex-grow overflow-hidden">
                    <main className="flex-grow flex flex-col">
                        <div className="flex-grow border-r border-t relative">
                            <DesignSurface 
                                elements={reportDefinition.elements} 
                                onAddElement={handleAddElement}
                                onSelectElement={setSelectedElement}
                                selectedElementId={selectedElement?.id}
                            />
                        </div>
                        <div className="h-1/3 border-t bg-background">
                           <PreviewPanel reportDefinition={reportDefinition} />
                        </div>
                    </main>
                    <aside className="w-72 flex-shrink-0 border-l border-t bg-background">
                        <PropertiesPanel 
                            selectedElement={selectedElement} 
                            onElementChange={handleElementChange}
                        />
                    </aside>
                </div>
            </div>
        </DndProvider>
    );
};

export default BidReportBuilder;
