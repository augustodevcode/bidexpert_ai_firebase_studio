// src/components/BidReportBuilder/components/Toolbar.tsx
'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Text, BarChart, Image as ImageIcon, GanttChartSquare, Save, FolderOpen, FileOutput } from 'lucide-react';

interface ToolbarButtonProps {
  label: string;
  icon: React.ElementType;
  elementType: string;
  onAdd: (type: string) => void;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ label, icon: Icon, elementType, onAdd }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-9"
            aria-label={label}
            onClick={() => onAdd(elementType)}
          >
            <Icon className="h-4 w-4 mr-1.5" />
            {label}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Adicionar {label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface ToolbarProps {
    onAddElement: (type: string) => void;
    onSave: () => void;
    onLoad: () => void;
    onExport: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onAddElement, onSave, onLoad, onExport }) => {
  return (
    <div className="p-2 border-b flex items-center gap-2 flex-wrap bg-card rounded-t-lg" data-ai-id="report-toolbar">
      <div className="flex items-center gap-1 border-r pr-2 mr-2">
         <ToolbarButton label="Texto" icon={Text} elementType="TextBox" onAdd={onAddElement} />
         <ToolbarButton label="Gráfico" icon={BarChart} elementType="Chart" onAdd={onAddElement} />
         <ToolbarButton label="Imagem" icon={ImageIcon} elementType="Image" onAdd={onAddElement} />
         <ToolbarButton label="Tabela" icon={GanttChartSquare} elementType="Table" onAdd={onAddElement} />
      </div>
       <div className="flex items-center gap-1 ml-auto">
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onSave} aria-label="Salvar"><Save className="h-5 w-5"/></Button>
                </TooltipTrigger>
                <TooltipContent><p>Salvar Relatório</p></TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onLoad} aria-label="Carregar"><FolderOpen className="h-5 w-5"/></Button>
                </TooltipTrigger>
                <TooltipContent><p>Carregar Relatório</p></TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="default" size="sm" onClick={onExport} aria-label="Exportar"><FileOutput className="h-4 w-4 mr-2" /> Exportar</Button>
                </TooltipTrigger>
                <TooltipContent><p>Exportar (PDF/DOCX)</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default Toolbar;
