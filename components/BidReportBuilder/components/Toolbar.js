// components/BidReportBuilder/components/Toolbar.js
'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Text, BarChart, Image as ImageIcon, GanttChartSquare, Save, Eye, FileOutput } from 'lucide-react';
import { useDrag } from 'react-dnd';


const ToolbarButton = ({ label, icon, elementType, onAddElement }) => {
   const [{ isDragging }, drag] = useDrag(() => ({
    type: 'REPORT_ELEMENT',
    item: { type: elementType },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <Button ref={drag} variant="outline" size="sm" onClick={() => onAddElement(elementType)} className="h-8">
        {React.createElement(icon, {className: "h-4 w-4 mr-2"})}
        {label}
    </Button>
  );
};

// Placeholder para a barra de ferramentas com botões para adicionar elementos.
const Toolbar = ({ onAddElement }) => {
  return (
    <div className="p-2 border-b flex items-center gap-2 flex-wrap bg-background rounded-t-lg">
      <div className="flex items-center gap-2 border-r pr-2">
         <ToolbarButton label="Texto" icon={Text} elementType="TextBox" onAddElement={onAddElement}/>
         <ToolbarButton label="Gráfico" icon={BarChart} elementType="Chart" onAddElement={onAddElement}/>
         <ToolbarButton label="Imagem" icon={ImageIcon} elementType="Image" onAddElement={onAddElement}/>
         <ToolbarButton label="Tabela" icon={GanttChartSquare} elementType="Table" onAddElement={onAddElement}/>
      </div>
       <div className="flex items-center gap-2 ml-auto">
         <Button variant="ghost" size="sm" className="h-8"><Save className="h-4 w-4 mr-2" /> Salvar</Button>
         <Button variant="ghost" size="sm" className="h-8"><Eye className="h-4 w-4 mr-2" /> Visualizar</Button>
         <Button variant="default" size="sm" className="h-8"><FileOutput className="h-4 w-4 mr-2" /> Exportar PDF</Button>
      </div>
    </div>
  );
};

export default Toolbar;
