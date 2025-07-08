
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, LayoutDashboard, ListChecks, DollarSign, ShoppingCart, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const sidebarNavItems = [
  {
    title: 'Visão Geral',
    href: '/consignor-dashboard/overview',
    icon: LayoutDashboard,
  },
  {
    title: 'Meus Leilões',
    href: '/consignor-dashboard/auctions',
    icon: Briefcase,
    disabled: false,
  },
  {
    title: 'Meus Lotes',
    href: '/consignor-dashboard/lots',
    icon: ListChecks,
    disabled: false, 
  },
  {
    title: 'Venda Direta',
    href: '/consignor-dashboard/direct-sales',
    icon: ShoppingCart,
    disabled: false, 
  },
   {
    title: 'Relatórios',
    href: '/consignor-dashboard/reports',
    icon: BarChart3,
    disabled: false,
  },
  {
    title: 'Financeiro',
    href: '/consignor-dashboard/financial',
    icon: DollarSign,
    disabled: true, // Placeholder
  },
  {
    title: 'Configurações',
    href: '/consignor-dashboard/settings',
    icon: Settings,
    disabled: true, // Placeholder
  },
];

export default function ConsignorSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 h-screen w-64 bg-background border-r flex flex-col">
      <div className="p-4 border-b">
        <Link href="/consignor-dashboard/overview" className="flex items-center space-x-2">
          <Briefcase className="h-7 w-7 text-primary" />
          <span className="font-bold text-xl text-primary">Painel Comitente</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <nav className="p-4 space-y-1">
          {sidebarNavItems.map((item) => (
            <Button
              key={item.title}
              variant={pathname === item.href || (item.href !== '/consignor-dashboard/overview' && pathname.startsWith(item.href) && !item.disabled) ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start',
                (pathname === item.href || (item.href !== '/consignor-dashboard/overview' && pathname.startsWith(item.href)) && !item.disabled) && 'font-semibold text-primary hover:text-primary'
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
