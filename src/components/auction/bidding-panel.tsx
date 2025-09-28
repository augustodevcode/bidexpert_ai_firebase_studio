
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Lot, UserLotMaxBid, BidInfo, Auction, AuctionStage } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Zap, Clock, Info, Gavel, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/auth-context';
import { placeBidOnLot, placeMaxBid, getActiveUserLotMaxBid, getBidsForLot } from '@/app/auctions/[auctionId]/lots/[lotId]/actions';
import { hasPermission } from '@/lib/permissions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import LotAllBidsModal from './lot-all-bids-modal';
import { getAuctionStatusText } from '@/lib/ui-helpers';
import { habilitateForAuctionAction, checkHabilitationForAuctionAction } from '@/app/admin/habilitations/actions';
import { useInterval } from '@/hooks/use-interval'; // Importando o hook de intervalo

interface BiddingPanelProps {
  currentLot: Lot;
  auction: Auction;
  onBidSuccess: (updatedLotData: Partial<Lot>, newBid?: BidInfo) => void;
  isHabilitadoForThisAuction?: boolean;
  onHabilitacaoSuccess?: () => void; // Tornando a prop opcional
  activeStage?: AuctionStage | null;
  activeLotPrices?: { initialBid?: number | null; bidIncrement?: number | null } | null;
}

const SUPER_TEST_USER_EMAIL_FOR_BYPASS = 'admin@bidexpert.com.br'.toLowerCase();

export default function BiddingPanel({ currentLot: initialLot, auction, onBidSuccess, isHabilitadoForThisAuction, onHabilitacaoSuccess, activeStage, activeLotPrices }: BiddingPanelProps) {
  const { toast } = useToast();
  const { userProfileWithPermissions } = useAuth();
  
  const [currentLot, setCurrentLot] = useState<Lot>(initialLot);
  const [bidAmountInput, setBidAmountInput] = useState<string>('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [maxBidAmountInput, setMaxBidAmountInput] = useState('');
  const [isSettingMaxBid, setIsSettingMaxBid] = useState(false);
  const [activeMaxBid, setActiveMaxBid] = useState<UserLotMaxBid | null>(null);
  const [bidHistory, setBidHistory] = useState<BidInfo[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isAllBidsModalOpen, setIsAllBidsModalOpen] = useState(false);
  const [isHabilitando, setIsHabilitando] = useState(false);

  // Atualiza o estado interno do lote quando a prop inicial muda
  useEffect(() => {
    setCurrentLot(initialLot);
  }, [initialLot]);

  const bidIncrement = activeLotPrices?.bidIncrement || 100;
  const nextMinimumBid = (currentLot?.price || 0) + bidIncrement;

  const isEffectivelySuperTestUser = userProfileWithPermissions?.email?.toLowerCase() === SUPER_TEST_USER_EMAIL_FOR_BYPASS;
  const hasAdminRights = userProfileWithPermissions && hasPermission(userProfileWithPermissions, 'manage_all');
  const isDocHabilitado = userProfileWithPermissions?.habilitationStatus === 'HABILITADO';
  
  const canUserBid = (isEffectivelySuperTestUser || hasAdminRights || (isDocHabilitado && isHabilitadoForThisAuction)) && currentLot?.status === 'ABERTO_PARA_LANCES';

  const fetchBidHistory = useCallback(async () => {
    if (!currentLot?.id) return;
    setIsLoadingHistory(true);
    try {
      const history = await getBidsForLot(currentLot.publicId || currentLot.id);
      setBidHistory(history);
    } catch (error) {
       toast({ title: "Erro de Conexão", description: "Não foi possível obter o histórico de lances.", variant: "destructive" });
    } finally {
        setIsLoadingHistory(false);
    }
  }, [currentLot?.id, currentLot?.publicId, toast]);
  
  useInterval(fetchBidHistory, 5000); // Polling a cada 5 segundos

  useEffect(() => {
    fetchBidHistory(); // Fetch inicial
  }, [fetchBidHistory]);


  const handleHabilitarClick = async () => {
      if (!userProfileWithPermissions?.uid || !auction?.id) return;
      setIsHabilitando(true);
      const result = await habilitateForAuctionAction(userProfileWithPermissions.uid, auction.id);
      if (result.success) {
          toast({ title: "Sucesso!", description: "Você está habilitado para dar lances neste leilão."});
          if (onHabilitacaoSuccess) { // Verificação para segurança
            onHabilitacaoSuccess();
          }
      } else {
          toast({ title: "Erro", description: result.message, variant: "destructive"});
      }
      setIsHabilitando(false);
  };

  const handlePlaceBid = async () => {
    if (!canUserBid || !userProfileWithPermissions) return;
    const bidValue = parseFloat(bidAmountInput) || nextMinimumBid;

    if (bidValue < nextMinimumBid) {
      toast({ title: 'Valor Inválido', description: `Seu lance deve ser de no mínimo R$ ${nextMinimumBid.toLocaleString('pt-br')}`, variant: 'destructive' });
      return;
    }

    setIsPlacingBid(true);
    const result = await placeBidOnLot(
      currentLot.publicId || currentLot.id,
      auction.publicId || auction.id,
      userProfileWithPermissions.id,
      userProfileWithPermissions.fullName || 'Usuário Anônimo',
      bidValue
    );
    setIsPlacingBid(false);

    if (result.success && result.updatedLot) {
      toast({ title: 'Sucesso!', description: 'Seu lance foi registrado.' });
      onBidSuccess(result.updatedLot, result.newBid);
      setCurrentLot(prev => ({...prev, ...result.updatedLot!}));
      setBidAmountInput('');
    } else {
      toast({ title: 'Erro ao dar lance', description: result.message, variant: 'destructive' });
    }
  };

  const handleSetMaxBid = async () => {
    if (!canUserBid || !userProfileWithPermissions || !maxBidAmountInput) return;
    setIsSettingMaxBid(true);
    const result = await placeMaxBid(
        currentLot.publicId || currentLot.id,
        userProfileWithPermissions.id,
        parseFloat(maxBidAmountInput)
    );
     setIsSettingMaxBid(false);
    if(result.success) {
        toast({ title: 'Sucesso!', description: 'Seu lance máximo foi salvo.' });
        const maxBid = await getActiveUserLotMaxBid(currentLot.publicId || currentLot.id, userProfileWithPermissions.uid || '');
        setActiveMaxBid(maxBid);
    } else {
        toast({ title: 'Erro ao salvar lance máximo', description: result.message, variant: 'destructive' });
    }
  };

  const displayBidAmount = parseFloat(bidAmountInput) >= nextMinimumBid ? parseFloat(bidAmountInput) : nextMinimumBid;
  const bidButtonLabel = `Dar Lance (R$ ${displayBidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
  
  const renderBiddingInterface = () => {
    if (!userProfileWithPermissions) {
        return <div className="text-sm text-center p-3 bg-destructive/10 text-destructive rounded-md"><Info className="h-5 w-5 mx-auto mb-1" /><p className="font-medium">Para dar lances, faça login em sua conta.</p></div>
    }
    
    if (currentLot.status !== 'ABERTO_PARA_LANCES') {
         return <div className="text-sm text-center p-3 bg-muted/80 text-muted-foreground rounded-md"><Info className="h-5 w-5 mx-auto mb-1" /><p className="font-medium">Lances para este lote estão {getAuctionStatusText(currentLot.status).toLowerCase()}.</p></div>
    }

    if (!isDocHabilitado) {
        return <div className="text-sm text-center p-3 bg-destructive/10 text-destructive rounded-md"><Info className="h-5 w-5 mx-auto mb-1" /><p className="font-medium">Sua documentação precisa ser aprovada para dar lances.</p></div>
    }

    if (!isHabilitadoForThisAuction) {
        return (
            <div className="p-3 border-2 border-dashed border-primary/50 rounded-lg text-center space-y-2">
                <h4 className="font-semibold text-foreground">Habilite-se para Participar</h4>
                <p className="text-xs text-muted-foreground">Sua documentação está aprovada! Clique abaixo para se habilitar especificamente para este leilão.</p>
                <Button onClick={handleHabilitarClick} disabled={isHabilitando} className="w-full">
                   {isHabilitando ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Gavel className="mr-2 h-4 w-4"/>} Habilitar-se para este Leilão
                </Button>
            </div>
        );
    }
    
    return (
        <>
            <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="number" placeholder={`Próximo lance R$ ${nextMinimumBid.toLocaleString('pt-BR')}`} value={bidAmountInput} onChange={(e) => setBidAmountInput(e.target.value)} className="pl-9 h-11 text-base" min={nextMinimumBid} step={bidIncrement} disabled={isPlacingBid} />
            </div>
            <Button onClick={handlePlaceBid} disabled={isPlacingBid} className="w-full h-11 text-base">
                {isPlacingBid ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : bidButtonLabel}
            </Button>
            <div className="flex items-center justify-between space-x-2 p-3 border rounded-md bg-muted/20">
                <div className="flex items-center space-x-2"><Zap className="h-4 w-4 text-amber-500" /><Label htmlFor="autobid-switch" className="text-sm font-medium">Lance Automático</Label></div>
                <div className="relative"><Input type="number" placeholder="Definir lance máximo" value={maxBidAmountInput} onChange={(e) => setMaxBidAmountInput(e.target.value)} className="h-8 text-sm pr-20" disabled={isSettingMaxBid} /><Button size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 px-2 text-xs" onClick={handleSetMaxBid} disabled={isSettingMaxBid || !maxBidAmountInput}>{isSettingMaxBid ? <Loader2 className="h-3 w-3 animate-spin"/> : 'Salvar'}</Button></div>
            </div>
            {activeMaxBid && (<div className="p-2 text-center bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800"><p>Seu lance máximo atual é de <strong>R$ {activeMaxBid.maxAmount.toLocaleString('pt-BR')}</strong>.</p></div>)}
        </>
    );
  }

  return (
    <>
      <Card className="flex flex-col shadow-lg rounded-lg h-full">
        <CardHeader className="p-3 md:p-4 border-b">
          <CardTitle className="text-lg md:text-xl font-bold flex items-center">
            <Gavel className="h-5 w-5 mr-2 text-primary" /> Painel de Lances
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-4 flex-1 flex flex-col gap-3 md:gap-4 overflow-y-auto">
          {renderBiddingInterface()}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-1.5">
              <h4 className="text-sm font-semibold text-muted-foreground flex items-center">
                <Clock className="h-4 w-4 mr-1.5" /> Histórico Recente
              </h4>
              {bidHistory.length > 3 && (<Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setIsAllBidsModalOpen(true)}>Ver Todos</Button>)}
            </div>
            <ScrollArea className="border rounded-md bg-secondary/20">
              <div className="p-2 space-y-1.5 text-xs">
                {isLoadingHistory ? (<div className="flex items-center justify-center p-4"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>)
                : bidHistory.length > 0 ? (bidHistory.slice(0, 3).map((bid, index) => (
                    <div key={bid.id} className={`flex justify-between items-center p-1.5 rounded ${index === 0 ? 'bg-green-100 dark:bg-green-800/30 font-semibold' : ''}`}>
                        <span>{bid.bidderDisplay}</span>
                        <span className="text-right">R$ {bid.amount.toLocaleString('pt-BR')} <span className="text-muted-foreground/70">({bid.timestamp ? format(new Date(bid.timestamp as string), 'HH:mm:ss') : ''})</span></span>
                    </div>
                )))
                : (<p className="text-center text-muted-foreground p-2">Nenhum lance ainda.</p>)}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
      <LotAllBidsModal isOpen={isAllBidsModalOpen} onClose={() => setIsAllBidsModalOpen(false)} lotBids={bidHistory} lotTitle={currentLot.title} />
    </>
  );
}
