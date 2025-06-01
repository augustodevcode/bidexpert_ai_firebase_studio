
'use client';

import Link from 'next/link';
import { Coins, Search, Menu, ShoppingCart, Heart, ChevronDown, Eye, UserCircle, LayoutList, Tag, Home as HomeIcon, Briefcase, Users2, MessageSquareText, ShoppingBasket, Package, Tv, Percent, Handshake, FileText, History, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MainNav from './main-nav';
import UserNav from './user-nav';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { sampleLots, getUniqueLotCategories, slugify } from '@/lib/sample-data';
import type { RecentlyViewedLotInfo, Lot } from '@/types';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { getRecentlyViewedIds } from '@/lib/recently-viewed-store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [recentlyViewedItems, setRecentlyViewedItems] = useState<RecentlyViewedLotInfo[]>([]);
  const [searchCategories, setSearchCategories] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState<Array<{ href: string; label: string }>>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSearchCategorySlug, setSelectedSearchCategorySlug] = useState<string | undefined>(undefined);
  const [searchResults, setSearchResults] = useState<Lot[]>([]);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);

    const viewedIds = getRecentlyViewedIds();
    const items: RecentlyViewedLotInfo[] = viewedIds.map(id => {
      const lot = sampleLots.find(l => l.id === id);
      return lot ? {
        id: lot.id,
        title: lot.title,
        imageUrl: lot.imageUrl,
        auctionId: lot.auctionId,
        dataAiHint: lot.dataAiHint
      } : null;
    }).filter(item => item !== null) as RecentlyViewedLotInfo[];
    setRecentlyViewedItems(items);

    const allCategories = getUniqueLotCategories();
    setSearchCategories(['Todas', ...allCategories]); // Add "Todas" option
    
    const topCategoriesForNav = allCategories.slice(0, 2);
    setDynamicCategories(
      topCategoriesForNav.map(category => ({
        href: `/category/${slugify(category)}`,
        label: category,
      }))
    );
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (searchTerm.length < 3) {
      setSearchResults([]);
      setIsSearchDropdownOpen(false);
      setIsSearchLoading(false);
      return;
    }

    setIsSearchLoading(true);
    // Simulate API call delay
    const debounceTimer = setTimeout(() => {
      const filtered = sampleLots.filter(lot => {
        const term = searchTerm.toLowerCase();
        const categoryMatch = selectedSearchCategorySlug && selectedSearchCategorySlug !== 'todas'
          ? slugify(lot.type) === selectedSearchCategorySlug
          : true; // Match all categories if "Todas" or undefined

        const textMatch = (
          lot.title.toLowerCase().includes(term) ||
          (lot.description && lot.description.toLowerCase().includes(term)) ||
          lot.auctionName.toLowerCase().includes(term) ||
          lot.id.toLowerCase().includes(term)
        );
        return categoryMatch && textMatch;
      });
      setSearchResults(filtered.slice(0, 7)); // Limit results for dropdown
      setIsSearchDropdownOpen(true);
      setIsSearchLoading(false);
    }, 500); // Debounce for 500ms

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedSearchCategorySlug]);
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      let query = `?term=${encodeURIComponent(searchTerm.trim())}`;
      if (selectedSearchCategorySlug && selectedSearchCategorySlug !== 'todas') {
        query += `&category=${selectedSearchCategorySlug}`;
      }
      router.push(`/search${query}`);
      setIsSearchDropdownOpen(false);
    }
  };


  return (
    <header className="sticky top-0 z-50 w-full shadow-md">
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="container flex h-20 items-center">
          <div className="flex items-center">
            <div className="md:hidden mr-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-primary/80 focus-visible:ring-primary-foreground">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Abrir Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0 bg-background text-foreground">
                  <Link href="/" className="flex items-center space-x-2 text-lg font-semibold mb-4 p-6 border-b">
                    <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                      <AvatarImage src="https://placehold.co/40x40.png?text=BE" alt="BidExpert Logo Small" data-ai-hint="logo initial" />
                      <AvatarFallback>BE</AvatarFallback>
                    </Avatar>
                    <span className="text-primary">BidExpert</span>
                  </Link>
                  <nav className="flex flex-col gap-1 px-4">
                    <MainNav className="flex-col items-start space-x-0 space-y-0" />
                    <div className="mt-auto pt-4 border-t">
                      <UserNav />
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>

            <Link href="/" className="mr-4 flex items-center space-x-2">
              <Avatar className="h-10 w-10 bg-primary-foreground text-primary">
                <AvatarImage src="https://placehold.co/40x40.png?text=BE" alt="BidExpert Logo" data-ai-hint="logo initial" />
                <AvatarFallback className="font-bold text-xl">BE</AvatarFallback>
              </Avatar>
              <span className="font-bold text-3xl hidden sm:inline-block">
                BidExpert
              </span>
            </Link>
          </div>

          {isClient && (
             <form onSubmit={handleSearchSubmit} className="flex-1 flex justify-center items-center px-2 sm:px-4">
                <div ref={searchContainerRef} className="relative flex w-full max-w-xl bg-background rounded-md shadow-sm">
                  <Select 
                    value={selectedSearchCategorySlug || 'todas'}
                    onValueChange={(value) => setSelectedSearchCategorySlug(value === 'todas' ? undefined : value)}
                  >
                    <SelectTrigger 
                      className="w-[120px] sm:w-[150px] h-10 text-xs sm:text-sm text-muted-foreground border-r border-input rounded-l-md rounded-r-none focus:ring-0 focus:ring-offset-0 bg-secondary/20 truncate"
                      aria-label="Selecionar Categoria de Busca"
                    >
                      <SelectValue placeholder="Categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      {searchCategories.map(cat => (
                        <SelectItem 
                          key={slugify(cat)} 
                          value={slugify(cat)} 
                          className="text-xs sm:text-sm"
                        >
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="search"
                    placeholder="Buscar em 20,000+ produtos..."
                    className="h-10 pl-3 pr-10 flex-1 rounded-l-none rounded-r-md border-l-0 focus:ring-0 focus:ring-offset-0 text-foreground placeholder:text-muted-foreground"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => searchTerm.length >= 3 && setIsSearchDropdownOpen(true)}
                  />
                  <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Search className="h-4 w-4" />
                    <span className="sr-only">Buscar</span>
                  </Button>
                  {isSearchDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border shadow-lg rounded-md z-50 max-h-96 overflow-y-auto">
                      {isSearchLoading && (
                        <div className="p-4 text-center text-muted-foreground flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Buscando...
                        </div>
                      )}
                      {!isSearchLoading && searchResults.length === 0 && searchTerm.length >=3 && (
                        <div className="p-4 text-center text-muted-foreground">Nenhum lote encontrado.</div>
                      )}
                      {!isSearchLoading && searchResults.length > 0 && (
                        <ul className="divide-y divide-border">
                          {searchResults.map(lot => (
                            <li key={lot.id}>
                              <Link 
                                href={`/auctions/${lot.auctionId}/lots/${lot.id}`} 
                                className="flex items-center p-3 hover:bg-accent transition-colors"
                                onClick={() => setIsSearchDropdownOpen(false)}
                              >
                                <div className="relative h-12 w-16 flex-shrink-0 bg-muted rounded overflow-hidden mr-3">
                                  <Image src={lot.imageUrl} alt={lot.title} fill className="object-cover" data-ai-hint={lot.dataAiHint || "resultado busca"} />
                                </div>
                                <div className="flex-grow overflow-hidden">
                                  <p className="text-sm font-medium text-foreground truncate">{lot.title}</p>
                                  <p className="text-xs text-primary font-semibold">
                                    R$ {lot.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                  </p>
                                </div>
                              </Link>
                            </li>
                          ))}
                           <li className="p-2 border-t border-border">
                            <Button variant="link" className="w-full text-sm text-primary" onClick={handleSearchSubmit}>
                              Ver todos os resultados para "{searchTerm}"
                            </Button>
                          </li>
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </form>
          )}


          <div className="ml-auto flex items-center space-x-1 sm:space-x-2">
            <Button variant="ghost" size="icon" className="relative hover:bg-primary/80 focus-visible:ring-primary-foreground sm:inline-flex" asChild>
              <Link href="/dashboard/favorites">
                <Heart className="h-5 w-5 sm:h-6 sm:w-6" />
                <Badge variant="destructive" className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-primary-foreground text-primary border-primary">0</Badge>
                <span className="sr-only">Favoritos</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="relative hover:bg-primary/80 focus-visible:ring-primary-foreground sm:inline-flex hidden">
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
              <Badge variant="destructive" className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-primary-foreground text-primary border-primary">0</Badge>
              <span className="sr-only">Carrinho</span>
            </Button>
             <UserNav /> 
          </div>
        </div>
      </div>

      {/* Second Bar - Navigation Links */}
      <div className="border-b bg-background text-foreground hidden md:block">
        <div className="container flex h-12 items-center justify-between">
          <div className="flex items-center text-sm font-medium">
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1" aria-label="Início">
              <HomeIcon className="h-4 w-4" />
            </Link>
          </div>

          <nav className="flex items-center space-x-3 lg:space-x-4 text-xs sm:text-sm">
              <Link href="/" className="text-muted-foreground hover:text-primary transition-colors font-medium">Home</Link>
              <Link href="/sell-with-us" className="text-muted-foreground hover:text-primary transition-colors font-medium">Venda Conosco</Link>
              <Link href="/sellers" className="text-muted-foreground hover:text-primary transition-colors font-medium">Comitentes</Link>
          </nav>

          <div className="flex items-center">
            {isClient && recentlyViewedItems.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-sm font-medium hover:bg-accent hover:text-accent-foreground text-muted-foreground">
                    Histórico de Navegação <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-card text-card-foreground">
                  <DropdownMenuLabel className="flex justify-between items-center">
                    Itens Vistos Recentemente
                    <History className="h-4 w-4 text-muted-foreground" />
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {recentlyViewedItems.slice(0, 5).map(item => ( // Show max 5 items in dropdown
                    <DropdownMenuItem key={item.id} asChild className="cursor-pointer">
                      <Link href={`/auctions/${item.auctionId}/lots/${item.id}`} className="flex items-center gap-2 py-1.5">
                        <div className="relative h-12 w-12 flex-shrink-0 bg-muted rounded-sm overflow-hidden">
                          <Image src={item.imageUrl} alt={item.title} fill className="object-cover" data-ai-hint={item.dataAiHint || "item visto recentemente"} />
                        </div>
                        <span className="text-xs truncate flex-grow">{item.title}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/dashboard/history" className="flex items-center justify-center text-primary hover:underline text-xs py-1">
                      Ver Histórico Completo
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
             {isClient && recentlyViewedItems.length === 0 && (
                <Link href="/dashboard/history" className="text-sm text-muted-foreground hover:text-primary font-medium">
                    Histórico de Navegação
                </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
