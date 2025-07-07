
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Settings, Database, Gavel, Package, Users } from 'lucide-react';
import Link from 'next/link';
import { useDevConfig } from '@/components/dev-config-provider';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const { openConfigModal } = useDevConfig();

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <LayoutDashboard className="h-7 w-7 mr-3 text-primary" />
              Painel de Administração
            </CardTitle>
            <CardDescription>
              Bem-vindo à área de gerenciamento do BidExpert.
            </CardDescription>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <Button variant="outline" onClick={openConfigModal}>
              <Database className="mr-2 h-4 w-4" />
              Alterar Fonte de Dados
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Utilize o menu lateral para navegar pelas diferentes seções de gerenciamento do site.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/admin/auctions" className="block hover:no-underline">
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gerenciar Leilões</CardTitle>
                  <Gavel className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Crie, edite e publique leilões e seus lotes.
                  </p>
                </CardContent>
              </Card>
            </Link>

             <Link href="/admin/lots" className="block hover:no-underline">
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gerenciar Lotes</CardTitle>
                  <Package className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Visualize e edite todos os lotes da plataforma.
                  </p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/admin/users" className="block hover:no-underline">
              <Card className="hover:shadow-md transition-shadow h-full">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gerenciar Usuários</CardTitle>
                <Users className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Visualize usuários, atribua perfis e gerencie acessos.
                </p>
              </CardContent>
            </Card>
            </Link>

             <Link href="/admin/settings" className="block hover:no-underline">
              <Card className="hover:shadow-md transition-shadow h-full">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Configurações</CardTitle>
                <Settings className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Ajuste parâmetros globais da plataforma.
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
