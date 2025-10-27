// src/contexts/auth-context.tsx
'use client';

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { logout as logoutAction, getCurrentUser } from '@/app/auth/actions';
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
}: { 
  children: ReactNode,
}) {
  const [userProfileWithPermissions, setUserProfileWithPermissions] = useState<UserProfileWithPermissions | null>(null);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
     if (userProfileWithPermissions?.id) {
       const user = await getCurrentUser();
       setUserProfileWithPermissions(user); // Re-fetch and update user
       if (user) {
         await fetchUnreadCount(user.id);
       }
     } else {
        router.refresh(); // Fallback to full refresh if no user context
     }
  }, [router, userProfileWithPermissions?.id, fetchUnreadCount]);
  
  const loginUser = useCallback((user: UserProfileWithPermissions, tenantId: string) => {
    setUserProfileWithPermissions(user);
    setActiveTenantId(tenantId);
    fetchUnreadCount(user.id);
  }, [fetchUnreadCount]);

  useEffect(() => {
    async function checkSession() {
      setLoading(true);
      try {
        const user = await getCurrentUser();
        if (user) {
          setUserProfileWithPermissions(user);
          if (user.tenants && user.tenants.length > 0) {
            setActiveTenantId(user.tenants[0].id || '1');
          }
        }
      } catch (e) {
        console.error("Session check failed:", e);
        setUserProfileWithPermissions(null);
        setActiveTenantId(null);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);


  useEffect(() => {
    if (userProfileWithPermissions?.id) {
      fetchUnreadCount(userProfileWithPermissions.id);
    }
    
    const handleStorageChange = () => {
      if (userProfileWithPermissions?.id) {
        fetchUnreadCount(userProfileWithPermissions.id);
      }
    };
    window.addEventListener('notifications-updated', handleStorageChange);
    return () => {
      window.removeEventListener('notifications-updated', handleStorageChange);
    };

  }, [userProfileWithPermissions?.id, fetchUnreadCount]);

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
