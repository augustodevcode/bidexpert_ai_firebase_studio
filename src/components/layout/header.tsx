
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle2, LogIn, UserPlus, LogOut, LayoutDashboard, Settings, Heart, Gavel, ShoppingBag, FileText, History, BarChart, Bell, ListChecks, Tv, Briefcase as ConsignorIcon, ShieldCheck, Coins, Search as SearchIcon, Menu, ChevronDown, Package, Home as HomeIcon } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { auth } from '@/lib/firebase'; // Ainda necessário para logout do Firebase
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useRef } from 'react';
import { hasPermission, hasAnyPermission } from '@/lib/permissions';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"; // Adicionado SheetHeader, SheetTitle, SheetDescription
import MainNav from './main-nav';
import UserNav from './user-nav';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import type { RecentlyViewedLotInfo, Lot, LotCategory, PlatformSettings } from '@/types';
import { sampleLots, slugify } from '@/lib/sample-data';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getFavoriteLotIdsFromStorage } from '@/lib/favorite-store';
import { getRecentlyViewedIds } from '@/lib/recently-viewed-store';
import { getPlatformSettings } from '@/app/admin/settings/actions';

// Email do comitente de exemplo (para simular o próprio comitente acessando)
const EXAMPLE_CONSIGNOR_EMAIL = 'consignor@bidexpert.com';

export default function Header() {
  const [recentlyViewedItems, setRecentlyViewedItems] = useState<RecentlyViewedLotInfo[]>([]);
  const [searchCategories, setSearchCategories] = useState<LotCategory[]>([]);
  const [isClient, setIsClient] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSearchCategorySlug, setSelectedSearchCategorySlug] = useState<string | undefined>(undefined);
  const [searchResults, setSearchResults] = useState<Lot[]>([]);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useAuth();

  const placeholderNotificationsCount = 3; 
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const siteTitle = platformSettings?.siteTitle || 'BidExpert';
  const siteTagline = platformSettings?.siteTagline;


  useEffect(() => {
    setIsClient(true);

    async function fetchInitialData() {
      try {
        const settings = await getPlatformSettings();
        setPlatformSettings(settings);
      } catch (error) {
        console.error("Error fetching platform settings for header:", error);
      }

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

      try {
        const fetchedCategories = await getLotCategories();
        setSearchCategories(fetchedCategories);
      } catch (error) {
        console.error("Error fetching categories for search dropdown:", error);
        setSearchCategories([]);
      }
    }
    fetchInitialData();
    
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
    const debounceTimer = setTimeout(() => {
      const filtered = sampleLots.filter(lot => {
        const term = searchTerm.toLowerCase();
        const categoryMatch = selectedSearchCategorySlug && selectedSearchCategorySlug !== 'todas'
          ? slugify(lot.type) === selectedSearchCategorySlug
          : true;

        const textMatch = (
          lot.title.toLowerCase().includes(term) ||
          (lot.description && lot.description.toLowerCase().includes(term)) ||
          lot.auctionName.toLowerCase().includes(term) ||
          lot.id.toLowerCase().includes(term)
        );
        return categoryMatch && textMatch;
      });
      setSearchResults(filtered.slice(0, 7));
      setIsSearchDropdownOpen(true);
      setIsSearchLoading(false);
    }, 500); 

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedSearchCategorySlug]);
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      let query = `term=${encodeURIComponent(searchTerm.trim())}`;
      if (selectedSearchCategorySlug && selectedSearchCategorySlug !== 'todas') {
        query += `&category=${selectedSearchCategorySlug}`;
      }
      router.push(`/search?${query}`);
      setIsSearchDropdownOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full shadow-md">
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 flex h-20 items-center justify-between">
          <div className="flex items-center">
            {/* Mobile Menu Trigger */}
            <div className="md:hidden mr-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-primary/80 focus-visible:ring-primary-foreground" aria-label="Abrir Menu">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0 bg-background text-foreground">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle className="flex items-center space-x-2 text-lg font-semibold">
                      <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                        <AvatarImage src="https://placehold.co/40x40.png?text=BE" alt={`${siteTitle} Logo Small`} data-ai-hint="logo initial" />
                        <AvatarFallback>{siteTitle.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-primary">{siteTitle}</span>
                    </SheetTitle>
                    {/* <SheetDescription>Navegue pelo site.</SheetDescription> */}
                  </SheetHeader>
                  <nav className="flex flex-col gap-1 p-4">
                    <MainNav className="flex-col items-start space-x-0 space-y-0" />
                    <div className="mt-auto pt-4 border-t">
                      <UserNav />
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>

            {/* Logo and Tagline */}
            <Link href="/" className="mr-4 flex flex-col items-start sm:items-center sm:flex-row sm:space-x-3">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 bg-primary-foreground text-primary">
                  <AvatarImage src="https://placehold.co/40x40.png?text=BE" alt={`${siteTitle} Logo`} data-ai-hint="logo initial" />
                  <AvatarFallback className="font-bold text-xl">{siteTitle.substring(0,2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-bold text-xl sm:text-3xl">
                  {siteTitle}
                </span>
              </div>
              {siteTagline && (
                <span className="text-xs sm:text-sm text-primary-foreground/80 mt-0 sm:mt-1 hidden md:block">
                  {siteTagline}
                </span>
              )}
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 justify-center items-center px-4">
            <form onSubmit={handleSearchSubmit} className="w-full max-w-xl">
              <div ref={searchContainerRef} className="relative flex w-full bg-background rounded-md shadow-sm">
                <Select
                  value={selectedSearchCategorySlug || 'todas'}
                  onValueChange={(value) => setSelectedSearchCategorySlug(value === 'todas' ? undefined : value)}
                >
                  <SelectTrigger
                    className="w-[150px] h-10 text-sm text-muted-foreground border-r border-input rounded-l-md rounded-r-none focus:ring-0 focus:ring-offset-0 bg-secondary/20 truncate"
                    aria-label="Selecionar Categoria de Busca"
                  >
                    <SelectValue placeholder="Categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas" className="text-sm">Todas</SelectItem>
                    {searchCategories.length > 0 ? (
                      searchCategories.map(cat => (
                        <SelectItem
                          key={cat.slug}
                          value={cat.slug}
                          className="text-sm"
                        >
                          {cat.name}
                        </SelectItem>
                      ))
                    ) : (
                       <div className="p-2 text-xs text-muted-foreground">Carregando categorias...</div>
                    )}
                  </SelectContent>
                </Select>
                <Input
                  type="search"
                  placeholder="Buscar em todo o site..."
                  className="h-10 pl-3 pr-10 flex-1 rounded-l-none rounded-r-md border-l-0 focus:ring-0 focus:ring-offset-0 text-foreground placeholder:text-muted-foreground"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => searchTerm.length >= 3 && setIsSearchDropdownOpen(true)}
                />
                <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  <SearchIcon className="h-4 w-4" />
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
           </div>

          {/* User Nav & Mobile Search Icon */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Mobile Search Icon - md:hidden to hide on medium and up */}
            <Button variant="ghost" size="icon" className="md:hidden hover:bg-primary/80 focus-visible:ring-primary-foreground" aria-label="Buscar">
              <SearchIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
            {user && (
              <Button variant="ghost" size="icon" className="relative hover:bg-primary/80 focus-visible:ring-primary-foreground sm:inline-flex" asChild aria-label="Notificações">
                <Link href="/dashboard/notifications">
                  <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
                  {placeholderNotificationsCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-primary-foreground text-primary border-primary">
                      {placeholderNotificationsCount}
                    </Badge>
                  )}
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="icon" className="relative hover:bg-primary/80 focus-visible:ring-primary-foreground sm:inline-flex" asChild aria-label="Favoritos">
              <Link href="/dashboard/favorites">
                <Heart className="h-5 w-5 sm:h-6 sm:w-6" />
                {isClient && <Badge variant="destructive" className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-primary-foreground text-primary border-primary">{getFavoriteLotIdsFromStorage().length > 0 ? getFavoriteLotIdsFromStorage().length : 0}</Badge>}
              </Link>
            </Button>
             <UserNav />
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar - Desktop */}
      <div className="border-b bg-background text-foreground hidden md:block">
        <div className="container mx-auto px-4 flex h-12 items-center justify-between">
          <div className="flex items-center text-sm font-medium">
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1" aria-label="Início">
              <HomeIcon className="h-4 w-4" />
            </Link>
          </div>

          <nav className="flex items-center space-x-3 lg:space-x-4 text-xs sm:text-sm">
              <MainNav />
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
                  {recentlyViewedItems.slice(0, 5).map(item => (
                    <DropdownMenuItem key={item.id} asChild className="cursor-pointer">
                      <Link href={`/auctions/${item.auctionId}/lots/${item.id}`} className="flex items-center gap-2 py-1.5">
                        <div className="relative h-12 w-16 flex-shrink-0 bg-muted rounded-sm overflow-hidden">
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
