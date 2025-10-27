// src/app/setup/setup-redirect.tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface SetupRedirectProps {
  isSetupComplete: boolean;
}

/**
 * A client component responsible ONLY for handling the redirection logic 
 * related to the application setup. It has been disabled for development.
 */
export function SetupRedirect({ isSetupComplete }: SetupRedirectProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // A lógica de redirecionamento foi desativada para facilitar o desenvolvimento.
    // O código original verificava `isSetupComplete` e redirecionava para '/setup'.
    // console.log(`[SetupRedirect] Check bypassed. Path: ${pathname}, isSetupComplete: ${isSetupComplete}`);
    /*
    if (!isSetupComplete && pathname !== '/setup') {
      console.log('[SetupRedirect] Setup not complete. Redirecting to /setup...');
      router.push('/setup');
    } else if (isSetupComplete && pathname === '/setup') {
      console.log('[SetupRedirect] Setup is complete. Redirecting from /setup to dashboard...');
      router.push('/admin/dashboard');
    }
    */
  }, [isSetupComplete, pathname, router]);

  // This component doesn't render anything itself, it just handles the redirect effect.
  return null;
}
