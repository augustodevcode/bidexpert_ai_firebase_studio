// src/components/BidReportBuilder/components/DataSourceManager.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getDataSourcesAction } from '@/app/admin/datasources/actions';
import type { DataSource } from '@prisma/client';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DraggableVariableProps {
  name: string;
  value: string;
}

const DraggableVariable: React.FC<DraggableVariableProps> = ({ name, value }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', value);
  };
    
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="p-2 border rounded-md bg-secondary/60 hover:bg-secondary cursor-grab active:cursor-grabbing text-xs"
      title={`Arraste para adicionar a variável ${name}`}
      data-ai-id={`draggable-variable-${name.toLowerCase().replace(/\s/g, '-')}`}
    >
      <p className="font-medium text-foreground truncate">{name}</p>
      <p className="text-muted-foreground font-mono truncate">{value}</p>
    </div>
  );
};


interface DataSourceManagerProps {
    onAddElement: (type: string, x?: number, y?: number, content?: string) => void;
}


export default function DataSourceManager({ onAddElement }: DataSourceManagerProps) {
    const [dataSources, setDataSources] = useState<DataSource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const sources = await getDataSourcesAction();
                setDataSources(sources);
            } catch (error) {
                console.error("Failed to fetch data sources:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredDataSources = React.useMemo(() => {
        if (!searchTerm) return dataSources;
        const lowercasedFilter = searchTerm.toLowerCase();

        return dataSources.map(source => {
            const fields = (source.fields as any[]).filter(field =>
                field.name.toLowerCase().includes(lowercasedFilter) ||
                source.name.toLowerCase().includes(lowercasedFilter)
            );
            return { ...source, fields };
        }).filter(source => source.fields.length > 0);

    }, [searchTerm, dataSources]);
    
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 h-full flex flex-col" data-ai-id="report-data-source-manager">
            <h3 className="text-md font-semibold border-b pb-2 mb-2">Fontes de Dados</h3>
             <Input 
                placeholder="Buscar variável..." 
                className="mb-3 h-8 text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-ai-id="data-source-search-input"
            />
            <ScrollArea className="flex-grow">
                <Accordion type="multiple" defaultValue={dataSources.map(ds => ds.modelName)} className="w-full">
                    {filteredDataSources.map(source => (
                        <AccordionItem value={source.modelName} key={source.modelName} data-ai-id={`datasource-group-${source.modelName}`}>
                            <AccordionTrigger className="text-sm py-2">{source.name}</AccordionTrigger>
                            <AccordionContent className="space-y-2">
                                {(source.fields as any[]).map(field => (
                                     <DraggableVariable 
                                        key={`${source.modelName}.${field.name}`} 
                                        name={field.name} 
                                        value={`{{${source.modelName}.${field.name}}}`}
                                     />
                                ))}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </ScrollArea>
        </div>
    );
};
