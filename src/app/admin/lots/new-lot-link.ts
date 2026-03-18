/**
 * @fileoverview Helper para preservar o contexto da listagem ao abrir o formulário de novo lote.
 */

type NewLotLinkParams = {
  auctionId?: string | null;
  judicialProcessId?: string | null;
};

export function buildNewLotHref({ auctionId, judicialProcessId }: NewLotLinkParams): string {
  const query = new URLSearchParams();

  if (auctionId) {
    query.set('auctionId', auctionId);
  }

  if (judicialProcessId) {
    query.set('judicialProcessId', judicialProcessId);
  }

  const queryString = query.toString();
  return queryString ? `/admin/lots/new?${queryString}` : '/admin/lots/new';
}