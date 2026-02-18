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
      className="wrapper-sticky-bid-bar"
      data-ai-id="sticky-bid-bar"
    >
      <div className="container-sticky-bid-bar" data-ai-id="sticky-bid-container">
        <div className="wrapper-sticky-bid-info" data-ai-id="sticky-bid-info">
          <span className="text-sticky-bid-label">{displayPrice.label}</span>
          <span className="text-sticky-bid-value">
            R$ {displayPrice.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <Button
          onClick={handleClick}
          size="lg"
          className="btn-sticky-bid-action"
          data-ai-id="sticky-bid-button"
        >
          <Gavel className="icon-sticky-bid" />
          Fazer Lance
          <ChevronUp className="icon-sticky-bid-small" />
        </Button>
      </div>
    </div>
  );
}
