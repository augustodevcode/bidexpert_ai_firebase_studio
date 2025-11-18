
// src/app/auctions/[auctionId]/lots/[lotId]/v2/page.tsx
/**
 * @fileoverview Página V2 aprimorada de detalhes de lote com layout visual moderno.
 * Apresenta informações do lote em uma visualização organizada com abas,
 * galeria de imagens, cronograma de praças, contador regressivo e opções de lances.
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator, Tabs, TabsContent, TabsList, TabsTrigger, Dialog, DialogContent, DialogTrigger
} from '@/components/ui'; 
import { 
  Building2, MapPin, Calendar, Clock, TrendingDown, FileText, Share2, Heart, Phone, Mail, Eye, Users, Gavel, 
  ChevronLeft, ChevronRight, AlertCircle, Download, MessageCircle, Gem, Percent, Banknote, CreditCard, Home, 
  ListOrdered, Laptop, Calculator, Repeat, LogIn, Presentation, Loader2, Home as HomeIcon
} from 'lucide-react';
import type { Lot, Auction, SellerProfileInfo, AuctioneerProfileInfo, BidInfo, LotQuestion, Review } from '@/types';
import { getLotDetailsForV2 } from '@/app/auctions/[auctionId]/lots/[lotId]/actions';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

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

export default function LotDetailPageV2({ params }: { params: { lotId: string; auctionId: string } }) {
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
    const [isSubmittingBid, setIsSubmittingBid] = useState(false);
    const { toast } = useToast();
    
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [activeTab, setActiveTab] = useState('description');
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [isAuctionOpen, setIsAuctionOpen] = useState(true);
    const [quickBid, setQuickBid] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    
    const fetchLotData = useCallback(async () => {
        try {
            const data = await getLotDetailsForV2(params.lotId);
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
        const images = [lotData.lot.imageUrl, ...(Array.isArray(lotData.lot.galleryImageUrls) ? lotData.lot.galleryImageUrls : [])].filter(Boolean);
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        if (!lotData) return;
        const images = [lotData.lot.imageUrl, ...(Array.isArray(lotData.lot.galleryImageUrls) ? lotData.lot.galleryImageUrls : [])].filter(Boolean);
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const handleSubmitBid = async () => {
        setIsSubmittingBid(true);
        try {
            // Simula uma requisição (em produção, seria uma chamada de API)
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast({
                title: "Lance enviado com sucesso!",
                description: "Seu lance foi registrado e está concorrendo no leilão.",
                variant: "default",
            });
        } catch (error) {
            toast({
                title: "Erro ao enviar lance",
                description: "Ocorreu um erro ao processar seu lance. Tente novamente.",
                variant: "destructive",
            });
        } finally {
            setIsSubmittingBid(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div>;
    }

    if (error || !lotData) {
        return <div className="text-center py-20"><AlertCircle className="mx-auto h-12 w-12 text-destructive" /><p className="mt-4">{error || "Não foi possível carregar os dados do lote."}</p></div>;
    }

    const { lot, auction, seller, auctioneer, bids, questions, reviews } = lotData;
    const images = [lot.imageUrl, ...(Array.isArray(lot.galleryImageUrls) ? lot.galleryImageUrls : [])].filter(Boolean) as string[];
    const valorAvaliacao = lot.evaluationValue || 0;
    const incremento = lot.bidIncrementStep || 5000.00;
    // Fallback de encerramento: usa última praça quando lot.endDate não existir
    const computedEndDate: Date | null = lot.endDate
        ? new Date(lot.endDate)
        : (auction.auctionStages && auction.auctionStages.length > 0
            ? new Date(auction.auctionStages[auction.auctionStages.length - 1].endDate as any)
            : null);
    
    const pracas = auction.auctionStages?.map((stage, index) => ({
      numero: `${index + 1}ª praça`,
      data: format(new Date(stage.startDate), 'dd/MM', { locale: ptBR }),
      hora: format(new Date(stage.startDate), 'HH:mm', { locale: ptBR }),
      lanceInicial: stage.initialPrice || 0,
      desagio: valorAvaliacao && stage.initialPrice ? Math.round(((valorAvaliacao - stage.initialPrice) / valorAvaliacao) * 100) : 0,
      status: new Date() > new Date(stage.startDate) && new Date() < new Date(stage.endDate) ? 'destaque' : 'inativa'
    })) || [];
    
    const stats = {
      visitas: lot.views || 0,
      participantes: bids?.length || 0,
      lances: bids?.length || 0
    };
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 font-sans viewer-leilao">
            <div className="max-w-7xl mx-auto px-4 py-6 conteudo-principal">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* LEFT COLUMN */}
                    <div className="lg:col-span-2 space-y-6 coluna-esquerda">
                        {/* Título e Endereço */}
                        <div className="bloco-titulo-endereco">
                            <h1 className="text-3xl font-bold text-slate-900 mb-3 titulo-imovel">{lot.title}</h1>
                            <div className="flex items-start gap-2 text-slate-600">
                                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-purple-600" />
                                <p className="text-lg endereco-imovel">{lot.mapAddress || (Array.isArray((lot as any).assets) && (lot as any).assets[0]?.address) || `${lot.cityName || (Array.isArray((lot as any).assets) && (lot as any).assets[0]?.locationCity) || 'Não informado'}, ${lot.stateUf || (Array.isArray((lot as any).assets) && (lot as any).assets[0]?.locationState) || 'Não informado'}`}</p>
                            </div>
                        </div>

                        {/* Galeria de Imagens */}
                        <Card className="overflow-hidden shadow-lg galeria-imagens-card">
                            <CardContent className="p-0">
                                <div className="relative aspect-video bg-slate-900">
                                    <img src={images.length > 0 ? images[currentImageIndex] : 'https://placehold.co/825x502/64748b/ffffff?text=Imagem+Indisponível'} alt="Lote" className="w-full h-full object-cover imagem-principal-galeria cursor-zoom-in" onClick={() => setLightboxOpen(true)} />
                                    <div className="absolute top-4 left-4 flex gap-2 flex-wrap tags-galeria">
                                        <Badge className="bg-red-600 text-white tag-ocupado">DISPONÍVEL</Badge>
                                        <Badge className="bg-blue-600 text-white tag-tipo-processo">{auction.auctionType || 'Leilão'}</Badge>
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

                        {/* Detalhes do Leilão */}
                        <Card className="detalhes-leilao-card">
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                    <div className="detalhe-codigo-lote">
                                        <p className="text-sm text-slate-600 mb-1">Cód. do Lote</p>
                                        <p className="font-semibold">{lot.number || 'N/A'}</p>
                                    </div>
                                    <div className="detalhe-ordem-leilao">
                                        <ListOrdered className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                                        <p className="text-sm text-slate-600 mb-1">Modalidade</p>
                                        <p className="font-semibold text-sm">{auction.participation || 'Online'}</p>
                                    </div>
                                    <div className="detalhe-modalidade">
                                        <Laptop className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                                        <p className="text-sm text-slate-600 mb-1">Tipo</p>
                                        <p className="font-semibold text-sm">{auction.auctionType || 'Padrão'}</p>
                                    </div>
                                    <div className="detalhe-tipo-processo">
                                        <Gavel className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                                        <p className="text-sm text-slate-600 mb-1">Status</p>
                                        <p className="font-semibold text-sm">{lot.status || 'Ativo'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Oportunidade Destaque */}
                        <Card className="bg-gradient-to-br from-purple-50 via-white to-green-50 border-purple-200 shadow-lg oportunidade-card">
                            <CardHeader>
                                <CardTitle className="text-xl text-purple-700 flex items-center gap-2 oportunidade-titulo">
                                    <Gem className="w-5 h-5" />
                                    Ótima Oportunidade!
                                </CardTitle>
                                <CardDescription>Confira os destaques desta oferta:</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200 gatilho-desconto">
                                    <TrendingDown className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                                    <div>
                                        <p className="font-bold text-green-700">Desconto de {pracas.find(p => p.status === 'destaque')?.desagio || 0}%</p>
                                        <p className="text-sm text-slate-600">
                                            Avaliado em {formatCurrency(valorAvaliacao)}, com lance inicial de {formatCurrency(pracas[0]?.lanceInicial || 0)} na 1ª praça.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200 gatilho-escassez">
                                    <Clock className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                                    <div>
                                        <p className="font-bold text-red-700">Tempo Limitado</p>
                                        <p className="text-sm text-slate-600">
                                            Última etapa se encerra em breve!
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200 gatilho-prioridade">
                                    <Eye className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                                    <div>
                                        <p className="font-bold text-blue-700">Alta Procura</p>
                                        <p className="text-sm text-slate-600">
                                            Este lote já teve {stats.visitas} visitas. Não perca!
                                        </p>
                                    </div>
                                </div>

                                {stats.lances === 0 && (
                                    <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200 gatilho-primeiro-lance">
                                        <Gavel className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                                        <div>
                                            <p className="font-bold text-purple-700">Seja o Primeiro</p>
                                            <p className="text-sm text-slate-600">
                                                Nenhum lance registrado ainda. Saia na frente!
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Praças */}
                        <div className="grid md:grid-cols-2 gap-4 secao-pracas">
                            {pracas.map((praca, index) => (
                                <Card key={index} className={`praca-card praca-${index + 1} ${praca.status === 'destaque' ? 'border-2 border-green-500 shadow-lg shadow-green-100' : ''}`}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg praca-numero">{praca.numero}</CardTitle>
                                            {praca.status === 'destaque' && (
                                                <Badge className="bg-green-600 text-white">Em Andamento</Badge>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm praca-data-hora">
                                            <Calendar className="w-4 h-4 text-slate-500" />
                                            <span>{praca.data} às {praca.hora}</span>
                                        </div>
                                        <div className="text-2xl font-bold text-slate-900 praca-valor">
                                            {formatCurrency(praca.lanceInicial)}
                                        </div>
                                        {praca.desagio > 0 && (
                                            <div className="flex items-center gap-2 px-2 py-1 bg-green-50 rounded praca-desagio">
                                                <TrendingDown className="w-4 h-4 text-green-600" />
                                                <span className="text-sm font-semibold text-green-700">
                                                    {praca.desagio}% de deságio
                                                </span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Estatísticas */}
                        <Card className="stats-card">
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center stats-visitas">
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <Eye className="w-5 h-5 text-slate-500" />
                                        </div>
                                        <div className="text-2xl font-bold text-slate-900">{stats.visitas}</div>
                                        <div className="text-sm text-slate-600">Visitas</div>
                                    </div>
                                    <div className="text-center border-x stats-participantes">
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <Users className="w-5 h-5 text-slate-500" />
                                        </div>
                                        <div className="text-2xl font-bold text-slate-900">{stats.participantes}</div>
                                        <div className="text-sm text-slate-600">Participantes</div>
                                    </div>
                                    <div className="text-center stats-lances">
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <Gavel className="w-5 h-5 text-slate-500" />
                                        </div>
                                        <div className="text-2xl font-bold text-slate-900">{stats.lances}</div>
                                        <div className="text-sm text-slate-600">Lances</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Abas de Conteúdo */}
                        <Tabs defaultValue="description" className="w-full secao-tabs">
                            <TabsList className="grid w-full grid-cols-5 tabs-lista">
                                <TabsTrigger value="description" className="tab-trigger-descricao">Descrição</TabsTrigger>
                                <TabsTrigger value="characteristics" className="tab-trigger-caracteristicas">Características</TabsTrigger>
                                <TabsTrigger value="documents" className="tab-trigger-documentos">Documentos</TabsTrigger>
                                <TabsTrigger value="history" className="tab-trigger-historico">Histórico</TabsTrigger>
                                <TabsTrigger value="condicao" className="tab-trigger-condicoes">Condições</TabsTrigger>
                            </TabsList>

                            <TabsContent value="description" className="mt-4 tab-conteudo-descricao">
                                <Card>
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="prose prose-slate max-w-none">
                                            <h3>{lot.title}</h3>
                                            <p>{
                                                lot.description 
                                                || (Array.isArray((lot as any).assets) && (lot as any).assets[0]?.description)
                                                || 'Sem descrição disponível'
                                            }</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="characteristics" className="mt-4 tab-conteudo-caracteristicas">
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-slate-600 mb-1">Lote</p>
                                                <p className="font-semibold">{lot.number || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-600 mb-1">Valor de Avaliação</p>
                                                <p className="font-semibold">{formatCurrency(valorAvaliacao)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-600 mb-1">Incremento Mínimo</p>
                                                <p className="font-semibold">{formatCurrency(incremento)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-600 mb-1">Cidade</p>
                                                <p className="font-semibold">{lot.cityName || (Array.isArray((lot as any).assets) && (lot as any).assets[0]?.locationCity) || 'Não informado'}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="documents" className="mt-4 tab-conteudo-documentos">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Documentação</CardTitle>
                                        <CardDescription>Edital e regulamentação do leilão</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="border-l-4 border-purple-500 pl-4 py-3">
                                            <h4 className="font-semibold text-slate-900 mb-2">Edital de Licitação</h4>
                                            <p className="text-sm text-slate-600 mb-4">
                                                Este leilão é realizado de acordo com as normas e regulamentos estabelecidos no Edital abaixo. Recomendamos ler integralmente antes de participar.
                                            </p>
                                            <div className="space-y-2">
                                                <p className="text-sm"><strong>Modalidade:</strong> {auction.participation || 'Online'}</p>
                                                <p className="text-sm"><strong>Tipo:</strong> {auction.auctionType || 'Padrão'}</p>
                                                {auction.auctionStages && auction.auctionStages.length > 0 && (
                                                    <>
                                                        <p className="text-sm"><strong>Início (1ª Praça):</strong> {format(new Date(auction.auctionStages[0].startDate), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                                                        <p className="text-sm"><strong>Encerramento (Última):</strong> {format(new Date(auction.auctionStages[auction.auctionStages.length - 1].endDate), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-3">
                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-5 h-5 text-slate-600" />
                                                    <div>
                                                        <p className="font-medium text-sm">Edital.pdf</p>
                                                        <p className="text-xs text-slate-500">2.4 MB</p>
                                                    </div>
                                                </div>
                                                <Download className="w-4 h-4 text-slate-600" />
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-5 h-5 text-slate-600" />
                                                    <div>
                                                        <p className="font-medium text-sm">Regulamento.pdf</p>
                                                        <p className="text-xs text-slate-500">1.1 MB</p>
                                                    </div>
                                                </div>
                                                <Download className="w-4 h-4 text-slate-600" />
                                            </div>
                                        </div>

                                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <p className="text-sm text-blue-700">
                                                <strong>Importante:</strong> A leitura completa do Edital é obrigatória. Ao participar do leilão, você concorda com todos os termos e condições nele dispostos.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="history" className="mt-4 tab-conteudo-historico">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Histórico de Lances</CardTitle>
                                        <CardDescription>Total: {bids?.length || 0} lance(s)</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {bids && bids.length > 0 ? bids.map((bid, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                    <div className="flex-1">
                                                        <p className="font-medium">Usuário#{index + 1}</p>
                                                        <p className="text-sm text-slate-600">{new Date().toLocaleDateString('pt-BR')}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-lg">{formatCurrency(bid.amount || 0)}</p>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="text-center py-8 text-slate-500">
                                                    <Gavel className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                    <p>Nenhum lance registrado ainda</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="condicao" className="mt-4 tab-conteudo-condicoes">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Comissão e Condições</CardTitle>
                                        <CardDescription>Informações sobre pagamento e regras do leilão</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                            <Percent className="w-5 h-5 text-purple-600 flex-shrink-0" />
                                            <div>
                                                <p className="font-semibold">Comissão</p>
                                                <p className="text-sm text-slate-600">5% sobre o valor do lance vencedor</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                            <Banknote className="w-5 h-5 text-purple-600 flex-shrink-0" />
                                            <div>
                                                <p className="font-semibold">Pagamento</p>
                                                <p className="text-sm text-slate-600">À vista</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                            <CreditCard className="w-5 h-5 text-red-600 flex-shrink-0" />
                                            <div>
                                                <p className="font-semibold">Parcelamento</p>
                                                <p className="text-sm text-slate-600">Não aceita parcelamento</p>
                                            </div>
                                        </div>

                                        <Separator />
                                        <p className="text-xs text-slate-600">Leia o Edital para informações completas.</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                        {/* Informações do Vendedor */}
                        <Card className="info-vendedor-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="w-5 h-5" />
                                    Informações do Vendedor
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-600 mb-1">Vendido por</p>
                                        <p className="font-semibold">{seller?.name || 'Vendedor'}</p>
                                    </div>
                                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-600 mb-1">Organizado por</p>
                                        <p className="font-semibold">{auction.auctionType || 'Plataforma'}</p>
                                    </div>
                                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-600 mb-1">Leiloeiro</p>
                                        <p className="font-semibold">{auctioneer?.name || 'Leiloeiro'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Informações Detalhadas do Leiloeiro */}
                        {auctioneer && (
                            <Card className="info-leiloeiro-detalhada-card">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Gavel className="w-5 h-5 text-purple-600" />
                                        Informações do Leiloeiro
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-600 mb-1">Nome</p>
                                        <p className="font-semibold text-lg">{auctioneer.name || 'N/A'}</p>
                                    </div>
                                    {auctioneer.email && (
                                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs text-slate-600">Email</p>
                                                <p className="font-medium text-sm">{auctioneer.email}</p>
                                            </div>
                                        </div>
                                    )}
                                    {auctioneer.phone && (
                                        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                                            <Phone className="w-4 h-4 text-green-600 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs text-slate-600">Telefone</p>
                                                <p className="font-medium text-sm">{auctioneer.phone}</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Informações do Leilão Associado */}
                        <Card className="info-leilao-associado-card">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-purple-600" />
                                    Leilão Associado
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-600 mb-1">ID do Leilão</p>
                                        <p className="font-semibold text-sm">{auction.id}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-600 mb-1">Modalidade</p>
                                        <p className="font-semibold text-sm">{auction.participation || 'Online'}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-600 mb-1">Tipo</p>
                                        <p className="font-semibold text-sm">{auction.auctionType || 'Padrão'}</p>
                                    </div>
                                    {auction.auctionStages && auction.auctionStages.length > 0 && (
                                        <>
                                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                <p className="text-xs text-slate-600 mb-1">Início (1ª Praça)</p>
                                                <p className="font-semibold text-sm">{format(new Date(auction.auctionStages[0].startDate), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                                            </div>
                                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                                <p className="text-xs text-slate-600 mb-1">Encerramento (Última Praça)</p>
                                                <p className="font-semibold text-sm">{format(new Date(auction.auctionStages[auction.auctionStages.length - 1].endDate), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Localização Detalhada */}
                        <Card className="localizacao-detalhada-card">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-purple-600" />
                                    Localização Detalhada
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-slate-100 h-48 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
                                    <div className="text-center">
                                        <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                                        <p className="text-slate-600">Mapa em construção</p>
                                    </div>
                                </div>
                                <div className="space-y-3 mt-4">
                                    {lot.mapAddress && (
                                        <div className="p-3 bg-slate-50 rounded-lg">
                                            <p className="text-sm text-slate-600 mb-1">Endereço</p>
                                            <p className="font-medium">{lot.mapAddress}</p>
                                        </div>
                                    )}
                                    <div className="grid md:grid-cols-2 gap-3">
                                        {lot.cityName && (
                                            <div className="p-3 bg-slate-50 rounded-lg">
                                                <p className="text-sm text-slate-600 mb-1">Cidade</p>
                                                <p className="font-medium">{lot.cityName}</p>
                                            </div>
                                        )}
                                        {lot.stateUf && (
                                            <div className="p-3 bg-slate-50 rounded-lg">
                                                <p className="text-sm text-slate-600 mb-1">Estado</p>
                                                <p className="font-medium">{lot.stateUf}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Perguntas e Respostas */}
                        <Card className="qa-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageCircle className="w-5 h-5 text-purple-600" />
                                    Perguntas e Respostas
                                </CardTitle>
                                <CardDescription>Total: {questions?.length || 0} pergunta(s)</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {questions && questions.length > 0 ? (
                                    <div className="space-y-4">
                                        {questions.map((q, index) => (
                                            <div key={index} className="p-4 bg-slate-50 rounded-lg border-l-4 border-blue-500">
                                                <div className="flex items-start justify-between mb-2">
                                                    <p className="font-semibold text-sm">Pergunta #{index + 1}</p>
                                                    <Badge className="bg-blue-100 text-blue-800">Respondida</Badge>
                                                </div>
                                                <p className="text-sm text-slate-600 mb-3">{(q as any).content || (q as any).question || (q as any).questionText || 'Sem conteúdo'}</p>
                                                {(q as any).answer && (
                                                    <div className="p-3 bg-green-50 rounded border-l-2 border-green-500">
                                                        <p className="text-xs font-semibold text-green-700 mb-1">Resposta:</p>
                                                        <p className="text-sm text-green-800">{(q as any).answer}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-500">
                                        <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Nenhuma pergunta respondida ainda</p>
                                        <p className="text-xs text-slate-400 mt-2">Faça login para fazer sua pergunta</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Avaliações e Reviews */}
                        <Card className="reviews-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Gem className="w-5 h-5 text-purple-600" />
                                    Avaliações
                                </CardTitle>
                                <CardDescription>Total: {reviews?.length || 0} avaliação(ões)</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {reviews && reviews.length > 0 ? (
                                    <div className="space-y-4">
                                        {reviews.map((review, index) => (
                                            <div key={index} className="p-4 bg-slate-50 rounded-lg border-l-4 border-yellow-500">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex gap-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <span key={i} className={i < ((review as any).rating || 0) ? 'text-yellow-500' : 'text-slate-300'}>⭐</span>
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-slate-500">{(review as any).createdAt ? format(new Date((review as any).createdAt), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}</span>
                                                </div>
                                                <p className="text-sm text-slate-700">{(review as any).comment || (review as any).text || 'Sem comentário'}</p>
                                                <p className="text-xs text-slate-500 mt-2">Por: Usuário anônimo</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-500">
                                        <Gem className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Nenhuma avaliação ainda</p>
                                        <p className="text-xs text-slate-400 mt-2">Seja o primeiro a avaliar este lote</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="lg:col-span-1 space-y-4 coluna-direita sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
                        {/* Ações Topo */}
                        <div className="flex items-center justify-end gap-2 pt-2 acoes-topo-direita">
                            <Button variant="outline" size="sm" onClick={() => setIsFavorite(!isFavorite)} className="p-2 rounded-full">
                                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-600'}`} />
                            </Button>
                            <Button variant="outline" size="sm" className="p-2 rounded-full">
                                <Share2 className="w-4 h-4 text-slate-600" />
                            </Button>
                            <Button variant="outline" size="sm" className="text-purple-600 border-purple-600 hover:bg-purple-50" asChild>
                                <Link href={`/auctions/${params.auctionId}/live`}><Presentation className="w-4 h-4 mr-2" /> Auditório</Link>
                            </Button>
                        </div>

                        {/* Countdown Card */}
                        <Card className="border-2 border-purple-200 shadow-lg countdown-card">
                            <CardHeader className="bg-gradient-to-br from-purple-600 to-purple-700 text-white">
                                <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" /> Encerra em:</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {computedEndDate && <TimeRemainingDisplay endDate={computedEndDate} />}
                                
                                <div className="space-y-3 mb-6 info-lances">
                                    <div className="info-encerramento">
                                        <p className="text-sm text-slate-600 mb-1">Encerramento:</p>
                                        <p className="font-semibold">{computedEndDate ? format(computedEndDate, 'dd/MM HH:mm', { locale: ptBR }) : 'N/A'}</p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-sm text-slate-600 mb-1">Lance Mínimo:</p>
                                        <p className="text-2xl font-bold text-green-700">{formatCurrency(pracas[0]?.lanceInicial || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600 mb-1">Incremento Mínimo:</p>
                                        <p className="font-semibold">{formatCurrency(incremento)}</p>
                                    </div>
                                </div>

                                {!isLoggedIn ? (
                                    <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 text-lg font-semibold" size="lg">
                                        FAÇA LOGIN PARA PARTICIPAR
                                    </Button>
                                ) : isAuctionOpen ? (
                                    <Button 
                                        onClick={handleSubmitBid}
                                        disabled={isSubmittingBid}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg font-semibold disabled:opacity-70 disabled:cursor-not-allowed" 
                                        size="lg"
                                    >
                                        {isSubmittingBid ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Enviando Lance...
                                            </>
                                        ) : (
                                            'ENVIAR LANCE'
                                        )}
                                    </Button>
                                ) : (
                                    <div className="text-center p-3 bg-slate-100 rounded-lg border">
                                        <p className="font-semibold text-slate-800">Disponível em breve</p>
                                    </div>
                                )}

                                <p className="text-xs text-center text-slate-600 mt-3">
                                    Depósito caução necessário para enviar lances
                                </p>

                                {!isLoggedIn && (
                                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200 mt-4">
                                        <LogIn className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                        <p className="text-sm text-blue-700">Faça login para participar</p>
                                    </div>
                                )}

                                <Separator className="my-4" />

                                <div className="space-y-3">
                                    <a href="#" className="flex items-center text-sm text-purple-600 hover:underline font-medium">
                                        <Repeat className="w-4 h-4 mr-2" />
                                        Lance Automático
                                    </a>
                                    <a href="#" className="flex items-center text-sm text-purple-600 hover:underline font-medium">
                                        <Calculator className="w-4 h-4 mr-2" />
                                        Calcular valores
                                    </a>
                                </div>

                                {isLoggedIn && isAuctionOpen && (
                                    <>
                                        <Separator className="my-4" />
                                        <label htmlFor="quickBid" className="flex items-start gap-3 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                id="quickBid"
                                                checked={quickBid}
                                                onChange={() => setQuickBid(!quickBid)}
                                                className="mt-1 h-4 w-4"
                                            />
                                            <div>
                                                <p className="font-medium text-sm">Lance rápido</p>
                                                <p className="text-xs text-slate-600">Sem confirmação</p>
                                            </div>
                                        </label>
                                    </>
                                )}
                            </CardContent>
                        </Card>



                        {/* Contato */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Entre em Contato</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button variant="outline" className="w-full justify-start" size="lg">
                                    <Phone className="w-4 h-4 mr-2" />
                                    (11) 4950-9400
                                </Button>
                                <Button variant="outline" className="w-full justify-start" size="lg">
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    WhatsApp
                                </Button>
                                <Button variant="outline" className="w-full justify-start" size="lg">
                                    <Mail className="w-4 h-4 mr-2" />
                                    Email
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Benefícios */}
                        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                            <CardContent className="pt-6 space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-sm">✓</span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">Processo 100% Online</p>
                                        <p className="text-xs text-slate-600">Faça lances de onde estiver</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-sm">✓</span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">Segurança Garantida</p>
                                        <p className="text-xs text-slate-600">Leilão oficial e regulamentado</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-sm">✓</span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">Suporte Especializado</p>
                                        <p className="text-xs text-slate-600">Tire dúvidas a qualquer momento</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Lightbox Modal for Full Image */}
                <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
                    <DialogContent className="max-w-5xl w-full p-0 bg-black/95">
                        <div className="relative w-full h-[80vh] flex items-center justify-center">
                            <img 
                                src={images.length > 0 ? images[currentImageIndex] : 'https://placehold.co/825x502/64748b/ffffff?text=Imagem+Indisponível'} 
                                alt="Imagem ampliada" 
                                className="max-w-full max-h-full object-contain"
                            />
                            {images.length > 1 && (
                                <>
                                    <button 
                                        onClick={prevImage} 
                                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 rounded-full transition"
                                    >
                                        <ChevronLeft className="w-6 h-6 text-white" />
                                    </button>
                                    <button 
                                        onClick={nextImage} 
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 rounded-full transition"
                                    >
                                        <ChevronRight className="w-6 h-6 text-white" />
                                    </button>
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                        {images.map((_, index) => (
                                            <button 
                                                key={index} 
                                                onClick={() => setCurrentImageIndex(index)} 
                                                className={`w-2 h-2 rounded-full transition ${index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'}`} 
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
