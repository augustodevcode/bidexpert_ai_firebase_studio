/**
 * @fileoverview Painel reutilizavel de Dev Info para exibicao sob demanda.
 * Cada secao exibe um icone ao lado do label para facilitar identificacao visual.
 */
'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Building2,
  User,
  Database,
  Server,
  GitBranch,
  Globe,
  FolderKanban,
} from 'lucide-react';

interface DevInfoIndicatorProps {
  tenantId?: string;
  userEmail?: string;
  className?: string;
  showTitle?: boolean;
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
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
}

function inferBranchByHost(): string {
  if (typeof window === 'undefined') return DEFAULT_RUNTIME_ENVIRONMENT.branch;
  const host = window.location.hostname.toLowerCase();
  return host.includes('demo') ? 'demo-stable' : 'main';
}

function getPublicEnvValue(key: string): string {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || '';
  }

  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return (import.meta.env[key] as string | undefined) || '';
  }

  return '';
}

function getInitialRuntimeEnvironment(): RuntimeEnvironmentInfo {
  const branchFromEnv =
    getPublicEnvValue('NEXT_PUBLIC_SYSTEM_BRANCH') ||
    getPublicEnvValue('NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF') ||
    getPublicEnvValue('NEXT_PUBLIC_GIT_BRANCH') ||
    '';

  const branch = branchFromEnv || inferBranchByHost();
  const remoteServerUrlFromEnv =
    getPublicEnvValue('NEXT_PUBLIC_REMOTE_SERVER_URL') ||
    getPublicEnvValue('NEXT_PUBLIC_APP_URL') ||
    '';
  const remoteServerUrl = remoteServerUrlFromEnv
    ? normalizeUrl(remoteServerUrlFromEnv)
    : branch === 'main'
      ? 'https://bidexpert.vercel.app'
      : 'https://bidexpert-demo.vercel.app';

  return {
    ...DEFAULT_RUNTIME_ENVIRONMENT,
    project: getPublicEnvValue('NEXT_PUBLIC_PROJECT_NAME') || DEFAULT_RUNTIME_ENVIRONMENT.project,
    branch,
    remoteServerUrl,
  };
}

/** Celula individual do grid com icone + label + valor. */
function InfoCell({
  icon: Icon,
  label,
  value,
  href,
  aiId,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  href?: string;
  aiId: string;
}) {
  return (
    <div className="min-w-0 flex items-start gap-1.5" data-ai-id={aiId}>
      <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <span className="text-[10px] leading-tight text-muted-foreground block" data-ai-id={`${aiId}-label`}>
          {label}
        </span>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-primary truncate block hover:underline"
            title={value}
            data-ai-id={`${aiId}-value`}
          >
            {value}
          </a>
        ) : (
          <p
            className="text-xs font-semibold text-primary truncate"
            title={value}
            data-ai-id={`${aiId}-value`}
          >
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

export default function DevInfoIndicator({
  tenantId = '1',
  userEmail = 'admin@bidexpert.ai',
  className,
  showTitle = true,
}: DevInfoIndicatorProps) {
  const [env, setEnv] = useState<RuntimeEnvironmentInfo>(getInitialRuntimeEnvironment);

  useEffect(() => {
    let isMounted = true;

    const fetchRuntimeEnvironment = async () => {
      try {
        const response = await fetch('/api/admin/dev-info', { cache: 'no-store' });
        if (!response.ok) return;
        const payload = (await response.json()) as Partial<RuntimeEnvironmentInfo>;
        if (!isMounted) return;
        setEnv((prev) => ({ ...prev, ...payload }));
      } catch {
        // noop
      }
    };

    void fetchRuntimeEnvironment();
    return () => { isMounted = false; };
  }, []);

  const serverLabel = env.remoteServerUrl.replace(/^https?:\/\//, '');

  return (
    <section
      className={cn('w-full rounded-lg border bg-muted/60 p-3', className)}
      data-ai-id="dashboard-footer"
      data-testid="dev-info-indicator"
    >
      <div data-ai-id="dev-info-indicator-inner">
        {showTitle ? (
          <p
            className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-foreground"
            data-ai-id="dev-info-title"
          >
            Dev Info
          </p>
        ) : null}
        <div
          className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4 lg:grid-cols-7"
          data-ai-id="dev-info-grid"
        >
          <InfoCell icon={Building2} label="Tenant ID" value={tenantId} aiId="dev-info-tenant" />
          <InfoCell icon={User} label="User" value={userEmail} aiId="dev-info-user" />
          <InfoCell icon={Database} label="DB System" value={env.dbSystem} aiId="dev-info-db" />
          <InfoCell icon={Server} label="Provider" value={env.dbProvider} aiId="dev-info-provider" />
          <InfoCell icon={GitBranch} label="Branch" value={env.branch} aiId="dev-info-branch" />
          <InfoCell icon={Globe} label="Server" value={serverLabel} href={env.remoteServerUrl} aiId="dev-info-server-link" />
          <InfoCell icon={FolderKanban} label="Project" value={env.project} aiId="dev-info-project" />
        </div>
      </div>
    </section>
  );
}
