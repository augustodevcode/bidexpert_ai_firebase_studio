// components/BidReportBuilder/components/PainelPropriedades.js
'use client';
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Painel que exibe e edita as propriedades de um elemento selecionado.
const PainelPropriedades = ({ selectedElement, onElementChange }) => {
  if (!selectedElement) {
    return (
      <div className="p-4 text-sm text-muted-foreground h-full flex items-center justify-center text-center">
        Selecione um elemento na área de design para ver suas propriedades.
      </div>
    );
  }
  
  // Handlers para cada propriedade
  const handleChange = (prop, value) => {
    // Para inputs numéricos, garantir que o valor seja um número
    const finalValue = ['x', 'y', 'width', 'height'].includes(prop) ? parseInt(value, 10) || 0 : value;
    onElementChange(selectedElement.id, { [prop]: finalValue });
  };
  
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-md font-semibold border-b pb-2">Propriedades</h3>
      <div className="space-y-3 text-sm">
        <div>
          <Label htmlFor="prop-id" className="text-xs font-medium">ID do Elemento</Label>
          <Input id="prop-id" type="text" readOnly value={selectedElement.id} className="w-full p-1 border rounded bg-muted text-muted-foreground text-xs" />
        </div>
         <div>
          <Label htmlFor="prop-type" className="text-xs font-medium">Tipo</Label>
          <Input id="prop-type" type="text" readOnly value={selectedElement.type} className="w-full p-1 border rounded bg-muted text-muted-foreground text-xs" />
        </div>
        <div>
          <Label htmlFor="prop-content" className="text-xs font-medium">Conteúdo</Label>
          <Textarea 
            id="prop-content"
            value={selectedElement.content} 
            onChange={(e) => handleChange('content', e.target.value)} 
            className="w-full p-1 border rounded text-xs" 
            rows="3" 
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
            <div>
            <Label htmlFor="prop-x" className="text-xs font-medium">Posição X</Label>
            <Input id="prop-x" type="number" value={selectedElement.x} onChange={(e) => handleChange('x', e.target.value)} className="w-full p-1 border rounded text-xs" />
            </div>
            <div>
            <Label htmlFor="prop-y" className="text-xs font-medium">Posição Y</Label>
            <Input id="prop-y" type="number" value={selectedElement.y} onChange={(e) => handleChange('y', e.target.value)} className="w-full p-1 border rounded text-xs" />
            </div>
        </div>
         <div className="grid grid-cols-2 gap-2">
            <div>
            <Label htmlFor="prop-width" className="text-xs font-medium">Largura (px)</Label>
            <Input id="prop-width" type="number" value={selectedElement.width} onChange={(e) => handleChange('width', e.target.value)} className="w-full p-1 border rounded text-xs" />
            </div>
            <div>
            <Label htmlFor="prop-height" className="text-xs font-medium">Altura (px)</Label>
            <Input id="prop-height" type="number" value={selectedElement.height} onChange={(e) => handleChange('height', e.target.value)} className="w-full p-1 border rounded text-xs" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default PainelPropriedades;
