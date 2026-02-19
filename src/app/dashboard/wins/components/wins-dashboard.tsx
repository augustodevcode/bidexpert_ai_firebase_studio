'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { WinsKPI } from './wins-kpi';
import { WinsListView } from './wins-list-view';
import type { UserWin } from '@/types';
import { Download, Printer, Filter, MessageSquare } from 'lucide-react';

interface WinsDashboardProps {
  wins: UserWin[];
}

export function WinsDashboard({ wins }: WinsDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const pendingWins = wins.filter(w => w.paymentStatus === 'PENDENTE');
  const paidWins = wins.filter(w => w.paymentStatus === 'PAGO');

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Meus Arremates</h2>
        <div className="flex items-center space-x-2">
            <Link href="/dashboard/messages">
                <Button variant="outline" size="sm">
                    <MessageSquare className="mr-2 h-4 w-4" /> Mensagens
                </Button>
            </Link>
           <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" /> Filtros
           </Button>
           <Button size="sm">
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <WinsKPI wins={wins} />
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
             <div className="col-span-7">
                <WinsListView wins={wins} />
             </div>
          </div>
        </TabsContent>
        
        <TabsContent value="financial" className="space-y-4">
           <div className="rounded-md border p-4 bg-muted/20">
              <h3 className="text-lg font-medium mb-4">Pagamentos Pendentes</h3>
              {pendingWins.length > 0 ? (
                <WinsListView wins={pendingWins} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                    Nenhum pagamento pendente.
                </div>
              )}
           </div>
           
           <div className="rounded-md border p-4 bg-muted/20 mt-8">
              <h3 className="text-lg font-medium mb-4">Histórico de Pagamentos</h3>
              {paidWins.length > 0 ? (
                <WinsListView wins={paidWins} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                    Nenhum pagamento realizado.
                </div>
              )}
           </div>
        </TabsContent>
        
        <TabsContent value="documents" className="space-y-4">
            <div className="rounded-md border p-4 bg-muted/20">
              <h3 className="text-lg font-medium mb-4">Documentos Disponíveis</h3>
               <p className="text-sm text-muted-foreground mb-6">
                 Aqui você encontra os termos de arrematação e notas fiscais dos seus lotes pagos.
               </p>
               
               {paidWins.length > 0 ? (
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {paidWins.map(win => (
                        <div key={win.id} className="border rounded-lg p-4 bg-card flex flex-col justify-between">
                            <div>
                                <h4 className="font-semibold">{win.lot?.title}</h4>
                                <p className="text-sm text-muted-foreground">Leilão: {win.lot?.auctionName}</p>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <Button variant="outline" size="sm" className="w-full">
                                    <Download className="mr-2 h-4 w-4" /> Termo
                                </Button>
                                <Button variant="outline" size="sm" className="w-full">
                                    <Printer className="mr-2 h-4 w-4" /> Recibo
                                </Button>
                            </div>
                        </div>
                    ))}
                 </div>
               ) : (
                 <div className="text-center py-8 text-muted-foreground">
                    Nenhum documento disponível (necessário quitar o lote primeiro).
                 </div>
               )}
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
