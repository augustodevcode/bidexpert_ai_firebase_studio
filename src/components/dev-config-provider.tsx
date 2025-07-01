
'use client';

import React, { useState, useEffect } from 'react';
import DevConfigModal from './dev-config-modal';
import { Loader2 } from 'lucide-react';

export default function DevConfigProvider({ children }: { children: React.ReactNode }) {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // We can't check server-side cookies from the client, so we rely on a marker.
    // If the modal sets a cookie and reloads, this provider will then render children.
    // A simple client-side check is enough to decide if the modal should appear.
    const configMarker = localStorage.getItem('dev-config-set');
    if (configMarker === 'true') {
      setIsConfigured(true);
    }
    setIsChecking(false);
  }, []);

  const handleConfigSet = () => {
    // Set a marker in localStorage so the modal doesn't reappear after reload.
    localStorage.setItem('dev-config-set', 'true');
    // Reload the page to apply the server-side cookie changes.
    window.location.reload();
  };

  if (isChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Verificando configuração de desenvolvimento...</p>
      </div>
    );
  }

  if (!isConfigured) {
    return <DevConfigModal onConfigSet={handleConfigSet} />;
  }

  return <>{children}</>;
}
