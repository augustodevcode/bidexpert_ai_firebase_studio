// src/app/admin/assets/asset-form.tsx
/**
 * @fileoverview Componente de formulário reutilizável para criar e editar Assets (ativos).
 * Utiliza `react-hook-form` e Zod para gerenciamento de estado e validação.
 * Este formulário foi simplificado para usar um campo de "Propriedades" genérico
 * em vez de campos específicos por categoria.
 */
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
import { assetFormSchema, type AssetFormData } from './asset-form-schema';
import type { Asset, LotCategory, JudicialProcess, Subcategory, MediaItem, SellerProfileInfo, StateInfo, CityInfo } from '@/types';
import { Loader2, Save, Package, Gavel, Image as ImageIcon, Users, Trash2, ImagePlus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { getSubcategoriesByParentIdAction } from '../subcategories/actions';
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog';
import Image from 'next/image';
import EntitySelector from '@/components/ui/entity-selector';
import { getLotCategories } from '../categories/actions';
import { getJudicialProcesses } from '../judicial-processes/actions';
import { getSellers } from '../sellers/actions';
import AddressGroup from '@/components/address-group';

interface AssetFormProps {
  initialData?: Partial<Asset> | null;
  processes: JudicialProcess[];
  categories: LotCategory[];
  sellers: SellerProfileInfo[];
  allStates: StateInfo[];
  allCities: CityInfo[];
  onSubmitAction: (data: AssetFormData) => Promise<{ success: boolean; message: string; assetId?: string }>;
  onSuccess?: (assetId?: string) => void;
  onCancel?: () => void;
}

const assetStatusOptions: { value: Asset['status']; label: string }[] = [
    { value: 'CADASTRO', label: 'Em Cadastro' },
    { value: 'DISPONIVEL', label: 'Disponível' },
    { value: 'LOTEADO', label: 'Loteado' },
    { value: 'VENDIDO', label: 'Vendido' },
    { value: 'REMOVIDO', label: 'Removido' },
    { value: 'INATIVADO', label: 'Inativado' },
];

const AssetForm = React.forwardRef<any, AssetFormProps>(({
  initialData,
  processes: initialProcesses,
  categories: initialCategories,
  sellers: initialSellers,
  allStates: initialStates,
  allCities: initialCities,
  onSubmitAction,
  onSuccess,
  onCancel,
}, ref) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [availableSubcategories, setAvailableSubcategories] = React.useState<Subcategory[]>([]);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = React.useState(false);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = React.useState(false);
  const [dialogTarget, setDialogTarget] = React.useState<'main' | 'gallery' | null>(null);

  const [categories, setCategories] = React.useState(initialCategories);
  const [processes, setProcesses] = React.useState(initialProcesses);
  const [sellers, setSellers] = React.useState(initialSellers);
  
  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetFormSchema),
    mode: 'onChange',
    defaultValues: initialData || {},
  });
  
  React.useImperativeHandle(ref, () => ({
    requestSubmit: form.handleSubmit(onSubmit),
    formState: form.formState,
  }));

  const { formState } = form;

  const selectedCategoryId = useWatch({ control: form.control, name: 'categoryId' });
  const imageUrlPreview = useWatch({ control: form.control, name: 'imageUrl' });
  const galleryUrls = useWatch({ control: form.control, name: 'galleryImageUrls' });
  
  React.useEffect(() => {
    form.reset(initialData || {});
  }, [initialData, form]);

  const handleRefetch = React.useCallback(async (entity: 'categories' | 'processes' | 'sellers') => {
    setIsSubmitting(true);
    if (entity === 'categories') {
      const data = await getLotCategories();
      setCategories(data);
    } else if (entity === 'processes') {
      const data = await getJudicialProcesses();
      setProcesses(data);
    } else if (entity === 'sellers') {
      const data = await getSellers();
      setSellers(data);
    }
    setIsSubmitting(false);
  }, []);

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
        form.setValue('imageUrl', selectedItems[0].urlOriginal, { shouldDirty: true });
        form.setValue('imageMediaId', selectedItems[0].id || null, { shouldDirty: true });
    } else if (dialogTarget === 'gallery') {
        const currentImageUrls = form.getValues('galleryImageUrls') || [];
        const currentMediaIds = form.getValues('mediaItemIds') || [];
        const newImageUrls = selectedItems.map(item => item.urlOriginal).filter(Boolean) as string[];
        const newMediaIds = selectedItems.map(item => item.id).filter(Boolean) as string[];
        
        form.setValue('galleryImageUrls', Array.from(new Set([...currentImageUrls, ...newImageUrls])), { shouldDirty: true });
        form.setValue('mediaItemIds', Array.from(new Set([...currentMediaIds, ...newMediaIds])), { shouldDirty: true });
    }
    setIsMediaDialogOpen(false);
    setDialogTarget(null);
  };
  
  const handleRemoveFromGallery = (urlToRemove: string) => {
      form.setValue('galleryImageUrls', (form.getValues('galleryImageUrls') || []).filter(url => url !== urlToRemove), { shouldDirty: true });
  };


  async function onSubmit(values: AssetFormData) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(values);
      if (result.success) {
        toast({ title: 'Sucesso!', description: result.message });
        if (onSuccess) {
          onSuccess(result.assetId);
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

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} data-ai-id="asset-form">
            <div className="space-y-6">
              <section className="space-y-4">
                <FormField name="title" control={form.control} render={({ field }) => (<FormItem><FormLabel>Título/Nome do Bem<span className='text-destructive'>*</span></FormLabel><FormControl><Input placeholder="Ex: Apartamento 3 quartos, Trator Massey Ferguson" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="description" control={form.control} render={({ field }) => (<FormItem><FormLabel>Descrição Detalhada</FormLabel><FormControl><Textarea placeholder="Descreva todas as características, estado de conservação, etc." {...field} value={field.value ?? ""} rows={5} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="properties" control={form.control} render={({ field }) => (<FormItem><FormLabel>Propriedades Específicas</FormLabel><FormControl><Textarea placeholder="Ex: Placa: XYZ-1234, Ano: 2019, Combustível: Flex, Quartos: 3, Área: 120m²" {...field} value={field.value ?? ""} rows={10} /></FormControl><FormDescription>Adicione aqui todas as características do bem, uma por linha (Ex: "Cor: Azul", "KM: 50.000").</FormDescription><FormMessage /></FormItem>)} />
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField name="status" control={form.control} render={({ field }) => (<FormItem><FormLabel>Status<span className='text-destructive'>*</span></FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger></FormControl><SelectContent>{assetStatusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField name="evaluationValue" control={form.control} render={({ field }) => (<FormItem><FormLabel>Valor de Avaliação (R$)</FormLabel><FormControl><Input type="number" placeholder="150000.00" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="categoryId" render={({ field }) => (<FormItem><FormLabel>Categoria<span className='text-destructive'>*</span></FormLabel><EntitySelector value={field.value} onChange={field.onChange} options={categories.map(c => ({ value: c.id, label: c.name }))} placeholder="Selecione a categoria" searchPlaceholder="Buscar categoria..." emptyStateMessage="Nenhuma categoria encontrada." onRefetch={() => handleRefetch('categories')} isFetching={isSubmitting} entityName="category" /><FormMessage /></FormItem>)} />
                  <FormField name="subcategoryId" control={form.control} render={({ field }) => (<FormItem><FormLabel>Subcategoria (Opcional)</FormLabel><Select onValueChange={field.onChange} value={field.value ?? undefined} disabled={isLoadingSubcategories || availableSubcategories.length === 0}><FormControl><SelectTrigger><SelectValue placeholder={isLoadingSubcategories ? 'Carregando...' : 'Selecione a subcategoria'} /></SelectTrigger></FormControl><SelectContent>{availableSubcategories.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                </div>
              </section>

              <Separator />
              
              <section className="space-y-4">
                <h3 className="text-lg font-semibold text-primary border-b pb-2">Origem / Proprietário</h3>
                <FormField control={form.control} name="judicialProcessId" render={({ field }) => (<FormItem><FormLabel>Processo Judicial (Se aplicável)</FormLabel><EntitySelector value={field.value} onChange={field.onChange} options={processes.map(p => ({ value: p.id, label: p.processNumber }))} placeholder="Vincule a um processo" searchPlaceholder="Buscar processo..." emptyStateMessage="Nenhum processo." onRefetch={() => handleRefetch('processes')} isFetching={isSubmitting} entityName="judicialProcess" /><FormDescription>Para bens de origem judicial.</FormDescription></FormItem>)} />
                <FormField control={form.control} name="sellerId" render={({ field }) => (<FormItem><FormLabel>Comitente/Vendedor<span className='text-destructive'>*</span></FormLabel><EntitySelector value={field.value} onChange={field.onChange} options={sellers.map(s => ({ value: s.id, label: s.name }))} placeholder="Vincule a um comitente" searchPlaceholder="Buscar comitente..." emptyStateMessage="Nenhum comitente." onRefetch={() => handleRefetch('sellers')} isFetching={isSubmitting} entityName="seller" /><FormDescription>Para bens de venda direta, extrajudicial, etc.</FormDescription><FormMessage /></FormItem>)} />
              </section>
              
              <Separator />

              <section className="space-y-4">
                <h3 className="text-lg font-semibold text-primary border-b pb-2">Localização</h3>
                <AddressGroup form={form} allCities={initialCities} allStates={initialStates} />
              </section>

              <Separator />

              <section className="space-y-4">
                <h3 className="text-lg font-semibold text-primary border-b pb-2">Mídia</h3>
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
              </section>

            </div>
             <div className="flex justify-end gap-2 p-6 border-t">
              {onCancel && <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>}
              <Button type="submit" disabled={isSubmitting || !formState.isValid}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {initialData ? "Salvar Alterações" : "Criar Ativo"}
              </Button>
            </div>
          </form>
        </Form>
      <ChooseMediaDialog isOpen={isMediaDialogOpen} onOpenChange={setIsMediaDialogOpen} onMediaSelect={handleMediaSelect} allowMultiple={dialogTarget === 'gallery'} />
    </>
  );
});

AssetForm.displayName = 'AssetForm';
export default AssetForm;

