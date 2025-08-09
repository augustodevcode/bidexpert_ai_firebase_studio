'use client';
import React from 'react';
import { useDrag } from 'react-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DraggableVariable = ({ variable }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'variable',
    item: { variable },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <li ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }} className="p-1.5 border rounded text-xs cursor-move bg-background">
      {variable.name}
    </li>
  );
};

const VariablePanel = () => {
    const variables = [
        { group: 'Leilão', variables: [{ name: 'Nome do Leilão', value: '{{auction.name}}' }, { name: 'Data do Leilão', value: '{{auction.date}}' }] },
        { group: 'Lote', variables: [{ name: 'Número do Lote', value: '{{lot.number}}' }, { name: 'Descrição do Lote', value: '{{lot.description}}' }] },
        { group: 'Usuário', variables: [{ name: 'Nome do Usuário', value: '{{user.name}}' }] },
    ];

  return (
    <Card>
        <CardHeader>
            <CardTitle className="text-lg">Variáveis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
            {variables.map((group) => (
                <div key={group.group}>
                <h4 className="text-sm font-semibold mb-1">{group.group}</h4>
                <ul className="space-y-1">
                    {group.variables.map((variable) => (
                        <DraggableVariable key={variable.value} variable={variable} />
                    ))}
                </ul>
                </div>
            ))}
        </CardContent>
    </Card>
  );
};

export default VariablePanel;
