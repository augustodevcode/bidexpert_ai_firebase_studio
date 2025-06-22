
      'use client';

import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation'; // Importado useSearchParams
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Coins, Search as SearchIcon, Menu, Home as HomeIcon, Info, Percent, Tag, HelpCircle, Phone, History, ListChecks, Landmark, Gavel, Users, Briefcase as ConsignorIcon, UserCog, ShieldCheck, Tv, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useRef, useCallback, forwardRef } from 'react';
import MainNav, { type NavItem } from './main-nav';
import UserNav from './user-nav';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Loader2, Heart, Bell, X, Facebook, MessageSquareText, Mail } from 'lucide-react';
import type { RecentlyViewedLotInfo, Lot, LotCategory, PlatformSettings, AuctioneerProfileInfo, SellerProfileInfo } from '@/types';
import { sampleLots, slugify } from '@/lib/sample-data';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getFavoriteLotIdsFromStorage } from '@/lib/favorite-store';
import { getRecentlyViewedIds } from '@/lib/recently-viewed-store';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import DynamicBreadcrumbs from './dynamic-breadcrumbs';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from '@/lib/utils';
import MegaMenuCategories from './mega-menu-categories';
import { getAuctioneers } from '@/app/admin/auctioneers/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import type { MegaMenuGroup } from './mega-menu-link-list';
import type { MegaMenuLinkItem } from './mega-menu-link-list';
import TwoColumnMegaMenu from './two-column-mega-menu';


// HistoryListItem é usado por MainNav quando renderiza o conteúdo do Histórico
export const HistoryListItem = forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & { item: RecentlyViewedLotInfo; onClick?: () => void }
>(({ className, item, onClick, ...props }, ref) => {
  return (
    <Link
      href={`/auctions/${item.auctionId}/lots/${item.id}`}
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

export default function Header() {
  const [recentlyViewedItems, setRecentlyViewedItems] = useState<RecentlyViewedLotInfo[]>([]);
  const [searchCategories, setSearchCategories] = useState<LotCategory[]>([]);
  const [auctioneers, setAuctioneers] = useState<AuctioneerProfileInfo[]>([]);
  const [consignorMegaMenuGroups, setConsignorMegaMenuGroups] = useState<MegaMenuGroup[]>([]);
  const [isClient, setIsClient] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSearchCategorySlug, setSelectedSearchCategorySlug] = useState<string | undefined>(undefined);
  const [searchResults, setSearchResults] = useState<Lot[]>([]);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParamsHook = useSearchParams();
  const { user } = useAuth();

  const placeholderNotificationsCount = 3;
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const siteTitle = platformSettings?.siteTitle || 'BidExpert';
  const siteTagline = platformSettings?.siteTagline;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLinkOrMobileMenuCloseClick = useCallback(() => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobileMenuOpen, setIsMobileMenuOpen]);

  useEffect(() => {
    setIsClient(true);

    async function fetchInitialData() {
      console.log('[Header fetchInitialData] Iniciando busca de dados...');
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
      console.log('[Header fetchInitialData] Recently viewed items:', items.length);


      try {
        const [fetchedCategories, fetchedAuctioneers, fetchedSellers] = await Promise.all([
          getLotCategories(),
          getAuctioneers(),
          getSellers()
        ]);
        setSearchCategories(fetchedCategories);
        console.log('[Header fetchInitialData] Fetched Categories for search/nav:', fetchedCategories.length);
        setAuctioneers(fetchedAuctioneers);
        console.log('[Header fetchInitialData] Fetched Auctioneers for nav:', fetchedAuctioneers.length);

        const consignorItemsForMenu: MegaMenuLinkItem[] = fetchedSellers.map(seller => ({
            href: `/sellers/${seller.slug || seller.publicId || seller.id}`,
            label: seller.name,
            description: seller.city && seller.state ? `${seller.city} - ${seller.state}` : (seller.description ? seller.description.substring(0,40)+'...' : 'Ver perfil'),
            icon: seller.logoUrl ? <Avatar className="h-5 w-5 border"><AvatarImage src={seller.logoUrl!} alt={seller.name} data-ai-hint={seller.dataAiHintLogo || 'logo comitente'} /><AvatarFallback>{seller.name.charAt(0)}</AvatarFallback></Avatar> : undefined
        }));

        const formattedSellersForMenu: MegaMenuGroup[] = [{
            title: "Principais Comitentes",
            items: consignorItemsForMenu,
        }];
        setConsignorMegaMenuGroups(formattedSellersForMenu.filter(group => group.items.length > 0));
        console.log('[Header fetchInitialData] Formatted Consignors Groups for nav (total items):', consignorItemsForMenu.length);

      } catch (error) {
        console.error("Error fetching data for main navigation:", error);
        setSearchCategories([]);
        setAuctioneers([]);
        setConsignorMegaMenuGroups([]);
      }
    }
    fetchInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    { label: 'Histórico', isMegaMenu: true, contentKey: 'history', icon: History, href: '/dashboard/history' },
    { href: '/sell-with-us', label: 'Venda Conosco', icon: Percent },
    { href: '/contact', label: 'Fale Conosco', icon: Phone },
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
                imageUrl: 'https://placehold.co/400x225.png?text=Leiloes+Judiciais',
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
                imageUrl: 'https://placehold.co/400x225.png?text=Venda+Seus+Bens',
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
                imageUrl: 'https://placehold.co/400x225.png?text=Leiloeiros+Parceiros',
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
    { href: '/contact', label: 'Fale Conosco', icon: Phone },
  ];


  return (
    <header className="sticky top-0 z-50 w-full shadow-md">
      {/* Promotion Bar */}
      <div className="bg-primary/80 text-primary-foreground text-xs sm:text-sm">
        <div className="container mx-auto px-4 h-10 flex items-center justify-center sm:justify-between">
          <p className="text-center sm:text-left">
            <Percent className="inline h-4 w-4 mr-1.5" />
            <strong>Leilão Especial de Veículos Clássicos!</strong> Lances a partir de R$1.000!
          </p>
          <Button size="sm" variant="link" asChild className="text-primary-foreground hover:text-primary-foreground/80 hidden sm:inline-flex h-auto py-1 px-2">
            <Link href="/search?category=veiculos&status=EM_BREVE">Ver Agora</Link>
          </Button>
        </div>
      </div>

      {/* Top Bar (Informational) */}
      <div className="bg-secondary text-secondary-foreground text-xs border-b">
        <div className="container mx-auto px-4 h-10 flex items-center justify-between">
          <div className="hidden sm:block">
            Bem-vindo ao {siteTitle}! Sua plataforma de leilões online.
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
                <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0 bg-card text-card-foreground">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle className="flex items-center space-x-2 text-lg font-semibold">
                      <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                        <AvatarImage src="https://placehold.co/40x40.png?text=BE" alt={`${siteTitle} Logo Small`} data-ai-hint="logo initial" />
                        <AvatarFallback>{siteTitle.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-primary">{siteTitle}</span>
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-1 p-4">
                    <MainNav
                        items={allNavItemsForMobile}
                        onLinkClick={handleLinkOrMobileMenuCloseClick}
                        isMobile={true}
                        searchCategories={searchCategories}
                        auctioneers={auctioneers}
                        consignorMegaMenuGroups={consignorMegaMenuGroups}
                        recentlyViewedItems={recentlyViewedItems}
                        HistoryListItemComponent={HistoryListItem}
                    />
                    <div className="mt-auto pt-4 border-t">
                      <UserNav />
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
            <Link href="/" className="mr-4 flex flex-col items-start sm:items-center sm:flex-row sm:space-x-3">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Coins className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                <span className="font-bold text-xl sm:text-3xl">
                  {siteTitle}
                </span>
              </div>
              {siteTagline && (
                <span className="text-xs sm:text-sm text-muted-foreground mt-0 sm:mt-1 hidden md:block">
                  {siteTagline}
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
          <div className="flex items-center space-x-0.5 sm:space-x-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-accent focus-visible:ring-accent-foreground h-9 w-9 sm:h-10 sm:w-10" aria-label="Busca por Mapa" asChild>
                  <Link href="/map-search">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Busca por Mapa</p></TooltipContent>
            </Tooltip>
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
            {user && (
              <Button variant="ghost" size="icon" className="relative hover:bg-accent focus-visible:ring-accent-foreground h-9 w-9 sm:h-10 sm:w-10" asChild aria-label="Notificações">
                <Link href="/dashboard/notifications">
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  {placeholderNotificationsCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-accent-foreground text-accent border-accent">
                      {placeholderNotificationsCount}
                    </Badge>
                  )}
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="icon" className="relative hover:bg-accent focus-visible:ring-accent-foreground h-9 w-9 sm:h-10 sm:w-10" asChild aria-label="Favoritos">
              <Link href="/dashboard/favorites">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
                {isClient && <Badge variant="destructive" className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-accent-foreground text-accent border-accent">{getFavoriteLotIdsFromStorage().length > 0 ? getFavoriteLotIdsFromStorage().length : 0}</Badge>}
              </Link>
            </Button>
             <UserNav />
          </div>
        </div>
      </div>

      {/* Main Navigation Bar - Desktop */}
      <div className="border-b bg-background text-foreground hidden md:block">
        <div className="container mx-auto px-4 flex h-12 items-center justify-between">
            {/* Categorias Megamenu (à esquerda) */}
            {isClient && firstNavItem && firstNavItem.isMegaMenu && (
            <NavigationMenu className="relative z-10 flex items-center justify-start">
                <NavigationMenuList>
                <NavigationMenuItem value={firstNavItem.label}>
                    <NavigationMenuTrigger
                        className={cn(
                            navigationMenuTriggerStyle(),
                            (pathname?.startsWith('/category') || (pathname === '/search' && (searchParamsHook.get('type') === 'lots' || searchParamsHook.get('tab') === 'categories'))) && 'bg-accent text-primary font-semibold',
                            'font-semibold'
                        )}
                    >
                    {firstNavItem.icon && <firstNavItem.icon className="mr-1.5 h-4 w-4" /> }
                    {firstNavItem.label}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent align={firstNavItem.megaMenuAlign || "start"}>
                     {firstNavItem.contentKey === 'categories' && <MegaMenuCategories categories={searchCategories} onLinkClick={handleLinkOrMobileMenuCloseClick} />}
                  </NavigationMenuContent>
                </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>
            )}

            {/* Itens Centrais de Navegação */}
            <div className="flex-grow flex justify-start pl-4">
                <MainNav
                    items={centralNavItems}
                    onLinkClick={handleLinkOrMobileMenuCloseClick}
                    className="hidden md:flex"
                    searchCategories={searchCategories}
                    auctioneers={auctioneers}
                    consignorMegaMenuGroups={consignorMegaMenuGroups}
                    recentlyViewedItems={recentlyViewedItems}
                    HistoryListItemComponent={HistoryListItem}
                />
            </div>
        </div>
      </div>

      {/* Breadcrumbs Bar */}
      {isClient && pathname !== '/' && (
        <nav aria-label="Breadcrumb" className="bg-secondary text-secondary-foreground text-xs py-2.5 border-b h-10 flex items-center">
            <div className="container mx-auto px-4">
                <DynamicBreadcrumbs />
            </div>
        </nav>
      )}
    </header>
  );
}
    
      
    

    