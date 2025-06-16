
'use client';

import * as React from 'react'; 
import Link from 'next/link';
import { usePathname } from 'next/navigation'; 
import { cn } from '@/lib/utils';
import type { LotCategory, AuctioneerProfileInfo, SellerProfileInfo, RecentlyViewedLotInfo } from '@/types';
import { ChevronDown, History, ListChecks } from 'lucide-react'; 
import { useEffect, useState } from 'react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import MegaMenuCategories from './mega-menu-categories';
import MegaMenuLinkList, { type MegaMenuGroup } from './mega-menu-link-list';
import MegaMenuAuctioneers from './mega-menu-auctioneers';
import { type HistoryListItem } from './header'; 

export interface NavItem {
  href?: string;
  label: string;
  isMegaMenu?: boolean;
  contentKey?: 'categories' | 'modalities' | 'consignors' | 'auctioneers' | 'history';
  icon?: React.ElementType; 
}

const modalityGroups: MegaMenuGroup[] = [
  {
    items: [
      { href: '/search?type=auctions&auctionType=JUDICIAL', label: 'Leilões Judiciais', description: 'Oportunidades de processos judiciais.' },
      { href: '/search?type=auctions&auctionType=EXTRAJUDICIAL', label: 'Leilões Extrajudiciais', description: 'Negociações diretas e mais ágeis.' },
      { href: '/direct-sales', label: 'Venda Direta', description: 'Compre itens com preço fixo.' },
      { href: '/search?type=auctions&auctionType=TOMADA_DE_PRECOS', label: 'Tomada de Preços', description: 'Processo de seleção para contratação.' },
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
                           // If it's a megamenu trigger without its own link, onLinkClick might toggle a mobile submenu
                           // but we won't prevent default. For mobile, these become section headers.
                        } else if (onLinkClick) {
                            onLinkClick(); // For actual links or to close the mobile main menu
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
                    {/* Only show ChevronDown for non-history megamenus that act as accordions */}
                    {item.contentKey !== 'history' && <ChevronDown className="h-4 w-4"/>}
                </Link>
                <div className="pl-6 mt-1 space-y-0.5">
                    {item.contentKey === 'categories' && searchCategories.slice(0,3).map(cat => (
                        <Link key={cat.slug} href={`/category/${cat.slug}`} onClick={onLinkClick} className="block text-sm text-muted-foreground hover:text-primary py-1">{cat.name}</Link>
                    ))}
                    {item.contentKey === 'categories' && <Link href="/search?type=lots&tab=categories" onClick={onLinkClick} className="block text-sm text-primary hover:underline py-1">Ver todas categorias</Link>}
                    
                    {item.contentKey === 'modalities' && modalityGroups[0].items.map(mod => (
                          <Link key={mod.href} href={mod.href} onClick={onLinkClick} className="block text-sm text-muted-foreground hover:text-primary py-1">{mod.label}</Link>
                    ))}
                      {item.contentKey === 'consignors' && consignorMegaMenuGroups[0]?.items.slice(0,4).map(con => (
                          <Link key={con.href} href={con.href} onClick={onLinkClick} className="block text-sm text-muted-foreground hover:text-primary py-1">{con.label}</Link>
                    ))}
                    {item.contentKey === 'consignors' && consignorMegaMenuGroups[0]?.items.length > 4 && <Link href="/sellers" onClick={onLinkClick} className="block text-sm text-primary hover:underline py-1">Ver todos comitentes</Link>}
                    
                    {item.contentKey === 'auctioneers' && auctioneers.slice(0,3).map(auc => (
                        <Link key={auc.id} href={`/auctioneers/${auc.slug || auc.publicId || auc.id}`} onClick={onLinkClick} className="block text-sm text-muted-foreground hover:text-primary py-1">{auc.name}</Link>
                    ))}
                      {item.contentKey === 'auctioneers' && auctioneers.length > 3 && <Link href="/auctioneers" onClick={onLinkClick} className="block text-sm text-primary hover:underline py-1">Ver todos leiloeiros</Link>}
                    
                    {/* Histórico no mobile: o link principal do NavItem já leva para /dashboard/history */}
                </div>
            </div>
          ) : null
        ))}
      </nav>
    );
  }
  

  return (
    <NavigationMenu className={cn(className)} {...props} delayDuration={0}>
      <NavigationMenuList className={cn(className?.includes('justify-center') ? 'justify-center' : 'justify-start')}>
        {items.map((item) => {
          if (item.isMegaMenu && item.contentKey) {
            return (
              <NavigationMenuItem key={item.label} value={item.label}>
                 <NavigationMenuTrigger
                  className={cn(
                    navigationMenuTriggerStyle(), // Aplica o estilo base do trigger
                    // Lógica para estado "aberto" ou ativo. O próprio Radix UI adiciona data-state=open
                    // Se item.href existir e for o pathname atual, também estaria ativo.
                    pathname === item.href && 'bg-accent text-primary font-semibold',
                    // Para itens que SÃO triggers de megamenu (como Histórico), o Radix aplica `data-[state=open]:bg-accent/50` via o estilo base
                  )}
                >
                  {item.icon && item.contentKey !== 'history' && <item.icon className="mr-1.5 h-4 w-4" /> } 
                  {item.label}
                  {/* ChevronDown é adicionado automaticamente pelo NavigationMenuTrigger (de ui/navigation-menu.tsx)
                      quando asChild é falso (ou seja, quando item.href não existe) */}
                </NavigationMenuTrigger>
                <NavigationMenuContent align={item.contentKey === 'history' ? 'end' : 'center'}>
                  {item.contentKey === 'categories' && <MegaMenuCategories categories={searchCategories} onLinkClick={onLinkClick} />}
                  {item.contentKey === 'modalities' && <MegaMenuLinkList groups={modalityGroups} onLinkClick={onLinkClick} gridCols="md:grid-cols-1" />}
                  {item.contentKey === 'consignors' && <MegaMenuLinkList groups={consignorMegaMenuGroups} onLinkClick={onLinkClick} gridCols="md:grid-cols-1 lg:grid-cols-2" />}
                  {item.contentKey === 'auctioneers' && <MegaMenuAuctioneers auctioneers={auctioneers} onLinkClick={onLinkClick} />}
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
                <Link href={item.href} legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(), 
                      pathname === item.href
                        ? 'bg-accent text-primary font-semibold' // Estado Ativo
                        : 'text-muted-foreground hover:bg-accent/70 focus:bg-accent/70' // Estado Inativo
                    )}
                    onClick={onLinkClick}
                  >
                    {item.icon && <item.icon className="mr-1.5 h-4 w-4 flex-shrink-0" />}
                    {item.label}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ) : null
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

