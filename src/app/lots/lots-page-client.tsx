/**
 * Client wrapper for the /lots page.
 * Renders category sections with the V2 card grid.
 */
'use client';

import BidExpertCard from '@/components/BidExpertCard';
import type { AuctionItem } from '@/components/cards/auction-lot-card-v2.types';
import type { GroupedLots } from '@/services/lot-card-v2.service';
import { LotsMarketplaceOverview } from './lots-marketplace-overview';

/* ------------------------------------------------------------------ */
/*  Section component                                                  */
/* ------------------------------------------------------------------ */

interface SectionProps {
  title: string;
  description: string;
  items: AuctionItem[];
  dataAiId: string;
  anchorId: string;
}

function Section({ title, description, items, dataAiId, anchorId }: SectionProps) {
  if (items.length === 0) return null;

  return (
    <section id={anchorId} data-ai-id={dataAiId} className="space-y-6 scroll-mt-24">
      <div className="flex items-center gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-foreground md:text-2xl">
              {title}
            </h2>
            <span
              aria-label={`${items.length} lotes`}
              className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-bold text-primary"
            >
              {items.length}
            </span>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className="flex h-full w-full justify-center">
            <BidExpertCard item={item} type="lot" />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Page client                                                        */
/* ------------------------------------------------------------------ */

interface LotsPageClientProps {
  grouped: GroupedLots;
}

export function LotsPageClient({ grouped }: LotsPageClientProps) {
  const totalLots =
    grouped.judicial.length +
    grouped.extrajudicial.length +
    grouped.vendaDireta.length +
    grouped.tomadaDePrecos.length;

  const hasNoLots = totalLots === 0;

  return (
    <main
      id="maincontent"
      data-ai-id="lots-page-main"
      className="mx-auto max-w-screen-2xl space-y-12 px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Page header */}
      <div data-ai-id="lots-page-header" className="space-y-2">
        <h1 data-ai-id="lots-page-heading" className="text-2xl font-bold text-foreground md:text-3xl">
          Lotes em Leilão
        </h1>
        <p className="text-sm text-muted-foreground">
          {hasNoLots
            ? 'Nenhum lote disponível no momento.'
            : `${totalLots} lotes encontrados em ${
                [
                  grouped.judicial.length > 0 && 'Judicial',
                  grouped.extrajudicial.length > 0 && 'Extrajudicial',
                  grouped.vendaDireta.length > 0 && 'Venda Direta',
                  grouped.tomadaDePrecos.length > 0 && 'Tomada de Preços',
                ]
                  .filter(Boolean)
                  .length
              } categorias`}
        </p>
      </div>

      <LotsMarketplaceOverview grouped={grouped} />

      {/* Category sections */}
      <Section
        title="Leilões Judiciais"
        description="Lotes com praça, cronograma e leitura jurídica mais explícita para decisões ancoradas em contexto processual."
        items={grouped.judicial}
        dataAiId="lots-section-judicial"
        anchorId="lots-judicial"
      />
      <Section
        title="Leilões Extrajudiciais"
        description="Operações privadas ou corporativas com cronograma visível, disputa organizada e leitura rápida de valor."
        items={grouped.extrajudicial}
        dataAiId="lots-section-extrajudicial"
        anchorId="lots-extrajudicial"
      />
      <Section
        title="Venda Direta"
        description="Compra imediata com preço objetivo, sem depender de dinâmica competitiva de praça."
        items={grouped.vendaDireta}
        dataAiId="lots-section-venda-direta"
        anchorId="lots-venda-direta"
      />
      <Section
        title="Tomada de Preços"
        description="Janela de propostas vinculantes para negociações comparativas e aquisição orientada por referência."
        items={grouped.tomadaDePrecos}
        dataAiId="lots-section-tomada-de-precos"
        anchorId="lots-tomada-de-precos"
      />

      {/* Empty state */}
      {hasNoLots && (
        <div
          data-ai-id="lots-empty-state"
          className="flex flex-col items-center gap-4 py-20 text-center"
        >
          <svg
            aria-hidden="true"
            className="h-16 w-16 text-muted-foreground/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <p className="text-lg font-medium text-muted-foreground">
            Nenhum lote disponível no momento
          </p>
          <p className="max-w-md text-sm text-muted-foreground/70">
            Novos lotes são adicionados regularmente. Volte em breve para
            conferir as oportunidades.
          </p>
        </div>
      )}
    </main>
  );
}
