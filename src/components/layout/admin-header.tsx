// src/components/layout/admin-header.tsx
'use client';

import { Search, Bell, Settings, MessageSquare, Menu, Globe, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import UserNav from './user-nav';
import Link from 'next/link';
import { Badge } from '../ui/badge';

interface AdminHeaderProps {
  onSearchClick: () => void;
}

export default function AdminHeader({ onSearchClick }: AdminHeaderProps) {
  const { unreadNotificationsCount } = useAuth();
  
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-sidebar px-4 text-sidebar-foreground shadow-md sm:px-6">
      
      <div className="relative flex-1 md:grow-0">
          <Button 
            variant="ghost" 
            className="group w-full justify-start text-left text-sm text-sidebar-foreground/80 md:w-[250px] lg:w-[350px] h-9 bg-sidebar-accent/50 hover:bg-sidebar-accent"
            onClick={onSearchClick}
            data-ai-id="admin-header-search-button"
          >
            <Search className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">Buscar leilões, lotes, usuários...</span>
            <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border border-sidebar-border bg-sidebar-accent px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
      </div>

      <div className="flex-1">
        {/* Breadcrumbs can be placed here if desired for a more compact layout */}
      </div>

      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="sm" className="h-9 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" asChild>
          <Link href="/">
             <Globe className="h-4 w-4 mr-2" /> Ver Site
          </Link>
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
             <Sun className="h-4 w-4" />
             <span className="sr-only">Alternar tema</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" asChild>
          <Link href="/admin/contact-messages">
             <MessageSquare className="h-4 w-4" />
             <span className="sr-only">Mensagens</span>
          </Link>
        </Button>
         <Button variant="ghost" size="icon" className="h-9 w-9 relative text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" asChild>
           <Link href="/dashboard/notifications">
            <Bell className="h-4 w-4" />
            {unreadNotificationsCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-0 text-[10px]">
                    {unreadNotificationsCount}
                </Badge>
            )}
             <span className="sr-only">Notificações</span>
           </Link>
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" asChild>
          <Link href="/admin/settings">
             <Settings className="h-4 w-4" />
             <span className="sr-only">Configurações</span>
          </Link>
        </Button>
        <UserNav />
      </div>
    </header>
  );
}
