// src/components/layout/consignor-sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, LayoutDashboard, ListChecks, DollarSign, ShoppingCart, BarChart3, Settings, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

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
  },
  {
    title: 'Meus Lotes',
    href: '/consignor-dashboard/lots',
    icon: ListChecks,
  },
  {
    title: 'Venda Direta',
    href: '/consignor-dashboard/direct-sales',
    icon: ShoppingCart,
  },
  {
    title: 'Relatórios',
    href: '/consignor-dashboard/reports',
    icon: BarChart3,
  },
  {
    title: 'Financeiro',
    href: '/consignor-dashboard/financial',
    icon: DollarSign,
  },
  {
    title: 'Configurações',
    href: '/consignor-dashboard/settings',
    icon: Settings,
  },
];

const NavButton = ({ item, pathname, onLinkClick }: { item: { href: string; title: string; icon: React.ElementType }; pathname: string; onLinkClick?: () => void; }) => (
    <Button
        key={item.title}
        variant={pathname === item.href || (item.href !== '/consignor-dashboard/overview' && pathname.startsWith(item.href)) ? 'secondary' : 'ghost'}
        className={cn(
            'w-full justify-start',
            (pathname === item.href || (item.href !== '/consignor-dashboard/overview' && pathname.startsWith(item.href))) && 'font-semibold text-primary hover:text-primary'
        )}
        asChild
        onClick={onLinkClick}
    >
        <Link href={item.href}>
            <item.icon className="mr-2 h-4 w-4" />
            {item.title}
        </Link>
    </Button>
);


function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
    const pathname = usePathname();
    return (
        <>
            <div className="p-4 border-b">
                <Link href="/consignor-dashboard/overview" className="flex items-center space-x-2">
                <Briefcase className="h-7 w-7 text-primary" />
                <span className="font-bold text-xl text-primary">Painel Comitente</span>
                </Link>
            </div>
            <ScrollArea className="flex-1">
                <nav className="p-4 space-y-1">
                {sidebarNavItems.map((item) => (
                    <NavButton key={item.href} item={item} pathname={pathname} onLinkClick={onLinkClick} />
                ))}
                </nav>
            </ScrollArea>
            <div className="p-4 border-t">
                <Button variant="outline" className="w-full" asChild>
                    <Link href="/">Voltar ao Site</Link>
                </Button>
            </div>
        </>
    );
}


export default function ConsignorSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <>
      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50 bg-background/50 backdrop-blur-sm">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] p-0 flex flex-col">
            <SidebarContent onLinkClick={() => setIsMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside data-ai-id="consignor-sidebar" className="sticky top-0 h-screen w-64 bg-background border-r flex-col hidden md:flex">
         <SidebarContent />
      </aside>
    </>
  );
}
