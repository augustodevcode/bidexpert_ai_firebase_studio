// src/app/admin/report-builder/page.tsx
/**
 * @fileoverview Página principal do Report Builder.
 * Exibe o designer de relatórios e acesso rápido a templates.
 */

import { Suspense } from 'react';
import BidReportBuilder from '@/components/BidReportBuilder';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FileSpreadsheet, FileText, BarChart3, Users, Briefcase } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Import templates
import { 
  ALL_REPORT_TEMPLATES, 
  JUDICIAL_TEMPLATES, 
  EXTRAJUDICIAL_TEMPLATES,
  ADMIN_TEMPLATES,
  FINANCIAL_TEMPLATES,
  OPERATIONAL_TEMPLATES,
  type ReportTemplate 
} from '@/lib/report-templates';

export default function ReportBuilderPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            Report Builder
          </h1>
          <p className="text-muted-foreground mt-1">
            Crie, personalize e exporte relatórios para leilões judiciais e extrajudiciais.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/report-builder/reports">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Meus Relatórios
            </Button>
          </Link>
          <Link href="/admin/report-builder/reports?tab=templates">
            <Button>
              <BarChart3 className="h-4 w-4 mr-2" />
              Templates
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Access Templates */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">Todos ({ALL_REPORT_TEMPLATES.length})</TabsTrigger>
          <TabsTrigger value="judicial">Judicial ({JUDICIAL_TEMPLATES.length})</TabsTrigger>
          <TabsTrigger value="extrajudicial">Extrajudicial ({EXTRAJUDICIAL_TEMPLATES.length})</TabsTrigger>
          <TabsTrigger value="admin">Administrativo ({ADMIN_TEMPLATES.length})</TabsTrigger>
          <TabsTrigger value="financial">Financeiro ({FINANCIAL_TEMPLATES.length})</TabsTrigger>
          <TabsTrigger value="operational">Operacional ({OPERATIONAL_TEMPLATES.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <TemplateGrid templates={ALL_REPORT_TEMPLATES.slice(0, 8)} />
        </TabsContent>
        <TabsContent value="judicial">
          <TemplateGrid templates={JUDICIAL_TEMPLATES} />
        </TabsContent>
        <TabsContent value="extrajudicial">
          <TemplateGrid templates={EXTRAJUDICIAL_TEMPLATES} />
        </TabsContent>
        <TabsContent value="admin">
          <TemplateGrid templates={ADMIN_TEMPLATES} />
        </TabsContent>
        <TabsContent value="financial">
          <TemplateGrid templates={FINANCIAL_TEMPLATES} />
        </TabsContent>
        <TabsContent value="operational">
          <TemplateGrid templates={OPERATIONAL_TEMPLATES} />
        </TabsContent>
      </Tabs>

      {/* Designer */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center">
            <FileSpreadsheet className="h-5 w-5 mr-2 text-primary" />
            Designer de Relatórios
          </CardTitle>
          <CardDescription>
            Arraste e solte elementos para criar seu relatório personalizado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
            <BidReportBuilder />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

// Template Grid Component
function TemplateGrid({ templates }: { templates: ReportTemplate[] }) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'JUDICIAL': return <Briefcase className="h-4 w-4" />;
      case 'EXTRAJUDICIAL': return <FileText className="h-4 w-4" />;
      case 'ADMINISTRATIVO': return <Users className="h-4 w-4" />;
      case 'FINANCEIRO': return <BarChart3 className="h-4 w-4" />;
      default: return <FileSpreadsheet className="h-4 w-4" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
      {templates.map((template) => (
        <Card 
          key={template.id} 
          className="hover:shadow-md transition-shadow cursor-pointer group"
        >
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                {getCategoryIcon(template.category)}
              </div>
              <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-full">
                {template.type}
              </span>
            </div>
            <CardTitle className="text-sm font-medium mt-2 line-clamp-1">
              {template.name}
            </CardTitle>
            <CardDescription className="text-xs line-clamp-2">
              {template.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-2">
              <Link href={`/admin/report-builder/viewer/${template.id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  Visualizar
                </Button>
              </Link>
              <Link href={`/admin/report-builder/reports?copy=${template.id}`}>
                <Button variant="ghost" size="sm">
                  Usar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
