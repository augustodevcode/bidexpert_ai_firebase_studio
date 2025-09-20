// src/components/BidReportBuilder/components/Toolbar.tsx
'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Text, BarChart, Image as ImageIcon, GanttChartSquare, Save, FolderOpen, FileOutput } from 'lucide-react';
import { useDrag } from 'react-dnd';

interface ToolbarButtonProps {
  label: string;
  icon: React.ElementType;
  elementType: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ label, icon: Icon, elementType }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'REPORT_ELEMENT',
    item: { type: elementType },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            ref={drag}
            variant="ghost"
            size="sm"
            className={`h-9 cursor-grab ${isDragging ? 'opacity-50' : 'opacity-100'}`}
            aria-label={label}
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
    onSave: () => void;
    onLoad: () => void;
    onExport: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onSave, onLoad, onExport }) => {
  return (
    <div className="p-2 border-b flex items-center gap-2 flex-wrap bg-card rounded-t-lg" data-ai-id="report-toolbar">
      <div className="flex items-center gap-1 border-r pr-2 mr-2">
         <ToolbarButton label="Texto" icon={Text} elementType="TextBox" />
         <ToolbarButton label="Gráfico" icon={BarChart} elementType="Chart" />
         <ToolbarButton label="Imagem" icon={ImageIcon} elementType="Image" />
         <ToolbarButton label="Tabela" icon={GanttChartSquare} elementType="Table" />
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
