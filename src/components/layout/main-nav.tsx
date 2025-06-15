
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getAuctioneers } from '@/app/admin/auctioneers/actions'; // Para Nossos Leiloeiros
import type { LotCategory, AuctioneerProfileInfo } from '@/types';
import { Home as HomeIcon, Search as SearchIcon, Building, Users2, MessageSquareText, Tag, PlusCircle, ShoppingCart, LayoutList, Briefcase, ChevronDown, ShoppingBag, Gavel, Library, Landmark } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink, // Importado NavigationMenuLink
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import MegaMenuCategories from './mega-menu-categories';
import MegaMenuLinkList from './mega-menu-link-list'; // Novo
import MegaMenuAuctioneers from './mega-menu-auctioneers'; // Novo

interface NavItem {
  href?: string; // href é opcional para itens que são apenas triggers de megamenu
  label: string;
  icon?: React.ReactNode;
  isMegaMenu?: boolean;
  contentKey?: 'categories' | 'modalities' | 'consignors' | 'auctioneers'; // Para identificar o tipo de conteúdo do megamenu
}

// Dados para Modalidades (estático)
const modalityGroups = [
  {
    items: [
      { href: '/search?auctionType=JUDICIAL', label: 'Leilões Judiciais', description: 'Oportunidades de processos judiciais.' },
      { href: '/search?auctionType=EXTRAJUDICIAL', label: 'Leilões Extrajudiciais', description: 'Negociações diretas e mais ágeis.' },
      { href: '/direct-sales', label: 'Venda Direta', description: 'Compre itens com preço fixo.' },
      // Adicionar "Tomada de Preços" se houver uma página ou filtro específico
      // { href: '/search?auctionType=PRICE_TAKING', label: 'Tomada de Preços', description: 'Processos de cotação e seleção.' },
    ]
  }
];

// Dados para Comitentes (estático)
const consignorGroups = [
  {
    title: 'Tipos de Comitentes',
    items: [
      { href: '/search?consignorType=FINANCIAL', label: 'Financeiras e Bancos' },
      { href: '/search?consignorType=INSURANCE', label: 'Seguradoras' },
      { href: '/search?consignorType=JUDICIARY', label: 'Poder Judiciário' },
      { href: '/search?consignorType=AUTARCHY', label: 'Autarquias e Estatais' },
      { href: '/search?consignorType=CORPORATE', label: 'Empresas Privadas' },
      { href: '/search?consignorType=INDIVIDUAL', label: 'Pessoas Físicas' },
      { href: '/sellers', label: 'Ver Todos Comitentes', icon: <Users2 className="h-4 w-4" /> },
    ]
  }
];


export default function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  const [searchCategories, setSearchCategories] = useState<LotCategory[]>([]);
  const [auctioneers, setAuctioneers] = useState<AuctioneerProfileInfo[]>([]); // Para Nossos Leiloeiros
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
        const [fetchedCategories, fetchedAuctioneers] = await Promise.all([
          getLotCategories(),
          getAuctioneers()
        ]);
        setSearchCategories(fetchedCategories);
        setAuctioneers(fetchedAuctioneers);
      } catch (error) {
        console.error("Error fetching data for main navigation:", error);
        setSearchCategories([]);
        setAuctioneers([]);
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
      href: '/search?tab=categories' // Link de fallback para mobile
    },
    {
      label: 'Modalidades',
      icon: <Gavel className="h-4 w-4" />,
      isMegaMenu: true,
      contentKey: 'modalities',
      href: '/search?filter=modalities' // Link de fallback para mobile
    },
    {
      label: 'Comitentes',
      icon: <Briefcase className="h-4 w-4" />,
      isMegaMenu: true,
      contentKey: 'consignors',
      href: '/sellers' // Link de fallback para mobile
    },
    {
      label: 'Leiloeiros', // Nome mais curto para o menu
      icon: <Landmark className="h-4 w-4" />,
      isMegaMenu: true,
      contentKey: 'auctioneers',
      href: '/auctioneers' // Link de fallback para mobile
    },
    { href: '/direct-sales', label: 'Venda Direta', icon: <ShoppingBag className="h-4 w-4" /> },
    { href: '/sell-with-us', label: 'Venda Conosco', icon: <Library className="h-4 w-4" /> }, // Ícone alterado
    { href: '/contact', label: 'Fale Conosco', icon: <MessageSquareText className="h-4 w-4" /> },
  ];
  
  if (!isClient && className?.includes('flex-col')) {
      return null;
  }

  if (className?.includes('flex-col')) {
    // Renderização para menu mobile (dentro do Sheet)
    return (
      <nav className={cn('flex flex-col gap-1 px-4', className)} {...props}>
        {navItems.map((item) => (
          item.href ? ( // Apenas renderiza Link se href estiver definido
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
          ) : ( // Se não houver href, pode ser um trigger de dropdown/accordion mobile no futuro
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

  // Renderização para menu desktop
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
                  {item.contentKey === 'categories' && <MegaMenuCategories categories={searchCategories} />}
                  {item.contentKey === 'modalities' && <MegaMenuLinkList groups={modalityGroups} gridCols="md:grid-cols-1" />}
                  {item.contentKey === 'consignors' && <MegaMenuLinkList groups={consignorGroups} gridCols="md:grid-cols-1"/>}
                  {item.contentKey === 'auctioneers' && <MegaMenuAuctioneers auctioneers={auctioneers} />}
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          }
          return (
            item.href ? ( // Apenas renderiza NavigationMenuLink se href estiver definido
              <NavigationMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <NavigationMenuLink className={cn(
                    "text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md flex items-center gap-1.5",
                    pathname === item.href ? 'text-primary bg-accent' : 'text-muted-foreground hover:bg-accent/50 focus:bg-accent/50 focus:text-primary',
                    "data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                  )}>
                    {item.icon}
                    {item.label}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ) : null // Não renderiza nada se for um item de megamenu sem href direto (o trigger já faz isso)
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
