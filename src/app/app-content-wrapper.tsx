
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
    // This check only runs on the client-side after hydration
    const setupFlag = localStorage.getItem('bidexpert_setup_complete');
    setIsSetupComplete(setupFlag === 'true');
  }, []);

  useEffect(() => {
    if (isSetupComplete === false && pathname !== '/setup') {
      router.replace('/setup');
    }
  }, [isSetupComplete, pathname, router]);
  
  // Render a loading state or nothing while checking setup status
  if (isSetupComplete === null && pathname !== '/setup') {
      return (
        <div className="flex h-screen w-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin"/>
        </div>
      );
  }

  // If on the setup page, render it without the main layout
  if (pathname === '/setup') {
    return <>{children}</>;
  }

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
