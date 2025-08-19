// components/BidReportBuilder/components/DesignSurface.js
'use client';
import React from 'react';
import { useDrop } from 'react-dnd';
import { cn } from '@/lib/utils';

// Superfície de design onde os elementos do relatório são arrastados.
const DesignSurface = ({ elements, onAddElement, onSelectElement, selectedElementId }) => {

  const [, drop] = useDrop(() => ({
    accept: 'REPORT_ELEMENT',
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      if (offset) {
        // Ajustar a posição para considerar o offset do container.
        // Esta é uma simplificação. Uma implementação real pode precisar de `ref` e `getBoundingClientRect`.
        const adjustedX = offset.x - 300; 
        const adjustedY = y - 100;
        onAddElement(item.type, adjustedX, adjustedY);
      }
    },
  }));

  return (
    <div 
        ref={drop} 
        data-ai-id="report-design-surface"
        className="relative w-full h-full bg-white shadow-inner overflow-auto p-4" 
        style={{ cursor: 'crosshair', backgroundImage: 'radial-gradient(circle, #E5E5E5 1px, transparent 1px)', backgroundSize: '15px 15px' }}
        onClick={() => onSelectElement(null)} // Deseleciona ao clicar fora
    >
      <h2 className="text-center text-sm text-muted-foreground sr-only">Área de Design</h2>
       {elements.map(el => (
        <div 
          key={el.id}
          onClick={(e) => { e.stopPropagation(); onSelectElement(el); }}
          style={{ 
            position: 'absolute', 
            left: `${el.x}px`, 
            top: `${el.y}px`, 
            width: `${el.width}px`,
            height: `${el.height}px`,
            cursor: 'move'
          }}
          className={cn(
            "p-2 bg-slate-100/80 hover:border-primary-light transition-all",
             selectedElementId === el.id ? 'border-2 border-primary ring-2 ring-primary/30' : 'border border-dashed border-muted-foreground'
          )}
        >
          <p className="text-xs truncate pointer-events-none">{el.content} ({el.type})</p>
        </div>
      ))}
    </div>
  );
};

export default DesignSurface;
