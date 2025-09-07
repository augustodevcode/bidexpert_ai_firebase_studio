// src/app/admin/report-builder/page.tsx
import BidReportBuilder from '@/components/BidReportBuilder';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FileSpreadsheet } from 'lucide-react';

export default function ReportBuilderPage() {
  return (
    <div className="space-y-6" data-ai-id="report-builder-page-container">
       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <FileSpreadsheet className="h-6 w-6 mr-2 text-primary" />
            Construtor de Relatórios
          </CardTitle>
          <CardDescription>
            Crie, personalize e visualize relatórios de forma interativa.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <BidReportBuilder />
        </CardContent>
      </Card>
    </div>
  );
}
