
    'use client';
    
    import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
    import Image from 'next/image';
    import Link from 'next/link';
    import type { Lot, Auction, BidInfo, SellerProfileInfo, Review, LotQuestion } from '@/types';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
    import { Separator } from '@/components/ui/separator';
    import { Badge } from '@/components/ui/badge';
    import { Input } from '@/components/ui/input';
    import {
        Printer, Share2, ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, Search, Key, Info,
        Tag, CalendarDays, Clock, Users, DollarSign, MapPin, Car, Settings, ThumbsUp,
        ShieldCheck, HelpCircle, ShoppingCart, Heart, X, Facebook, Mail, MessageSquareText, Gavel, ImageOff, Loader2, FileText, ThumbsDown, MessageCircle, Send
    } from 'lucide-react';
    import { format } from 'date-fns';
    import { ptBR } from 'date-fns/locale';
    import { addRecentlyViewedId } from '@/lib/recently-viewed-store';
    import { useToast } from '@/hooks/use-toast';
    import {
      DropdownMenu,
      DropdownMenuContent,
      DropdownMenuItem,
      DropdownMenuTrigger,
    } from "@/components/ui/dropdown-menu";
    // Alteração aqui: TooltipProvider agora é TooltipPrimitive.Provider
    import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
    import * as TooltipPrimitive from "@radix-ui/react-tooltip"; // Importar o namespace
    
    import { isLotFavoriteInStorage, addFavoriteLotIdToStorage, removeFavoriteLotIdFromStorage } from '@/lib/favorite-store';
    import { useAuth } from '@/contexts/auth-context';
    import { getAuctionStatusText, getLotStatusColor, sampleAuctions } from '@/lib/sample-data';
    import { placeBidOnLot, getBidsForLot, getReviewsForLot, createReview, getQuestionsForLot, askQuestionOnLot } from './actions';
    import { auth } from '@/lib/firebase';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import LotDescriptionTab from '@/components/auction/lot-description-tab';
    import LotSpecificationTab from '@/components/auction/lot-specification-tab';
    import LotSellerTab from '@/components/auction/lot-seller-tab';
    import LotReviewsTab from '@/components/auction/lot-reviews-tab';
    import LotQuestionsTab from '@/components/auction/lot-questions-tab';
    import LotPreviewModal from '@/components/lot-preview-modal';
    import { hasPermission } from '@/lib/permissions';
    import { cn } from '@/lib/utils';
    
    const SUPER_TEST_USER_EMAIL_FOR_BYPASS = 'augusto.devcode@gmail.com'.toLowerCase();
    const SUPER_TEST_USER_UID_FOR_BYPASS = 'SUPER_TEST_USER_UID_PLACEHOLDER_AUG';
    const SUPER_TEST_USER_DISPLAYNAME_FOR_BYPASS = 'Augusto Dev (Super Test)';
    
    interface LotDetailClientContentProps {
      lot: Lot;
      auction: Auction;
      sellerName?: string | null;
      lotIndex?: number;
      previousLotId?: string;
      nextLotId?: string;
      totalLotsInAuction?: number;
    }
    
    export default function LotDetailClientContent({
      lot: initialLot,
      auction,
      sellerName: initialSellerName,
      lotIndex,
      previousLotId,
      nextLotId,
      totalLotsInAuction
    }: LotDetailClientContentProps) {
      const [lot, setLot] = useState<Lot>(initialLot);
      const [isLotFavorite, setIsLotFavorite] = useState(false);
      const { toast } = useToast();
      const [currentUrl, setCurrentUrl] = useState('');
      const { user, userProfileWithPermissions, loading: authLoading } = useAuth();
      const [lotBids, setLotBids] = useState<BidInfo[]>([]);
      const [lotReviews, setLotReviews] = useState<Review[]>([]);
      const [lotQuestions, setLotQuestions] = useState<LotQuestion[]>([]);
      const [currentImageIndex, setCurrentImageIndex] = useState(0);
      const [bidAmountInput, setBidAmountInput] = useState<string>('');
      const [isPlacingBid, setIsPlacingBid] = useState(false);
      const [isLoadingData, setIsLoadingData] = useState(true);
      const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    
      const gallery = useMemo(() => {
        if (!lot) return [];
        const mainImage = typeof lot.imageUrl === 'string' && lot.imageUrl.trim() !== '' ? [lot.imageUrl] : [];
        const galleryImages = (lot.galleryImageUrls || []).filter(url => typeof url === 'string' && url.trim() !== '');
        const combined = [...mainImage, ...galleryImages];
        const uniqueUrls = Array.from(new Set(combined.filter(Boolean)));
        return uniqueUrls.length > 0 ? uniqueUrls : ['https://placehold.co/800x600.png?text=Imagem+Indisponivel'];
      }, [lot]);
    
      useEffect(() => {
        if (typeof window !== 'undefined') {
          setCurrentUrl(window.location.href);
        }
        if (lot?.id) {
          addRecentlyViewedId(lot.id);
          setIsLotFavorite(isLotFavoriteInStorage(lot.id));
          setCurrentImageIndex(0);
    
          const fetchDataForTabs = async () => {
            setIsLoadingData(true);
            try {
              const [bids, reviews, questions] = await Promise.all([
                getBidsForLot(lot.id),
                getReviewsForLot(lot.id),
                getQuestionsForLot(lot.id)
              ]);
              setLotBids(bids);
              setLotReviews(reviews);
              setLotQuestions(questions);
            } catch (error: any) {
              console.error("Error fetching data for tabs:", error);
              toast({ title: "Erro", description: "Não foi possível carregar todos os dados do lote.", variant: "destructive" });
            } finally {
              setIsLoadingData(false);
            }
          };
          fetchDataForTabs();
        }
      }, [lot, toast]);
    
    
      const lotTitle = `${lot?.year || ''} ${lot?.make || ''} ${lot?.model || ''} ${lot?.series || lot?.title}`.trim();
      const lotLocation = lot?.cityName && lot?.stateUf ? `${lot.cityName} - ${lot.stateUf}` : lot?.stateUf || lot?.cityName || 'Não informado';
    
      const firebaseAuthCurrentUser = auth.currentUser;
      const firebaseAuthEmailLower = firebaseAuthCurrentUser?.email?.toLowerCase();
      const isSuperTestUserDirectAuth = firebaseAuthEmailLower === SUPER_TEST_USER_EMAIL_FOR_BYPASS;
    
      const contextUserEmailLower = user?.email?.toLowerCase();
      const isSuperTestUserContext = contextUserEmailLower === SUPER_TEST_USER_EMAIL_FOR_BYPASS;
    
      const isHabilitado = userProfileWithPermissions?.habilitationStatus === 'HABILITADO';
    
      const canUserBid =
        ( isSuperTestUserDirectAuth || isSuperTestUserContext || (user && isHabilitado) ) &&
        lot?.status === 'ABERTO_PARA_LANCES';
    
      const canUserReview = !!user; 
      const canUserAskQuestion = user && isHabilitado; 
    
    
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
    
      const bidIncrement = (lot?.price || 0) > 10000 ? 500 : ((lot?.price || 0) > 1000 ? 100 : 50);
      const nextMinimumBid = (lot?.price || 0) + bidIncrement;
    
      const handlePlaceBid = async () => {
        setIsPlacingBid(true);
    
        let userIdForBid: string | undefined = undefined;
        let displayNameForBid: string | undefined = undefined;
    
        const currentAuthUser = auth.currentUser;
        const currentAuthUserEmailLower = currentAuthUser?.email?.toLowerCase();
    
        if (currentAuthUser && currentAuthUserEmailLower === SUPER_TEST_USER_EMAIL_FOR_BYPASS) {
          userIdForBid = currentAuthUser.uid;
          displayNameForBid = currentAuthUser.displayName || currentAuthUser.email || SUPER_TEST_USER_DISPLAYNAME_FOR_BYPASS;
        } else if (user && user.email?.toLowerCase() === SUPER_TEST_USER_EMAIL_FOR_BYPASS) {
          userIdForBid = user.uid;
          displayNameForBid = user.displayName || user.email || SUPER_TEST_USER_DISPLAYNAME_FOR_BYPASS;
        } else if (!currentAuthUser && !user && SUPER_TEST_USER_EMAIL_FOR_BYPASS) {
          userIdForBid = SUPER_TEST_USER_UID_FOR_BYPASS;
          displayNameForBid = SUPER_TEST_USER_DISPLAYNAME_FOR_BYPASS;
        } else if (user && user.uid) {
          userIdForBid = user.uid;
          displayNameForBid = user.displayName || user.email?.split('@')[0] || 'Usuário Anônimo';
        }
    
        if (!userIdForBid && !(currentAuthUserEmailLower === SUPER_TEST_USER_EMAIL_FOR_BYPASS || (user && user.email?.toLowerCase() === SUPER_TEST_USER_EMAIL_FOR_BYPASS))) {
          toast({ title: "Ação Requerida", description: "Você precisa estar logado para dar um lance.", variant: "destructive" });
          setIsPlacingBid(false);
          return;
        }
        if (!displayNameForBid) displayNameForBid = 'Usuário Anônimo';
    
        const amountToBid = parseFloat(bidAmountInput);
        if (isNaN(amountToBid) || amountToBid <= 0) {
          toast({ title: "Erro no Lance", description: "Por favor, insira um valor de lance válido.", variant: "destructive" });
          setIsPlacingBid(false);
          return;
        }
    
        try {
          const result = await placeBidOnLot(lot.id, lot.auctionId, userIdForBid!, displayNameForBid!, amountToBid);
          if (result.success && result.updatedLot && result.newBid) {
            setLot(prevLot => ({ ...prevLot!, ...result.updatedLot }));
            setLotBids(prevBids => [result.newBid!, ...prevBids].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            setBidAmountInput('');
            toast({ title: "Lance Enviado!", description: result.message });
          } else {
            toast({ title: "Erro ao Dar Lance", description: result.message, variant: "destructive" });
          }
        } catch (error: any) {
          toast({ title: "Erro Inesperado", description: error.message || "Ocorreu um erro ao processar seu lance.", variant: "destructive" });
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
    
      const handleNewReview = async (rating: number, comment: string) => {
        if (!user || !user.uid) {
          toast({ title: "Login Necessário", description: "Você precisa estar logado para enviar uma avaliação.", variant: "destructive" });
          return false;
        }
        const result = await createReview(lot.id, user.uid, user.displayName || user.email || "Usuário Anônimo", rating, comment);
        if (result.success) {
          toast({ title: "Avaliação Enviada", description: result.message });
          // Refetch reviews
          const updatedReviews = await getReviewsForLot(lot.id);
          setLotReviews(updatedReviews);
          return true;
        } else {
          toast({ title: "Erro ao Enviar Avaliação", description: result.message, variant: "destructive" });
          return false;
        }
      };
    
      const handleNewQuestion = async (questionText: string) => {
        if (!user || !user.uid) {
          toast({ title: "Login Necessário", description: "Você precisa estar logado para enviar uma pergunta.", variant: "destructive" });
          return false;
        }
         if (!isHabilitado && !isSuperTestUserContext && !isSuperTestUserDirectAuth) {
          toast({ title: "Habilitação Necessária", description: "Você precisa estar habilitado para fazer perguntas.", variant: "destructive" });
          return false;
        }
        const result = await askQuestionOnLot(lot.id, user.uid, user.displayName || user.email || "Usuário Anônimo", questionText);
        if (result.success) {
          toast({ title: "Pergunta Enviada", description: result.message });
          const updatedQuestions = await getQuestionsForLot(lot.id);
          setLotQuestions(updatedQuestions);
          return true;
        } else {
          toast({ title: "Erro ao Enviar Pergunta", description: result.message, variant: "destructive" });
          return false;
        }
      };
    
      return (
        <TooltipPrimitive.Provider>
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
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={handlePrint} aria-label="Imprimir"><Printer className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Imprimir</p></TooltipContent></Tooltip>
                <DropdownMenu>
                  <Tooltip><TooltipTrigger asChild><DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label="Compartilhar"><Share2 className="h-4 w-4" /></Button></DropdownMenuTrigger></TooltipTrigger><TooltipContent><p>Compartilhar</p></TooltipContent></DropdownMenu>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild><a href={getSocialLink('x', currentUrl, lotTitle)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer"><X className="h-4 w-4" /> X (Twitter)</a></DropdownMenuItem>
                    <DropdownMenuItem asChild><a href={getSocialLink('facebook', currentUrl, lotTitle)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer"><Facebook className="h-4 w-4" /> Facebook</a></DropdownMenuItem>
                    <DropdownMenuItem asChild><a href={getSocialLink('whatsapp', currentUrl, lotTitle)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer"><MessageSquareText className="h-4 w-4" /> WhatsApp</a></DropdownMenuItem>
                    <DropdownMenuItem asChild><a href={getSocialLink('email', currentUrl, lotTitle)} className="flex items-center gap-2 cursor-pointer"><Mail className="h-4 w-4" /> Email</a></DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" asChild aria-label="Voltar para o leilão"><Link href={`/auctions/${auction.id}`}><ArrowLeft className="h-4 w-4" /></Link></Button></TooltipTrigger><TooltipContent><p>Voltar para o Leilão</p></TooltipContent></Tooltip>
              </div>
            </div>
    
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span className="font-medium text-foreground">Lote Nº: {actualLotNumber}</span>
                <div className="flex items-center gap-2">
                    <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" asChild={!!previousLotId} disabled={!previousLotId} aria-label="Lote Anterior">{previousLotId ? <Link href={`/auctions/${auction.id}/lots/${previousLotId}`}><ChevronLeft className="h-4 w-4" /></Link> : <ChevronLeft className="h-4 w-4" />}</Button></TooltipTrigger><TooltipContent><p>Lote Anterior</p></TooltipContent></Tooltip>
                    <span className="text-sm text-muted-foreground mx-1">Lote {displayLotPosition} de {displayTotalLots}</span>
                    <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" asChild={!!nextLotId} disabled={!nextLotId} aria-label="Próximo Lote">{nextLotId ? <Link href={`/auctions/${auction.id}/lots/${nextLotId}`}><ChevronRight className="h-4 w-4" /></Link> : <ChevronRight className="h-4 w-4" />}</Button></TooltipTrigger><TooltipContent><p>Próximo Lote</p></TooltipContent></Tooltip>
                </div>
            </div>
    
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna da Galeria e Detalhes */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="shadow-lg">
                  <CardContent className="p-4">
                    <div className="relative aspect-[16/9] w-full bg-muted rounded-md overflow-hidden mb-4">
                      {gallery.length > 0 && gallery[currentImageIndex] ? (
                        <Image src={gallery[currentImageIndex]} alt={`Imagem ${currentImageIndex + 1} de ${lot.title}`} fill className="object-contain" data-ai-hint={lot.dataAiHint || "imagem principal lote"} priority={currentImageIndex === 0} unoptimized={gallery[currentImageIndex]?.startsWith('https://placehold.co')}/>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground"><ImageOff className="h-16 w-16 mb-2" /><span>Imagem principal não disponível</span></div>
                      )}
                      {gallery.length > 1 && (
                        <><Button variant="outline" size="icon" onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background h-9 w-9 rounded-full shadow-md" aria-label="Imagem Anterior"><ChevronLeft className="h-5 w-5" /></Button>
                          <Button variant="outline" size="icon" onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background h-9 w-9 rounded-full shadow-md" aria-label="Próxima Imagem"><ChevronRight className="h-5 w-5" /></Button></>
                      )}
                    </div>
                    {gallery.length > 1 && (
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2">
                        {gallery.map((url, index) => (<button key={index} className={`relative aspect-square bg-muted rounded overflow-hidden border-2 transition-all ${index === currentImageIndex ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent hover:border-muted-foreground/50'}`} onClick={() => setCurrentImageIndex(index)} aria-label={`Ver imagem ${index + 1}`}><Image src={url} alt={`Miniatura ${index + 1}`} fill className="object-cover" data-ai-hint={lot.dataAiHint || 'imagem galeria carro'} unoptimized={url.startsWith('https://placehold.co')} /></button>))}
                      </div>
                    )}
                    {gallery.length === 0 && (<p className="text-sm text-center text-muted-foreground py-4">Nenhuma imagem na galeria.</p>)}
                    <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                      {lot.hasKey && <span className="flex items-center"><Key className="h-4 w-4 mr-1 text-primary"/> Chave Presente</span>}
                      <span className="flex items-center"><MapPin className="h-4 w-4 mr-1 text-primary"/> Localização: {lotLocation}</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-lg"> {/* Card for Tabs */}
                  <CardContent className="p-0 sm:p-2 md:p-4"> {/* Adjusted padding */}
                    <Tabs defaultValue="description" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-4">
                        <TabsTrigger value="description">Descrição</TabsTrigger>
                        <TabsTrigger value="specification">Especificações</TabsTrigger>
                        <TabsTrigger value="seller">Comitente</TabsTrigger>
                        <TabsTrigger value="reviews">Avaliações</TabsTrigger>
                        <TabsTrigger value="questions">Perguntas</TabsTrigger>
                      </TabsList>
                      <TabsContent value="description"><LotDescriptionTab lot={lot} /></TabsContent>
                      <TabsContent value="specification"><LotSpecificationTab lot={lot} /></TabsContent>
                      <TabsContent value="seller"><LotSellerTab sellerName={initialSellerName || auction.seller || "Não Informado"} sellerId={lot.sellerId} auctionSellerName={auction.seller} /></TabsContent>
                      <TabsContent value="reviews"><LotReviewsTab lot={lot} reviews={lotReviews} isLoading={isLoadingData} onNewReview={handleNewReview} canUserReview={canUserReview} /></TabsContent>
                      <TabsContent value="questions"><LotQuestionsTab lot={lot} questions={lotQuestions} isLoading={isLoadingData} onNewQuestion={handleNewQuestion} canUserAskQuestion={canUserAskQuestion} /></TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
    
              {/* Coluna de Ação e Informações */}
              <div className="space-y-6 lg:sticky lg:top-24">
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
                    {canUserBid ? (
                      <div className="space-y-2">
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input type="number" placeholder={`Mínimo R$ ${nextMinimumBid.toLocaleString('pt-BR')}`} value={bidAmountInput} onChange={(e) => setBidAmountInput(e.target.value)} className="pl-9 h-11 text-base" min={nextMinimumBid} step={bidIncrement} disabled={isPlacingBid} />
                        </div>
                        <Button onClick={handlePlaceBid} disabled={isPlacingBid || !bidAmountInput} className="w-full h-11 text-base">
                          {isPlacingBid ? <Loader2 className="animate-spin" /> : `Dar Lance (R$ ${parseFloat(bidAmountInput || '0').toLocaleString('pt-BR') || nextMinimumBid.toLocaleString('pt-BR') })`}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground p-3 bg-secondary/50 rounded-md">
                        <p>{lot.status !== 'ABERTO_PARA_LANCES' ? `Lances para este lote estão ${getAuctionStatusText(lot.status).toLowerCase()}.` : (user ? 'Você precisa estar habilitado para dar lances.' : 'Você precisa estar logado para dar lances.')}</p>
                        {!user && <Link href={`/auth/login?redirect=/auctions/${auction.id}/lots/${lot.id}`} className="text-primary hover:underline font-medium">Faça login ou registre-se.</Link>}
                      </div>
                    )}
                    <Button variant="outline" className="w-full" onClick={handleToggleFavorite}>
                      <Heart className={`mr-2 h-4 w-4 ${isLotFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                      {isLotFavorite ? 'Remover da Minha Lista' : 'Adicionar à Minha Lista'}
                    </Button>
                  </CardContent>
                </Card>
    
                <Card className="shadow-md">
                  <CardHeader><CardTitle className="text-xl flex items-center">Informações da Venda <Info className="h-4 w-4 ml-2 text-muted-foreground" /></CardTitle></CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    {Object.entries({
                      "Filial de Venda:": lot.sellingBranch || auction.sellingBranch,
                      "Localização do Veículo:": lot.vehicleLocationInBranch || lotLocation,
                      "Data e Hora do Leilão (Lote):": lot.lotSpecificAuctionDate ? format(new Date(lot.lotSpecificAuctionDate), "dd/MM/yyyy HH:mm'h'", { locale: ptBR }) : 'N/A',
                      "Pista/Corrida #:": lot.laneRunNumber,
                      "Corredor/Vaga:": lot.aisleStall,
                      "Valor Real em Dinheiro (VCV):": lot.actualCashValue,
                      "Custo Estimado de Reparo:": lot.estimatedRepairCost,
                      "Vendedor:": lot.sellerName || auction.seller || initialSellerName,
                      "Documento (Título/Venda):": lot.titleInfo,
                      "Marca do Documento:": lot.titleBrand,
                    }).map(([key, value]) => value ? <div key={key}><span className="font-medium text-foreground">{key}</span> <span className="text-muted-foreground">{String(value)}</span></div> : null)}
                  </CardContent>
                </Card>
    
                <Card className="shadow-md">
                  <CardHeader><CardTitle className="text-xl flex items-center">Histórico de Lances</CardTitle></CardHeader>
                  <CardContent>
                      {isLoadingData ? (
                        <div className="flex items-center justify-center h-20"> <Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                      ) : lotBids.length > 0 ? (
                          <ul className="space-y-2 text-sm max-h-60 overflow-y-auto pr-2">
                              {lotBids.slice(0, 5).map(bid => (
                                  <li key={bid.id} className="flex justify-between items-center p-2 bg-secondary/40 rounded-md">
                                      <div>
                                          <span className="font-medium text-foreground">{bid.bidderDisplay}</span>
                                          <span className="text-xs text-muted-foreground ml-2">({bid.timestamp ? format(new Date(bid.timestamp), "dd/MM HH:mm:ss", { locale: ptBR }) : 'Data Indisponível'})</span>
                                      </div>
                                      <span className="font-semibold text-primary">R$ {bid.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </li>
                              ))}
                              {lotBids.length > 5 && <p className="text-xs text-center mt-2 text-muted-foreground">...</p>}
                          </ul>
                      ) : (
                          <p className="text-sm text-muted-foreground text-center py-3">Nenhum lance registrado para este lote ainda.</p>
                      )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          {lot && auction && (
            <LotPreviewModal
              lot={lot}
              auction={auction}
              isOpen={isPreviewModalOpen}
              onClose={() => setIsPreviewModalOpen(false)}
            />
          )}
        </TooltipPrimitive.Provider>
      );
    }
    
    