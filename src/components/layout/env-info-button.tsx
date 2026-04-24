/**
 * @fileoverview Gatilho de sidebar para abrir o modal Dev Info sob demanda.
 */
'use client';

import { useEffect, useState } from 'react';
import { Activity, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

const QUERY_MONITOR_LS_KEY = 'admin_query_monitor_enabled';
const ENV_QUERY_MONITOR = process.env.NEXT_PUBLIC_QUERY_MONITOR_ENABLED === 'true';

export default function EnvInfoButton({ onLinkClick, collapsed = false }: EnvInfoButtonProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [queryMonitorEnabled, setQueryMonitorEnabled] = useState(false);
  const { userProfileWithPermissions, activeTenantId } = useAuth();

  useEffect(() => {
    setMounted(true);

    if (ENV_QUERY_MONITOR) {
      setQueryMonitorEnabled(true);
      return;
    }

    const stored = localStorage.getItem(QUERY_MONITOR_LS_KEY);
    setQueryMonitorEnabled(stored === 'true');
  }, []);

  const handleQueryMonitorToggle = (checked: boolean) => {
    if (ENV_QUERY_MONITOR) {
      return;
    }

    setQueryMonitorEnabled(checked);
    const nextValue = checked ? 'true' : 'false';
    localStorage.setItem(QUERY_MONITOR_LS_KEY, nextValue);
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: QUERY_MONITOR_LS_KEY,
        newValue: nextValue,
      })
    );
  };

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
      <div className={cn('flex w-full items-center justify-between', collapsed ? 'flex-col gap-2' : 'gap-2')}>
        <Button
          variant="ghost"
          data-ai-id="env-info-sidebar-button"
          className={cn(
            'h-9 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            collapsed ? 'w-full justify-center px-2' : 'flex-1 justify-start px-2'
          )}
          onClick={handleOpen}
          title="Dev Info"
          aria-label="Dev Info"
        >
          <Terminal className={cn('h-4 w-4', !collapsed && 'mr-2')} />
          {!collapsed ? 'Dev Info' : <span className="sr-only">Dev Info</span>}
        </Button>

        {mounted && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'flex min-w-0 items-center gap-1 rounded-md px-2 text-sidebar-foreground/60',
                    collapsed ? 'w-full justify-center' : 'shrink-0 justify-end'
                  )}
                  data-ai-id="sidebar-query-monitor-toggle"
                >
                  <Activity
                    className={cn(
                      'h-4 w-4 transition-colors',
                      queryMonitorEnabled ? 'text-primary animate-pulse' : 'text-sidebar-foreground/40'
                    )}
                  />
                  {!collapsed ? (
                    <Label htmlFor="query-monitor-sidebar-toggle" className="cursor-pointer text-xs font-medium">
                      Monitor
                    </Label>
                  ) : (
                    <span className="sr-only">Monitor de Queries</span>
                  )}
                  <Switch
                    id="query-monitor-sidebar-toggle"
                    checked={queryMonitorEnabled}
                    onCheckedChange={handleQueryMonitorToggle}
                    data-ai-id="query-monitor-toggle-switch"
                    className="scale-75"
                    disabled={ENV_QUERY_MONITOR}
                    aria-label="Monitor de Queries"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side={collapsed ? 'right' : 'top'}>
                <p className="text-xs">
                  {queryMonitorEnabled ? 'Desativar' : 'Ativar'} Monitor de Queries (Debug)
                </p>
                {ENV_QUERY_MONITOR && (
                  <p className="mt-1 text-xs text-amber-500">Habilitado via ENV</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

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
