
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ChevronRight, Tag, MapPin, DollarSign, ShoppingCart, Edit, MessageSquare, UserCircle, CalendarDays, Clock, AlertCircle, Loader2, CheckCircle, Info } from 'lucide-react';
import type { DirectSaleOffer } from '@/types';
import { sampleDirectSaleOffers, getLotStatusColor, getAuctionStatusText, slugify } from '@/lib/sample-data'; // Reusing status helpers
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

// Placeholder for authentication check
const isAuthenticated = true; 

export default function DirectSaleOfferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const offerId = typeof params.offerId === 'string' ? params.offerId : '';
  
  const [offer, setOffer] = useState<DirectSaleOffer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [proposalAmount, setProposalAmount] = useState<string>('');
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  useEffect(() => {
    if (offerId) {
      const foundOffer = sampleDirectSaleOffers.find(o => o.id === offerId);
      setOffer(foundOffer || null);
    }
    setIsLoading(false);
  }, [offerId]);

  const galleryImages = useMemo(() => {
    if (!offer) return ['https://placehold.co/800x600.png?text=Imagem+Indispon%C3%ADvel'];
    const images = [offer.imageUrl, ...(offer.galleryImageUrls || [])].filter(Boolean) as string[];
    if (images.length === 0) {
      images.push('https://placehold.co/800x600.png?text=Imagem+Indispon%C3%ADvel');
    }
    return images;
  }, [offer]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Oferta Não Encontrada</h1>
        <p className="text-muted-foreground">A oferta que você está procurando não existe.</p>
        <Button asChild className="mt-4" onClick={() => router.push('/direct-sales')}>
          <Link href="/direct-sales">Voltar para Venda Direta</Link>
        </Button>
      </div>
    );
  }

  const displayLocation = offer.locationCity && offer.locationState
    ? `${offer.locationCity} - ${offer.locationState}`
    : offer.locationState || offer.locationCity || 'Não informado';


  const handleBuyNow = () => {
    if (!isAuthenticated) {
        toast({ title: "Ação Requerida", description: "Por favor, faça login para comprar.", variant: "destructive"});
        router.push('/auth/login?redirect=/direct-sales/' + offer.id);
        return;
    }
    toast({ title: "Compra Iniciada (Simulação)", description: `Você demonstrou interesse em comprar "${offer.title}". Em um sistema real, você seria redirecionado para o checkout.`});
    // Placeholder: router.push('/checkout?offerId=' + offer.id);
  };
  
  const handleMakeProposal = () => {
    if (!isAuthenticated) {
        toast({ title: "Ação Requerida", description: "Por favor, faça login para fazer uma proposta.", variant: "destructive"});
        router.push('/auth/login?redirect=/direct-sales/' + offer.id);
        return;
    }
    if (!proposalAmount || parseFloat(proposalAmount) <= 0) {
        toast({ title: "Valor Inválido", description: "Por favor, insira um valor de proposta válido.", variant: "destructive"});
        return;
    }
    if (offer.minimumOfferPrice && parseFloat(proposalAmount) < offer.minimumOfferPrice) {
        toast({ title: "Proposta Baixa", description: `Sua proposta deve ser de pelo menos R$ ${offer.minimumOfferPrice.toLocaleString('pt-BR')}.`, variant: "destructive"});
        return;
    }
    setIsSubmittingProposal(true);
    // Simulate API call
    setTimeout(() => {
        toast({ title: "Proposta Enviada!", description: `Sua proposta de R$ ${parseFloat(proposalAmount).toLocaleString('pt-BR')} para "${offer.title}" foi enviada ao vendedor.`});
        setProposalAmount('');
        setIsSubmittingProposal(false);
    }, 1500);
  };


  return (
    <div className="space-y-8">
      <div className="flex items-center text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <Link href="/direct-sales" className="hover:text-primary">Venda Direta</Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span className="text-foreground font-medium truncate max-w-xs sm:max-w-md">{offer.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna da Galeria e Detalhes */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden mb-3">
                <Image 
                    src={galleryImages[currentImageIndex]} 
                    alt={`${offer.title} - Imagem ${currentImageIndex + 1}`} 
                    fill 
                    className="object-contain" // Use contain for main image to see full item
                    data-ai-hint={offer.dataAiHint || 'imagem principal oferta'}
                    priority={currentImageIndex === 0}
                />
              </div>
              {galleryImages.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {galleryImages.map((url, index) => (
                    <button
                      key={index}
                      className={`relative aspect-square bg-muted rounded overflow-hidden border-2 transition-all ${index === currentImageIndex ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent hover:border-muted-foreground/50'}`}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <Image src={url} alt={`Thumbnail ${index + 1}`} fill className="object-cover" data-ai-hint={offer.dataAiHint || 'imagem galeria oferta'}/>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Descrição da Oferta</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-line">{offer.description}</p>
            </CardContent>
          </Card>

          {offer.itemsIncluded && offer.itemsIncluded.length > 0 && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Itens Incluídos</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  {offer.itemsIncluded.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna de Ação e Informações */}
        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold font-headline">{offer.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-xs ${getLotStatusColor(offer.status)} border-current`}>
                    {getAuctionStatusText(offer.status)}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                    {offer.offerType === 'BUY_NOW' ? 'Compra Imediata' : 'Aceita Propostas'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {offer.offerType === 'BUY_NOW' && offer.price !== undefined && (
                <div className="text-left">
                  <p className="text-sm text-muted-foreground">Preço Fixo:</p>
                  <p className="text-3xl font-bold text-primary">
                    R$ {offer.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              )}
              {offer.offerType === 'ACCEPTS_PROPOSALS' && (
                <div>
                  <p className="text-sm text-muted-foreground">Esta oferta aceita propostas.</p>
                  {offer.minimumOfferPrice && (
                    <p className="text-xs text-muted-foreground">
                        Valor mínimo sugerido: R$ {offer.minimumOfferPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              )}
              
              <Separator />

              <div>
                <h4 className="font-medium mb-1 text-sm">Vendido por:</h4>
                <div className="flex items-center gap-2">
                   {offer.sellerLogoUrl && (
                    <Image src={offer.sellerLogoUrl} alt={offer.sellerName} width={32} height={32} className="rounded-full object-cover border" data-ai-hint={offer.dataAiHintSellerLogo || 'logo vendedor'}/>
                   )}
                   {!offer.sellerLogoUrl && <UserCircle className="h-8 w-8 text-muted-foreground"/>}
                  <Link href={`/sellers/${slugify(offer.sellerName)}`} className="text-primary hover:underline font-medium">
                    {offer.sellerName}
                  </Link>
                </div>
              </div>
              
              <div className="flex items-center text-sm text-muted-foreground">
                <Tag className="h-4 w-4 mr-2 text-primary" /> Categoria: {offer.category}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2 text-primary" /> Localização: {displayLocation}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4 mr-2 text-primary" /> Publicado em: {format(new Date(offer.createdAt), 'dd/MM/yyyy', {locale: ptBR})}
              </div>
              {offer.expiresAt && (
                <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2 text-primary" /> Válido até: {format(new Date(offer.expiresAt), 'dd/MM/yyyy', {locale: ptBR})}
                </div>
              )}

            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              {offer.status === 'ACTIVE' && offer.offerType === 'BUY_NOW' && (
                <Button className="w-full" size="lg" onClick={handleBuyNow}>
                  <ShoppingCart className="mr-2 h-5 w-5" /> Comprar Agora
                </Button>
              )}
              {offer.status === 'ACTIVE' && offer.offerType === 'ACCEPTS_PROPOSALS' && (
                <div className="w-full space-y-3">
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                        type="number" 
                        placeholder="Sua proposta (R$)" 
                        className="pl-10 text-md h-11"
                        value={proposalAmount}
                        onChange={(e) => setProposalAmount(e.target.value)}
                        disabled={isSubmittingProposal}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    size="lg" 
                    onClick={handleMakeProposal}
                    disabled={isSubmittingProposal || !proposalAmount}
                  >
                    {isSubmittingProposal ? <Loader2 className="animate-spin mr-2" /> : <Edit className="mr-2 h-5 w-5" />}
                    Enviar Proposta
                  </Button>
                </div>
              )}
              {(offer.status === 'SOLD' || offer.status === 'EXPIRED') && (
                <p className="text-center text-muted-foreground font-medium w-full py-2 bg-secondary rounded-md">
                    Esta oferta não está mais disponível.
                </p>
              )}
              <Button variant="outline" className="w-full">
                <MessageSquare className="mr-2 h-4 w-4" /> Contatar Vendedor
              </Button>
            </CardFooter>
          </Card>

          {/* Placeholder for similar offers or seller's other offers */}
          <Card className="shadow-md">
            <CardHeader><CardTitle className="text-lg">Outras Ofertas (Placeholder)</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground text-center py-6">
                <Info className="h-8 w-8 mx-auto mb-2 text-gray-400"/>
                Em breve, ofertas similares ou do mesmo vendedor.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
