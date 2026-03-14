/**
 * @fileoverview Painel cliente que carrega o designer do Report Builder sob demanda.
 */
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { FileSpreadsheet, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const BidReportBuilder = dynamic(() => import('@/components/BidReportBuilder'), {
  ssr: false,
  loading: () => <Skeleton className="h-[600px] w-full" />,
});

export default function ReportBuilderDesignerPanel() {
  const [isDesignerVisible, setIsDesignerVisible] = useState(false);

  return (
    <Card className="shadow-lg" data-ai-id="report-builder-designer-panel">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center">
          <FileSpreadsheet className="h-5 w-5 mr-2 text-primary" />
          Designer de Relatórios
        </CardTitle>
        <CardDescription>
          Carregue o editor visual apenas quando precisar montar ou ajustar um relatório.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isDesignerVisible ? (
          <div className="rounded-lg border border-dashed p-6" data-ai-id="report-builder-designer-placeholder">
            <p className="text-sm text-muted-foreground">
              O designer completo usa um bundle grande e foi movido para carregamento sob demanda para manter o admin estável durante a navegação e os testes E2E.
            </p>
            <Button className="mt-4" onClick={() => setIsDesignerVisible(true)} data-ai-id="report-builder-load-designer-button">
              <PlayCircle className="h-4 w-4 mr-2" />
              Carregar designer
            </Button>
          </div>
        ) : (
          <BidReportBuilder />
        )}
      </CardContent>
    </Card>
  );
}