// src/components/admin/lots/lot-form.tsx
/**
 * @fileoverview Componente de formulário reutilizável para criar e editar Lotes.
 * Utiliza react-hook-form para gerenciamento de estado e Zod para validação.
 * Foi simplificado para usar um campo "Propriedades" em vez de múltiplos campos específicos.
 */
'use client';

import React, { useEffect, useCallback, useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, useWatch, type UseFormReturn } from 'react-hook-form';
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
import type { Lot, Auction, Asset, StateInfo, CityInfo, MediaItem, Subcategory, PlatformSettings, LotStatus, LotCategory, SellerProfileInfo } from '@/types';
import { Loader2, Save, Package, ImagePlus, Trash2, MapPin, FileText, Banknote, Link as LinkIcon, Gavel, Building, Layers, ImageIcon, PackagePlus, Eye, CheckCircle, FileSignature, Sparkles, DollarSign, Percent, Settings as SettingsIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getAuctionStatusText, isValidImageUrl } from '@/lib/ui-helpers';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog';
import { Tooltip, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import EntitySelector from '@/components/ui/entity-selector';
import { getSellers as refetchSellers } from '../sellers/actions';
import { getLotCategories as refetchCategories } from '../categories/actions';
import { getStates as refetchStates } from '../states/actions';
import { getCities as refetchCities } from '../cities/actions';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import AssetDetailsModal from '@/components/admin/assets/asset-details-modal';
import SearchResultsFrame from '@/components/search-results-frame';
import { createColumns as createAssetColumns } from '@/app/admin/assets/columns';
import { getAuction, getAuctions as refetchAllAuctions } from '@/app/admin/auctions/actions';
import { getAssetsForLotting } from '@/app/admin/assets/actions';
import { samplePlatformSettings } from '@/lib/sample-data';
import { DataTable } from '@/components/ui/data-table';
import { Switch } from '@/components/ui/switch';
import CreateAssetModal from '@/components/admin/lotting/create-asset-modal';

interface LotFormProps {
  initialData?: Lot | null;
  categories: LotCategory[];
  auctions: Auction[];
  sellers: SellerProfileInfo[]; 
  states: StateInfo[];
  allCities: CityInfo[];
  initialAvailableAssets: Asset[];
  onSubmitAction: (data: LotFormValues) => Promise<{ success: boolean; message: string; lotId?: string }>;
  formTitle: string;
  formDescription: string;
  submitButtonText?: string;
  isWizardMode?: boolean;
  onWizardDataChange?: (data: Partial<LotFormValues>) => void;
  formRef?: React.Ref<any>;
  defaultAuctionId?: string;
  onSuccessCallback?: () => void;
}

const lotStatusOptions: { value: LotStatus; label: string }[] = [
    'EM_BREVE', 'ABERTO_PARA_LANCES', 'ENCERRADO', 'VENDIDO', 'NAO_VENDIDO', 'CANCELADO', 'RASCUNHO'
].map(status => ({ value: status, label: getAuctionStatusText(status) }));

const LotForm = forwardRef<any, LotFormProps>(({
  initialData,
  categories: initialCategories,
  auctions: initialAuctions,
  sellers: initialSellers, 
  states,
  allCities,
  initialAvailableAssets,
  onSubmitAction,
  formTitle,
  formDescription,
  submitButtonText = "Salvar",
  isWizardMode = false,
  onWizardDataChange,
  defaultAuctionId,
  onSuccessCallback,
}, ref) => {
  
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isMainImageDialogOpen, setIsMainImageDialogOpen] = useState(false);
  const [isGalleryDialogOpen, setIsGalleryDialogOpen] = useState(false);
  const [isAssetCreateModalOpen, setIsAssetCreateModalOpen] = useState(false);
  
  const [availableSubcategories, setAvailableSubcategories] = useState<Subcategory[]>([]);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false);
  const [assetRowSelection, setAssetRowSelection] = useState({});
  const [currentAvailableAssets, setCurrentAvailableAssets] = useState<Asset[]>(initialAvailableAssets);

  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [selectedAssetForModal, setSelectedAssetForModal] = useState<Asset | null>(null);

  const [auctions, setAuctions] = useState(initialAuctions);
  const [categories, setCategories] = useState(initialCategories);
  const [sellers, setSellers] = useState(initialSellers); 
  const [isFetchingAuctions, setIsFetchingAuctions] = useState(false);
  const [isFetchingCategories, setIsFetchingCategories] = useState(false);
  const [isFetchingSellers, setIsFetchingSellers] = useState(false); 

  const [linkedAssetsSortBy, setLinkedAssetsSortBy] = useState('title_asc');
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(samplePlatformSettings as PlatformSettings);

  const form = useForm<LotFormValues>({
    resolver: zodResolver(lotFormSchema),
    mode: 'onChange',
    defaultValues: {
        ...initialData,
        auctionId: initialData?.auctionId || defaultAuctionId || searchParams.get('auctionId') || '',
        type: initialData?.categoryId || initialData?.type || '',
        price: initialData?.price || undefined,
        assetIds: initialData?.assetIds || [],
        mediaItemIds: initialData?.mediaItemIds || [],
        galleryImageUrls: initialData?.galleryImageUrls || [],
        status: initialData?.status || 'EM_BREVE',
        sellerId: initialData?.sellerId || undefined,
        stateId: initialData?.stateId || undefined,
        cityId: initialData?.cityId || undefined,
        inheritedMediaFromAssetId: initialData?.inheritedMediaFromAssetId || undefined,
    },
  });
  
  const { formState } = form;

  const watchedValues = useWatch({ control: form.control });

  useEffect(() => {
    if (isWizardMode && onWizardDataChange) {
      const subscription = form.watch((value) => {
        onWizardDataChange(value as Partial<LotFormValues>);
      });
      return () => subscription.unsubscribe();
    }
  }, [form, isWizardMode, onWizardDataChange, watchedValues]);

  useImperativeHandle(ref, () => ({
    requestSubmit: form.handleSubmit(onSubmit),
    setValue: form.setValue,
    getValues: form.getValues,
  }));

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "auctionStages",
  });
  
  const watchedAuctionId = useWatch({ control: form.control, name: 'auctionId' });
  const watchedAssetIds = useWatch({ control: form.control, name: 'assetIds' });
  const inheritedMediaFromAssetId = useWatch({ control: form.control, name: 'inheritedMediaFromAssetId' });
  const imageUrlPreview = useWatch({ control: form.control, name: 'imageUrl' });
  const galleryUrls = useWatch({ control: form.control, name: 'galleryImageUrls' });

  useEffect(() => {
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

  const linkedAssetsDetails = useMemo(() => {
    const allPossibleAssets = [...currentAvailableAssets, ...(initialData?.assets || [])];
    const uniqueAssets = Array.from(new Map(allPossibleAssets.map(item => [item.id, item])).values());
    return (watchedAssetIds || []).map(id => uniqueAssets.find(asset => asset.id === id)).filter((b): b is Asset => !!b);
  }, [watchedAssetIds, currentAvailableAssets, initialData?.assets]);

  const inheritedAssetDetails = useMemo(() => {
      if (!inheritedMediaFromAssetId) return null;
      return linkedAssetsDetails.find(asset => asset.id === inheritedMediaFromAssetId);
  }, [inheritedMediaFromAssetId, linkedAssetsDetails]);
  
  const displayImageUrl = inheritedAssetDetails?.imageUrl || imageUrlPreview;


  const handleRefetchAuctions = useCallback(async () => {
    setIsFetchingAuctions(true);
    const data = await refetchAllAuctions();
    setAuctions(data);
    setIsFetchingAuctions(false);
  }, []);
  
  const handleRefetchCategories = useCallback(async () => {
    setIsFetchingCategories(true);
    const data = await refetchCategories();
    setCategories(data);
    setIsFetchingCategories(false);
  }, []);

  const handleRefetchSellers = useCallback(async () => {
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
            form.setValue('imageUrl', mainImage.urlOriginal, { shouldDirty: true });
            form.setValue('imageMediaId', mainImage.id || null, { shouldDirty: true });
        }
    } else { // 'gallery'
        const currentImageUrls = form.getValues('galleryImageUrls') || [];
        const currentMediaIds = form.getValues('mediaItemIds') || [];
        const newImageUrls = selectedItems.map(item => item.urlOriginal).filter(Boolean) as string[];
        const newMediaIds = selectedItems.map(item => item.id).filter(Boolean) as string[];
        
        form.setValue('galleryImageUrls', Array.from(new Set([...currentImageUrls, ...newImageUrls])), { shouldDirty: true });
        form.setValue('mediaItemIds', Array.from(new Set([...currentMediaIds, ...newMediaIds])), { shouldDirty: true });
    }
    
    setIsMainImageDialogOpen(false);
    setIsGalleryDialogOpen(false);
  };
  
  const handleRemoveFromGallery = (urlToRemove: string) => {
      form.setValue('galleryImageUrls', (form.getValues('galleryImageUrls') || []).filter(url => url !== urlToRemove), { shouldDirty: true });
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

   const handleLinkAssets = () => {
    const selectedAssetIds = Object.keys(assetRowSelection)
      .map(Number)
      .map(index => availableAssetsForTable[index]?.id)
      .filter(Boolean);

    if (selectedAssetIds.length > 0) {
      const currentAssetIds = form.getValues('assetIds') || [];
      const newAssetIds = Array.from(new Set([...currentAssetIds, ...selectedAssetIds]));
      form.setValue('assetIds', newAssetIds, { shouldDirty: true });
      setAssetRowSelection({}); 
      toast({ title: `${selectedAssetIds.length} bem(ns) vinculado(s).` });
    }
  };

  const handleUnlinkAsset = (assetIdToUnlink: string) => {
      const currentAssetIds = form.getValues('assetIds') || [];
      const newAssetIds = currentAssetIds.filter(id => id !== assetIdToUnlink);
      form.setValue('assetIds', newAssetIds, { shouldDirty: true });
      toast({ title: 'Bem desvinculado.' });
  };
    
  const handleViewAssetDetails = (asset: Asset) => {
    setSelectedAssetForModal(asset);
    setIsAssetModalOpen(true);
  };
  
  const handleAssetCreated = async (newAssetId?: string) => {
    if (newAssetId) {
      const newAssets = await getAssetsForLotting({ sellerId: form.getValues('sellerId') || undefined });
      setCurrentAvailableAssets(newAssets);
      toast({ title: "Lista de bens atualizada!" });
    }
    setIsAssetCreateModalOpen(false);
  }

  const assetColumns = React.useMemo(() => createAssetColumns({ onOpenDetails: handleViewAssetDetails }), [handleViewAssetDetails]);

  const availableAssetsForTable = React.useMemo(() => {
    const linkedAssetIds = new Set(watchedAssetIds || []);
    return currentAvailableAssets.filter(asset => !linkedAssetIds.has(asset.id));
  }, [currentAvailableAssets, watchedAssetIds]);
  
  const assetSortOptions = [ { value: 'title_asc', label: 'Título A-Z' }, { value: 'title_desc', label: 'Título Z-A' }, { value: 'evaluationValue_asc', label: 'Valor Crescente' }, { value: 'evaluationValue_desc', label: 'Valor Decrescente' }];
  const renderAssetGridItem = (asset: Asset) => (
    <Card key={asset.id} className="container-bem-grid-item">
        <CardHeader className="p-3"><div className="wrapper-bem-grid-image"><Image src={asset.imageUrl || 'https://placehold.co/400x300.png'} alt={asset.title} fill className="object-cover" data-ai-hint={asset.dataAiHint || asset.categoryName?.toLowerCase() || 'bem item'} /></div><CardTitle className="title-bem-grid-item">{asset.title}</CardTitle><CardDescription className="description-bem-grid-item">ID: {asset.publicId || asset.id}</CardDescription></CardHeader>
        <CardContent className="p-3 flex-grow space-y-1 text-xs"><p className="font-medium">Avaliação: {asset.evaluationValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'N/A'}</p></CardContent>
        <CardFooter className="p-2 border-t flex justify-end items-center gap-1"><Button variant="ghost" size="icon" onClick={() => handleViewAssetDetails(asset)} className="h-7 w-7 text-sky-600"><Eye className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" onClick={() => handleUnlinkAsset(asset.id)} className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></CardFooter>
    </Card>
  );

  const renderAssetListItem = (asset: Asset) => (
    <Card key={asset.id} className="container-bem-list-item">
      <CardContent className="content-bem-list-item">
        <div className="wrapper-bem-list-image"><Image src={asset.imageUrl || 'https://placehold.co/120x90.png'} alt={asset.title} fill className="object-cover" data-ai-hint={asset.dataAiHint || asset.categoryName?.toLowerCase() || 'bem item'} /></div>
        <div className="flex-grow"><h4 className="title-bem-list-item">{asset.title}</h4><p className="description-bem-list-item">ID: {asset.publicId || asset.id}</p></div>
        <div className="container-bem-list-price"><p className="price-bem-list-item">{asset.evaluationValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'N/A'}</p><p className="label-bem-list-price">Avaliação</p></div>
         <div className="container-bem-list-actions"><Button variant="ghost" size="icon" onClick={() => handleViewAssetDetails(asset)} className="h-8 w-8 text-sky-600"><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleUnlinkAsset(asset.id)} className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button></div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} data-ai-id="lot-form">
            <div className="space-y-6">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Package className="h-6 w-6 text-primary" /> {formTitle}</CardTitle>
                        <CardDescription>{formDescription}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-8">
                      <section className="space-y-4">
                        <h3 className="text-lg font-semibold text-primary border-b pb-2">Informações Gerais</h3>
                         <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título do Lote<span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="Ex: Carro Ford Ka 2019" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name="auctionId" render={({ field }) => (<FormItem data-ai-id="lot-form-auction-selector"><FormLabel>Leilão Associado<span className="text-destructive">*</span></FormLabel><EntitySelector value={field.value} onChange={field.onChange} options={auctions.map(a => ({ value: a.id, label: `${a.title} (ID: ...${a.id.slice(-6)})` }))} placeholder="Selecione o leilão" searchPlaceholder="Buscar leilão..." emptyStateMessage="Nenhum leilão encontrado." createNewUrl="/admin/auctions/new" editUrlPrefix="/admin/auctions" onRefetch={handleRefetchAuctions} isFetching={isFetchingAuctions} /><FormMessage /></FormItem>)} />
                         <FormField name="properties" control={form.control} render={({ field }) => (<FormItem><FormLabel>Propriedades</FormLabel><FormControl><Textarea placeholder="Descreva todas as características do lote aqui. Por exemplo:&#10;Cor: Azul&#10;KM: 50.000&#10;Combustível: Flex" {...field} value={field.value ?? ""} rows={10} /></FormControl><FormMessage /></FormItem>)} />
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status<span className="text-destructive">*</span></FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger></FormControl><SelectContent>{lotStatusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                         </div>
                      </section>
                      
                      <Separator />

                      <section className="space-y-4">
                        <h3 className="text-lg font-semibold text-primary border-b pb-2">Financeiro</h3>
                        <FormField control={form.control} name="price" render={({ field }) => (<FormItem data-ai-id="lot-form-price-field"><FormLabel>Lance Inicial (R$)<span className="text-destructive">*</span></FormLabel><FormControl><div className="relative"><DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input type="number" placeholder="5000.00" {...field} value={field.value ?? ''} className="pl-8"/></div></FormControl><FormDescription>Este é o valor que iniciará o leilão para este lote.</FormDescription><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="bidIncrementStep" render={({ field }) => (<FormItem><FormLabel>Incremento Mínimo (R$)</FormLabel><FormControl><div className="relative"><Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input type="number" placeholder="100.00" {...field} value={field.value ?? ''} className="pl-8"/></div></FormControl><FormDescription>O valor mínimo que um lance deve ser acima do anterior.</FormDescription><FormMessage /></FormItem>)}/>
                      </section>
                      
                      <Separator />

                      <section className="space-y-4">
                        <h3 className="text-lg font-semibold text-primary border-b pb-2">Bens Vinculados</h3>
                        <div data-ai-id="linked-assets-section">
                            <h4 className="title-bens-vinculados">Bens Vinculados a Este Lote</h4>
                            <SearchResultsFrame items={linkedAssetsDetails} totalItemsCount={linkedAssetsDetails.length} renderGridItem={renderAssetGridItem} renderListItem={renderAssetListItem} sortOptions={assetSortOptions} initialSortBy={linkedAssetsSortBy} onSortChange={setLinkedAssetsSortBy} platformSettings={platformSettings!} isLoading={false} searchTypeLabel="bens vinculados" emptyStateMessage="Nenhum bem vinculado a este lote." />
                        </div>
                        <Separator />
                        <div className="container-bens-disponiveis">
                            <div className="header-bens-disponiveis"><h4 className="title-bens-disponiveis">Bens Disponíveis para Vincular</h4><div className="flex gap-2"><Button type="button" variant="secondary" size="sm" onClick={() => setIsAssetCreateModalOpen(true)}><PackagePlus className="mr-2 h-4 w-4"/>Cadastrar Novo Bem</Button><Button type="button" size="sm" onClick={handleLinkAssets} disabled={Object.keys(assetRowSelection).length === 0}><LinkIcon className="mr-2 h-4 w-4" /> Vincular Bem</Button></div></div>
                            <DataTable columns={assetColumns} data={availableAssetsForTable} rowSelection={assetRowSelection} setRowSelection={setAssetRowSelection} searchPlaceholder="Buscar bem disponível..." searchColumnId="title" />
                        </div>
                      </section>

                      <Separator />

                      <section className="space-y-4">
                         <h3 className="text-lg font-semibold text-primary border-b pb-2">Mídia do Lote</h3>
                         <FormField control={form.control} name="inheritedMediaFromAssetId" render={({ field }) => (<FormItem className="space-y-3 p-4 border rounded-md bg-background"><FormLabel className="text-base font-semibold">Fonte da Galeria de Imagens</FormLabel><FormControl><RadioGroup onValueChange={(value) => field.onChange(value === "custom" ? null : value)} value={field.value ? field.value : "custom"} className="flex flex-col sm:flex-row gap-4"><Label className="flex items-center space-x-2 p-3 border rounded-md cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary flex-1"><RadioGroupItem value="custom" /><span>Usar Galeria Customizada</span></Label><Label className={cn("flex items-center space-x-2 p-3 border rounded-md cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary flex-1", linkedAssetsDetails.length === 0 && "cursor-not-allowed opacity-50")}><RadioGroupItem value={linkedAssetsDetails[0]?.id || ''} disabled={linkedAssetsDetails.length === 0} /><span>Herdar de um Bem Vinculado</span></Label></RadioGroup></FormControl></FormItem>)}/>
                          {inheritedMediaFromAssetId && (<FormField control={form.control} name="inheritedMediaFromAssetId" render={({ field }) => (<FormItem><FormLabel>Selecione o Bem para Herdar a Galeria</FormLabel><EntitySelector value={field.value} onChange={field.onChange} options={linkedAssetsDetails.map(b => ({value: b.id, label: b.title}))} placeholder="Selecione um bem" searchPlaceholder="Buscar bem..." emptyStateMessage="Nenhum bem vinculado para selecionar."/><FormMessage /></FormItem>)}/>)}
                          <fieldset disabled={!!inheritedMediaFromAssetId} className="space-y-4 group">
                              <FormItem><FormLabel>Imagem Principal</FormLabel><div className="flex items-center gap-4"><div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden border">{isValidImageUrl(displayImageUrl) ? (<Image src={displayImageUrl} alt="Prévia" fill className="object-contain" />) : (<ImageIcon className="h-8 w-8 text-muted-foreground m-auto"/>)}</div><div className="space-y-2 flex-grow"><Button type="button" variant="outline" onClick={() => setIsMainImageDialogOpen(true)} className="group-disabled:cursor-not-allowed">{imageUrlPreview ? 'Alterar Imagem' : 'Escolher da Biblioteca'}</Button><FormField control={form.control} name="imageUrl" render={({ field }) => (<FormControl><Input type="url" placeholder="Ou cole a URL aqui" {...field} value={field.value ?? ""} /></FormControl>)} /><FormMessage /></div></div></FormItem>
                              <FormItem><FormLabel>Galeria de Imagens Adicionais</FormLabel><Button type="button" variant="outline" size="sm" onClick={() => setIsGalleryDialogOpen(true)} className="group-disabled:cursor-not-allowed"><ImagePlus className="mr-2 h-4 w-4"/>Adicionar à Galeria</Button><div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 p-2 border rounded-md min-h-[80px]">{galleryUrls?.map((url, index) => (<div key={url} className="relative aspect-square bg-muted rounded overflow-hidden"><Image src={url} alt={`Imagem da galeria ${index+1}`} fill className="object-cover" /><Button type="button" size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 opacity-80 hover:opacity-100 p-0" onClick={() => handleRemoveFromGallery(url)} title="Remover"><Trash2 className="h-3.5 w-3.5" /></Button></div>))}</div></FormItem>
                         </fieldset>
                      </section>
                    </CardContent>
                </Card>
                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting || !formState.isValid}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {submitButtonText}
                    </Button>
                </div>
            </div>
        </form>
      </Form>
      
      <ChooseMediaDialog isOpen={isMainImageDialogOpen} onOpenChange={setIsMainImageDialogOpen} onMediaSelect={(items) => handleMediaSelect(items, 'main')} allowMultiple={false} />
      <ChooseMediaDialog isOpen={isGalleryDialogOpen} onOpenChange={setIsGalleryDialogOpen} onMediaSelect={(items) => handleMediaSelect(items, 'gallery')} allowMultiple={true} />
      
      <AssetDetailsModal asset={selectedAssetForModal} isOpen={isAssetModalOpen} onClose={() => setIsAssetModalOpen(false)} />
      
      <CreateAssetModal
        isOpen={isAssetCreateModalOpen}
        onClose={() => setIsAssetCreateModalOpen(false)}
        onAssetCreated={handleAssetCreated}
        initialSellerId={form.getValues('sellerId') || undefined}
        initialJudicialProcessId={form.getValues('auctionType') === 'JUDICIAL' ? initialData?.auction?.judicialProcessId : undefined}
      />
    </>
  );
});

LotForm.displayName = "LotForm";
export default LotForm;
