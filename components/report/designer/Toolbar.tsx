// components/report/designer/Toolbar.tsx
import React from 'react';

interface ToolbarProps {
  onAddElement: (type: 'text' | 'table' | 'chart') => void;
  onViewChange: (view: 'design' | 'preview') => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onAddElement, onViewChange }) => {
  return (
    <div className="designer-toolbar" style={{ marginBottom: '8px', padding: '8px', border: '1px solid #ccc' }}>
      <button onClick={() => onAddElement('text')} style={{ marginRight: '4px' }}>Add Text</button>
      <button onClick={() => onAddElement('table')} style={{ marginRight: '4px' }}>Add Table</button>
      <button onClick={() => onAddElement('chart')} style={{ marginRight: '8px' }}>Add Chart</button>
      <button onClick={() => onViewChange('design')} style={{ marginRight: '4px' }}>Design View</button>
      <button onClick={() => onViewChange('preview')}>Preview View</button>
    </div>
  );
};

export default Toolbar;