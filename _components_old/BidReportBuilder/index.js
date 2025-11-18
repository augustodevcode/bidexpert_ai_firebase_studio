// src/components/BidReportBuilder/index.js
'use client';

import React from 'react';
import Toolbar from './components/Toolbar';
import DesignSurface from './components/DesignSurface';
import PropertiesPanel from './components/PropertiesPanel';
import PreviewPanel from './components/PreviewPanel';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

/**
 * Componente principal do Construtor de Relatórios.
 * Orquestra a interação entre a barra de ferramentas, a área de design,
 * o painel de propriedades e a visualização.
 */
const BidReportBuilder = () => {
    // Estados para gerenciar a definição do relatório, elementos selecionados, etc.
    const [reportDefinition, setReportDefinition] = React.useState({ elements: [] });
    const [selectedElement, setSelectedElement] = React.useState(null);

    const handleAddElement = (elementType) => {
        // Lógica para adicionar um novo elemento ao reportDefinition
        console.log(`Adicionando elemento: ${elementType}`);
        const newElement = {
            id: `el-${Date.now()}`,
            type: elementType,
            content: `Novo ${elementType}`,
            x: 50,
            y: 50,
            width: 150,
            height: 30
        };
        // @ts-ignore
        setReportDefinition(prev => ({ ...prev, elements: [...prev.elements, newElement]}));
    };
    
    const handleElementChange = (elementId, newProps) => {
        setReportDefinition(prev => ({
            ...prev,
            elements: prev.elements.map(el => 
                // @ts-ignore
                el.id === elementId ? { ...el, ...newProps } : el
            )
        }));
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="flex flex-col h-[75vh] bg-muted/30 rounded-lg border">
                <Toolbar onAddElement={handleAddElement} />
                <div className="flex flex-grow overflow-hidden">
                    <main className="flex-grow flex flex-col">
                        <div className="flex-grow border-r border-t relative">
                            <DesignSurface 
                                elements={reportDefinition.elements} 
                                onSelectElement={setSelectedElement}
                                onElementChange={handleElementChange}
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
