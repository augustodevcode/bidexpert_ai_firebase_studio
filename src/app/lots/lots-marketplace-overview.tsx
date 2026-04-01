/**
 * @fileoverview Overview de taxonomia e confiança para a vitrine pública `/lots`.
 */

'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { GroupedLots } from '@/services/lot-card-v2.service';
import { buildLotsMarketplaceSignals } from './lots-marketplace-overview.utils';
import { FileSearch, Gavel, Landmark, Scale, ShieldCheck } from 'lucide-react';

interface LotsMarketplaceOverviewProps {
  grouped: GroupedLots;
}

const TRUST_ICONS = {
  'open-lots': Gavel,
  'process-traceability': Scale,
  'active-consignors': Landmark,
  'advanced-discovery': FileSearch,
} as const;

export function LotsMarketplaceOverview({ grouped }: LotsMarketplaceOverviewProps) {
  const signals = buildLotsMarketplaceSignals(grouped);

  return (
    <section
      data-ai-id="lots-marketplace-overview"
      aria-labelledby="lots-marketplace-overview-title"
      className="rounded-3xl border border-border bg-card/70 p-6 shadow-sm md:p-8"
    >
      <div className="space-y-3">
        <Badge variant="outline" className="w-fit border-primary/30 text-primary">
          <ShieldCheck className="mr-1 h-3.5 w-3.5" />
          Vitrine comparável aos grandes marketplaces
        </Badge>
        <div className="space-y-2">
          <h2
            id="lots-marketplace-overview-title"
            className="text-2xl font-semibold text-foreground md:text-3xl"
          >
            Explore por modalidade com contexto de confiança já na primeira dobra
          </h2>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
            BidExpert organiza a vitrine pública por modalidade, sinaliza rastreabilidade jurídica quando aplicável e mantém atalhos objetivos para aprofundar a decisão sem ruído visual.
          </p>
        </div>
      </div>

      <div
        data-ai-id="lots-marketplace-modality-grid"
        className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4"
      >
        {signals.modalityChips.map((chip) => (
          <a
            key={chip.id}
            href={chip.href}
            data-ai-id={`lots-marketplace-chip-${chip.id}`}
            className="rounded-2xl border border-border bg-background px-4 py-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{chip.label}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{chip.description}</p>
              </div>
              <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                {chip.count}
              </span>
            </div>
          </a>
        ))}
      </div>

      <div
        data-ai-id="lots-marketplace-trust-rail"
        className="mt-6 grid gap-3 lg:grid-cols-2 xl:grid-cols-4"
      >
        {signals.trustSignals.map((signal) => {
          const Icon = TRUST_ICONS[signal.id];

          return (
            <Link
              key={signal.id}
              href={signal.href}
              data-ai-id={`lots-marketplace-trust-${signal.id}`}
              className="rounded-2xl border border-border bg-muted/30 px-4 py-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{signal.title}</p>
                  <p className="text-xs leading-5 text-muted-foreground">{signal.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div
        data-ai-id="lots-marketplace-actions"
        className="mt-6 flex flex-col gap-3 sm:flex-row"
      >
        <Button asChild>
          <Link href="/search?type=lots">Refinar na busca completa</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/auction-safety-tips">Ler edital e dicas de segurança</Link>
        </Button>
      </div>
    </section>
  );
}