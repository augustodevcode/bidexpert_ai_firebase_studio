// src/app/setup/setup-redirect.tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface SetupRedirectProps {
  isSetupComplete: boolean;
}

/**
 * A client component responsible ONLY for handling the redirection logic 
 * related to the application setup. It reads the setup status passed from
 * a server component and redirects if necessary.
 */
export function SetupRedirect({ isSetupComplete }: SetupRedirectProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    console.log(`[SetupRedirect] Client-side check. Path: ${pathname}, isSetupComplete: ${isSetupComplete}`);
    if (isSetupComplete === false && pathname !== '/setup') {
      console.log(`[SetupRedirect] REDIRECTING to /setup.`);
      router.replace('/setup');
    }
  }, [isSetupComplete, pathname, router]);

  // This component doesn't render anything itself, it just handles the redirect effect.
  return null;
}
