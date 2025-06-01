
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation'; // Corrigido para next/navigation
import { sampleAuctions, sampleLots, slugify } from '@/lib/sample-data';
import type { Auction, Lot } from '@/types';
import AuctionCard from '@/components/auction-card';
import LotCard from '@/components/lot-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Building } from 'lucide-react';

export default function SellerDetailsPage() {
  const params = useParams();
  const sellerIdSlug = typeof params.sellerId === 'string' ? params.sellerId : '';

  const [sellerName, setSellerName] = useState<string>('');
  const [relatedAuctions, setRelatedAuctions] = useState<Auction[]>([]);
  const [relatedLots, setRelatedLots] = useState<Lot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (sellerIdSlug) {
      // Encontrar o nome original do vendedor a partir do slug
      // Esta é uma simulação, idealmente teríamos um mapeamento ou buscaríamos por slug no backend
      const foundSellerName = [
        ...new Set(sampleAuctions.map(a => a.seller).filter(Boolean) as string[]),
        ...new Set(sampleAuctions.map(a => a.auctioneer).filter(Boolean) as string[]),
        ...new Set(sampleLots.map(l => l.sellerName).filter(Boolean) as string[])
      ].find(name => slugify(name) === sellerIdSlug);

      setSellerName(foundSellerName || sellerIdSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));

      const auctions = sampleAuctions.filter(auction => 
        (auction.seller && slugify(auction.seller) === sellerIdSlug) ||
        (auction.auctioneer && slugify(auction.auctioneer) === sellerIdSlug)
      );
      setRelatedAuctions(auctions);

      const lots = sampleLots.filter(lot => lot.sellerName && slugify(lot.sellerName) === sellerIdSlug);
      // Adicionar lotes de leilões onde o comitente principal é o vendedor
      auctions.forEach(auction => {
        auction.lots.forEach(lot => {
          // Adicionar apenas se o lote ainda não estiver na lista (caso o lote tenha um sellerName diferente do auction.seller/auctioneer)
          if (!lots.find(l => l.id === lot.id) && (!lot.sellerName || slugify(lot.sellerName) === sellerIdSlug) ) {
            lots.push(lot);
          }
        });
      });
      // Remover duplicatas de lotes caso um lote tenha sido adicionado por sellerName e também por pertencer a um leilão do comitente
      const uniqueLots = lots.filter((lot, index, self) =>
        index === self.findIndex((l) => (
          l.id === lot.id
        ))
      );
      setRelatedLots(uniqueLots);
      
      setIsLoading(false);
    }
  }, [sellerIdSlug]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Carregando informações do comitente...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Building className="h-8 w-8 mr-3 text-primary" />
              <div>
                <CardDescription className="text-sm">Comitente</CardDescription>
                <CardTitle className="text-3xl font-bold font-headline">{sellerName}</CardTitle>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/sellers">
                <ChevronLeft className="mr-2 h-4 w-4" /> Voltar para Comitentes
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Explore os leilões e lotes atualmente disponíveis deste comitente.
          </p>
        </CardContent>
      </Card>

      {relatedAuctions.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4 font-headline">Leilões de {sellerName}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedAuctions.map(auction => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        </section>
      )}

      {relatedLots.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4 mt-8 font-headline">Lotes Individuais de {sellerName}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {relatedLots.map(lot => (
              <LotCard key={lot.id} lot={lot} />
            ))}
          </div>
        </section>
      )}

      {relatedAuctions.length === 0 && relatedLots.length === 0 && (
        <div className="text-center py-10 bg-secondary/30 rounded-lg">
          <p className="text-muted-foreground">Nenhum leilão ou lote ativo encontrado para este comitente no momento.</p>
        </div>
      )}
    </div>
  );
}
