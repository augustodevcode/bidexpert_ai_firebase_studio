
'use client';

import { useEffect, useState } from 'react';

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift();
  }
}

export default function DevDbIndicator() {
  const [dbSystem, setDbSystem] = useState('');

  useEffect(() => {
    const dbFromCookie = getCookie('dev-config-db');
    const dbFromEnv = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'SAMPLE_DATA';
    setDbSystem(dbFromCookie || dbFromEnv);
  }, []);

  if (process.env.NODE_ENV !== 'development' || !dbSystem) {
    return null;
  }

  return (
    <p className="text-xs text-muted-foreground mt-2">
      Active DB System: <span className="font-semibold text-primary">{dbSystem.toUpperCase()}</span> (Dev Only)
    </p>
  );
}
