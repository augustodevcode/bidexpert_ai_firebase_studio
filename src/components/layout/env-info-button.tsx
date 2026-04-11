/**
 * @fileoverview Gatilho de sidebar para abrir o modal Dev Info sob demanda.
 */
'use client';

import { useState } from 'react';
import { Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import DevInfoIndicator from '@/components/layout/dev-info-indicator';

interface EnvInfoButtonProps {
  onLinkClick?: () => void;
  collapsed?: boolean;
}

export default function EnvInfoButton({ onLinkClick, collapsed = false }: EnvInfoButtonProps) {
  const [open, setOpen] = useState(false);
  const { userProfileWithPermissions, activeTenantId } = useAuth();

  const tenantId =
    activeTenantId ||
    userProfileWithPermissions?.tenants?.[0]?.tenant?.id?.toString() ||
    '1';
  const userEmail = userProfileWithPermissions?.email || 'admin@bidexpert.ai';

  const handleOpen = () => {
    setOpen(true);
  };

  return (
    <>
      <Button
        variant="ghost"
        data-ai-id="env-info-sidebar-button"
        className={cn(
          'h-9 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          collapsed ? 'w-full justify-center px-2' : 'w-full justify-start'
        )}
        onClick={handleOpen}
        title="Dev Info"
        aria-label="Dev Info"
      >
        <Terminal className={cn('h-4 w-4', !collapsed && 'mr-2')} />
        {!collapsed ? 'Dev Info' : <span className="sr-only">Dev Info</span>}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-5xl"
          data-ai-id="env-info-modal"
        >
          <DialogHeader>
            <DialogTitle
              className="flex items-center gap-2 text-base"
              data-ai-id="env-info-modal-title"
            >
              <Terminal className="h-4 w-4 text-primary" />
              Dev Info
            </DialogTitle>
            <DialogDescription>
              Informacoes de ambiente exibidas sob demanda para suporte tecnico.
            </DialogDescription>
          </DialogHeader>
          <div data-ai-id="env-info-modal-content">
            <DevInfoIndicator
              tenantId={tenantId}
              userEmail={userEmail}
              showTitle={false}
              className="border-0 bg-transparent p-0"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
