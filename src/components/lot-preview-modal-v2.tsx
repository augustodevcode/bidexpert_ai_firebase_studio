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
  AlertCircle
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { differenceInHours, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getEffectiveLotEndDate } from '@/lib/ui-helpers';
import BidExpertAuctionStagesTimeline from './auction/BidExpertAuctionStagesTimeline';
import LotCountdown from './lot-countdown';

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
  if (!isOpen || !lot) return null;
  
  const gallery = useMemo(() => {
    const images = [lot.imageUrl, ...(lot.galleryImageUrls || [])].filter(Boolean) as string[];
    if (images.length === 0) {
      images.push('https://placehold.co/800x600.png?text=Imagem+Indisponivel');
    }
    return images;
  }, [lot.imageUrl, lot.galleryImageUrls]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
    { label: 'Interessados', value: auction?.qualifiedBiddersCount || 0, icon: Users, color: 'text-purple-600' }
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
      <DialogContent className="max-w-[950px] h-[90vh] p-0 overflow-hidden">
        <div className="grid grid-cols-5 h-full">
          {/* Galeria de Imagens - 3/5 */}
          <div className="col-span-3 bg-black relative flex items-center justify-center">
            <div className="relative w-full h-full">
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
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white h-10 w-10 rounded-full shadow-lg"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white h-10 w-10 rounded-full shadow-lg"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                  
                  {/* Indicadores de posição */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {gallery.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex 
                            ? 'bg-white w-6' 
                            : 'bg-white/50 hover:bg-white/75'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
              
              {/* Botões de ação rápida */}
              <div className="absolute top-4 right-4 flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  className="bg-white/90 hover:bg-white rounded-full"
                >
                  <Heart className="h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="bg-white/90 hover:bg-white rounded-full"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Badge de urgência */}
              {urgencyBadge && (
                <div className="absolute top-4 left-4">
                  <Badge className={`${urgencyBadge.color} text-white px-3 py-1 text-sm font-bold`}>
                    <urgencyBadge.icon className="h-4 w-4 mr-1" />
                    {urgencyBadge.text}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar de Informações - 2/5 */}
          <div className="col-span-2 overflow-y-auto bg-background">
            <div className="p-6 space-y-6">
              {/* Título e número do lote */}
              <div>
                <h2 className="text-2xl font-bold mb-1">{lot.title}</h2>
                <p className="text-sm text-muted-foreground">
                  Lote Nº {lot.number || lot.id.replace('LOTE', '')}
                </p>
              </div>

              {/* Preço e lance */}
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Lance Atual</p>
                    <p className="text-4xl font-bold text-primary">
                      R$ {lot.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                        Valor de avaliação: R$ {lot.evaluationValue.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Próximo lance: <strong>R$ {nextBidAmount.toLocaleString('pt-BR')}</strong></span>
                  </div>
                </div>
              </Card>

              {/* Countdown */}
              {effectiveLotEndDate && (
                <Card className="bg-destructive/5 border-destructive/20">
                  <div className="p-4 text-center">
                    <p className="text-sm text-destructive font-semibold uppercase mb-2">
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
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Estatísticas
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {stats.map((stat) => (
                    <div key={stat.label} className="bg-secondary/30 p-3 rounded-lg text-center">
                      <stat.icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
                      <p className="text-xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline de praças */}
              {auction?.auctionStages && auction.auctionStages.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Praças do Leilão
                    </h3>
                    <BidExpertAuctionStagesTimeline
                      auctionOverallStartDate={new Date(auction.auctionDate as string)}
                      stages={auction.auctionStages}
                    />
                  </div>
                </>
              )}

              <Separator />

              {/* Benefícios e Confiança */}
              <div>
                <h3 className="font-semibold mb-3">Por que participar?</h3>
                <div className="space-y-2">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <benefit.icon className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span>{benefit.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Localização */}
              {(lot.city || lot.state) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{lot.city}{lot.city && lot.state ? ', ' : ''}{lot.state}</span>
                </div>
              )}

              {/* CTA Principal */}
              <div className="space-y-3 sticky bottom-0 bg-background pt-4 pb-2">
                <Button 
                  asChild 
                  size="lg" 
                  className="w-full text-lg font-bold"
                  onClick={onClose}
                >
                  <Link href={lotDetailUrl}>
                    <Gavel className="mr-2 h-5 w-5" />
                    Ver Detalhes Completos e Dar Lance
                    <ChevronRight className="ml-2 h-5 w-5" />
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
