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
        if(isClient) {
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
    
    const showAdminSectionLinks = hasPermission(userProfileWithPermissions, 'manage_all');
    const canSeeConsignorDashboardLink = showAdminSectionLinks || hasAnyPermission(userProfileWithPermissions, ['auctions:manage_own', 'lots:manage_own', 'consignor_dashboard:view']);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} data-ai-hint="profile avatar small" />}
              <AvatarFallback>{userInitial}</AvatarFallback>
            </Avatar>
             {unreadNotificationsCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs">
                    {unreadNotificationsCount}
                </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/overview" className="flex items-center">
              <LayoutDashboard className="mr-2 h-4 w-4" /> Visão Geral
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile/edit" className="flex items-center">
             <UserCircle2 className="mr-2 h-4 w-4" /> Meu Perfil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/bids" className="flex items-center">
             <Gavel className="mr-2 h-4 w-4" /> Meus Lances
            </Link>
          </DropdownMenuItem>
           <DropdownMenuItem asChild>
            <Link href="/dashboard/wins" className="flex items-center">
             <ShoppingBag className="mr-2 h-4 w-4" /> Meus Arremates
            </Link>
          </DropdownMenuItem>
           <DropdownMenuItem asChild>
            <Link href="/dashboard/favorites" className="flex items-center">
             <Heart className="mr-2 h-4 w-4" /> Lotes Favoritos
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/documents" className="flex items-center">
             <FileText className="mr-2 h-4 w-4" /> Meus Documentos
            </Link>
          </DropdownMenuItem>
           <DropdownMenuItem asChild>
            <Link href="/dashboard/history" className="flex items-center">
             <History className="mr-2 h-4 w-4" /> Histórico de Navegação
            </Link>
          </DropdownMenuItem>
          
          {canSeeConsignorDashboardLink && (
             <>
              <DropdownMenuSeparator />
               <DropdownMenuItem asChild>
                <Link href="/consignor-dashboard/overview" className="flex items-center">
                  <ConsignorIcon className="mr-2 h-4 w-4" /> Painel do Comitente
                </Link>
              </DropdownMenuItem>
             </>
          )}

          {showAdminSectionLinks && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground px-2">Administração</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/admin/dashboard" className="flex items-center">
                  <ShieldCheck className="mr-2 h-4 w-4" /> Painel Admin
                </Link>
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <TooltipProvider>
        <div className="flex items-center space-x-1">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button asChild variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                        <Link href="/auth/login" aria-label="Login">
                            <LogIn className="h-4 w-4 sm:h-5 sm:w-5" />
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
                     <Button asChild variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                        <Link href="/auth/register" aria-label="Registrar">
                            <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
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
