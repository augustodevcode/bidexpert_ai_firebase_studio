import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PropertiesPanel = ({ selectedElement }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Propriedades</CardTitle>
      </CardHeader>
      <CardContent>
        {selectedElement ? (
          <div>
            <p>Elemento selecionado: {selectedElement.type}</p>
            {/* Properties fields will go here */}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Selecione um elemento para ver suas propriedades.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertiesPanel;
