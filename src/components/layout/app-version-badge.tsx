/**
 * @fileoverview Componente que exibe a versão da aplicação e informações de build.
 * Consome process.env.NEXT_PUBLIC_APP_VERSION injetado pelo semantic-release
 * via GitHub Actions e Vercel env vars.
 * 
 * Exibido no rodapé de todas as páginas para rastreabilidade de versão.
 */
'use client';

import { GitBranch, Tag } from 'lucide-react';
import Link from 'next/link';

/**
 * Mapeia o ambiente Vercel para um label legível.
 */
function getEnvironmentLabel(env: string): { label: string; color: string } {
  switch (env) {
    case 'production':
      return { label: 'PRD', color: 'text-green-600' };
    case 'preview':
      return { label: 'PREVIEW', color: 'text-amber-600' };
    case 'development':
      return { label: 'DEV', color: 'text-blue-600' };
    default:
      return { label: env.toUpperCase(), color: 'text-muted-foreground' };
  }
}

export default function AppVersionBadge() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0-dev';
  const buildId = process.env.NEXT_PUBLIC_BUILD_ID || 'local';
  const buildEnv = process.env.NEXT_PUBLIC_BUILD_ENV || 'development';

  const envInfo = getEnvironmentLabel(buildEnv);

  // Detectar canal pre-release pelo sufixo
  const channelMatch = version.match(/-(\w+)\./);
  const channel = channelMatch ? channelMatch[1] : null;

  return (
    <Link
      href="/changelog"
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors group"
      data-ai-id="app-version-badge"
      title={`Versão ${version} | Build ${buildId} | Ambiente ${envInfo.label}`}
    >
      <Tag className="h-3 w-3 group-hover:text-primary" />
      <span data-ai-id="app-version-number">
        v{version}
      </span>
      {channel && (
        <span className="px-1 py-0.5 rounded text-[10px] font-medium bg-muted" data-ai-id="app-version-channel">
          {channel.toUpperCase()}
        </span>
      )}
      <span className="hidden sm:inline-flex items-center gap-1">
        <GitBranch className="h-3 w-3" />
        <span data-ai-id="app-build-id">{buildId}</span>
      </span>
      <span className={`hidden md:inline font-medium ${envInfo.color}`} data-ai-id="app-build-env">
        {envInfo.label}
      </span>
    </Link>
  );
}
