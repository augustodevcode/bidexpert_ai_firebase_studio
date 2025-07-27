// src/app/dashboard/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import DashboardSidebar from '@/components/layout/dashboard-sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userProfileWithPermissions, loading } = useAuth();
  const router = useRouter();
  
  // Client-side effect to handle redirection
  useEffect(() => {
    if (!loading && !userProfileWithPermissions) {
      router.push('/auth/login?redirect=/dashboard/overview');
    }
  }, [userProfileWithPermissions, loading, router]);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
         <p className="ml-3 text-muted-foreground">Carregando seu painel...</p>
      </div>
    );
  }

  if (!userProfileWithPermissions) {
    // Return a loader while redirecting to avoid flashing the "Access Denied" message
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p className="text-muted-foreground">Redirecionando para login...</p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-6 md:p-8 bg-muted/30">
        {children}
      </main>
    </div>
  );
}
