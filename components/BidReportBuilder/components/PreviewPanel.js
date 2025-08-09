import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PreviewPanel = ({ reportUrl }) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Pré-Visualização</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-full w-full border rounded-lg flex items-center justify-center bg-gray-50">
          <p className="text-gray-400">A pré-visualização do relatório aparecerá aqui.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PreviewPanel;
