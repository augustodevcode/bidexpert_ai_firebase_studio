
'use client';

import { useState, useEffect, useMemo } from 'react';
import AuctionCard from '@/components/auction-card';
import LotCard from '@/components/lot-card';
import SidebarFilters from '@/components/sidebar-filters'; 
import { sampleAuctions, sampleLots, getUniqueLotCategories, getUniqueLotLocations, getUniqueSellerNames, slugify } from '@/lib/sample-data';
import type { Auction, Lot } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search as SearchIcon, SlidersHorizontal, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const sortOptions = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'id_asc', label: 'Nº Item: Menor ao Maior' },
  { value: 'id_desc', label: 'Nº Item: Maior ao Menor' },
  { value: 'endDate_asc', label: 'Data Encerramento: Próximos' },
  { value: 'endDate_desc', label: 'Data Encerramento: Distantes' },
  { value: 'price_asc', label: 'Preço: Menor para Maior' },
  { value: 'price_desc', label: 'Preço: Maior para Menor' },
  { value: 'views_desc', label: 'Mais Visitados' },
];

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'auctions' | 'lots'>('auctions');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [sortByAuctions, setSortByAuctions] = useState<string>('relevance');
  const [sortByLots, setSortByLots] = useState<string>('relevance');
  
  const allLots = useMemo(() => {
    return sampleAuctions.flatMap(auction => 
      auction.lots.map(lot => ({ ...lot, auction })) 
    );
  }, []);

  const baseFilteredAuctions = useMemo(() => {
    if (!searchTerm) return sampleAuctions.slice(0, 12);
    return sampleAuctions.filter(auction =>
      auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (auction.fullTitle && auction.fullTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      auction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auction.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const baseFilteredLots = useMemo(() => {
    if (!searchTerm) return allLots.slice(0, 12);
    return allLots.filter(lot =>
      lot.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lot.description && lot.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      lot.auctionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allLots]);
  
  const sortedAuctions = useMemo(() => {
    let auctionsToSort = [...baseFilteredAuctions];
    switch (sortByAuctions) {
      case 'id_asc':
        auctionsToSort.sort((a, b) => (parseInt(a.id.replace(/\D/g,'')) || 0) - (parseInt(b.id.replace(/\D/g,'')) || 0));
        break;
      case 'id_desc':
        auctionsToSort.sort((a, b) => (parseInt(b.id.replace(/\D/g,'')) || 0) - (parseInt(a.id.replace(/\D/g,'')) || 0));
        break;
      case 'endDate_asc':
        auctionsToSort.sort((a, b) => {
            const dateA = a.endDate || (a.auctionStages && a.auctionStages.length > 0 ? a.auctionStages[a.auctionStages.length-1].endDate : a.auctionDate);
            const dateB = b.endDate || (b.auctionStages && b.auctionStages.length > 0 ? b.auctionStages[b.auctionStages.length-1].endDate : b.auctionDate);
            return new Date(dateA).getTime() - new Date(dateB).getTime();
        });
        break;
      case 'endDate_desc':
         auctionsToSort.sort((a, b) => {
            const dateA = a.endDate || (a.auctionStages && a.auctionStages.length > 0 ? a.auctionStages[a.auctionStages.length-1].endDate : a.auctionDate);
            const dateB = b.endDate || (b.auctionStages && b.auctionStages.length > 0 ? b.auctionStages[b.auctionStages.length-1].endDate : b.auctionDate);
            return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
        break;
      case 'price_asc':
        auctionsToSort.sort((a, b) => (a.initialOffer || 0) - (b.initialOffer || 0));
        break;
      case 'price_desc':
        auctionsToSort.sort((a, b) => (b.initialOffer || 0) - (a.initialOffer || 0));
        break;
      case 'views_desc':
        auctionsToSort.sort((a, b) => (b.visits || 0) - (a.visits || 0));
        break;
      case 'relevance':
      default:
        break;
    }
    return auctionsToSort;
  }, [baseFilteredAuctions, sortByAuctions]);

  const sortedLots = useMemo(() => {
    let lotsToSort = [...baseFilteredLots];
    switch (sortByLots) {
      case 'id_asc':
        lotsToSort.sort((a, b) => (parseInt(a.id.replace(/\D/g,'')) || 0) - (parseInt(b.id.replace(/\D/g,'')) || 0));
        break;
      case 'id_desc':
        lotsToSort.sort((a, b) => (parseInt(b.id.replace(/\D/g,'')) || 0) - (parseInt(a.id.replace(/\D/g,'')) || 0));
        break;
      case 'endDate_asc':
        lotsToSort.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
        break;
      case 'endDate_desc':
        lotsToSort.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
        break;
      case 'price_asc':
        lotsToSort.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        lotsToSort.sort((a, b) => b.price - a.price);
        break;
      case 'views_desc':
        lotsToSort.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'relevance':
      default:
        break;
    }
    return lotsToSort;
  }, [baseFilteredLots, sortByLots]);

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
            placeholder="Buscar por palavra-chave, ID..."
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
                <TabsTrigger value="auctions">Buscar Leilões ({sortedAuctions.length})</TabsTrigger>
                <TabsTrigger value="lots">Buscar Lotes ({sortedLots.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="auctions">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 p-4 bg-card border rounded-lg shadow-sm">
                    <p className="text-sm text-muted-foreground">
                        Mostrando {sortedAuctions.length} leilão{sortedAuctions.length !== 1 ? 's' : ''} {searchTerm && `contendo "${searchTerm}"`}
                    </p>
                    <Select value={sortByAuctions} onValueChange={setSortByAuctions}>
                        <SelectTrigger className="w-full sm:w-[200px] h-9 text-xs">
                            <SelectValue placeholder="Ordenar leilões por" />
                        </SelectTrigger>
                        <SelectContent>
                        {sortOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                            {option.label}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                {sortedAuctions.length > 0 ? (
                <div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sortedAuctions.map((auction) => (
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
                 <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 p-4 bg-card border rounded-lg shadow-sm">
                    <p className="text-sm text-muted-foreground">
                        Mostrando {sortedLots.length} lote{sortedLots.length !== 1 ? 's' : ''} {searchTerm && `contendo "${searchTerm}"`}
                    </p>
                    <Select value={sortByLots} onValueChange={setSortByLots}>
                        <SelectTrigger className="w-full sm:w-[200px] h-9 text-xs">
                            <SelectValue placeholder="Ordenar lotes por" />
                        </SelectTrigger>
                        <SelectContent>
                        {sortOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                            {option.label}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                {sortedLots.length > 0 ? (
                <div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {sortedLots.map((lot) => (
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
