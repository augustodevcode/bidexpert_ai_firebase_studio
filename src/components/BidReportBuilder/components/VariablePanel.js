// components/BidReportBuilder/components/VariablePanel.js
'use client';
import React, { useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Dados de exemplo para as variáveis
const sampleVariables = [
    { group: 'Leilão', items: [
        { name: 'Nome do Leilão', value: '{{leilao.nome}}' },
        { name: 'Data de Início', value: '{{leilao.dataInicio}}' },
        { name: 'Status', value: '{{leilao.status}}' },
        { name: 'Leiloeiro', value: '{{leilao.leiloeiro.nome}}' },
    ]},
    { group: 'Lote', items: [
        { name: 'Número do Lote', value: '{{lote.numero}}' },
        { name: 'Título do Lote', value: '{{lote.titulo}}' },
        { name: 'Lance Inicial', value: '{{lote.lanceInicial}}' },
        { name: 'Lance Atual', value: '{{lote.lanceAtual}}' },
    ]},
    { group: 'Comitente', items: [
        { name: 'Nome do Comitente', value: '{{comitente.nome}}' },
        { name: 'Cidade do Comitente', value: '{{comitente.cidade}}' },
    ]},
     { group: 'Geral', items: [
        { name: 'Data Atual', value: '{{geral.dataAtual}}' },
        { name: 'Página Atual', value: '{{geral.pagina}}' },
    ]}
];

const DraggableVariable = ({ name, value }: { name: string; value: string; }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'REPORT_ELEMENT',
    item: { type: 'TextBox', content: value },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className="p-2 border rounded-md bg-secondary/60 hover:bg-secondary cursor-grab active:cursor-grabbing text-xs"
      style={{ opacity: isDragging ? 0.5 : 1 }}
      title={`Arraste para adicionar a variável ${name}`}
    >
      <p className="font-medium text-foreground truncate">{name}</p>
      <p className="text-muted-foreground font-mono truncate">{value}</p>
    </div>
  );
};


// Painel que exibe e permite arrastar variáveis de dados para o relatório.
const VariablePanel = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredVariables, setFilteredVariables] = useState(sampleVariables);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredVariables(sampleVariables);
            return;
        }

        const lowercasedFilter = searchTerm.toLowerCase();
        const filtered = sampleVariables.map(group => {
            const items = group.items.filter(item => 
                item.name.toLowerCase().includes(lowercasedFilter) || 
                item.value.toLowerCase().includes(lowercasedFilter)
            );
            return { ...group, items };
        }).filter(group => group.items.length > 0);

        setFilteredVariables(filtered);
    }, [searchTerm]);

    return (
        <div className="p-4 h-full flex flex-col">
            <h3 className="text-md font-semibold border-b pb-2 mb-2">Variáveis</h3>
             <Input 
                placeholder="Buscar variável..." 
                className="mb-3 h-8 text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <ScrollArea className="flex-grow">
                <Accordion type="multiple" defaultValue={sampleVariables.map(g => g.group)} className="w-full">
                    {filteredVariables.map(group => (
                        <AccordionItem value={group.group} key={group.group}>
                            <AccordionTrigger className="text-sm py-2">{group.group}</AccordionTrigger>
                            <AccordionContent className="space-y-2">
                                {group.items.map(item => (
                                    <DraggableVariable key={item.value} name={item.name} value={item.value} />
                                ))}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </ScrollArea>
        </div>
    );
};

export default VariablePanel;
