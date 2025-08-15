// src/app/sellers/[sellerId]/page.tsx
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { getLotsBySellerSlug } from '@/app/admin/sellers/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import type { Auction, Lot, PlatformSettings, SellerProfileInfo } from '@/types';
import LotCard from '@/components/lot-card';
import LotListItem from '@/components/lot-list-item';
import SearchResultsFrame from '@/components/search-results-frame';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Star, Loader2, Mail, Phone, Globe, Briefcase, Users, TrendingUp, MessageSquare, Pencil } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getSellerBySlug } from '@/app/admin/sellers/actions';
import { useAuth } from '@/contexts/auth-context';
import { hasAnyPermission } from '@/lib/permissions';
import { getAuctions } from '@/app/admin/auctions/actions';
import { isValidImageUrl } from '@/lib/ui-helpers';

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
  const [sellerProfile, setSellerProfile] = useState<SellerProfileInfo | null>(null);
  const [relatedLots, setRelatedLots] = useState<Lot[]>([]);
  const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
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
    async function fetchSellerDetails() {
      if (sellerIdSlug) {
        setIsLoading(true);
        setError(null);
        try {
          const [foundSeller, lots, auctions, settings] = await Promise.all([
              getSellerBySlug(sellerIdSlug),
              getLotsBySellerSlug(sellerIdSlug),
              getAuctions(),
              getPlatformSettings()
          ]);
          setPlatformSettings(settings);
          setLotItemsPerPage(settings.searchItemsPerPage || 6);
          setAllAuctions(auctions);

          if (!foundSeller) {
            setError(`Comitente com slug/publicId "${sellerIdSlug}" não encontrado.`);
            setSellerProfile(null);
            setRelatedLots([]);
            setIsLoading(false);
            return;
          }
          setSellerProfile(foundSeller);
          setRelatedLots(lots);
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

  const sortedLots = useMemo(() => {
    let lotsToSort = [...relatedLots];
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
  }, [relatedLots, lotSortBy]);

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

  const renderLotGridItemForSellerPage = (lot: Lot) => <LotCard key={lot.id} lot={lot} platformSettings={platformSettings!} auction={allAuctions.find(a => a.id === lot.auctionId)} />;
  const renderLotListItemForSellerPage = (lot: Lot) => <LotListItem key={lot.id} lot={lot} platformSettings={platformSettings!} auction={allAuctions.find(a => a.id === lot.auctionId)} />;


  if (isLoading || !platformSettings) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando informações do comitente...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 min-h-[calc(100vh-20rem)]">
        <h2 className="text-xl font-semibold text-destructive">{error}</h2>
        <Button asChild className="mt-4">
          <Link href="/sellers">Voltar para Comitentes</Link>
        </Button>
      </div>
    );
  }
  
  if (!sellerProfile) {
    return (
      <div className="text-center py-12 min-h-[calc(100vh-20rem)]">
        <h2 className="text-xl font-semibold text-muted-foreground">Comitente não encontrado.</h2>
        <Button asChild className="mt-4">
          <Link href="/sellers">Voltar para Comitentes</Link>
        </Button>
      </div>
    );
  }

  const sellerInitial = sellerProfile.name ? sellerProfile.name.charAt(0).toUpperCase() : 'S';
  const editUrl = `/admin/sellers/${sellerProfile.id}/edit`;
  const validLogoUrl = isValidImageUrl(sellerProfile.logoUrl) ? sellerProfile.logoUrl : `https://placehold.co/128x128.png?text=${sellerInitial}`;


  return (
    <>
      <TooltipProvider>
        <div className="space-y-10 py-6">
          <section className="border-b pb-10">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="h-28 w-28 md:h-32 md:w-32 border-4 border-primary/30 shadow-lg">
                <AvatarImage src={validLogoUrl} alt={sellerProfile.name} data-ai-hint={sellerProfile.dataAiHintLogo || "logo comitente"} />
                <AvatarFallback className="text-4xl">{sellerInitial}</AvatarFallback>
              </Avatar>
              <div className="flex-grow text-center md:text-left">
                <h1 className="text-3xl font-bold font-headline">{sellerProfile.name}</h1>
                <p className="text-sm text-muted-foreground">{sellerProfile.city && sellerProfile.state ? `${sellerProfile.city} - ${sellerProfile.state}` : 'Localização não informada'}</p>
                {sellerProfile.rating !== undefined && sellerProfile.rating > 0 && (
                  <div className="flex items-center justify-center md:justify-start text-sm text-amber-600 mt-2">
                    <Star className="h-5 w-5 fill-amber-500 text-amber-500 mr-1" />
                    {sellerProfile.rating.toFixed(1)}
                    <span className="text-muted-foreground ml-2 text-xs">({sellerProfile.auctionsFacilitatedCount || 0} leilões)</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {relatedLots.length > 0 && (
            <section className="pt-6">
              <h2 className="text-2xl font-bold mb-6 font-headline flex items-center">
                <TrendingUp className="h-6 w-6 mr-2 text-primary" /> Lotes de {sellerProfile.name}
              </h2>
              <SearchResultsFrame
                  items={paginatedLots}
                  totalItemsCount={relatedLots.length}
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

          {relatedLots.length === 0 && !isLoading && (
            <Card className="shadow-sm mt-8"><CardContent className="text-center py-10"><p className="text-muted-foreground">Nenhum lote ativo encontrado para este comitente no momento.</p></CardContent></Card>
          )}
        </div>
      </TooltipProvider>

      {hasEditPermissions && sellerProfile?.id && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild className="fixed bottom-16 right-5 z-50 h-14 w-14 rounded-full shadow-lg" size="icon">
                <Link href={editUrl}>
                  <Pencil className="h-6 w-6" />
                  <span className="sr-only">Editar Comitente</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Editar Comitente</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </>
  );
}
