// src/contexts/auth-context.tsx
'use client';

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { getCurrentUser, logout as logoutAction } from '@/app/auth/actions';
import { getAdminUserForDev } from '@/app/admin/users/actions'; // Importar a nova função
import type { UserProfileWithPermissions } from '@/types';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  userProfileWithPermissions: UserProfileWithPermissions | null;
  loading: boolean;
  setUserProfileWithPermissions: Dispatch<SetStateAction<UserProfileWithPermissions | null>>;
  logout: () => void;
  refetchUser: () => void;
  loginUser: (user: UserProfileWithPermissions) => void; // Nova função
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userProfileWithPermissions, setUserProfileWithPermissions] = useState<UserProfileWithPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      // ========== MODIFICAÇÃO PARA DESENVOLVIMENTO ==========
      if (process.env.NODE_ENV === 'development') {
        console.log("[DEV MODE] Attempting to auto-login admin user...");
        const adminUser = await getAdminUserForDev();
        if (adminUser) {
          setUserProfileWithPermissions(adminUser);
          console.log("[DEV MODE] Admin user auto-logged in.");
        } else {
          console.warn("[DEV MODE] Admin user not found for auto-login. Falling back to session.");
          const user = await getCurrentUser();
          setUserProfileWithPermissions(user);
        }
      } else {
        const user = await getCurrentUser();
        setUserProfileWithPermissions(user);
      }
      // =======================================================
    } catch (error) {
      console.error("Failed to fetch user session:", error);
      setUserProfileWithPermissions(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = async () => {
    try {
        await logoutAction();
        setUserProfileWithPermissions(null);
        toast({ title: "Logout realizado com sucesso." });
        window.location.href = '/auth/login';
    } catch (error) {
        console.error("Logout error", error);
        toast({ title: "Erro ao fazer logout.", variant: 'destructive'});
    }
  };
  
  // Função para definir o usuário no estado do contexto após o login
  const loginUser = (user: UserProfileWithPermissions) => {
    setUserProfileWithPermissions(user);
  };

  if (loading) {
     return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Loader2 className="h-10 w-10 animate-spin text-primary"/>
            <p className="ml-3 text-muted-foreground">Carregando sessão...</p>
        </div>
      );
  }

  return (
    <AuthContext.Provider value={{
      userProfileWithPermissions,
      loading,
      setUserProfileWithPermissions,
      logout,
      refetchUser: fetchUser,
      loginUser, // Expor a nova função
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
