'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, FileText, CreditCard, CalendarDays, Eye, AlertCircle } from 'lucide-react';
import { sampleUserWins, getPaymentStatusText, getPaymentStatusColor } from '@/lib/sample-data';
import type { UserWin } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MyWinsPage() {
  const wins: UserWin[] = sampleUserWins; // Em um aplicativo real, isso viria do usuário logado

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <ShoppingBag className="h-7 w-7 mr-3 text-primary" />
            Meus Arremates
          </CardTitle>
          <CardDescription>
            Veja todos os lotes que você arrematou e gerencie os pagamentos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {wins.length === 0 ? (
            <div className="text-center py-12 bg-secondary/30 rounded-lg">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground">Nenhum Arremate Encontrado</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Os lotes que você ganhar em leilões aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {wins.map((win) => (
                <Card key={win.id} className="overflow-hidden shadow-md">
                  <div className="relative aspect-[16/9] bg-muted">
                    <Image 
                      src={win.lot.imageUrl} 
                      alt={win.lot.title} 
                      fill 
                      className="object-cover"
                      data-ai-hint={win.lot.dataAiHint || 'imagem lote arrematado'}
                    />
                  </div>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg leading-tight hover:text-primary">
                        <Link href={`/auctions/${win.lot.auctionId}/lots/${win.lot.id}`}>
                            {win.lot.title}
                        </Link>
                    </CardTitle>
                     <CardDescription className="text-xs">
                        Leilão: {win.lot.auctionName} (Lote: {win.lot.id})
                     </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Valor do Arremate:</span>
                      <span className="text-primary font-bold ml-2 text-lg">
                        R$ {win.winningBidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center">
                        <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Arrematado em: {format(new Date(win.winDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                    </div>
                    <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Status do Pagamento: </span>
                        <Badge variant="outline" className={`ml-2 ${getPaymentStatusColor(win.paymentStatus)}`}>
                            {getPaymentStatusText(win.paymentStatus)}
                        </Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4 flex flex-col sm:flex-row gap-2">
                    <Button size="sm" className="flex-1" asChild>
                        <Link href={`/auctions/${win.lot.auctionId}/lots/${win.lot.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> Ver Detalhes do Lote
                        </Link>
                    </Button>
                    {win.paymentStatus === 'PENDENTE' && (
                        <Button variant="default" size="sm" className="flex-1">
                            <CreditCard className="mr-2 h-4 w-4" /> Pagar Agora (Protótipo)
                        </Button>
                    )}
                    {win.invoiceUrl && win.paymentStatus === 'PAGO' && (
                       <Button variant="outline" size="sm" className="flex-1" asChild>
                           <Link href={win.invoiceUrl} target="_blank">
                                <FileText className="mr-2 h-4 w-4" /> Ver Fatura
                           </Link>
                       </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}