
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { sampleAuctions, sampleLots, slugify, sampleSellers } from '@/lib/sample-data'; // Modificado para usar sampleSellers
import type { Auction, Lot, SellerProfileInfo } from '@/types';
import AuctionCard from '@/components/auction-card';
import LotCard from '@/components/lot-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, Building, CalendarDays, PackageOpen, Star, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SellerDetailsPage() {
  const params = useParams();
  const sellerIdSlug = typeof params.sellerId === 'string' ? params.sellerId : '';

  const [sellerProfile, setSellerProfile] = useState<SellerProfileInfo | null>(null);
  const [relatedAuctions, setRelatedAuctions] = useState<Auction[]>([]);
  const [relatedLots, setRelatedLots] = useState<Lot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sellerIdSlug) {
      setIsLoading(true);
      setError(null);

      try {
        const allSellers = sampleSellers; // Alterado para usar o array diretamente
        const foundSeller = allSellers.find(s => s.slug === sellerIdSlug);

        if (!foundSeller) {
          setError(`Comitente com slug "${sellerIdSlug}" não encontrado.`);
          setSellerProfile(null);
          setIsLoading(false);
          return;
        }
        
        setSellerProfile(foundSeller);

        // Filter auctions where this seller is the 'seller'
        const auctionsByThisSeller = sampleAuctions.filter(auction => 
          auction.seller && slugify(auction.seller) === sellerIdSlug
        );
        setRelatedAuctions(auctionsByThisSeller);

        // Filter lots where this seller is the 'sellerName'
        // Also, include lots from the auctions where this seller is the 'seller',
        // but ensure we don't duplicate lots if they also have a direct sellerName match.
        let lotsByThisSeller = sampleLots.filter(lot => lot.sellerName && slugify(lot.sellerName) === sellerIdSlug);
        
        auctionsByThisSeller.forEach(auction => {
          (auction.lots || []).forEach(auctionLot => { // Adicionado (auction.lots || []) para segurança
            if ((!auctionLot.sellerName || slugify(auctionLot.sellerName) === sellerIdSlug) && 
                !lotsByThisSeller.find(l => l.id === auctionLot.id)) {
              lotsByThisSeller.push(auctionLot);
            }
          });
        });
        
        const uniqueLots = lotsByThisSeller.filter((lot, index, self) =>
          index === self.findIndex((l) => (l.id === lot.id))
        );
        setRelatedLots(uniqueLots);
        
      } catch (e) {
        console.error("Error processing seller data:", e);
        setError("Erro ao processar dados do comitente.");
      } finally {
        setIsLoading(false);
      }
    } else {
      setError("Slug do comitente não fornecido.");
      setIsLoading(false);
    }
  }, [sellerIdSlug]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando informações do comitente...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-destructive">{error}</h2>
        <Button asChild className="mt-4">
          <Link href="/sellers">Voltar para Comitentes</Link>
        </Button>
      </div>
    );
  }

  if (!sellerProfile) {
     return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-muted-foreground">Comitente não encontrado.</h2>
         <Button asChild className="mt-4">
          <Link href="/sellers">Voltar para Comitentes</Link>
        </Button>
      </div>
    );
  }
  
  const sellerInitial = sellerProfile.name ? sellerProfile.name.charAt(0).toUpperCase() : 'S';


  return (
    <div className="space-y-8">
      <Card className="shadow-lg mb-8">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 border-2 border-primary/30">
                <AvatarImage src={sellerProfile.logoUrl} alt={sellerProfile.name} data-ai-hint={sellerProfile.dataAiHintLogo} />
                <AvatarFallback>{sellerInitial}</AvatarFallback>
              </Avatar>
              <div>
                 <CardDescription className="text-sm">Comitente</CardDescription>
                <CardTitle className="text-3xl font-bold font-headline">{sellerProfile.name}</CardTitle>
                <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" />
                    <span>Conosco desde: {sellerProfile.memberSince ? format(new Date(sellerProfile.memberSince), 'MM/yyyy', { locale: ptBR }) : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <PackageOpen className="h-4 w-4" />
                    <span>Lotes Ativos: {sellerProfile.activeLotsCount}</span>
                  </div>
                   <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-amber-500" />
                    <span>Avaliação: {sellerProfile.rating ? sellerProfile.rating.toFixed(1) : 'N/A'} / 5.0</span>
                  </div>
                </div>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/sellers">
                <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
              </Link>
            </Button>
          </div>
           <p className="text-muted-foreground text-sm border-t pt-4">
            Explore os leilões e lotes atualmente disponíveis deste comitente.
          </p>
        </CardHeader>
      </Card>

      {relatedAuctions.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4 font-headline">Leilões de {sellerProfile.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedAuctions.map(auction => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        </section>
      )}

      {relatedLots.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4 mt-8 font-headline">Lotes Individuais de {sellerProfile.name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {relatedLots.map(lot => (
              <LotCard key={`${lot.auctionId}-${lot.id}`} lot={lot} />
            ))}
          </div>
        </section>
      )}

      {relatedAuctions.length === 0 && relatedLots.length === 0 && !isLoading && (
        <Card>
            <CardContent className="text-center py-10">
            <p className="text-muted-foreground">Nenhum leilão ou lote ativo encontrado para este comitente no momento.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
