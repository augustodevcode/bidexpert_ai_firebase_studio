
// src/app/auctions/[auctionId]/lots/[lotId]/v2/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator, Tabs, TabsContent, TabsList, TabsTrigger, Input, Label, Textarea
} from '@/components/ui'; 
import { 
  Building2, MapPin, Calendar, Clock, TrendingDown, FileText, Share2, Heart, Phone, Mail, Eye, Users, Gavel, ChevronLeft, ChevronRight, AlertCircle, Download, MessageCircle, Gem, Percent, Banknote, CreditCard, Home, ListOrdered, Laptop, Calculator, Repeat, LogIn, Presentation, Loader2, Send
} from 'lucide-react';
import type { Lot, Auction, SellerProfileInfo, AuctioneerProfileInfo, BidInfo, LotQuestion, Review } from '@/types';
import { LotService } from '@/services/lot.service';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';

const lotService = new LotService();

const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
};

const TimeRemainingDisplay = ({ endDate }: { endDate: Date }) => {
    const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const difference = endDate.getTime() - now.getTime();

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);
                setTimeRemaining({ days, hours, minutes, seconds });
            } else {
                setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [endDate]);
    
    return (
        <div className="grid grid-cols-4 gap-2 mb-6 countdown-timer">
          <div className="text-center timer-dias">
            <div className="bg-slate-900 text-white rounded-lg p-3 mb-1">
              <div className="text-2xl font-bold">{String(timeRemaining.days).padStart(2, '0')}</div>
            </div>
            <div className="text-xs text-slate-600">dias</div>
          </div>
          <div className="text-center timer-horas">
            <div className="bg-slate-900 text-white rounded-lg p-3 mb-1">
              <div className="text-2xl font-bold">{String(timeRemaining.hours).padStart(2, '0')}</div>
            </div>
            <div className="text-xs text-slate-600">horas</div>
          </div>
          <div className="text-center timer-minutos">
            <div className="bg-slate-900 text-white rounded-lg p-3 mb-1">
              <div className="text-2xl font-bold">{String(timeRemaining.minutes).padStart(2, '0')}</div>
            </div>
            <div className="text-xs text-slate-600">min</div>
          </div>
          <div className="text-center timer-segundos">
            <div className="bg-slate-900 text-white rounded-lg p-3 mb-1">
              <div className="text-2xl font-bold">{String(timeRemaining.seconds).padStart(2, '0')}</div>
            </div>
            <div className="text-xs text-slate-600">seg</div>
          </div>
        </div>
    );
};

export default function LotDetailPageV2({ params }: { params: { lotId: string } }) {
    const [lotData, setLotData] = useState<{
        lot: Lot;
        auction: Auction;
        seller: SellerProfileInfo | null;
        auctioneer: AuctioneerProfileInfo | null;
        bids: BidInfo[];
        questions: LotQuestion[];
        reviews: Review[];
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [activeTab, setActiveTab] = useState('description');
    const [isLoggedIn, setIsLoggedIn] = useState(true); // Simulado
    const [isAuctionOpen, setIsAuctionOpen] = useState(true); // Simulado
    const [quickBid, setQuickBid] = useState(false); // Simulado
    
    const fetchLotData = useCallback(async () => {
        try {
            const data = await lotService.getLotDetailsForV2(params.lotId);
            if (!data) {
                throw new Error("Lote não encontrado.");
            }
            setLotData(data);
        } catch (err: any) {
            setError(err.message);
            toast({ title: 'Erro ao carregar o lote', description: err.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [params.lotId, toast]);

    useEffect(() => {
        fetchLotData();
    }, [fetchLotData]);

    const nextImage = () => {
        if (!lotData) return;
        const images = [lotData.lot.imageUrl, ...(lotData.lot.galleryImageUrls || [])].filter(Boolean);
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        if (!lotData) return;
        const images = [lotData.lot.imageUrl, ...(lotData.lot.galleryImageUrls || [])].filter(Boolean);
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div>;
    }

    if (error || !lotData) {
        return <div className="text-center py-20"><AlertCircle className="mx-auto h-12 w-12 text-destructive" /><p className="mt-4">{error || "Não foi possível carregar os dados do lote."}</p></div>;
    }

    const { lot, auction, seller, auctioneer, bids, questions, reviews } = lotData;
    const images = [lot.imageUrl, ...(lot.galleryImageUrls || [])].filter(Boolean) as string[];
    const valorAvaliacao = lot.evaluationValue || 0;
    const incremento = lot.bidIncrementStep || 5000.00;
    
    const pracas = auction.auctionStages?.map((stage, index) => ({
      numero: stage.name,
      data: format(new Date(stage.startDate), 'dd/MM', { locale: ptBR }),
      hora: format(new Date(stage.startDate), 'HH:mm', { locale: ptBR }),
      lanceInicial: stage.initialPrice || 0,
      desagio: valorAvaliacao && stage.initialPrice ? Math.round(((valorAvaliacao - stage.initialPrice) / valorAvaliacao) * 100) : 0,
      status: new Date() > new Date(stage.startDate) && new Date() < new Date(stage.endDate) ? 'destaque' : 'inativa'
    })) || [];
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 font-sans viewer-leilao">
            <div className="max-w-7xl mx-auto px-4 py-6 conteudo-principal">
                <div className="grid lg:grid-cols-3 gap-6">
                
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6 coluna-esquerda">
                        <div className="bloco-titulo-endereco">
                            <h1 className="text-3xl font-bold text-slate-900 mb-3 titulo-imovel">{lot.title}</h1>
                            <div className="flex items-start gap-2 text-slate-600">
                                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-purple-600" />
                                <p className="text-lg endereco-imovel">{lot.mapAddress || `${lot.cityName}, ${lot.stateUf}`}</p>
                            </div>
                        </div>

                        {/* Image Gallery */}
                        <Card className="overflow-hidden shadow-lg galeria-imagens-card">
                            <CardContent className="p-0">
                                <div className="relative aspect-video bg-slate-900">
                                <img src={images.length > 0 ? images[currentImageIndex] : 'https://placehold.co/825x502/64748b/ffffff?text=Imagem+Indisponível'} alt="Imóvel" className="w-full h-full object-cover imagem-principal-galeria" />
                                <div className="absolute top-4 left-4 flex gap-2 flex-wrap tags-galeria">
                                    <Badge className="bg-red-600 text-white tag-ocupado">OCUPADO</Badge>
                                    <Badge className="bg-blue-600 text-white tag-tipo-processo">{auction.auctionType}</Badge>
                                    <Badge className="bg-green-600 text-white tag-valor-avaliacao">Avaliação: {formatCurrency(valorAvaliacao)}</Badge>
                                </div>
                                <button onClick={() => setIsFavorite(!isFavorite)} className="absolute top-4 right-4 p-2 bg-white/90 rounded-full hover:bg-white transition botao-favoritar-galeria">
                                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-600'}`} />
                                </button>
                                <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full hover:bg-white transition botao-imagem-anterior"><ChevronLeft className="w-5 h-5" /></button>
                                <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full hover:bg-white transition botao-imagem-proxima"><ChevronRight className="w-5 h-5" /></button>
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bullets-galeria">
                                    {images.map((_, index) => (<button key={index} onClick={() => setCurrentImageIndex(index)} className={`w-2 h-2 rounded-full transition bullet-galeria-item ${index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'}`} />))}
                                </div>
                                </div>
                                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 thumbnails-galeria">
                                {images.map((img, index) => (<button key={index} onClick={() => setCurrentImageIndex(index)} className={`aspect-video overflow-hidden rounded border-2 transition thumbnail-galeria-item ${index === currentImageIndex ? 'border-purple-600' : 'border-transparent'}`}><img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" /></button>))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* O restante do conteúdo da coluna esquerda... */}

                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-1 space-y-4 coluna-direita">
                        <div className="flex items-center justify-end gap-2 pt-2 acoes-topo-direita">
                          <Button variant="outline" size="sm" onClick={() => setIsFavorite(!isFavorite)} className="p-2 rounded-full botao-favoritar-topo" title="Adicionar aos Favoritos">
                            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-600'}`} />
                          </Button>
                          <Button variant="outline" size="sm" className="p-2 rounded-full botao-compartilhar-topo" title="Compartilhar">
                            <Share2 className="w-4 h-4 text-slate-600" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-purple-600 border-purple-600 hover:bg-purple-50 hover:text-purple-700 botao-auditorio-virtual" asChild>
                            <Link href={`/auctions/${auction.id}/live`}><Presentation className="w-4 h-4 mr-2" /> Auditório Virtual</Link>
                          </Button>
                        </div>
                        {/* Countdown Timer */}
                        <Card className="border-2 border-purple-200 shadow-lg countdown-card">
                          <CardHeader className="bg-gradient-to-br from-purple-600 to-purple-700 text-white countdown-header">
                            <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" /> Encerra em:</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-6">
                            {lot.endDate && <TimeRemainingDisplay endDate={new Date(lot.endDate)} />}
                            {/* Restante da lógica de lance */}
                          </CardContent>
                        </Card>
                        {/* O restante do conteúdo da coluna direita... */}
                    </div>
                </div>
            </div>
        </div>
    );
}

// UI simulada para evitar erros de importação no exemplo
const ui = { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button, Separator, Tabs, TabsContent, TabsList, TabsTrigger, Input, Label, Textarea };
