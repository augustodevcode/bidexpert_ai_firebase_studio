
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutGrid, PlusCircle, Search, Home } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode; // Ícone opcional para o menu principal desktop
}

const navItems: NavItem[] = [
  { href: '/', label: 'Início', icon: <Home className="h-4 w-4" /> },
  { href: '/auctions/create', label: 'Criar Leilão', icon: <PlusCircle className="h-4 w-4" /> },
  { href: '/search', label: 'Buscar Leilões', icon: <LayoutGrid className="h-4 w-4" /> },
   // Item específico para mobile drawer
  { href: '/search-mobile', label: 'Buscar Itens', icon: <Search className="h-4 w-4" /> },
];

export default function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  return (
    <nav
      className={cn('flex items-center space-x-4 lg:space-x-6', className)}
      {...props}
    >
      {navItems.map((item) => {
        // Esconder "Buscar Itens" no desktop e "Buscar Leilões" no mobile drawer (onde ele tem o SearchIcon)
        if (item.href === '/search-mobile' && !className?.includes('flex-col')) {
          return null;
        }
        if (item.href === '/search' && className?.includes('flex-col')) {
           return null;
        }

        return (
          <Link
            key={item.href}
            href={item.href === '/search-mobile' ? '/search' : item.href} // Redirecionar search-mobile para /search
            className={cn(
              'text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5 py-2',
              pathname === item.href || (item.href === '/' && pathname.startsWith('/auctions/')) ? 'text-primary' : 'text-muted-foreground',
              // Esconder link de busca no desktop se houver uma barra de busca no header
              item.label === 'Buscar Leilões' && 'hidden md:flex', // Esconder "Buscar Leilões" no mobile, mostrar no desktop
               item.label === 'Buscar Itens' && 'md:hidden' // Mostrar "Buscar Itens" apenas no mobile drawer
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
