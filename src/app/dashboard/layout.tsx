// src/app/dashboard/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface NavItem {
  href: string;
  title: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
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

function DashboardSidebar() {
  const pathname = usePathname();
  const { userProfileWithPermissions } = useAuth();
  
  const canSeeConsignorDashboard = userProfileWithPermissions?.permissions?.includes('consignor_dashboard:view') || userProfileWithPermissions?.permissions?.includes('manage_all');

  return (
     <aside className="w-64 flex-shrink-0 bg-background border-r hidden md:block">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-primary">Meu Painel</h2>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map(item => (
            <Button
              key={item.href}
              variant={pathname === item.href ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              asChild
            >
              <Link href={item.href}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Link>
            </Button>
          ))}
          
           {canSeeConsignorDashboard && (
            <>
              <Separator className="my-2" />
               <Button
                variant={pathname.startsWith('/consignor-dashboard') ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                asChild
              >
                <Link href="/consignor-dashboard/overview">
                  <Briefcase className="mr-2 h-4 w-4" /> Painel Comitente
                </Link>
              </Button>
            </>
          )}

           {userProfileWithPermissions?.permissions?.includes('manage_all') && (
            <>
              <Separator className="my-2" />
              <Button
                variant={pathname.startsWith('/admin') ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                asChild
              >
                <Link href="/admin/dashboard">
                  <ShieldCheck className="mr-2 h-4 w-4" /> Painel Admin
                </Link>
              </Button>
            </>
           )}
        </nav>
      </aside>
  );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userProfileWithPermissions, loading } = useAuth();
  const router = useRouter();
  
  // Client-side effect to handle redirection
  useEffect(() => {
    if (!loading && !userProfileWithPermissions) {
      router.push('/auth/login?redirect=/dashboard/overview');
    }
  }, [userProfileWithPermissions, loading, router]);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
         <p className="ml-3 text-muted-foreground">Carregando seu painel...</p>
      </div>
    );
  }

  if (!userProfileWithPermissions) {
    // Return a loader while redirecting to avoid flashing the "Access Denied" message
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p className="text-muted-foreground">Redirecionando para login...</p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-6 md:p-8 bg-muted/30">
        {children}
      </main>
    </div>
  );
}

```
- src/components/layout/dashboard-sidebar.tsx:
```tsx
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

