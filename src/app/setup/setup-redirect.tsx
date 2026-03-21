// src/app/setup/setup-redirect.tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface SetupRedirectProps {
  isSetupComplete: boolean;
}

/**
 * A client component responsible ONLY for handling the redirection logic 
 * related to the application setup.
 */
export function SetupRedirect({ isSetupComplete }: SetupRedirectProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isSetupComplete && pathname !== '/setup') {
      router.replace('/setup');
    } else if (isSetupComplete && pathname === '/setup') {
      router.replace('/admin/dashboard');
    }
  }, [isSetupComplete, pathname, router]);

  return null;
}
