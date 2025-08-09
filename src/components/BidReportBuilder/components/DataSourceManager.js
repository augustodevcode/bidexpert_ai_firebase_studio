import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DataSourceManager = ({ onSelectDataSource }) => {
  const dataSources = [
    { id: '1', name: 'Leilões Ativos' },
    { id: '2', name: 'Lotes Vendidos' },
    { id: '3', name: 'Usuários Cadastrados' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Fontes de Dados</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {dataSources.map(ds => (
            <li key={ds.id} className="text-sm p-1.5 rounded hover:bg-accent cursor-pointer" onClick={() => onSelectDataSource(ds)}>
              {ds.name}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default DataSourceManager;
