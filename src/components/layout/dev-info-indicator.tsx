/**
 * @fileoverview Indicador de informações de ambiente para uso nos painéis internos.
 * Mostra tenant, usuário, banco de dados e projeto atual.
 * Usado pelo componente EnvInfoButton (modal no sidebar) e pelo AdminQueryMonitor.
 */
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
}

export default function DevInfoIndicator() {
  const { userProfileWithPermissions, activeTenantId } = useAuth();
  const [dbSystem, setDbSystem] = useState('');
  const [projectId, setProjectId] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const dbFromCookie = getCookie('dev-config-db');
    const dbFromEnv = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'MYSQL';
    setDbSystem((dbFromCookie || dbFromEnv).toUpperCase());
    setProjectId(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_PROJECT_ID || 'bidexpert');
  }, []);

  if (!isClient) return null;

  const displayTenantId = activeTenantId || process.env.DEFAULT_TENANT_ID || 'N/A';

  return (
    <footer className="mt-4 w-full" data-ai-id="dashboard-footer" data-testid="dev-info-indicator">
      <div
        className="mt-4 p-4 bg-muted/50 rounded-lg border w-full max-w-4xl mx-auto"
        data-ai-id="dev-info-indicator-inner"
      >
        <p
          className="font-semibold text-center text-foreground mb-3 text-sm"
          data-ai-id="dev-info-title"
        >
          Dev Info
        </p>
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2"
          data-ai-id="dev-info-grid"
        >
          <div className="text-center sm:text-left" data-ai-id="dev-info-tenant">
            <span className="text-xs text-muted-foreground" data-ai-id="dev-info-tenant-label">Tenant ID</span>
            <p className="font-semibold text-primary truncate" title={displayTenantId} data-ai-id="dev-info-tenant-value">{displayTenantId}</p>
          </div>
          <div className="text-center sm:text-left" data-ai-id="dev-info-user">
            <span className="text-xs text-muted-foreground" data-ai-id="dev-info-user-label">User</span>
            <p className="font-semibold text-primary truncate" title={userProfileWithPermissions?.email || 'N/A'} data-ai-id="dev-info-user-value">{userProfileWithPermissions?.email || 'N/A'}</p>
          </div>
          <div className="text-center sm:text-left" data-ai-id="dev-info-db">
            <span className="text-xs text-muted-foreground" data-ai-id="dev-info-db-label">DB System</span>
            <p className="font-semibold text-primary truncate" title={dbSystem} data-ai-id="dev-info-db-value">{dbSystem}</p>
          </div>
          <div className="text-center sm:text-left" data-ai-id="dev-info-project">
            <span className="text-xs text-muted-foreground" data-ai-id="dev-info-project-label">Project</span>
            <p className="font-semibold text-primary truncate" title={projectId} data-ai-id="dev-info-project-value">{projectId}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
