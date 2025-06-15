
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getAuctioneers } from '@/app/admin/auctioneers/actions';
import { getSellers } from '@/app/admin/sellers/actions'; // Importar getSellers
import type { LotCategory, AuctioneerProfileInfo, SellerProfileInfo } from '@/types'; // Importar SellerProfileInfo
import { Home as HomeIcon, Building, Users2, MessageSquareText, Tag, ChevronDown, ShoppingBag, Gavel, Library, Landmark, Briefcase } from 'lucide-react'; // Briefcase para Comitentes
import { useEffect, useState } from 'react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"; // Corrigido o caminho
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

// Dados para Modalidades (estático)
const modalityGroups: MegaMenuGroup[] = [
  {
    items: [
      { href: '/search?auctionType=JUDICIAL', label: 'Leilões Judiciais', description: 'Oportunidades de processos judiciais.' },
      { href: '/search?auctionType=EXTRAJUDICIAL', label: 'Leilões Extrajudiciais', description: 'Negociações diretas e mais ágeis.' },
      { href: '/direct-sales', label: 'Venda Direta', description: 'Compre itens com preço fixo.' },
      // { href: '/search?auctionType=PRICE_TAKING', label: 'Tomada de Preços', description: 'Processos de cotação e seleção.' }, // Descomentar se necessário
    ]
  }
];

export default function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  const [searchCategories, setSearchCategories] = useState<LotCategory[]>([]);
  const [auctioneers, setAuctioneers] = useState<AuctioneerProfileInfo[]>([]);
  const [sellers, setSellers] = useState<SellerProfileInfo[]>([]); // Novo estado para comitentes
  const [consignorMegaMenuGroups, setConsignorMegaMenuGroups] = useState<MegaMenuGroup[]>([]); // Novo estado para grupos de comitentes
  const [isClient, setIsClient] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          getSellers() // Buscar comitentes
        ]);
        setSearchCategories(fetchedCategories);
        setAuctioneers(fetchedAuctioneers);
        setSellers(fetchedSellers); // Armazenar comitentes

        // Formatar comitentes para MegaMenuLinkList
        const MAX_SELLERS_IN_MEGAMENU = 5;
        const visibleSellers = fetchedSellers.slice(0, MAX_SELLERS_IN_MEGAMENU);
        const hasMoreSellers = fetchedSellers.length > MAX_SELLERS_IN_MEGAMENU;

        const formattedSellersForMenu: MegaMenuGroup[] = [
          {
            items: visibleSellers.map(seller => ({
              href: `/sellers/${seller.slug || seller.publicId || seller.id}`, // Usar slug ou publicId
              label: seller.name,
              description: seller.city && seller.state ? `${seller.city} - ${seller.state}` : (seller.description ? seller.description.substring(0,50)+'...' : undefined),
              icon: <Briefcase className="h-4 w-4" />
            })),
          }
        ];
        if (hasMoreSellers) {
            formattedSellersForMenu.push({
                 items: [{ href: '/sellers', label: 'Ver Todos Comitentes', icon: <Users2 className="h-4 w-4" /> }]
            });
        }
        setConsignorMegaMenuGroups(formattedSellersForMenu.filter(group => group.items.length > 0));

      } catch (error) {
        console.error("Error fetching data for main navigation:", error);
        setSearchCategories([]);
        setAuctioneers([]);
        setSellers([]);
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
      href: '/search?tab=categories'
    },
    {
      label: 'Modalidades',
      icon: <Gavel className="h-4 w-4" />,
      isMegaMenu: true,
      contentKey: 'modalities',
      href: '/search?filter=modalities'
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
    { href: '/direct-sales', label: 'Venda Direta', icon: <ShoppingBag className="h-4 w-4" /> },
    { href: '/sell-with-us', label: 'Venda Conosco', icon: <Library className="h-4 w-4" /> },
    { href: '/contact', label: 'Fale Conosco', icon: <MessageSquareText className="h-4 w-4" /> },
  ];
  
  if (!isClient && className?.includes('flex-col')) {
      return null;
  }

  if (className?.includes('flex-col')) {
    return (
      <nav className={cn('flex flex-col gap-1 px-4', className)} {...props}>
        {navItems.map((item) => (
          item.href ? (
            <Link
              key={item.href}
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
            <div 
              key={item.label}
              className={cn(
                'text-md font-medium text-muted-foreground flex items-center gap-2 py-2.5 px-3 rounded-md'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          )
        ))}
      </nav>
    );
  }

  return (
    <NavigationMenu className={cn('hidden md:flex', className)} {...props}>
      <NavigationMenuList>
        {navItems.map((item) => {
          if (item.isMegaMenu) {
            return (
              <NavigationMenuItem key={item.label}>
                <NavigationMenuTrigger className="text-sm font-medium text-muted-foreground hover:text-primary data-[active]:text-primary data-[state=open]:text-primary bg-transparent hover:bg-accent focus:bg-accent">
                  {item.icon && React.cloneElement(item.icon as React.ReactElement, { className: "mr-1.5 h-4 w-4" })}
                  {item.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  {item.contentKey === 'categories' && <MegaMenuCategories categories={searchCategories} onLinkClick={handleLinkClick} />}
                  {item.contentKey === 'modalities' && <MegaMenuLinkList groups={modalityGroups} onLinkClick={handleLinkClick} gridCols="md:grid-cols-1" />}
                  {item.contentKey === 'consignors' && <MegaMenuLinkList groups={consignorMegaMenuGroups} onLinkClick={handleLinkClick} gridCols="md:grid-cols-1" />}
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
                    "text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md flex items-center gap-1.5",
                    pathname === item.href ? 'text-primary bg-accent' : 'text-muted-foreground hover:bg-accent/50 focus:bg-accent/50 focus:text-primary',
                    "data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                  )} onClick={handleLinkClick}>
                    {item.icon}
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

