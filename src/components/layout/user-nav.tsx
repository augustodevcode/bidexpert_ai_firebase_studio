// src/components/layout/user-nav.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle2, LogIn, UserPlus, LogOut, LayoutDashboard, Settings, Heart, Gavel, ShoppingBag, FileText, History, BarChart, Bell, ListChecks, Tv, Briefcase as ConsignorIcon, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useCallback } from 'react';
import { hasPermission, hasAnyPermission } from '@/lib/permissions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from '../ui/skeleton';
import { getUnreadNotificationCountAction } from '@/app/dashboard/notifications/actions';
import { Badge } from '../ui/badge';


export default function UserNav() {
  const { userProfileWithPermissions, loading, logout } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const updateUnreadCount = useCallback(async () => {
    if (userProfileWithPermissions?.id) {
      try {
        const count = await getUnreadNotificationCountAction(userProfileWithPermissions.id);
        setUnreadNotificationsCount(count);
      } catch (error) {
        console.error("Failed to fetch notification count:", error);
        setUnreadNotificationsCount(0);
      }
    } else {
      setUnreadNotificationsCount(0);
    }
  }, [userProfileWithPermissions?.id]);

  useEffect(() => {
    if (isClient) {
      updateUnreadCount();
      window.addEventListener('notifications-updated', updateUnreadCount);
    }
    return () => {
      if (isClient) {
        window.removeEventListener('notifications-updated', updateUnreadCount);
      }
    };
  }, [isClient, updateUnreadCount]);


  if (!isClient || loading) {
    return <Skeleton className="h-10 w-10 rounded-full" />;
  }

  if (userProfileWithPermissions) {
    const { fullName, email, avatarUrl, roleName } = userProfileWithPermissions;
    const displayName = fullName || email?.split('@')[0] || "Usuário";
    const userInitial = displayName ? displayName.charAt(0).toUpperCase() : "U";

    const showAdminSectionLinks = hasPermission(userProfileWithPermissions, 'manage_all') || userProfileWithPermissions.roleNames?.includes('AUCTION_ANALYST');
    const canSeeConsignorDashboardLink = showAdminSectionLinks || hasAnyPermission(userProfileWithPermissions, ['auctions:manage_own', 'lots:manage_own', 'consignor_dashboard:view']);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="btn-user-profile-trigger" data-ai-id="user-nav-trigger">
            <Avatar className="avatar-user-nav" data-ai-id="user-nav-avatar">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} data-ai-hint="profile avatar small" />}
              <AvatarFallback>{userInitial}</AvatarFallback>
            </Avatar>
            {unreadNotificationsCount > 0 && (
              <Badge variant="destructive" className="badge-notification-count" data-ai-id="user-nav-notification-badge">
                {unreadNotificationsCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="menu-user-profile-content" align="end" forceMount data-ai-id="user-nav-dropdown">
          <DropdownMenuLabel className="header-user-profile-info" data-ai-id="user-nav-header">
            <div className="wrapper-user-info-text">
              <p className="text-user-display-name">{displayName}</p>
              <p className="text-user-email">
                {email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild data-ai-id="user-nav-item-overview">
            <Link href="/dashboard/overview" className="link-menu-user">
              <LayoutDashboard className="icon-menu-user" /> Visão Geral
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild data-ai-id="user-nav-item-profile">
            <Link href="/dashboard/profile/edit" className="link-menu-user">
              <UserCircle2 className="icon-menu-user" /> Meu Perfil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild data-ai-id="user-nav-item-bids">
            <Link href="/dashboard/bids" className="link-menu-user">
              <Gavel className="icon-menu-user" /> Meus Lances
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild data-ai-id="user-nav-item-wins">
            <Link href="/dashboard/wins" className="link-menu-user">
              <ShoppingBag className="icon-menu-user" /> Meus Arremates
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild data-ai-id="user-nav-item-favorites">
            <Link href="/dashboard/favorites" className="link-menu-user">
              <Heart className="icon-menu-user" /> Lotes Favoritos
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild data-ai-id="user-nav-item-documents">
            <Link href="/dashboard/documents" className="link-menu-user">
              <FileText className="icon-menu-user" /> Meus Documentos
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild data-ai-id="user-nav-item-history">
            <Link href="/dashboard/history" className="link-menu-user">
              <History className="icon-menu-user" /> Histórico de Navegação
            </Link>
          </DropdownMenuItem>

          {canSeeConsignorDashboardLink && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild data-ai-id="user-nav-item-consignor">
                <Link href="/consignor-dashboard/overview" className="link-menu-user">
                  <ConsignorIcon className="icon-menu-user" /> Painel do Comitente
                </Link>
              </DropdownMenuItem>
            </>
          )}

          {showAdminSectionLinks && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="header-admin-section" data-ai-id="user-nav-admin-header">Administração</DropdownMenuLabel>
              <DropdownMenuItem asChild data-ai-id="user-nav-item-admin">
                <Link href="/admin/dashboard" className="link-menu-user">
                  <ShieldCheck className="icon-menu-user" /> Painel Admin
                </Link>
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} data-ai-id="user-nav-item-logout">
            <LogOut className="icon-menu-user" /> Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <TooltipProvider>
      <div className="wrapper-auth-buttons" data-ai-id="user-nav-auth-section">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="ghost" size="icon" className="btn-auth-action" data-ai-id="user-nav-login-btn">
              <Link href="/auth/login" aria-label="Login" data-testid="login-link">
                <LogIn className="icon-auth-action" />
                <span className="sr-only">Login</span>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Fazer Login</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="ghost" size="icon" className="btn-auth-action" data-ai-id="user-nav-register-btn">
              <Link href="/auth/register" aria-label="Registrar">
                <UserPlus className="icon-auth-action" />
                <span className="sr-only">Registrar</span>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Registrar-se</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
