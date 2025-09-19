
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ChevronRight, Tag, MapPin, DollarSign, ShoppingCart, Edit, MessageSquare, UserCircle, CalendarDays, Clock, AlertCircle, Loader2, CheckCircle, Info, ImageOff } from 'lucide-react';
import type { DirectSaleOffer } from '@/types';
import { getLotStatusColor, getAuctionStatusText, slugify } from '@/lib/ui-helpers';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatInSaoPaulo } from '@/lib/timezone'; // Import timezone functions
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { hasPermission } from '@/lib/permissions';

interface OfferDetailClientProps {
  offer: DirectSaleOffer;
}

export default function OfferDetailClient({ offer }: OfferDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { userProfileWithPermissions } = useAuth();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [proposalAmount, setProposalAmount] = useState<string>('');
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  
  const canBuyNow = hasPermission(userProfileWithPermissions, 'direct_sales:buy_now');
  const canMakeProposal = hasPermission(userProfileWithPermissions, 'direct_sales:place_proposal');
  
  const galleryImages = useMemo(() => {
    if (!offer) return ['https://placehold.co/800x600.png?text=Imagem+Indispon%C3%ADvel'];
    const images = [offer.imageUrl, ...(offer.galleryImageUrls || [])].filter(Boolean) as string[];
    if (images.length === 0) {
      images.push('https://placehold.co/800x600.png?text=Imagem+Indispon%C3%ADvel');
    }
    return images;
  }, [offer]);

  const displayLocation = offer.locationCity && offer.locationState
    ? `${offer.locationCity} - ${offer.locationState}`
    : offer.locationState || offer.locationCity || 'Não informado';

  const nextImage = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length); };
  const prevImage = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length); };


  const handleBuyNow = () => {
    if (!userProfileWithPermissions) {
        toast({ title: "Ação Requerida", description: "Por favor, faça login para comprar.", variant: "destructive"});
        router.push('/auth/login?redirect=/direct-sales/' + offer.id);
        return;
    }
    if (!canBuyNow) {
        toast({ title: "Permissão Negada", description: "Você não tem permissão para comprar itens. Verifique sua habilitação.", variant: "destructive"});
        return;
    }
    toast({ title: "Compra Iniciada (Simulação)", description: `Você demonstrou interesse em comprar "${offer.title}". Em um sistema real, você seria redirecionado para o checkout.`});
  };
  
  const handleMakeProposal = () => {
    if (!userProfileWithPermissions) {
        toast({ title: "Ação Requerida", description: "Por favor, faça login para fazer uma proposta.", variant: "destructive"});
        router.push('/auth/login?redirect=/direct-sales/' + offer.id);
        return;
    }
    if (!canMakeProposal) {
        toast({ title: "Permissão Negada", description: "Você não tem permissão para fazer propostas. Verifique sua habilitação.", variant: "destructive"});
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
    setTimeout(() => {
        toast({ title: "Proposta Enviada!", description: `Sua proposta de R$ ${parseFloat(proposalAmount).toLocaleString('pt-BR')} para "${offer.title}" foi enviada ao vendedor.`});
        setProposalAmount('');
        setIsSubmittingProposal(false);
    }, 1500);
  };


  return (
    <div className="space-y-8" data-ai-id="offer-details-page-container">
      <div className="flex items-center text-sm text-muted-foreground" data-ai-id="offer-details-breadcrumbs">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <Link href="/direct-sales" className="hover:text-primary">Venda Direta</Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span className="text-foreground font-medium truncate max-w-xs sm:max-w-md">{offer.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6" data-ai-id="offer-details-main-content">
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden mb-3">
                {galleryImages.length > 0 && galleryImages[currentImageIndex] ? (
                  <Image 
                      src={galleryImages[currentImageIndex]} 
                      alt={`${offer.title} - Imagem ${currentImageIndex + 1}`} 
                      fill 
                      className="object-contain"
                      data-ai-hint={offer.dataAiHint || 'imagem principal oferta'}
                      priority={currentImageIndex === 0}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <ImageOff className="h-16 w-16 mb-2" />
                    <span>Imagem indisponível</span>
                  </div>
                )}
                 {galleryImages.length > 1 && (
                  <>
                    <Button variant="outline" size="icon" onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background h-9 w-9 rounded-full shadow-md" aria-label="Imagem Anterior"><ChevronRight className="h-5 w-5" /></Button>
                    <Button variant="outline" size="icon" onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background h-9 w-9 rounded-full shadow-md" aria-label="Próxima Imagem"><ChevronRight className="h-5 w-5" /></Button>
                  </>
                )}
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

          <Card className="shadow-md" data-ai-id="offer-details-description-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Descrição da Oferta</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-line">{offer.description}</p>
            </CardContent>
          </Card>

          {offer.itemsIncluded && offer.itemsIncluded.length > 0 && (
            <Card className="shadow-md" data-ai-id="offer-details-included-items-card">
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

        <div className="space-y-6" data-ai-id="offer-details-sidebar">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold font-headline">{offer.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-xs ${getLotStatusColor(offer.status)} border-current`}>
                    {getAuctionStatusText(offer.status)}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                    {offer.offerType === 'BUY_NOW' ? 'Compra Imediata' : 'Aceita Proposta'}
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
                  <CalendarDays className="h-4 w-4 mr-2 text-primary" /> Publicado em: {formatInSaoPaulo(offer.createdAt as string, 'dd/MM/yyyy')}
                </div>
                {offer.expiresAt && (
                  <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2 text-primary" /> Válido até: {formatInSaoPaulo(offer.expiresAt as string, 'dd/MM/yyyy')}
                  </div>
                )}

            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              {offer.status === 'ACTIVE' && offer.offerType === 'BUY_NOW' && (
                <Button className="w-full" size="lg" onClick={handleBuyNow} disabled={!canBuyNow}>
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
                        disabled={isSubmittingProposal || !canMakeProposal}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    size="lg" 
                    onClick={handleMakeProposal}
                    disabled={isSubmittingProposal || !proposalAmount || !canMakeProposal}
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

          <Card className="shadow-md" data-ai-id="offer-details-similar-offers-card">
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
