
'use client';

import { useState, useEffect } from 'react';
import type { Auction, Lot } from '@/types';
import CurrentLotDisplay from '@/components/auction/current-lot-display';
import BiddingPanel from '@/components/auction/bidding-panel';
import UpcomingLotsPanel from '@/components/auction/upcoming-lots-panel';
import AuctionChatPanel from '@/components/auction/auction-chat-panel';
import AuctionInfoPanel from '@/components/auction/auction-info-panel';
import { Button } from '@/components/ui/button';
import { Maximize, Minimize, XSquare, Users, MessageSquare } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface VirtualAuditoriumClientProps {
  auction: Auction;
  initialCurrentLot: Lot;
  initialUpcomingLots: Lot[];
}

export default function VirtualAuditoriumClient({
  auction,
  initialCurrentLot,
  initialUpcomingLots,
}: VirtualAuditoriumClientProps) {
  const [currentLot, setCurrentLot] = useState<Lot>(initialCurrentLot);
  const [upcomingLots, setUpcomingLots] = useState<Lot[]>(initialUpcomingLots);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.error(err));
        setIsFullScreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-muted overflow-hidden">
        {/* Header Bar */}
        <header className="bg-background text-foreground p-3 shadow-md flex justify-between items-center flex-shrink-0">
          <h1 className="text-lg font-semibold truncate pr-4">
            Leilão Ao Vivo: <span className="text-primary">{auction.title}</span>
          </h1>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={toggleFullScreen} className="h-8 w-8" aria-label={isFullScreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}>
                  {isFullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>{isFullScreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive-foreground hover:bg-destructive h-8 w-8" onClick={() => window.history.back()} aria-label="Sair do Auditório">
                  <XSquare className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Sair do Auditório</p></TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Central Area: Current Lot + Bidding Panel */}
          <main className="flex-1 flex flex-col p-3 md:p-4 gap-3 md:gap-4 overflow-y-auto">
            <div className="flex-grow-[2] overflow-hidden">
              <CurrentLotDisplay lot={currentLot} auctionStatus={auction.status} />
            </div>
            <div className="flex-grow-[1] overflow-hidden">
              <BiddingPanel currentLot={currentLot} />
            </div>
          </main>

          {/* Sidebar for Upcoming Lots, Chat, Auction Info - Desktop */}
          <aside className={`hidden md:flex flex-col w-80 lg:w-96 bg-background border-l border-border p-3 gap-3 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <UpcomingLotsPanel lots={upcomingLots} currentLotId={currentLot.id} />
            <AuctionChatPanel />
            <AuctionInfoPanel auction={auction} />
          </aside>

          {/* Mobile Sidebar Toggle & Sheet */}
           <div className="md:hidden fixed bottom-4 right-4 z-50">
            <Sheet>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SheetTrigger asChild>
                    <Button variant="default" size="icon" className="rounded-full h-12 w-12 shadow-lg" aria-label="Abrir Painel Lateral">
                      <Users className="h-5 w-5" /> 
                    </Button>
                  </SheetTrigger>
                </TooltipTrigger>
                <TooltipContent side="left"><p>Abrir Painel Lateral</p></TooltipContent>
              </Tooltip>
              <SheetContent side="right" className="w-[85vw] max-w-md p-0">
                  <div className="flex flex-col h-full bg-background p-3 gap-3 overflow-y-auto">
                    <UpcomingLotsPanel lots={upcomingLots} currentLotId={currentLot.id} />
                    <AuctionChatPanel />
                    <AuctionInfoPanel auction={auction} />
                  </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
