
'use client';

import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import type { ReactNode, Dispatch, SetStateAction} from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase'; 
import { Loader2 } from 'lucide-react';
import { ensureUserProfileInDb } from '@/app/admin/users/actions';
import type { UserProfileData, UserProfileWithPermissions } from '@/types';

interface AuthContextType {
  user: User | null; // Firebase Auth user
  userProfileWithPermissions: UserProfileWithPermissions | null; // User profile from our DB
  loading: boolean; 
  setUser: Dispatch<SetStateAction<User | null>>; // To set Firebase Auth user
  setUserProfileWithPermissions: Dispatch<SetStateAction<UserProfileWithPermissions | null>>; // To set our DB profile
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfileWithPermissions, setUserProfileWithPermissions] = useState<UserProfileWithPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const activeSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM?.toUpperCase() || 'FIRESTORE';
    console.log(`[AuthProvider UseEffect] Running for system: ${activeSystem}. Current Firebase user: ${user?.email}, SQL profile: ${userProfileWithPermissions?.email}`);
    
    let unsubscribe: (() => void) | undefined;

    if (activeSystem === 'FIRESTORE') {
      console.log("[AuthProvider UseEffect] Firestore mode: Setting up onAuthStateChanged listener.");
      unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setLoading(true); 
        console.log(`[AuthProvider onAuthStateChanged] Firebase Auth state changed. currentUser: ${currentUser?.email}`);
        setUser(currentUser);
        setUserProfileWithPermissions(null); // Clear previous profile on auth change

        if (currentUser && currentUser.email) {
          console.log(`[AuthProvider onAuthStateChanged] Usuário Firebase ${currentUser.email} detectado. Processando perfil DB...`);
          try {
            const targetRoleForNewUsers = 'USER'; 
            const profileResult = await ensureUserProfileInDb(
              currentUser.uid, 
              currentUser.email, 
              currentUser.displayName || currentUser.email.split('@')[0], 
              targetRoleForNewUsers 
            );

            if (profileResult.success && profileResult.userProfile) {
              console.log(`[AuthProvider onAuthStateChanged] ensureUserProfileInDb SUCESSO para ${currentUser.email}. Perfil:`, JSON.stringify(profileResult.userProfile));
              setUserProfileWithPermissions({
                ...profileResult.userProfile,
                createdAt: profileResult.userProfile.createdAt ? new Date(profileResult.userProfile.createdAt) : undefined,
                updatedAt: profileResult.userProfile.updatedAt ? new Date(profileResult.userProfile.updatedAt) : undefined,
                dateOfBirth: profileResult.userProfile.dateOfBirth ? new Date(profileResult.userProfile.dateOfBirth) : undefined,
                rgIssueDate: profileResult.userProfile.rgIssueDate ? new Date(profileResult.userProfile.rgIssueDate) : undefined,
              } as UserProfileWithPermissions); 
            } else {
              console.error(`[AuthProvider onAuthStateChanged] Falha ao executar ensureUserProfileInDb para ${currentUser.email}: ${profileResult?.message || 'Resultado indefinido.'}`);
              setUserProfileWithPermissions(null); 
            }
          } catch (error) {
            console.error(`[AuthProvider onAuthStateChanged] Erro ao chamar ensureUserProfileInDb para ${currentUser.email}:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
            setUserProfileWithPermissions(null); 
          }
        } else {
          console.log("[AuthProvider onAuthStateChanged] Nenhum usuário Firebase logado ou sem e-mail.");
          setUser(null); // Explicitly set Firebase user to null
          setUserProfileWithPermissions(null); // Clear our DB profile too
        }
        setLoading(false);
      });
    } else {
      // SQL Mode: Auth state is managed primarily by `userProfileWithPermissions`
      // No onAuthStateChanged listener needed for Firebase.
      // We only set loading to false once.
      if (loading) { // Only run this logic once at the start for SQL mode
        console.log("[AuthProvider UseEffect] SQL mode: Initial load. Setting loading to false.");
        // User is initially considered not logged in for SQL until login page sets userProfileWithPermissions.
        // If userProfileWithPermissions is somehow pre-filled (e.g. by fast refresh), it will be used.
        // If Firebase user exists from a previous session (unlikely with this structure), clear it.
        if (user) {
            console.log("[AuthProvider UseEffect] SQL mode: Clearing residual Firebase user state.");
            setUser(null);
        }
        setLoading(false);
      }
    }

    return () => {
      if (unsubscribe) {
        console.log("[AuthProvider UseEffect Cleanup] Unsubscribing from Firebase onAuthStateChanged.");
        unsubscribe();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array: run once on mount

  // This effect handles clearing userProfileWithPermissions when Firebase user is null (e.g. Firebase logout)
  // but only if we are in FIRESTORE mode or if userProfileWithPermissions was set (SQL mode logout)
  useEffect(() => {
    const activeSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM?.toUpperCase() || 'FIRESTORE';
    if (activeSystem === 'FIRESTORE' && !user && userProfileWithPermissions) {
      console.log("[AuthProvider SecondaryEffect] Firebase user is null and profile exists (FIRESTORE mode logout). Clearing profile.");
      setUserProfileWithPermissions(null);
    }
    // For SQL mode, logout is handled by explicitly setting userProfileWithPermissions to null in UserNav
  }, [user, userProfileWithPermissions]);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2">Carregando sessão...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, userProfileWithPermissions, loading, setUser, setUserProfileWithPermissions }}>
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
