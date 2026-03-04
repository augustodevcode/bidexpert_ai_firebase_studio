/**
 * @fileoverview Botão de informações de ambiente para a barra lateral do admin.
 * Exibe um botão "Dev Console" que ao ser clicado abre um modal com informações
 * do ambiente atual: tenant, usuário, banco de dados, branch, versão e ambiente Vercel.
 */
'use client';

import { useState, useEffect } from 'react';
import { Terminal, X, Server, GitBranch, Tag, User, Database, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
}

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

function InfoRow({ icon: Icon, label, value, mono, variant = 'default' }: InfoRowProps) {
  return (
    <div
      className="flex items-center gap-3 py-2.5"
      data-ai-id={`env-info-row-${label.toLowerCase().replace(/\s/g, '-')}`}
    >
      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <span className="text-sm text-muted-foreground w-28 flex-shrink-0">{label}</span>
      <Badge
        variant={variant === 'destructive' ? 'destructive' : 'outline'}
        className={cn(
          'font-medium',
          mono && 'font-mono',
          variant === 'success' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
          variant === 'warning' && 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
        )}
      >
        {value}
      </Badge>
    </div>
  );
}

export default function EnvInfoButton({ onLinkClick }: { onLinkClick?: () => void }) {
  const [open, setOpen] = useState(false);
  const [dbSystem, setDbSystem] = useState('');
  const [isClient, setIsClient] = useState(false);
  const { userProfileWithPermissions, activeTenantId } = useAuth();

  useEffect(() => {
    setIsClient(true);
    const dbFromCookie = getCookie('dev-config-db');
    const dbFromEnv = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'MYSQL';
    setDbSystem((dbFromCookie || dbFromEnv).toUpperCase());
  }, []);

  const env = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development';
  const branch = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF || process.env.NEXT_PUBLIC_GIT_BRANCH || 'local';
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0-local';
  const commitSha = (process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || '').substring(0, 7) || 'local';
  const tenantId = activeTenantId || process.env.DEFAULT_TENANT_ID || 'N/A';
  const userEmail = userProfileWithPermissions?.email || 'N/A';
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_PROJECT_ID || 'bidexpert';

  const envVariant: InfoRowProps['variant'] =
    env === 'production' ? 'destructive' : env === 'preview' ? 'warning' : 'success';

  const handleOpen = () => {
    setOpen(true);
    onLinkClick?.();
  };

  return (
    <>
      <Button
        variant="ghost"
        data-ai-id="env-info-sidebar-button"
        className="w-full justify-start text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-9 text-sm"
        onClick={handleOpen}
      >
        <Terminal className="mr-2 h-4 w-4" />
        Dev Console
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-md"
          data-ai-id="env-info-modal"
        >
          <DialogHeader>
            <DialogTitle
              className="flex items-center gap-2 text-base"
              data-ai-id="env-info-modal-title"
            >
              <Terminal className="h-4 w-4 text-primary" />
              Dev Console
            </DialogTitle>
          </DialogHeader>

          {isClient ? (
            <div className="space-y-0 divide-y divide-border" data-ai-id="env-info-modal-content">
              <InfoRow icon={Cpu} label="Ambiente" value={env} variant={envVariant} />
              <InfoRow icon={GitBranch} label="Branch" value={branch} mono />
              <InfoRow icon={Tag} label="Versão" value={appVersion} mono />
              <InfoRow icon={Tag} label="Commit" value={commitSha} mono />
              <InfoRow icon={Server} label="Tenant ID" value={tenantId} mono />
              <InfoRow icon={User} label="Usuário" value={userEmail} />
              <InfoRow icon={Database} label="Banco" value={dbSystem} mono />
              <InfoRow icon={Server} label="Projeto" value={projectId} mono />
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              Carregando informações...
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
