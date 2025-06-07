
'use client';

import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import type { ReactNode, Dispatch, SetStateAction} from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase'; 
import { Loader2 } from 'lucide-react';
import { ensureUserRoleInFirestore } from '@/app/admin/users/actions';
import { doc, getDoc, Timestamp } from 'firebase/firestore'; 
import type { UserProfileData, Role, UserProfileWithPermissions } from '@/types';
import { getRole, getRoleByName } from '@/app/admin/roles/actions';


interface AuthContextType {
  user: User | null;
  userProfileWithPermissions: UserProfileWithPermissions | null;
  loading: boolean; 
  setUser: Dispatch<SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Emails com acesso de admin/analista. Adicione 'augusto.devcode@gmail.com' aqui explicitamente.
const ALLOWED_ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || 'admin@bidexpert.com,analyst@bidexpert.com,augusto.devcode@gmail.com').split(',').map(e => e.trim().toLowerCase());
const SUPER_TEST_USER_EMAIL = 'augusto.devcode@gmail.com'.toLowerCase();


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
        console.log(`[AuthProvider] User ${currentUser.email} changed state. Processing profile...`);
        
        const userEmailLower = currentUser.email.toLowerCase();
        const isTestAdminUser = ALLOWED_ADMIN_EMAILS.includes(userEmailLower) || userEmailLower === SUPER_TEST_USER_EMAIL;

        if (isTestAdminUser) {
          console.warn(`[AuthProvider] Usuário de teste/admin ${currentUser.email} detectado. Fornecendo permissões máximas no contexto do cliente (manage_all).`);
          // Tenta carregar perfil base do Firestore (leitura, SDK cliente) para ter dados como nome, etc.
          try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            let baseProfileData: Partial<UserProfileData> = {
              uid: currentUser.uid,
              email: currentUser.email,
              fullName: currentUser.displayName || currentUser.email.split('@')[0],
              roleName: 'ADMINISTRATOR (Modo Desenvolvedor)', // Marcar que é modo dev
            };
            if (userDocSnap.exists()) {
              const firestoreData = userDocSnap.data() as UserProfileData;
              baseProfileData.fullName = firestoreData.fullName || baseProfileData.fullName;
              baseProfileData.roleName = firestoreData.roleName || baseProfileData.roleName;
              // Incluir outros campos do Firestore se existirem e forem relevantes
              Object.keys(firestoreData).forEach(key => {
                if (!(key in baseProfileData) && firestoreData[key as keyof UserProfileData] !== undefined) {
                    (baseProfileData as any)[key] = firestoreData[key as keyof UserProfileData];
                }
              });
            }
            setUserProfileWithPermissions({
              ...(baseProfileData as UserProfileData), // Cast, pois alguns campos podem estar faltando
              permissions: ['manage_all'], // Forçar permissão máxima
            });
            console.log(`[AuthProvider] Perfil (mock ou base) para ${currentUser.email} com manage_all carregado no contexto.`);
          } catch (profileError) {
            console.error(`[AuthProvider] Erro ao buscar perfil base para ${currentUser.email}, fornecendo mock completo:`, profileError);
            setUserProfileWithPermissions({
              uid: currentUser.uid,
              email: currentUser.email!,
              fullName: currentUser.displayName || currentUser.email!.split('@')[0],
              roleName: 'ADMINISTRATOR (Erro Firestore - Modo Dev)',
              permissions: ['manage_all'],
            } as UserProfileWithPermissions);
          }
        } else {
          // Lógica original para usuários não-admin (buscar perfil e permissões reais)
          console.log(`[AuthProvider] Usuário padrão ${currentUser.email}. Buscando perfil e permissões reais.`);
          try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const userProfileData = { uid: userDocSnap.id, ...userDocSnap.data() } as UserProfileData;
              let permissions: string[] = userProfileData.permissions || [];
              
              if (userProfileData.roleId) {
                const roleData = await getRole(userProfileData.roleId);
                if (roleData) {
                  if ((!permissions || permissions.length === 0) && roleData.permissions) {
                      permissions = roleData.permissions;
                  }
                  if (userProfileData.roleName !== roleData.name) {
                       userProfileData.roleName = roleData.name;
                  }
                }
              } else if (!permissions || permissions.length === 0) {
                  const defaultUserRole = await getRoleByName('USER');
                  if (defaultUserRole && defaultUserRole.permissions) {
                      permissions = defaultUserRole.permissions;
                      userProfileData.roleId = defaultUserRole.id;
                      userProfileData.roleName = defaultUserRole.name;
                  }
              }
              setUserProfileWithPermissions({ ...userProfileData, permissions });
              console.log(`[AuthProvider] Perfil e permissões carregados para ${currentUser.email}. Role: ${userProfileData.roleName || 'None'}, Permissões: ${permissions.length}`);
            } else {
              console.warn(`[AuthProvider] Nenhum perfil Firestore para ${currentUser.email}. Usuário terá perfil padrão.`);
              // Se o documento não existe, cria um perfil "USER" padrão no contexto
                const defaultUserRole = await getRoleByName('USER');
                setUserProfileWithPermissions({
                    uid: currentUser.uid,
                    email: currentUser.email!,
                    fullName: currentUser.displayName || currentUser.email!.split('@')[0],
                    roleId: defaultUserRole?.id,
                    roleName: defaultUserRole?.name || 'USER',
                    permissions: defaultUserRole?.permissions || ['view_auctions', 'view_lots', 'place_bids'],
                    status: 'ATIVO',
                    habilitationStatus: 'PENDENTE_DOCUMENTOS',
                } as UserProfileWithPermissions);
            }
          } catch (profileError) {
            console.error(`[AuthProvider] Erro ao buscar perfil para ${currentUser.email}:`, profileError);
            setUserProfileWithPermissions(null);
          }
        }
        setLoading(false);
      } else {
        console.log("[AuthProvider] Nenhum usuário logado.");
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

