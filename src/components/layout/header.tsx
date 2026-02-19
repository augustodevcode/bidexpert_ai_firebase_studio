// src/components/layout/header.tsx
'use client';

import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Coins, Search as SearchIcon, Menu, Home as HomeIcon, Info, Percent, Tag, HelpCircle, Phone, History, ListChecks, Landmark, Gavel, Users, Briefcase as ConsignorIcon, UserCog, ShieldCheck, Tv, MapPin, Radar } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState, useRef, useCallback, forwardRef, useMemo, Suspense, type CSSProperties } from 'react';
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

type HeaderCSSVars = CSSProperties & { '--header-height'?: string };

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
  
  useEffect(() => {
    setIsClient(true);
  }, []);

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
    { href: '/home-v2', label: 'Nova Home', icon: HomeIcon },
    { href: '/?homeVariant=beta', label: 'Radar de Leilões', icon: Radar },
    { label: 'Modalidades', isMegaMenu: true, contentKey: 'modalities', href: '/search?filter=modalities', icon: ListChecks },
    { label: 'Comitentes', isMegaMenu: true, contentKey: 'consignors', href: '/sellers', icon: Landmark },
    { label: 'Leiloeiros', isMegaMenu: true, contentKey: 'auctioneers', href: '/auctioneers', icon: Gavel },
    { label: 'Histórico', isMegaMenu: true, contentKey: 'history', href: '/dashboard/history', icon: History },
    { href: '/sell-with-us', label: 'Venda Conosco', icon: Percent },
  ];

  const firstNavItem: NavItem = { label: 'Categorias de Oportunidades', isMegaMenu: true, contentKey: 'categories', href: '/search?type=lots&tab=categories', icon: Tag, megaMenuAlign: 'start' };
    const centralNavItems: NavItem[] = [
    { href: '/', label: 'Início', icon: HomeIcon },
    { href: '/home-v2', label: 'Nova Home', icon: HomeIcon },
    { href: '/?homeVariant=beta', label: 'Radar de Leilões', icon: Radar },
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

  const headerStyle = useMemo<HeaderCSSVars>(() => ({ '--header-height': '15rem' }), []);

  return (
    <>
    <header
      className="header-main-sticky"
      data-ai-id="header-main"
      style={headerStyle}
    >
      {/* Promotion Bar */}
      <div className="wrapper-promo-bar" data-ai-id="header-promo-bar">
        <div className="container-promo-bar" data-ai-id="header-promo-container">
          <p className="text-promo-message" data-ai-id="header-promo-text">
            <Percent className="icon-promo-percent" />
            <strong>Leilão Especial de Veículos Clássicos!</strong> Lances a partir de R$1.000!
          </p>
          <Button size="sm" variant="link" asChild className="btn-promo-action" data-ai-id="header-promo-button">
            <Link href="/search?type=lots&tab=categories&category=veiculos">Ver Agora</Link>
          </Button>
        </div>
      </div>

      {/* Top Bar (Informational) */}
      <div className="wrapper-top-bar" data-ai-id="header-top-bar">
        <div className="container-top-bar" data-ai-id="header-top-container">
          <div className="wrapper-welcome-msg" data-ai-id="header-welcome-message">
            {siteTitle ? `Bem-vindo ao ${siteTitle}! Sua plataforma de leilões online.` : <Skeleton className="skeleton-welcome-msg" />}
          </div>
          <nav className="nav-top-links" data-ai-id="header-top-nav">
            <Link href="/faq" className="link-top-nav" data-ai-id="header-link-faq">
              <HelpCircle className="icon-top-nav" /> Ajuda/FAQ
            </Link>
            <Link href="/contact" className="link-top-nav" data-ai-id="header-link-contact">
              <Phone className="icon-top-nav" /> Contato
            </Link>
          </nav>
        </div>
      </div>

      {/* Logo and Search Area */}
      <div className="wrapper-logo-search-bar" data-ai-id="header-middle-bar">
        <div className="container-logo-search" data-ai-id="header-middle-container">
          <div className="wrapper-header-brand-mobile" data-ai-id="header-brand-section">
            <div className="wrapper-mobile-menu-trigger" data-ai-id="header-mobile-menu">
               <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="btn-mobile-menu" aria-label="Abrir Menu" data-ai-id="header-menu-button">
                    <Menu className="icon-mobile-menu" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="sheet-mobile-menu" data-ai-id="header-mobile-sheet">
                    <SheetHeader className="header-mobile-sheet" data-ai-id="header-mobile-sheet-header">
                      <SheetTitle className="title-mobile-sheet" data-ai-id="header-mobile-sheet-title">
                         {siteLogoUrl ? (
                            <Image src={siteLogoUrl} alt={`${siteTitle} Logo`} width={40} height={40} className="img-mobile-logo" />
                          ) : (
                            <Avatar className="avatar-mobile-logo" data-ai-id="header-mobile-avatar">
                                <AvatarFallback>{siteTitle.charAt(0)}</AvatarFallback>
                            </Avatar>
                          )}
                        <span className="text-mobile-brand">{siteTitle}</span>
                      </SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="scroll-mobile-menu" data-ai-id="header-mobile-scroll">
                        <nav className="nav-mobile-links" data-ai-id="header-mobile-nav">
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
                    <div className="footer-mobile-sheet" data-ai-id="header-mobile-footer">
                      <UserNav />
                    </div>
                </SheetContent>
              </Sheet>
            </div>
            <Link href="/" className="link-header-logo-main" data-ai-id="header-logo-link-main">
              <div className="wrapper-logo-text" data-ai-id="header-logo-wrapper">
                 {siteLogoUrl ? (
                    <Image src={siteLogoUrl} alt={`${siteTitle} Logo`} width={40} height={40} className="img-header-logo" />
                 ) : (
                    <Coins className="icon-header-logo-main" />
                 )}
                <span className="text-header-title">
                  {isLoading ? <Skeleton className="skeleton-header-title" /> : siteTitle}
                </span>
              </div>
              {siteTagline && (
                <span className="text-header-tagline" data-ai-id="header-tagline">
                   {isLoading ? <Skeleton className="skeleton-header-tagline" /> : siteTagline}
                </span>
              )}
            </Link>
          </div>

          <div className="wrapper-header-search-desktop" data-ai-id="header-search-section">
            <form onSubmit={handleSearchSubmit} className="form-header-search" data-ai-id="header-search-form">
              <div ref={searchContainerRef} className="container-header-search-input" data-ai-id="header-search-container">
                <Select
                  value={selectedSearchCategorySlug || 'todas'}
                  onValueChange={(value) => setSelectedSearchCategorySlug(value === 'todas' ? undefined : value)}
                >
                  <SelectTrigger
                    className="select-header-search-category"
                    aria-label="Selecionar Categoria de Busca"
                    data-ai-id="header-search-category-select"
                  >
                    <SelectValue placeholder="Categorias" />
                  </SelectTrigger>
                  <SelectContent className="select-content-search">
                    <SelectItem value="todas" className="item-search-category">Todas</SelectItem>
                    {categories.length > 0 ? (
                      categories.map(cat => (
                        <SelectItem
                          key={cat.slug}
                          value={cat.slug}
                          className="item-search-category"
                        >
                          {cat.name}
                        </SelectItem>
                      ))
                    ) : (
                       <div className="text-search-loading">Carregando categorias...</div>
                    )}
                  </SelectContent>
                </Select>
                <Input
                  type="search"
                  placeholder="Buscar em todo o site..."
                  className="input-header-search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => searchTerm.length >= 3 && setIsSearchDropdownOpen(true)}
                  data-ai-id="header-search-input"
                />
                <Button type="submit" size="icon" className="btn-header-search-submit" aria-label="Buscar" data-ai-id="header-search-submit">
                  <SearchIcon className="icon-search-submit" />
                </Button>
                {isSearchDropdownOpen && (
                  <div className="wrapper-search-dropdown" data-ai-id="header-search-dropdown">
                    {isSearchLoading && (
                      <div className="wrapper-search-loading" data-ai-id="header-search-loading">
                        <Loader2 className="icon-search-loading-spinner" /> Buscando...
                      </div>
                    )}
                    {!isSearchLoading && searchResults.length === 0 && searchTerm.length >=3 && (
                      <div className="text-search-no-results" data-ai-id="header-search-no-results">Nenhum lote encontrado.</div>
                    )}
                    {!isSearchLoading && searchResults.length > 0 && (
                      <ul className="list-search-results" data-ai-id="header-search-results-list">
                        {searchResults.map(lot => (
                          <li key={lot.id} className="item-search-result" data-ai-id={`header-search-result-${lot.id}`}>
                            <Link
                              href={`/auctions/${lot.auctionId}/lots/${lot.id}`}
                              className="link-search-result"
                              onClick={() => setIsSearchDropdownOpen(false)}
                            >
                              <div className="wrapper-search-result-image" data-ai-id="header-search-result-image-wrapper">
                                <Image src={lot.imageUrl || "https://placehold.co/120x90.png"} alt={lot.title} fill className="img-search-result" data-ai-hint={lot.dataAiHint || "resultado busca"} />
                              </div>
                              <div className="wrapper-search-result-info">
                                <p className="text-search-result-title">{lot.title}</p>
                                <p className="text-search-result-price">
                                  R$ {lot.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                </p>
                              </div>
                            </Link>
                          </li>
                        ))}
                         <li className="item-search-view-all">
                          <Button variant="link" className="btn-search-view-all" onClick={handleSearchSubmit} data-ai-id="header-search-view-all">
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
          <div className="wrapper-header-actions" data-ai-id="header-actions-section">

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button asChild variant="ghost" size="icon" className="btn-header-action" data-ai-id="header-action-map">
                            <Link href="/map-search" aria-label="Busca por Mapa">
                                <MapPin className="icon-header-action" />
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Busca por Mapa</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>

             <TooltipProvider>
                 <Tooltip>
                    <TooltipTrigger asChild>
                         <Button variant="ghost" size="icon" className="btn-header-action-mobile" aria-label="Buscar em todo o site" asChild data-ai-id="header-action-search-mobile">
                            <Link href="/search">
                                <SearchIcon className="icon-header-action" />
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
      <div className="wrapper-main-navigation" data-ai-id="header-bottom-bar">
        <div className="container-main-navigation" data-ai-id="header-bottom-container">
            {/* Categorias Megamenu (à esquerda) */}
            {firstNavItem && firstNavItem.isMegaMenu && (
            <NavigationMenu className="menu-navigation-categories" data-ai-id="header-nav-categories">
                <NavigationMenuList>
                <NavigationMenuItem value={firstNavItem.label}>
                    <NavigationMenuTrigger
                        className={cn(
                            navigationMenuTriggerStyle(),
                            (pathname?.startsWith('/category') || (pathname === '/search' && (currentParamsType === 'lots' || currentCategoryParam))) && 'trigger-nav-active',
                            'trigger-nav-categories'
                        )}
                    >
                    {firstNavItem.icon && <firstNavItem.icon className="icon-nav-categories" /> }
                    {firstNavItem.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent align={firstNavItem.megaMenuAlign || "start"} className="content-nav-categories" data-ai-id="header-nav-categories-content">
                    {firstNavItem.contentKey === 'categories' && <MegaMenuCategories categories={categories} onLinkClick={onLinkClick} />}
                </NavigationMenuContent>
                </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>
            )}

            {/* Itens Centrais de Navegação */}
            <div className="wrapper-main-nav-items" data-ai-id="header-nav-items">
                <MainNav
                    items={centralNavItems}
                    onLinkClick={onLinkClick}
                    className="nav-main-desktop"
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
