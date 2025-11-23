'use client';

import * as React from 'react';
import { useWatch } from 'react-hook-form';
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
import { assetFormSchema, type AssetFormData } from './asset-form-schema';
import type { Asset, LotCategory, JudicialProcess, Subcategory, SellerProfileInfo, StateInfo, CityInfo } from '@/types';
import { Package, Gavel, Image as ImageIcon, Users, ImagePlus, Trash2 } from 'lucide-react';
import { getSubcategoriesByParentIdAction } from '../subcategories/actions';
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog';
import Image from 'next/image';
import EntitySelector from '@/components/ui/entity-selector';
import AddressGroup from '@/components/address-group';
import AssetSpecificFields from './asset-specific-fields';
import { CrudFormLayout } from '@/components/crud/crud-form-layout';
import { CrudFormActions } from '@/components/crud/crud-form-actions';
import { CrudFormFooter } from '@/components/crud/crud-form-footer';
import { useCrudForm } from '@/hooks/use-crud-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AssetFormV2Props {
  initialData?: Partial<Asset> | null;
  processes: JudicialProcess[];
  categories: LotCategory[];
  sellers: SellerProfileInfo[];
  allStates: StateInfo[];
  allCities: CityInfo[];
  onSubmitAction: (data: AssetFormData) => Promise<{ success: boolean; message: string; assetId?: string }>;
  onSuccess?: (assetId?: string) => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
}

const assetStatusOptions: { value: Asset['status']; label: string }[] = [
    { value: 'CADASTRO', label: 'Em Cadastro' },
    { value: 'DISPONIVEL', label: 'Disponível' },
    { value: 'LOTEADO', label: 'Loteado' },
    { value: 'VENDIDO', label: 'Vendido' },
    { value: 'REMOVIDO', label: 'Removido' },
    { value: 'INATIVADO', label: 'Inativado' },
];

export function AssetFormV2({
  initialData,
  processes,
  categories,
  sellers,
  allStates,
  allCities,
  onSubmitAction,
  onSuccess,
  onCancel,
  title,
  description,
}: AssetFormV2Props) {
  // Guard clauses for required array props
  const safeCategories = categories || [];
  const safeProcesses = processes || [];
  const safeSellers = sellers || [];
  const safeStates = allStates || [];
  const safeCities = allCities || [];

  if (!categories) console.error('AssetFormV2: categories prop is missing or undefined');
  if (!processes) console.error('AssetFormV2: processes prop is missing or undefined');
  if (!sellers) console.error('AssetFormV2: sellers prop is missing or undefined');

  const [availableSubcategories, setAvailableSubcategories] = React.useState<Subcategory[]>([]);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = React.useState(false);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = React.useState(false);
  const [dialogTarget, setDialogTarget] = React.useState<'main' | 'gallery' | null>(null);

  const formTitle = title !== undefined ? title : (initialData ? "Editar Ativo" : "Novo Ativo");
  const formDesc = description !== undefined ? description : "Preencha os dados do bem para disponibilizá-lo em leilões.";

  const wrappedOnSubmit = async (data: AssetFormData) => {
    console.log('CLIENT: onSubmitAction called', data);
    return onSubmitAction(data);
  };

  const { form, handleSubmit, isSubmitting } = useCrudForm<AssetFormData>({
    schema: assetFormSchema,
    defaultValues: initialData ? {
      title: initialData.title || '',
      description: initialData.description || '',
      status: initialData.status || 'CADASTRO',
      categoryId: initialData.categoryId?.toString() || '',
      subcategoryId: initialData.subcategoryId?.toString() || '',
      judicialProcessId: initialData.judicialProcessId?.toString() || '',
      sellerId: initialData.sellerId?.toString() || '',
      evaluationValue: initialData.evaluationValue || null,
      imageUrl: initialData.imageUrl || '',
      imageMediaId: initialData.imageMediaId?.toString() || '',
      galleryImageUrls: (initialData.galleryImageUrls as string[]) || [],
      mediaItemIds: (initialData.mediaItemIds as string[]) || [],
      dataAiHint: initialData.dataAiHint || '',
      address: initialData.address || '',
      locationCity: initialData.locationCity || '',
      locationState: initialData.locationState || '',
      latitude: initialData.latitude || null,
      longitude: initialData.longitude || null,
      ...initialData as any, 
    } : {
      title: '',
      status: 'CADASTRO',
      categoryId: '',
      sellerId: '',
      galleryImageUrls: [],
      mediaItemIds: [],
    },
    onSubmitAction: wrappedOnSubmit,
    onSuccess: (data) => {
        if (onSuccess) onSuccess(data?.assetId);
    },
    successMessage: initialData ? "Ativo atualizado com sucesso!" : "Ativo criado com sucesso!",
  });

  const selectedCategoryId = useWatch({ control: form.control, name: 'categoryId' });
  const selectedCategory = safeCategories.find(c => c.id.toString() === selectedCategoryId);
  console.log('AssetFormV2: selectedCategoryId', selectedCategoryId);
  console.log('AssetFormV2: selectedCategory', selectedCategory);

  // Load subcategories when category changes
  React.useEffect(() => {
    if (selectedCategoryId) {
      setIsLoadingSubcategories(true);
      getSubcategoriesByParentIdAction(selectedCategoryId)
        .then(subs => setAvailableSubcategories(subs))
        .catch(console.error)
        .finally(() => setIsLoadingSubcategories(false));
    } else {
      setAvailableSubcategories([]);
    }
  }, [selectedCategoryId]);

  const handleMediaSelect = (media: any) => {
    if (dialogTarget === 'main') {
      form.setValue('imageUrl', media.url);
      form.setValue('imageMediaId', media.id.toString());
    } else if (dialogTarget === 'gallery') {
      const currentUrls = form.getValues('galleryImageUrls') || [];
      const currentIds = form.getValues('mediaItemIds') || [];
      form.setValue('galleryImageUrls', [...currentUrls, media.url]);
      form.setValue('mediaItemIds', [...currentIds, media.id.toString()]);
    }
    setIsMediaDialogOpen(false);
    setDialogTarget(null);
  };

  return (
    <CrudFormLayout
      title={formTitle}
      description={formDesc}
      actions={
        <CrudFormActions
          isSubmitting={isSubmitting}
          onSave={handleSubmit}
          onCancel={onCancel}
        />
      }
    >
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Basic Info */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Informações Básicas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Título do Bem</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Apartamento 2 quartos..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descrição Detalhada</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Descreva o bem em detalhes..." className="min-h-[120px]" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="categoryId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Categoria</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {safeCategories.map((cat) => (
                                                        <SelectItem key={cat.id.toString()} value={cat.id.toString()}>
                                                            {cat.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="subcategoryId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Subcategoria</FormLabel>
                                            <Select 
                                                onValueChange={field.onChange} 
                                                defaultValue={field.value || ''}
                                                disabled={!selectedCategoryId || isLoadingSubcategories}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={isLoadingSubcategories ? "Carregando..." : "Selecione..."} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {availableSubcategories.map((sub) => (
                                                        <SelectItem key={sub.id.toString()} value={sub.id.toString()}>
                                                            {sub.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Specific Fields */}
                    {selectedCategory && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Gavel className="h-5 w-5" />
                                    Detalhes Específicos ({selectedCategory.name})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <AssetSpecificFields form={form} categorySlug={selectedCategory.slug || ''} />
                            </CardContent>
                        </Card>
                    )}

                    {/* Location */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Localização
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AddressGroup form={form} allStates={safeStates} allCities={safeCities} />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Status, Relations, Media */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Status e Avaliação</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status Atual</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {assetStatusOptions.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="evaluationValue"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor de Avaliação (R$)</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                placeholder="0,00" 
                                                {...field} 
                                                value={field.value || ''}
                                                onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Vínculos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="sellerId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Comitente/Vendedor</FormLabel>
                                        <EntitySelector
                                            entityName="seller"
                                            options={safeSellers.map(s => ({ value: s.id.toString(), label: s.name }))}
                                            value={field.value || ''}
                                            onChange={field.onChange}
                                            placeholder="Selecione o comitente..."
                                            searchPlaceholder="Buscar comitente..."
                                            emptyStateMessage="Nenhum comitente encontrado."
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="judicialProcessId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Processo Judicial (Opcional)</FormLabel>
                                        <EntitySelector
                                            entityName="process"
                                            options={safeProcesses.map(p => ({ value: p.id.toString(), label: p.processNumber }))}
                                            value={field.value || ''}
                                            onChange={field.onChange}
                                            placeholder="Vincular a processo..."
                                            searchPlaceholder="Buscar processo..."
                                            emptyStateMessage="Nenhum processo encontrado."
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" />
                                Imagem Principal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 min-h-[150px] bg-muted/10">
                                {form.watch('imageUrl') ? (
                                    <div className="relative w-full aspect-video">
                                        <Image 
                                            src={form.watch('imageUrl')!} 
                                            alt="Preview" 
                                            fill 
                                            className="object-cover rounded-md"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-6 w-6"
                                            onClick={() => {
                                                form.setValue('imageUrl', '');
                                                form.setValue('imageMediaId', '');
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center space-y-2">
                                        <ImagePlus className="h-8 w-8 mx-auto text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground">Nenhuma imagem selecionada</p>
                                    </div>
                                )}
                            </div>
                            <Button 
                                type="button" 
                                variant="outline" 
                                className="w-full"
                                onClick={() => {
                                    setDialogTarget('main');
                                    setIsMediaDialogOpen(true);
                                }}
                            >
                                Selecionar da Biblioteca
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <CrudFormFooter>
                <CrudFormActions
                    isSubmitting={isSubmitting}
                    onSave={handleSubmit}
                    onCancel={onCancel}
                />
            </CrudFormFooter>
        </form>
      </Form>

      <ChooseMediaDialog 
        isOpen={isMediaDialogOpen} 
        onOpenChange={setIsMediaDialogOpen}
        onMediaSelect={(items) => {
            if (items && items.length > 0) {
                handleMediaSelect(items[0]);
            }
        }}
      />
    </CrudFormLayout>
  );
}
