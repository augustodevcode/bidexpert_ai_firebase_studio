// components/BidReportBuilder/components/VariablePanel.tsx
'use client';
import React from 'react';
import { useDrag } from 'react-dnd';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

interface Variable {
    name: string;
    value: string;
    group: string;
}

const availableVariables: Variable[] = [
    { name: "ID do Leilão", value: "{{auction.id}}", group: "Leilão" },
    { name: "Título do Leilão", value: "{{auction.title}}", group: "Leilão" },
    { name: "Data do Leilão", value: "{{auction.date}}", group: "Leilão" },
    { name: "Nome do Lote", value: "{{lot.name}}", group: "Lote" },
    { name: "Descrição do Lote", value: "{{lot.description}}", group: "Lote" },
    { name: "Lance Vencedor", value: "{{winningBid.amount}}", group: "Lance" },
    { name: "Nome do Comprador", value: "{{buyer.name}}", group: "Comprador" },
    { name: "Data Atual", value: "{{report.currentDate}}", group: "Relatório" },
    { name: "Total de Lotes", value: "{{report.totalLots}}", group: "Relatório" },
];

const groupedVariables = availableVariables.reduce((acc, variable) => {
    if (!acc[variable.group]) {
        acc[variable.group] = [];
    }
    acc[variable.group].push(variable);
    return acc;
}, {} as Record<string, Variable[]>);

interface DraggableVariableProps {
  name: string;
  value: string;
}

const DraggableVariable: React.FC<DraggableVariableProps> = ({ name, value }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'REPORT_ELEMENT',
    item: { type: 'TextBox', content: value },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div ref={drag} className={`p-1.5 border rounded-md cursor-grab ${isDragging ? 'opacity-50' : 'opacity-100'} flex justify-between items-center`}>
      <span className="text-xs font-mono">{name}</span>
      <Badge variant="outline" className="text-xs">Arrastar</Badge>
    </div>
  );
};

const VariablePanel = () => {
  return (
    <div className="p-2 border-l bg-card" data-ai-id="report-variable-panel">
      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Variáveis Dinâmicas</h3>
      <Accordion type="multiple" defaultValue={Object.keys(groupedVariables)} className="w-full">
        {Object.entries(groupedVariables).map(([group, variables]) => (
          <AccordionItem key={group} value={group}>
            <AccordionTrigger className="text-xs font-medium">{group}</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {variables.map(variable => (
                  <DraggableVariable key={variable.name} name={variable.name} value={variable.value} />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default VariablePanel;
