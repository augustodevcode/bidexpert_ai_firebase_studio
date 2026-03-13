/**
 * @fileoverview Sidebar de navegação do Admin Plus.
 * Gera automaticamente os links de entidade a partir do ENTITY_REGISTRY,
 * agrupados por EntityGroup, com ícones Lucide dinâmicos e indicador de rota ativa.
 * Suporta collapse/expand em desktop e Sheet em mobile.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as LucideIcons from 'lucide-react';
import { PanelLeftClose, PanelLeft, LayoutDashboard, type LucideIcon } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ADMIN_PLUS_BASE_PATH,
  ENTITY_GROUP_LABELS,
  ENTITY_GROUP_ORDER,
  getEntitiesByGroup,
} from '@/lib/admin-plus/constants';
import type { EntityConfig, EntityGroup } from '@/lib/admin-plus/types';
import { useSidebar } from './admin-shell';

/** Resolve o nome de ícone (string) para o componente Lucide correspondente. */
function getIcon(name: string): LucideIcon {
  const icon = (LucideIcons as Record<string, unknown>)[name];
  if (typeof icon === 'function') return icon as LucideIcon;
  return LucideIcons.HelpCircle;
}

interface NavItemProps {
  entity: EntityConfig;
  pathname: string;
  collapsed: boolean;
  onLinkClick?: () => void;
}

function NavItem({ entity, pathname, collapsed, onLinkClick }: NavItemProps) {
  const href = `${ADMIN_PLUS_BASE_PATH}/${entity.slug}`;
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  const Icon = getIcon(entity.icon);

  const linkContent = (
    <Button
      variant={isActive ? 'secondary' : 'ghost'}
      className={cn(
        'w-full text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-9 text-sm',
        collapsed ? 'justify-center px-2' : 'justify-start',
        isActive &&
          'bg-sidebar-primary text-sidebar-primary-foreground font-semibold hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground',
      )}
      asChild
      onClick={onLinkClick}
      data-ai-id={`admin-plus-nav-${entity.slug}`}
    >
      <Link href={href}>
        <Icon className={cn('h-4 w-4', !collapsed && 'mr-2')} aria-hidden="true" />
        {!collapsed && <span className="truncate">{entity.labelPlural}</span>}
      </Link>
    </Button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right">{entity.labelPlural}</TooltipContent>
      </Tooltip>
    );
  }
  return linkContent;
}

function SidebarContent({ collapsed, onLinkClick }: { collapsed: boolean; onLinkClick?: () => void }) {
  const pathname = usePathname();
  const entitiesByGroup = getEntitiesByGroup();

  const dashboardHref = `${ADMIN_PLUS_BASE_PATH}/dashboard`;
  const isDashboardActive = pathname === dashboardHref;

  const defaultOpenGroups = ENTITY_GROUP_ORDER.filter((group) => {
    const entities = entitiesByGroup.get(group);
    return entities?.some((e) => pathname.startsWith(`${ADMIN_PLUS_BASE_PATH}/${e.slug}`));
  });

  return (
    <>
      {/* Logo */}
      <div className={cn('border-b border-sidebar-border', collapsed ? 'p-2' : 'p-4')}>
        <Link
          href={dashboardHref}
          className="flex items-center space-x-2"
          data-ai-id="admin-plus-logo"
        >
          <Image src="/logo.svg" alt="BidExpert Logo" width={collapsed ? 32 : 40} height={collapsed ? 32 : 40} />
          {!collapsed && (
            <span className="font-bold text-xl text-sidebar-foreground">
              Admin<span className="text-primary">+</span>
            </span>
          )}
        </Link>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-1" aria-label="Admin Plus Navigation">
          {/* Dashboard */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isDashboardActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-center px-2 text-sidebar-foreground/80 hover:bg-sidebar-accent h-9',
                    isDashboardActive &&
                      'bg-sidebar-primary text-sidebar-primary-foreground font-semibold',
                  )}
                  asChild
                  onClick={onLinkClick}
                  data-ai-id="admin-plus-nav-dashboard"
                >
                  <Link href={dashboardHref}>
                    <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Dashboard</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant={isDashboardActive ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent h-9 text-sm',
                isDashboardActive &&
                  'bg-sidebar-primary text-sidebar-primary-foreground font-semibold',
              )}
              asChild
              onClick={onLinkClick}
              data-ai-id="admin-plus-nav-dashboard"
            >
              <Link href={dashboardHref}>
                <LayoutDashboard className="mr-2 h-4 w-4" aria-hidden="true" />
                Dashboard
              </Link>
            </Button>
          )}

          {/* Entity groups */}
          {collapsed ? (
            /* In collapsed mode, show flat icon list separated by thin dividers */
            ENTITY_GROUP_ORDER.map((group) => {
              const entities = entitiesByGroup.get(group);
              if (!entities?.length) return null;
              return (
                <div key={group} className="pt-2 border-t border-sidebar-border first:border-0 space-y-1">
                  {entities.map((entity) => (
                    <NavItem key={entity.slug} entity={entity} pathname={pathname} collapsed onLinkClick={onLinkClick} />
                  ))}
                </div>
              );
            })
          ) : (
            <Accordion type="multiple" className="w-full" defaultValue={defaultOpenGroups}>
              {ENTITY_GROUP_ORDER.map((group) => {
                const entities = entitiesByGroup.get(group);
                if (!entities?.length) return null;
                return (
                  <AccordionItem key={group} value={group} className="border-b-0">
                    <AccordionTrigger
                      className="text-xs font-semibold uppercase text-muted-foreground hover:no-underline rounded-md px-3 py-2 hover:bg-sidebar-accent"
                      data-ai-id={`admin-plus-group-${group}`}
                    >
                      {ENTITY_GROUP_LABELS[group]}
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 space-y-0.5 pl-2">
                      {entities.map((entity) => (
                        <NavItem key={entity.slug} entity={entity} pathname={pathname} collapsed={false} onLinkClick={onLinkClick} />
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </nav>
      </ScrollArea>

      {/* Back to Admin V1 link */}
      <div className={cn('border-t border-sidebar-border', collapsed ? 'p-1' : 'p-2')}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="w-full" asChild data-ai-id="admin-plus-back-v1">
                <Link href="/admin/dashboard">
                  <PanelLeft className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Voltar ao Admin V1</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
            asChild
            data-ai-id="admin-plus-back-v1"
          >
            <Link href="/admin/dashboard">
              <PanelLeft className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              Voltar ao Admin V1
            </Link>
          </Button>
        )}
      </div>
    </>
  );
}

export function AdminPlusSidebar() {
  const { isCollapsed, toggle, isMobileOpen, setMobileOpen } = useSidebar();

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[280px] p-0 flex flex-col bg-sidebar text-sidebar-foreground md:hidden"
          data-ai-id="admin-plus-sidebar-mobile"
        >
          <SidebarContent collapsed={false} onLinkClick={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex-col bg-sidebar border-r border-sidebar-border hidden md:flex transition-all duration-200',
          isCollapsed ? 'w-16' : 'w-64',
        )}
        data-ai-id="admin-plus-sidebar-desktop"
      >
        <SidebarContent collapsed={isCollapsed} />
        {/* Collapse toggle */}
        <div className="absolute -right-3 top-7 z-40">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6 rounded-full border bg-background shadow-sm"
            onClick={toggle}
            data-ai-id="admin-plus-sidebar-toggle"
          >
            <PanelLeftClose
              className={cn('h-3.5 w-3.5 transition-transform', isCollapsed && 'rotate-180')}
              aria-hidden="true"
            />
            <span className="sr-only">{isCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}</span>
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
