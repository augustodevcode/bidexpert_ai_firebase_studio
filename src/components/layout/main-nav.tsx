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
      <nav className={cn('flex flex-col gap-1', className)} {...props}>
        {items.map((item) => (
          item.href && !item.isMegaMenu ? (
            <Link
              key={item.label}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                'text-md font-medium transition-colors hover:text-primary flex items-center gap-2 py-2.5 px-3 rounded-md',
                pathname === item.href ? 'bg-accent text-primary' : 'text-muted-foreground hover:bg-accent/50'
              )}
            >
              {item.icon && <item.icon className="h-4 w-4" />}
              <span>{item.label}</span>
            </Link>
          ) : item.isMegaMenu && item.contentKey ? (
            <div key={item.label} className="py-1">
                <Link
                    href={item.href || '#'}
                    onClick={(e) => {
                        if (!item.href && onLinkClick) {
                        } else if (onLinkClick) {
                            onLinkClick();
                        }
                    }}
                    className={cn(
                        'text-md font-medium transition-colors hover:text-primary flex items-center justify-between gap-2 py-2.5 px-3 rounded-md',
                        pathname === item.href ? 'bg-accent text-primary' : 'text-muted-foreground hover:bg-accent/50'
                    )}
                >
                    <div className="flex items-center gap-2">
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span>{item.label}</span>
                    </div>
                    {item.contentKey !== 'history' && <ChevronDown className="h-4 w-4"/>}
                </Link>
                <div className="pl-6 mt-1 space-y-0.5">
                    {item.contentKey === 'categories' && searchCategories.slice(0,3).map(cat => (
                        <Link key={cat.slug} href={`/category/${cat.slug}`} onClick={onLinkClick} className="block text-sm text-muted-foreground hover:text-primary py-1">{cat.name}</Link>
                    ))}
                    {item.contentKey === 'categories' && <Link href="/search?type=lots&tab=categories" onClick={onLinkClick} className="block text-sm text-primary hover:underline py-1">Ver todas categorias</Link>}

                    {item.contentKey === 'modalities' && modalityMegaMenuGroups[0].items.map(mod => (
                          <Link key={mod.href} href={mod.href} onClick={onLinkClick} className="block text-sm text-muted-foreground hover:text-primary py-1">{mod.label}</Link>
                    ))}
                      {item.contentKey === 'consignors' && (consignorMegaMenuGroups[0]?.items || []).slice(0,4).map(con => (
                          <Link key={con.href} href={con.href} onClick={onLinkClick} className="block text-sm text-muted-foreground hover:text-primary py-1">{con.label}</Link>
                    ))}
                    {item.contentKey === 'consignors' && (consignorMegaMenuGroups[0]?.items || []).length > 4 && <Link href="/sellers" onClick={onLinkClick} className="block text-sm text-primary hover:underline py-1">Ver todos comitentes</Link>}

                    {item.contentKey === 'auctioneers' && auctioneers.slice(0,3).map(auc => (
                        <Link key={auc.id} href={`/auctioneers/${auc.slug || auc.publicId || auc.id}`} onClick={onLinkClick} className="block text-sm text-muted-foreground hover:text-primary py-1">{auc.name}</Link>
                    ))}
                      {item.contentKey === 'auctioneers' && auctioneers.length > 3 && <Link href="/auctioneers" onClick={onLinkClick} className="block text-sm text-primary hover:underline py-1">Ver todos leiloeiros</Link>}

                     {item.contentKey === 'history' && HistoryListItemComponent && (
                        <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                            {recentlyViewedItems.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-2">Nenhum item visto recentemente.</p>
                            ) : (
                                recentlyViewedItems.slice(0, 5).map(rvItem => (
                                    <HistoryListItemComponent key={rvItem.id} item={rvItem} onClick={onLinkClick} />
                                ))
                            )}
                             <Link href="/dashboard/history" onClick={onLinkClick} className="block text-xs text-primary hover:underline text-center pt-1">Ver Histórico Completo</Link>
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
              <NavigationMenuItem key={item.label} value={item.label}>
                 <NavigationMenuTrigger
                  className={cn(
                    navigationMenuTriggerStyle(),
                    isActiveTrigger && 'bg-accent text-primary font-semibold'
                  )}
                >
                  {item.icon && <item.icon className="mr-1.5 h-4 w-4" /> }
                  {item.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent align={item.megaMenuAlign || "start"}>
                  {item.contentKey === 'categories' && <MegaMenuCategories categories={searchCategories} onLinkClick={onLinkClick} />}

                  {megaMenuPropsForTwoColumn && (item.contentKey === 'modalities' || item.contentKey === 'consignors' || item.contentKey === 'auctioneers') && (
                    <TwoColumnMegaMenu {...megaMenuPropsForTwoColumn} onLinkClick={onLinkClick} />
                  )}

                  {item.contentKey === 'history' && HistoryListItemComponent && (
                     <div className="w-80 p-2">
                        <div className="flex justify-between items-center p-2 border-b mb-1">
                            <span className="text-sm font-medium text-foreground flex items-center"><History className="mr-1.5 h-4 w-4"/> Histórico</span>
                        </div>
                        {recentlyViewedItems.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-3">Nenhum item visto recentemente.</p>
                        ) : (
                            <ul className="max-h-80 overflow-y-auto space-y-0.5">
                                {recentlyViewedItems.slice(0, 5).map(rvItem => (
                                <li key={rvItem.id}>
                                    <HistoryListItemComponent item={rvItem} onClick={onLinkClick} />
                                </li>
                                ))}
                            </ul>
                        )}
                        <div className="border-t mt-1 pt-1">
                            <NavigationMenuLink asChild>
                                <Link
                                    href="/dashboard/history"
                                    className={cn(navigationMenuTriggerStyle(), "w-full justify-center text-primary hover:underline text-xs py-1 h-auto bg-transparent hover:bg-accent")}
                                    onClick={onLinkClick}
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
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      navigationMenuTriggerStyle(),
                      pathname === item.href
                        ? 'bg-accent text-primary font-semibold'
                        : 'text-foreground/80 hover:text-primary hover:bg-accent/70 focus:bg-accent/70'
                    )}
                    onClick={onLinkClick}
                  >
                    {item.icon && <item.icon className="mr-1.5 h-4 w-4 flex-shrink-0" />}
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
