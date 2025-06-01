
'use client';

import { useState, useEffect, useMemo } from 'react';
import AuctionCard from '@/components/auction-card';
import LotCard from '@/components/lot-card';
import SidebarFilters from '@/components/sidebar-filters'; // Importado
import { sampleAuctions, sampleLots, getUniqueLotCategories, getUniqueLotLocations, getUniqueSellerNames } from '@/lib/sample-data';
import type { Auction, Lot } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Search as SearchIcon, SlidersHorizontal } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'auctions' | 'lots'>('auctions');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  
  const allLots = useMemo(() => {
    return sampleAuctions.flatMap(auction => 
      auction.lots.map(lot => ({ ...lot, auction })) 
    );
  }, []);

  const filteredAuctions = useMemo(() => {
    if (!searchTerm) return sampleAuctions.slice(0, 12); // Show more default auctions
    return sampleAuctions.filter(auction =>
      auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (auction.fullTitle && auction.fullTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      auction.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const filteredLots = useMemo(() => {
    if (!searchTerm) return allLots.slice(0, 12); // Show more default lots
    return allLots.filter(lot =>
      lot.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.auctionName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allLots]);
  
  // Dados para os filtros
  const uniqueCategories = useMemo(() => getUniqueLotCategories(), []);
  const uniqueLocations = useMemo(() => getUniqueLotLocations(), []);
  const uniqueSellers = useMemo(() => getUniqueSellerNames(), []);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 font-headline">Navegar e Buscar</h1>
        <p className="text-muted-foreground mb-6">Encontre leilões ou lotes específicos.</p>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 mb-6 max-w-3xl mx-auto">
        <div className="relative flex-grow w-full">
            <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
            type="search"
            placeholder="Buscar por palavra-chave..."
            className="h-12 pl-12 text-md rounded-lg shadow-sm w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="md:hidden w-full">
          <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full h-12">
                <SlidersHorizontal className="mr-2 h-5 w-5" /> Filtros
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[85vw] max-w-sm">
                <div className="p-4 h-full overflow-y-auto">
                    <SidebarFilters 
                        categories={uniqueCategories}
                        locations={uniqueLocations}
                        sellers={uniqueSellers}
                    />
                </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      <div className="grid md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] gap-8">
        <div className="hidden md:block">
            <SidebarFilters 
                categories={uniqueCategories}
                locations={uniqueLocations}
                sellers={uniqueSellers}
            />
        </div>
        
        <main className="space-y-6">
            <Tabs value={searchType} onValueChange={(value) => setSearchType(value as 'auctions' | 'lots')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="auctions">Buscar Leilões ({filteredAuctions.length})</TabsTrigger>
                <TabsTrigger value="lots">Buscar Lotes ({filteredLots.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="auctions">
                {filteredAuctions.length > 0 ? (
                <div>
                    <h2 className="text-xl font-semibold mb-4">
                    Resultados para Leilões {searchTerm && `contendo "${searchTerm}"`}
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
                    Resultados para Lotes {searchTerm && `contendo "${searchTerm}"`}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
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
        </main>
      </div>
    </div>
  );
}
