
'use client';

import * as React from 'react'; 
import Link from 'next/link';
import { usePathname } from 'next/navigation'; 
import { cn } from '@/lib/utils';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getAuctioneers } from '@/app/admin/auctioneers/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import type { LotCategory, AuctioneerProfileInfo, SellerProfileInfo } from '@/types';
import { ChevronDown } from 'lucide-react'; 
import { useEffect, useState, useRef } from 'react';
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

export interface NavItem {
  href?: string;
  label: string;
  isMegaMenu?: boolean;
  contentKey?: 'categories' | 'modalities' | 'consignors' | 'auctioneers';
  icon?: React.ElementType; // Para mobile
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
}


export default function MainNav({ items, className, onLinkClick, isMobile = false, ...props }: MainNavProps) {
  const pathname = usePathname();
  const [searchCategories, setSearchCategories] = useState<LotCategory[]>([]);
  const [auctioneers, setAuctioneers] = useState<AuctioneerProfileInfo[]>([]);
  const [consignorMegaMenuGroups, setConsignorMegaMenuGroups] = useState<MegaMenuGroup[]>([]);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    async function fetchNavData() {
      try {
        const [fetchedCategories, fetchedAuctioneers, fetchedSellers] = await Promise.all([
          getLotCategories(),
          getAuctioneers(),
          getSellers()
        ]);
        setSearchCategories(fetchedCategories);
        setAuctioneers(fetchedAuctioneers);
        
        const MAX_SELLERS_IN_MEGAMENU = 5;
        const visibleSellers = fetchedSellers.slice(0, MAX_SELLERS_IN_MEGAMENU);
        const hasMoreSellers = fetchedSellers.length > MAX_SELLERS_IN_MEGAMENU;

        const formattedSellersForMenu: MegaMenuGroup[] = [{
            title: "Principais Comitentes",
            items: visibleSellers.map(seller => ({
              href: `/sellers/${seller.slug || seller.publicId || seller.id}`,
              label: seller.name,
              description: seller.city && seller.state ? `${seller.city} - ${seller.state}` : (seller.description ? seller.description.substring(0,40)+'...' : 'Ver perfil'),
            })),
          }];

        if (hasMoreSellers) {
            formattedSellersForMenu[0].items.push({ 
                href: '/sellers', 
                label: 'Ver Todos Comitentes', 
                description: "Navegue por todos os nossos comitentes."
            });
        }
        setConsignorMegaMenuGroups(formattedSellersForMenu.filter(group => group.items.length > 0));

      } catch (error) {
        console.error("Error fetching data for main navigation:", error);
      }
    }
    fetchNavData();
  }, []);
  
  if (!isClient && isMobile) return null;

  if (isMobile) {
    // Renderização para menu mobile (Sheet)
    return (
      <nav className={cn('flex flex-col gap-1', className)} {...props}>
        {items.map((item) => (
          item.href ? (
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
          ) : (
            item.isMegaMenu && item.contentKey ? ( 
                <div key={item.label} className="py-1">
                    <span className="text-md font-medium text-muted-foreground flex items-center gap-2 px-3 rounded-md">
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span>{item.label}</span>
                        <ChevronDown className="h-4 w-4 ml-auto"/>
                    </span>
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
                    </div>
                </div>
            ) : null
          )
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
                  asChild={!!item.href} // Só é asChild se tiver href
                  className={cn(pathname === item.href && "text-primary bg-accent")}
                  onClick={item.href ? () => { if(onLinkClick) onLinkClick(); } : undefined} 
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
                <NavigationMenuContent>
                  {item.contentKey === 'categories' && <MegaMenuCategories categories={searchCategories} onLinkClick={onLinkClick} />}
                  {item.contentKey === 'modalities' && <MegaMenuLinkList groups={modalityGroups} onLinkClick={onLinkClick} gridCols="md:grid-cols-1" />}
                  {item.contentKey === 'consignors' && <MegaMenuLinkList groups={consignorMegaMenuGroups} onLinkClick={onLinkClick} gridCols="md:grid-cols-1 lg:grid-cols-2" />}
                  {item.contentKey === 'auctioneers' && <MegaMenuAuctioneers auctioneers={auctioneers} onLinkClick={onLinkClick} />}
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

