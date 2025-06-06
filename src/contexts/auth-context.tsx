
'use client';

import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import type { ReactNode, Dispatch, SetStateAction} from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase'; 
import { Loader2 } from 'lucide-react';
import { ensureUserRoleInFirestore } from '@/app/admin/users/actions';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfileData, Role, UserProfileWithPermissions } from '@/types';
import { getRole } from '@/app/admin/roles/actions';


interface AuthContextType {
  user: User | null;
  userProfileWithPermissions: UserProfileWithPermissions | null; // Now includes permissions
  loading: boolean; // Combined loading state
  setUser: Dispatch<SetStateAction<User | null>>; // Kept for direct auth state manipulation if needed
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
      setUserProfileWithPermissions(null); // Reset profile on auth change

      if (currentUser && currentUser.email) {
        console.log(`[AuthProvider] User ${currentUser.email} changed state. Fetching profile...`);
        
        // Ensure admin role in Firestore if applicable
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
            if (roleSetupResult.success) {
              console.log(`[AuthProvider] Admin role setup for ${currentUser.email}: ${roleSetupResult.message}`);
            } else {
              console.error(`[AuthProvider] Failed to setup admin role for ${currentUser.email}: ${roleSetupResult.message}`);
            }
          } catch (error) {
            console.error(`[AuthProvider] Error during admin role setup for ${currentUser.email}:`, error);
          }
        }

        // Fetch UserProfileData and then their Role's permissions
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
                // Optionally update roleName in userProfileData if it's stale, though ensureUserRoleInFirestore should handle this
                if (userProfileData.roleName !== roleData.name) {
                     console.warn(`[AuthProvider] Mismatch in roleName for ${currentUser.email}. Firestore: ${userProfileData.roleName}, Role Doc: ${roleData.name}. Using Role Doc name.`);
                     userProfileData.roleName = roleData.name; // This is a local update for the context
                }
              } else {
                console.warn(`[AuthProvider] Role with ID ${userProfileData.roleId} not found for user ${currentUser.email}.`);
              }
            }
            setUserProfileWithPermissions({ ...userProfileData, permissions });
            console.log(`[AuthProvider] Profile and permissions loaded for ${currentUser.email}. Role: ${userProfileData.roleName || 'None'}, Permissions: ${permissions.length}`);
          } else {
            console.warn(`[AuthProvider] No Firestore profile found for user ${currentUser.email} (UID: ${currentUser.uid}). They might need to complete registration or be an admin being set up.`);
             // If it's an admin user and ensureUserRoleInFirestore just created them,
             // they might not have a roleId immediately reflected here unless we re-fetch or pass it back.
             // For now, if an admin logs in and their Firestore doc was just created, they might temporarily have no permissions in context
             // until the next auth state change or a manual refresh. This is a minor edge case for first-time admin login.
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
  }, []); // Removed dependencies to run only on mount/unmount

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
