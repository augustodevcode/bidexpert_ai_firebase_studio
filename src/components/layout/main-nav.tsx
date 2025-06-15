
'use client';

import * as React from 'react'; // Importação adicionada
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; 
import { cn } from '@/lib/utils';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getAuctioneers } from '@/app/admin/auctioneers/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import type { LotCategory, AuctioneerProfileInfo, SellerProfileInfo } from '@/types';
import { Home as HomeIcon, Tag, Gavel, Library, Landmark, Briefcase, MessageSquareText, ShoppingCart, Users2, ChevronRight, ListChecks, ChevronDown } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle, // Import the style function
} from "@/components/ui/navigation-menu";
import MegaMenuCategories from './mega-menu-categories';
import MegaMenuLinkList, { type MegaMenuGroup } from './mega-menu-link-list';
import MegaMenuAuctioneers from './mega-menu-auctioneers';

interface NavItem {
  href?: string;
  label: string;
  icon?: React.ReactNode;
  isMegaMenu?: boolean;
  contentKey?: 'categories' | 'modalities' | 'consignors' | 'auctioneers';
}

const modalityGroups: MegaMenuGroup[] = [
  {
    items: [
      { href: '/search?type=auctions&auctionType=JUDICIAL', label: 'Leilões Judiciais', description: 'Oportunidades de processos judiciais.', icon: <Gavel className="h-4 w-4" /> },
      { href: '/search?type=auctions&auctionType=EXTRAJUDICIAL', label: 'Leilões Extrajudiciais', description: 'Negociações diretas e mais ágeis.', icon: <Gavel className="h-4 w-4" /> },
      { href: '/direct-sales', label: 'Venda Direta', description: 'Compre itens com preço fixo.', icon: <ShoppingCart className="h-4 w-4" /> },
    ]
  }
];

export default function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  const router = useRouter(); 
  const [searchCategories, setSearchCategories] = useState<LotCategory[]>([]);
  const [auctioneers, setAuctioneers] = useState<AuctioneerProfileInfo[]>([]);
  const [consignorMegaMenuGroups, setConsignorMegaMenuGroups] = useState<MegaMenuGroup[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const auctioneersDropdownTriggerRef = useRef<HTMLButtonElement>(null);

  const handleLinkClick = () => {
    if (className?.includes('flex-col')) { 
      setIsMobileMenuOpen(false); 
    }
  };

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
              icon: <Briefcase className="h-4 w-4" />
            })),
          }];

        if (hasMoreSellers) {
            formattedSellersForMenu[0].items.push({ 
                href: '/sellers', 
                label: 'Ver Todos Comitentes', 
                icon: <Users2 className="h-4 w-4" />,
                description: "Navegue por todos os nossos comitentes."
            });
        }
        setConsignorMegaMenuGroups(formattedSellersForMenu.filter(group => group.items.length > 0));

      } catch (error) {
        console.error("Error fetching data for main navigation:", error);
        setSearchCategories([]);
        setAuctioneers([]);
        setConsignorMegaMenuGroups([]);
      }
    }
    fetchNavData();
  }, []);

  const navItems: NavItem[] = [
    { href: '/', label: 'Início', icon: <HomeIcon className="h-4 w-4" /> },
    {
      label: 'Categorias',
      icon: <Tag className="h-4 w-4" />,
      isMegaMenu: true,
      contentKey: 'categories',
      href: '/search?type=lots&tab=categories' 
    },
    {
      label: 'Modalidades',
      icon: <Gavel className="h-4 w-4" />,
      isMegaMenu: true,
      contentKey: 'modalities',
      href: '/search?type=auctions&filter=modalities' 
    },
    {
      label: 'Comitentes',
      icon: <Briefcase className="h-4 w-4" />,
      isMegaMenu: true,
      contentKey: 'consignors',
      href: '/sellers' 
    },
    {
      label: 'Leiloeiros',
      icon: <Landmark className="h-4 w-4" />,
      isMegaMenu: true,
      contentKey: 'auctioneers',
      href: '/auctioneers' 
    },
    { href: '/direct-sales', label: 'Venda Direta', icon: <ShoppingCart className="h-4 w-4" /> },
    { href: '/sell-with-us', label: 'Venda Conosco', icon: <Library className="h-4 w-4" /> },
    { href: '/contact', label: 'Fale Conosco', icon: <MessageSquareText className="h-4 w-4" /> },
  ];
  
  if (className?.includes('flex-col')) {
      if (!isClient) return null; 
    return (
      <nav className={cn('flex flex-col gap-1 px-4', className)} {...props}>
        {navItems.map((item) => (
          item.href ? (
            <Link
              key={item.label} 
              href={item.href}
              onClick={handleLinkClick}
              className={cn(
                'text-md font-medium transition-colors hover:text-primary flex items-center gap-2 py-2.5 px-3 rounded-md',
                pathname === item.href ? 'bg-accent text-primary' : 'text-muted-foreground hover:bg-accent/50'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ) : (
            item.isMegaMenu && item.contentKey ? ( 
                <div key={item.label} className="py-1">
                    <span className="text-md font-medium text-muted-foreground flex items-center gap-2 px-3 rounded-md">
                        {item.icon}
                        <span>{item.label}</span>
                    </span>
                    <div className="pl-6 mt-1 space-y-0.5">
                        {item.contentKey === 'categories' && searchCategories.slice(0,3).map(cat => (
                            <Link key={cat.slug} href={`/category/${cat.slug}`} onClick={handleLinkClick} className="block text-sm text-muted-foreground hover:text-primary py-1">{cat.name}</Link>
                        ))}
                        {item.contentKey === 'categories' && <Link href="/search?type=lots&tab=categories" onClick={handleLinkClick} className="block text-sm text-primary hover:underline py-1">Ver todas categorias</Link>}
                        
                        {item.contentKey === 'modalities' && modalityGroups[0].items.map(mod => (
                             <Link key={mod.href} href={mod.href} onClick={handleLinkClick} className="block text-sm text-muted-foreground hover:text-primary py-1">{mod.label}</Link>
                        ))}
                         {item.contentKey === 'consignors' && consignorMegaMenuGroups[0]?.items.slice(0,4).map(con => (
                             <Link key={con.href} href={con.href} onClick={handleLinkClick} className="block text-sm text-muted-foreground hover:text-primary py-1">{con.label}</Link>
                        ))}
                        {item.contentKey === 'consignors' && consignorMegaMenuGroups[0]?.items.length > 4 && <Link href="/sellers" onClick={handleLinkClick} className="block text-sm text-primary hover:underline py-1">Ver todos comitentes</Link>}
                        
                        {item.contentKey === 'auctioneers' && auctioneers.slice(0,3).map(auc => (
                            <Link key={auc.id} href={`/auctioneers/${auc.slug || auc.publicId || auc.id}`} onClick={handleLinkClick} className="block text-sm text-muted-foreground hover:text-primary py-1">{auc.name}</Link>
                        ))}
                         {item.contentKey === 'auctioneers' && auctioneers.length > 3 && <Link href="/auctioneers" onClick={handleLinkClick} className="block text-sm text-primary hover:underline py-1">Ver todos leiloeiros</Link>}
                    </div>
                </div>
            ) : null
          )
        ))}
      </nav>
    );
  }
  

  return (
    <NavigationMenu className={cn('hidden md:flex', className)} {...props} delayDuration={0}>
      <NavigationMenuList>
        {navItems.map((item) => {
            let iconToShowRaw: React.ReactNode = null; // Icon without margin
            let iconToShowWithMargin: React.ReactNode = null; // Icon with margin

            if (item.icon && React.isValidElement(item.icon)) {
              const iconElement = item.icon as React.ReactElement<any>;
              iconToShowRaw = iconElement; // Original icon, margin will be handled by parent span
              iconToShowWithMargin = React.cloneElement(iconElement, {
                className: cn(iconElement.props.className, "mr-1.5") 
              });
            }

          if (item.isMegaMenu) {
            return (
              <NavigationMenuItem key={item.label} value={item.label}>
                <NavigationMenuTrigger
                  ref={item.contentKey === 'auctioneers' ? auctioneersDropdownTriggerRef : undefined}
                  asChild={!!item.href} 
                  // className removed to avoid conflict when asChild is true, Link will take styles
                >
                  {item.href ? (
                     <Link 
                        href={item.href} 
                        className={cn(navigationMenuTriggerStyle(), "group", pathname === item.href && "text-primary bg-accent")}
                        onClick={(e) => {
                            // Allow link to navigate, and trigger to open/close menu
                            // Forcing router.push could prevent menu from opening on first click
                            if (e.metaKey || e.ctrlKey) return; // Allow open in new tab
                            // handleLinkClick(); // For mobile, if logic is shared
                        }}
                     >
                        <span className="flex items-center gap-1.5">
                           {iconToShowRaw} {/* Icon without added margin */}
                           {item.label}
                        </span>
                        {/* ChevronDown must be part of the Link content if Link is the trigger */}
                        <ChevronDown
                            className="relative top-[1px] ml-auto h-4 w-4 transition duration-200 group-data-[state=open]:rotate-180"
                            aria-hidden="true"
                         />
                     </Link>
                  ) : (
                    // If not a link, NavigationMenuTrigger (from navigation-menu.tsx) renders its default content + chevron
                    <span className="flex items-center gap-1.5">
                       {iconToShowWithMargin} {/* Icon with margin, as it's direct child content */}
                       {item.label}
                    </span>
                  )}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  {item.contentKey === 'categories' && <MegaMenuCategories categories={searchCategories} onLinkClick={handleLinkClick} />}
                  {item.contentKey === 'modalities' && <MegaMenuLinkList groups={modalityGroups} onLinkClick={handleLinkClick} gridCols="md:grid-cols-1" />}
                  {item.contentKey === 'consignors' && <MegaMenuLinkList groups={consignorMegaMenuGroups} onLinkClick={handleLinkClick} gridCols="md:grid-cols-1 lg:grid-cols-2" />}
                  {item.contentKey === 'auctioneers' && <MegaMenuAuctioneers auctioneers={auctioneers} onLinkClick={handleLinkClick} />}
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          }
          return (
            item.href ? (
              <NavigationMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <NavigationMenuLink className={cn(
                    navigationMenuTriggerStyle(), // Use the same base style as triggers
                    pathname === item.href ? 'text-primary bg-accent' : 'text-muted-foreground hover:bg-accent/50 focus:bg-accent/50 focus:text-primary'
                  )} onClick={handleLinkClick}>
                    <span className="flex items-center gap-1.5">
                        {iconToShowRaw}
                        {item.label}
                    </span>
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
