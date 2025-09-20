// src/components/BidReportBuilder/components/DesignSurface.tsx
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { ReportElement } from '../index';
import ChartComponent from './ChartComponent';
import TableComponent from './TableComponent';


interface DesignSurfaceProps {
  elements: ReportElement[];
  onAddElement: (type: 'TextBox' | 'Image' | 'Chart' | 'Table', x: number, y: number, content?: string) => void;
  onSelectElement: (element: ReportElement | null) => void;
  selectedElementId: string | null;
  onElementChange: (id: string, props: Partial<ReportElement>) => void;
}

const DesignSurface: React.FC<DesignSurfaceProps> = ({ 
  elements, 
  onAddElement, 
  onSelectElement, 
  selectedElementId,
  onElementChange
}) => {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [draggingElement, setDraggingElement] = useState<{ id: string, offsetX: number, offsetY: number } | null>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const content = e.dataTransfer.getData('text/plain');
    if (surfaceRef.current && content) {
        const rect = surfaceRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        onAddElement('TextBox', x, y, content);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
  };
  
  const handleElementMouseDown = (e: React.MouseEvent<HTMLDivElement>, el: ReportElement) => {
    e.stopPropagation();
    onSelectElement(el);
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    setDraggingElement({ id: el.id, offsetX, offsetY });
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (draggingElement && surfaceRef.current) {
      const rect = surfaceRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left - draggingElement.offsetX;
      const newY = e.clientY - rect.top - draggingElement.offsetY;
      onElementChange(draggingElement.id, { x: Math.max(0, newX), y: Math.max(0, newY) });
    }
  };
  
  const handleMouseUp = () => {
    setDraggingElement(null);
  };

  useEffect(() => {
    if (draggingElement) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingElement]);

  const renderElementContent = (element: ReportElement) => {
    switch (element.type) {
      case 'Chart':
        return <ChartComponent />;
      case 'Table':
        return <TableComponent />;
      case 'TextBox':
      default:
        return <p className="text-xs truncate pointer-events-none">{element.content}</p>;
    }
  };

  return (
    <div 
        ref={surfaceRef} 
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        data-ai-id="report-design-surface"
        className="relative w-full h-full bg-white shadow-inner overflow-auto p-4" 
        style={{ cursor: 'crosshair', backgroundImage: 'radial-gradient(circle, #E5E5E5 1px, transparent 1px)', backgroundSize: '15px 15px' }}
        onClick={() => onSelectElement(null)} 
    >
      <h2 className="text-center text-sm text-muted-foreground sr-only">Área de Design</h2>
       {elements.map((el) => (
        <div 
          key={el.id}
          onMouseDown={(e) => handleElementMouseDown(e, el)}
          style={{ 
            position: 'absolute', 
            left: `${el.x}px`, 
            top: `${el.y}px`, 
            width: `${el.width}px`,
            height: `${el.height}px`,
            cursor: draggingElement?.id === el.id ? 'grabbing' : 'grab'
          }}
          className={cn(
            "p-2 bg-slate-100/80 hover:border-primary-light transition-all overflow-hidden",
             selectedElementId === el.id ? 'border-2 border-primary ring-2 ring-primary/30 z-10' : 'border border-dashed border-muted-foreground'
          )}
        >
          {renderElementContent(el)}
        </div>
      ))}
    </div>
  );
};

export default DesignSurface;
