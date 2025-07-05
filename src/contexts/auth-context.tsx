
'use client';

import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import type { ReactNode, Dispatch, SetStateAction} from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase'; 
import { Loader2 } from 'lucide-react';
import { ensureUserProfileInDb } from '@/app/admin/users/actions';
import type { UserProfileData, UserProfileWithPermissions } from '@/types';
import { useRouter } from 'next/navigation'; 

interface AuthContextType {
  user: User | null; 
  userProfileWithPermissions: UserProfileWithPermissions | null; 
  loading: boolean; 
  setUser: Dispatch<SetStateAction<User | null>>; 
  setUserProfileWithPermissions: Dispatch<SetStateAction<UserProfileWithPermissions | null>>; 
  logoutSqlUser: () => void; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfileWithPermissions, _setUserProfileWithPermissions] = useState<UserProfileWithPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); 

  const activeSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM?.toUpperCase() || 'FIRESTORE';

  const setUserProfileWithPermissions = (profile: SetStateAction<UserProfileWithPermissions | null>) => {
    _setUserProfileWithPermissions(profile);
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    if (activeSystem === 'FIRESTORE') {
      console.log("[AuthProvider UseEffect] Firestore mode: Setting up onAuthStateChanged listener.");
      unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        console.log(`[AuthProvider onAuthStateChanged] Firebase Auth state changed. currentUser: ${currentUser?.email}`);
        setUser(currentUser);
        
        if (userProfileWithPermissions && !currentUser) {
             console.log("[AuthProvider onAuthStateChanged] Firebase user became null, but SQL profile existed. Clearing SQL profile.");
             setUserProfileWithPermissions(null); 
        }

        if (currentUser && currentUser.email) {
          try {
            const targetRoleForNewUsers = 'USER'; 
            const profileResult = await ensureUserProfileInDb(
              currentUser.uid, 
              currentUser.email, 
              currentUser.displayName || currentUser.email.split('@')[0], 
              targetRoleForNewUsers 
            );

            if (profileResult.success && profileResult.userProfile) {
              setUserProfileWithPermissions(profileResult.userProfile as UserProfileWithPermissions);
            } else {
              console.error(`[AuthProvider onAuthStateChanged] Falha ao executar ensureUserProfileInDb para ${currentUser.email}: ${profileResult?.message || 'Resultado indefinido.'}`);
              setUserProfileWithPermissions(null); 
            }
          } catch (error) {
            console.error(`[AuthProvider onAuthStateChanged] Erro ao chamar ensureUserProfileInDb para ${currentUser.email}:`, error);
            setUserProfileWithPermissions(null); 
          }
        } else {
          setUser(null); 
          setUserProfileWithPermissions(null); 
        }
        setLoading(false);
      });
    } else { // SQL or Sample Data mode
      console.log(`[AuthProvider UseEffect] Mode: ${activeSystem}. Checking for localStorage profile.`);
      try {
        const storedProfile = localStorage.getItem('userProfile');
        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          console.log('[AuthProvider UseEffect] Profile found in localStorage, setting context state.');
          setUserProfileWithPermissions(profile);
        } else {
          console.log('[AuthProvider UseEffect] No profile found in localStorage.');
        }
      } catch (e) {
        console.error("Failed to parse user profile from localStorage", e);
        localStorage.removeItem('userProfile');
      }
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        console.log("[AuthProvider UseEffect Cleanup] Unsubscribing from Firebase onAuthStateChanged.");
        unsubscribe();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSystem]); 

  const logoutSqlUser = () => {
    console.log("[AuthProvider logoutSqlUser] Logging out SQL user.");
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userProfile');
    }
    setUser(null);
    setUserProfileWithPermissions(null);
    router.push('/'); 
  };
  
  // This is the fix: Always render the provider and children.
  // The consuming components will use the `loading` state to show their own loaders.
  return (
    <AuthContext.Provider value={{ user, userProfileWithPermissions, loading, setUser, setUserProfileWithPermissions, logoutSqlUser }}>
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
