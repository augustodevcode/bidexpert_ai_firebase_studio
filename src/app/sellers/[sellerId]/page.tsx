
// src/app/sellers/[sellerId]/page.tsx
/**
 * @fileoverview Página de perfil público de um Comitente (Vendedor).
 * Este componente de cliente renderiza a página de detalhes de um vendedor específico,
 * incluindo suas informações, leilões recentes e uma lista paginada e filtrável
 * de todos os seus lotes. Ele busca os dados necessários através de server actions
 * e gerencia a interatividade da UI, como ordenação e paginação.
 */
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import type { Auction, Lot, PlatformSettings, SellerProfileInfo } from '@/types';
import BidExpertSearchResultsFrame from '@/components/BidExpertSearchResultsFrame';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Star, Loader2, Mail, Phone, Globe, Briefcase, TrendingUp, Pencil, Landmark, MessageSquare } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getSellerBySlug } from '@/app/admin/sellers/actions';
import { getAuctionsBySellerSlug } from '@/app/admin/auctions/actions';
import { useAuth } from '@/contexts/auth-context';
import { hasAnyPermission } from '@/lib/permissions';
import { isValidImageUrl } from '@/lib/ui-helpers';
import BidExpertCard from '@/components/BidExpertCard';
import BidExpertListItem from '@/components/BidExpertListItem';
import { useFloatingActions } from '@/components/floating-actions/floating-actions-provider';

const sortOptionsLots = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'endDate_asc', label: 'Data Encerramento: Próximos' },
  { value: 'endDate_desc', label: 'Data Encerramento: Distantes' },
  { value: 'price_asc', label: 'Preço: Menor para Maior' },
  { value: 'price_desc', label: 'Preço: Maior para Menor' },
  { value: 'views_desc', label: 'Mais Visitados' },
];

export default function SellerDetailsPage() {
  const params = useParams();
  const sellerIdSlug = typeof params.sellerId === 'string' ? params.sellerId : '';

  const { userProfileWithPermissions } = useAuth();
  const { setPageActions } = useFloatingActions();
  const [sellerProfile, setSellerProfile] = useState<SellerProfileInfo | null>(null);
  const [relatedAuctions, setRelatedAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [lotSortBy, setLotSortBy] = useState<string>('endDate_asc');
  const [currentLotPage, setCurrentLotPage] = useState(1);
  const [lotItemsPerPage, setLotItemsPerPage] = useState(6);

  const hasEditPermissions = useMemo(() => 
    hasAnyPermission(userProfileWithPermissions, ['manage_all', 'sellers:update']),
    [userProfileWithPermissions]
  );

  useEffect(() => {
    if (!hasEditPermissions || !sellerProfile?.id) {
      setPageActions([]);
      return;
    }

    setPageActions([
      {
        id: 'edit-seller',
        label: 'Editar Comitente',
        href: `/admin/sellers/${sellerProfile.id}/edit`,
        icon: Pencil,
        dataAiId: 'floating-action-edit-seller',
      },
    ]);

    return () => setPageActions([]);
  }, [hasEditPermissions, sellerProfile?.id, setPageActions]);
  
  useEffect(() => {
    async function fetchSellerDetails() {
      if (sellerIdSlug) {
        setIsLoading(true);
        setError(null);
        try {
          const [foundSeller, auctions, settings] = await Promise.all([
              getSellerBySlug(sellerIdSlug),
              getAuctionsBySellerSlug(sellerIdSlug),
              getPlatformSettings()
          ]);
          if(settings) {
            setPlatformSettings(settings as PlatformSettings);
            setLotItemsPerPage(settings.searchItemsPerPage || 6);
          }


          if (!foundSeller) {
            setError(`Comitente com slug/publicId "${sellerIdSlug}" não encontrado.`);
            setSellerProfile(null);
            setRelatedAuctions([]);
            setIsLoading(false);
            return;
          }
          setSellerProfile(foundSeller);
          setRelatedAuctions(auctions);
          setCurrentLotPage(1);

        } catch (e) {
          console.error("Error fetching seller data:", e);
          setError("Erro ao carregar dados do comitente.");
        } finally {
          setIsLoading(false);
        }
      } else {
        setError("Slug/PublicID do comitente não fornecido.");
        setIsLoading(false);
      }
    }
    fetchSellerDetails();
  }, [sellerIdSlug]);

  const allLotsFromSeller = useMemo(() => {
    return relatedAuctions.flatMap(a => a.lots || []);
  }, [relatedAuctions]);

  const sortedLots = useMemo(() => {
    let lotsToSort = [...allLotsFromSeller];
    switch (lotSortBy) {
        case 'endDate_asc':
          lotsToSort.sort((a, b) => new Date(a.endDate as string).getTime() - new Date(b.endDate as string).getTime());
          break;
        case 'endDate_desc':
          lotsToSort.sort((a, b) => new Date(b.endDate as string).getTime() - new Date(a.endDate as string).getTime());
          break;
        case 'price_asc':
          lotsToSort.sort((a, b) => a.price - b.price);
          break;
        case 'price_desc':
          lotsToSort.sort((a, b) => b.price - a.price);
          break;
        case 'views_desc':
          lotsToSort.sort((a, b) => (b.views || 0) - (a.views || 0));
          break;
        case 'relevance':
        default:
          break;
      }
      return lotsToSort;
  }, [allLotsFromSeller, lotSortBy]);

  const paginatedLots = useMemo(() => {
    if (!platformSettings) return [];
    const startIndex = (currentLotPage - 1) * lotItemsPerPage;
    const endIndex = startIndex + lotItemsPerPage;
    return sortedLots.slice(startIndex, endIndex);
  }, [sortedLots, currentLotPage, lotItemsPerPage, platformSettings]);

  const handleLotSortChange = (newSortBy: string) => {
    setLotSortBy(newSortBy);
    setCurrentLotPage(1);
  };

  const handleLotPageChange = (newPage: number) => {
    setCurrentLotPage(newPage);
  };
  
  const handleLotItemsPerPageChange = (newSize: number) => {
      setLotItemsPerPage(newSize);
      setCurrentLotPage(1);
  }
  
  const renderLotGridItemForSellerPage = (lot: Lot) => <BidExpertCard item={lot} type="lot" platformSettings={platformSettings!} parentAuction={relatedAuctions.find(a => a.id === lot.auctionId)} />;
  const renderLotListItemForSellerPage = (lot: Lot) => <BidExpertListItem item={lot} type="lot" platformSettings={platformSettings!} parentAuction={relatedAuctions.find(a => a.id === lot.auctionId)} />;


  if (isLoading || !platformSettings) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 min-h-[calc(100vh-20rem)]" data-ai-id="seller-details-loading">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando informações do comitente...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 min-h-[calc(100vh-20rem)]" data-ai-id="seller-details-error">
        <h2 className="text-xl font-semibold text-destructive">{error}</h2>
        <Button asChild className="mt-4">
          <Link href="/sellers">Voltar para Comitentes</Link>
        </Button>
      </div>
    );
  }
  
  if (!sellerProfile) {
    return (
      <div className="text-center py-12 min-h-[calc(100vh-20rem)]" data-ai-id="seller-details-not-found">
        <h2 className="text-xl font-semibold text-muted-foreground">Comitente não encontrado.</h2>
        <Button asChild className="mt-4">
          <Link href="/sellers">Voltar para Comitentes</Link>
        </Button>
      </div>
    );
  }

  const sellerInitial = sellerProfile.name ? sellerProfile.name.charAt(0).toUpperCase() : 'S';
  const validLogoUrl = isValidImageUrl(sellerProfile.logoUrl) ? sellerProfile.logoUrl : `https://placehold.co/128x128.png?text=${sellerInitial}`;
  const fullAddress = [sellerProfile.street, sellerProfile.number, sellerProfile.complement, sellerProfile.neighborhood, sellerProfile.city, sellerProfile.state, sellerProfile.zipCode].filter(Boolean).join(', ');


  return (
    <>
      <TooltipProvider>
        <div className="space-y-10 py-6" data-ai-id="seller-details-page-container">
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start border-b pb-10" data-ai-id="seller-details-profile-header">
            <div className="lg:col-span-1 flex flex-col items-center lg:items-start text-center lg:text-left space-y-4">
                <Avatar className="h-40 w-40 border-4 border-primary/30 shadow-lg">
                    <AvatarImage src={validLogoUrl} alt={sellerProfile.name} data-ai-hint={sellerProfile.dataAiHintLogo || "logo comitente"} />
                    <AvatarFallback className="text-5xl">{sellerInitial}</AvatarFallback>
                </Avatar>
                 <div>
                    <h1 className="text-3xl font-bold font-headline">{sellerProfile.name}</h1>
                    <p className="text-sm text-muted-foreground">{sellerProfile.isJudicial ? 'Comitente Judicial' : 'Vendedor Verificado'}</p>
                 </div>
            </div>
            
             <div className="lg:col-span-2 space-y-4">
                <Card className="shadow-md">
                   <CardHeader><CardTitle className="text-xl font-semibold flex items-center"><Briefcase className="h-5 w-5 mr-2 text-primary" /> Sobre {sellerProfile.name}</CardTitle></CardHeader>
                   <CardContent>
                    {sellerProfile.description ? (
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{sellerProfile.description}</p>
                    ) : (
                        <p className="text-sm text-muted-foreground">Nenhuma descrição fornecida por este comitente.</p>
                    )}
                   </CardContent>
                </Card>
                 <Card className="shadow-md">
                   <CardHeader><CardTitle className="text-xl font-semibold flex items-center"><MessageSquare className="h-5 w-5 mr-2 text-primary" /> Contato</CardTitle></CardHeader>
                   <CardContent className="space-y-3 text-sm">
                       {sellerProfile.email && (<div className="flex items-center"><Mail className="h-4 w-4 mr-2 text-muted-foreground" /><a href={`mailto:${sellerProfile.email}`} className="hover:text-primary">{sellerProfile.email}</a></div>)}
                       {sellerProfile.phone && (<div className="flex items-center"><Phone className="h-4 w-4 mr-2 text-muted-foreground" /><a href={`tel:${sellerProfile.phone}`} className="hover:text-primary">{sellerProfile.phone}</a></div>)}
                       {fullAddress && (<div className="flex items-start"><Landmark className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" /><p>{fullAddress}</p></div>)}
                       {sellerProfile.website && (<div className="flex items-center"><Globe className="h-4 w-4 mr-2 text-muted-foreground" /><a href={sellerProfile.website.startsWith('http') ? sellerProfile.website : `https://${sellerProfile.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate">{sellerProfile.website.replace(/^https?:\/\//, '')}</a></div>)}
                   </CardContent>
                </Card>
            </div>
          </section>

          <Separator className="print:hidden"/>

          {sortedLots.length > 0 && (
            <section className="pt-6" data-ai-id="seller-details-related-lots-section">
              <h2 className="text-2xl font-bold mb-6 font-headline flex items-center"><TrendingUp className="h-6 w-6 mr-2 text-primary" /> Lotes de {sellerProfile.name}</h2>
              <BidExpertSearchResultsFrame
                  items={paginatedLots}
                  totalItemsCount={sortedLots.length}
                  renderGridItem={renderLotGridItemForSellerPage}
                  renderListItem={renderLotListItemForSellerPage}
                  sortOptions={sortOptionsLots}
                  initialSortBy={lotSortBy}
                  onSortChange={handleLotSortChange}
                  platformSettings={platformSettings}
                  isLoading={isLoading}
                  searchTypeLabel="lotes"
                  currentPage={currentLotPage}
                  itemsPerPage={lotItemsPerPage}
                  onPageChange={handleLotPageChange}
                  onItemsPerPageChange={handleLotItemsPerPageChange}
              />
            </section>
          )}

          {sortedLots.length === 0 && !isLoading && (
            <Card className="shadow-sm mt-8" data-ai-id="seller-details-no-lots">
              <CardContent className="text-center py-10"><p className="text-muted-foreground">Nenhum lote ativo encontrado para este comitente no momento.</p></CardContent>
            </Card>
          )}
        </div>
      </TooltipProvider>

    </>
  );
}
