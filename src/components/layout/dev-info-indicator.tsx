// src/components/layout/dev-info-indicator.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';

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

const InfoItem = ({ label, value }: { label: string; value: string }) => (
    <div className="text-center sm:text-left">
        <span className="text-xs text-muted-foreground">{label}</span>
        <p className="font-semibold text-primary truncate" title={value}>{value}</p>
    </div>
);

export default function DevInfoIndicator() {
  const { userProfileWithPermissions, activeTenantId } = useAuth();
  const [dbSystem, setDbSystem] = useState('');
  const [projectId, setProjectId] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const dbFromCookie = getCookie('dev-config-db');
    const dbFromEnv = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'SAMPLE_DATA';
    setDbSystem(dbFromCookie || dbFromEnv);
    setProjectId(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'N/A');
  }, []);

  if (!isClient || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-muted/50 rounded-lg border w-full max-w-4xl mx-auto" data-ai-id="dev-info-indicator">
        <p className="font-semibold text-center text-foreground mb-3 text-sm">Dev Info</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
             <InfoItem label="Tenant ID" value={activeTenantId || 'N/A'} />
             <InfoItem label="User" value={userProfileWithPermissions?.email || 'N/A'} />
             <InfoItem label="DB System" value={dbSystem.toUpperCase()} />
             <InfoItem label="Project" value={projectId} />
        </div>
    </div>
  );
}
