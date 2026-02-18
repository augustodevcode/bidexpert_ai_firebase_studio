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
import { ThemeToggle } from './theme-toggle'; 

interface AdminHeaderProps {
  onSearchClick: () => void;
  onSettingsClick: () => void;
  onMobileMenuClick?: () => void; 
}

export default function AdminHeader({ onSearchClick, onSettingsClick, onMobileMenuClick }: AdminHeaderProps) {
  const { unreadNotificationsCount } = useAuth();
  
  return (
    <header className="header-admin-sticky" data-ai-id="admin-header-main">
      
      {onMobileMenuClick && (
        <Button variant="ghost" size="icon" className="btn-admin-mobile-menu" onClick={onMobileMenuClick} data-ai-id="admin-header-mobile-trigger">
            <Menu className="icon-admin-header" />
            <span className="sr-only">Abrir menu</span>
        </Button>
      )}

      {/* Botão de Busca / Command Palette */}
      <div className="wrapper-admin-search" data-ai-id="admin-header-search-wrapper">
          <Button 
            variant="ghost" 
            className="btn-admin-search-command"
            onClick={onSearchClick}
            data-ai-id="admin-header-search-button"
          >
            <Search className="icon-admin-search" />
            <span className="text-admin-search-placeholder">Buscar leilões, lotes...</span>
            <kbd className="kbd-admin-search" data-ai-id="admin-header-kbd">
              <span className="text-kbd-symbol">⌘</span>K
            </kbd>
          </Button>
      </div>

      <div className="wrapper-admin-header-spacer">
        {/* Espaço para Breadcrumbs ou Título da Página, se desejado no futuro */}
      </div>

      {/* Ícones de Ação e Menu do Usuário */}
      <div className="wrapper-admin-header-actions" data-ai-id="admin-header-actions">
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                     <Button variant="ghost" size="sm" className="btn-admin-header-action-view-site" asChild data-ai-id="admin-header-action-view-site">
                      <Link href="/" className="link-admin-header-action">
                         <Globe className="icon-admin-header-with-text" />
                         <span className="text-admin-action-label">Ver Site</span>
                      </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Visualizar o site público</p></TooltipContent>
            </Tooltip>
            
            <ThemeToggle />

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="btn-admin-header-action" asChild data-ai-id="admin-header-action-messages">
                    <Link href="/admin/contact-messages">
                        <MessageSquare className="icon-admin-header" />
                        <span className="sr-only">Mensagens</span>
                    </Link>
                    </Button>
                </TooltipTrigger>
                 <TooltipContent><p>Mensagens de Contato</p></TooltipContent>
            </Tooltip>
             <Tooltip>
                <TooltipTrigger asChild>
                     <Button variant="ghost" size="icon" className="btn-admin-header-action-relative" asChild data-ai-id="admin-header-action-notifications">
                       <Link href="/dashboard/notifications">
                        <Bell className="icon-admin-header" />
                        {unreadNotificationsCount > 0 && (
                            <Badge variant="destructive" className="badge-admin-notification" data-ai-id="admin-header-notification-badge">
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
                     <Button variant="ghost" size="icon" className="btn-admin-header-action" onClick={onSettingsClick} data-ai-id="admin-header-action-settings">
                       <Settings className="icon-admin-header" />
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
