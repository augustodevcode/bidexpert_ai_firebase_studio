// src/app/admin/report-builder/page.tsx
import BidReportBuilder from '@/components/BidReportBuilder/index.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardCheck } from 'lucide-react';

export default function ReportBuilderPage() {
  return (
    <div className="space-y-6 h-full">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <ClipboardCheck className="h-6 w-6 mr-2 text-primary" />
            Construtor de Relatórios
          </CardTitle>
          <CardDescription>
            Crie, personalize e exporte relatórios de forma intuitiva e assistida por IA.
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="h-[calc(100vh-12rem)]">
        <BidReportBuilder />
      </div>
    </div>
  );
}
