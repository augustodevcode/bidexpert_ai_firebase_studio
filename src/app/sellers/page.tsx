
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, ArrowRight, CalendarDays, Star, PackageOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { sampleSellers } from '@/lib/sample-data'; // Modificado para usar sampleSellers
import type { SellerProfileInfo } from '@/types';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SellersListPage() {
  const [sellers, setSellers] = useState<SellerProfileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Usa o array diretamente, já que getUniqueSellers() não é mais exportado/necessário aqui
    setSellers(sampleSellers); 
    setIsLoading(false);
  }, []);

  const getSellerInitial = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : 'S';
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <section className="text-center py-12 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg">
          <Building className="mx-auto h-12 w-12 text-primary mb-4" />
          <h1 className="text-4xl font-bold mb-4 font-headline">Nossos Comitentes</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Conheça os vendedores e instituições que confiam no BidExpert para leiloar seus bens.
          </p>
        </section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="shadow-lg animate-pulse">
              <CardHeader className="items-center text-center">
                <div className="h-20 w-20 mb-3 rounded-full bg-muted"></div>
                <div className="h-6 w-3/4 bg-muted rounded"></div>
                <div className="h-4 w-1/2 bg-muted rounded mt-1"></div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="h-4 w-full bg-muted rounded"></div>
                <div className="h-4 w-3/4 bg-muted rounded"></div>
                <div className="h-4 w-1/2 bg-muted rounded"></div>
                <div className="h-9 w-full bg-muted rounded mt-3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <section className="text-center py-12 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg">
        <Building className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="text-4xl font-bold mb-4 font-headline">Nossos Comitentes</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Conheça os vendedores e instituições que confiam no BidExpert para leiloar seus bens.
        </p>
      </section>

      {sellers.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Nenhum comitente encontrado.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sellers.map((seller) => (
          <Card key={seller.slug} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
            <CardHeader className="items-center text-center">
              <Avatar className="h-20 w-20 mb-3 border-2 border-primary/30">
                <AvatarImage src={seller.logoUrl} alt={seller.name} data-ai-hint={seller.dataAiHintLogo || 'logo comitente'} />
                <AvatarFallback>{getSellerInitial(seller.name)}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl font-semibold">{seller.name}</CardTitle>
              <CardDescription className="text-xs text-primary">Comitente Verificado</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground text-center">
              <div className="flex items-center justify-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>Conosco desde: {seller.memberSince ? format(new Date(seller.memberSince), 'MM/yyyy', { locale: ptBR }) : 'N/A'}</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <PackageOpen className="h-3.5 w-3.5" />
                <span>Lotes Ativos: {seller.activeLotsCount}</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                 <Star className="h-3.5 w-3.5 text-amber-500" />
                <span>Avaliação: {seller.rating ? seller.rating.toFixed(1) : 'N/A'} / 5.0</span>
              </div>
            </CardContent>
            <CardContent className="text-center mt-auto pt-0 pb-4 px-4">
              <Button asChild variant="outline" className="w-full mt-3">
                <Link href={`/sellers/${seller.slug}`}>
                  Ver Leilões e Lotes <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

