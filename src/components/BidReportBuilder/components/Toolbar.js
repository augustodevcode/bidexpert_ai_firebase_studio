// components/BidReportBuilder/components/Toolbar.js
'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Text, BarChart, Image as ImageIcon, GanttChartSquare, Save, Eye, FileOutput } from 'lucide-react';
import { useDrag } from 'react-dnd';

const ToolbarButton = ({ label, icon, elementType }: { label: string, icon: React.ElementType, elementType: string }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'REPORT_ELEMENT',
    item: { type: elementType },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div ref={drag} className="cursor-grab active:cursor-grabbing" style={{ opacity: isDragging ? 0.5 : 1 }}>
        <Button variant="outline" size="sm" className="h-9 pointer-events-none">
            {React.createElement(icon, { className: "h-4 w-4 mr-2" })}
            {label}
        </Button>
    </div>
  );
};


// Barra de ferramentas com botões para adicionar elementos.
const Toolbar = () => {
  return (
    <div className="p-2 border-b flex items-center gap-2 flex-wrap bg-background rounded-t-lg">
      <div className="flex items-center gap-2 border-r pr-2">
         <ToolbarButton label="Texto" icon={Text} elementType="TextBox" />
         <ToolbarButton label="Gráfico" icon={BarChart} elementType="Chart" />
         <ToolbarButton label="Imagem" icon={ImageIcon} elementType="Image" />
         <ToolbarButton label="Tabela" icon={GanttChartSquare} elementType="Table" />
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
