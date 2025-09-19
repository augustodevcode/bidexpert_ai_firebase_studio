// components/BidReportBuilder/components/BarraFerramentas.jsx
'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Text, BarChart, Image as ImageIcon, GanttChartSquare, Save, FolderOpen, FileOutput } from 'lucide-react';
import { useDrag } from 'react-dnd';

const BotaoFerramenta = ({ label, icon, elementType }) => {
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
            size="icon"
            className={`cursor-grab ${isDragging ? 'opacity-50' : 'opacity-100'}`}
            aria-label={label}
          >
            {React.createElement(icon, { className: "h-5 w-5" })}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const BarraFerramentas = ({ onSave, onLoad, onExport }) => {
  return (
    <div className="flex flex-col items-center gap-2 p-2 border-r bg-card" data-ai-id="report-toolbar">
        <h3 className="text-xs font-semibold text-muted-foreground mb-2">Controles</h3>
        <BotaoFerramenta label="Caixa de Texto" icon={Text} elementType="TextBox" />
        <BotaoFerramenta label="Gráfico" icon={BarChart} elementType="Chart" />
        <BotaoFerramenta label="Imagem" icon={ImageIcon} elementType="Image" />
        <BotaoFerramenta label="Tabela de Dados" icon={GanttChartSquare} elementType="Table" />
        
        <div className="mt-auto flex flex-col gap-2">
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Button variant="outline" size="icon" onClick={onSave} aria-label="Salvar"><Save className="h-5 w-5"/></Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Salvar Relatório</p></TooltipContent>
                </Tooltip>
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={onLoad} aria-label="Carregar"><FolderOpen className="h-5 w-5"/></Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Carregar Relatório</p></TooltipContent>
                </Tooltip>
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={onExport} aria-label="Exportar"><FileOutput className="h-5 w-5"/></Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Exportar (PDF/DOCX)</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    </div>
  );
};

export default BarraFerramentas;
