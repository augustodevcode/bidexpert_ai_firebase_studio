/**
 * AuctionLotCardV2 — Dark brutalist auction lot card.
 * Ported from augustodevcode/BidExpertNovosCards, adapted for Next.js + BidExpert design system.
 * Uses Plus Jakarta Sans (body) and Space Grotesk (display) fonts via CSS vars.
 */
'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart,
  Eye,
  Share2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  BarChart3,
  Users,
  MousePointerClick,
  Clock,
  ArrowUpRight,
  ThumbsUp,
  Bookmark,
  Gavel,
  ShoppingCart,
  FileText,
  Percent,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatCompact } from '@/lib/format';
import type { AuctionItem, AuctionCategory } from './auction-lot-card-v2.types';

/* ─── Helpers ─── */

function getStatusStyles(status: string) {
  switch (status) {
    case 'Em Andamento':
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' };
    case 'Aguardando':
      return { bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400' };
    case 'Encerrada':
      return { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-400' };
    default:
      return { bg: 'bg-neutral-500/20', text: 'text-neutral-400', dot: 'bg-neutral-400' };
  }
}

function getCategoryLabels(category: AuctionCategory) {
  switch (category) {
    case 'Judicial':
    case 'Extrajudicial':
      return { priceLabel: 'Lance Mínimo', ctaLabel: 'DAR LANCE', CtaIcon: Gavel };
    case 'Venda Direta':
      return { priceLabel: 'Valor de Venda', ctaLabel: 'COMPRAR', CtaIcon: ShoppingCart };
    case 'Tomada de Preços':
      return { priceLabel: 'Valor de Referência', ctaLabel: 'ENVIAR PROPOSTA VINCULANTE', CtaIcon: FileText };
  }
}

const hasTimeline = (cat: AuctionCategory) => cat === 'Judicial' || cat === 'Extrajudicial';

/* ─── Component ─── */

interface AuctionLotCardV2Props {
  item: AuctionItem;
  className?: string;
}

export default function AuctionLotCardV2({ item, className }: AuctionLotCardV2Props) {
  const [imgIdx, setImgIdx] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const images = item.images.length > 0 ? item.images : ['/images/placeholder-lot.webp'];

  const prevImg = useCallback(() => setImgIdx((p) => (p === 0 ? images.length - 1 : p - 1)), [images.length]);
  const nextImg = useCallback(() => setImgIdx((p) => (p === images.length - 1 ? 0 : p + 1)), [images.length]);

  const { priceLabel, ctaLabel, CtaIcon } = getCategoryLabels(item.category);

  return (
    <article
      data-ai-id="auction-lot-card-v2"
      data-lot-id={item.id}
      className={cn(
        'w-full max-w-[380px] card-v2-surface brutalist-border rounded-2xl overflow-hidden shadow-2xl flex flex-col',
        'font-[family-name:var(--font-card-sans)]',
        className,
      )}
    >
      {/* ─── Image Gallery ─── */}
      <Link href={`/lots/${item.id}`} className="relative group" data-ai-id="card-v2-gallery">
        <div className="relative overflow-hidden aspect-video">
          <Image
            src={images[imgIdx]}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Hover actions */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-4 left-4 flex gap-2">
              <button
                type="button"
                onClick={() => setIsFav(!isFav)}
                className={cn(
                  'p-2 rounded-full backdrop-blur-sm transition-all',
                  isFav ? 'bg-red-500/80 text-white' : 'bg-white/10 text-white hover:bg-white/20',
                )}
                aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <Heart className={cn('w-4 h-4', isFav && 'fill-current')} />
              </button>
              <button
                type="button"
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition-all"
                aria-label="Ver detalhes"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition-all"
                aria-label="Compartilhar"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Gallery nav */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevImg}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Imagem anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextImg}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Próxima imagem"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {item.isOpen && (
            <span className="bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse-fast" />
              Aberto para Lances
            </span>
          )}
          {item.isLive && (
            <span className="bg-red-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse-fast" />
              AO VIVO
            </span>
          )}
        </div>
        {/* Discount badge — mental trigger */}
        {item.pricing.discountPercentage != null && item.pricing.discountPercentage > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-emerald-500/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm z-10" data-ai-id="card-v2-discount-badge">
            <Percent className="w-3 h-3" aria-hidden="true" />
            {item.pricing.discountPercentage}% OFF
          </div>
        )}
        {/* Image counter */}
        <div className="absolute bottom-3 right-3 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
          {imgIdx + 1}/{images.length}
        </div>

        {/* Comitente logo */}
        {item.comitente && (
          <div className="absolute top-3 right-3 group/tooltip">
            <img
              src={item.comitente.logo}
              alt={item.comitente.name}
              className="w-8 h-8 rounded-full border border-white/20 bg-white object-contain"
              loading="lazy"
            />
            <div className="absolute right-0 top-full mt-1 bg-neutral-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {item.comitente.name}
            </div>
          </div>
        )}
      </Link>

      {/* ─── Header ─── */}
      <div className="p-4 space-y-2" data-ai-id="card-v2-header">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
            {item.category}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-neutral-400" data-ai-id="card-v2-location">
            <MapPin className="w-3 h-3" />
            {item.location}
          </span>
        </div>
        <h3 className="text-sm font-bold text-white leading-tight line-clamp-2 font-[family-name:var(--font-card-display)]" data-ai-id="card-v2-title">
          {item.title}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {(item.specs ?? []).map((spec) => (
            <span key={spec} className="text-[10px] text-neutral-400 bg-neutral-800/50 px-2 py-0.5 rounded-full">
              {spec}
            </span>
          ))}
        </div>
        {item.processNumber && (
          <p className="text-[10px] text-neutral-500 truncate">Proc: {item.processNumber}</p>
        )}
      </div>

      {/* ─── KPI row ─── */}
      <div className="grid grid-cols-3 border-t border-neutral-800" data-ai-id="card-v2-kpi">
        <div className="kpi-border flex flex-col items-center py-2.5 gap-0.5">
          <BarChart3 className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
          <span className="text-xs font-bold text-white">{formatCompact(item.stats.visits)}</span>
          <span className="text-[9px] text-neutral-500 uppercase tracking-wider">Visitas</span>
        </div>
        <div className="kpi-border flex flex-col items-center py-2.5 gap-0.5">
          <Users className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
          <span className="text-xs font-bold text-white">{formatCompact(item.stats.qualified)}</span>
          <span className="text-[9px] text-neutral-500 uppercase tracking-wider">Habilitados</span>
        </div>
        <div className="kpi-border flex flex-col items-center py-2.5 gap-0.5">
          <MousePointerClick className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />
          <span className="text-xs font-bold text-white">{formatCompact(item.stats.clicks)}</span>
          <span className="text-[9px] text-neutral-500 uppercase tracking-wider">Lances</span>
        </div>
      </div>

      {/* ─── Pricing ─── */}
      <div className="p-4 bg-gradient-to-br from-orange-500/5 to-transparent" data-ai-id="card-v2-pricing">
        {/* Evaluation with strikethrough anchoring */}
        {item.pricing.evaluation > 0 && item.pricing.discountPercentage != null && item.pricing.discountPercentage > 0 && (
          <p className="text-card-v2-evaluation mb-1" data-ai-id="card-v2-evaluation">
            Avaliação: <span className="line-through">{formatCurrency(item.pricing.evaluation)}</span>
          </p>
        )}
        <span className="text-[10px] text-neutral-400 uppercase tracking-wider">{priceLabel}</span>
        <p className="text-xl font-bold text-orange-400 font-[family-name:var(--font-card-display)] mt-0.5">
          {formatCurrency(item.pricing.minimumBid)}
        </p>
        <div className="flex items-center gap-3 mt-2">
          {item.pricing.increment != null && (
            <span className="text-[10px] text-neutral-400">
              Incremento: <span className="text-white font-medium">{formatCurrency(item.pricing.increment)}</span>
            </span>
          )}
          {item.pricing.discountPercentage != null && item.pricing.discountPercentage > 0 && (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Percent className="w-2.5 h-2.5" aria-hidden="true" />
              {item.pricing.discountPercentage}% OFF
            </span>
          )}
        </div>
        {/* Show plain evaluation when no discount */}
        {(item.pricing.discountPercentage == null || item.pricing.discountPercentage === 0) && item.pricing.evaluation > 0 && (
          <p className="text-[10px] text-neutral-500 mt-1">
            Avaliação: <span className="text-neutral-300">{formatCurrency(item.pricing.evaluation)}</span>
          </p>
        )}
      </div>

      {/* ─── Timeline (Judicial / Extrajudicial only) ─── */}
      {hasTimeline(item.category) && (
        <div className="px-4 pb-3" data-ai-id="card-v2-timeline">
          <div className="flex items-start gap-3">
            {/* Vertical line */}
            <div className="flex flex-col items-center gap-0.5 pt-1">
              <span className={cn('w-2 h-2 rounded-full', getStatusStyles(item.timeline.stage1.status).dot)} />
              <span className="w-px h-5 bg-neutral-700" />
              {item.timeline.stage2 && (
                <span className={cn('w-2 h-2 rounded-full', getStatusStyles(item.timeline.stage2.status).dot)} />
              )}
            </div>
            {/* Stages */}
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-white truncate">{item.timeline.stage1.name}</p>
                  <p className="text-[9px] text-neutral-500">{item.timeline.stage1.date}</p>
                </div>
                <span
                  className={cn(
                    'text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap',
                    getStatusStyles(item.timeline.stage1.status).bg,
                    getStatusStyles(item.timeline.stage1.status).text,
                  )}
                >
                  {item.timeline.stage1.status}
                </span>
              </div>
              {item.timeline.stage2 && (
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-white truncate">{item.timeline.stage2.name}</p>
                    <p className="text-[9px] text-neutral-500">{item.timeline.stage2.date}</p>
                  </div>
                  <span
                    className={cn(
                      'text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap',
                      getStatusStyles(item.timeline.stage2.status).bg,
                      getStatusStyles(item.timeline.stage2.status).text,
                    )}
                  >
                    {item.timeline.stage2.status}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Urgency ─── */}
      <div className="px-4 pb-3 flex items-center gap-2" data-ai-id="card-v2-urgency">
        <Clock className="w-3.5 h-3.5 text-orange-400 animate-pulse-fast" aria-hidden="true" />
        <span className="text-[10px] text-neutral-300 font-medium">{item.timeline.timeRemaining}</span>
      </div>

      {/* ─── CTA + actions ─── */}
      <div className="p-4 pt-0 mt-auto flex flex-col gap-2" data-ai-id="card-v2-actions">
        <Link
          href={`/lots/${item.id}`}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25 active:scale-[0.98]"
          data-ai-id="card-v2-cta"
        >
          <CtaIcon className="w-4 h-4" aria-hidden="true" />
          {ctaLabel}
          <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
        <div className="flex justify-center gap-4">
          <button
            type="button"
            className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white transition-colors"
            aria-label="Compartilhar este lote"
          >
            <Share2 className="w-3.5 h-3.5" /> Compartilhar
          </button>
          <button
            type="button"
            className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white transition-colors"
            aria-label="Votar neste lote"
          >
            <ThumbsUp className="w-3.5 h-3.5" /> Votar
          </button>
          <button
            type="button"
            onClick={() => setIsFav(!isFav)}
            className={cn(
              'flex items-center gap-1 text-[10px] transition-colors',
              isFav ? 'text-orange-400' : 'text-neutral-400 hover:text-white',
            )}
            aria-label={isFav ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
          >
            <Bookmark className={cn('w-3.5 h-3.5', isFav && 'fill-current')} />
            {isFav ? 'Salvo' : 'Salvar'}
          </button>
        </div>
      </div>
    </article>
  );
}
