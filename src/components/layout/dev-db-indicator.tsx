
'use client';

import { useEffect, useState } from 'react';

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue;
  }
}

export default function DevDbIndicator() {
  const [dbSystem, setDbSystem] = useState('');
  const [source, setSource] = useState('...');

  useEffect(() => {
    const dbFromCookie = getCookie('dev-config-db');
    if (dbFromCookie) {
      setDbSystem(dbFromCookie);
      setSource('Cookie');
    } else {
      const dbFromEnv = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'SAMPLE_DATA';
      setDbSystem(dbFromEnv);
      setSource('Environment');
    }
  }, []);

  if (process.env.NODE_ENV !== 'development' || !dbSystem) {
    return null;
  }

  return (
    <p className="text-xs text-muted-foreground mt-2">
      Active DB: <span className="font-semibold text-primary">{dbSystem.toUpperCase()}</span> ({source}) (Dev Only)
    </p>
  );
}
