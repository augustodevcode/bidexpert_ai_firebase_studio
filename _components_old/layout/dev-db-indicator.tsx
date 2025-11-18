
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '../ui/badge';

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
  const { userProfileWithPermissions } = useAuth();
  const [dbSystem, setDbSystem] = useState('');
  const [projectId, setProjectId] = useState('');

  useEffect(() => {
    const dbFromCookie = getCookie('dev-config-db');
    const dbFromEnv = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'SAMPLE_DATA';
    setDbSystem(dbFromCookie || dbFromEnv);
    setProjectId(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'N/A');
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="mt-4 p-2 bg-muted/50 rounded-md text-xs text-muted-foreground space-y-1 text-center border">
        <p className="font-semibold text-foreground">Dev Info</p>
        <p>
            <Badge variant="secondary" className="mr-1.5">DB System</Badge>
            <span className="font-semibold text-primary">{dbSystem.toUpperCase()}</span>
        </p>
         <p>
            <Badge variant="secondary" className="mr-1.5">Project</Badge>
            <span className="font-semibold text-primary">{projectId}</span>
        </p>
        <p>
            <Badge variant="secondary" className="mr-1.5">User</Badge>
            <span className="font-semibold text-primary truncate">{userProfileWithPermissions?.email || 'N/A'}</span>
        </p>
    </div>
  );
}
