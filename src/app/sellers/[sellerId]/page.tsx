
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
    const lotsToSort = [...allLotsFromSeller];
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
      <div className="wrapper-page-loading-center" data-ai-id="seller-details-loading">
        <Loader2 className="icon-page-loading" />
        <p className="text-page-loading">Carregando informações do comitente...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wrapper-page-error-center" data-ai-id="seller-details-error">
        <h2 className="header-page-error">{error}</h2>
        <Button asChild className="btn-error-back">
          <Link href="/sellers">Voltar para Comitentes</Link>
        </Button>
      </div>
    );
  }
  
  if (!sellerProfile) {
    return (
      <div className="wrapper-page-not-found-center" data-ai-id="seller-details-not-found">
        <h2 className="header-page-not-found">Comitente não encontrado.</h2>
        <Button asChild className="btn-error-back">
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
        <div className="container-seller-profile" data-ai-id="seller-details-page-container">
          <section className="section-seller-profile-header" data-ai-id="seller-details-profile-header">
            <div className="wrapper-seller-brand">
                <Avatar className="avatar-seller-profile">
                    <AvatarImage src={validLogoUrl} alt={sellerProfile.name} data-ai-hint={sellerProfile.dataAiHintLogo || "logo comitente"} />
                    <AvatarFallback className="text-fallback-large">{sellerInitial}</AvatarFallback>
                </Avatar>
                 <div className="wrapper-seller-title-info">
                    <h1 className="header-seller-name">{sellerProfile.name}</h1>
                    <p className="text-seller-type-label">{sellerProfile.isJudicial ? 'Comitente Judicial' : 'Vendedor Verificado'}</p>
                 </div>
            </div>
            
             <div className="wrapper-seller-profile-info-cards">
                <Card className="card-seller-profile-section">
                   <CardHeader><CardTitle className="header-card-title-with-icon"><Briefcase className="icon-card-header-primary" /> Sobre {sellerProfile.name}</CardTitle></CardHeader>
                   <CardContent className="content-card-seller-profile">
                    {sellerProfile.description ? (
                        <p className="text-seller-description">{sellerProfile.description}</p>
                    ) : (
                        <p className="text-seller-empty-desc">Nenhuma descrição fornecida por este comitente.</p>
                    )}
                   </CardContent>
                </Card>
                 <Card className="card-seller-profile-section">
                   <CardHeader><CardTitle className="header-card-title-with-icon"><MessageSquare className="icon-card-header-primary" /> Contato</CardTitle></CardHeader>
                   <CardContent className="content-card-seller-contact">
                       {sellerProfile.email && (<div className="item-seller-contact"><Mail className="icon-seller-contact" /><a href={`mailto:${sellerProfile.email}`} className="link-seller-contact">{sellerProfile.email}</a></div>)}
                       {sellerProfile.phone && (<div className="item-seller-contact"><Phone className="icon-seller-contact" /><a href={`tel:${sellerProfile.phone}`} className="link-seller-contact">{sellerProfile.phone}</a></div>)}
                       {fullAddress && (<div className="item-seller-contact-start"><Landmark className="icon-seller-contact-start" /><p className="text-seller-address">{fullAddress}</p></div>)}
                       {sellerProfile.website && (<div className="item-seller-contact"><Globe className="icon-seller-contact" /><a href={sellerProfile.website.startsWith('http') ? sellerProfile.website : `https://${sellerProfile.website}`} target="_blank" rel="noopener noreferrer" className="link-seller-contact">{sellerProfile.website.replace(/^https?:\/\//, '')}</a></div>)}
                   </CardContent>
                </Card>
            </div>
          </section>

          <Separator className="separator-print-hidden"/>

          {sortedLots.length > 0 && (
            <section className="section-seller-lots" data-ai-id="seller-details-related-lots-section">
              <h2 className="header-seller-lots-title"><TrendingUp className="icon-seller-lots-header" /> Lotes de {sellerProfile.name}</h2>
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
            <Card className="card-seller-empty-lots" data-ai-id="seller-details-no-lots">
              <CardContent className="content-card-seller-empty"><p className="text-seller-empty-lots-msg">Nenhum lote ativo encontrado para este comitente no momento.</p></CardContent>
            </Card>
          )}
        </div>
      </TooltipProvider>

    </>
  );
}
