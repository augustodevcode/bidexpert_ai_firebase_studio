/**
 * @file Ação de ajuda de seção para administradores.
 * @description Exibe botão de ajuda com tooltip; deve ser usado dentro de guardas de permissão.
 */
'use client';

import dynamic from 'next/dynamic';
import { HelpCircle } from 'lucide-react';

interface AdminSectionHelpProps {
  message: string;
}

const AdminSectionHelpTooltipContent = dynamic(
  () => import('@/components/admin/admin-section-help-tooltip-content'),
  { ssr: false }
);

export default function AdminSectionHelp({ message }: AdminSectionHelpProps) {
  return (
    <AdminSectionHelpTooltipContent message={message}>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Explicação da regra desta seção"
        data-ai-id="admin-section-help-button"
      >
        <HelpCircle className="h-4 w-4" aria-hidden="true" />
      </button>
    </AdminSectionHelpTooltipContent>
  );
}
