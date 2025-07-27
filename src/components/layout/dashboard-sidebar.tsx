// src/components/layout/dashboard-sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
    LayoutDashboard, 
    Gavel, 
    ShoppingBag, 
    Heart, 
    History, 
    FileText, 
    BarChart, 
    Bell, 
    Settings,
    Briefcase,
    ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

const mainNavItems = [
  { href: '/dashboard/overview', title: 'Visão Geral', icon: LayoutDashboard },
  { href: '/dashboard/bids', title: 'Meus Lances', icon: Gavel },
  { href: '/dashboard/wins', title: 'Meus Arremates', icon: ShoppingBag },
  { href: '/dashboard/favorites', title: 'Lotes Favoritos', icon: Heart },
  { href: '/dashboard/history', title: 'Histórico', icon: History },
  { href: '/dashboard/documents', title: 'Meus Documentos', icon: FileText },
  { href: '/dashboard/reports', title: 'Relatórios', icon: BarChart },
  { href: '/dashboard/notifications', title: 'Notificações', icon: Bell },
  { href: '/profile/edit', title: 'Configurações do Perfil', icon: Settings },
];

const NavButton = ({ item, pathname, onLinkClick }: { item: { href: string; title: string; icon: React.ElementType }; pathname: string; onLinkClick?: () => void }) => (
  <Button
    key={item.href}
    variant={pathname === item.href || (item.href !== '/dashboard/overview' && pathname.startsWith(item.href)) ? 'secondary' : 'ghost'}
    className={cn(
      'w-full justify-start',
      (pathname === item.href || (item.href !== '/dashboard/overview' && pathname.startsWith(item.href))) && 'font-semibold text-primary hover:text-primary'
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

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { userProfileWithPermissions } = useAuth();

  const canSeeConsignorDashboard = userProfileWithPermissions?.permissions?.includes('consignor_dashboard:view') || userProfileWithPermissions?.permissions?.includes('manage_all');
  const canSeeAdminDashboard = userProfileWithPermissions?.permissions?.includes('manage_all');

  return (
    <aside className="sticky top-0 h-screen w-64 bg-background border-r flex-col hidden md:flex">
      <div className="p-4 border-b">
        <Link href="/dashboard/overview" className="flex items-center space-x-2">
          <LayoutDashboard className="h-7 w-7 text-primary" />
          <span className="font-bold text-xl text-primary">Meu Painel</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-1">
          {mainNavItems.map((item) => <NavButton key={item.href} item={item} pathname={pathname} />)}
          
          {(canSeeConsignorDashboard || canSeeAdminDashboard) && <Separator className="my-2"/>}
          
          {canSeeConsignorDashboard && (
             <NavButton item={{href: '/consignor-dashboard/overview', title: 'Painel Comitente', icon: Briefcase}} pathname={pathname} />
          )}

          {canSeeAdminDashboard && (
             <NavButton item={{href: '/admin/dashboard', title: 'Painel Admin', icon: ShieldCheck}} pathname={pathname} />
          )}
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
