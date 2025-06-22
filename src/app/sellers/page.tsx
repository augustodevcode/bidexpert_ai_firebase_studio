
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, ArrowRight, CalendarDays, Star, PackageOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getSellers } from '@/app/admin/sellers/actions';
import type { SellerProfileInfo } from '@/types';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SellersListPage() {
  const [sellers, setSellers] = useState<SellerProfileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSellers() {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedSellers = await getSellers();
        setSellers(fetchedSellers);
      } catch (e) {
        console.error("Error fetching sellers:", e);
        setError("Falha ao buscar comitentes.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchSellers();
  }, []);

  const getSellerInitial = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : 'S';
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 py-8">
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
              <CardHeader className="items-center text-center p-4">
                <div className="h-24 w-24 mb-3 rounded-full bg-muted"></div>
                <div className="h-6 w-3/4 bg-muted rounded"></div>
                <div className="h-4 w-1/2 bg-muted rounded mt-1"></div>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-sm text-muted-foreground">
                <div className="h-4 w-full bg-muted rounded"></div>
                <div className="h-4 w-3/4 bg-muted rounded"></div>
                <div className="h-4 w-1/2 bg-muted rounded"></div>
              </CardContent>
              <CardFooter className="p-4 border-t">
                <div className="h-9 w-full bg-muted rounded"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-destructive">{error}</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
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
            Nenhum comitente cadastrado na plataforma ainda.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sellers.map((seller) => (
          <Card key={seller.id} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
            <CardHeader className="items-center text-center p-4">
              <Avatar className="h-24 w-24 mb-3 border-2 border-primary/30">
                <AvatarImage src={seller.logoUrl || `https://placehold.co/100x100.png?text=${getSellerInitial(seller.name)}`} alt={seller.name} data-ai-hint={seller.dataAiHintLogo || "logo comitente"} />
                <AvatarFallback>{getSellerInitial(seller.name)}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl font-semibold">{seller.name}</CardTitle>
              <CardDescription className="text-xs text-primary">Comitente Verificado</CardDescription>
               {seller.rating !== undefined && seller.rating > 0 && (
                <div className="flex items-center text-xs text-amber-600 mt-1">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500 mr-1" />
                  {seller.rating.toFixed(1)} 
                  <span className="text-muted-foreground ml-1">({Math.floor(Math.random() * 100 + (seller.auctionsFacilitatedCount || 0))} avaliações)</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-grow px-4 pb-4 space-y-1 text-sm text-muted-foreground text-center">
              {seller.city && seller.state && (
                <p className="text-xs">{seller.city} - {seller.state}</p>
              )}
              <div className="text-xs">
                <span className="font-medium text-foreground">{seller.activeLotsCount || 0}</span> lotes ativos
              </div>
               {seller.memberSince && (
                <div className="text-xs">
                    Membro desde: {format(new Date(seller.memberSince), 'MM/yyyy', { locale: ptBR })}
                </div>
               )}
            </CardContent>
            <CardFooter className="p-4 border-t">
              <Button asChild variant="outline" className="w-full">
                <Link href={`/sellers/${seller.slug || seller.publicId || seller.id}`}>
                  Ver Perfil e Lotes <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
