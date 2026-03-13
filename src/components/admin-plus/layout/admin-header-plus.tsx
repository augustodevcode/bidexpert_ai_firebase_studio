/**
 * @fileoverview Header do Admin Plus.
 * Inclui breadcrumbs derivados da URL, toggle de sidebar mobile,
 * busca global (Cmd+K), ThemeToggle e UserNav.
 */
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Menu,
  Search,
  ChevronRight,
  LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import UserNav from '@/components/layout/user-nav';
import { ADMIN_PLUS_BASE_PATH, getEntityConfig } from '@/lib/admin-plus/constants';
import type { BreadcrumbItem } from '@/lib/admin-plus/types';
import { useSidebar } from './admin-shell';
import { cn } from '@/lib/utils';

function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [
    { label: 'Admin Plus', href: `${ADMIN_PLUS_BASE_PATH}/dashboard` },
  ];

  const withoutBase = pathname.replace(ADMIN_PLUS_BASE_PATH, '').replace(/^\//, '');
  if (!withoutBase || withoutBase === 'dashboard') return crumbs;

  const segments = withoutBase.split('/');
  const entitySlug = segments[0];
  const entityConfig = getEntityConfig(entitySlug);

  if (entityConfig) {
    crumbs.push({
      label: entityConfig.labelPlural,
      href: `${ADMIN_PLUS_BASE_PATH}/${entitySlug}`,
    });

    if (segments[1] === 'new') {
      crumbs.push({ label: `Novo ${entityConfig.label}` });
    } else if (segments[1]) {
      crumbs.push({ label: `Editar ${entityConfig.label}` });
    }
  } else {
    // Non-entity page (e.g., dashboard, settings)
    crumbs.push({ label: segments[0].charAt(0).toUpperCase() + segments[0].slice(1) });
  }

  return crumbs;
}

export function AdminPlusHeader() {
  const { setMobileOpen, isCollapsed } = useSidebar();
  const pathname = usePathname();
  const breadcrumbs = buildBreadcrumbs(pathname);

  return (
    <header
      className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4"
      data-ai-id="admin-plus-header"
    >
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setMobileOpen(true)}
        data-ai-id="admin-plus-mobile-menu"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">Abrir menu</span>
      </Button>

      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="hidden md:flex items-center text-sm text-muted-foreground"
        data-ai-id="admin-plus-breadcrumbs"
      >
        <Link
          href={`${ADMIN_PLUS_BASE_PATH}/dashboard`}
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
        {breadcrumbs.slice(1).map((crumb, idx) => (
          <span key={idx} className="flex items-center">
            <ChevronRight className="mx-1.5 h-3.5 w-3.5 text-muted-foreground/50" aria-hidden="true" />
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Right side actions */}
      <div className="ml-auto flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="hidden md:flex items-center text-muted-foreground"
          data-ai-id="admin-plus-search-trigger"
        >
          <Search className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-xs">Buscar...</span>
          <kbd className="pointer-events-none ml-3 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        <Separator orientation="vertical" className="h-6 hidden md:block" />

        <ThemeToggle />

        <UserNav />
      </div>
    </header>
  );
}
