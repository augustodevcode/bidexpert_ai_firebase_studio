
// src/app/admin/judicial-districts/analysis/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function JudicialDistrictAnalysisPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <BarChart3 className="h-6 w-6 mr-2 text-primary" />
            Análise de Performance por Comarca
          </CardTitle>
          <CardDescription>
            Visão geral do desempenho de cada comarca na plataforma.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <Alert variant="default" className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500/50">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="font-semibold">Em Desenvolvimento</AlertTitle>
        <AlertDescription>
          Este dashboard de análise para comarcas está planejado e será implementado em breve.
        </AlertDescription>
      </Alert>
    </div>
  );
}
