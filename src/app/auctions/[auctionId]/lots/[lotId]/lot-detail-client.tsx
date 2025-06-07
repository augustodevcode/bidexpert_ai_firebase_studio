
'use client'; 

import type { Lot, Auction, BidInfo } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge'; 
import { Input } from '@/components/ui/input';
import { 
    Printer, Share2, ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, Search, Key, Info, 
    Tag, CalendarDays, Clock, Users, DollarSign, MapPin, Car, Settings, ThumbsUp, 
    ShieldCheck, HelpCircle, ShoppingCart, Heart, X, Facebook, Mail, MessageSquareText, Gavel, ImageOff, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState, useMemo } from 'react';
import { addRecentlyViewedId } from '@/lib/recently-viewed-store';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { isLotFavoriteInStorage, addFavoriteLotIdToStorage, removeFavoriteLotIdFromStorage } from '@/lib/favorite-store';
import { useAuth } from '@/contexts/auth-context'; 
import { getAuctionStatusText, getLotStatusColor } from '@/lib/sample-data'; 
import { placeBidOnLot, getBidsForLot } from './actions';
import { auth } from '@/lib/firebase'; // Importar auth diretamente

const SUPER_TEST_USER_EMAIL_FOR_BYPASS = 'augusto.devcode@gmail.com';
const SUPER_TEST_USER_UID_FOR_BYPASS = 'TEST_UID_AUGUSTO_DEV_LOT_DETAIL'; // UID Placeholder para teste
const SUPER_TEST_USER_DISPLAYNAME_FOR_BYPASS = 'Augusto Dev (Modo Teste)';

interface LotDetailClientContentProps {
  lot: Lot;
  auction: Auction;
  lotIndex?: number;
  previousLotId?: string;
  nextLotId?: string;
  totalLotsInAuction?: number;
}

export default function LotDetailClientContent({ lot: initialLot, auction, lotIndex, previousLotId, nextLotId, totalLotsInAuction }: LotDetailClientContentProps) {
  const [lot, setLot] = useState<Lot>(initialLot); 
  const [isLotFavorite, setIsLotFavorite] = useState(false);
  const { toast } = useToast();
  const [currentUrl, setCurrentUrl] = useState('');
  const { user, userProfileWithPermissions, loading: authLoading } = useAuth(); 
  const [lotBids, setLotBids] = useState<BidInfo[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bidAmountInput, setBidAmountInput] = useState<string>('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [error, setError] = useState<string | null>(null); // Para erros locais

  const gallery = useMemo(() => {
    if (!lot) return [];
    const mainImage = typeof lot.imageUrl === 'string' && lot.imageUrl.trim() !== '' ? [lot.imageUrl] : [];
    const galleryImages = (lot.galleryImageUrls || []).filter(url => typeof url === 'string' && url.trim() !== '');
    const combined = [...mainImage, ...galleryImages];
    const uniqueUrls = Array.from(new Set(combined.filter(Boolean)));
    return uniqueUrls;
  }, [lot]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
    if (lot && lot.id) {
      addRecentlyViewedId(lot.id);
      setIsLotFavorite(isLotFavoriteInStorage(lot.id));

      const fetchBids = async () => {
        try {
          const bids = await getBidsForLot(lot.id);
          setLotBids(bids);
        } catch (error) {
          console.error("Error fetching bids for lot:", error);
          setLotBids([]);
        }
      };
      fetchBids();
      setCurrentImageIndex(0); 
    }
  }, [lot]); 

  const lotTitle = `${lot?.year || ''} ${lot?.make || ''} ${lot?.model || ''} ${lot?.series || lot?.title}`.trim();
  const lotLocation = lot?.cityName && lot?.stateUf ? `${lot.cityName} - ${lot.stateUf}` : lot?.stateUf || lot?.cityName || 'Não informado';
  
  const firebaseAuthCurrentUser = auth.currentUser;
  const firebaseAuthEmailLower = firebaseAuthCurrentUser?.email?.toLowerCase();
  const isSuperTestUserDirectAuth = firebaseAuthEmailLower === SUPER_TEST_USER_EMAIL_FOR_BYPASS.toLowerCase();

  const contextUserEmailLower = user?.email?.toLowerCase();
  const isSuperTestUserContext = contextUserEmailLower === SUPER_TEST_USER_EMAIL_FOR_BYPASS.toLowerCase();
  
  const isHabilitado = userProfileWithPermissions?.habilitationStatus === 'HABILITADO';
  
  const canUserBid = 
    (isSuperTestUserDirectAuth || isSuperTestUserContext || (user && isHabilitado)) && 
    lot?.status === 'ABERTO_PARA_LANCES';


  const handleToggleFavorite = () => {
    if (!lot || !lot.id) return;
    const newFavoriteState = !isLotFavorite;
    setIsLotFavorite(newFavoriteState);

    if (newFavoriteState) {
      addFavoriteLotIdToStorage(lot.id);
    } else {
      removeFavoriteLotIdFromStorage(lot.id);
    }
    
    toast({
      title: newFavoriteState ? "Adicionado aos Favoritos" : "Removido dos Favoritos",
      description: `O lote "${lotTitle}" foi ${newFavoriteState ? 'adicionado à' : 'removido da'} sua lista.`,
    });
  };
  
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const getSocialLink = (platform: 'x' | 'facebook' | 'whatsapp' | 'email', url: string, title: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    switch(platform) {
      case 'x':
        return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case 'whatsapp':
        return `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
      case 'email':
        return `mailto:?subject=${encodedTitle}&body=${encodedUrl}`;
    }
  };

  const bidIncrement = (lot.price || 0) > 10000 ? 500 : ((lot.price || 0) > 1000 ? 100 : 50);
  const nextMinimumBid = (lot.price || 0) + bidIncrement;
  
  const handlePlaceBid = async () => {
    setIsPlacingBid(true);
    setError(null);

    let userIdToUse: string | undefined;
    let displayNameToUse: string | undefined;
    let userIsConsideredLoggedIn = false;

    // Prioritize direct Firebase Auth SDK for test user, then context, then force for test user if others fail
    if (isSuperTestUserDirectAuth && firebaseAuthCurrentUser?.uid) {
        userIdToUse = firebaseAuthCurrentUser.uid;
        displayNameToUse = firebaseAuthCurrentUser.displayName || firebaseAuthCurrentUser.email || SUPER_TEST_USER_DISPLAYNAME_FOR_BYPASS;
        userIsConsideredLoggedIn = true;
        console.log(`[LotDetailClient] Super test user identified via auth.currentUser: ${displayNameToUse}`);
    } else if (isSuperTestUserContext && user?.uid) {
        userIdToUse = user.uid;
        displayNameToUse = user.displayName || user.email || SUPER_TEST_USER_DISPLAYNAME_FOR_BYPASS;
        userIsConsideredLoggedIn = true;
        console.log(`[LotDetailClient] Super test user identified via useAuth() context: ${displayNameToUse}`);
    } else if (user?.uid) { // For regular users from context
        userIdToUse = user.uid;
        displayNameToUse = user.displayName || user.email?.split('@')[0];
        userIsConsideredLoggedIn = true;
        console.log(`[LotDetailClient] Regular user identified via useAuth() context: ${displayNameToUse}`);
    } else if (SUPER_TEST_USER_EMAIL_FOR_BYPASS) { // Aggressive bypass if no user in context or auth, assume it's the test user for this flow
        console.warn(`[LotDetailClient] BYPASS: No user in context or Firebase Auth. Forcing test user '${SUPER_TEST_USER_EMAIL_FOR_BYPASS}'.`);
        userIdToUse = SUPER_TEST_USER_UID_FOR_BYPASS;
        displayNameToUse = SUPER_TEST_USER_DISPLAYNAME_FOR_BYPASS;
        userIsConsideredLoggedIn = true; // Pretend login for test user
    }

    if (!userIsConsideredLoggedIn || !userIdToUse) {
      toast({ title: "Ação Requerida", description: "Você precisa estar logado para dar um lance.", variant: "destructive" });
      setIsPlacingBid(false);
      return;
    }
    
    displayNameToUse = displayNameToUse || 'Usuário Anônimo Teste';

    const amountToBid = parseFloat(bidAmountInput);
    if (isNaN(amountToBid) || amountToBid <= 0) {
      toast({ title: "Erro no Lance", description: "Por favor, insira um valor de lance válido.", variant: "destructive" });
      setIsPlacingBid(false);
      return;
    }
  
    try {
      const result = await placeBidOnLot(lot.id, lot.auctionId, userIdToUse, displayNameToUse, amountToBid);
      if (result.success && result.updatedLot && result.newBid) {
        setLot(prevLot => ({ ...prevLot!, ...result.updatedLot }));
        setLotBids(prevBids => [result.newBid!, ...prevBids].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        setBidAmountInput('');
        toast({
          title: "Lance Enviado!",
          description: result.message,
        });
      } else {
        toast({
          title: "Erro ao Dar Lance",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro Inesperado",
        description: error.message || "Ocorreu um erro ao processar seu lance.",
        variant: "destructive",
      });
    } finally {
      setIsPlacingBid(false);
    }
  };

  const currentBidLabel = lot?.bidsCount && lot.bidsCount > 0 ? "Lance Atual" : "Lance Inicial";
  const currentBidValue = lot?.price || 0;

  if (!lot || !auction) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <p className="text-muted-foreground">Carregando detalhes do lote...</p>
      </div>
    );
  }
  
  const nextImage = () => setCurrentImageIndex((prev) => (gallery.length > 0 ? (prev + 1) % gallery.length : 0));
  const prevImage = () => setCurrentImageIndex((prev) => (gallery.length > 0 ? (prev - 1 + gallery.length) % gallery.length : 0));

  const actualLotNumber = lot.number || lot.id;
  const displayLotPosition = lotIndex !== undefined && lotIndex !== -1 ? lotIndex + 1 : 'N/A';
  const displayTotalLots = totalLotsInAuction || auction.totalLots || 'N/A';


  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
          <div className="flex-grow">
            <h1 className="text-2xl md:text-3xl font-bold font-headline text-left">{lotTitle}</h1>
             <div className="flex items-center gap-2 mt-1">
                <Badge className={`text-xs px-2 py-0.5 ${getLotStatusColor(lot.status)}`}>
                    {getAuctionStatusText(lot.status)}
                </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-wrap justify-start sm:justify-end mt-2 sm:mt-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handlePrint} aria-label="Imprimir"><Printer className="h-4 w-4" /></Button>
              </TooltipTrigger>
              <TooltipContent><p>Imprimir</p></TooltipContent>
            </Tooltip>
            
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Compartilhar"><Share2 className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent><p>Compartilhar</p></TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <a href={getSocialLink('x', currentUrl, lotTitle)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                    <X className="h-4 w-4" /> X (Twitter)
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={getSocialLink('facebook', currentUrl, lotTitle)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                    <Facebook className="h-4 w-4" /> Facebook
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={getSocialLink('whatsapp', currentUrl, lotTitle)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                    <MessageSquareText className="h-4 w-4" /> WhatsApp
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={getSocialLink('email', currentUrl, lotTitle)} className="flex items-center gap-2 cursor-pointer">
                    <Mail className="h-4 w-4" /> Email
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" asChild aria-label="Voltar para o leilão">
                  <Link href={`/auctions/${auction.id}`}><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Voltar para o Leilão</p></TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <span className="font-medium text-foreground">Lote Nº: {actualLotNumber}</span>
            <div className="flex items-center gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8" asChild={!!previousLotId} disabled={!previousLotId} aria-label="Lote Anterior">
                        {previousLotId ? <Link href={`/auctions/${auction.id}/lots/${previousLotId}`}><ChevronLeft className="h-4 w-4" /></Link> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Lote Anterior</p></TooltipContent>
                </Tooltip>
                <span className="text-sm text-muted-foreground mx-1">Lote {displayLotPosition} de {displayTotalLots}</span>
                <Tooltip>
                    <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8" asChild={!!nextLotId} disabled={!nextLotId} aria-label="Próximo Lote">
                        {nextLotId ? <Link href={`/auctions/${auction.id}/lots/${nextLotId}`}><ChevronRight className="h-4 w-4" /></Link> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Próximo Lote</p></TooltipContent>
                </Tooltip>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg">
              <CardContent className="p-4">
                <div className="relative aspect-[16/9] w-full bg-muted rounded-md overflow-hidden mb-4">
                  {gallery.length > 0 && gallery[currentImageIndex] ? (
                    <Image
                      src={gallery[currentImageIndex]}
                      alt={`Imagem ${currentImageIndex + 1} de ${lot.title}`}
                      fill
                      className="object-contain"
                      data-ai-hint={lot.dataAiHint || "imagem principal lote"}
                      priority={currentImageIndex === 0}
                      unoptimized={gallery[currentImageIndex].startsWith('https://placehold.co')}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <ImageOff className="h-16 w-16 mb-2" />
                      <span>Imagem principal não disponível</span>
                    </div>
                  )}
                   {gallery.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background h-9 w-9 rounded-full shadow-md"
                        aria-label="Imagem Anterior"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background h-9 w-9 rounded-full shadow-md"
                        aria-label="Próxima Imagem"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </>
                  )}
                </div>
                {gallery.length > 1 && (
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2">
                    {gallery.map((url, index) => (
                      <button
                        key={index}
                        className={`relative aspect-square bg-muted rounded overflow-hidden border-2 transition-all ${index === currentImageIndex ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent hover:border-muted-foreground/50'}`}
                        onClick={() => setCurrentImageIndex(index)}
                        aria-label={`Ver imagem ${index + 1}`}
                      >
                        <Image
                          src={url}
                          alt={`Miniatura ${index + 1}`}
                          fill
                          className="object-cover"
                          data-ai-hint={lot.dataAiHint || 'imagem galeria carro'}
                          unoptimized={url.startsWith('https://placehold.co')}
                        />
                      </button>
                    ))}
                  </div>
                )}
                 {gallery.length === 0 && (
                    <p className="text-sm text-center text-muted-foreground py-4">Nenhuma imagem na galeria.</p>
                 )}
                <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                  {lot.hasKey && <span className="flex items-center"><Key className="h-4 w-4 mr-1 text-primary"/> Chave Presente</span>}
                  <span className="flex items-center"><MapPin className="h-4 w-4 mr-1 text-primary"/> Localização: {lotLocation}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">Informações do Veículo <Info className="h-4 w-4 ml-2 text-muted-foreground" /></CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {Object.entries({
                  "Nº de Estoque:": lot.stockNumber,
                  "Filial de Venda:": lot.sellingBranch,
                  "VIN (Status):": lot.vinStatus,
                  "Tipo de Perda:": lot.lossType,
                  "Dano Primário:": lot.primaryDamage,
                  "Documento (Título/Venda):": lot.titleInfo,
                  "Marca do Documento:": lot.titleBrand,
                  "Código de Partida:": lot.startCode,
                  "Chave:": lot.hasKey ? "Presente" : "Ausente",
                  "Odômetro:": lot.odometer,
                  "Airbags:": lot.airbagsStatus,
                }).map(([key, value]) => value ? <div key={key}><span className="font-medium text-foreground">{key}</span> <span className="text-muted-foreground">{value}</span></div> : null)}
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">Descrição do Veículo <Info className="h-4 w-4 ml-2 text-muted-foreground" /></CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {Object.entries({
                  "VIN (Status):": lot.vinStatus,
                  "Veículo:": lot.type,
                  "Estilo da Carroceria:": lot.bodyStyle,
                  "Motor:": lot.engineDetails,
                  "Transmissão:": lot.transmissionType,
                  "Tipo de Tração:": lot.driveLineType,
                  "Tipo de Combustível:": lot.fuelType,
                  "Cilindros:": lot.cylinders,
                  "Sistema de Retenção:": lot.restraintSystem,
                  "Cor Externa/Interna:": lot.exteriorInteriorColor,
                  "Opcionais:": lot.options,
                  "Fabricado em:": lot.manufacturedIn,
                  "Classe do Veículo:": lot.vehicleClass,
                  "Modelo:": lot.model,
                  "Série:": lot.series,
                }).map(([key, value]) => value ? <div key={key}><span className="font-medium text-foreground">{key}</span> <span className="text-muted-foreground">{value}</span></div> : null)}

               {lot.description && (
                  <>
                      <Separator className="my-4 md:col-span-2" />
                      <div className="md:col-span-2">
                          <p className="text-sm text-muted-foreground whitespace-pre-line">{lot.description}</p>
                      </div>
                  </>
              )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Informações do Lance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                  <div className="text-sm">
                      <p className="text-muted-foreground">{currentBidLabel}:</p>
                      <p className="text-2xl font-bold text-primary">
                        R$ {currentBidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                  </div>
                { !canUserBid && (!user || (!isSuperTestUserDirectAuth && !isSuperTestUserContext)) && (
                  <div className="text-sm text-muted-foreground p-3 bg-secondary/50 rounded-md">
                    <p>Você não está logado.</p>
                    <p>Por favor, <Link href={`/auth/login?redirect=/auctions/${auction.id}/lots/${lot.id}`} className="text-primary hover:underline font-medium">faça login</Link> ou <Link href={`/auth/register?redirect=/auctions/${auction.id}/lots/${lot.id}`} className="text-primary hover:underline font-medium">registre-se agora</Link> para dar lances.</p>
                  </div>
                )}
                {canUserBid ? (
                  <div className="space-y-2">
                     <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="number"
                            placeholder={`Mínimo R$ ${nextMinimumBid.toLocaleString('pt-BR')}`}
                            value={bidAmountInput}
                            onChange={(e) => setBidAmountInput(e.target.value)}
                            className="pl-9 h-11 text-base"
                            min={nextMinimumBid}
                            step={bidIncrement}
                            disabled={isPlacingBid}
                        />
                    </div>
                    <Button onClick={handlePlaceBid} disabled={isPlacingBid || !bidAmountInput} className="w-full h-11 text-base">
                      {isPlacingBid ? <Loader2 className="animate-spin" /> : `Dar Lance (R$ ${parseFloat(bidAmountInput || '0').toLocaleString('pt-BR') || nextMinimumBid.toLocaleString('pt-BR') })`}
                    </Button>
                  </div>
                ) : (user && !isPlacingBid) && ( // User is logged in, but cannot bid (status or habilitation)
                   <div className="text-sm text-muted-foreground p-3 bg-secondary/50 rounded-md">
                    <p>{lot.status !== 'ABERTO_PARA_LANCES' ? `Lances para este lote estão ${getAuctionStatusText(lot.status).toLowerCase()}.` : 'Você precisa estar habilitado para dar lances.'}</p>
                  </div>
                )}
                <Button variant="outline" className="w-full" onClick={handleToggleFavorite}>
                  <Heart className={`mr-2 h-4 w-4 ${isLotFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  {isLotFavorite ? 'Remover da Minha Lista' : 'Adicionar à Minha Lista'}
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">Informações da Venda <Info className="h-4 w-4 ml-2 text-muted-foreground" /></CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {Object.entries({
                  "Filial de Venda:": lot.sellingBranch || auction.sellingBranch,
                  "Localização do Veículo:": lot.vehicleLocationInBranch || lotLocation,
                  "Data e Hora do Leilão (Lote):": lot.lotSpecificAuctionDate ? format(new Date(lot.lotSpecificAuctionDate), "dd/MM/yyyy HH:mm'h'", { locale: ptBR }) : 'N/A',
                  "Pista/Corrida #:": lot.laneRunNumber,
                  "Corredor/Vaga:": lot.aisleStall,
                  "Valor Real em Dinheiro (VCV):": lot.actualCashValue,
                  "Custo Estimado de Reparo:": lot.estimatedRepairCost,
                  "Vendedor:": lot.sellerName || auction.seller,
                  "Documento (Título/Venda):": lot.titleInfo,
                  "Marca do Documento:": lot.titleBrand,
                }).map(([key, value]) => value ? <div key={key}><span className="font-medium text-foreground">{key}</span> <span className="text-muted-foreground">{value}</span></div> : null)}
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">Opções Adicionais <Info className="h-4 w-4 ml-2 text-muted-foreground" /></CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Button variant="outline" className="w-full justify-start text-left h-auto py-2">
                  <Settings className="mr-2 h-4 w-4 text-primary" />
                  <div>
                    <span className="font-medium">Serviços de Inspeção Veicular</span><br/>
                    <span className="text-xs text-primary">Solicitar Inspeção &rarr;</span>
                  </div>
                </Button>
                <div className="text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Você também pode:</p>
                  <ul className="list-disc list-inside space-y-1 pl-1">
                    <li>Ver o item pessoalmente antes da venda durante a janela de pré-visualização do leilão.</li>
                    <li>Restrições podem ser aplicadas, por favor, contate a Filial de Venda acima para agendar uma pré-visualização.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-md">
              <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                      <Gavel className="h-5 w-5 mr-2 text-primary" /> Histórico de Lances
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  {lotBids.length > 0 ? (
                      <ul className="space-y-2 text-sm">
                          {lotBids.map(bid => (
                              <li key={bid.id} className="flex justify-between items-center p-2 bg-secondary/40 rounded-md">
                                  <div>
                                      <span className="font-medium text-foreground">{bid.bidderDisplay}</span>
                                      <span className="text-xs text-muted-foreground ml-2">
                                          ({format(new Date(bid.timestamp), "dd/MM HH:mm:ss", { locale: ptBR })})
                                      </span>
                                  </div>
                                  <span className="font-semibold text-primary">
                                      R$ {bid.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                              </li>
                          ))}
                      </ul>
                  ) : (
                      <p className="text-sm text-muted-foreground text-center py-3">Nenhum lance registrado para este lote ainda.</p>
                  )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

