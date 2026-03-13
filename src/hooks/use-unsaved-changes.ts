/**
 * @fileoverview Hook para detectar alterações não salvas e exibir confirmação
 * antes de sair da página (beforeunload + Next.js router events).
 */
'use client';

import { useEffect, useCallback, useRef } from 'react';

interface UseUnsavedChangesOptions {
  /** Whether the form currently has unsaved changes. */
  isDirty: boolean;
  /** Custom confirmation message (shown in some browsers). */
  message?: string;
}

export function useUnsavedChanges({
  isDirty,
  message = 'Existem alterações não salvas. Deseja realmente sair?',
}: UseUnsavedChangesOptions) {
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  // Warn on tab/window close
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) return;
      e.preventDefault();
      // Setting returnValue is required for the prompt to show in some browsers
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [message]);

  /** Manual confirmation gate — call before programmatic navigation. */
  const confirmLeave = useCallback(() => {
    if (!isDirtyRef.current) return true;
    return window.confirm(message);
  }, [message]);

  return { confirmLeave };
}
