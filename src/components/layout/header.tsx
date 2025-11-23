// src/components/layout/header.tsx
'use client';

import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Coins, Search as SearchIcon, Menu, Home as HomeIcon, Info, Percent, Tag, HelpCircle, Phone, History, ListChecks, Landmark, Gavel, Users, Briefcase as ConsignorIcon, UserCog, ShieldCheck, Tv, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState, useRef, useCallback, forwardRef, useMemo, Suspense } from 'react';
import { slugify } from '@/lib/ui-helpers';
import UserNav from './user-nav';
import MainNav, { type NavItem } from './main-nav';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { Loader2, Heart, Bell, X, Facebook, MessageSquareText, Mail } from 'lucide-react';
import type { RecentlyViewedLotInfo, Lot, LotCategory, PlatformSettings, AuctioneerProfileInfo, SellerProfileInfo, Auction } from '@/types';
import { getLotsByIds, getLots } from '@/app/admin/lots/actions';
import { getAuctions } from '@/app/admin/auctions/actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { getAuctioneers } from '@/app/admin/auctioneers/actions';
import { getFavoriteLotIdsFromStorage } from '@/lib/favorite-store';
import { getRecentlyViewedIds } from '@/lib/recently-viewed-store';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from '@/components/ui/scroll-area';
import DynamicBreadcrumbs from './dynamic-breadcrumbs';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import MegaMenuCategories from './mega-menu-categories';
import type { MegaMenuGroup } from './mega-menu-link-list';
import type { MegaMenuLinkItem } from './mega-menu-link-list';
import TwoColumnMegaMenu from './two-column-mega-menu';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from './theme-toggle'; // Importado

const HOME_VARIANT_STORAGE_KEY = 'bidexpert.homeVariantPreference';

// HistoryListItem é usado por MainNav quando renderiza o conteúdo do Histórico
export const HistoryListItem = forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & { item: RecentlyViewedLotInfo; onClick?: () => void }
>(({ className, item, onClick, ...props }, ref) => {
  return (
    <Link
      href={`/auctions/${item.auctionId}/lots/${item.publicId || item.id}`}
      ref={ref}
      className={cn(
        "flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent transition-colors text-xs leading-snug text-muted-foreground",
        className
      )}
      onClick={onClick}
      {...props}
    >
      <div className="relative h-10 w-12 flex-shrink-0 bg-muted rounded-sm overflow-hidden">
        <Image src={item.imageUrl || 'https://placehold.co/120x100.png'} alt={item.title} fill className="object-cover" data-ai-hint={item.dataAiHint || "item visto recentemente"} />
      </div>
      <span className="truncate flex-grow text-foreground/90">{item.title}</span>
    </Link>
  );
});
HistoryListItem.displayName = "HistoryListItem";

interface HeaderProps {
    platformSettings: PlatformSettings | null;
}

export default function Header({ 
    platformSettings,
}: HeaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [recentlyViewedItems, setRecentlyViewedItems] = useState<RecentlyViewedLotInfo[]>([]);
  const [allLots, setAllLots] = useState<Lot[]>([]); // New state for search
  const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
  const [categories, setCategories] = useState<LotCategory[]>([]);
  const [sellers, setSellers] = useState<SellerProfileInfo[]>([]);
  const [auctioneers, setAuctioneers] = useState<AuctioneerProfileInfo[]>([]);
  const [favoriteCount, setFavoriteCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSearchCategorySlug, setSelectedSearchCategorySlug] = useState<string | undefined>(undefined);
  const [searchResults, setSearchResults] = useState<Lot[]>([]);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParamsHook = useSearchParams();
  const { userProfileWithPermissions, unreadNotificationsCount } = useAuth();
  const currentParamsType = searchParamsHook.get('type');
  const currentCategoryParam = searchParamsHook.get('category');
  
  const siteTitle = platformSettings?.siteTitle || 'BidExpert';
  const siteTagline = platformSettings?.siteTagline;
  const siteLogoUrl = platformSettings?.logoUrl;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [homeVariant, setHomeVariant] = useState<'classic' | 'beta'>('classic');
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    const paramVariant = searchParamsHook.get('homeVariant');
    if (paramVariant === 'beta') {
      setHomeVariant('beta');
      window.localStorage.setItem(HOME_VARIANT_STORAGE_KEY, 'beta');
      return;
    }

    const storedVariant = window.localStorage.getItem(HOME_VARIANT_STORAGE_KEY);
    if (storedVariant === 'beta') {
      setHomeVariant('beta');
      if (pathname === '/' && paramVariant !== 'beta') {
        router.replace('/?homeVariant=beta');
      }
    } else {
      setHomeVariant('classic');
    }
  }, [isClient, pathname, router, searchParamsHook]);

  const handleHomeVariantChange = useCallback((value: 'classic' | 'beta') => {
    const normalized = value === 'beta' ? 'beta' : 'classic';
    setHomeVariant(normalized);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(HOME_VARIANT_STORAGE_KEY, normalized);
    }
    router.push(normalized === 'beta' ? '/?homeVariant=beta' : '/');
  }, [router]);

  useEffect(() => {
    if (!isClient) return;
    async function fetchClientSideData() {
      setIsLoading(true);
      try {
        const [
            fetchedLots,
            fetchedAuctions,
            fetchedCategories,
            fetchedSellers,
            fetchedAuctioneers
        ] = await Promise.all([
          getLots(undefined, true), 
          getAuctions(true, 20),
          getLotCategories(),
          getSellers(true, 20),
          getAuctioneers(true, 20)
        ]);

        setAllLots(fetchedLots);
        setAllAuctions(fetchedAuctions);
        setCategories(fetchedCategories);
        setSellers(fetchedSellers);
        setAuctioneers(fetchedAuctioneers);

        const viewedIds = getRecentlyViewedIds();
        if (viewedIds.length > 0) {
          const itemsData = await getLotsByIds(viewedIds);
          const items: RecentlyViewedLotInfo[] = viewedIds.map(id => {
              const lot = itemsData.find(l => l.id === id);
              return lot ? {
                id: lot.id,
                title: lot.title,
                imageUrl: lot.imageUrl,
                auctionId: lot.auctionId,
                dataAiHint: lot.dataAiHint,
                publicId: lot.publicId,
              } : null;
          }).filter(item => item !== null) as RecentlyViewedLotInfo[];
          setRecentlyViewedItems(items);
        } else {
          setRecentlyViewedItems([]);
        }
      } catch (error) {
        console.error("Error fetching client-side data for header:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchClientSideData();
  }, [isClient]);

  const onLinkClick = useCallback(() => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobileMenuOpen, setIsMobileMenuOpen]);

  const updateCounts = useCallback(() => {
    setFavoriteCount(getFavoriteLotIdsFromStorage().length);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    updateCounts();

    const handleStorageChange = () => updateCounts();
    window.addEventListener('favorites-updated', handleStorageChange);
    window.addEventListener('storage', (e) => {
        if (e.key === 'bidExpertFavoriteLotIds') {
            updateCounts();
        }
    });

    return () => {
        window.removeEventListener('favorites-updated', handleStorageChange);
        window.removeEventListener('storage', handleStorageChange);
    };
  }, [isClient, updateCounts]);
  
   const consignorMegaMenuGroups: MegaMenuGroup[] = useMemo(() => {
      const consignorItemsForMenu: MegaMenuLinkItem[] = sellers.map(seller => ({
          href: `/sellers/${seller.slug || seller.publicId || seller.id}`,
          label: seller.name,
          description: seller.city && seller.state ? `${seller.city} - ${seller.state}` : (seller.description ? seller.description.substring(0,40)+'...' : 'Ver perfil'),
          icon: seller.logoUrl ? <Avatar className="h-5 w-5 border"><AvatarImage src={seller.logoUrl!} alt={seller.name} data-ai-hint={seller.dataAiHintLogo || 'logo comitente'} /><AvatarFallback>{seller.name.charAt(0)}</AvatarFallback></Avatar> : undefined
      }));

      const formattedSellersForMenu: MegaMenuGroup[] = [{
          title: "Principais Comitentes",
          items: consignorItemsForMenu,
      }];
      return formattedSellersForMenu.filter(group => group.items.length > 0);
  }, [sellers]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      const filtered = allLots.filter(lot => {
        const term = searchTerm.toLowerCase();
        const categoryMatch = selectedSearchCategorySlug && selectedSearchCategorySlug !== 'todas'
          ? slugify(lot.type) === selectedSearchCategorySlug
          : true;

        const textMatch = (
          lot.title.toLowerCase().includes(term) ||
          (lot.description && lot.description.toLowerCase().includes(term)) ||
          (lot.auctionName && lot.auctionName.toLowerCase().includes(term)) ||
          lot.id.toLowerCase().includes(term)
        );
        return categoryMatch && textMatch;
      });
      setSearchResults(filtered.slice(0, 7));
      setIsSearchDropdownOpen(true);
      setIsSearchLoading(false);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedSearchCategorySlug, allLots]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      let query = `term=${encodeURIComponent(searchTerm.trim())}`;
      if (selectedSearchCategorySlug && selectedSearchCategorySlug !== 'todas') {
        query += `&category=${selectedSearchCategorySlug}`;
      }
      query += `&type=lots`; // Default search submit to lots
      router.push(`/search?${query}`);
      setIsSearchDropdownOpen(false);
    }
  };

  const allNavItemsForMobile: NavItem[] = [
    { label: 'Navegue por Categorias', isMegaMenu: true, contentKey: 'categories', href: '/search?type=lots&tab=categories', icon: Tag },
    { href: '/', label: 'Início', icon: HomeIcon },
    { label: 'Modalidades', isMegaMenu: true, contentKey: 'modalities', href: '/search?filter=modalities', icon: ListChecks },
    { label: 'Comitentes', isMegaMenu: true, contentKey: 'consignors', href: '/sellers', icon: Landmark },
    { label: 'Leiloeiros', isMegaMenu: true, contentKey: 'auctioneers', href: '/auctioneers', icon: Gavel },
    { label: 'Histórico', isMegaMenu: true, contentKey: 'history', href: '/dashboard/history', icon: History },
    { href: '/sell-with-us', label: 'Venda Conosco', icon: Percent },
  ];

  const firstNavItem: NavItem = { label: 'Categorias de Oportunidades', isMegaMenu: true, contentKey: 'categories', href: '/search?type=lots&tab=categories', icon: Tag, megaMenuAlign: 'start' };
  const centralNavItems: NavItem[] = [
    { href: '/', label: 'Início', icon: HomeIcon },
    {
        label: 'Modalidades',
        isMegaMenu: true,
        contentKey: 'modalities',
        href: '/search?filter=modalities',
        icon: ListChecks,
        megaMenuAlign: 'start',
        twoColumnMegaMenuProps: {
            sidebarTitle: 'Tipos de Leilão',
            mainContent: {
                imageUrl: 'https://picsum.photos/seed/judicial/400/225',
                imageAlt: 'Imagem Leilões Judiciais',
                dataAiHint: 'martelo tribunal',
                title: 'Oportunidades Únicas',
                description: 'Explore diversas modalidades de leilão, desde judiciais a extrajudiciais, e encontre o que procura.',
                buttonLink: '/search?type=auctions',
                buttonText: 'Ver Todos os Leilões'
            }
        }
    },
    {
        label: 'Comitentes',
        isMegaMenu: true,
        contentKey: 'consignors',
        href: '/sellers',
        icon: Landmark,
        megaMenuAlign: 'start',
        twoColumnMegaMenuProps: {
            sidebarTitle: 'Nossos Comitentes',
            mainContent: {
                imageUrl: 'https://picsum.photos/seed/sell/400/225',
                imageAlt: 'Imagem Venda Seus Bens',
                dataAiHint: 'acordo negocios',
                title: 'Venda Seus Ativos Conosco',
                description: 'Transforme seus bens em liquidez de forma rápida, segura e transparente através da nossa plataforma especializada.',
                buttonLink: '/sell-with-us',
                buttonText: 'Saiba Como Vender'
            }
        }
    },
    {
        label: 'Leiloeiros',
        isMegaMenu: true,
        contentKey: 'auctioneers',
        href: '/auctioneers',
        icon: Gavel,
        megaMenuAlign: 'start',
        twoColumnMegaMenuProps: {
            sidebarTitle: 'Leiloeiros Parceiros',
            mainContent: {
                imageUrl: 'https://picsum.photos/seed/auctioneer/400/225',
                imageAlt: 'Imagem Leiloeiros Parceiros',
                dataAiHint: 'leiloeiro publico',
                title: 'Profissionais Qualificados',
                description: 'Conheça os leiloeiros que garantem a transparência e o sucesso dos nossos leilões.',
                buttonLink: '/auctioneers',
                buttonText: 'Conheça Nossos Leiloeiros'
            }
        }
    },
    {
        label: 'Histórico',
        isMegaMenu: true,
        contentKey: 'history',
        icon: History,
        href: '/dashboard/history',
        megaMenuAlign: 'end'
    },
    { href: '/sell-with-us', label: 'Venda Conosco', icon: Percent },
  ];

  return (
    <>
    <header className="sticky top-0 z-50 w-full shadow-md print:hidden" data-ai-id="header">
      {/* Promotion Bar */}
      <div className="bg-primary/80 text-primary-foreground text-xs sm:text-sm">
        <div className="container mx-auto px-4 h-10 flex items-center justify-center sm:justify-between">
          <p className="text-center sm:text-left">
            <Percent className="inline h-4 w-4 mr-1.5" />
            <strong>Leilão Especial de Veículos Clássicos!</strong> Lances a partir de R$1.000!
          </p>
          <Button size="sm" variant="link" asChild className="text-primary-foreground hover:text-primary-foreground/80 hidden sm:inline-flex h-auto py-1 px-2">
            <Link href="/search?type=lots&tab=categories&category=veiculos">Ver Agora</Link>
          </Button>
        </div>
      </div>

      {/* Top Bar (Informational) */}
      <div className="bg-secondary text-secondary-foreground text-xs border-b">
        <div className="container mx-auto px-4 h-10 flex items-center justify-between">
          <div className="hidden sm:block">
            {siteTitle ? `Bem-vindo ao ${siteTitle}! Sua plataforma de leilões online.` : <Skeleton className="h-4 w-64" />}
          </div>
          <nav className="flex items-center space-x-3 sm:space-x-4">
            <Link href="/faq" className="hover:text-primary transition-colors flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5" /> Ajuda/FAQ
            </Link>
            <Link href="/contact" className="hover:text-primary transition-colors flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" /> Contato
            </Link>
          </nav>
        </div>
      </div>

      {/* Logo and Search Area */}
      <div className="bg-background text-foreground border-b">
        <div className="container mx-auto px-4 flex h-20 items-center justify-between">
          <div className="flex items-center">
            <div className="md:hidden mr-2">
               <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-accent focus-visible:ring-accent-foreground" aria-label="Abrir Menu">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0 bg-card text-card-foreground flex flex-col">
                    <SheetHeader className="p-4 border-b flex-shrink-0">
                      <SheetTitle className="flex items-center space-x-2 text-lg font-semibold">
                         {siteLogoUrl ? (
                            <Image src={siteLogoUrl} alt={`${siteTitle} Logo`} width={40} height={40} className="object-contain" />
                          ) : (
                            <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                                <AvatarFallback>{siteTitle.charAt(0)}</AvatarFallback>
                            </Avatar>
                          )}
                        <span className="text-primary">{siteTitle}</span>
                      </SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="flex-grow">
                        <nav className="flex flex-col gap-1 p-4">
                        {isLoading ? <p>Carregando...</p> : 
                        <MainNav
                            items={allNavItemsForMobile}
                            onLinkClick={onLinkClick}
                            isMobile={true}
                            searchCategories={categories}
                            auctioneers={auctioneers}
                            consignorMegaMenuGroups={consignorMegaMenuGroups}
                            recentlyViewedItems={recentlyViewedItems}
                            HistoryListItemComponent={HistoryListItem}
                        />
                        }
                        </nav>
                    </ScrollArea>
                    <div className="p-4 border-t flex-shrink-0">
                      <UserNav />
                    </div>
                </SheetContent>
              </Sheet>
            </div>
            <Link href="/" className="mr-4 flex flex-col items-start sm:items-center sm:flex-row sm:space-x-3">
              <div className="flex items-center space-x-2 sm:space-x-3">
                 {siteLogoUrl ? (
                    <Image src={siteLogoUrl} alt={`${siteTitle} Logo`} width={40} height={40} className="object-contain" />
                 ) : (
                    <Coins className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                 )}
                <span className="font-bold text-xl sm:text-3xl">
                  {isLoading ? <Skeleton className="h-8 w-32" /> : siteTitle}
                </span>
              </div>
              {siteTagline && (
                <span className="text-xs sm:text-sm text-muted-foreground mt-0 sm:mt-1 hidden md:block">
                   {isLoading ? <Skeleton className="h-4 w-48" /> : siteTagline}
                </span>
              )}
            </Link>
          </div>

          <div className="hidden md:flex flex-1 justify-center items-center px-4">
            <form onSubmit={handleSearchSubmit} className="w-full max-w-xl">
              <div ref={searchContainerRef} className="relative flex w-full bg-background rounded-md shadow-sm border border-input">
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
                    {categories.length > 0 ? (
                      categories.map(cat => (
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
                  className="h-10 pl-3 pr-10 flex-1 rounded-l-none rounded-r-md border-0 focus:ring-0 focus:ring-offset-0 text-foreground placeholder:text-muted-foreground"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => searchTerm.length >= 3 && setIsSearchDropdownOpen(true)}
                />
                <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground" aria-label="Buscar">
                  <SearchIcon className="h-4 w-4" />
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
                              <div className="relative h-12 w-16 flex-shrink-0 bg-muted rounded-sm overflow-hidden mr-3">
                                <Image src={lot.imageUrl || "https://placehold.co/120x90.png"} alt={lot.title} fill className="object-cover" data-ai-hint={lot.dataAiHint || "resultado busca"} />
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
                            Ver todos os resultados para &ldquo;{searchTerm}&rdquo;
                          </Button>
                        </li>
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </form>
           </div>
          <div className="flex items-center space-x-0.5 sm:space-x-1">
            <div className="sm:hidden mr-2">
              <Button
                type="button"
                variant={homeVariant === 'beta' ? 'default' : 'outline'}
                size="sm"
                className="text-[11px] uppercase tracking-wide"
                onClick={() => handleHomeVariantChange(homeVariant === 'beta' ? 'classic' : 'beta')}
              >
                {homeVariant === 'beta' ? 'Beta ativa' : 'Testar Beta'}
              </Button>
            </div>
            <div className="hidden sm:flex flex-col mr-3 min-w-[160px]">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Home</span>
              <Select
                value={homeVariant}
                onValueChange={(value) => handleHomeVariantChange(value as 'classic' | 'beta')}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Experiência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">Clássica</SelectItem>
                  <SelectItem value="beta">Beta (Radar)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <TooltipProvider>
              <ThemeToggle />
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button asChild variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                            <Link href="/map-search" aria-label="Busca por Mapa">
                                <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Busca por Mapa</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>

             <TooltipProvider>
                 <Tooltip>
                    <TooltipTrigger asChild>
                         <Button variant="ghost" size="icon" className="md:hidden hover:bg-accent focus-visible:ring-accent-foreground h-9 w-9 sm:h-10 sm:w-10" aria-label="Buscar em todo o site" asChild>
                            <Link href="/search">
                                <SearchIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Buscar em todo o site</p></TooltipContent>
                </Tooltip>
             </TooltipProvider>
            <UserNav />
          </div>
        </div>
      </div>

      {/* Main Navigation Bar - Desktop */}
      <div className="border-b bg-background text-foreground hidden md:block">
        <div className="container mx-auto px-4 flex h-12 items-center justify-between">
            {/* Categorias Megamenu (à esquerda) */}
            {firstNavItem && firstNavItem.isMegaMenu && (
            <NavigationMenu className="relative z-10 flex items-center justify-start">
                <NavigationMenuList>
                <NavigationMenuItem value={firstNavItem.label}>
                    <NavigationMenuTrigger
                        className={cn(
                            navigationMenuTriggerStyle(),
                            (pathname?.startsWith('/category') || (pathname === '/search' && (currentParamsType === 'lots' || currentCategoryParam))) && 'bg-accent text-primary font-semibold',
                            'font-semibold'
                        )}
                    >
                    {firstNavItem.icon && <firstNavItem.icon className="mr-1.5 h-4 w-4" /> }
                    {firstNavItem.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent align={firstNavItem.megaMenuAlign || "start"}>
                    {firstNavItem.contentKey === 'categories' && <MegaMenuCategories categories={categories} onLinkClick={onLinkClick} />}
                </NavigationMenuContent>
                </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>
            )}

            {/* Itens Centrais de Navegação */}
            <div className="flex-grow flex justify-start pl-4">
                <MainNav
                    items={centralNavItems}
                    onLinkClick={onLinkClick}
                    className="hidden md:flex"
                    searchCategories={categories}
                    auctioneers={auctioneers}
                    consignorMegaMenuGroups={consignorMegaMenuGroups}
                    recentlyViewedItems={recentlyViewedItems}
                    HistoryListItemComponent={HistoryListItem}
                />
            </div>
        </div>
      </div>

    </header>
    {pathname !== '/' && (
      <DynamicBreadcrumbs />
    )}
    </>
  );
}
