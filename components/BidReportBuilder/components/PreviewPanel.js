// components/BidReportBuilder/components/PreviewPanel.js
'use client';
import React from 'react';

// Placeholder para o painel que mostra uma pré-visualização do relatório.
const PreviewPanel = ({ reportDefinition }) => {
  return (
    <div className="p-4 h-full overflow-y-auto">
      <h3 className="text-md font-semibold border-b pb-2 mb-2">Pré-Visualização</h3>
      <div className="bg-white p-4 shadow-sm h-full">
         {/* Renderização simulada baseada na definição do relatório */}
        {reportDefinition.elements.map(el => (
             <div key={el.id} style={{ position: 'relative', border: '1px solid #eee', padding: '4px', margin: '4px 0'}}>
                <p className="text-sm">{el.content} (Tipo: {el.type})</p>
             </div>
        ))}
      </div>
    </div>
  );
};

export default PreviewPanel;
