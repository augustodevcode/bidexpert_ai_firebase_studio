import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot } from 'lucide-react';

const AIPanel = ({ onGetAIAssistance }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center"><Bot className="h-5 w-5 mr-2"/> Assistente IA</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
            <Input placeholder="Descreva o relatório que você precisa..."/>
            <Button size="sm" className="w-full">Gerar Relatório</Button>
        </div>
        <div className="space-y-1">
            <Button size="sm" variant="outline" className="w-full">Sugerir Gráfico</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIPanel;
