/**
 * AuctionLotCardV2 — Dark brutalist auction lot card.
 * Ported from augustodevcode/BidExpertNovosCards, adapted for Next.js + BidExpert design system.
 * Uses Plus Jakarta Sans (body) and Space Grotesk (display) fonts via CSS vars.
 */
'use client';

import { useState, useCallback, Fragment, useEffect, useRef } from 'react';
import { Heart, Eye, Share2, ChevronLeft, ChevronRight, X, Facebook, MessageSquareText, Mail, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatCompact } from '@/lib/format';
import type { AuctionItem, AuctionCategory } from './auction-lot-card-v2.types';
import { useToast } from '@/hooks/use-toast';
import { isLotFavoriteInStorage, addFavoriteLot, removeFavoriteLot } from '@/lib/favorite-store';

/* ─── Helpers ─── */

function getStatusStyles(status: string) {
  switch (status) {
    case 'Em Andamento':
    case 'Aberto':
      return {
        dot: 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse',
        text: 'text-green-500',
        badge: 'bg-green-500 text-black',
        date: 'text-gray-200',
      };
    case 'Aguardando':
      return {
        dot: 'bg-yellow-500',
        text: 'text-yellow-500',
        badge: 'bg-yellow-500 text-black',
        date: 'text-gray-400',
      };
    case 'Encerrada':
    default:
      return {
        dot: 'bg-neutral-700',
        text: 'text-gray-400',
        badge: 'bg-neutral-800 text-gray-500',
        date: 'text-gray-500',
      };
  }
}

function getCategoryLabels(category: AuctionCategory) {
  switch (category) {
    case 'Judicial':
    case 'Extrajudicial':
      return { priceLabel: 'Lance Mínimo', ctaLabel: 'DAR LANCE', showIncrement: true };
    case 'Venda Direta':
      return { priceLabel: 'Valor de Venda', ctaLabel: 'COMPRAR', showIncrement: false };
    case 'Tomada de Preços':
      return { priceLabel: 'Valor de Referência', ctaLabel: 'ENVIAR PROPOSTA VINCULANTE', showIncrement: false };
  }
}

const hasTimeline = (cat: AuctionCategory) => cat === 'Judicial' || cat === 'Extrajudicial';

function getDisplayDiscountPercentage(
  minimumBid: number,
  evaluation: number,
  discountPercentage?: number,
): number | undefined {
  if (typeof discountPercentage === 'number' && Number.isFinite(discountPercentage) && discountPercentage > 0) {
    return Math.round(discountPercentage);
  }

  if (!Number.isFinite(minimumBid) || !Number.isFinite(evaluation) || minimumBid <= 0 || evaluation <= 0) {
    return undefined;
  }

  if (evaluation <= minimumBid) {
    return undefined;
  }

  const derivedPercentage = ((evaluation - minimumBid) / evaluation) * 100;
  return derivedPercentage > 0 ? Math.round(derivedPercentage) : undefined;
}

/* ─── Component ─── */

interface AuctionLotCardV2Props {
  item: AuctionItem;
  className?: string;
}

export default function AuctionLotCardV2({ item, className }: AuctionLotCardV2Props) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = item.images.length > 0 ? item.images : ['/images/placeholder-lot.webp'];
  const displayDiscountPercentage = getDisplayDiscountPercentage(
    item.pricing.minimumBid,
    item.pricing.evaluation,
    item.pricing.discountPercentage,
  );

  const [isFavorited, setIsFavorited] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [lotFullUrl, setLotFullUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(item.timeline.timeRemaining);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsFavorited(isLotFavoriteInStorage(item.id));
    if (typeof window !== 'undefined') {
      setLotFullUrl(`${window.location.origin}/lots/${item.id}`);
    }
  }, [item.id]);

  useEffect(() => {
    if (!item.timeline.endDate) return;
    const calculate = () => {
      const diff = new Date(item.timeline.endDate!).getTime() - Date.now();
      if (diff <= 0) { setCountdown('Encerrado'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      const ss = String(s).padStart(2, '0');
      setCountdown(d > 0 ? `${d}d ${hh}:${mm}:${ss}` : `${hh}:${mm}:${ss}`);
    };
    calculate();
    const id = setInterval(calculate, 1000);
    return () => clearInterval(id);
  }, [item.timeline.endDate]);

  useEffect(() => {
    if (!showShareMenu) return;
    const close = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showShareMenu]);

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !isFavorited;
    setIsFavorited(next);
    if (next) await addFavoriteLot(item.id);
    else await removeFavoriteLot(item.id);
    toast({
      title: next ? 'Adicionado aos Favoritos' : 'Removido dos Favoritos',
      description: `"${item.title}" foi ${next ? 'adicionado à' : 'removido da'} sua lista.`,
    });
  };

  const handleShareToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowShareMenu((p) => !p);
  };

  const getSocialLink = (platform: 'x' | 'facebook' | 'whatsapp' | 'email') => {
    const url = encodeURIComponent(lotFullUrl);
    const title = encodeURIComponent(item.title);
    switch (platform) {
      case 'x': return `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
      case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      case 'whatsapp': return `https://api.whatsapp.com/send?text=${title}%20${url}`;
      case 'email': return `mailto:?subject=${title}&body=${url}`;
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(lotFullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const prevImg = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setImgIdx((p) => (p === 0 ? images.length - 1 : p - 1));
    },
    [images.length],
  );
  const nextImg = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setImgIdx((p) => (p === images.length - 1 ? 0 : p + 1));
    },
    [images.length],
  );

  const { priceLabel, ctaLabel, showIncrement } = getCategoryLabels(item.category);

  const stage1Styles = getStatusStyles(item.timeline.stage1.status);
  const stage2Styles = item.timeline.stage2 ? getStatusStyles(item.timeline.stage2.status) : null;

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
      {/* ─── Top Media Section ─── */}
      <div
        className="relative h-[240px] w-full bg-neutral-800 shrink-0 overflow-hidden group"
        data-ai-id="card-v2-gallery"
      >
        <img
          src={images[imgIdx]}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Hover Actions Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 z-20">
          <button
            type="button"
            onClick={handleFavoriteToggle}
            className="w-12 h-12 bg-black/80 hover:bg-black text-white rounded-xl flex items-center justify-center backdrop-blur-md transition-colors border border-white/10"
            aria-label="Adicionar aos favoritos"
          >
            <Heart className={cn('w-5 h-5', isFavorited && 'fill-red-500 text-red-500')} />
          </button>
          <button
            type="button"
            onClick={() => { window.location.href = `/lots/${item.id}`; }}
            className="w-12 h-12 bg-black/80 hover:bg-black text-white rounded-xl flex items-center justify-center backdrop-blur-md transition-colors border border-white/10"
            aria-label="Ver detalhes"
          >
            <Eye className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleShareToggle}
            className="w-12 h-12 bg-black/80 hover:bg-black text-white rounded-xl flex items-center justify-center backdrop-blur-md transition-colors border border-white/10"
            aria-label="Compartilhar"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Consignor Logo — bottom-left with rich tooltip */}
        <div className="absolute bottom-3 left-3 z-30 group/comitente">
          <div className="w-14 h-14 rounded-full border-2 border-neutral-800 overflow-hidden bg-white shadow-lg">
            <img
              src={item.comitente?.logo || '/images/placeholder-logo.webp'}
              alt={item.comitente?.name || 'Comitente'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="absolute left-0 bottom-full mb-2 opacity-0 group-hover/comitente:opacity-100 transition-opacity duration-200 pointer-events-none group-hover/comitente:pointer-events-auto z-40 w-48">
            <div className="bg-neutral-900 text-white text-xs rounded-lg p-3 shadow-xl border border-white/10">
              <div className="font-bold mb-1">{item.comitente?.name || 'Comitente'}</div>
              <a
                href={item.comitente?.url || '#'}
                className="text-primary hover:underline block"
              >
                Mais produtos desse comitente
              </a>
              <div className="absolute -bottom-1 left-6 w-2 h-2 bg-neutral-900 border-b border-r border-white/10 transform rotate-45" />
            </div>
          </div>
        </div>
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevImg}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/80 text-white p-1.5 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-30"
              aria-label="Imagem anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextImg}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/80 text-white p-1.5 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-30"
              aria-label="Próxima imagem"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {item.isOpen && (
          <div className="absolute top-3 left-3 flex items-center bg-[#10A34F] px-4 py-1.5 rounded-full shadow-lg z-30">
            <span className="text-white text-[11px] font-bold uppercase tracking-wider">
              Aberto para Lances
            </span>
          </div>
        )}

        {item.isLive && (
          <div className="absolute top-3 right-3 flex items-center gap-2 bg-[#10A34F] px-4 py-1.5 rounded-full shadow-lg z-30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            <span className="text-white text-[11px] font-bold uppercase tracking-wider">AO VIVO</span>
          </div>
        )}

        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-bold text-white border border-white/10 z-30">
          {imgIdx + 1}/{images.length}
        </div>
      </div>

      <div className="p-4 pb-3" data-ai-id="card-v2-header">
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-md border border-primary/20 uppercase">
            {item.type}
          </span>
          <span data-ai-id="card-v2-location" className="text-gray-400 text-[10px] font-semibold uppercase tracking-tight truncate">
            {item.location}
          </span>
        </div>
        <h3
          className="font-[family-name:var(--font-card-display)] font-bold text-lg leading-tight mb-2 text-white line-clamp-2"
          data-ai-id="card-v2-title"
        >
          {item.title}
        </h3>
        <div className="flex items-center gap-2 mb-3 text-gray-400 font-bold text-xs flex-wrap">
          {(item.specs ?? []).map((spec, idx) => (
            <Fragment key={idx}>
              <span>{spec}</span>
              {idx < (item.specs?.length ?? 0) - 1 && (
                <span className="w-1 h-1 rounded-full bg-gray-600" aria-hidden="true" />
              )}
            </Fragment>
          ))}
        </div>
        {item.processNumber && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <a data-ai-id="card-v2-process-link" className="underline hover:text-primary transition-colors truncate" href={`/lots/${item.id}`}>
              Proc: {item.processNumber}
            </a>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 border-y border-neutral-800 bg-neutral-900/50" data-ai-id="card-v2-kpi">
        <div className="kpi-border py-3 flex flex-col items-center">
          <span className="text-gray-500 text-[9px] uppercase font-bold tracking-wider mb-0.5">Visitas</span>
          <span className="font-[family-name:var(--font-card-display)] text-sm font-bold text-white">
            {item.stats.visits}
          </span>
        </div>
        <div className="kpi-border py-3 flex flex-col items-center">
          <span className="text-gray-500 text-[9px] uppercase font-bold tracking-wider mb-0.5">Habilitados</span>
          <span className="font-[family-name:var(--font-card-display)] text-sm font-bold text-white">
            {item.stats.qualified}
          </span>
        </div>
        <div className="kpi-border py-3 flex flex-col items-center">
          <span className="text-gray-500 text-[9px] uppercase font-bold tracking-wider mb-0.5">Lances</span>
          <span className="font-[family-name:var(--font-card-display)] text-sm font-bold text-white">
            {item.stats.clicks}
          </span>
        </div>
      </div>

      <div className="p-4 bg-gradient-to-b from-[rgb(var(--color-card-surface))] to-black" data-ai-id="card-v2-pricing">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">
              {priceLabel}
            </span>
            <span className="text-primary font-[family-name:var(--font-card-display)] text-2xl font-bold leading-none">
              {formatCurrency(item.pricing.minimumBid)}
            </span>
            {showIncrement && item.pricing.increment != null && (
              <span className="block text-[10px] text-gray-400 mt-1">
                Incremento: {formatCurrency(item.pricing.increment)}
              </span>
            )}
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            {displayDiscountPercentage != null && displayDiscountPercentage > 0 && (
              <span className="bg-green-500/10 text-green-500 text-[10px] font-black px-2 py-1 rounded-md border border-green-500/20">
                {displayDiscountPercentage}% OFF
              </span>
            )}
            <div className="text-[10px] text-gray-500 font-medium">
              Avaliação: {formatCompact(item.pricing.evaluation)}
            </div>
          </div>
        </div>
      </div>

      {hasTimeline(item.category) && (
        <div className="px-5 py-4 bg-neutral-900/30 flex-grow" data-ai-id="card-v2-timeline">
          <div className="relative">
            <div className="absolute left-1.5 top-1 bottom-1 w-[1px] bg-neutral-800" />

            <div
              className={cn(
                'relative pl-7',
                item.timeline.stage2 && 'mb-4',
                item.timeline.stage1.status === 'Encerrada' && 'opacity-50',
              )}
            >
              <div
                className={cn(
                  'absolute left-0 top-1 w-3.5 h-3.5 rounded-full border-2 border-[rgb(var(--color-card-surface))] flex items-center justify-center',
                  stage1Styles.dot,
                )}
              >
                {item.timeline.stage1.status === 'Encerrada' && (
                  <svg className="w-2 h-2 text-neutral-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                )}
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className={cn('text-xs font-bold uppercase tracking-tight', stage1Styles.text)}>
                  {item.timeline.stage1.name}
                </span>
                <span className={cn('text-[9px] px-1.5 py-0.5 rounded-sm uppercase font-bold', stage1Styles.badge)}>
                  {item.timeline.stage1.status}
                </span>
              </div>
              <div className={cn('text-[10px] font-medium', stage1Styles.date)}>
                {item.timeline.stage1.date}
              </div>
            </div>

            {item.timeline.stage2 && stage2Styles && (
              <div
                className={cn(
                  'relative pl-7',
                  item.timeline.stage2.status === 'Encerrada' && 'opacity-50',
                )}
              >
                <div
                  className={cn(
                    'absolute left-0 top-1 w-3.5 h-3.5 rounded-full border-2 border-[rgb(var(--color-card-surface))] flex items-center justify-center',
                    stage2Styles.dot,
                  )}
                >
                  {item.timeline.stage2.status === 'Encerrada' && (
                    <svg className="w-2 h-2 text-neutral-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                    </svg>
                  )}
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className={cn('text-xs font-bold uppercase tracking-tight', stage2Styles.text)}>
                    {item.timeline.stage2.name}
                  </span>
                  <span className={cn('text-[9px] px-1.5 py-0.5 rounded-sm uppercase font-bold', stage2Styles.badge)}>
                    {item.timeline.stage2.status}
                  </span>
                </div>
                <div className={cn('text-[11px] font-semibold leading-tight', stage2Styles.date)}>
                  {item.timeline.stage2.date}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div
        className="px-4 py-3 flex items-center justify-between border-t border-neutral-800 bg-black/20 mt-auto"
        data-ai-id="card-v2-urgency"
      >
        <div className="flex items-center gap-3">
          <div className="animate-pulse-fast text-primary">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide leading-none mb-1">
              Termina em
            </span>
            <span className="font-[family-name:var(--font-card-display)] font-bold text-sm text-primary">
              {countdown}
            </span>
          </div>
        </div>
        {item.stats.visits > 0 && (
          <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1.5">
            <span className="inline-flex w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" aria-hidden="true" />
            {item.stats.visits} olhando
          </span>
        )}
      </div>

      <div className="p-4 pt-2 flex gap-3" data-ai-id="card-v2-actions">
        <a
          href={`/lots/${item.id}`}
          className="flex-[2] bg-primary hover:bg-orange-600 transition-all text-black font-[family-name:var(--font-card-display)] font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_0_0_rgba(154,52,18,1)] active:translate-y-[2px] active:shadow-[0_2px_0_0_rgba(154,52,18,1)] text-xs sm:text-sm tracking-wide leading-tight text-center"
          data-ai-id="card-v2-cta"
        >
          {ctaLabel}
          <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path clipRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" fillRule="evenodd" />
          </svg>
        </a>
        <div className="relative flex-1" ref={shareMenuRef}>
          <button
            type="button"
            onClick={handleShareToggle}
            className="w-full h-full brutalist-border rounded-xl flex items-center justify-center hover:bg-neutral-800 transition-colors py-3.5"
            aria-label="Compartilhar este lote"
          >
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>
          {showShareMenu && (
            <div
              className="absolute bottom-full right-0 mb-2 w-48 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden z-50"
              role="menu"
            >
              <a href={getSocialLink('x')} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-gray-300 hover:bg-neutral-800 hover:text-white transition-colors" role="menuitem">
                <X className="h-4 w-4" /> Compartilhar no X
              </a>
              <a href={getSocialLink('facebook')} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-gray-300 hover:bg-neutral-800 hover:text-white transition-colors" role="menuitem">
                <Facebook className="h-4 w-4" /> Facebook
              </a>
              <a href={getSocialLink('whatsapp')} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-gray-300 hover:bg-neutral-800 hover:text-white transition-colors" role="menuitem">
                <MessageSquareText className="h-4 w-4" /> WhatsApp
              </a>
              <a href={getSocialLink('email')} className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-gray-300 hover:bg-neutral-800 hover:text-white transition-colors" role="menuitem">
                <Mail className="h-4 w-4" /> Email
              </a>
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-gray-300 hover:bg-neutral-800 hover:text-white transition-colors border-t border-neutral-700"
                role="menuitem"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Link copiado!' : 'Copiar link'}
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleFavoriteToggle}
          className="flex-1 brutalist-border rounded-xl flex items-center justify-center hover:bg-neutral-800 transition-colors"
          aria-label="Adicionar aos favoritos"
        >
          <Heart className={cn('h-5 w-5', isFavorited ? 'fill-red-500 text-red-500' : 'text-red-500')} />
        </button>
      </div>
    </article>
  );
}
