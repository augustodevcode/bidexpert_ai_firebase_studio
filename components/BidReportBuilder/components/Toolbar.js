import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, BarChart, Type, Image as ImageIcon, FileText, Save, FolderOpen, Download } from 'lucide-react';

const Toolbar = ({ onAddElement, onSaveReport, onLoadReport, onExportReport }) => {
  return (
    <div className="p-2 border rounded-lg bg-card">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => onAddElement('Table')}><Table className="h-4 w-4 mr-1" /> Tabela</Button>
        <Button variant="outline" size="sm" onClick={() => onAddElement('Chart')}><BarChart className="h-4 w-4 mr-1" /> Gráfico</Button>
        <Button variant="outline" size="sm" onClick={() => onAddElement('TextBox')}><Type className="h-4 w-4 mr-1" /> Texto</Button>
        <Button variant="outline" size="sm" onClick={() => onAddElement('Image')}><ImageIcon className="h-4 w-4 mr-1" /> Imagem</Button>
        <Button variant="outline" size="sm" onClick={() => onAddElement('RichText')}><FileText className="h-4 w-4 mr-1" /> Rich Text</Button>
      </div>
      <hr className="my-2" />
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={onSaveReport}><Save className="h-4 w-4 mr-1" /> Salvar</Button>
        <Button variant="secondary" size="sm" onClick={onLoadReport}><FolderOpen className="h-4 w-4 mr-1" /> Carregar</Button>
        <Button variant="secondary" size="sm" onClick={() => onExportReport('pdf')}><Download className="h-4 w-4 mr-1" /> Exportar</Button>
      </div>
    </div>
  );
};

export default Toolbar;
