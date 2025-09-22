// src/app/sellers/page.tsx
/**
 * @fileoverview Página de listagem pública de todos os Comitentes (Vendedores).
 * Este componente de cliente busca os perfis de todos os comitentes ativos
 * na plataforma e os exibe em um layout de cards, permitindo que os usuários
 * descubram e naveguem para as páginas de perfil de cada vendedor.
 */
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, ArrowRight, CalendarDays, Star, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getSellers } from '@/app/admin/sellers/actions';
import type { SellerProfileInfo } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { isValidImageUrl } from '@/lib/ui-helpers';
import { useEffect, useState } from 'react';

const getSellerInitial = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'S';
};

export default function SellersListPage() {
  const [sellers, setSellers] = useState<SellerProfileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        try {
            const fetchedSellers = await getSellers(true); // Public call
            setSellers(fetchedSellers);
        } catch (e) {
            console.error("Error fetching sellers:", e);
            setError("Falha ao buscar comitentes.");
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <section className="text-center py-12 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg">
        <Building className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="text-4xl font-bold mb-4 font-headline">Nossos Comitentes</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Conheça os vendedores e instituições que confiam no BidExpert para leiloar seus bens.
        </p>
      </section>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-destructive">{error}</h2>
        </div>
      ) : sellers.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Nenhum comitente cadastrado na plataforma ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sellers.map((seller) => {
            const validLogoUrl = isValidImageUrl(seller.logoUrl) ? seller.logoUrl : `https://placehold.co/100x100.png?text=${getSellerInitial(seller.name)}`;
            const formattedDate = seller.memberSince ? format(new Date(seller.memberSince), 'MM/yyyy', { locale: ptBR }) : null;
            return (
                <Card key={seller.id} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
                <CardHeader className="items-center text-center p-4">
                    <Avatar className="h-24 w-24 mb-3 border-2 border-primary/30">
                    <AvatarImage src={validLogoUrl} alt={seller.name} data-ai-hint={seller.dataAiHintLogo || "logo comitente"} />
                    <AvatarFallback>{getSellerInitial(seller.name)}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-xl font-semibold">{seller.name}</CardTitle>
                    <CardDescription className="text-xs text-primary">{seller.isJudicial ? 'Comitente Judicial' : 'Comitente Verificado'}</CardDescription>
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
                    {formattedDate && (
                      <div className="text-xs">
                          Membro desde: {formattedDate}
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
            )
        })}
        </div>
      )}
    </div>
  );
}