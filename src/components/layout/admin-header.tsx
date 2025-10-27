// src/components/layout/admin-header.tsx
/**
 * @fileoverview Cabeçalho unificado para todas as áreas de dashboard (Admin, Comitente, Arrematante).
 * Este componente fornece uma barra de navegação superior consistente com busca,
 * notificações e acesso ao menu do usuário. Ele é projetado para ser usado
 * dentro dos layouts de dashboard para separar a navegação administrativa da pública.
 */
'use client';

import { Search, Bell, Settings, MessageSquare, Menu, Globe, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import UserNav from './user-nav';
import Link from 'next/link';
import { Badge } from '../ui/badge';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { ThemeToggle } from './theme-toggle'; // Importado

interface AdminHeaderProps {
  onSearchClick: () => void;
  onSettingsClick: () => void;
  onMobileMenuClick?: () => void; // Adicionado para o gatilho do menu móvel
}

export default function AdminHeader({ onSearchClick, onSettingsClick, onMobileMenuClick }: AdminHeaderProps) {
  const { unreadNotificationsCount } = useAuth();
  
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-sidebar px-4 text-sidebar-foreground shadow-md sm:px-6">
      
      {/* Gatilho do Menu Móvel, se a função for passada */}
      {onMobileMenuClick && (
        <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={onMobileMenuClick}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu</span>
        </Button>
      )}

      {/* Botão de Busca / Command Palette */}
      <div className="relative flex-1 md:grow-0">
          <Button 
            variant="ghost" 
            className="group w-full justify-start text-left text-sm text-sidebar-foreground/80 md:w-[250px] lg:w-[350px] h-9 bg-sidebar-accent/50 hover:bg-sidebar-accent"
            onClick={onSearchClick}
            data-ai-id="admin-header-search-button"
          >
            <Search className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">Buscar leilões, lotes...</span>
            <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border border-sidebar-border bg-sidebar-accent/80 px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
      </div>

      <div className="flex-1">
        {/* Espaço para Breadcrumbs ou Título da Página, se desejado no futuro */}
      </div>

      {/* Ícones de Ação e Menu do Usuário */}
      <div className="flex items-center gap-1.5">
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                     <Button variant="ghost" size="sm" className="h-9 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" asChild>
                      <Link href="/">
                         <Globe className="h-4 w-4 mr-2" />
                         <span className="hidden sm:inline">Ver Site</span>
                      </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Visualizar o site público</p></TooltipContent>
            </Tooltip>
            
            <ThemeToggle />

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" asChild>
                    <Link href="/admin/contact-messages">
                        <MessageSquare className="h-4 w-4" />
                        <span className="sr-only">Mensagens</span>
                    </Link>
                    </Button>
                </TooltipTrigger>
                 <TooltipContent><p>Mensagens de Contato</p></TooltipContent>
            </Tooltip>
             <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                 <TooltipContent><p>Notificações</p></TooltipContent>
             </Tooltip>
             <Tooltip>
                <TooltipTrigger asChild>
                     <Button variant="ghost" size="icon" className="h-9 w-9 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={onSettingsClick}>
                       <Settings className="h-4 w-4" />
                       <span className="sr-only">Configurações</span>
                    </Button>
                </TooltipTrigger>
                 <TooltipContent><p>Configurações do Dashboard</p></TooltipContent>
             </Tooltip>
        </TooltipProvider>
        <UserNav />
      </div>
    </header>
  );
}
