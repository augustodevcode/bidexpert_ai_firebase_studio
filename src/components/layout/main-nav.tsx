
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getUniqueLotCategories, slugify } from '@/lib/sample-data';
import { Home, Search as SearchIcon, Building, Users, MessageSquareText, Tag, PlusCircle, ShoppingBasket, LayoutList, FileText, Package, Tv, Percent, Handshake, Eye } from 'lucide-react';
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

    // Reflecting the new header structure for mobile menu
    const baseNavItems: NavItem[] = [
      { href: '/', label: 'Home', icon: <Home className="h-4 w-4" /> },
      { href: '/search', label: 'Shop (Todos os Lotes)', icon: <LayoutList className="h-4 w-4" /> },
      { href: '#', label: 'Pages (Exemplo)', icon: <FileText className="h-4 w-4" /> }, // Placeholder
      ...categoryNavItems, // Main lot categories
      { href: '#', label: 'Electronics Devices (Exemplo)', icon: <Tv className="h-4 w-4" /> }, // Placeholder
      { href: '#', label: 'Blog (Exemplo)', icon: <Package className="h-4 w-4" /> }, // Placeholder
      { href: '/sell-with-us', label: 'Become A Vendor', icon: <Handshake className="h-4 w-4" /> },
      { href: '#', label: 'Flash Deals (Exemplo)', icon: <Percent className="h-4 w-4" /> }, // Placeholder
      { href: '/sellers', label: 'Comitentes', icon: <Building className="h-4 w-4" /> },
      { href: '/contact', label: 'Fale Conosco', icon: <MessageSquareText className="h-4 w-4" /> },
    ];
    setDynamicNavItems(baseNavItems);
  }, []);

  // Render only if className includes flex-col (mobile menu context)
  if (!isClient || !className?.includes('flex-col')) {
    return null;
  }

  if (dynamicNavItems.length === 0 && className?.includes('flex-col')) {
      return null;
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
