
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { directSaleOfferFormSchema, type DirectSaleOfferFormData } from './direct-sale-form-schema';
import type { DirectSaleOffer, LotCategory, SellerProfileInfo, MediaItem } from '@/types';
import { Loader2, Save, ShoppingCart, CalendarIcon, DollarSign, ImagePlus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog';
import { Separator } from '@/components/ui/separator';
import { v4 as uuidv4 } from 'uuid';

interface DirectSaleFormProps {
  initialData?: DirectSaleOffer | null;
  categories: LotCategory[];
  sellers: SellerProfileInfo[];
  onSubmitAction: (data: DirectSaleOfferFormData) => Promise<{ success: boolean; message: string; offerId?: string }>;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
}

export default function DirectSaleForm({
  initialData,
  categories,
  sellers,
  onSubmitAction,
  formTitle,
  formDescription,
  submitButtonText,
}: DirectSaleFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [isMainImageDialogOpen, setIsMainImageDialogOpen] = React.useState(false);
  const [isGalleryDialogOpen, setIsGalleryDialogOpen] = React.useState(false);
  const [mainImagePreviewUrl, setMainImagePreviewUrl] = React.useState<string | null>(initialData?.imageUrl || null);
  const [selectedMediaForGallery, setSelectedMediaForGallery] = React.useState<Partial<MediaItem>[]>(() => {
    if (!initialData) return [];
    const itemsMap = new Map<string, Partial<MediaItem>>();
    (initialData.mediaItemIds || []).forEach(mediaId => {
      itemsMap.set(mediaId, { id: mediaId, urlOriginal: `https://placehold.co/100x100.png?text=ID:${mediaId.substring(0, 4)}`, title: `Item de Mídia ${mediaId.substring(0, 4)}` });
    });
    (initialData.galleryImageUrls || []).forEach((url, index) => {
      const urlExistsInMap = Array.from(itemsMap.values()).some(item => item.urlOriginal === url);
      if (!urlExistsInMap) {
        const uniqueUrlId = `gallery-url-${uuidv4()}`;
        itemsMap.set(uniqueUrlId, { id: uniqueUrlId, urlOriginal: url, title: `Imagem da Galeria (URL) ${index + 1}` });
      }
    });
    return Array.from(itemsMap.values());
  });

  const form = useForm<DirectSaleOfferFormData>({
    resolver: zodResolver(directSaleOfferFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      offerType: initialData?.offerType || 'BUY_NOW',
      status: initialData?.status || 'PENDING_APPROVAL',
      price: initialData?.price || undefined,
      minimumOfferPrice: initialData?.minimumOfferPrice || undefined,
      category: initialData?.category || '',
      sellerName: initialData?.sellerName || '',
      locationCity: initialData?.locationCity || '',
      locationState: initialData?.locationState || '',
      imageUrl: initialData?.imageUrl || '',
      imageMediaId: initialData?.imageMediaId || null,
      dataAiHint: initialData?.dataAiHint || '',
      expiresAt: initialData?.expiresAt ? new Date(initialData.expiresAt as string) : undefined,
      galleryImageUrls: initialData?.galleryImageUrls || [],
      mediaItemIds: initialData?.mediaItemIds || [],
    },
  });
  
  const offerType = useWatch({ control: form.control, name: 'offerType' });
  
  React.useEffect(() => {
    form.setValue('galleryImageUrls', selectedMediaForGallery.map(item => item.urlOriginal || '').filter(Boolean));
    form.setValue('mediaItemIds', selectedMediaForGallery.map(item => item.id || '').filter(itemid => !itemid.startsWith('gallery-url-')).filter(Boolean));
  }, [selectedMediaForGallery, form]);
  
  const handleSelectMainImageFromDialog = (selectedItems: Partial<MediaItem>[]) => {
    if (selectedItems.length > 0) {
      const selectedMediaItem = selectedItems[0];
      if (selectedMediaItem?.urlOriginal) {
        setMainImagePreviewUrl(selectedMediaItem.urlOriginal);
        form.setValue('imageUrl', selectedMediaItem.urlOriginal);
        form.setValue('imageMediaId', selectedMediaItem.id || null);
      } else {
        toast({ title: "Seleção Inválida", description: "O item de mídia selecionado não possui uma URL válida.", variant: "destructive" });
      }
    }
  };

  const handleSelectMediaForGallery = (newlySelectedItems: Partial<MediaItem>[]) => {
    setSelectedMediaForGallery(prev => {
      const currentMediaMap = new Map(prev.map(item => [item.id || item.urlOriginal, item]));
      newlySelectedItems.forEach(newItem => {
        if (newItem.id || newItem.urlOriginal) {
          currentMediaMap.set(newItem.id || newItem.urlOriginal!, newItem);
        }
      });
      return Array.from(currentMediaMap.values());
    });
    toast({ title: "Mídia Adicionada à Galeria", description: `${newlySelectedItems.length} item(ns) adicionado(s) à galeria.` });
  };
  
  const handleRemoveFromGallery = (itemIdToRemove?: string) => {
    if (!itemIdToRemove) return;
    setSelectedMediaForGallery(prev => prev.filter(item => (item.id || item.urlOriginal) !== itemIdToRemove));
  };


  async function onSubmit(values: DirectSaleOfferFormData) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(values);
      if (result.success) {
        toast({ title: 'Sucesso!', description: result.message });
        router.push('/admin/direct-sales');
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
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-6 w-6 text-primary"/> {formTitle}</CardTitle>
        <CardDescription>{formDescription}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 p-6 bg-secondary/30">
            <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título da Oferta</FormLabel><FormControl><Input placeholder="Ex: Sofá Retrátil 3 lugares" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Detalhes do item, condição, etc." {...field} rows={4} /></FormControl><FormMessage /></FormItem>)} />
            
            <div className="grid md:grid-cols-2 gap-6">
              <FormField control={form.control} name="offerType" render={({ field }) => (<FormItem><FormLabel>Tipo de Oferta</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl><SelectContent><SelectItem value="BUY_NOW">Comprar Já (Preço Fixo)</SelectItem><SelectItem value="ACCEPTS_PROPOSALS">Aceita Propostas</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger></FormControl><SelectContent><SelectItem value="PENDING_APPROVAL">Pendente Aprovação</SelectItem><SelectItem value="ACTIVE">Ativa</SelectItem><SelectItem value="SOLD">Vendida</SelectItem><SelectItem value="EXPIRED">Expirada</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            </div>

            {offerType === 'BUY_NOW' && (
              <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Preço Fixo (R$)</FormLabel><FormControl><div className="relative"><DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="number" placeholder="1200.00" {...field} value={field.value ?? ''} className="pl-8"/></div></FormControl><FormMessage /></FormItem>)} />
            )}
             {offerType === 'ACCEPTS_PROPOSALS' && (
              <FormField control={form.control} name="minimumOfferPrice" render={({ field }) => (<FormItem><FormLabel>Proposta Mínima (R$ - Opcional)</FormLabel><FormControl><div className="relative"><DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="number" placeholder="900.00" {...field} value={field.value ?? ''} className="pl-8"/></div></FormControl><FormDescription>Valor mínimo sugerido para propostas.</FormDescription><FormMessage /></FormItem>)} />
            )}
            
            <div className="grid md:grid-cols-2 gap-6">
              <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Categoria</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger></FormControl><SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="sellerName" render={({ field }) => (<FormItem><FormLabel>Vendedor</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o vendedor" /></SelectTrigger></FormControl><SelectContent>{sellers.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <FormField control={form.control} name="locationCity" render={({ field }) => (<FormItem><FormLabel>Cidade</FormLabel><FormControl><Input placeholder="São Paulo" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="locationState" render={({ field }) => (<FormItem><FormLabel>Estado (UF)</FormLabel><FormControl><Input placeholder="SP" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            
            <Separator />
            <h3 className="text-md font-semibold text-muted-foreground pt-2">Imagens da Oferta</h3>

            <FormItem>
              <FormLabel>Imagem Principal da Oferta</FormLabel>
              <Card className="mt-2 bg-background">
                <CardContent className="p-4 flex flex-col items-center gap-3">
                  <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden max-w-md mx-auto">
                    {mainImagePreviewUrl ? <Image src={mainImagePreviewUrl} alt="Prévia da Imagem Principal" fill className="object-contain" data-ai-hint="previa imagem principal" /> : <div className="flex flex-col items-center justify-center h-full text-muted-foreground"><ImagePlus className="h-12 w-12 mb-2" /><span>Nenhuma imagem selecionada</span></div>}
                  </div>
                  <Button type="button" variant="outline" onClick={() => setIsMainImageDialogOpen(true)}>
                    <ImagePlus className="mr-2 h-4 w-4" />{mainImagePreviewUrl ? "Alterar Imagem Principal" : "Escolher Imagem Principal"}
                  </Button>
                </CardContent>
              </Card>
              <FormField control={form.control} name="imageUrl" render={({ field }) => (<FormItem className="hidden"><FormControl><Input type="text" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="imageMediaId" render={({ field }) => (<FormItem className="hidden"><FormControl><Input type="text" {...field} /></FormControl></FormItem>)} />
            </FormItem>

            <div className="space-y-2">
              <FormLabel>Galeria de Imagens da Oferta</FormLabel>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 p-2 border rounded-md min-h-[80px] bg-background">
                {selectedMediaForGallery.map((item) => (
                  <div key={item.id || item.urlOriginal} className="relative aspect-square bg-muted rounded overflow-hidden">
                    <Image src={item.urlOriginal || 'https://placehold.co/100x100.png'} alt={item.title || 'Imagem da galeria'} fill className="object-cover" data-ai-hint={item.dataAiHint || "miniatura galeria"} />
                    <Button type="button" size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 opacity-80 hover:opacity-100 p-0" onClick={() => handleRemoveFromGallery(item.id || item.urlOriginal)} title="Remover da galeria">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {selectedMediaForGallery.length < 10 && (
                  <Button type="button" variant="outline" className="aspect-square flex flex-col items-center justify-center text-muted-foreground hover:text-primary h-full" onClick={() => setIsGalleryDialogOpen(true)}>
                    <ImagePlus className="h-6 w-6 mb-1" /><span className="text-xs">Adicionar</span>
                  </Button>
                )}
              </div>
              <FormDescription>Adicione mais imagens para esta oferta. Máximo de 10 imagens.</FormDescription>
            </div>
            
            <Separator />
            <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Data de Expiração (Opcional)</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")} >
                                {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                    </Popover>
                    <FormDescription>Deixe em branco se a oferta não tiver data de expiração.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />

          </CardContent>
          <CardFooter className="flex justify-end gap-2 p-6 border-t">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/direct-sales')} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {submitButtonText}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
     <ChooseMediaDialog
        isOpen={isMainImageDialogOpen}
        onOpenChange={setIsMainImageDialogOpen}
        onMediaSelect={handleSelectMainImageFromDialog}
        allowMultiple={false}
      />
      <ChooseMediaDialog
        isOpen={isGalleryDialogOpen}
        onOpenChange={setIsGalleryDialogOpen}
        onMediaSelect={handleSelectMediaForGallery}
        allowMultiple={true}
      />
    </>
  );
}
