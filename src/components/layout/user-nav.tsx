
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
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle2, LogIn, UserPlus, LogOut, LayoutDashboard, Settings, Heart, Gavel, ShoppingBag, FileText, History, BarChart, Bell, ListChecks } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

// TODO: Replace this with actual role fetching and checking from Firestore via useAuth context
const ALLOWED_EMAILS_FOR_ADMIN_LINKS = ['admin@bidexpert.com', 'analyst@bidexpert.com', 'augusto.devcode@gmail.com'];

export default function UserNav() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logout bem-sucedido!"});
      router.push('/');
    } catch (error: any) {
      toast({ title: "Erro no Logout", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    // Pode mostrar um skeleton ou spinner aqui se preferir
    return (
      <div className="flex items-center space-x-2">
        <div className="h-10 w-20 bg-muted rounded-md animate-pulse"></div>
        <div className="h-10 w-24 bg-muted rounded-md animate-pulse"></div>
      </div>
    );
  }

  if (user) {
    const userDisplayName = user.displayName || user.email?.split('@')[0] || "Usuário";
    const userInitial = userDisplayName ? userDisplayName.charAt(0).toUpperCase() : "U";
    
    // Placeholder for admin/analyst check (case-insensitive)
    const userEmailLower = user.email?.toLowerCase();
    const showAdminLinks = userEmailLower && ALLOWED_EMAILS_FOR_ADMIN_LINKS.map(e => e.toLowerCase()).includes(userEmailLower);


    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              {user.photoURL && <AvatarImage src={user.photoURL} alt={userDisplayName} data-ai-hint="profile avatar small" />}
              <AvatarFallback>{userInitial}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userDisplayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
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
          
          {showAdminLinks && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground px-2">Administração</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/admin/dashboard" className="flex items-center">
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Painel Admin
                </Link>
              </DropdownMenuItem>
               <DropdownMenuItem asChild>
                <Link href="/admin/categories" className="flex items-center">
                  <ListChecks className="mr-2 h-4 w-4" /> Gerenciar Categorias
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
      <Button variant="outline" size="sm" asChild>
        <Link href="/auth/login" className="flex items-center gap-1">
          <LogIn className="h-4 w-4" /> Login
        </Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/auth/register" className="flex items-center gap-1">
          <UserPlus className="h-4 w-4" /> Registrar
        </Link>
      </Button>
    </div>
  );
}
