
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
import { getRole } from '@/app/admin/roles/actions';


interface AuthContextType {
  user: User | null;
  userProfileWithPermissions: UserProfileWithPermissions | null;
  loading: boolean; 
  setUser: Dispatch<SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ALLOWED_ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || 'admin@bidexpert.com,augusto.devcode@gmail.com').split(',').map(e => e.trim().toLowerCase());


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
        console.log(`[AuthProvider] User ${currentUser.email} changed state. Fetching profile...`);
        
        const userEmailLower = currentUser.email.toLowerCase();
        if (ALLOWED_ADMIN_EMAILS.includes(userEmailLower)) {
          console.log(`[AuthProvider] Admin user ${currentUser.email} identified. Ensuring Firestore role...`);
          try {
            const roleSetupResult = await ensureUserRoleInFirestore(
                currentUser.uid, 
                currentUser.email, 
                currentUser.displayName || currentUser.email.split('@')[0],
                'ADMINISTRATOR'
            );
            console.log('[AuthProvider] roleSetupResult from ensureUserRoleInFirestore:', JSON.stringify(roleSetupResult, null, 2));


            if (roleSetupResult && roleSetupResult.success) { 
              console.log(`[AuthProvider] Admin role setup for ${currentUser.email}: ${roleSetupResult.message}`);
            } else {
              console.error(`[AuthProvider] Failed to setup admin role for ${currentUser.email}: ${roleSetupResult?.message || 'Resultado indefinido ou falha sem mensagem.'}`);
            }
          } catch (error) { 
            console.error(`[AuthProvider] Error during admin role setup for ${currentUser.email}:`, error);
          }
        }
        
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userProfileData = { uid: userDocSnap.id, ...userDocSnap.data() } as UserProfileData;
            let permissions: string[] = [];
            if (userProfileData.roleId) {
              const roleData = await getRole(userProfileData.roleId);
              if (roleData) {
                permissions = roleData.permissions || [];
                if (userProfileData.roleName !== roleData.name) {
                     userProfileData.roleName = roleData.name;
                }
              } else {
                console.warn(`[AuthProvider] Role with ID ${userProfileData.roleId} not found for user ${currentUser.email}.`);
              }
            }
            setUserProfileWithPermissions({ ...userProfileData, permissions });
            console.log(`[AuthProvider] Profile and permissions loaded for ${currentUser.email}. Role: ${userProfileData.roleName || 'None'}, Habilitation: ${userProfileData.habilitationStatus}, Permissions: ${permissions.length}`);
          } else {
            console.warn(`[AuthProvider] No Firestore profile found for user ${currentUser.email} (UID: ${currentUser.uid}). This might happen if the account was just created and Firestore document creation is pending or failed.`);
          }
        } catch (profileError) {
          console.error(`[AuthProvider] Error fetching profile for ${currentUser.email}:`, profileError);
        }

      } else {
        console.log("[AuthProvider] No current user or email.");
      }
      setLoading(false);
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

    

