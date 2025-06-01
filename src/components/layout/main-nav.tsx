
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getUniqueLotCategories, slugify } from '@/lib/sample-data';
import { Home, Search, Building, Users, MessageSquareText, Tag, PlusCircle, ShoppingBasket, LayoutList } from 'lucide-react'; // Adicionado LayoutList
import { useEffect, useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

export default function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  const [dynamicNavItems, setDynamicNavItems] = useState<NavItem[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const topCategories = getUniqueLotCategories().slice(0, 3);
    const categoryNavItems: NavItem[] = topCategories.map(category => ({
      href: `/category/${slugify(category)}`,
      label: category,
      icon: <Tag className="h-4 w-4" /> 
    }));

    const baseNavItems: NavItem[] = [
      { href: '/', label: 'Início', icon: <Home className="h-4 w-4" /> },
      { href: '/search', label: 'Todos os Lotes', icon: <LayoutList className="h-4 w-4" /> }, // Ícone atualizado
      ...categoryNavItems,
      { href: '/auctions/create', label: 'Criar Leilão', icon: <PlusCircle className="h-4 w-4" /> },
      { href: '/sell-with-us', label: 'Venda Conosco', icon: <ShoppingBasket className="h-4 w-4" /> },
      { href: '/sellers', label: 'Comitentes', icon: <Building className="h-4 w-4" /> },
      { href: '/contact', label: 'Fale Conosco', icon: <MessageSquareText className="h-4 w-4" /> },
    ];
    setDynamicNavItems(baseNavItems);
  }, []);

  if (!isClient || !className?.includes('flex-col')) {
    return null;
  }
  
  if (dynamicNavItems.length === 0 && className?.includes('flex-col')) {
      return null; // Aguarda a montagem e o useEffect popular os itens
  }

  return (
    <nav
      className={cn('flex items-center space-x-4 lg:space-x-6', className)}
      {...props}
    >
      {dynamicNavItems.map((item) => (
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
