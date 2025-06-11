
'use client';

import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import type { ReactNode, Dispatch, SetStateAction} from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase'; 
import { Loader2 } from 'lucide-react';
import { ensureUserProfileInDb } from '@/app/admin/users/actions';
import type { UserProfileData, UserProfileWithPermissions } from '@/types';
import { useRouter } from 'next/navigation'; // Importar useRouter

interface AuthContextType {
  user: User | null; // Firebase Auth user
  userProfileWithPermissions: UserProfileWithPermissions | null; // User profile from our DB
  loading: boolean; 
  setUser: Dispatch<SetStateAction<User | null>>; // To set Firebase Auth user
  setUserProfileWithPermissions: Dispatch<SetStateAction<UserProfileWithPermissions | null>>; // To set our DB profile
  logoutSqlUser: () => void; // Função para logout em modo SQL
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfileWithPermissions, setUserProfileWithPermissions] = useState<UserProfileWithPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // Instanciar useRouter

  const activeSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM?.toUpperCase() || 'FIRESTORE';
  console.log(`[AuthProvider] Initializing with ACTIVE_DATABASE_SYSTEM (client-side): ${activeSystem}`);


  useEffect(() => {
    console.log(`[AuthProvider UseEffect] Running for system: ${activeSystem}. Current Firebase user: ${user?.email}, SQL profile: ${userProfileWithPermissions?.email}`);
    
    let unsubscribe: (() => void) | undefined;

    if (activeSystem === 'FIRESTORE') {
      console.log("[AuthProvider UseEffect] Firestore mode: Setting up onAuthStateChanged listener.");
      unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        // setLoading(true); // Movido para fora para cobrir o estado inicial
        console.log(`[AuthProvider onAuthStateChanged] Firebase Auth state changed. currentUser: ${currentUser?.email}`);
        setUser(currentUser);
        
        if (userProfileWithPermissions && !currentUser) {
             console.log("[AuthProvider onAuthStateChanged] Firebase user became null, but SQL profile existed. Clearing SQL profile.");
             setUserProfileWithPermissions(null); // Clear SQL profile if Firebase logs out
        }


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
          setUser(null); 
          setUserProfileWithPermissions(null); 
        }
        setLoading(false); // Moved here to ensure it's set after all async operations.
      });
    } else {
      // SQL Mode or other modes
      console.log(`[AuthProvider UseEffect] Mode: ${activeSystem}. Setting initial state, no Firebase listener.`);
      setUser(null); // No Firebase user in SQL mode
      // userProfileWithPermissions is managed by login page for SQL
      // setLoading(false) happens once at the end of this useEffect block
      setLoading(false); // Set loading false immediately for non-Firestore modes
    }

    return () => {
      if (unsubscribe) {
        console.log("[AuthProvider UseEffect Cleanup] Unsubscribing from Firebase onAuthStateChanged.");
        unsubscribe();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSystem]); // Depende apenas de activeSystem para decidir o setup inicial

  const logoutSqlUser = () => {
    console.log("[AuthProvider logoutSqlUser] Logging out SQL user.");
    setUser(null);
    setUserProfileWithPermissions(null);
    router.push('/'); // Or to login page: router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2">Carregando sessão...</p>
      </div>
    );
  }

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

