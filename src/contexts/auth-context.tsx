
'use client';

import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import type { ReactNode, Dispatch, SetStateAction} from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase'; 
import { Loader2 } from 'lucide-react';
import { ensureUserRoleInFirestore } from '@/app/admin/users/actions'; // Importar a nova action

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: Dispatch<SetStateAction<User | null>>;
  // Poderíamos adicionar UserProfileData aqui se quiséssemos buscar e armazenar no contexto
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ALLOWED_ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || 'admin@bidexpert.com,augusto.devcode@gmail.com').split(',').map(e => e.trim().toLowerCase());


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser && currentUser.email) {
        const userEmailLower = currentUser.email.toLowerCase();
        if (ALLOWED_ADMIN_EMAILS.includes(userEmailLower)) {
          console.log(`[AuthProvider] Admin user ${currentUser.email} logged in. Ensuring Firestore role...`);
          try {
            const result = await ensureUserRoleInFirestore(
                currentUser.uid, 
                currentUser.email, 
                currentUser.displayName || currentUser.email.split('@')[0], // Passa um nome se disponível
                'ADMINISTRATOR'
            );
            if (result.success) {
              console.log(`[AuthProvider] Admin role setup for ${currentUser.email}: ${result.message}`);
            } else {
              console.error(`[AuthProvider] Failed to setup admin role for ${currentUser.email}: ${result.message}`);
            }
          } catch (error) {
            console.error(`[AuthProvider] Error during admin role setup for ${currentUser.email}:`, error);
          }
        }
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
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
