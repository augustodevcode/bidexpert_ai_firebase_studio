'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutGrid, PlusCircle, Search } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Auctions', icon: <LayoutGrid className="h-4 w-4" /> },
  { href: '/auctions/create', label: 'Create Auction', icon: <PlusCircle className="h-4 w-4" /> },
  { href: '/search', label: 'Browse', icon: <Search className="h-4 w-4 md:hidden" /> }, // Search icon for mobile
];

export default function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

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
            'text-sm font-medium transition-colors hover:text-primary flex items-center gap-1',
            pathname === item.href ? 'text-primary' : 'text-muted-foreground',
             // Hide search link on desktop as there's a search bar
            item.href === '/search' && 'md:hidden'
          )}
        >
          {item.icon}
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
