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
    // Only redirect if loading is complete and there's definitely no user
    if (!loading && !userProfileWithPermissions) {
      router.push('/auth/login?redirect=/dashboard/overview');
    }
  }, [userProfileWithPermissions, loading, router]);


  // While the auth state is being determined, show a loading screen.
  // This prevents the "access denied" or redirect flash for logged-in users.
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
         <p className="ml-3 text-muted-foreground">Carregando seu painel...</p>
      </div>
    );
  }

  // If loading is finished and there's no user, the useEffect will handle the redirect.
  // We render null here to prevent flashing the "Access Denied" message.
  if (!userProfileWithPermissions) {
    return null;
  }

  // If we reach here, loading is false and user exists. Render the dashboard.
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-6 md:p-8 bg-muted/30">
        {children}
      </main>
    </div>
  );
}
