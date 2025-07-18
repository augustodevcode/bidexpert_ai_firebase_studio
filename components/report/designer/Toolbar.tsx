// components/report/designer/Toolbar.tsx
import React from 'react';
import { useDrag } from 'react-dnd';

// Note: onAddElement with clientOffset is not directly used here, but remains for potential future use or clarification in DesignCanvas drop
interface ToolbarProps {
 onAddElement: (type: 'text' | 'table' | 'chart', clientOffset: { x: number; y: number }) => void;
 onViewChange: (view: 'design' | 'preview') => void;
  onNewReport: () => void;
  onOpenReport: () => void;
  onSaveReport: () => void;
  onSaveAsReport: () => void;
  onExportPdf: () => void; // Add new prop for PDF export
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
        marginBottom: '4px', // Keep some margin for vertical flow if needed
        display: 'inline-block', // To make buttons appear side by side
        marginRight: '4px', // Space between draggable elements
 }}
 >
 {label}
 </div>
 );
};

const Toolbar: React.FC<ToolbarProps> = ({
  onAddElement, // Note: onAddElement with clientOffset is not directly used here, but remains for potential future use or clarification in DesignCanvas drop
  onViewChange,
  onNewReport,
  onOpenReport,
  onSaveReport,
  onSaveAsReport,
  onExportPdf, // Destructure new prop
}) => {
  return (
    <div className="toolbar" style={{ marginBottom: '8px', padding: '8px', border: '1px solid #ccc' }}>
      {/* Report Actions */}
      <button onClick={onNewReport}>New</button>
      <button onClick={onOpenReport}>Open</button>
      <button onClick={onSaveReport}>Save</button>
      <button onClick={onSaveAsReport}>Save As</button>

      {/* View Toggles */}
      <button onClick={() => onViewChange('design')}>Design View</button>
      <button onClick={() => onViewChange('preview')}>Preview View</button>

      {/* Export Actions */}
      <button onClick={onExportPdf}>Export as PDF</button> {/* Add Export button */}

      {/* Draggable Elements */}
      <span style={{ marginLeft: '16px', marginRight: '4px' }}>Add Elements:</span> {/* Added spacing */}
      <DraggableElementType type="text" label="Text" />
      <DraggableElementType type="table" label="Table" />
      <DraggableElementType type="chart" label="Chart" />
    </div>
  );
};

export default Toolbar;