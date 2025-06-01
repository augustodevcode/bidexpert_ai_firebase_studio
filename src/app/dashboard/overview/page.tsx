
// Placeholder for /dashboard/overview page
// This page will be developed further based on user stories.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, CheckSquare, FileText, UserCircle, Bell, Settings, ShoppingBag, Gavel } from 'lucide-react';
import Link from 'next/link';

export default function DashboardOverviewPage() {
  // Placeholder data - in a real app, this would come from a backend/context
  const activeBidsCount = 3;
  const auctionsWonCount = 2;
  const documentStatus = "Pendente"; // Example: "Habilitado", "Pendente", "Rejeitado"

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <UserCircle className="h-7 w-7 mr-3 text-primary" />
            Visão Geral do Dashboard
          </CardTitle>
          <CardDescription>
            Bem-vindo ao seu painel BidExpert. Aqui você pode gerenciar suas atividades de leilão.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Link href="/dashboard/bids" className="block hover:no-underline">
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Meus Lances Ativos</CardTitle>
                  <Gavel className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{activeBidsCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Acompanhe seus lances em andamento.
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/wins" className="block hover:no-underline">
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Meus Arremates</CardTitle>
                  <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{auctionsWonCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Veja os lotes que você arrematou.
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/documents" className="block hover:no-underline">
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status da Habilitação</CardTitle>
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{documentStatus}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Verifique e gerencie seus documentos.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
          
          <CardDescription className="text-center text-muted-foreground">
            Outras seções do dashboard como "Lotes Favoritos", "Relatórios" e "Notificações" serão adicionadas em breve.
          </CardDescription>
        </CardContent>
      </Card>
      
      {/* Placeholder for Atividade Recente and Notificações as per spec 8.11.3.2 */}
       <Card className="shadow-md">
        <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
                <Bell className="h-5 w-5 mr-2 text-primary" />
                Atividade Recente e Notificações
            </CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
                Esta seção mostrará suas últimas ações (lances, arremates, envio de documentos) e notificações importantes do sistema.
                (Em desenvolvimento)
            </p>
            {/* Example activity items */}
            <ul className="mt-4 space-y-3 text-xs">
                <li className="flex items-center p-2 bg-secondary/30 rounded-md">
                    <Gavel className="h-4 w-4 mr-3 text-green-500"/>
                    <span>Você deu um lance de R$ 5.200 no Lote #LOTEVEI001 - Audi A4.</span>
                </li>
                <li className="flex items-center p-2 bg-secondary/30 rounded-md">
                    <FileText className="h-4 w-4 mr-3 text-blue-500"/>
                    <span>Seu Documento de Identidade (Frente) foi aprovado.</span>
                </li>
                 <li className="flex items-center p-2 bg-secondary/30 rounded-md">
                    <ShoppingBag className="h-4 w-4 mr-3 text-amber-500"/>
                    <span>Pagamento pendente para o Lote #LOTE002 - Casa Lauro de Freitas.</span>
                </li>
            </ul>
        </CardContent>
       </Card>
    </div>
  );
}
