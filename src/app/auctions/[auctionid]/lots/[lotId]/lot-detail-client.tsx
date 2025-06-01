
'use client'; 

import type { Lot, Auction } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
    Printer, Share2, ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, Search, Key, Info, 
    Tag, CalendarDays, Clock, Users, DollarSign, MapPin, Car, Settings, ThumbsUp, 
    ShieldCheck, HelpCircle, ShoppingCart, Heart, X, Facebook, Mail, MessageSquareText
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { addRecentlyViewedId } from '@/lib/recently-viewed-store';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isLotFavoriteInStorage, addFavoriteLotIdToStorage, removeFavoriteLotIdFromStorage } from '@/lib/favorite-store'; // Nova importação

const isAuthenticated = false; 

interface LotDetailClientContentProps {
  lot: Lot;
  auction: Auction;
  lotIndex?: number;
  previousLotId?: string;
  nextLotId?: string;
  totalLotsInAuction?: number;
}

export default function LotDetailClientContent({ lot, auction, lotIndex, previousLotId, nextLotId, totalLotsInAuction }: LotDetailClientContentProps) {
  const [isLotFavorite, setIsLotFavorite] = useState(false);
  const { toast } = useToast();
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
    if (lot && lot.id) {
      addRecentlyViewedId(lot.id);
      setIsLotFavorite(isLotFavoriteInStorage(lot.id)); // Sincroniza com localStorage
    }
  }, [lot]); // Depende do objeto 'lot' inteiro para reavaliar se ele mudar

  const lotTitle = `${lot?.year || ''} ${lot?.make || ''} ${lot?.model || ''} ${lot?.series || lot?.title}`.trim();

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

  const currentBidLabel = lot?.bidsCount && lot.bidsCount > 0 ? "Lance Atual" : "Lance Inicial";
  const currentBidValue = lot?.price || 0;


  if (!lot || !auction) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <p className="text-muted-foreground">Carregando detalhes do lote...</p>
      </div>
    );
  }

  const displayLotNumber = lotIndex !== undefined && lotIndex !== -1 ? lotIndex + 1 : lot.id.replace('LOTE', '');
  const displayTotalLots = totalLotsInAuction || auction.totalLots;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-2">
        <h1 className="text-2xl md:text-3xl font-bold font-headline text-center sm:text-left">{lotTitle}</h1>
        <div className="flex items-center space-x-2 flex-wrap justify-center">
          <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><Share2 className="mr-2 h-4 w-4" /> Compartilhar</Button>
            </DropdownMenuTrigger>
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
          <Button variant="outline" size="sm" asChild>
            <Link href={`/auctions/${auction.id}`}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o leilão</Link>
          </Button>
          <div className="flex items-center">
            {previousLotId ? (
              <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                <Link href={`/auctions/${auction.id}/lots/${previousLotId}`} aria-label="Lote Anterior"><ChevronLeft className="h-4 w-4" /></Link>
              </Button>
            ) : (
              <Button variant="outline" size="icon" className="h-8 w-8" disabled aria-label="Lote Anterior"><ChevronLeft className="h-4 w-4" /></Button>
            )}
            <span className="text-sm text-muted-foreground mx-2">Lote {displayLotNumber} de {displayTotalLots}</span>
            {nextLotId ? (
              <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                <Link href={`/auctions/${auction.id}/lots/${nextLotId}`} aria-label="Próximo Lote"><ChevronRight className="h-4 w-4" /></Link>
              </Button>
            ) : (
              <Button variant="outline" size="icon" className="h-8 w-8" disabled aria-label="Próximo Lote"><ChevronRight className="h-4 w-4" /></Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="relative aspect-[16/9] w-full bg-muted rounded-md overflow-hidden mb-4">
                <Image src={lot.imageUrl} alt={lot.title} fill className="object-cover" data-ai-hint={lot.dataAiHint || "imagem principal lote"}/>
                <div className="absolute top-2 left-2 space-x-2">
                  <Button variant="secondary" size="sm"><RotateCcw className="mr-2 h-4 w-4" /> Ver 360°</Button>
                  <Button variant="secondary" size="sm"><Search className="mr-2 h-4 w-4" /> Ver HD</Button>
                </div>
              </div>
              {lot.galleryImageUrls && lot.galleryImageUrls.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {lot.galleryImageUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square bg-muted rounded overflow-hidden">
                      <Image src={url} alt={`Imagem ${index + 1} de ${lot.title}`} fill className="object-cover" data-ai-hint="imagem galeria carro"/>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                {lot.hasKey && <span className="flex items-center"><Key className="h-4 w-4 mr-1 text-primary"/> Chave Presente</span>}
                <span></span> 
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
                    <p className="text-2xl font-bold text-primary">R$ {currentBidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              {!isAuthenticated ? (
                <div className="text-sm text-muted-foreground p-3 bg-secondary/50 rounded-md">
                  <p>Você não está logado.</p>
                  <p>Por favor, <Link href="/auth/login" className="text-primary hover:underline font-medium">faça login</Link> ou <Link href="/auth/register" className="text-primary hover:underline font-medium">registre-se agora</Link> para dar lances.</p>
                </div>
              ) : (
                <Button className="w-full" disabled={lot.status !== 'ABERTO_PARA_LANCES'}>
                  <DollarSign className="mr-2 h-4 w-4" /> 
                  {lot.status === 'ABERTO_PARA_LANCES' ? 'Fazer Pré-Lance' : 'Lances Encerrados'}
                </Button>
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
                "Localização do Veículo:": lot.vehicleLocationInBranch || auction.vehicleLocation,
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
        </div>
      </div>
    </div>
  );
}
