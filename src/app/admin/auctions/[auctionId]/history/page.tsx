// src/app/admin/auctions/[auctionId]/history/page.tsx
// Página para exibir histórico de um leilão
// URL: /admin/auctions/123/history

import { AuditTimeline } from '@/components/audit/audit-timeline';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AuctionHistoryPage({
  params,
}: {
  params: { auctionId: string };
}) {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href={`/admin/auctions/${params.auctionId}/edit`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Edição
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Histórico de Alterações</h1>
        <p className="text-muted-foreground mt-2">
          Veja todas as mudanças feitas neste leilão
        </p>
      </div>

      <AuditTimeline 
        entityType="Auction" 
        entityId={params.auctionId} 
      />
    </div>
  );
}
