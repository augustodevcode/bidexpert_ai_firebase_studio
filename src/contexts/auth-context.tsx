// src/contexts/auth-context.tsx
'use client';

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { logout as logoutAction, getCurrentUser, login } from '@/app/auth/actions';
import type { UserProfileWithPermissions } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { getUnreadNotificationCountAction } from '@/app/dashboard/notifications/actions';

interface AuthContextType {
  userProfileWithPermissions: UserProfileWithPermissions | null;
  activeTenantId: string | null;
  loading: boolean;
  unreadNotificationsCount: number;
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
  const [loading, setLoading] = useState(true); // Start as true
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const router = useRouter();
  const { toast } = useToast();

  const fetchUnreadCount = useCallback(async (userId: string) => {
    try {
        const count = await getUnreadNotificationCountAction(userId);
        setUnreadNotificationsCount(count);
    } catch (e) {
        console.error("Failed to fetch notification count:", e);
        setUnreadNotificationsCount(0);
    }
  }, []);

  const refetchUser = useCallback(async () => {
     router.refresh();
     if (userProfileWithPermissions?.id) {
       await fetchUnreadCount(userProfileWithPermissions.id);
     }
  }, [router, userProfileWithPermissions?.id, fetchUnreadCount]);
  
  const loginUser = useCallback((user: UserProfileWithPermissions, tenantId: string) => {
    setUserProfileWithPermissions(user);
    setActiveTenantId(tenantId);
    fetchUnreadCount(user.id);
  }, [fetchUnreadCount]);

  useEffect(() => {
    // If user data is passed from the server (RootLayout), use it and stop loading.
    if (initialUser) {
        console.log("[AuthContext] Hydrating with initial user from server.");
        setUserProfileWithPermissions(initialUser);
        setActiveTenantId(initialTenantId);
        fetchUnreadCount(initialUser.id);
        setLoading(false);
        return;
    }

    // If no initial user, proceed with client-side session check.
    async function checkUserSession() {
      console.log("[AuthContext] No initial user. Checking session on client...");
      try {
        const user = await getCurrentUser();
        if (user) {
          console.log("[AuthContext] User found in session. Setting context.");
          // @ts-ignore
          const tenantId = user.tenants?.[0]?.id || '1';
          loginUser(user, tenantId);
        } else {
            console.log("[AuthContext] No user found in session.");
        }
      } catch (error) {
        console.error('[AuthContext] Error checking user session:', error);
      } finally {
        setLoading(false);
      }
    }
    
    checkUserSession();
    
    // Listener for notification updates
    const handleStorageChange = () => {
      if (userProfileWithPermissions?.id) {
        fetchUnreadCount(userProfileWithPermissions.id);
      }
    };
    window.addEventListener('notifications-updated', handleStorageChange);
    return () => {
      window.removeEventListener('notifications-updated', handleStorageChange);
    };

  }, [initialUser, initialTenantId, loginUser, fetchUnreadCount, userProfileWithPermissions?.id]);

  const logout = async () => {
    try {
        await logoutAction();
        setUserProfileWithPermissions(null);
        setActiveTenantId(null);
        setUnreadNotificationsCount(0);
        toast({ title: "Logout realizado com sucesso." });
        window.location.href = '/auth/login';
    } catch (error) {
        console.error("Logout error", error);
        toast({ title: "Erro ao fazer logout.", variant: 'destructive'});
    }
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
      activeTenantId,
      loading,
      unreadNotificationsCount,
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
