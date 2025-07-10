// src/components/dev-db-indicator.tsx
'use client';

import { useEffect, useState } from 'react';

export default function DevDbIndicator() {
  const [dbSystem, setDbSystem] = useState('');

  useEffect(() => {
    // We read the system directly from the public environment variable.
    const dbFromEnv = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'SAMPLE_DATA';
    setDbSystem(dbFromEnv);
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
