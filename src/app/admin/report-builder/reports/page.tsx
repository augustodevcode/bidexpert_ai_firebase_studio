// src/app/admin/report-builder/reports/page.tsx
/**
 * @fileoverview Página principal de listagem de relatórios customizados.
 * Exibe todos os relatórios do usuário com ações de CRUD e acesso aos templates.
 */
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSpreadsheet } from 'lucide-react';
import ReportListClient from './report-list-client';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Meus Relatórios | BidExpert Admin',
  description: 'Gerencie e crie relatórios personalizados',
};

function ReportListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}

export default function ReportBuilderReportsPage() {
  return (
    <div className="space-y-6" data-ai-id="report-builder-reports-page">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <FileSpreadsheet className="h-6 w-6 mr-2 text-primary" />
            Meus Relatórios
          </CardTitle>
          <CardDescription>
            Crie, gerencie e exporte relatórios personalizados. 
            Use templates predefinidos ou crie do zero com o assistente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<ReportListSkeleton />}>
            <ReportListClient />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
