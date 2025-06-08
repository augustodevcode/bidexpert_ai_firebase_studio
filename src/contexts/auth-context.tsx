
'use client';

import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import type { ReactNode, Dispatch, SetStateAction} from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase'; 
import { Loader2 } from 'lucide-react';
import { ensureUserRoleInFirestore } from '@/app/admin/users/actions';
import type { UserProfileData, UserProfileWithPermissions } from '@/types';

interface AuthContextType {
  user: User | null;
  userProfileWithPermissions: UserProfileWithPermissions | null;
  loading: boolean; 
  setUser: Dispatch<SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfileWithPermissions, setUserProfileWithPermissions] = useState<UserProfileWithPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setUser(currentUser);
      setUserProfileWithPermissions(null); 

      if (currentUser && currentUser.email) {
        console.log(`[AuthProvider] Usuário ${currentUser.email} mudou de estado. Processando perfil...`);
        
        try {
          // Sempre chamar ensureUserRoleInFirestore para sincronizar/criar perfil no Firestore
          // A action determinará o perfil correto (ex: USER, ou ADMINISTRATOR se já configurado).
          // Para um novo usuário, ele será criado com o perfil USER padrão.
          const targetRoleForNewUsers = 'USER'; 
          
          const roleSetupResult = await ensureUserRoleInFirestore(
            currentUser.uid, 
            currentUser.email, 
            currentUser.displayName || currentUser.email.split('@')[0], 
            targetRoleForNewUsers // Se o usuário já for admin no Firestore, ensureUserRoleInFirestore deve respeitar isso.
          );

          if (roleSetupResult.success && roleSetupResult.userProfile) {
            console.log(`[AuthProvider] ensureUserRoleInFirestore teve sucesso para ${currentUser.email}. Perfil:`, JSON.stringify(roleSetupResult.userProfile));
            setUserProfileWithPermissions({
              ...roleSetupResult.userProfile,
              // Certificar que as datas sejam objetos Date no cliente
              createdAt: roleSetupResult.userProfile.createdAt ? new Date(roleSetupResult.userProfile.createdAt) : undefined,
              updatedAt: roleSetupResult.userProfile.updatedAt ? new Date(roleSetupResult.userProfile.updatedAt) : undefined,
              dateOfBirth: roleSetupResult.userProfile.dateOfBirth ? new Date(roleSetupResult.userProfile.dateOfBirth) : undefined,
              rgIssueDate: roleSetupResult.userProfile.rgIssueDate ? new Date(roleSetupResult.userProfile.rgIssueDate) : undefined,
            } as UserProfileWithPermissions); // Forçar o tipo se necessário
          } else {
            console.error(`[AuthProvider] Falha ao executar ensureUserRoleInFirestore para ${currentUser.email}: ${roleSetupResult?.message || 'Resultado indefinido.'}`);
            // Em caso de falha, userProfileWithPermissions permanecerá null ou você pode definir um estado de erro
            setUserProfileWithPermissions(null); 
          }
        } catch (error) {
          console.error(`[AuthProvider] Erro ao chamar ensureUserRoleInFirestore para ${currentUser.email}:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
          setUserProfileWithPermissions(null); 
        }
        setLoading(false);
      } else {
        console.log("[AuthProvider] Nenhum usuário logado ou sem e-mail.");
        setUser(null);
        setUserProfileWithPermissions(null);
        setLoading(false); 
      }
    });

    return () => unsubscribe();
  }, []); 

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2">Carregando sessão...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, userProfileWithPermissions, loading, setUser }}>
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
