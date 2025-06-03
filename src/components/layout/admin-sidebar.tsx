
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ListChecks, Package, Landmark, Users, Settings, LayoutDashboard, Gavel } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const sidebarNavItems = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard', 
    icon: LayoutDashboard,
  },
  {
    title: 'Leilões',
    href: '/admin/auctions',
    icon: Gavel, 
    disabled: false, 
  },
  {
    title: 'Lotes',
    href: '/admin/lots',
    icon: Package,
    disabled: false,
  },
  {
    title: 'Categorias de Lotes',
    href: '/admin/categories',
    icon: ListChecks,
  },
  {
    title: 'Comitentes',
    href: '/admin/sellers', 
    icon: Users, 
    disabled: false, 
  },
  {
    title: 'Leiloeiros', 
    href: '/admin/auctioneers', 
    icon: Landmark, 
    disabled: false, // Habilitando o link
  },
  {
    title: 'Estados',
    href: '/admin/states',
    icon: Landmark,
    disabled: true, 
  },
  {
    title: 'Cidades',
    href: '/admin/cities',
    icon: Landmark,
    disabled: true, 
  },
  {
    title: 'Usuários',
    href: '/admin/users',
    icon: Users,
    disabled: true, 
  },
  {
    title: 'Configurações',
    href: '/admin/settings',
    icon: Settings,
    disabled: true, 
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 h-screen w-64 bg-background border-r flex flex-col">
      <div className="p-4 border-b">
        <Link href="/admin/dashboard" className="flex items-center space-x-2">
          <LayoutDashboard className="h-7 w-7 text-primary" />
          <span className="font-bold text-xl text-primary">BidExpert Admin</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <nav className="p-4 space-y-1">
          {sidebarNavItems.map((item) => (
            <Button
              key={item.title}
              variant={pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href) && !item.disabled) ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start',
                (pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href)) && !item.disabled) && 'font-semibold text-primary hover:text-primary'
              )}
              asChild
              disabled={item.disabled}
            >
              <Link href={item.disabled ? '#' : item.href}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Link>
            </Button>
          ))}
        </nav>
      </ScrollArea>
      <div className="p-4 border-t">
        <Button variant="outline" className="w-full" asChild>
            <Link href="/">Voltar ao Site</Link>
        </Button>
      </div>
    </aside>
  );
}

    