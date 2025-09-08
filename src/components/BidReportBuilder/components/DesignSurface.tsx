// components/BidReportBuilder/components/DesignSurface.tsx
'use client';
import React from 'react';
import { useDrop } from 'react-dnd';
import { cn } from '@/lib/utils';

interface Element {
  id: string;
  type: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DesignSurfaceProps {
  elements: Element[];
  onAddElement: (type: string, x: number, y: number, content?: string) => void;
  onSelectElement: (element: Element | null) => void;
  selectedElementId: string | null;
}

// Design surface where the report elements are dragged.
const DesignSurface: React.FC<DesignSurfaceProps> = ({ elements, onAddElement, onSelectElement, selectedElementId }) => {
  const surfaceRef = React.useRef<HTMLDivElement>(null);

  const [, drop] = useDrop(() => ({
    accept: 'REPORT_ELEMENT',
    drop: (item: { type: string; content?: string }, monitor) => {
      const offset = monitor.getClientOffset();
      if (offset && surfaceRef.current) {
        const surfaceRect = surfaceRef.current.getBoundingClientRect();
        const x = offset.x - surfaceRect.left;
        const y = offset.y - surfaceRect.top;
        onAddElement(item.type, x, y, item.content);
      }
    },
  }));

  // Attach the ref to the drop target
  drop(surfaceRef);

  return (
    <div 
        ref={surfaceRef} 
        data-ai-id="report-design-surface"
        className="relative w-full h-full bg-white shadow-inner overflow-auto p-4" 
        style={{ cursor: 'crosshair', backgroundImage: 'radial-gradient(circle, #E5E5E5 1px, transparent 1px)', backgroundSize: '15px 15px' }}
        onClick={() => onSelectElement(null)} // Deselect when clicking outside
    >
      <h2 className="text-center text-sm text-muted-foreground sr-only">Área de Design</h2>
       {elements.map((el) => (
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
          data-ai-id={`report-element-${el.id}`}
        >
          <p className="text-xs truncate pointer-events-none">{el.content} ({el.type})</p>
        </div>
      ))}
    </div>
  );
};

export default DesignSurface;
