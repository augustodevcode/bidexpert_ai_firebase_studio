
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getLotCategories } from '@/app/admin/categories/actions';
import type { LotCategory } from '@/types';
import { Home as HomeIcon, Search as SearchIcon, Building, Users2, MessageSquareText, Tag, PlusCircle, ShoppingCart, LayoutList, Briefcase, ChevronDown, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import MegaMenuCategories from './mega-menu-categories'; // Importe o novo componente

interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
  isMegaMenu?: boolean; // Nova propriedade para identificar o item do megamenu
}

export default function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  const [searchCategories, setSearchCategories] = useState<LotCategory[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Para o menu mobile

  const handleLinkClick = () => {
    if (className?.includes('flex-col')) { // Verifica se é o menu mobile
      setIsMobileMenuOpen(false); // Fecha o Sheet no mobile ao clicar no link
      // Se o Sheet for controlado externamente, você pode precisar de um callback para o Header
    }
  };

  useEffect(() => {
    setIsClient(true);
    async function fetchNavCategories() {
      try {
        const fetchedCategories = await getLotCategories();
        setSearchCategories(fetchedCategories);
      } catch (error) {
        console.error("Error fetching categories for main navigation:", error);
        setSearchCategories([]);
      }
    }
    fetchNavCategories();
  }, []);

  const navItems: NavItem[] = [
    { href: '/', label: 'Início', icon: <HomeIcon className="h-4 w-4" /> },
    { href: '/search', label: 'Todos os Lotes', icon: <LayoutList className="h-4 w-4" /> },
    { 
      href: '/search?tab=categories', // Link de fallback para mobile ou se JS estiver desabilitado
      label: 'Categorias', 
      icon: <Tag className="h-4 w-4" />,
      isMegaMenu: true // Marca este item para tratamento especial
    },
    { href: '/direct-sales', label: 'Venda Direta', icon: <ShoppingBag className="h-4 w-4" /> },
    { href: '/auctions/create', label: 'Criar Leilão IA', icon: <PlusCircle className="h-4 w-4" /> },
    { href: '/sell-with-us', label: 'Venda Conosco', icon: <Briefcase className="h-4 w-4" /> },
    { href: '/sellers', label: 'Comitentes', icon: <Users2 className="h-4 w-4" /> },
    { href: '/contact', label: 'Fale Conosco', icon: <MessageSquareText className="h-4 w-4" /> },
  ];
  
  if (!isClient && className?.includes('flex-col')) {
      return null; // Não renderizar nada no SSR para o menu mobile do Sheet, pois ele é client-side
  }

  if (className?.includes('flex-col')) {
    // Renderização para menu mobile (dentro do Sheet)
    return (
      <nav className={cn('flex flex-col gap-1 px-4', className)} {...props}>
        {navItems.map((item) => (
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
                  <MegaMenuCategories categories={searchCategories} />
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          }
          return (
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
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
