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
import { useRouter } from 'next/navigation';
import { lotFormSchema, type LotFormValues } from './lot-form-schema';
import type { Lot, LotCategory, Auction, StateInfo, CityInfo, MediaItem, Subcategory, Bem } from '@/types';
import { Loader2, Save, Package, ImagePlus, Trash2, MapPin, FileText, Banknote, Link as LinkIcon, Gavel, Building, Layers, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { getSubcategoriesByParentIdAction } from '@/app/admin/subcategories/actions';
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog';
import Image from 'next/image';
import { getAuctionStatusText } from '@/lib/sample-data-helpers';

interface LotFormProps {
  initialData?: Lot | null;
  categories: LotCategory[];
  auctions: Auction[];
  states: StateInfo[];
  allCities: CityInfo[];
  bens: Bem[]; // Bens associados a este lote
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
  bens,
  onSubmitAction,
  formTitle,
  formDescription,
  submitButtonText,
  defaultAuctionId,
}: LotFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [filteredCities, setFilteredCities] = React.useState<CityInfo[]>([]);
  
  const [isMainImageDialogOpen, setIsMainImageDialogOpen] = React.useState(false);
  const [availableSubcategories, setAvailableSubcategories] = React.useState<Subcategory[]>([]);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = React.useState(false);

  const form = useForm<LotFormValues>({
    resolver: zodResolver(lotFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      auctionId: defaultAuctionId || initialData?.auctionId || '',
      description: initialData?.description || '',
      price: initialData?.price || 0,
      initialPrice: initialData?.initialPrice || undefined,
      stateId: initialData?.stateId || undefined,
      cityId: initialData?.cityId || undefined,
      type: initialData?.categoryId || initialData?.type || '',
      subcategoryId: initialData?.subcategoryId || undefined,
      imageUrl: initialData?.imageUrl || '',
      mediaItemIds: initialData?.mediaItemIds || [],
      galleryImageUrls: initialData?.galleryImageUrls || [],
      judicialProcessNumber: initialData?.judicialProcessNumber || '',
      courtDistrict: initialData?.courtDistrict || '',
      courtName: initialData?.courtName || '',
      evaluationValue: initialData?.evaluationValue || null,
    },
  });

  const selectedStateId = useWatch({ control: form.control, name: 'stateId' });
  const selectedCategoryId = useWatch({ control: form.control, name: 'type' });
  const imageUrlPreview = useWatch({ control: form.control, name: 'imageUrl' });
  
  const hasSingleBem = initialData?.bemIds && initialData.bemIds.length === 1;

  React.useEffect(() => {
    if (defaultAuctionId) {
      form.setValue('auctionId', defaultAuctionId);
    }
  }, [defaultAuctionId, form]);

  React.useEffect(() => {
    if (selectedStateId) {
      setFilteredCities(allCities.filter(city => city.stateId === selectedStateId));
      const currentCityId = form.getValues('cityId');
      if (currentCityId && !allCities.find(c => c.id === currentCityId && c.stateId === selectedStateId)) {
        form.setValue('cityId', undefined);
      }
    } else {
      setFilteredCities([]);
      form.setValue('cityId', undefined);
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
        router.push(defaultAuctionId ? `/admin/auctions/${defaultAuctionId}/edit` : '/admin/lots');
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

  return (
    <>
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-6 w-6 text-primary"/>{formTitle}</CardTitle>
          <CardDescription>{formDescription}</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título do Lote</FormLabel><FormControl><Input placeholder="Ex: Carro Ford Ka 2019" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="auctionId" render={({ field }) => (<FormItem><FormLabel>Leilão Associado</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o leilão" /></SelectTrigger></FormControl><SelectContent>{auctions.map(auction => (<SelectItem key={auction.id} value={auction.id}>{auction.title} (ID: ...{auction.id.slice(-6)})</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Detalhes sobre o lote..." {...field} value={field.value ?? ""} rows={4} /></FormControl><FormMessage /></FormItem>)} />
              
              <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Preço (Lance Inicial/Atual)</FormLabel><FormControl><Input type="number" placeholder="Ex: 15000.00" {...field} /></FormControl><FormMessage /></FormItem>)} />

              <div className="grid md:grid-cols-2 gap-6">
                  {initialData?.status && (
                     <FormItem>
                      <FormLabel>Status (Derivado do Leilão)</FormLabel>
                      <Input value={getAuctionStatusText(initialData.status)} readOnly disabled />
                    </FormItem>
                  )}
                  <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Categoria do Lote</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo/categoria" /></SelectTrigger></FormControl><SelectContent>{categories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
              </div>

               {availableSubcategories.length > 0 && (
                 <FormField control={form.control} name="subcategoryId" render={({ field }) => (<FormItem><FormLabel>Subcategoria</FormLabel><Select onValueChange={field.onChange} value={field.value || undefined} disabled={isLoadingSubcategories}><FormControl><SelectTrigger><SelectValue placeholder={isLoadingSubcategories ? "Carregando..." : "Selecione a subcategoria"} /></SelectTrigger></FormControl><SelectContent>{availableSubcategories.map(subcat => (<SelectItem key={subcat.id} value={subcat.id}>{subcat.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
              )}

              {bens && bens.length > 0 && (
                 <Card>
                  <CardHeader><CardTitle className="text-md font-semibold">Bens Vinculados a este Lote</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {bens.map(bem => (
                        <li key={bem.id}>
                          <span className="font-medium text-foreground">{bem.title}</span> (ID: {bem.publicId})
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                 </Card>
              )}

              <FormItem>
                <FormLabel>Imagens do Lote</FormLabel>
                {hasSingleBem && <FormDescription className="text-xs">Este lote contém um único bem. As imagens são gerenciadas no cadastro do bem.</FormDescription>}
                <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden border">{imageUrlPreview ? <Image src={imageUrlPreview} alt="Prévia" fill className="object-contain"/> : <ImageIcon className="h-8 w-8 text-muted-foreground m-auto"/>}</div>
                    <div className="space-y-2 flex-grow">
                        <Button type="button" variant="outline" onClick={() => setIsMainImageDialogOpen(true)} disabled={hasSingleBem}>{imageUrlPreview ? 'Alterar Imagem Principal' : 'Escolher Imagem'}</Button>
                        <FormField control={form.control} name="imageUrl" render={({ field }) => <FormControl><Input placeholder="Ou cole a URL aqui" {...field} value={field.value ?? ""} disabled={hasSingleBem} /></FormControl>} />
                    </div>
                </div>
              </FormItem>
              
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{submitButtonText}</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <ChooseMediaDialog
        isOpen={isMainImageDialogOpen}
        onOpenChange={setIsMainImageDialogOpen}
        onMediaSelect={handleMediaSelect}
        allowMultiple={false}
      />
    </>
  );
}
