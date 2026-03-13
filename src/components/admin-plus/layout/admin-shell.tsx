/**
 * @fileoverview Shell principal do Admin Plus.
 * Combina sidebar colapsável, header com breadcrumbs e área de conteúdo principal.
 * Provê estado de sidebar (aberto/fechado) via contexto e sincroniza com localStorage.
 */
'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { AdminPlusSidebar } from './admin-sidebar-plus';
import { AdminPlusHeader } from './admin-header-plus';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';

interface SidebarContextValue {
  isCollapsed: boolean;
  toggle: () => void;
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  isCollapsed: false,
  toggle: () => {},
  isMobileOpen: false,
  setMobileOpen: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

const SIDEBAR_STORAGE_KEY = 'admin-plus-sidebar-collapsed';

export function AdminPlusShell({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored === 'true') setIsCollapsed(true);
    } catch {
      // SSR or storage unavailable
    }
  }, []);

  const toggle = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SidebarContext.Provider value={{ isCollapsed, toggle, isMobileOpen, setMobileOpen }}>
        <div
          className="flex h-screen overflow-hidden bg-background"
          data-ai-id="admin-plus-shell"
        >
          {/* Desktop Sidebar */}
          <AdminPlusSidebar />

          {/* Main Area */}
          <div
            className={cn(
              'flex flex-1 flex-col overflow-hidden transition-all duration-200',
              isCollapsed ? 'md:ml-16' : 'md:ml-64',
            )}
            data-ai-id="admin-plus-main-area"
          >
            <AdminPlusHeader />
            <main
              className="flex-1 overflow-y-auto p-4 md:p-6"
              id="admin-plus-content"
              tabIndex={-1}
              data-ai-id="admin-plus-content"
            >
              {children}
            </main>
          </div>
        </div>
      </SidebarContext.Provider>
    </ThemeProvider>
  );
}
