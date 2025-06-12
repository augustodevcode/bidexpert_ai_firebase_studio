
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle2, LogIn, UserPlus, LogOut, LayoutDashboard, Settings, Heart, Gavel, ShoppingBag, FileText, History, BarChart, Bell, ListChecks, Tv, Briefcase as ConsignorIcon, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { auth } from '@/lib/firebase'; // Ainda necessário para logout do Firebase
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { hasPermission, hasAnyPermission } from '@/lib/permissions'; // Importar as funções de permissão

// Email do comitente de exemplo (para simular o próprio comitente acessando)
const EXAMPLE_CONSIGNOR_EMAIL = 'consignor@bidexpert.com';

export default function UserNav() {
  const { user, userProfileWithPermissions, loading, logoutSqlUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [activeSystem, setActiveSystem] = useState('FIRESTORE'); // Default
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const system = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM?.toUpperCase() || 'FIRESTORE';
    setActiveSystem(system);
    console.log('[UserNav] Active DB System (client-side):', system);
  }, []);

  const handleLogout = async () => {
    if (activeSystem === 'FIRESTORE') {
      try {
        await signOut(auth);
        toast({ title: "Logout bem-sucedido!"});
        // O AuthProvider cuidará de limpar userProfileWithPermissions
        router.push('/');
      } catch (error: any) {
        toast({ title: "Erro no Logout", description: error.message, variant: "destructive" });
      }
    } else {
      // Para SQL (MYSQL, POSTGRES)
      logoutSqlUser(); // Chama a função do AuthContext
      toast({ title: `Logout bem-sucedido (${activeSystem})!`});
      // O redirecionamento é tratado dentro de logoutSqlUser
    }
  };

  if (loading || !isClient) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-10 w-10 bg-muted rounded-full animate-pulse"></div>
        <div className="h-6 w-20 bg-muted rounded-md animate-pulse"></div>
      </div>
    );
  }

  const isLoggedIn = activeSystem === 'FIRESTORE' ? !!user : !!userProfileWithPermissions;
  
  let displayName = "Usuário";
  let userEmailDisplay = "";
  let photoURLDisplay: string | undefined = undefined;

  if (activeSystem === 'FIRESTORE' && user) {
    displayName = user.displayName || user.email?.split('@')[0] || "Usuário";
    userEmailDisplay = user.email || "";
    photoURLDisplay = user.photoURL || undefined;
  } else if (activeSystem !== 'FIRESTORE' && userProfileWithPermissions) {
    displayName = userProfileWithPermissions.fullName || userProfileWithPermissions.email?.split('@')[0] || "Usuário";
    userEmailDisplay = userProfileWithPermissions.email || "";
    photoURLDisplay = userProfileWithPermissions.avatarUrl || undefined; 
  }
  
  const userInitial = displayName ? displayName.charAt(0).toUpperCase() : "U";
  const userEmailLowerForRoles = activeSystem === 'FIRESTORE' ? user?.email?.toLowerCase() : userProfileWithPermissions?.email?.toLowerCase();

  // Verifica se o usuário tem a permissão 'manage_all'
  const showAdminSectionLinks = hasPermission(userProfileWithPermissions, 'manage_all');
  
  // Lógica para o painel do comitente - pode ser baseada no email de exemplo OU em uma permissão específica.
  // Se for baseada em permissão, algo como: hasAnyPermission(userProfileWithPermissions, ['auctions:manage_own', 'lots:manage_own'])
  const isTheExampleConsignor = userEmailLowerForRoles === EXAMPLE_CONSIGNOR_EMAIL.toLowerCase();
  const canSeeConsignorDashboardLink = showAdminSectionLinks || isTheExampleConsignor || hasAnyPermission(userProfileWithPermissions, ['auctions:manage_own', 'lots:manage_own']);


  if (isLoggedIn) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              {photoURLDisplay && <AvatarImage src={photoURLDisplay} alt={displayName} data-ai-hint="profile avatar small" />}
              <AvatarFallback>{userInitial}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {userEmailDisplay}
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
            <Link href="/profile" className="flex items-center">
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
          <DropdownMenuItem asChild>
            <Link href="/dashboard/reports" className="flex items-center">
             <BarChart className="mr-2 h-4 w-4" /> Relatórios
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/notifications" className="flex items-center">
             <Bell className="mr-2 h-4 w-4" /> Notificações
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
              <DropdownMenuItem asChild>
                <Link href="/admin/categories" className="flex items-center">
                  <ListChecks className="mr-2 h-4 w-4" /> Gerenciar Categorias
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/live-dashboard" className="flex items-center">
                  <Tv className="mr-2 h-4 w-4" /> Auditório Virtual
                </Link>
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button variant="default" size="icon" asChild>
            <Link href="/auth/login">
              <LogIn className="h-4 w-4" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Login
        </TooltipContent>
      </Tooltip>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button size="icon" asChild>
            <Link href="/auth/register">
              <UserPlus className="h-4 w-4" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Registrar
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
