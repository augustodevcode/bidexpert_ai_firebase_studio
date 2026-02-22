// src/components/lot-preview-modal-v2.tsx
'use client';

import * as React from 'react';
import type { Lot, Auction, PlatformSettings } from '@/types';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  Share2, 
  Eye, 
  Gavel, 
  TrendingUp, 
  Users, 
  Shield, 
  CheckCircle,
  Calendar,
  MapPin,
  Clock,
  Award,
  Zap,
  AlertCircle,
  Facebook,
  MessageSquareText,
  Mail,
  X,
  Copy
} from 'lucide-react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { differenceInHours, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getEffectiveLotEndDate } from '@/lib/ui-helpers';
import BidExpertAuctionStagesTimeline from './auction/BidExpertAuctionStagesTimeline';
import LotCountdown from './lot-countdown';
import { useToast } from '@/hooks/use-toast';
import { isLotFavoriteInStorage, addFavoriteLotIdToStorage, removeFavoriteLotIdFromStorage } from '@/lib/favorite-store';
import { useCurrency } from '@/contexts/currency-context';
import GoToLiveAuctionButton from '@/components/auction/go-to-live-auction-button';

interface LotPreviewModalV2Props {
  lot: Lot | null;
  auction?: Auction;
  platformSettings: PlatformSettings;
  isOpen: boolean;
  onClose: () => void;
}

// Badge de urgência baseado em tempo restante
const getUrgencyBadge = (endDate: Date | null, bidsCount: number, views: number, discountPercentage: number) => {
  if (!endDate) return null;
  
  const hoursLeft = differenceInHours(endDate, new Date());
  
  if (hoursLeft < 2) {
    return { text: 'ENCERRANDO AGORA', color: 'bg-red-600 animate-pulse', icon: AlertCircle };
  } else if (hoursLeft < 24) {
    return { text: 'ÚLTIMAS HORAS', color: 'bg-orange-600', icon: Clock };
  } else if (discountPercentage > 0) {
    return { text: `${discountPercentage}% OFF`, color: 'bg-green-600', icon: Award };
  } else if (bidsCount > 10) {
    return { text: 'ALTA DEMANDA', color: 'bg-blue-600', icon: TrendingUp };
  } else if (views > 100) {
    return { text: 'MUITO VISITADO', color: 'bg-purple-600', icon: Eye };
  }
  
  return null;
};

export default function LotPreviewModalV2({ lot, auction, platformSettings, isOpen, onClose }: LotPreviewModalV2Props) {
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const [isFavorite, setIsFavorite] = useState(false);
  const [lotFullUrl, setLotFullUrl] = useState('');
  
  if (!isOpen || !lot) return null;
  
  const gallery = useMemo(() => {
    const images = [lot.imageUrl, ...(lot.galleryImageUrls || [])].filter(Boolean) as string[];
    if (images.length === 0) {
      images.push('https://placehold.co/800x600.png?text=Imagem+Indisponivel');
    }
    return images;
  }, [lot.imageUrl, lot.galleryImageUrls]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Initialize favorite state and URL
  useEffect(() => {
    if (lot?.id) {
      setIsFavorite(isLotFavoriteInStorage(lot.id.toString()));
      if (typeof window !== 'undefined') {
        const auctionIdForUrl = auction?.publicId || auction?.id || lot.auctionId;
        const lotIdForUrl = lot.publicId || lot.id;
        setLotFullUrl(`${window.location.origin}/auctions/${auctionIdForUrl}/lots/${lotIdForUrl}`);
      }
    }
  }, [lot?.id, lot?.publicId, lot?.auctionId, auction?.id, auction?.publicId]);

  const handleFavoriteToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!lot) return;
    
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    
    if (newFavoriteState) {
      addFavoriteLotIdToStorage(lot.id.toString());
    } else {
      removeFavoriteLotIdFromStorage(lot.id.toString());
    }
    
    toast({
      title: newFavoriteState ? "Adicionado aos Favoritos" : "Removido dos Favoritos",
      description: `O lote "${lot.title}" foi ${newFavoriteState ? 'adicionado à' : 'removido da'} sua lista.`,
    });
  }, [lot, isFavorite, toast]);

  const getSocialLink = (platform: 'x' | 'facebook' | 'whatsapp' | 'email', url: string, title: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    switch(platform) {
      case 'x': return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
      case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case 'whatsapp': return `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
      case 'email': return `mailto:?subject=${encodedTitle}&body=${encodedUrl}`;
    }
  };

  const handleCopyLink = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!lotFullUrl) return;
    
    try {
      await navigator.clipboard.writeText(lotFullUrl);
      toast({
        title: "Link copiado!",
        description: "O link do lote foi copiado para a área de transferência.",
      });
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  }, [lotFullUrl, toast]);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!lot) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: lot.title,
          text: `Confira este lote: ${lot.title}`,
          url: lotFullUrl,
        });
      } catch (err) {
        // User cancelled sharing or error occurred
      }
    }
  }, [lot, lotFullUrl]);

  const nextImage = (e: React.MouseEvent) => { 
    e.stopPropagation(); 
    setCurrentImageIndex((prev) => (prev + 1) % gallery.length); 
  };
  
  const prevImage = (e: React.MouseEvent) => { 
    e.stopPropagation(); 
    setCurrentImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length); 
  };

  const auctionIdForUrl = auction?.publicId || auction?.id || lot.auctionId;
  const lotIdForUrl = lot.publicId || lot.id;
  const lotDetailUrl = `/auctions/${auctionIdForUrl}/lots/${lotIdForUrl}`;
  
  // Cálculo de desconto
  const discountPercentage = useMemo(() => {
    if (lot.initialPrice && lot.secondInitialPrice && lot.secondInitialPrice < lot.initialPrice) {
      return Math.round(((lot.initialPrice - lot.secondInitialPrice) / lot.initialPrice) * 100);
    }
    return lot.discountPercentage || 0;
  }, [lot.initialPrice, lot.secondInitialPrice, lot.discountPercentage]);

  // Progresso do preço em relação à avaliação
  const priceProgress = useMemo(() => {
    if (lot.evaluationValue && lot.price) {
      return Math.min((lot.price / lot.evaluationValue) * 100, 100);
    }
    return 0;
  }, [lot.price, lot.evaluationValue]);

  const { effectiveLotEndDate } = getEffectiveLotEndDate(lot, auction);
  
  const urgencyBadge = getUrgencyBadge(
    effectiveLotEndDate, 
    lot.bidsCount || 0, 
    lot.views || 0, 
    discountPercentage
  );

  const nextBidAmount = lot.price + (lot.bidIncrementStep || 100);

  // Estatísticas de prova social
  const stats = [
    { label: 'Visualizações', value: lot.views || 0, icon: Eye, color: 'text-blue-600' },
    { label: 'Lances', value: lot.bidsCount || 0, icon: Gavel, color: 'text-green-600' },
    { label: 'Interessados', value: (auction as any)?.qualifiedBiddersCount || 0, icon: Users, color: 'text-purple-600' }
  ];

  // Benefícios da plataforma
  const benefits = [
    { icon: Shield, text: 'Plataforma 100% Segura' },
    { icon: CheckCircle, text: 'Leilões Oficiais Certificados' },
    { icon: Zap, text: 'Processo 100% Online' },
    { icon: Award, text: 'Leiloeiro Credenciado' },
    { icon: Users, text: `${stats[2].value}+ Participantes` }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[950px] max-h-[90vh] p-0 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-5 h-full max-h-[90vh]">
          {/* Galeria de Imagens - 3/5 em desktop, full width em mobile */}
          <div className="col-span-1 md:col-span-3 bg-black relative flex flex-col min-h-[250px] md:min-h-0">
            {/* Imagem principal */}
            <div className="relative flex-1 min-h-[200px] md:min-h-[400px]">
              <Image 
                src={gallery[currentImageIndex]} 
                alt={lot.title}
                fill
                className="object-contain"
                priority
              />
              
              {/* Navegação da galeria */}
              {gallery.length > 1 && (
                <>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={prevImage}
                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white h-8 w-8 md:h-10 md:w-10 rounded-full shadow-lg z-10"
                  >
                    <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={nextImage}
                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white h-8 w-8 md:h-10 md:w-10 rounded-full shadow-lg z-10"
                  >
                    <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
                  </Button>
                </>
              )}
              
              {/* Botões de ação rápida */}
              <div className="absolute top-2 md:top-4 right-2 md:right-4 flex gap-2 z-10">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleFavoriteToggle}
                  className={`bg-white/90 hover:bg-white rounded-full h-8 w-8 md:h-10 md:w-10 ${isFavorite ? 'text-red-500' : ''}`}
                  aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                >
                  <Heart className={`h-4 w-4 md:h-5 md:w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="bg-white/90 hover:bg-white rounded-full h-8 w-8 md:h-10 md:w-10"
                      aria-label="Compartilhar"
                    >
                      <Share2 className="h-4 w-4 md:h-5 md:w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <a href={getSocialLink('facebook', lotFullUrl, lot.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                        <Facebook className="h-4 w-4 text-blue-600" />
                        Facebook
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={getSocialLink('x', lotFullUrl, lot.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                        <X className="h-4 w-4" />
                        X (Twitter)
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={getSocialLink('whatsapp', lotFullUrl, lot.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                        <MessageSquareText className="h-4 w-4 text-green-600" />
                        WhatsApp
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={getSocialLink('email', lotFullUrl, lot.title)} className="flex items-center gap-2 cursor-pointer">
                        <Mail className="h-4 w-4 text-orange-600" />
                        E-mail
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyLink} className="flex items-center gap-2 cursor-pointer">
                      <Copy className="h-4 w-4 text-gray-600" />
                      Copiar Link
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Badge de urgência */}
              {urgencyBadge && (
                <div className="absolute top-2 md:top-4 left-2 md:left-4 z-10">
                  <Badge className={`${urgencyBadge.color} text-white px-2 md:px-3 py-1 text-xs md:text-sm font-bold`}>
                    <urgencyBadge.icon className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    {urgencyBadge.text}
                  </Badge>
                </div>
              )}
            </div>
            
            {/* Thumbnails do carousel */}
            {gallery.length > 1 && (
              <div className="bg-black/80 p-2 md:p-3">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  {gallery.map((img, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(index);
                      }}
                      className={`relative flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-md overflow-hidden transition-all ${
                        index === currentImageIndex 
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-black' 
                          : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`Miniatura ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs text-white/70 mt-2">
                  {currentImageIndex + 1} de {gallery.length} imagens
                </p>
              </div>
            )}
          </div>

          {/* Sidebar de Informações - 2/5 em desktop, full width em mobile */}
          <div className="col-span-1 md:col-span-2 overflow-y-auto bg-background max-h-[50vh] md:max-h-none">
            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              {/* Título e número do lote */}
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-1">{lot.title}</h2>
                <p className="text-sm text-muted-foreground">
                  Lote Nº {lot.number || lot.id.replace('LOTE', '')}
                </p>
              </div>

              {/* Preço e lance */}
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <div className="p-3 md:p-4 space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Lance Atual</p>
                    <p className="text-2xl md:text-4xl font-bold text-primary">
                      {formatCurrency(lot.price)}
                    </p>
                  </div>
                  
                  {lot.evaluationValue && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progresso do lance</span>
                        <span>{priceProgress.toFixed(0)}% do valor de avaliação</span>
                      </div>
                      <Progress value={priceProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        Valor de avaliação: {formatCurrency(lot.evaluationValue)}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Próximo lance: <strong>{formatCurrency(nextBidAmount)}</strong></span>
                  </div>
                </div>
              </Card>

              {/* Countdown */}
              {effectiveLotEndDate && (
                <Card className="bg-destructive/5 border-destructive/20">
                  <div className="p-3 md:p-4 text-center">
                    <p className="text-xs md:text-sm text-destructive font-semibold uppercase mb-2">
                      Encerramento
                    </p>
                    <LotCountdown endDate={effectiveLotEndDate} status={lot.status as any} />
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(effectiveLotEndDate, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </Card>
              )}

              <Separator />

              {/* Estatísticas - Prova Social */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm md:text-base">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                  Estatísticas
                </h3>
                <div className="grid grid-cols-3 gap-1 md:gap-2">
                  {stats.map((stat) => (
                    <div key={stat.label} className="bg-secondary/30 p-2 md:p-3 rounded-lg text-center">
                      <stat.icon className={`h-4 w-4 md:h-5 md:w-5 mx-auto mb-1 ${stat.color}`} />
                      <p className="text-lg md:text-xl font-bold">{stat.value}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline de praças */}
              {auction?.auctionStages && auction.auctionStages.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm md:text-base">
                      <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                      Praças do Leilão
                    </h3>
                    <BidExpertAuctionStagesTimeline
                      auctionOverallStartDate={auction.auctionDate ? new Date(auction.auctionDate as unknown as string) : new Date()}
                      stages={auction.auctionStages}
                      lot={lot}
                    />
                  </div>
                </>
              )}

              <Separator />

              {/* Benefícios e Confiança */}
              <div>
                <h3 className="font-semibold mb-2 md:mb-3 text-sm md:text-base">Por que participar?</h3>
                <div className="space-y-1.5 md:space-y-2">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs md:text-sm">
                      <benefit.icon className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600 flex-shrink-0" />
                      <span>{benefit.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Localização */}
              {(lot.cityName || lot.stateUf) && (
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span>{lot.cityName}{lot.cityName && lot.stateUf ? ', ' : ''}{lot.stateUf}</span>
                </div>
              )}

              {/* CTA Principal */}
              <div className="space-y-2 md:space-y-3 sticky bottom-0 bg-background pt-3 md:pt-4 pb-2">
                {auction && (
                  <GoToLiveAuctionButton
                    auction={auction}
                    className="w-full"
                    size="lg"
                    label="Ir para pregão online"
                    dataAiId="lot-preview-go-live-btn"
                  />
                )}
                <Button 
                  asChild 
                  size="lg" 
                  className="w-full text-sm md:text-lg font-bold"
                  onClick={onClose}
                >
                  <Link href={lotDetailUrl}>
                    <Gavel className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                    <span className="hidden sm:inline">Ver Detalhes Completos e Dar Lance</span>
                    <span className="sm:hidden">Ver Detalhes e Dar Lance</span>
                    <ChevronRight className="ml-1 md:ml-2 h-4 w-4 md:h-5 md:w-5" />
                  </Link>
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Cadastre-se gratuitamente • Processo 100% online
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
