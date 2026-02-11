/**
 * @fileoverview Sticky Mobile Bid Bar - GAP 3.2
 * Barra fixa na parte inferior do mobile que mostra preço atual
 * e botão para fazer lance, visível durante scroll.
 */
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Gavel, ChevronUp } from 'lucide-react';
import type { Lot, Auction } from '@/types';
import { getLotDisplayPrice } from '@/lib/ui-helpers';

interface StickyBidBarProps {
  lot: Lot;
  auction?: Auction;
  onBidClick?: () => void;
  isOpen?: boolean;
}

export default function StickyBidBar({ lot, auction, onBidClick, isOpen }: StickyBidBarProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling down 300px
      setIsVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible || lot.status !== 'ABERTO_PARA_LANCES') return null;

  const displayPrice = getLotDisplayPrice(lot, auction);

  const handleClick = () => {
    if (onBidClick) {
      onBidClick();
    } else {
      // Scroll to bidding panel
      const biddingPanel = document.querySelector('[data-ai-id="bidding-panel"]') || document.querySelector('[data-testid="bidding-panel"]');
      if (biddingPanel) {
        biddingPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/95 backdrop-blur-sm border-t shadow-lg px-4 py-3 animate-in slide-in-from-bottom-4 duration-300"
      data-ai-id="sticky-bid-bar"
    >
      <div className="flex items-center justify-between max-w-lg mx-auto gap-4">
        <div className="flex flex-col min-w-0">
          <span className="text-xs text-muted-foreground truncate">{displayPrice.label}</span>
          <span className="text-lg font-bold text-primary font-mono tabular-nums">
            R$ {displayPrice.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <Button
          onClick={handleClick}
          size="lg"
          className="bg-green-600 hover:bg-green-700 text-white shrink-0 gap-2"
          data-ai-id="sticky-bid-button"
        >
          <Gavel className="h-4 w-4" />
          Fazer Lance
          <ChevronUp className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
