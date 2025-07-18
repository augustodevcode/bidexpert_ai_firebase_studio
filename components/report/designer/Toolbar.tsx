// components/report/designer/Toolbar.tsx
import React from 'react';
import { useDrag } from 'react-dnd';

// Note: onAddElement with clientOffset is not directly used here, but remains for potential future use or clarification in DesignCanvas drop
interface ToolbarProps {
 onAddElement: (type: 'text' | 'table' | 'chart', clientOffset: { x: number; y: number }) => void;
 onViewChange: (view: 'design' | 'preview') => void;
}

interface DraggableElementTypeProps {
 type: 'text' | 'table' | 'chart';
 label: string;
}

const DraggableElementType: React.FC<DraggableElementTypeProps> = ({ type, label }) => {
 const [{ isDragging }, drag] = useDrag(() => ({
 type: type,
 item: { type },
 collect: (monitor) => ({
 isDragging: !!monitor.isDragging(),
 }),
 }));

 return (
 <div
 ref={drag}
 style={{
 opacity: isDragging ? 0.5 : 1,
 cursor: 'move',
 padding: '8px',
 border: '1px solid black',
 marginBottom: '4px',
 }}
 >
 {label}
 </div>
 );
};


const Toolbar: React.FC<ToolbarProps> = ({ onAddElement, onViewChange }) => {
  return (
    <div className="toolbar" style={{ marginBottom: '8px', padding: '8px', border: '1px solid #ccc' }}>
      <DraggableElementType type="text" label="Add Text" />
      <DraggableElementType type="table" label="Add Table" />
      <DraggableElementType type="chart" label="Add Chart" />
      <button onClick={() => onViewChange('design')} style={{ marginLeft: 'auto' }}>Design View</button>
      <button onClick={() => onViewChange('preview')}>Preview View</button>
      {/* Add save, load, export buttons later */}
    </div>
  );
};

export default Toolbar;