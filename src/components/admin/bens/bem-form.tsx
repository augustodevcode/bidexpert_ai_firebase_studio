
// src/components/admin/bens/bem-form.tsx
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, useFieldArray } from 'react-hook-form';
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
import { getSubcategoriesByParentIdAction } from '../subcategories/actions';
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  const { fields: amenityFields, append: appendAmenity, remove: removeAmenity } = useFieldArray({
    control: form.control,
    name: 'amenities'
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
  }, [selectedCategoryId, categories, form.setValue, toast]);

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
              <Tabs defaultValue="geral">
                  <TabsList>
                      <TabsTrigger value="geral">Informações Gerais</TabsTrigger>
                      <TabsTrigger value="detalhes" disabled={!selectedCategoryId}>Detalhes Específicos</TabsTrigger>
                      <TabsTrigger value="localizacao">Localização</TabsTrigger>
                      <TabsTrigger value="midia">Mídia</TabsTrigger>
                  </TabsList>

                  <TabsContent value="geral" className="mt-4 space-y-4">
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
                      
                      <Accordion type="single" collapsible defaultValue="item-1">
                        <AccordionItem value="item-1">
                          <AccordionTrigger className="text-md font-medium">Origem / Proprietário</AccordionTrigger>
                          <AccordionContent className="space-y-4 pt-2">
                            <FormField name="judicialProcessId" control={form.control} render={({ field }) => (<FormItem><FormLabel>Processo Judicial (Se aplicável)</FormLabel><Select onValueChange={(value) => field.onChange(value === 'none' ? null : value)} value={field.value ?? 'none'}><FormControl><SelectTrigger><SelectValue placeholder="Vincule a um processo judicial" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">Nenhum</SelectItem>{processes.map(p => <SelectItem key={p.id} value={p.id}>{p.processNumber}</SelectItem>)}</SelectContent></Select><FormDescription>Para bens de origem judicial.</FormDescription><FormMessage /></FormItem>)} />
                            <FormField name="sellerId" control={form.control} render={({ field }) => (<FormItem><FormLabel>Comitente/Vendedor (Se aplicável)</FormLabel><Select onValueChange={(value) => field.onChange(value === 'none' ? null : value)} value={field.value || 'none'}><FormControl><SelectTrigger><SelectValue placeholder="Vincule a um comitente" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">Nenhum</SelectItem>{sellers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select><FormDescription>Para bens de venda direta, extrajudicial, etc.</FormDescription><FormMessage /></FormItem>)} />
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                  </TabsContent>
                  <TabsContent value="detalhes" className="mt-4 space-y-4">
                      {/* Veículos */}
                      {selectedCategory?.slug.includes('veiculo') && (<Accordion type="single" collapsible defaultValue="vehicle-id"><AccordionItem value="vehicle-id"><AccordionTrigger>Identificação</AccordionTrigger><AccordionContent className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3"><FormField control={form.control} name="year" render={({ field }) => (<FormItem><FormLabel>Ano Fab.</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} /><FormField control={form.control} name="modelYear" render={({ field }) => (<FormItem><FormLabel>Ano Mod.</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} /><FormField control={form.control} name="mileage" render={({ field }) => (<FormItem><FormLabel>KM</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} /><FormField control={form.control} name="plate" render={({ field }) => (<FormItem><FormLabel>Placa</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} /></div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3"><FormField control={form.control} name="make" render={({ field }) => (<FormItem><FormLabel>Marca</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} /><FormField control={form.control} name="model" render={({ field }) => (<FormItem><FormLabel>Modelo</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} /><FormField control={form.control} name="color" render={({ field }) => (<FormItem><FormLabel>Cor</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} /></div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3"><FormField control={form.control} name="fuelType" render={({ field }) => (<FormItem><FormLabel>Combustível</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} /><FormField control={form.control} name="transmissionType" render={({ field }) => (<FormItem><FormLabel>Transmissão</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} /><FormField control={form.control} name="hasKey" render={({ field }) => (<FormItem className="flex flex-col pt-2"><FormLabel>Possui Chave?</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} /></div>
                        <FormField control={form.control} name="vin" render={({ field }) => (<FormItem><FormLabel>VIN / Chassi</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                        </AccordionContent></AccordionItem></Accordion>
                      )}
                      {/* Imóveis */}
                      {selectedCategory?.slug.includes('imoveis') && (
                        <Accordion type="single" collapsible defaultValue="real-estate-id"><AccordionItem value="real-estate-id"><AccordionTrigger>Identificação</AccordionTrigger><AccordionContent className="space-y-4 pt-4">
                          <FormField control={form.control} name="propertyRegistrationNumber" render={({ field }) => (<FormItem><FormLabel>Nº Matrícula</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3"><FormField control={form.control} name="bedrooms" render={({ field }) => (<FormItem><FormLabel>Quartos</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} /><FormField control={form.control} name="bathrooms" render={({ field }) => (<FormItem><FormLabel>Banheiros</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} /><FormField control={form.control} name="parkingSpaces" render={({ field }) => (<FormItem><FormLabel>Vagas</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} /><FormField control={form.control} name="area" render={({ field }) => (<FormItem><FormLabel>Área (m²)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} /></div>
                          <FormField control={form.control} name="isOccupied" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Imóvel Ocupado?</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                        </AccordionContent></AccordionItem></Accordion>
                      )}
                  </TabsContent>
                  <TabsContent value="localizacao" className="mt-4 space-y-4">
                      <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Endereço Completo</FormLabel><FormControl><Input placeholder="Rua, Número, Bairro..." {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField control={form.control} name="locationCity" render={({ field }) => (<FormItem><FormLabel>Cidade</FormLabel><FormControl><Input placeholder="São Paulo" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                          <FormField control={form.control} name="locationState" render={({ field }) => (<FormItem><FormLabel>Estado (UF)</FormLabel><FormControl><Input placeholder="SP" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                      </div>
                  </TabsContent>
                  <TabsContent value="midia" className="mt-4 space-y-4">
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
                  </TabsContent>
              </Tabs>
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
