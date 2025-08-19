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

/**
 * Componente principal do Construtor de Relatórios.
 * Orquestra a interação entre a barra de ferramentas, a área de design,
 * o painel de propriedades e a visualização.
 */
const BidReportBuilder = () => {
    const [reportDefinition, setReportDefinition] = React.useState({ elements: [] });
    const [selectedElement, setSelectedElement] = React.useState(null);

    const handleAddElement = (elementType, x, y) => {
        console.log(`Adicionando elemento: ${elementType} em (${x}, ${y})`);
        
        // Ajustar a posição para considerar o offset do container. 
        // Esta é uma simplificação. Uma implementação real pode precisar de `ref` e `getBoundingClientRect`.
        const adjustedX = x - 300; 
        const adjustedY = y - 100;
        
        const newElement = {
            id: `el-${uuidv4()}`,
            type: elementType,
            content: `Novo ${elementType}`,
            x: adjustedX,
            y: adjustedY,
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
        
        // Atualiza o elemento selecionado também, para que o painel de propriedades reflita a mudança.
        if (selectedElement && selectedElement.id === elementId) {
            setSelectedElement(updatedElement);
        }
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="flex flex-col h-[75vh] bg-muted/30 rounded-lg border">
                <Toolbar />
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
