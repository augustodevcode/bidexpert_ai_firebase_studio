
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
  console.log(`[AuthProvider] Initializing with ACTIVE_DATABASE_SYSTEM (client-side): ${activeSystem}`);

  // Wrapper para setUserProfileWithPermissions para adicionar log
  const setUserProfileWithPermissions = (profile: SetStateAction<UserProfileWithPermissions | null>) => {
    console.log('[AuthProvider] setUserProfileWithPermissions called with:', profile);
    _setUserProfileWithPermissions(profile);
  };


  useEffect(() => {
    console.log(`[AuthProvider UseEffect] Running for system: ${activeSystem}. Current Firebase user: ${user?.email}, SQL profile from state: ${userProfileWithPermissions?.email}`);
    
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
        setLoading(false);
      });
    } else {
      console.log(`[AuthProvider UseEffect] Mode: ${activeSystem}. Setting initial state, no Firebase listener. Current userProfileWithPermissions:`, userProfileWithPermissions?.email);
      setUser(null); 
      // No modo SQL, o perfil é carregado pela página de login e setado diretamente no contexto.
      // Apenas garantimos que o loading seja falso.
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
    setUser(null);
    setUserProfileWithPermissions(null);
    router.push('/'); 
  };

  console.log(`[AuthProvider Render] loading: ${loading}, user: ${user?.email}, userProfileWithPermissions: ${userProfileWithPermissions?.email}`);

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
