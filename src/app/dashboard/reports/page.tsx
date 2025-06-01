
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <BarChart className="h-7 w-7 mr-3 text-primary" />
            Relatórios
          </CardTitle>
          <CardDescription>
            Histórico detalhado e estatísticas de sua atividade na plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12 bg-secondary/30 rounded-lg">
          <h3 className="text-xl font-semibold text-muted-foreground">Em Desenvolvimento</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Esta seção fornecerá relatórios sobre seus lances, arremates, vendas e outras atividades.
          </p>
          <Button variant="outline" className="mt-6" asChild>
            <Link href="/dashboard/overview">Voltar para Visão Geral</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
