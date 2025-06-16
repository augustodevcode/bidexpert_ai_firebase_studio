
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
import { type HistoryListItem } from './header'; // Importando HistoryListItem do header

export interface NavItem {
  href?: string;
  label: string;
  isMegaMenu?: boolean;
  contentKey?: 'categories' | 'modalities' | 'consignors' | 'auctioneers' | 'history'; // Adicionado 'history'
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
    // Props para dados dos megamenus
    searchCategories?: LotCategory[];
    auctioneers?: AuctioneerProfileInfo[];
    consignorMegaMenuGroups?: MegaMenuGroup[];
    recentlyViewedItems?: RecentlyViewedLotInfo[];
    HistoryListItemComponent?: typeof HistoryListItem; // Tipo do componente
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
  
  if (!isClient && isMobile) return null; // Evita renderizar no servidor para mobile se os dados não estiverem prontos

  if (isMobile) {
    // Renderização para menu mobile (Sheet)
    return (
      <nav className={cn('flex flex-col gap-1', className)} {...props}>
        {items.map((item) => (
          item.href && !item.isMegaMenu ? ( // Link simples
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
          ) : item.isMegaMenu && item.contentKey ? ( // Item que abre um "megamenu" simulado no mobile
            <div key={item.label} className="py-1">
                <Link
                    href={item.href || '#'} // Adiciona href se existir (ex: para 'Navegue por Categorias')
                    onClick={(e) => {
                        if (!item.href && onLinkClick) { // Previne default se não for um link real, mas chama onLinkClick para fechar
                           // Não faz nada de especial aqui se não tiver href, o onLinkClick global fecha
                        } else if (onLinkClick) {
                            onLinkClick();
                        }
                        // Se não tiver href, o comportamento de dropdown não é aplicável, é mais um título de seção.
                        // Para o caso do Histórico, o link principal é para a página do histórico.
                    }}
                    className={cn(
                        'text-md font-medium transition-colors hover:text-primary flex items-center gap-2 py-2.5 px-3 rounded-md',
                        pathname === item.href ? 'bg-accent text-primary' : 'text-muted-foreground hover:bg-accent/50'
                    )}
                >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    <span>{item.label}</span>
                    {/* Ícone de dropdown pode ser condicional ou removido se for apenas um link */}
                    {item.contentKey !== 'history' && <ChevronDown className="h-4 w-4 ml-auto"/>}
                </Link>
                {/* Dropdown simulado para mobile - pode ser simplificado ou melhorado */}
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

                    {/* Histórico no mobile: será um link direto para a página */}
                    {item.contentKey === 'history' && (
                        <Link href="/dashboard/history" onClick={onLinkClick} className="block text-sm text-primary hover:underline py-1">Ver Histórico Completo</Link>
                    )}
                </div>
            </div>
          ) : null
        ))}
      </nav>
    );
  }
  

  // Renderização para Desktop
  return (
    <NavigationMenu className={cn(className)} {...props} delayDuration={0}>
      <NavigationMenuList className={cn(className?.includes('justify-center') ? 'justify-center' : 'justify-start')}>
        {items.map((item) => {
          if (item.isMegaMenu && item.contentKey) {
            return (
              <NavigationMenuItem key={item.label} value={item.label}>
                 <NavigationMenuTrigger
                  asChild={!!item.href} 
                  className={cn(pathname === item.href && "text-primary bg-accent")}
                  onClick={item.href && onLinkClick ? () => onLinkClick() : undefined} 
                >
                   {item.href ? (
                    <Link href={item.href} className={navigationMenuTriggerStyle()}>
                      {item.label}
                      <ChevronDown className="relative top-[1px] ml-1.5 h-4 w-4 transition duration-200 group-data-[state=open]:rotate-180" aria-hidden="true" />
                    </Link>
                  ) : (
                    <>
                      {item.label}
                      <ChevronDown className="relative top-[1px] ml-1.5 h-4 w-4 transition duration-200 group-data-[state=open]:rotate-180" aria-hidden="true" />
                    </>
                  )}
                </NavigationMenuTrigger>
                <NavigationMenuContent className={item.contentKey === 'history' ? 'w-80 p-2' : ''}>
                  {item.contentKey === 'categories' && <MegaMenuCategories categories={searchCategories} onLinkClick={onLinkClick} />}
                  {item.contentKey === 'modalities' && <MegaMenuLinkList groups={modalityGroups} onLinkClick={onLinkClick} gridCols="md:grid-cols-1" />}
                  {item.contentKey === 'consignors' && <MegaMenuLinkList groups={consignorMegaMenuGroups} onLinkClick={onLinkClick} gridCols="md:grid-cols-1 lg:grid-cols-2" />}
                  {item.contentKey === 'auctioneers' && <MegaMenuAuctioneers auctioneers={auctioneers} onLinkClick={onLinkClick} />}
                  {item.contentKey === 'history' && HistoryListItemComponent && (
                     <div className="p-2"> {/* Adicionando padding ao redor do conteúdo do histórico */}
                        <div className="flex justify-between items-center p-2 border-b mb-1">
                            <span className="text-sm font-medium">Itens Vistos Recentemente</span>
                            <History className="h-4 w-4 text-muted-foreground" />
                        </div>
                        {recentlyViewedItems.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-3">Nenhum item visto recentemente.</p>
                        ) : (
                            <ul className="max-h-80 overflow-y-auto space-y-1">
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
                                    className={cn(navigationMenuTriggerStyle(), "w-full justify-center text-primary hover:underline text-xs py-1 h-auto")} 
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
                  <NavigationMenuLink className={cn(
                    navigationMenuTriggerStyle(),
                    pathname === item.href ? 'text-primary bg-accent' : 'text-muted-foreground hover:bg-accent/50 focus:bg-accent/50 focus:text-primary'
                  )} onClick={onLinkClick}>
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

