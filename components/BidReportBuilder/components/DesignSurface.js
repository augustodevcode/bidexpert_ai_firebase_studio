// components/BidReportBuilder/components/DesignSurface.js
'use client';
import React from 'react';
import { useDrop } from 'react-dnd';

// Placeholder para a superfície de design onde os elementos do relatório são arrastados.
const DesignSurface = ({ elements, onSelectElement, onElementChange }) => {

  const [, drop] = useDrop(() => ({
    accept: 'REPORT_ELEMENT',
    drop: (item, monitor) => {
      // Aqui você lidaria com a lógica de soltar um novo elemento na superfície
      console.log('Item solto na superfície!', item);
    },
  }));


  return (
    <div ref={drop} className="relative w-full h-full bg-background overflow-auto p-4" style={{ cursor: 'crosshair' }}>
      <h2 className="text-center text-sm text-muted-foreground">Área de Design</h2>
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
          <p className="text-xs truncate">{el.content}</p>
        </div>
      ))}
    </div>
  );
};

export default DesignSurface;
