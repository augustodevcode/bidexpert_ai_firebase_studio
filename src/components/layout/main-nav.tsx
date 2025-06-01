
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PlusCircle, Search, Home, Building, Users, MessageSquare } from 'lucide-react'; // Added more icons for mobile

interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

// These items are now primarily for the mobile drawer
const navItems: NavItem[] = [
  { href: '/', label: 'Início', icon: <Home className="h-4 w-4" /> },
  { href: '/auctions/create', label: 'Criar Leilão', icon: <PlusCircle className="h-4 w-4" /> },
  { href: '/search', label: 'Buscar Itens/Leilões', icon: <Search className="h-4 w-4" /> },
  { href: '/sell-with-us', label: 'Venda Conosco', icon: <PlusCircle className="h-4 w-4" /> }, // Added for mobile
  { href: '/sellers', label: 'Comitentes', icon: <Building className="h-4 w-4" /> }, // Added for mobile
  { href: '/contact', label: 'Fale Conosco', icon: <MessageSquare className="h-4 w-4" /> }, // Added for mobile
];

export default function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  // If not in a flex-col (mobile drawer), this component renders nothing,
  // as desktop navigation is handled differently in the header.
  if (!className?.includes('flex-col')) {
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
            'text-md font-medium transition-colors hover:text-primary flex items-center gap-2 py-2.5', // Increased py for better touch targets
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
