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
    Briefcase as ConsignorIcon,
    ShieldCheck,
    Menu,
    Scale
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { hasPermission, hasAnyPermission } from '@/lib/permissions';

const mainNavItems = [
  { href: '/dashboard/overview', title: 'Visão Geral', icon: LayoutDashboard },
  { href: '/dashboard/bids', title: 'Meus Lances', icon: Gavel },
  { href: '/dashboard/wins', title: 'Meus Arremates', icon: ShoppingBag },
  { href: '/dashboard/favorites', title: 'Lotes Favoritos', icon: Heart },
  { href: '/dashboard/history', title: 'Histórico', icon: History },
  { href: '/dashboard/documents', title: 'Meus Documentos', icon: FileText },
  { href: '/dashboard/reports', title: 'Relatórios', icon: BarChart },
  { href: '/dashboard/notifications', title: 'Notificações', icon: Bell },
  { href: '/dashboard/profile/edit', title: 'Configurações do Perfil', icon: Settings },
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

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
    const pathname = usePathname();
    const { userProfileWithPermissions } = useAuth();
    
    const canSeeLawyerDashboard = hasAnyPermission(userProfileWithPermissions, ['lawyer_dashboard:view', 'manage_all']);
    const canSeeConsignorDashboard = hasAnyPermission(userProfileWithPermissions, ['consignor_dashboard:view', 'manage_all']);
    const canSeeAdminDashboard = hasPermission(userProfileWithPermissions, 'manage_all') || userProfileWithPermissions?.roleNames?.includes('AUCTION_ANALYST');

    return (
        <>
            <div className="p-4 border-b">
                <Link href="/dashboard/overview" className="flex items-center space-x-2">
                <LayoutDashboard className="h-7 w-7 text-primary" />
                <span className="font-bold text-xl text-primary">Meu Painel</span>
                </Link>
            </div>
            <ScrollArea className="flex-1">
                <nav className="p-2 space-y-1">
                {mainNavItems.map((item) => <NavButton key={item.href} item={item} pathname={pathname} onLinkClick={onLinkClick} />)}
                
                {(canSeeLawyerDashboard || canSeeConsignorDashboard || canSeeAdminDashboard) && <Separator className="my-2"/>}

                {canSeeLawyerDashboard && (
                  <NavButton item={{href: '/lawyer/dashboard', title: 'Painel Advogado', icon: Scale}} pathname={pathname} onLinkClick={onLinkClick} />
                )}
                
                {canSeeConsignorDashboard && (
                    <NavButton item={{href: '/consignor-dashboard/overview', title: 'Painel Comitente', icon: ConsignorIcon}} pathname={pathname} onLinkClick={onLinkClick} />
                )}

                {canSeeAdminDashboard && (
                    <NavButton item={{href: '/admin/dashboard', title: 'Painel Admin', icon: ShieldCheck}} pathname={pathname} onLinkClick={onLinkClick} />
                )}
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

export default function DashboardSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <>
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50 bg-background/50 backdrop-blur-sm">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] p-0 flex flex-col">
          <SidebarContent onLinkClick={() => setIsMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside data-ai-id="user-dashboard-sidebar" className="sticky top-0 h-screen w-64 bg-background border-r flex-col hidden md:flex">
         <SidebarContent />
      </aside>
    </>
  );
}
