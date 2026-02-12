/**
 * @fileoverview Provider de ações flutuantes para páginas públicas.
 * Permite que páginas registrem ações contextuais (ex.: "Editar") que serão exibidas
 * no menu lateral flutuante global.
 */

'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

export type FloatingAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  onSelect?: () => void;
  dataAiId?: string;
};

type FloatingActionsContextValue = {
  pageActions: FloatingAction[];
  setPageActions: (actions: FloatingAction[]) => void;
};

const FloatingActionsContext = createContext<FloatingActionsContextValue | null>(null);

export function FloatingActionsProvider({ children }: { children: React.ReactNode }) {
  const [pageActions, setPageActionsState] = useState<FloatingAction[]>([]);

  const setPageActions = useCallback((actions: FloatingAction[]) => {
    setPageActionsState(actions);
  }, []);

  const value = useMemo(
    () => ({
      pageActions,
      setPageActions,
    }),
    [pageActions, setPageActions]
  );

  return <FloatingActionsContext.Provider value={value}>{children}</FloatingActionsContext.Provider>;
}

export function useFloatingActions() {
  const ctx = useContext(FloatingActionsContext);
  if (!ctx) {
    throw new Error('useFloatingActions must be used within FloatingActionsProvider');
  }
  return ctx;
}
