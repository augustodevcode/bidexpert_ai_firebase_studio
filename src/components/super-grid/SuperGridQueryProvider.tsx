/**
 * @fileoverview Provider do TanStack Query para o SuperGrid.
 * Wrapper isolado que cria seu próprio QueryClient sem necessidade
 * de alterar o layout global da aplicação. Detecta se já existe
 * um QueryClient pai e reutiliza quando possível.
 */
'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';

interface SuperGridQueryProviderProps {
  children: React.ReactNode;
}

function InnerProvider({ children }: SuperGridQueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

/** Detecta se já existe um QueryClientProvider pai e evita re-wrapping */
export function SuperGridQueryProvider({ children }: SuperGridQueryProviderProps) {
  try {
    // Se já existe um QueryClient no contexto, não precisamos criar outro
    const existing = useQueryClient();
    if (existing) {
      return <>{children}</>;
    }
  } catch {
    // Sem provider pai — vamos criar um novo
  }

  return <InnerProvider>{children}</InnerProvider>;
}
