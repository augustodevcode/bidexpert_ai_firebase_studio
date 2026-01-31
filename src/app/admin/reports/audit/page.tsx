// src/app/admin/reports/audit/page.tsx
/**
 * @fileoverview Página do painel de auditoria de dados.
 * Exibe indicadores e listas de inconsistências com ações de correção.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAuditDataAction, type AuditData } from './actions';
import { useToast } from '@/hooks/use-toast';
import { AuditDashboardView } from './audit-view';

export default function AuditPage() {
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAuditDataAction();
      setAuditData(data);
    } catch (e: any) {
      toast({ title: 'Erro ao buscar dados de auditoria', description: e.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return <AuditDashboardView auditData={auditData} isLoading={isLoading} onRefresh={fetchData} />;
}
