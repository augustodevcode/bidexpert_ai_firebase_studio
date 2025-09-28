// components/BidReportBuilder/components/PropertiesPanel.js
'use client';
import React from 'react';

// Placeholder para o painel que exibe e edita as propriedades de um elemento selecionado.
const PropertiesPanel = ({ selectedElement, onElementChange }) => {
  if (!selectedElement) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Selecione um elemento para ver suas propriedades.
      </div>
    );
  }
  
  const handleContentChange = (e) => {
    onElementChange(selectedElement.id, { content: e.target.value });
  };
  
  const handleXChange = (e) => {
    onElementChange(selectedElement.id, { x: parseInt(e.target.value, 10) });
  };
  
  const handleYChange = (e) => {
    onElementChange(selectedElement.id, { y: parseInt(e.target.value, 10) });
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-md font-semibold border-b pb-2">Propriedades</h3>
      <div className="space-y-2 text-sm">
        <div>
          <label className="text-xs font-medium">ID</label>
          <input type="text" readOnly value={selectedElement.id} className="w-full p-1 border rounded bg-muted text-muted-foreground text-xs" />
        </div>
         <div>
          <label className="text-xs font-medium">Tipo</label>
          <input type="text" readOnly value={selectedElement.type} className="w-full p-1 border rounded bg-muted text-muted-foreground text-xs" />
        </div>
        <div>
          <label className="text-xs font-medium">Conteúdo</label>
          <textarea value={selectedElement.content} onChange={handleContentChange} className="w-full p-1 border rounded text-xs" rows="3" />
        </div>
         <div>
          <label className="text-xs font-medium">Posição X</label>
          <input type="number" value={selectedElement.x} onChange={handleXChange} className="w-full p-1 border rounded text-xs" />
        </div>
         <div>
          <label className="text-xs font-medium">Posição Y</label>
          <input type="number" value={selectedElement.y} onChange={handleYChange} className="w-full p-1 border rounded text-xs" />
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;
