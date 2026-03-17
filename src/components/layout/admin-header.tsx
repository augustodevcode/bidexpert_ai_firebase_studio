/**
 * @fileoverview Cabeçalho unificado para todas as áreas de dashboard (Admin, Comitente, Arrematante).
 * Este componente fornece uma barra de navegação superior consistente com busca,
 * notificações e acesso ao menu do usuário. Ele é projetado para ser usado
 * dentro dos layouts de dashboard para separar a navegação administrativa da pública.
 */
'use client';

import { Search, Bell, Settings, MessageSquare, Menu, Globe, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import UserNav from './user-nav';
import Link from 'next/link';
import { Badge } from '../ui/badge';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { ThemeToggle } from './theme-toggle';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface AdminHeaderProps {
  onSearchClick: () => void;
  onSettingsClick: () => void;
  onMobileMenuClick?: () => void;
  queryMonitorEnabled?: boolean;
  onQueryMonitorToggle?: (enabled: boolean) => void;
}

export default function AdminHeader({ 
  onSearchClick, 
  onSettingsClick, 
  onMobileMenuClick,
  queryMonitorEnabled = false,
  onQueryMonitorToggle
}: AdminHeaderProps) {
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
        {/* Feature Flag: Query Monitor Toggle */}
        <div className="flex items-center gap-2 px-2 border-r border-border/50" data-ai-id="admin-header-query-monitor-toggle">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild side="bottom">
                <div className="flex items-center gap-2 cursor-help">
                  <Activity className={cn(
                    "h-4 w-4 transition-colors",
                    queryMonitorEnabled ? "text-primary animate-pulse" : "text-muted-foreground"
                  )} />
                  <Label htmlFor="query-monitor-toggle" className="text-xs font-medium cursor-pointer hidden md:inline-block">
                    Monitor
                  </Label>
                  <Switch
                    id="query-monitor-toggle"
                    checked={queryMonitorEnabled}
                    onCheckedChange={onQueryMonitorToggle}
                    data-ai-id="query-monitor-toggle-switch"
                    className="scale-75"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">
                  {queryMonitorEnabled ? 'Desativar' : 'Ativar'} Monitor de Queries (Debug)
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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