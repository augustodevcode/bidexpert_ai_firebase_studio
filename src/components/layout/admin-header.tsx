// src/components/layout/admin-header.tsx
'use client';

import { Search, Bell, Settings, MessageSquare, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import UserNav from './user-nav';
import Link from 'next/link';
import DynamicBreadcrumbs from './dynamic-breadcrumbs';
import { Badge } from '../ui/badge';

export default function AdminHeader() {
  const { unreadNotificationsCount } = useAuth();
  // Placeholder para funcionalidade de busca (Item 36)
  const handleSearchClick = () => {
    console.log("Search button clicked - Command Palette will be implemented here.");
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      {/* O trigger do menu mobile pode ser adicionado aqui se necessário para o layout do Admin */}
      
      <div className="relative flex-1 md:grow-0">
          <Button 
            variant="outline" 
            className="group w-full justify-start text-left text-sm text-muted-foreground md:w-[200px] lg:w-[300px]"
            onClick={handleSearchClick}
          >
            <Search className="mr-2 h-4 w-4" />
            <span>Buscar...</span>
            <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
      </div>

      <div className="flex-1">
        {/* Breadcrumbs podem ser adicionados aqui se desejado */}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="h-8 w-8" asChild>
          <Link href="/admin/contact-messages">
             <MessageSquare className="h-4 w-4" />
             <span className="sr-only">Mensagens</span>
          </Link>
        </Button>
         <Button variant="outline" size="icon" className="h-8 w-8 relative" asChild>
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
        <Button variant="outline" size="icon" className="h-8 w-8" asChild>
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
