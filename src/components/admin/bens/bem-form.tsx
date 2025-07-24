
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
import { bemFormSchema, type BemFormData } from './bem-form-schema';
import type { Bem, LotCategory, JudicialProcess, Subcategory, MediaItem, SellerProfileInfo } from '@/types';
import { Loader2, Save, Package, Gavel, Image as ImageIcon, Users, Car, Building, Tractor, PawPrint, ChevronDown, Trash2, ImagePlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { getSubcategoriesByParentIdAction } from '@/app/admin/subcategories/actions';
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface BemFormProps {
  initialData?: Partial<Bem> | null;
  processes: JudicialProcess[];
  categories: LotCategory[];
  sellers: SellerProfileInfo[];
  onSubmitAction: (data: BemFormData) => Promise<{ success: boolean; message: string; bemId?: string }>;
  onSuccess?: (bemId?: string) => void;
  onCancel?: () => void;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
}

const bemStatusOptions: { value: Bem['status']; label: string }[] = [
    { value: 'CADASTRO', label: 'Em Cadastro' },
    { value: 'DISPONIVEL', label: 'Disponível' },
    { value: 'LOTEADO', label: 'Loteado' },
    { value: 'VENDIDO', label: 'Vendido' },
    { value: 'REMOVIDO', label: 'Removido' },
    { value: 'INATIVADO', label: 'Inativado' },
];

export default function BemForm({
  initialData,
  processes,
  categories,
  sellers,
  onSubmitAction,
  onSuccess,
  onCancel,
  formTitle,
  formDescription,
  submitButtonText,
}: BemFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [availableSubcategories, setAvailableSubcategories] = React.useState<Subcategory[]>([]);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = React.useState(false);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = React.useState(false);
  const [dialogTarget, setDialogTarget] = React.useState<'main' | 'gallery' | null>(null);

  const form = useForm<BemFormData>({
    resolver: zodResolver(bemFormSchema),
    defaultValues: {
      ...initialData,
      status: initialData?.status || 'DISPONIVEL',
      categoryId: initialData?.categoryId || '',
      evaluationValue: initialData?.evaluationValue || undefined,
      year: initialData?.year || undefined,
      modelYear: initialData?.modelYear || undefined,
      mileage: initialData?.mileage || undefined,
      area: initialData?.area || undefined,
      bedrooms: initialData?.bedrooms || undefined,
      bathrooms: initialData?.bathrooms || undefined,
      parkingSpaces: initialData?.parkingSpaces || undefined,
      hoursUsed: initialData?.hoursUsed || undefined,
      hasKey: initialData?.hasKey ?? false,
      isOccupied: initialData?.isOccupied ?? false,
      galleryImageUrls: initialData?.galleryImageUrls || [],
      mediaItemIds: initialData?.mediaItemIds || [],
    },
  });

  const selectedCategoryId = useWatch({ control: form.control, name: 'categoryId' });
  const imageUrlPreview = useWatch({ control: form.control, name: 'imageUrl' });
  const galleryUrls = useWatch({ control: form.control, name: 'galleryImageUrls' });

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  React.useEffect(() => {
    const fetchSubcats = async (parentId: string) => {
        setIsLoadingSubcategories(true);
        setAvailableSubcategories([]); 
        try {
            const parentCategory = categories.find(cat => cat.id === parentId);
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
    if (selectedCategoryId) fetchSubcats(selectedCategoryId);
     else { setAvailableSubcategories([]); form.setValue('subcategoryId', undefined); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId, categories]);

  const handleMediaSelect = (selectedItems: Partial<MediaItem>[]) => {
    if (selectedItems.length === 0) return;
    
    if (dialogTarget === 'main' && selectedItems[0]?.urlOriginal) {
        form.setValue('imageUrl', selectedItems[0].urlOriginal);
        form.setValue('imageMediaId', selectedItems[0].id || null);
    } else if (dialogTarget === 'gallery') {
        const currentImageUrls = form.getValues('galleryImageUrls') || [];
        const currentMediaIds = form.getValues('mediaItemIds') || [];
        const newImageUrls = selectedItems.map(item => item.urlOriginal).filter(Boolean) as string[];
        const newMediaIds = selectedItems.map(item => item.id).filter(Boolean) as string[];
        
        form.setValue('galleryImageUrls', Array.from(new Set([...currentImageUrls, ...newImageUrls])));
        form.setValue('mediaItemIds', Array.from(new Set([...currentMediaIds, ...newMediaIds])));
    }
    setIsMediaDialogOpen(false);
    setDialogTarget(null);
  };
  
  const handleRemoveFromGallery = (urlToRemove: string) => {
      form.setValue('galleryImageUrls', (form.getValues('galleryImageUrls') || []).filter(url => url !== urlToRemove));
  };


  async function onSubmit(values: BemFormData) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(values);
      if (result.success) {
        toast({ title: 'Sucesso!', description: result.message });
        if (onSuccess) {
          onSuccess(result.bemId);
        } else {
          router.push('/admin/bens');
          router.refresh();
        }
      } else {
        toast({ title: 'Erro', description: result.message, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Erro Inesperado', description: 'Ocorreu um erro ao processar sua solicitação.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleCancel = () => {
    if (onCancel) {
        onCancel();
    } else {
        router.push('/admin/bens');
    }
  };

  return (
    <>
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-6 w-6 text-primary" /> {formTitle}</CardTitle>
          <CardDescription>{formDescription}</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <Accordion type="multiple" defaultValue={['general', 'images']} className="w-full">
                <AccordionItem value="general">
                  <AccordionTrigger>Informações Gerais</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                      <FormField name="title" control={form.control} render={({ field }) => (<FormItem><FormLabel>Título/Nome do Bem</FormLabel><FormControl><Input placeholder="Ex: Apartamento 3 quartos, Trator Massey Ferguson" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField name="description" control={form.control} render={({ field }) => (<FormItem><FormLabel>Descrição Detalhada</FormLabel><FormControl><Textarea placeholder="Descreva todas as características, estado, etc." {...field} rows={5} /></FormControl><FormMessage /></FormItem>)} />
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField name="status" control={form.control} render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger></FormControl><SelectContent>{bemStatusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField name="evaluationValue" control={form.control} render={({ field }) => (<FormItem><FormLabel>Valor de Avaliação (R$)</FormLabel><FormControl><Input type="number" placeholder="150000.00" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField name="categoryId" control={form.control} render={({ field }) => (<FormItem><FormLabel>Categoria</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger></FormControl><SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField name="subcategoryId" control={form.control} render={({ field }) => (<FormItem><FormLabel>Subcategoria (Opcional)</FormLabel><Select onValueChange={field.onChange} value={field.value ?? undefined} disabled={isLoadingSubcategories || availableSubcategories.length === 0}><FormControl><SelectTrigger><SelectValue placeholder={isLoadingSubcategories ? 'Carregando...' : 'Selecione a subcategoria'} /></SelectTrigger></FormControl><SelectContent>{availableSubcategories.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                      </div>
                      <Accordion type="single" collapsible>
                        <AccordionItem value="item-1">
                          <AccordionTrigger>Origem / Proprietário</AccordionTrigger>
                          <AccordionContent className="space-y-4 pt-2">
                            <FormField name="judicialProcessId" control={form.control} render={({ field }) => (<FormItem><FormLabel>Processo Judicial (Se aplicável)</FormLabel><Select onValueChange={(value) => field.onChange(value === 'none' ? null : value)} value={field.value ?? 'none'}><FormControl><SelectTrigger><SelectValue placeholder="Vincule a um processo judicial" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">Nenhum</SelectItem>{processes.map(p => <SelectItem key={p.id} value={p.id}>{p.processNumber}</SelectItem>)}</SelectContent></Select><FormDescription>Para bens de origem judicial.</FormDescription><FormMessage /></FormItem>)} />
                            <FormField name="sellerId" control={form.control} render={({ field }) => (<FormItem><FormLabel>Comitente/Vendedor (Se aplicável)</FormLabel><Select onValueChange={(value) => field.onChange(value === 'none' ? null : value)} value={field.value || 'none'}><FormControl><SelectTrigger><SelectValue placeholder="Vincule a um comitente" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">Nenhum</SelectItem>{sellers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select><FormDescription>Para bens de venda direta, extrajudicial, etc.</FormDescription><FormMessage /></FormItem>)} />
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="images">
                   <AccordionTrigger>Imagens do Bem</AccordionTrigger>
                   <AccordionContent className="space-y-4 pt-4">
                      <FormItem>
                        <FormLabel>Imagem Principal</FormLabel>
                        <div className="flex items-center gap-4">
                            <div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden border">{imageUrlPreview ? (<Image src={imageUrlPreview} alt="Prévia" fill className="object-contain" />) : (<ImageIcon className="h-8 w-8 text-muted-foreground m-auto"/>)}</div>
                            <div className="space-y-2 flex-grow">
                                <Button type="button" variant="outline" onClick={() => { setDialogTarget('main'); setIsMediaDialogOpen(true); }}>{imageUrlPreview ? 'Alterar Imagem' : 'Escolher da Biblioteca'}</Button>
                                <FormField control={form.control} name="imageUrl" render={({ field }) => (<FormControl><Input placeholder="Ou cole a URL aqui" {...field} value={field.value ?? ""} /></FormControl>)} />
                            </div>
                        </div>
                      </FormItem>
                      <FormItem>
                        <FormLabel>Galeria de Imagens Adicionais</FormLabel>
                        <Button type="button" variant="outline" size="sm" onClick={() => { setDialogTarget('gallery'); setIsMediaDialogOpen(true); }}><ImagePlus className="mr-2 h-4 w-4"/>Adicionar à Galeria</Button>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 p-2 border rounded-md min-h-[80px]">
                            {galleryUrls?.map((url, index) => (
                                <div key={url} className="relative aspect-square bg-muted rounded overflow-hidden">
                                    <Image src={url} alt={`Imagem da galeria ${index+1}`} fill className="object-cover" />
                                    <Button type="button" size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 opacity-80 hover:opacity-100 p-0" onClick={() => handleRemoveFromGallery(url)} title="Remover"><Trash2 className="h-3.5 w-3.5" /></Button>
                                </div>
                            ))}
                        </div>
                      </FormItem>
                   </AccordionContent>
                 </AccordionItem>
                {/* Accordion items for specific category details will go here */}
              </Accordion>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{submitButtonText}</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      <ChooseMediaDialog isOpen={isMediaDialogOpen} onOpenChange={setIsMediaDialogOpen} onMediaSelect={handleMediaSelect} allowMultiple={dialogTarget === 'gallery'} />
    </>
  );
}
