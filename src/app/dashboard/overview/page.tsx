
// Placeholder for /dashboard/overview page
// This page will be developed further based on user stories.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, CheckSquare, Clock, UserCircle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <UserCircle className="h-7 w-7 mr-3 text-primary" />
            Visão Geral do Dashboard
          </CardTitle>
          <CardDescription>
            Bem-vindo ao seu painel BidExpert. Aqui você pode gerenciar suas atividades.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Esta é uma área em desenvolvimento. Em breve, você verá aqui um resumo dos seus lances ativos, arremates, status da conta e outras informações importantes.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/dashboard/bids" className="block hover:no-underline">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Meus Lances</CardTitle>
                  <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0 Ativos</div>
                  <p className="text-xs text-muted-foreground">
                    Acompanhe seus lances em andamento.
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/wins" className="block hover:no-underline">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Meus Arremates</CardTitle>
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0 Ganhos</div>
                  <p className="text-xs text-muted-foreground">
                    Veja os lotes que você arrematou.
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/documents" className="block hover:no-underline">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Meus Documentos</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Pendente</div>
                  <p className="text-xs text-muted-foreground">
                    Verifique o status da sua habilitação.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
