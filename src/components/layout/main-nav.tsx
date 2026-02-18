// src/components/layout/main-nav.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { LotCategory, AuctioneerProfileInfo, SellerProfileInfo, RecentlyViewedLotInfo } from '@/types';
import { ChevronDown, History, Home, Landmark, Gavel, Percent, Phone, ListChecks, Tag, Users, FileText as FileTextIcon, BookOpen } from 'lucide-react';
import { useEffect, useState, useCallback, forwardRef } from 'react';
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
import MegaMenuLinkList, { type MegaMenuGroup } from './mega-menu-link-list';
import MegaMenuAuctioneers from './mega-menu-auctioneers';
import TwoColumnMegaMenu from './two-column-mega-menu';
import type { RecentlyViewedLotInfo as HistoryListItemType } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { MegaMenuLinkItem } from './mega-menu-link-list';
import Image from 'next/image';

// Renomeado para não conflitar com o nome do componente
export const HistoryListItem = forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & { item: HistoryListItemType; onClick?: () => void }
>(({ className, item, onClick, ...props }, ref) => {
  return (
    <Link
      href={`/auctions/${item.auctionId}/lots/${item.publicId || item.id}`}
      ref={ref}
      className={cn(
        "link-history-item",
        className
      )}
      onClick={onClick}
      data-ai-id={`history-item-${item.id}`}
      {...props}
    >
      <div className="wrapper-history-item-image" data-ai-id="history-item-image-wrapper">
        <Image src={item.imageUrl || 'https://placehold.co/120x100.png'} alt={item.title} fill className="img-history-item" data-ai-hint={item.dataAiHint || "item visto recentemente"} />
      </div>
      <span className="text-history-item-title">{item.title}</span>
    </Link>
  );
});
HistoryListItem.displayName = "HistoryListItem";

export interface NavItem {
  href?: string;
  label: string;
  isMegaMenu?: boolean;
  contentKey?: 'categories' | 'modalities' | 'consignors' | 'auctioneers' | 'history';
  icon?: React.ElementType;
  megaMenuAlign?: "start" | "center" | "end";
  twoColumnMegaMenuProps?: {
    sidebarTitle?: string;
    mainContent: {
      imageUrl: string;
      imageAlt: string;
      dataAiHint: string;
      title: string;
      description: string;
      buttonLink: string;
      buttonText: string;
    };
  };
  hrefPrefix?: string;
}

const modalityMegaMenuGroups: MegaMenuGroup[] = [
  {
    items: [
      { href: '/search?type=auctions&auctionType=JUDICIAL', label: 'Leilões Judiciais', description: 'Oportunidades de processos judiciais.', icon: <Gavel className="h-4 w-4" /> },
      { href: '/search?type=auctions&auctionType=EXTRAJUDICIAL', label: 'Leilões Extrajudiciais', description: 'Negociações diretas e mais ágeis.', icon: <Landmark className="h-4 w-4" /> },
      { href: '/search?type=auctions&auctionType=TOMADA_DE_PRECOS', label: 'Tomada de Preços', description: 'Processos de compra governamentais.', icon: <FileTextIcon className="h-4 w-4" /> },
      { href: '/direct-sales', label: 'Venda Direta', description: 'Compre itens com preço fixo.', icon: <Tag className="h-4 w-4" /> },
      { href: '/search?type=auctions&auctionType=PARTICULAR', label: 'Leilões Particulares', description: 'Leilões privados ou com acesso restrito.', icon: <Users className="h-4 w-4" /> },
    ]
  }
];

interface MainNavProps extends React.HTMLAttributes<HTMLElement> {
    items: NavItem[];
    onLinkClick?: () => void;
    isMobile?: boolean;
    searchCategories?: LotCategory[];
    auctioneers?: AuctioneerProfileInfo[];
    consignorMegaMenuGroups?: MegaMenuGroup[];
    recentlyViewedItems?: RecentlyViewedLotInfo[];
    HistoryListItemComponent?: typeof HistoryListItem;
}

const MAX_ITEMS_IN_TW_COL_SIDEBAR = 5;


export default function MainNav({
    items,
    className,
    onLinkClick,
    isMobile = false,
    searchCategories = [],
    auctioneers = [],
    consignorMegaMenuGroups = [],
    recentlyViewedItems = [],
    HistoryListItemComponent,
    ...props
}: MainNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient && isMobile) return null;

  if (isMobile) {
    return (
      <nav className={cn('nav-mobile-container', className)} {...props} data-ai-id="nav-mobile">
        {items.map((item) => (
          item.href && !item.isMegaMenu ? (
            <Link
              key={item.label}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                'link-mobile-nav',
                pathname === item.href ? 'link-mobile-active' : 'link-mobile-inactive'
              )}
              data-ai-id={`nav-mobile-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {item.icon && <item.icon className="icon-mobile-nav" />}
              <span>{item.label}</span>
            </Link>
          ) : item.isMegaMenu && item.contentKey ? (
            <div key={item.label} className="wrapper-mobile-megamenu" data-ai-id={`nav-mobile-megamenu-${item.contentKey}`}>
                <Link
                    href={item.href || '#'}
                    onClick={(e) => {
                        if (!item.href && onLinkClick) {
                        } else if (onLinkClick) {
                            onLinkClick();
                        }
                    }}
                    className={cn(
                        'link-mobile-megamenu-trigger',
                        pathname === item.href ? 'link-mobile-active' : 'link-mobile-inactive'
                    )}
                    data-ai-id={`nav-mobile-megamenu-trigger-${item.contentKey}`}
                >
                    <div className="wrapper-mobile-megamenu-label">
                        {item.icon && <item.icon className="icon-mobile-nav" />}
                        <span>{item.label}</span>
                    </div>
                    {item.contentKey !== 'history' && <ChevronDown className="icon-mobile-chevron"/>}
                </Link>
                <div className="wrapper-mobile-megamenu-content" data-ai-id={`nav-mobile-megamenu-content-${item.contentKey}`}>
                    {item.contentKey === 'categories' && searchCategories.slice(0,3).map(cat => (
                        <Link key={cat.slug} href={`/category/${cat.slug}`} onClick={onLinkClick} className="link-mobile-subitem" data-ai-id={`nav-mobile-category-${cat.slug}`}>{cat.name}</Link>
                    ))}
                    {item.contentKey === 'categories' && <Link href="/search?type=lots&tab=categories" onClick={onLinkClick} className="link-mobile-view-all" data-ai-id="nav-mobile-categories-view-all">Ver todas categorias</Link>}

                    {item.contentKey === 'modalities' && modalityMegaMenuGroups[0].items.map(mod => (
                          <Link key={mod.href} href={mod.href} onClick={onLinkClick} className="link-mobile-subitem" data-ai-id={`nav-mobile-modality-${mod.label.toLowerCase().replace(/\s+/g, '-')}`}>{mod.label}</Link>
                    ))}
                      {item.contentKey === 'consignors' && (consignorMegaMenuGroups[0]?.items || []).slice(0,4).map(con => (
                          <Link key={con.href} href={con.href} onClick={onLinkClick} className="link-mobile-subitem" data-ai-id={`nav-mobile-consignor-${con.label.toLowerCase().replace(/\s+/g, '-')}`}>{con.label}</Link>
                    ))}
                    {item.contentKey === 'consignors' && (consignorMegaMenuGroups[0]?.items || []).length > 4 && <Link href="/sellers" onClick={onLinkClick} className="link-mobile-view-all" data-ai-id="nav-mobile-consignors-view-all">Ver todos comitentes</Link>}

                    {item.contentKey === 'auctioneers' && auctioneers.slice(0,3).map(auc => (
                        <Link key={auc.id} href={`/auctioneers/${auc.slug || auc.publicId || auc.id}`} onClick={onLinkClick} className="link-mobile-subitem" data-ai-id={`nav-mobile-auctioneer-${auc.id}`}>{auc.name}</Link>
                    ))}
                      {item.contentKey === 'auctioneers' && auctioneers.length > 3 && <Link href="/auctioneers" onClick={onLinkClick} className="link-mobile-view-all" data-ai-id="nav-mobile-auctioneers-view-all">Ver todos leiloeiros</Link>}

                     {item.contentKey === 'history' && HistoryListItemComponent && (
                        <div className="wrapper-mobile-history" data-ai-id="nav-mobile-history-list">
                            {recentlyViewedItems.length === 0 ? (
                                <p className="text-history-empty">Nenhum item visto recentemente.</p>
                            ) : (
                                recentlyViewedItems.slice(0, 5).map(rvItem => (
                                    <HistoryListItemComponent key={rvItem.id} item={rvItem} onClick={onLinkClick} />
                                ))
                            )}
                             <Link href="/dashboard/history" onClick={onLinkClick} className="link-mobile-history-view-all" data-ai-id="nav-mobile-history-view-all">Ver Histórico Completo</Link>
                        </div>
                    )}
                </div>
            </div>
          ) : null
        ))}
      </nav>
    );
  }


  return (
    <NavigationMenu className={cn("relative z-10 flex items-center justify-start", className)} {...props} delayDuration={0}>
      <NavigationMenuList className={cn("group flex flex-wrap flex-grow list-none items-center justify-start md:justify-center space-x-1")}>
        {items.map((item) => {
          let megaMenuPropsForTwoColumn: any = null;
          const currentParamsType = searchParams.get('type');
          const currentCategoryParam = searchParams.get('category');
          const currentAuctionTypeParam = searchParams.get('auctionType');

          if (item.isMegaMenu && item.contentKey && item.twoColumnMegaMenuProps) {
            let finalSidebarItems: MegaMenuLinkItem[] = [];
            let finalViewAllLink = undefined;
            let finalSidebarTitle = item.twoColumnMegaMenuProps.sidebarTitle;

            if (item.contentKey === 'modalities') {
              finalSidebarItems = modalityMegaMenuGroups[0]?.items || [];
              finalSidebarTitle = item.twoColumnMegaMenuProps.sidebarTitle || 'Modalidades de Leilão';
              finalViewAllLink = { href: '/search?type=auctions', label: 'Ver Todos os Leilões', icon: ListChecks };
            } else if (item.contentKey === 'consignors') {
              const consignorItems = (consignorMegaMenuGroups && consignorMegaMenuGroups.length > 0 && consignorMegaMenuGroups[0]?.items) || [];
              finalSidebarItems = consignorItems.slice(0, MAX_ITEMS_IN_TW_COL_SIDEBAR).map(seller => ({
                  ...seller,
                  href: seller.href || `/sellers/${seller.label}`, // Fallback just in case
              }));
              if (consignorItems.length > MAX_ITEMS_IN_TW_COL_SIDEBAR) {
                finalViewAllLink = { href: '/sellers', label: 'Ver Todos Comitentes', icon: Users };
              }
              finalSidebarTitle = item.twoColumnMegaMenuProps.sidebarTitle || 'Principais Comitentes';
            } else if (item.contentKey === 'auctioneers') {
              const mappedAuctioneerItems: MegaMenuLinkItem[] = auctioneers.map(auc => ({
                href: `/auctioneers/${auc.slug || auc.publicId || auc.id}`,
                label: auc.name,
                description: `${auc.city || ''}${auc.city && auc.state ? ' - ' : ''}${auc.state || ''}` || 'Leiloeiro Verificado',
                icon: auc.logoUrl ? <Avatar className="h-5 w-5 border"><AvatarImage src={auc.logoUrl!} alt={auc.name} data-ai-hint={auc.dataAiHintLogo || 'logo leiloeiro'} /><AvatarFallback>{auc.name.charAt(0)}</AvatarFallback></Avatar> : undefined
              }));
              finalSidebarItems = mappedAuctioneerItems.slice(0, MAX_ITEMS_IN_TW_COL_SIDEBAR);
              if (auctioneers.length > MAX_ITEMS_IN_TW_COL_SIDEBAR) {
                finalViewAllLink = { href: '/auctioneers', label: 'Ver Todos Leiloeiros', icon: Landmark };
              }
              finalSidebarTitle = item.twoColumnMegaMenuProps.sidebarTitle || 'Leiloeiros em Destaque';
            }

            megaMenuPropsForTwoColumn = {
              ...item.twoColumnMegaMenuProps,
              sidebarTitle: finalSidebarTitle,
              sidebarItems: finalSidebarItems,
              viewAllLink: finalViewAllLink,
            };
          }


          if (item.isMegaMenu && item.contentKey) {
            let isActiveTrigger = false;
            if (item.contentKey === 'categories' && (pathname?.startsWith('/category') || (pathname === '/search' && (currentParamsType === 'lots' || currentCategoryParam)))) {
              isActiveTrigger = true;
            } else if (item.contentKey === 'modalities' && pathname === '/search' && currentParamsType === 'auctions' && currentAuctionTypeParam) {
              isActiveTrigger = true;
            } else if (item.contentKey === 'consignors' && pathname?.startsWith('/sellers')) {
              isActiveTrigger = true;
            } else if (item.contentKey === 'auctioneers' && pathname?.startsWith('/auctioneers')) {
              isActiveTrigger = true;
            } else if (item.contentKey === 'history' && pathname === '/dashboard/history') {
              isActiveTrigger = true;
            }


            return (
              <NavigationMenuItem key={item.label} value={item.label} data-ai-id={`nav-desktop-item-${item.contentKey}`}>
                 <NavigationMenuTrigger
                  className={cn(
                    navigationMenuTriggerStyle(),
                    isActiveTrigger && 'trigger-nav-active'
                  )}
                  data-ai-id={`nav-desktop-trigger-${item.contentKey}`}
                >
                  {item.icon && <item.icon className="icon-nav-desktop" /> }
                  {item.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent align={item.megaMenuAlign || "start"} data-ai-id={`nav-desktop-content-${item.contentKey}`}>
                  {item.contentKey === 'categories' && <MegaMenuCategories categories={searchCategories} onLinkClick={onLinkClick} />}

                  {megaMenuPropsForTwoColumn && (item.contentKey === 'modalities' || item.contentKey === 'consignors' || item.contentKey === 'auctioneers') && (
                    <TwoColumnMegaMenu {...megaMenuPropsForTwoColumn} onLinkClick={onLinkClick} />
                  )}

                  {item.contentKey === 'history' && HistoryListItemComponent && (
                     <div className="wrapper-history-dropdown" data-ai-id="nav-desktop-history-dropdown">
                        <div className="header-history-dropdown" data-ai-id="nav-desktop-history-header">
                            <span className="text-history-dropdown-header"><History className="icon-history-dropdown"/> Histórico</span>
                        </div>
                        {recentlyViewedItems.length === 0 ? (
                            <p className="text-history-empty-dropdown">Nenhum item visto recentemente.</p>
                        ) : (
                            <ul className="list-history-dropdown" data-ai-id="nav-desktop-history-list">
                                {recentlyViewedItems.slice(0, 5).map(rvItem => (
                                <li key={rvItem.id} className="item-history-dropdown">
                                    <HistoryListItemComponent item={rvItem} onClick={onLinkClick} />
                                </li>
                                ))}
                            </ul>
                        )}
                        <div className="footer-history-dropdown" data-ai-id="nav-desktop-history-footer">
                            <NavigationMenuLink asChild>
                                <Link
                                    href="/dashboard/history"
                                    className="link-history-view-all"
                                    onClick={onLinkClick}
                                    data-ai-id="nav-desktop-history-view-all"
                                >
                                Ver Histórico Completo
                                </Link>
                            </NavigationMenuLink>
                        </div>
                    </div>
                  )}
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          }
          return (
            item.href ? (
              <NavigationMenuItem key={item.href} data-ai-id={`nav-desktop-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <NavigationMenuLink asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      navigationMenuTriggerStyle(),
                      pathname === item.href
                        ? 'link-nav-desktop-active'
                        : 'link-nav-desktop-inactive'
                    )}
                    onClick={onLinkClick}
                    data-ai-id={`nav-desktop-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {item.icon && <item.icon className="icon-nav-desktop" />}
                    {item.label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ) : null
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
