// src/app/app-content-wrapper.tsx
'use client'; 

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { SetupRedirect } from './setup/setup-redirect';
import type { PlatformSettings } from '@/types';
import { Loader2 } from 'lucide-react';

export function AppContentWrapper({ 
  children, 
  isSetupComplete,
  platformSettings,
}: { 
  children: React.ReactNode, 
  isSetupComplete: boolean,
  platformSettings: PlatformSettings | null,
}) {
  const pathname = usePathname();

  // If we are on the setup page, we don't want to render the main layout.
  if (pathname === '/setup') {
    return <>{children}</>;
  }

  return (
    <>
      <SetupRedirect isSetupComplete={isSetupComplete} />
      <div className="container-main-app">
        <Suspense fallback={<div className="container-header-suspense"><Loader2 className="icon-loading-spinner" /></div>}>
            <Header 
              platformSettings={platformSettings}
            />
        </Suspense>
        <main className="container mx-auto flex-grow px-4 py-8">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
}
