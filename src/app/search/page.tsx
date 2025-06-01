
'use client';

import { useState, useEffect, useMemo } from 'react';
import AuctionCard from '@/components/auction-card';
import LotCard from '@/components/lot-card';
import AuctionFilters from '@/components/auction-filters';
import { sampleAuctions, sampleLots } from '@/lib/sample-data';
import type { Auction, Lot } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Search as SearchIcon } from 'lucide-react';

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'auctions' | 'lots'>('auctions');
  
  // Memoize all lots to avoid re-computation on every render
  const allLots = useMemo(() => {
    return sampleAuctions.flatMap(auction => 
      auction.lots.map(lot => ({ ...lot, auction })) // Include auction context for LotCard if needed
    );
  }, []);

  const filteredAuctions = useMemo(() => {
    if (!searchTerm) return sampleAuctions.slice(0, 6); // Show some default auctions
    return sampleAuctions.filter(auction =>
      auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (auction.fullTitle && auction.fullTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      auction.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 6);
  }, [searchTerm]);

  const filteredLots = useMemo(() => {
    if (!searchTerm) return allLots.slice(0, 6); // Show some default lots
    return allLots.filter(lot =>
      lot.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.auctionName.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 6);
  }, [searchTerm, allLots]);


  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 font-headline">Navegar e Buscar</h1>
        <p className="text-muted-foreground mb-6">Encontre leilões ou lotes específicos.</p>
      </div>

      <div className="relative mb-6 max-w-xl mx-auto">
        <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por palavra-chave em leilões ou lotes..."
          className="h-12 pl-12 text-md rounded-lg shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <AuctionFilters />

      <Tabs value={searchType} onValueChange={(value) => setSearchType(value as 'auctions' | 'lots')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2 mx-auto mb-6">
          <TabsTrigger value="auctions">Buscar Leilões ({filteredAuctions.length})</TabsTrigger>
          <TabsTrigger value="lots">Buscar Lotes ({filteredLots.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="auctions">
          {filteredAuctions.length > 0 ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Resultados para Leilões {searchTerm && `contendo "${searchTerm}"`} ({filteredAuctions.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAuctions.map((auction) => (
                  <AuctionCard key={auction.id} auction={auction} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-secondary/30 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Nenhum Leilão Encontrado</h2>
              <p className="text-muted-foreground mb-4">Tente ajustar seus termos de busca ou filtros.</p>
              <Button asChild variant="outline">
                <Link href="/">Ver Todos os Leilões</Link>
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="lots">
          {filteredLots.length > 0 ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Resultados para Lotes {searchTerm && `contendo "${searchTerm}"`} ({filteredLots.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredLots.map((lot) => (
                  <LotCard key={`${lot.auctionId}-${lot.id}`} lot={lot} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-secondary/30 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Nenhum Lote Encontrado</h2>
              <p className="text-muted-foreground mb-4">Tente ajustar seus termos de busca ou filtros.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
