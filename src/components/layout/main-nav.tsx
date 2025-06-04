

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { slugify } from '@/lib/sample-data'; // getUniqueLotCategories from sample-data removed
import { getLotCategories } from '@/app/admin/categories/actions'; // Import for dynamic categories
import type { LotCategory } from '@/types'; // Import LotCategory type
import { Home as HomeIcon, Search as SearchIcon, Building, Users2, MessageSquareText, Tag, PlusCircle, ShoppingBasket, LayoutList, FileText, Package, Tv, Percent, Handshake, Eye, Briefcase, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

export default function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    async function fetchNavCategories() {
      try {
        const fetchedCategories = await getLotCategories();
        const topCategories = fetchedCategories.slice(0, 3); // Show top 3 categories in nav
        const categoryNavItems: NavItem[] = topCategories.map(category => ({
          href: `/category/${category.slug}`,
          label: category.name,
          icon: <Tag className="h-4 w-4" />
        }));

        const baseNavItems: NavItem[] = [
          { href: '/', label: 'Início', icon: <HomeIcon className="h-4 w-4" /> },
          { href: '/search', label: 'Todos os Lotes', icon: <LayoutList className="h-4 w-4" /> },
          { href: '/direct-sales', label: 'Venda Direta', icon: <ShoppingCart className="h-4 w-4" /> },
          ...categoryNavItems,
          { href: '/auctions/create', label: 'Criar Leilão IA', icon: <PlusCircle className="h-4 w-4" /> },
          { href: '/sell-with-us', label: 'Venda Conosco', icon: <Briefcase className="h-4 w-4" /> },
          { href: '/sellers', label: 'Comitentes', icon: <Users2 className="h-4 w-4" /> },
          { href: '/contact', label: 'Fale Conosco', icon: <MessageSquareText className="h-4 w-4" /> },
        ];
        setNavItems(baseNavItems);
      } catch (error) {
        console.error("Error fetching categories for main navigation:", error);
        // Fallback to basic nav items if fetch fails
        const baseNavItems: NavItem[] = [
          { href: '/', label: 'Início', icon: <HomeIcon className="h-4 w-4" /> },
          { href: '/search', label: 'Todos os Lotes', icon: <LayoutList className="h-4 w-4" /> },
          { href: '/direct-sales', label: 'Venda Direta', icon: <ShoppingCart className="h-4 w-4" /> },
          { href: '/auctions/create', label: 'Criar Leilão IA', icon: <PlusCircle className="h-4 w-4" /> },
          { href: '/sell-with-us', label: 'Venda Conosco', icon: <Briefcase className="h-4 w-4" /> },
          { href: '/sellers', label: 'Comitentes', icon: <Users2 className="h-4 w-4" /> },
          { href: '/contact', label: 'Fale Conosco', icon: <MessageSquareText className="h-4 w-4" /> },
        ];
        setNavItems(baseNavItems);
      }
    }
    fetchNavCategories();
  }, []);

  if (!isClient || !className?.includes('flex-col')) {
    return null;
  }
  
  if (navItems.length === 0 && className?.includes('flex-col')) {
      return null;
  }

  return (
    <nav
      className={cn('flex items-center space-x-4 lg:space-x-6', className)}
      {...props}
    >
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'text-md font-medium transition-colors hover:text-primary flex items-center gap-2 py-2.5',
            pathname === item.href ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {item.icon}
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
