/**
 * @fileoverview Rodape padrao do dashboard com informacoes de ambiente para debug.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';

type DevInfoIndicatorMode = 'flow' | 'admin-fixed';

interface DevInfoIndicatorProps {
  mode?: DevInfoIndicatorMode;
  tenantId?: string;
  userEmail?: string;
}

interface RuntimeEnvironmentInfo {
  dbSystem: string;
  dbProvider: string;
  project: string;
  remoteServerUrl: string;
  branch: string;
}

const DEFAULT_RUNTIME_ENVIRONMENT: RuntimeEnvironmentInfo = {
  dbSystem: 'MYSQL',
  dbProvider: 'Prisma',
  project: 'bidexpert',
  remoteServerUrl: 'https://bidexpert-demo.vercel.app',
  branch: 'demo-stable',
};

function normalizeUrl(url: string): string {
  if (!url) {
    return url;
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return `https://${url}`;
}

function inferBranchByHost(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_RUNTIME_ENVIRONMENT.branch;
  }

  const host = window.location.hostname.toLowerCase();
  if (host.includes('demo')) {
    return 'demo-stable';
  }

  return 'main';
}

function getInitialRuntimeEnvironment(): RuntimeEnvironmentInfo {
  const branchFromEnv =
    process.env.NEXT_PUBLIC_SYSTEM_BRANCH ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF ||
    process.env.NEXT_PUBLIC_GIT_BRANCH ||
    '';

  const branch = branchFromEnv || inferBranchByHost();
  const remoteServerUrlFromEnv =
    process.env.NEXT_PUBLIC_REMOTE_SERVER_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    '';
  const remoteServerUrl = remoteServerUrlFromEnv
    ? normalizeUrl(remoteServerUrlFromEnv)
    : branch === 'main'
      ? 'https://bidexpert.vercel.app'
      : 'https://bidexpert-demo.vercel.app';

  return {
    ...DEFAULT_RUNTIME_ENVIRONMENT,
    project: process.env.NEXT_PUBLIC_PROJECT_NAME || DEFAULT_RUNTIME_ENVIRONMENT.project,
    branch,
    remoteServerUrl,
  };
}

export default function DevInfoIndicator({
  mode = 'flow',
  tenantId = '1',
  userEmail = 'admin@bidexpert.ai',
}: DevInfoIndicatorProps) {
  const [runtimeEnvironment, setRuntimeEnvironment] = useState<RuntimeEnvironmentInfo>(
    getInitialRuntimeEnvironment,
  );

  useEffect(() => {
    let isMounted = true;

    const fetchRuntimeEnvironment = async () => {
      try {
        const response = await fetch('/api/admin/dev-info', { cache: 'no-store' });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as Partial<RuntimeEnvironmentInfo>;

        if (!isMounted) {
          return;
        }

        setRuntimeEnvironment((previous) => ({
          ...previous,
          ...payload,
        }));
      } catch {
        // noop: keep current fallback environment info
      }
    };

    void fetchRuntimeEnvironment();

    return () => {
      isMounted = false;
    };
  }, []);

  const footerClassName = useMemo(
    () =>
      mode === 'admin-fixed'
        ? 'fixed left-0 right-0 z-[60] px-4 sm:px-6 md:px-8 bottom-[calc(var(--admin-query-monitor-height,0px)+0.5rem)]'
        : 'mt-4 w-full',
    [mode],
  );

  const indicatorPanelClassName =
    mode === 'admin-fixed'
      ? 'p-3 bg-muted/90 rounded-lg border w-full max-w-7xl mx-auto backdrop-blur supports-[backdrop-filter]:bg-muted/75'
      : 'mt-4 p-4 bg-muted/50 rounded-lg border w-full max-w-4xl mx-auto';

  const remoteServerLabel = runtimeEnvironment.remoteServerUrl.replace(/^https?:\/\//, '');

  return (
    <footer
      className={footerClassName}
      data-ai-id="dashboard-footer"
      data-testid="dev-info-indicator"
    >
      <div
        className={indicatorPanelClassName}
        data-ai-id="dev-info-indicator-inner"
      >
        <p
          className="font-semibold text-center text-foreground mb-3 text-sm"
          data-ai-id="dev-info-title"
        >
          Dev Info
        </p>
        <div
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-x-4 gap-y-2"
          data-ai-id="dev-info-grid"
        >
          <div className="text-center sm:text-left" data-ai-id="dev-info-tenant">
            <span className="text-xs text-muted-foreground" data-ai-id="dev-info-tenant-label">
              Tenant ID
            </span>
            <p
              className="font-semibold text-primary truncate"
              title={tenantId}
              data-ai-id="dev-info-tenant-value"
            >
              {tenantId}
            </p>
          </div>
          <div className="text-center sm:text-left" data-ai-id="dev-info-user">
            <span className="text-xs text-muted-foreground" data-ai-id="dev-info-user-label">
              User
            </span>
            <p
              className="font-semibold text-primary truncate"
              title={userEmail}
              data-ai-id="dev-info-user-value"
            >
              {userEmail}
            </p>
          </div>
          <div className="text-center sm:text-left" data-ai-id="dev-info-db">
            <span className="text-xs text-muted-foreground" data-ai-id="dev-info-db-label">
              DB System
            </span>
            <p
              className="font-semibold text-primary truncate"
              title={runtimeEnvironment.dbSystem}
              data-ai-id="dev-info-db-value"
            >
              {runtimeEnvironment.dbSystem}
            </p>
          </div>
          <div className="text-center sm:text-left" data-ai-id="dev-info-provider">
            <span className="text-xs text-muted-foreground" data-ai-id="dev-info-provider-label">
              Provider
            </span>
            <p
              className="font-semibold text-primary truncate"
              title={runtimeEnvironment.dbProvider}
              data-ai-id="dev-info-provider-value"
            >
              {runtimeEnvironment.dbProvider}
            </p>
          </div>
          <div className="text-center sm:text-left" data-ai-id="dev-info-branch">
            <span className="text-xs text-muted-foreground" data-ai-id="dev-info-branch-label">
              Branch
            </span>
            <p
              className="font-semibold text-primary truncate"
              title={runtimeEnvironment.branch}
              data-ai-id="dev-info-branch-value"
            >
              {runtimeEnvironment.branch}
            </p>
          </div>
          <div className="text-center sm:text-left" data-ai-id="dev-info-server-link">
            <span className="text-xs text-muted-foreground" data-ai-id="dev-info-server-link-label">
              Server
            </span>
            <a
              href={runtimeEnvironment.remoteServerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block font-semibold text-primary truncate hover:underline"
              title={runtimeEnvironment.remoteServerUrl}
              data-ai-id="dev-info-server-link-value"
            >
              {remoteServerLabel}
            </a>
          </div>
          <div className="text-center sm:text-left" data-ai-id="dev-info-project">
            <span className="text-xs text-muted-foreground" data-ai-id="dev-info-project-label">
              Project
            </span>
            <p
              className="font-semibold text-primary truncate"
              title={runtimeEnvironment.project}
              data-ai-id="dev-info-project-value"
            >
              {runtimeEnvironment.project}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
