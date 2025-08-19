// components/BidReportBuilder/components/DesignSurface.js
'use client';
import React from 'react';
import { useDrop } from 'react-dnd';

// Superfície de design onde os elementos do relatório são arrastados.
const DesignSurface = ({ elements, onAddElement, onSelectElement }) => {

  const [, drop] = useDrop(() => ({
    accept: 'REPORT_ELEMENT',
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      if (offset) {
        onAddElement(item.type, offset.x, offset.y);
      }
    },
  }));

  return (
    <div 
        ref={drop} 
        data-ai-id="report-design-surface"
        className="relative w-full h-full bg-white shadow-inner overflow-auto p-4" 
        style={{ cursor: 'crosshair', backgroundImage: 'radial-gradient(circle, #E5E5E5 1px, transparent 1px)', backgroundSize: '15px 15px' }}
    >
      <h2 className="text-center text-sm text-muted-foreground sr-only">Área de Design</h2>
       {elements.map(el => (
        <div 
          key={el.id}
          onClick={() => onSelectElement(el)}
          style={{ 
            position: 'absolute', 
            left: `${el.x}px`, 
            top: `${el.y}px`, 
            width: `${el.width}px`,
            height: `${el.height}px`,
            border: '1px dashed gray',
            cursor: 'move'
          }}
          className="p-2 bg-slate-100 hover:border-primary"
        >
          <p className="text-xs truncate">{el.content} ({el.type})</p>
        </div>
      ))}
    </div>
  );
};

export default DesignSurface;
