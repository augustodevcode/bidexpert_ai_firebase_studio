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
import type { Lot, LotCategory, Auction, Bem, StateInfo, CityInfo, MediaItem, Subcategory, PlatformSettings } from '@/types';
import { Loader2, Save, Package, ImagePlus, Trash2, MapPin, FileText, Banknote, Link as LinkIcon, Gavel, Building, Layers, ImageIcon, PackagePlus, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { getSubcategoriesByParentIdAction } from '@/app/admin/subcategories/actions';
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog';
import Image from 'next/image';
import { getAuctionStatusText } from '@/lib/sample-data-helpers';
import { DataTable } from '@/components/ui/data-table';
import { createColumns as createBemColumns } from '@/components/admin/bens/columns';
import { Separator } from '@/components/ui/separator';
import { v4 as uuidv4 } from 'uuid';
import BemDetailsModal from '@/components/admin/bens/bem-details-modal';
import { getBens } from '@/app/admin/bens/actions';
import { getAuction } from '@/app/admin/auctions/actions';
import SearchResultsFrame from '@/components/search-results-frame';
import { Badge } from '@/components/ui/badge';
import { samplePlatformSettings } from '@/lib/sample-data';

interface LotFormProps {
  initialData?: Lot | null;
  categories: LotCategory[];
  auctions: Auction[];
  states: StateInfo[];
  allCities: CityInfo[];
  initialAvailableBens: Bem[];
  onSubmitAction: (data: LotFormValues) => Promise<{ success: boolean; message: string; lotId?: string }>;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
  defaultAuctionId?: string;
}

export default function LotForm({
  initialData,
  categories,
  auctions,
  states,
  allCities,
  initialAvailableBens,
  onSubmitAction,
  formTitle,
  formDescription,
  submitButtonText,
  defaultAuctionId
}: LotFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [filteredCities, setFilteredCities] = React.useState<CityInfo[]>([]);
  
  const [isMainImageDialogOpen, setIsMainImageDialogOpen] = React.useState(false);
  const [availableSubcategories, setAvailableSubcategories] = React.useState<Subcategory[]>([]);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = React.useState(false);
  const [bemRowSelection, setBemRowSelection] = React.useState({});
  const [currentAvailableBens, setCurrentAvailableBens] = React.useState<Bem[]>(initialAvailableBens);

  const [isBemModalOpen, setIsBemModalOpen] = React.useState(false);
  const [selectedBemForModal, setSelectedBemForModal] = React.useState<Bem | null>(null);

  // State for linked bens display
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
      bemIds: initialData?.bemIds || [],
      mediaItemIds: initialData?.mediaItemIds || [],
      galleryImageUrls: initialData?.galleryImageUrls || [],
    },
  });
  
  const watchedAuctionId = useWatch({ control: form.control, name: 'auctionId' });
  const watchedBemIds = useWatch({ control: form.control, name: 'bemIds' });
  
  React.useEffect(() => {
    let isMounted = true;
    const fetchBensForAuction = async () => {
      if (!watchedAuctionId) {
        if (isMounted) setCurrentAvailableBens([]);
        return;
      }
      
      const auction = await getAuction(watchedAuctionId);
      if (!auction || !isMounted) return;
      
      const filterForBens = auction.auctionType === 'JUDICIAL' && auction.judicialProcessId
        ? { judicialProcessId: auction.judicialProcessId }
        : auction.sellerId ? { sellerId: auction.sellerId } : {};
        
      const bens = await getBens(filterForBens);
      if (isMounted) {
        setCurrentAvailableBens(bens);
      }
    };

    fetchBensForAuction();

    return () => {
      isMounted = false;
    };
  }, [watchedAuctionId]);


  React.useEffect(() => {
    if (watchedBemIds?.length === 1 && !form.getValues('title')) {
      const allPossibleBens = [...currentAvailableBens, ...(initialData?.bens || [])];
      const linkedBem = allPossibleBens.find(b => b.id === watchedBemIds[0]);

      if (linkedBem) {
        form.setValue('title', linkedBem.title);
        form.setValue('description', linkedBem.description || '');
        form.setValue('type', linkedBem.categoryId || '', { shouldValidate: true });
        form.setValue('subcategoryId', linkedBem.subcategoryId || null, { shouldValidate: true });
        form.setValue('evaluationValue', linkedBem.evaluationValue);
        form.setValue('imageUrl', linkedBem.imageUrl || '');
        if(!form.getValues('price') || form.getValues('price') === 0) {
            form.setValue('price', linkedBem.evaluationValue || 0);
        }
      }
    } else if (watchedBemIds && watchedBemIds.length > 1 && !form.getValues('title')) {
      form.setValue('title', `Lote com ${watchedBemIds.length} bens`);
    }
  }, [watchedBemIds, currentAvailableBens, initialData?.bens, form]);

  const selectedStateId = useWatch({ control: form.control, name: 'stateId' });
  const selectedCategoryId = useWatch({ control: form.control, name: 'type' });
  const imageUrlPreview = useWatch({ control: form.control, name: 'imageUrl' });
  
  React.useEffect(() => {
    if (selectedStateId && allCities) {
      setFilteredCities(allCities.filter(city => city.stateId === selectedStateId));
      const currentCityId = form.getValues('cityId');
      if (currentCityId && !allCities.find(c => c.id === currentCityId && c.stateId === selectedStateId)) {
        form.setValue('cityId', undefined);
      }
    } else {
      setFilteredCities([]);
    }
  }, [selectedStateId, allCities, form]);
  
  React.useEffect(() => {
    const fetchSubcats = async (parentId: string) => {
        setIsLoadingSubcategories(true);
        setAvailableSubcategories([]); 
        try {
            const parentCategory = categories.find(cat => cat.id === parentId || cat.slug === parentId);
            if (parentCategory && parentCategory.hasSubcategories) {
                const subcats = await getSubcategoriesByParentIdAction(parentCategory.id);
                setAvailableSubcategories(subcats);
                const currentSubcategoryId = form.getValues('subcategoryId');
                if (currentSubcategoryId && !subcats.find(s => s.id === currentSubcategoryId)) {
                   form.setValue('subcategoryId', undefined);
                }
            } else {
                form.setValue('subcategoryId', undefined);
            }
        } catch (error) {
            console.error("Error fetching subcategories:", error);
            toast({ title: "Erro ao buscar subcategorias", variant: "destructive" });
        } finally {
            setIsLoadingSubcategories(false);
        }
    };

    if (selectedCategoryId) {
        fetchSubcats(selectedCategoryId);
    } else {
        setAvailableSubcategories([]);
        form.setValue('subcategoryId', undefined);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId, categories]);

  const handleMediaSelect = (selectedItems: Partial<MediaItem>[]) => {
    if (selectedItems.length > 0) {
      const selectedMediaItem = selectedItems[0];
      if (selectedMediaItem?.urlOriginal) {
        form.setValue('imageUrl', selectedMediaItem.urlOriginal);
        const currentMediaIds = form.getValues('mediaItemIds') || [];
        if (selectedMediaItem.id && !currentMediaIds.includes(selectedMediaItem.id)) {
            form.setValue('mediaItemIds', [selectedMediaItem.id, ...currentMediaIds]);
        }
      }
    }
    setIsMainImageDialogOpen(false);
  };
  
  async function onSubmit(values: LotFormValues) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(values);
      if (result.success) {
        toast({ title: 'Sucesso!', description: result.message });
        router.push(watchedAuctionId ? `/admin/auctions/${watchedAuctionId}/edit` : '/admin/lots');
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

  const handleViewBemDetails = (bem: Bem) => {
    setSelectedBemForModal(bem);
    setIsBemModalOpen(true);
  };

  const bemColumns = React.useMemo(() => createBemColumns({ onOpenDetails: handleViewBemDetails, handleDelete: () => {} }), [handleViewBemDetails]);
  
  const availableBensForTable = React.useMemo(() => {
    const linkedBemIds = new Set(watchedBemIds || []);
    return currentAvailableBens.filter(bem => !linkedBemIds.has(bem.id));
  }, [currentAvailableBens, watchedBemIds]);

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
  
  const linkedBensDetails = React.useMemo(() => {
    const allPossibleBens = [...currentAvailableBens, ...(initialData?.bens || [])];
    const uniqueBens = Array.from(new Map(allPossibleBens.map(item => [item.id, item])).values());
    return (watchedBemIds || []).map(id => uniqueBens.find(bem => bem.id === id)).filter((b): b is Bem => !!b);
  }, [watchedBemIds, currentAvailableBens, initialData?.bens]);

  const bemSortOptions = [
    { value: 'title_asc', label: 'Título A-Z' },
    { value: 'title_desc', label: 'Título Z-A' },
    { value: 'evaluationValue_asc', label: 'Valor Crescente' },
    { value: 'evaluationValue_desc', label: 'Valor Decrescente' },
  ];

  const sortedLinkedBens = React.useMemo(() => {
    return [...linkedBensDetails].sort((a, b) => {
      switch (linkedBensSortBy) {
        case 'title_asc': return a.title.localeCompare(b.title);
        case 'title_desc': return b.title.localeCompare(a.title);
        case 'evaluationValue_asc': return (a.evaluationValue || 0) - (b.evaluationValue || 0);
        case 'evaluationValue_desc': return (b.evaluationValue || 0) - (a.evaluationValue || 0);
        default: return 0;
      }
    });
  }, [linkedBensDetails, linkedBensSortBy]);

  const paginatedLinkedBens = React.useMemo(() => {
    const startIndex = (linkedBensCurrentPage - 1) * linkedBensItemsPerPage;
    return sortedLinkedBens.slice(startIndex, startIndex + linkedBensItemsPerPage);
  }, [sortedLinkedBens, linkedBensCurrentPage, linkedBensItemsPerPage]);

  const renderBemGridItem = (bem: Bem) => (
    <Card key={bem.id} className="flex flex-col shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="p-3">
        <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
          <Image
            src={bem.imageUrl || 'https://placehold.co/400x300.png'}
            alt={bem.title}
            fill
            className="object-cover"
            data-ai-hint={bem.dataAiHint || bem.categoryName?.toLowerCase() || 'bem item'}
          />
        </div>
        <CardTitle className="text-sm font-semibold line-clamp-2 leading-tight h-8 mt-2">{bem.title}</CardTitle>
        <CardDescription className="text-xs">ID: {bem.publicId || bem.id}</CardDescription>
      </CardHeader>
      <CardContent className="p-3 flex-grow space-y-1 text-xs">
        <Badge variant="outline" className={`border-current`}>{bem.status}</Badge>
        <p className="font-medium">Avaliação: {bem.evaluationValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'N/A'}</p>
      </CardContent>
      <CardFooter className="p-2 border-t flex justify-end items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => handleViewBemDetails(bem)} className="h-7 w-7 text-sky-600"><Eye className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" onClick={() => handleUnlinkBem(bem.id)} className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
      </CardFooter>
    </Card>
  );

  const renderBemListItem = (bem: Bem) => (
    <Card key={bem.id} className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-3 flex items-center gap-4">
        <div className="relative w-24 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
          <Image
            src={bem.imageUrl || 'https://placehold.co/120x90.png'}
            alt={bem.title}
            fill
            className="object-cover"
            data-ai-hint={bem.dataAiHint || bem.categoryName?.toLowerCase() || 'bem item'}
          />
        </div>
        <div className="flex-grow">
          <h4 className="font-semibold text-sm">{bem.title}</h4>
          <p className="text-xs text-muted-foreground">ID: {bem.publicId || bem.id}</p>
          <Badge variant="outline" className={`text-xs mt-1 border-current`}>{bem.status}</Badge>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-sm font-semibold">{bem.evaluationValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'N/A'}</p>
          <p className="text-xs text-muted-foreground">Avaliação</p>
        </div>
         <div className="flex items-center flex-shrink-0 ml-4">
          <Button variant="ghost" size="icon" onClick={() => handleViewBemDetails(bem)} className="h-8 w-8 text-sky-600"><Eye className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => handleUnlinkBem(bem.id)} className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );


  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="max-w-3xl mx-auto shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Package className="h-6 w-6 text-primary"/>{formTitle}</CardTitle>
              <CardDescription>{formDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6 bg-secondary/30">
              <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título do Lote</FormLabel><FormControl><Input placeholder="Ex: Carro Ford Ka 2019" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="auctionId" render={({ field }) => (<FormItem><FormLabel>Leilão Associado</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o leilão" /></SelectTrigger></FormControl><SelectContent>{auctions.map(auction => (<SelectItem key={auction.id} value={auction.id}>{auction.title} (ID: ...{auction.id.slice(-6)})</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Detalhes sobre o lote..." {...field} value={field.value ?? ""} rows={4} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Preço (Lance Inicial/Atual)</FormLabel><FormControl><Input type="number" placeholder="Ex: 15000.00" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid md:grid-cols-2 gap-6">
                  {initialData?.status && (
                     <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Input value={getAuctionStatusText(initialData.status)} readOnly disabled />
                    </FormItem>
                  )}
                  <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Categoria do Lote</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo/categoria" /></SelectTrigger></FormControl><SelectContent>{categories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
              </div>

               {availableSubcategories.length > 0 && (
                 <FormField control={form.control} name="subcategoryId" render={({ field }) => (<FormItem><FormLabel>Subcategoria</FormLabel><Select onValueChange={field.onChange} value={field.value || undefined} disabled={isLoadingSubcategories}><FormControl><SelectTrigger><SelectValue placeholder={isLoadingSubcategories ? "Carregando..." : "Selecione a subcategoria"} /></SelectTrigger></FormControl><SelectContent>{availableSubcategories.map(subcat => (<SelectItem key={subcat.id} value={subcat.id}>{subcat.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
              )}
              
              <FormItem>
                <FormLabel>Imagem Principal</FormLabel>
                <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden border">{imageUrlPreview ? <Image src={imageUrlPreview} alt="Prévia" fill className="object-contain"/> : <ImageIcon className="h-8 w-8 text-muted-foreground m-auto"/>}</div>
                    <div className="space-y-2 flex-grow">
                        <Button type="button" variant="outline" onClick={() => setIsMainImageDialogOpen(true)}>{imageUrlPreview ? 'Alterar Imagem Principal' : 'Escolher Imagem'}</Button>
                        <FormField control={form.control} name="imageUrl" render={({ field }) => <FormControl><Input placeholder="Ou cole a URL aqui" {...field} value={field.value ?? ""} /></FormControl>} />
                    </div>
                </div>
              </FormItem>
            </CardContent>
          </Card>
          
          <Card className="max-w-3xl mx-auto shadow-lg mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Layers /> Bens do Lote</CardTitle>
                <CardDescription>Vincule os bens que compõem este lote. O primeiro bem vinculado definirá o título e preço inicial, se não preenchidos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6 bg-secondary/30">
                <SearchResultsFrame
                    items={paginatedLinkedBens}
                    totalItemsCount={linkedBensDetails.length}
                    renderGridItem={renderBemGridItem}
                    renderListItem={renderBemListItem}
                    sortOptions={bemSortOptions}
                    initialSortBy={linkedBensSortBy}
                    onSortChange={setLinkedBensSortBy}
                    platformSettings={platformSettings!}
                    isLoading={false}
                    searchTypeLabel="bens vinculados"
                    currentPage={linkedBensCurrentPage}
                    itemsPerPage={linkedBensItemsPerPage}
                    onPageChange={setLinkedBensCurrentPage}
                    onItemsPerPageChange={setLinkedBensItemsPerPage}
                    emptyStateMessage="Nenhum bem vinculado a este lote."
                />

                <Separator />
                
                <div>
                   <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-semibold">Bens Disponíveis para Vincular</h4>
                         <Button type="button" size="sm" onClick={handleLinkBens} disabled={Object.keys(bemRowSelection).length === 0}>
                           <PackagePlus className="mr-2 h-4 w-4" /> Vincular Bem
                        </Button>
                   </div>
                    <DataTable
                        columns={bemColumns}
                        data={availableBensForTable}
                        rowSelection={bemRowSelection}
                        setRowSelection={setBemRowSelection}
                        searchPlaceholder="Buscar bem disponível..."
                        searchColumnId="title"
                    />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t pt-6 p-6">
                  <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>Cancelar</Button>
                  <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{submitButtonText}</Button>
              </CardFooter>
          </Card>

        </form>
      </Form>
      
      <ChooseMediaDialog
        isOpen={isMainImageDialogOpen}
        onOpenChange={setIsMainImageDialogOpen}
        onMediaSelect={handleMediaSelect}
        allowMultiple={false}
      />
      
      <BemDetailsModal 
        bem={selectedBemForModal} 
        isOpen={isBemModalOpen} 
        onClose={() => setIsBemModalOpen(false)} 
      />
    </>
  );
}
