
'use client';

import React, { useState, useEffect } from 'react';
import DevConfigModal from './dev-config-modal';
import { Loader2 } from 'lucide-react';

export default function DevConfigProvider({ children }: { children: React.ReactNode }) {
  // Default to isConfigured=true so server-side render and initial client render don't show the modal.
  // The client-side useEffect will then correct this if the session marker is missing.
  const [isConfigured, setIsConfigured] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // This now only runs on the client
    const configMarker = sessionStorage.getItem('dev-config-set');
    if (configMarker !== 'true') {
      setIsConfigured(false);
    }
    setIsChecking(false);
  }, []);

  const handleConfigSet = () => {
    sessionStorage.setItem('dev-config-set', 'true');
    window.location.reload();
  };

  // This is the fix: always render children to maintain a stable component tree.
  // The modal is overlaid conditionally on the client-side.
  return (
    <>
      {children}
      {(!isChecking && !isConfigured) && (
        <DevConfigModal onConfigSet={handleConfigSet} />
      )}
    </>
  );
}
