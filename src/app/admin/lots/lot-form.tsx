// src/app/admin/lots/lot-form.tsx
/**
 * @fileoverview Componente de formulário reutilizável para criar e editar Lotes.
 * Utiliza `react-hook-form` e Zod para gerenciamento de estado e validação.
 * É um componente complexo que inclui seletores de entidade, campos dinâmicos
 * para diferentes métodos de leilão, e gerenciamento de etapas/praças.
 */
'use client';

import React, { useEffect, useCallback, useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller, useFieldArray, useWatch, type UseFormReturn } from 'react-hook-form';
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
import { getAuctionStatusText } from '@/lib/ui-helpers';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import EntitySelector from '@/components/ui/entity-selector';
import { getSellers as refetchSellers } from '../sellers/actions';
import { getLotCategories as refetchCategories } from '../categories/actions';
import { getStates as refetchStates } from '../states/actions';
import { getCities as refetchCities } from '../cities/actions';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import AssetDetailsModal from '@/components/admin/assets/asset-details-modal';
import SearchResultsFrame from '@/components/search-results-frame';
import { createColumns as createAssetColumns } from '@/components/admin/lotting/columns';
import { getAuction, getAuctions as refetchAllAuctions } from '@/app/admin/auctions/actions';
import { getAssets } from '@/app/admin/assets/actions';
import { samplePlatformSettings } from '@/lib/sample-data';
import { DataTable } from '@/components/ui/data-table';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


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
  initialAvailableAssets,
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
  const [assetRowSelection, setAssetRowSelection] = React.useState({});
  const [currentAvailableAssets, setCurrentAvailableAssets] = React.useState<Asset[]>(initialAvailableAssets);

  const [isAssetModalOpen, setIsAssetModalOpen] = React.useState(false);
  const [selectedAssetForModal, setSelectedAssetForModal] = React.useState<Asset | null>(null);

  const [auctions, setAuctions] = React.useState(initialAuctions);
  const [categories, setCategories] = React.useState(initialCategories);
  const [sellers, setSellers] = React.useState(initialSellers); 
  const [isFetchingAuctions, setIsFetchingAuctions] = React.useState(false);
  const [isFetchingCategories, setIsFetchingCategories] = React.useState(false);
  const [isFetchingSellers, setIsFetchingSellers] = React.useState(false); 

  const [linkedAssetsSortBy, setLinkedAssetsSortBy] = React.useState('title_asc');
  const [platformSettings, setPlatformSettings] = React.useState<PlatformSettings | null>(samplePlatformSettings as PlatformSettings);

  const form = useForm<LotFormValues>({
    resolver: zodResolver(lotFormSchema),
    defaultValues: {
      ...initialData,
      auctionId: initialData?.auctionId || defaultAuctionId || searchParams.get('auctionId') || '',
      type: initialData?.categoryId || initialData?.type || '',
      price: initialData?.price || 0,
      assetIds: initialData?.assetIds || [],
      mediaItemIds: initialData?.mediaItemIds || [],
      galleryImageUrls: initialData?.galleryImageUrls || [],
      status: initialData?.status || 'EM_BREVE',
      sellerId: initialData?.sellerId || undefined,
      stateId: initialData?.stateId || undefined,
      cityId: initialData?.cityId || undefined,
      inheritedMediaFromBemId: initialData?.inheritedMediaFromBemId || undefined,
      allowInstallmentBids: initialData?.allowInstallmentBids || false,
    },
  });
  
  const watchedAuctionId = useWatch({ control: form.control, name: 'auctionId' });
  const watchedAssetIds = useWatch({ control: form.control, name: 'assetIds' });
  const inheritedMediaFromAssetId = useWatch({ control: form.control, name: 'inheritedMediaFromBemId' });
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

  const linkedAssetsDetails = React.useMemo(() => {
    const allPossibleAssets = [...currentAvailableAssets, ...(initialData?.assets || [])];
    const uniqueAssets = Array.from(new Map(allPossibleAssets.map(item => [item.id, item])).values());
    return (watchedAssetIds || []).map(id => uniqueAssets.find(asset => asset.id === id)).filter((b): b is Asset => !!b);
  }, [watchedAssetIds, currentAvailableAssets, initialData?.assets]);

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

  const assetColumns = React.useMemo(() => createAssetColumns({ onOpenDetails: handleViewAssetDetails, handleDelete: () => {} }), [handleViewAssetDetails]);

  const availableAssetsForTable = React.useMemo(() => {
    const linkedAssetIds = new Set(watchedAssetIds || []);
    return currentAvailableAssets.filter(asset => !linkedAssetIds.has(asset.id));
  }, [currentAvailableAssets, watchedAssetIds]);
  
  const assetSortOptions = [ { value: 'title_asc', label: 'Título A-Z' }, { value: 'title_desc', label: 'Título Z-A' }, { value: 'evaluationValue_asc', label: 'Valor Crescente' }, { value: 'evaluationValue_desc', label: 'Valor Decrescente' }];
  const renderAssetGridItem = (asset: Asset) => (
    <Card key={asset.id} className="flex flex-col shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="p-3"><div className="relative aspect-video bg-muted rounded-md overflow-hidden"><Image src={asset.imageUrl || 'https://placehold.co/400x300.png'} alt={asset.title} fill className="object-cover" data-ai-hint={asset.dataAiHint || asset.categoryName?.toLowerCase() || 'bem item'} /></div><CardTitle className="text-sm font-semibold line-clamp-2 h-8 mt-2">{asset.title}</CardTitle><CardDescription className="text-xs">ID: {asset.publicId || asset.id}</CardDescription></CardHeader>
        <CardContent className="p-3 flex-grow space-y-1 text-xs"><p className="font-medium">Avaliação: {asset.evaluationValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'N/A'}</p></CardContent>
        <CardFooter className="p-2 border-t flex justify-end items-center gap-1"><Button variant="ghost" size="icon" onClick={() => handleViewAssetDetails(asset)} className="h-7 w-7 text-sky-600"><Eye className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" onClick={() => handleUnlinkAsset(asset.id)} className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></CardFooter>
    </Card>
  );

  const renderAssetListItem = (asset: Asset) => (
    <Card key={asset.id} className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-3 flex items-center gap-4">
        <div className="relative w-24 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0"><Image src={asset.imageUrl || 'https://placehold.co/120x90.png'} alt={asset.title} fill className="object-cover" data-ai-hint={asset.dataAiHint || asset.categoryName?.toLowerCase() || 'bem item'} /></div>
        <div className="flex-grow"><h4 className="font-semibold text-sm">{asset.title}</h4><p className="text-xs text-muted-foreground">ID: {asset.publicId || asset.id}</p></div>
        <div className="flex-shrink-0 text-right"><p className="text-sm font-semibold">{asset.evaluationValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'N/A'}</p><p className="text-xs text-muted-foreground">Avaliação</p></div>
         <div className="flex items-center flex-shrink-0 ml-4"><Button variant="ghost" size="icon" onClick={() => handleViewAssetDetails(asset)} className="h-8 w-8 text-sky-600"><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleUnlinkAsset(asset.id)} className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button></div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-6">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Package className="h-6 w-6 text-primary" /> {formTitle}</CardTitle>
                        <CardDescription>{formDescription}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                         <Tabs defaultValue="geral" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                                <TabsTrigger value="geral">Geral</TabsTrigger>
                                <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
                                <TabsTrigger value="midia">Mídia</TabsTrigger>
                                <TabsTrigger value="avancado">Avançado</TabsTrigger>
                            </TabsList>
                            <TabsContent value="geral" className="pt-6 space-y-4">
                                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título do Lote</FormLabel><FormControl><Input placeholder="Ex: Carro Ford Ka 2019" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Descreva o lote em detalhes" {...field} value={field.value ?? ""} rows={5} /></FormControl><FormMessage /></FormItem>)} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="auctionId" render={({ field }) => (<FormItem><FormLabel>Leilão Associado</FormLabel><EntitySelector value={field.value} onChange={field.onChange} options={auctions.map(a => ({ value: a.id, label: `${a.title} (ID: ...${a.id.slice(-6)})` }))} placeholder="Selecione o leilão" searchPlaceholder="Buscar leilão..." emptyStateMessage="Nenhum leilão encontrado." createNewUrl="/admin/auctions/new" editUrlPrefix="/admin/auctions" onRefetch={handleRefetchAuctions} isFetching={isFetchingAuctions} /><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="sellerId" render={({ field }) => (<FormItem><FormLabel>Comitente/Vendedor</FormLabel><EntitySelector value={field.value} onChange={field.onChange} options={sellers.map(s => ({ value: s.id, label: s.name }))} placeholder="Selecione o comitente" searchPlaceholder="Buscar comitente..." emptyStateMessage="Nenhum comitente encontrado" createNewUrl="/admin/sellers/new" editUrlPrefix="/admin/sellers" onRefetch={handleRefetchSellers} isFetching={isFetchingSellers} /><FormDescription>Opcional. Se não for definido, será usado o comitente do leilão.</FormDescription><FormMessage /></FormItem>)} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger></FormControl><SelectContent>{lotStatusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="number" render={({ field }) => (<FormItem><FormLabel>Nº do Lote</FormLabel><FormControl><Input placeholder="Ex: 001, A5" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="condition" render={({ field }) => (<FormItem><FormLabel>Condição</FormLabel><FormControl><Input placeholder="Ex: Novo, Usado, Sucata" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                            </TabsContent>
                             <TabsContent value="financeiro" className="pt-6 space-y-4">
                               <p>A configuração de preços agora é feita por etapa do leilão.</p>
                             </TabsContent>
                              <TabsContent value="midia" className="pt-6 space-y-4">
                                 <FormField control={form.control} name="inheritedMediaFromBemId" render={({ field }) => (<FormItem className="space-y-3 p-4 border rounded-md bg-background"><FormLabel className="text-base font-semibold">Fonte da Galeria de Imagens</FormLabel><FormControl><RadioGroup onValueChange={(value) => field.onChange(value === "custom" ? null : value)} value={field.value ? field.value : "custom"} className="flex flex-col sm:flex-row gap-4"><Label className="flex items-center space-x-2 p-3 border rounded-md cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary flex-1"><RadioGroupItem value="custom" /><span>Usar Galeria Customizada</span></Label><Label className={cn("flex items-center space-x-2 p-3 border rounded-md cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary flex-1", linkedAssetsDetails.length === 0 && "cursor-not-allowed opacity-50")}><RadioGroupItem value={linkedAssetsDetails[0]?.id || ''} disabled={linkedAssetsDetails.length === 0} /><span>Herdar de um Bem Vinculado</span></Label></RadioGroup></FormControl></FormItem>)}/>
                                  {inheritedMediaFromAssetId && (<FormField control={form.control} name="inheritedMediaFromBemId" render={({ field }) => (<FormItem><FormLabel>Selecione o Bem para Herdar a Galeria</FormLabel><EntitySelector value={field.value} onChange={field.onChange} options={linkedAssetsDetails.map(b => ({value: b.id, label: b.title}))} placeholder="Selecione um bem" searchPlaceholder="Buscar bem..." emptyStateMessage="Nenhum bem vinculado para selecionar."/><FormMessage /></FormItem>)}/>)}
                                  <div className={cn("space-y-4", inheritedMediaFromAssetId && "opacity-50 pointer-events-none")}>
                                      <FormItem><FormLabel>Imagem Principal</FormLabel><div className="flex items-center gap-4"><div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden border">{imageUrlPreview ? (<Image src={imageUrlPreview} alt="Prévia" fill className="object-contain" />) : (<ImageIcon className="h-8 w-8 text-muted-foreground m-auto"/>)}</div><div className="space-y-2 flex-grow"><Button type="button" variant="outline" onClick={() => setIsMainImageDialogOpen(true)} disabled={!!inheritedMediaFromAssetId}>{imageUrlPreview ? 'Alterar Imagem' : 'Escolher da Biblioteca'}</Button><FormField control={form.control} name="imageUrl" render={({ field }) => (<FormControl><Input type="url" placeholder="Ou cole a URL aqui" {...field} value={field.value ?? ""} /></FormControl>)} /><FormMessage /></div></div></FormItem>
                                      <FormItem><FormLabel>Galeria de Imagens Adicionais</FormLabel><Button type="button" variant="outline" size="sm" onClick={() => setIsGalleryDialogOpen(true)} disabled={!!inheritedMediaFromAssetId}><ImagePlus className="mr-2 h-4 w-4"/>Adicionar à Galeria</Button><div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 p-2 border rounded-md min-h-[80px]">{galleryUrls?.map((url, index) => (<div key={url} className="relative aspect-square bg-muted rounded overflow-hidden"><Image src={url} alt={`Imagem da galeria ${index+1}`} fill className="object-cover" /><Button type="button" size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 opacity-80 hover:opacity-100 p-0" onClick={() => handleRemoveFromGallery(url)} title="Remover" disabled={!!inheritedMediaFromAssetId}><Trash2 className="h-3.5 w-3.5" /></Button></div>))}</div></FormItem>
                                 </div>
                              </TabsContent>
                              <TabsContent value="avancado" className="pt-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField control={form.control} name="isFeatured" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background"><div className="space-y-0.5"><FormLabel>Destaque</FormLabel><FormDescription className="text-xs">Exibir este lote na seção de destaques.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                                  <FormField control={form.control} name="isExclusive" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background"><div className="space-y-0.5"><FormLabel>Exclusivo</FormLabel><FormDescription className="text-xs">Marcar como um lote exclusivo ou raro.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                                  <FormField control={form.control} name="allowInstallmentBids" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background"><div className="space-y-0.5"><FormLabel>Permitir Parcelamento</FormLabel><FormDescription className="text-xs">Permite que usuários façam lances parcelados.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                                </div>
                                <FormField control={form.control} name="dataAiHint" render={({ field }) => (<FormItem><FormLabel>Dica para IA (Imagem)</FormLabel><FormControl><Input placeholder="Ex: carro antigo, relogio ouro" {...field} value={field.value ?? ""} /></FormControl><FormDescription>Palavras-chave para ajudar a IA a gerar uma imagem placeholder.</FormDescription><FormMessage /></FormItem>)} />
                              </TabsContent>
                         </Tabs>
                    </CardContent>
                </Card>
                
                <Card className="shadow-lg mt-6">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Layers /> Bens do Lote</CardTitle><CardDescription>Vincule os bens que compõem este lote. O primeiro bem vinculado definirá o título e preço inicial, se não preenchidos.</CardDescription></CardHeader>
                    <CardContent className="space-y-4 p-6 bg-secondary/30">
                        <SearchResultsFrame items={linkedAssetsDetails} totalItemsCount={linkedAssetsDetails.length} renderGridItem={renderAssetGridItem} renderListItem={renderAssetListItem} sortOptions={assetSortOptions} initialSortBy={linkedAssetsSortBy} onSortChange={setLinkedAssetsSortBy} platformSettings={platformSettings!} isLoading={false} searchTypeLabel="bens vinculados" emptyStateMessage="Nenhum bem vinculado a este lote." />
                        <Separator />
                        <div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2"><h4 className="text-sm font-semibold">Bens Disponíveis para Vincular</h4><Button type="button" size="sm" onClick={handleLinkAssets} disabled={Object.keys(assetRowSelection).length === 0}><PackagePlus className="mr-2 h-4 w-4" /> Vincular Bem</Button></div>
                            <DataTable columns={assetColumns} data={availableAssetsForTable} rowSelection={assetRowSelection} setRowSelection={setAssetRowSelection} searchPlaceholder="Buscar bem disponível..." searchColumnId="title" />
                        </div>
                    </CardContent>
                </Card>
                <div className="flex justify-end pt-4"><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} {submitButtonText}</Button></div>
            </div>
        </form>
      </Form>
      
      <ChooseMediaDialog isOpen={isMainImageDialogOpen} onOpenChange={setIsMainImageDialogOpen} onMediaSelect={(items) => handleMediaSelect(items, 'main')} allowMultiple={false} />
      <ChooseMediaDialog isOpen={isGalleryDialogOpen} onOpenChange={setIsGalleryDialogOpen} onMediaSelect={(items) => handleMediaSelect(items, 'gallery')} allowMultiple={true} />
      
      <AssetDetailsModal asset={selectedAssetForModal} isOpen={isAssetModalOpen} onClose={() => setIsAssetModalOpen(false)} />
    </>
  );
}
