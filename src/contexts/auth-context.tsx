
'use client';

import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import type { ReactNode, Dispatch, SetStateAction} from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase'; 
import { Loader2 } from 'lucide-react';
import { getOrCreateUserFromFirebaseAuth } from '@/app/admin/users/actions';
import type { UserProfileWithPermissions } from '@/types';
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
    
    // This logic now correctly handles both Firebase and "SQL" (Prisma) backends,
    // where Firebase Auth is always the source of truth for authentication.
    console.log("[AuthProvider UseEffect] Setting up onAuthStateChanged listener.");
    unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log(`[AuthProvider onAuthStateChanged] Firebase Auth state changed. currentUser: ${currentUser?.email}`);
      setUser(currentUser);
      
      if (!currentUser) {
        // User is logged out
        setUserProfileWithPermissions(null);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('userProfile');
        }
        setLoading(false);
      } else {
        // User is logged in, get or create their profile in our DB
        try {
          const profile = await getOrCreateUserFromFirebaseAuth(
            currentUser.uid,
            currentUser.email!,
            currentUser.displayName || currentUser.email!.split('@')[0],
            currentUser.photoURL
          );

          if (profile) {
            setUserProfileWithPermissions(profile);
            if (typeof window !== 'undefined') {
                localStorage.setItem('userProfile', JSON.stringify(profile));
            }
          } else {
            console.error(`[AuthProvider onAuthStateChanged] Failed to get or create user profile for ${currentUser.email}`);
            setUserProfileWithPermissions(null); 
          }
        } catch (error) {
          console.error(`[AuthProvider onAuthStateChanged] Error calling getOrCreateUserFromFirebaseAuth for ${currentUser.email}:`, error);
          setUserProfileWithPermissions(null);
        } finally {
          setLoading(false);
        }
      }
    });

    return () => {
      if (unsubscribe) {
        console.log("[AuthProvider UseEffect Cleanup] Unsubscribing from Firebase onAuthStateChanged.");
        unsubscribe();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const logoutSqlUser = async () => {
    console.log("[AuthProvider] Logging out user.");
    await signOut(auth); // This will trigger onAuthStateChanged to clear state
    setUser(null);
    setUserProfileWithPermissions(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userProfile');
    }
    router.push('/'); 
  };
  
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
