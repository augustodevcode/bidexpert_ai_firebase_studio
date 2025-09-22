// src/app/app-content-wrapper.tsx
'use client'; // This component MUST be a client component to use hooks like usePathname

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { SetupRedirect } from './setup/setup-redirect';
import type { PlatformSettings } from '@/types';

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
      <div className="flex flex-col min-h-screen">
        <Header 
          platformSettings={platformSettings}
        />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
}
