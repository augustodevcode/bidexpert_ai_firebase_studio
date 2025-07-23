'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Loader2 } from 'lucide-react';

export function AppContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);

  useEffect(() => {
    // This check must only run on the client where localStorage is available.
    // The initial state on the server should be null to avoid hydration mismatches.
    if (typeof window !== 'undefined') {
        const forceSetup = process.env.NEXT_PUBLIC_FORCE_SETUP === 'true';
        const bypassSetup = process.env.NEXT_PUBLIC_FORCE_SETUP === 'false';
        
        if (bypassSetup) {
            setIsSetupComplete(true);
            return;
        }

        if (forceSetup) {
            setIsSetupComplete(false);
            return;
        }

        const setupFlag = localStorage.getItem('bidexpert_setup_complete');
        setIsSetupComplete(setupFlag === 'true');
    }
  }, []);

  useEffect(() => {
    // If setup is not complete and we are not on the setup page, redirect.
    if (isSetupComplete === false && pathname !== '/setup') {
      router.replace('/setup');
    }
  }, [isSetupComplete, pathname, router]);
  
  // While setup status is being determined, show a loader for all pages except setup itself.
  if (isSetupComplete === null && pathname !== '/setup') {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary"/>
            <p className="ml-3 text-muted-foreground">Verificando configuração...</p>
        </div>
      );
  }

  const isAdminOrConsignor = pathname.startsWith('/admin') || pathname.startsWith('/consignor-dashboard');

  // If we are on the setup page, render it without the main layout
  if (pathname === '/setup') {
    return <>{children}</>;
  }

  // If in admin or consignor dashboard, the layout is handled by their specific layout files
  if (isAdminOrConsignor) {
    return <>{children}</>;
  }

  // Default layout for public-facing pages
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
