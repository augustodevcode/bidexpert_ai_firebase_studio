// src/app/admin/direct-sales/direct-sale-form.tsx
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
import { Loader2, Save, ShoppingCart, CalendarIcon, DollarSign, ImagePlus, Trash2, Image as ImageIcon } from 'lucide-react';
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
  const [isMediaDialogOpen, setIsMediaDialogOpen] = React.useState(false);

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
  const imageUrlPreview = useWatch({ control: form.control, name: 'imageUrl' });

  const handleMediaSelect = (selectedItems: Partial<MediaItem>[]) => {
    if (selectedItems.length > 0) {
      const selectedMediaItem = selectedItems[0];
      if (selectedMediaItem?.urlOriginal) {
        form.setValue('imageUrl', selectedMediaItem.urlOriginal);
        form.setValue('imageMediaId', selectedMediaItem.id || null);
      } else {
        toast({ title: "Seleção Inválida", description: "O item de mídia selecionado não possui uma URL válida.", variant: "destructive" });
      }
    }
    setIsMediaDialogOpen(false);
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
            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Detalhes do item, condição, etc." {...field} value={field.value || ''} rows={4} /></FormControl><FormMessage /></FormItem>)} />
            
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
              <FormField control={form.control} name="locationCity" render={({ field }) => (<FormItem><FormLabel>Cidade (Opcional)</FormLabel><FormControl><Input placeholder="São Paulo" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="locationState" render={({ field }) => (<FormItem><FormLabel>Estado (UF) (Opcional)</FormLabel><FormControl><Input placeholder="SP" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            
            <Separator />
            <h3 className="text-md font-semibold text-muted-foreground pt-2">Mídia e Expiração</h3>
            
            <FormItem>
              <FormLabel>Imagem Principal da Oferta</FormLabel>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden border">
                  {imageUrlPreview ? (<Image src={imageUrlPreview} alt="Prévia" fill className="object-contain" />) : (<ImageIcon className="h-8 w-8 text-muted-foreground m-auto"/>)}
                </div>
                <div className="flex-grow space-y-2">
                  <Button type="button" variant="outline" onClick={() => setIsMediaDialogOpen(true)}>
                    {imageUrlPreview ? 'Alterar Imagem' : 'Escolher da Biblioteca'}
                  </Button>
                   <FormField control={form.control} name="imageUrl" render={({ field }) => (<FormControl><Input type="url" placeholder="Ou cole a URL aqui" {...field} value={field.value ?? ""} /></FormControl>)} />
                   <FormMessage />
                </div>
              </div>
            </FormItem>
            
            <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Data de Expiração (Opcional)</FormLabel>
                    <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")} >
                            {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl></PopoverTrigger>
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
        isOpen={isMediaDialogOpen}
        onOpenChange={setIsMediaDialogOpen}
        onMediaSelect={handleMediaSelect}
        allowMultiple={false}
      />
    </>
  );
}
