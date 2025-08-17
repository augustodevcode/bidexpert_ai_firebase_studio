// src/app/admin/lots/lot-form.tsx
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { lotFormSchema, type LotFormValues } from './lot-form-schema';
import type { Lot, Auction, Bem, StateInfo, CityInfo, MediaItem, Subcategory, PlatformSettings, LotStatus, LotCategory, SellerProfileInfo } from '@/types';
import { Loader2, Save, Package, ImagePlus, Trash2, MapPin, FileText, Banknote, Link as LinkIcon, Gavel, Building, Layers, ImageIcon, PackagePlus, Eye, CheckCircle, FileSignature, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format, differenceInMilliseconds } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAuctionStatusText } from '@/lib/ui-helpers';
import { Separator } from '@/components/ui/separator';
import AuctionStagesTimeline from '@/components/auction/auction-stages-timeline';
import Image from 'next/image';
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import EntitySelector from '@/components/ui/entity-selector';
import { getAuctioneers as refetchAuctioneers, getSellers as refetchSellers } from '../sellers/actions';
import { getLotCategories as refetchCategories } from '../categories/actions';
import { getStates as refetchStates } from '../states/actions';
import { getCities as refetchCities } from '../cities/actions';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import BemDetailsModal from '@/components/admin/bens/bem-details-modal';
import SearchResultsFrame from '@/components/search-results-frame';
import { createColumns as createBemColumns } from '@/components/admin/lotting/columns';
import { getAuction, getAuctions as refetchAllAuctions } from '@/app/admin/auctions/actions';
import { getBens } from '@/app/admin/bens/actions';
import { samplePlatformSettings } from '@/lib/sample-data';
import { DataTable } from '@/components/ui/data-table';


interface LotFormProps {
  initialData?: Lot | null;
  categories: LotCategory[];
  auctions: Auction[];
  sellers: SellerProfileInfo[]; 
  states: StateInfo[];
  allCities: CityInfo[];
  initialAvailableBens: Bem[];
  onSubmitAction: (data: LotFormValues) => Promise<{ success: boolean; message: string; lotId?: string }>;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
  defaultAuctionId?: string;
  onSuccessCallback?: () => void;
}

const lotStatusOptions: { value: LotStatus; label: string }[] = [
    'EM_BREVE', 'ABERTO_PARA_LANCES', 'ENCERRADO', 'VENDIDO', 'NAO_VENDIDO', 'CANCELADO'
].map(status => ({ value: status, label: getAuctionStatusText(status) }));

export default function LotForm({
  initialData,
  categories: initialCategories,
  auctions: initialAuctions,
  sellers: initialSellers, 
  states,
  allCities,
  initialAvailableBens,
  onSubmitAction,
  formTitle,
  formDescription,
  submitButtonText,
  defaultAuctionId,
  onSuccessCallback,
}: LotFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const [isMainImageDialogOpen, setIsMainImageDialogOpen] = React.useState(false);
  const [isGalleryDialogOpen, setIsGalleryDialogOpen] = React.useState(false);
  
  const [availableSubcategories, setAvailableSubcategories] = React.useState<Subcategory[]>([]);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = React.useState(false);
  const [bemRowSelection, setBemRowSelection] = React.useState({});
  const [currentAvailableBens, setCurrentAvailableBens] = React.useState<Bem[]>(initialAvailableBens);

  const [isBemModalOpen, setIsBemModalOpen] = React.useState(false);
  const [selectedBemForModal, setSelectedBemForModal] = React.useState<Bem | null>(null);
  const [isFinalizing, setIsFinalizing] = React.useState(false);

  const [auctions, setAuctions] = React.useState(initialAuctions);
  const [categories, setCategories] = React.useState(initialCategories);
  const [sellers, setSellers] = React.useState(initialSellers); 
  const [isFetchingAuctions, setIsFetchingAuctions] = React.useState(false);
  const [isFetchingCategories, setIsFetchingCategories] = React.useState(false);
  const [isFetchingSellers, setIsFetchingSellers] = React.useState(false); 

  const [linkedBensSortBy, setLinkedBensSortBy] = React.useState('title_asc');
  const [linkedBensCurrentPage, setLinkedBensCurrentPage] = React.useState(1);
  const [linkedBensItemsPerPage, setLinkedBensItemsPerPage] = React.useState(6);
  const [platformSettings, setPlatformSettings] = React.useState<PlatformSettings | null>(samplePlatformSettings as PlatformSettings);

  const form = useForm<LotFormValues>({
    resolver: zodResolver(lotFormSchema),
    defaultValues: {
      ...initialData,
      auctionId: initialData?.auctionId || defaultAuctionId || searchParams.get('auctionId') || '',
      type: initialData?.categoryId || initialData?.type || '',
      price: initialData?.price || 0,
      initialPrice: initialData?.initialPrice || undefined,
      bidIncrementStep: initialData?.bidIncrementStep || undefined,
      bemIds: initialData?.bemIds || [],
      mediaItemIds: initialData?.mediaItemIds || [],
      galleryImageUrls: initialData?.galleryImageUrls || [],
      status: initialData?.status || 'EM_BREVE',
      sellerId: initialData?.sellerId || undefined,
      stateId: initialData?.stateId || undefined,
      cityId: initialData?.cityId || undefined,
      inheritedMediaFromBemId: initialData?.inheritedMediaFromBemId || undefined,
    },
  });
  
  const watchedAuctionId = useWatch({ control: form.control, name: 'auctionId' });
  const watchedBemIds = useWatch({ control: form.control, name: 'bemIds' });
  const inheritedMediaFromBemId = useWatch({ control: form.control, name: 'inheritedMediaFromBemId' });
  const selectedCategoryId = useWatch({ control: form.control, name: 'type' });
  const imageUrlPreview = useWatch({ control: form.control, name: 'imageUrl' });
  const galleryUrls = useWatch({ control: form.control, name: 'galleryImageUrls' });

  // UseEffect to automatically set seller based on selected auction
  React.useEffect(() => {
    async function updateSellerFromAuction() {
      if (watchedAuctionId) {
        const selectedAuction = await getAuction(watchedAuctionId);
        if (selectedAuction && selectedAuction.sellerId) {
          form.setValue('sellerId', selectedAuction.sellerId, { shouldDirty: true });
        }
      }
    }
    updateSellerFromAuction();
  }, [watchedAuctionId, form]);

  const linkedBensDetails = React.useMemo(() => {
    const allPossibleBens = [...currentAvailableBens, ...(initialData?.bens || [])];
    const uniqueBens = Array.from(new Map(allPossibleBens.map(item => [item.id, item])).values());
    return (watchedBemIds || []).map(id => uniqueBens.find(bem => bem.id === id)).filter((b): b is Bem => !!b);
  }, [watchedBemIds, currentAvailableBens, initialData?.bens]);

  // Resto do código...
  const handleRefetchAuctions = React.useCallback(async () => {
    setIsFetchingAuctions(true);
    const data = await refetchAllAuctions();
    setAuctions(data);
    setIsFetchingAuctions(false);
  }, []);
  
  const handleRefetchCategories = React.useCallback(async () => {
    setIsFetchingCategories(true);
    const data = await refetchCategories();
    setCategories(data);
    setIsFetchingCategories(false);
  }, []);

  const handleRefetchSellers = React.useCallback(async () => {
    setIsFetchingSellers(true);
    const data = await refetchSellers();
    setSellers(data);
    setIsFetchingSellers(false);
  }, []);

   const handleMediaSelect = (selectedItems: Partial<MediaItem>[], target: 'main' | 'gallery') => {
    if (selectedItems.length === 0) return;
    
    if (target === 'main') {
        const mainImage = selectedItems[0];
        if (mainImage?.urlOriginal) {
            form.setValue('imageUrl', mainImage.urlOriginal);
            form.setValue('imageMediaId', mainImage.id || null);
        }
    } else { // 'gallery'
        const currentImageUrls = form.getValues('galleryImageUrls') || [];
        const currentMediaIds = form.getValues('mediaItemIds') || [];
        const newImageUrls = selectedItems.map(item => item.urlOriginal).filter(Boolean) as string[];
        const newMediaIds = selectedItems.map(item => item.id).filter(Boolean) as string[];
        
        form.setValue('galleryImageUrls', Array.from(new Set([...currentImageUrls, ...newImageUrls])));
        form.setValue('mediaItemIds', Array.from(new Set([...currentMediaIds, ...newMediaIds])));
    }
    
    setIsMainImageDialogOpen(false);
    setIsGalleryDialogOpen(false);
  };
  
  const handleRemoveFromGallery = (urlToRemove: string) => {
      form.setValue('galleryImageUrls', (form.getValues('galleryImageUrls') || []).filter(url => url !== urlToRemove));
  };
  
  async function onSubmit(values: LotFormValues) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(values);
      if (result.success) {
        toast({ title: 'Sucesso!', description: result.message });
        if (onSuccessCallback) {
          onSuccessCallback();
        } else {
          router.push(watchedAuctionId ? `/admin/auctions/${watchedAuctionId}/edit` : '/admin/lots');
        }
        router.refresh();
      } else {
        toast({ title: 'Erro', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro Inesperado', description: 'Ocorreu um erro ao processar sua solicitação.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  // O resto das funções e hooks permanecem os mesmos...
   const handleLinkBens = () => {
    const selectedBemIds = Object.keys(bemRowSelection)
      .map(Number)
      .map(index => availableBensForTable[index]?.id)
      .filter(Boolean);

    if (selectedBemIds.length > 0) {
      const currentBemIds = form.getValues('bemIds') || [];
      const newBemIds = Array.from(new Set([...currentBemIds, ...selectedBemIds]));
      form.setValue('bemIds', newBemIds, { shouldDirty: true });
      setBemRowSelection({}); 
      toast({ title: `${selectedBemIds.length} bem(ns) vinculado(s).` });
    }
  };

  const handleUnlinkBem = (bemIdToUnlink: string) => {
      const currentBemIds = form.getValues('bemIds') || [];
      const newBemIds = currentBemIds.filter(id => id !== bemIdToUnlink);
      form.setValue('bemIds', newBemIds, { shouldDirty: true });
      toast({ title: 'Bem desvinculado.' });
  };
    
  const handleViewBemDetails = (bem: Bem) => {
    setSelectedBemForModal(bem);
    setIsBemModalOpen(true);
  };

  const bemColumns = React.useMemo(() => createBemColumns({ onOpenDetails: handleViewBemDetails, handleDelete: () => {} }), [handleViewBemDetails]);

  const availableBensForTable = React.useMemo(() => {
    const linkedBemIds = new Set(watchedBemIds || []);
    return currentAvailableBens.filter(bem => !linkedBemIds.has(bem.id));
  }, [currentAvailableBens, watchedBemIds]);
  
  const bemSortOptions = [ { value: 'title_asc', label: 'Título A-Z' }, { value: 'title_desc', label: 'Título Z-A' }, { value: 'evaluationValue_asc', label: 'Valor Crescente' }, { value: 'evaluationValue_desc', label: 'Valor Decrescente' }];
  const renderBemGridItem = (bem: Bem) => (
    <Card key={bem.id} className="flex flex-col shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="p-3"><div className="relative aspect-video bg-muted rounded-md overflow-hidden"><Image src={bem.imageUrl || 'https://placehold.co/400x300.png'} alt={bem.title} fill className="object-cover" data-ai-hint={bem.dataAiHint || bem.categoryName?.toLowerCase() || 'bem item'} /></div><CardTitle className="text-sm font-semibold line-clamp-2 h-8 mt-2">{bem.title}</CardTitle><CardDescription className="text-xs">ID: {bem.publicId || bem.id}</CardDescription></CardHeader>
        <CardContent className="p-3 flex-grow space-y-1 text-xs"><p className="font-medium">Avaliação: {bem.evaluationValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'N/A'}</p></CardContent>
        <CardFooter className="p-2 border-t flex justify-end items-center gap-1"><Button variant="ghost" size="icon" onClick={() => handleViewBemDetails(bem)} className="h-7 w-7 text-sky-600"><Eye className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" onClick={() => handleUnlinkBem(bem.id)} className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></CardFooter>
    </Card>
  );

  const renderBemListItem = (bem: Bem) => (
    <Card key={bem.id} className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-3 flex items-center gap-4">
        <div className="relative w-24 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0"><Image src={bem.imageUrl || 'https://placehold.co/120x90.png'} alt={bem.title} fill className="object-cover" data-ai-hint={bem.dataAiHint || bem.categoryName?.toLowerCase() || 'bem item'} /></div>
        <div className="flex-grow"><h4 className="font-semibold text-sm">{bem.title}</h4><p className="text-xs text-muted-foreground">ID: {bem.publicId || bem.id}</p></div>
        <div className="flex-shrink-0 text-right"><p className="text-sm font-semibold">{bem.evaluationValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'N/A'}</p><p className="text-xs text-muted-foreground">Avaliação</p></div>
         <div className="flex items-center flex-shrink-0 ml-4"><Button variant="ghost" size="icon" onClick={() => handleViewBemDetails(bem)} className="h-8 w-8 text-sky-600"><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleUnlinkBem(bem.id)} className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button></div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* ... O restante do formulário permanece o mesmo ... */}
          <Card className="shadow-lg">
            <CardHeader><CardTitle>Informações do Lote</CardTitle></CardHeader>
            <CardContent className="space-y-6 p-6 bg-secondary/30">
               <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título do Lote</FormLabel><FormControl><Input placeholder="Ex: Carro Ford Ka 2019" {...field} /></FormControl><FormMessage /></FormItem>)} />
               <FormField control={form.control} name="auctionId" render={({ field }) => (<FormItem><FormLabel>Leilão Associado</FormLabel><EntitySelector value={field.value} onChange={field.onChange} options={auctions.map(a => ({ value: a.id, label: `${a.title} (ID: ...${a.id.slice(-6)})` }))} placeholder="Selecione o leilão" searchPlaceholder="Buscar leilão..." emptyStateMessage="Nenhum leilão encontrado." createNewUrl="/admin/auctions/new" editUrlPrefix="/admin/auctions" onRefetch={handleRefetchAuctions} isFetching={isFetchingAuctions} /><FormMessage /></FormItem>)} />
               <FormField control={form.control} name="sellerId" render={({ field }) => (<FormItem><FormLabel>Comitente/Vendedor</FormLabel><EntitySelector value={field.value} onChange={field.onChange} options={sellers.map(s => ({ value: s.id, label: s.name }))} placeholder="Selecione o comitente" searchPlaceholder="Buscar comitente..." emptyStateMessage="Nenhum comitente encontrado" createNewUrl="/admin/sellers/new" editUrlPrefix="/admin/sellers" onRefetch={handleRefetchSellers} isFetching={isFetchingSellers} /><FormDescription>Opcional. Se não for definido, será usado o comitente do leilão.</FormDescription><FormMessage /></FormItem>)} />
               {/* ... outros campos ... */}
            </CardContent>
          </Card>
          
           <Card className="shadow-lg mt-6">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ImageIcon /> Imagens do Lote</CardTitle>
                  <CardDescription>Gerencie a galeria de imagens para este lote.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6 bg-secondary/30">
                  <FormField
                      control={form.control}
                      name="inheritedMediaFromBemId"
                      render={({ field }) => (
                          <FormItem className="space-y-3">
                              <FormLabel className="text-base">Fonte da Galeria de Imagens</FormLabel>
                              <FormControl>
                                  <RadioGroup
                                      onValueChange={(value) => field.onChange(value === "custom" ? null : value)}
                                      value={field.value ? field.value : "custom"}
                                      className="flex flex-col sm:flex-row gap-4"
                                  >
                                      <Label className="flex items-center space-x-2 p-3 border rounded-md cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary flex-1"><RadioGroupItem value="custom" /><span>Usar Galeria Customizada</span></Label>
                                      <Label className={cn("flex items-center space-x-2 p-3 border rounded-md cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary flex-1", linkedBensDetails.length === 0 && "cursor-not-allowed opacity-50")}><RadioGroupItem value={linkedBensDetails[0]?.id || ''} disabled={linkedBensDetails.length === 0} /><span>Herdar de um Bem Vinculado</span></Label>
                                  </RadioGroup>
                              </FormControl>
                          </FormItem>
                      )}
                  />
                  {inheritedMediaFromBemId && (
                      <FormField
                          control={form.control}
                          name="inheritedMediaFromBemId"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel>Selecione o Bem para Herdar a Galeria</FormLabel>
                               <EntitySelector
                                  value={field.value}
                                  onChange={field.onChange}
                                  options={linkedBensDetails.map(b => ({value: b.id, label: b.title}))}
                                  placeholder="Selecione um bem"
                                  searchPlaceholder="Buscar bem..."
                                  emptyStateMessage="Nenhum bem vinculado para selecionar."
                                />
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                  )}
                  {/* Seção da galeria customizada */}
                   <div className={cn("space-y-4", inheritedMediaFromBemId && "opacity-50 pointer-events-none")}>
                        <FormItem>
                            <FormLabel>Imagem Principal</FormLabel>
                            <div className="flex items-center gap-4">
                                <div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden border">{imageUrlPreview ? (<Image src={imageUrlPreview} alt="Prévia" fill className="object-contain" />) : (<ImageIcon className="h-8 w-8 text-muted-foreground m-auto"/>)}</div>
                                <div className="space-y-2 flex-grow">
                                    <Button type="button" variant="outline" onClick={() => setIsMainImageDialogOpen(true)} disabled={!!inheritedMediaFromBemId}>
                                        {imageUrlPreview ? 'Alterar Imagem' : 'Escolher da Biblioteca'}
                                    </Button>
                                    <FormField control={form.control} name="imageUrl" render={({ field }) => (<FormControl><Input type="url" placeholder="Ou cole a URL aqui" {...field} value={field.value ?? ""} disabled={!!inheritedMediaFromBemId} /></FormControl>)} />
                                </div>
                            </div>
                        </FormItem>
                        <FormItem>
                            <FormLabel>Galeria de Imagens Adicionais</FormLabel>
                            <Button type="button" variant="outline" size="sm" onClick={() => setIsGalleryDialogOpen(true)} disabled={!!inheritedMediaFromBemId}><ImagePlus className="mr-2 h-4 w-4"/>Adicionar à Galeria</Button>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 p-2 border rounded-md min-h-[80px]">
                                {galleryUrls?.map((url, index) => (
                                    <div key={url} className="relative aspect-square bg-muted rounded overflow-hidden">
                                        <Image src={url} alt={`Imagem da galeria ${index+1}`} fill className="object-cover" />
                                        <Button type="button" size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 opacity-80 hover:opacity-100 p-0" onClick={() => handleRemoveFromGallery(url)} title="Remover" disabled={!!inheritedMediaFromBemId}><Trash2 className="h-3.5 w-3.5" /></Button>
                                    </div>
                                ))}
                            </div>
                        </FormItem>
                   </div>
              </CardContent>
          </Card>

          <Card className="shadow-lg mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Layers /> Bens do Lote</CardTitle>
                <CardDescription>Vincule os bens que compõem este lote. O primeiro bem vinculado definirá o título e preço inicial, se não preenchidos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6 bg-secondary/30">
                <SearchResultsFrame items={linkedBensDetails} totalItemsCount={linkedBensDetails.length} renderGridItem={renderBemGridItem} renderListItem={renderBemListItem} sortOptions={bemSortOptions} initialSortBy={linkedBensSortBy} onSortChange={setLinkedBensSortBy} platformSettings={platformSettings!} isLoading={false} searchTypeLabel="bens vinculados" emptyStateMessage="Nenhum bem vinculado a este lote." />
                <Separator />
                <div>
                   <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-semibold">Bens Disponíveis para Vincular</h4>
                         <Button type="button" size="sm" onClick={handleLinkBens} disabled={Object.keys(bemRowSelection).length === 0}>
                           <PackagePlus className="mr-2 h-4 w-4" /> Vincular Bem
                        </Button>
                   </div>
                    <DataTable columns={bemColumns} data={availableBensForTable} rowSelection={bemRowSelection} setRowSelection={setRowSelection} searchPlaceholder="Buscar bem disponível..." searchColumnId="title" />
                </div>
              </CardContent>
          </Card>
          <div className="flex justify-end pt-4"><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} {submitButtonText}</Button></div>
        </form>
      </Form>
      
      <ChooseMediaDialog isOpen={isMainImageDialogOpen} onOpenChange={setIsMainImageDialogOpen} onMediaSelect={(items) => handleMediaSelect(items, 'main')} allowMultiple={false} />
      <ChooseMediaDialog isOpen={isGalleryDialogOpen} onOpenChange={setIsGalleryDialogOpen} onMediaSelect={(items) => handleMediaSelect(items, 'gallery')} allowMultiple={true} />
      
      <BemDetailsModal bem={selectedBemForModal} isOpen={isBemModalOpen} onClose={() => setIsBemModalOpen(false)} />
    </>
  );
}
