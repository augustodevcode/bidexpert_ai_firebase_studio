// src/contexts/auth-context.tsx
'use client';

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { logout as logoutAction } from '@/app/auth/actions';
import type { UserProfileWithPermissions } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  userProfileWithPermissions: UserProfileWithPermissions | null;
  activeTenantId: string | null;
  loading: boolean;
  setUserProfileWithPermissions: Dispatch<SetStateAction<UserProfileWithPermissions | null>>;
  setActiveTenantId: Dispatch<SetStateAction<string | null>>;
  logout: () => void;
  refetchUser: () => void;
  loginUser: (user: UserProfileWithPermissions, tenantId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ 
  children,
  initialUser,
  initialTenantId
}: { 
  children: ReactNode,
  initialUser: UserProfileWithPermissions | null,
  initialTenantId: string | null
}) {
  const [userProfileWithPermissions, setUserProfileWithPermissions] = useState<UserProfileWithPermissions | null>(initialUser);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(initialTenantId);
  
  // Otimização: O estado de 'loading' agora depende se os dados iniciais já existem.
  // Se 'initialUser' é fornecido, não estamos "carregando" nada no cliente.
  const [loading, setLoading] = useState(!initialUser); 
  const router = useRouter();
  const { toast } = useToast();
  
  useEffect(() => {
    // Se o usuário inicial for fornecido, apenas garantimos que `loading` seja false.
    if (initialUser) {
      setLoading(false);
    }
  }, [initialUser]);

  const refetchUser = useCallback(async () => {
     // Apenas recarregar a página fará o RootLayout buscar os dados mais recentes.
     router.refresh();
  }, [router]);

  const logout = async () => {
    try {
        await logoutAction();
        setUserProfileWithPermissions(null);
        setActiveTenantId(null);
        toast({ title: "Logout realizado com sucesso." });
        window.location.href = '/auth/login';
    } catch (error) {
        console.error("Logout error", error);
        toast({ title: "Erro ao fazer logout.", variant: 'destructive'});
    }
  };
  
  const loginUser = (user: UserProfileWithPermissions, tenantId: string) => {
    setUserProfileWithPermissions(user);
    setActiveTenantId(tenantId);
  };
  
  if (loading && typeof window !== 'undefined') {
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
      activeTenantId,
      loading,
      setUserProfileWithPermissions,
      setActiveTenantId,
      logout,
      refetchUser,
      loginUser,
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
