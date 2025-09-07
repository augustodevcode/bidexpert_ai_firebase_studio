// src/components/admin/subcategories/subcategory-form.tsx
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { subcategoryFormSchema, type SubcategoryFormValues } from '@/app/admin/subcategories/subcategory-form-schema';
import type { Subcategory, LotCategory, MediaItem } from '@/types';
import { ImageIcon } from 'lucide-react';
import Image from 'next/image';
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog';
import EntitySelector from '@/components/ui/entity-selector';
import { getLotCategories } from '@/app/admin/categories/actions';
import { isValidImageUrl } from '@/lib/ui-helpers';


interface SubcategoryFormProps {
  initialData?: Subcategory | null;
  parentCategories: LotCategory[];
  onSubmitAction: (data: SubcategoryFormValues) => Promise<{ success: boolean; message: string; subcategoryId?: string }>;
}

const SubcategoryForm = React.forwardRef<any, SubcategoryFormProps>(({
  initialData,
  parentCategories: initialParentCategories,
  onSubmitAction,
}, ref) => {
  const { toast } = useToast();
  const [isMediaDialogOpen, setIsMediaDialogOpen] = React.useState(false);
  const [parentCategories, setParentCategories] = React.useState(initialParentCategories);
  const [isFetchingCategories, setIsFetchingCategories] = React.useState(false);

  const form = useForm<SubcategoryFormValues>({
    resolver: zodResolver(subcategoryFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      parentCategoryId: initialData?.parentCategoryId || '',
      description: initialData?.description || '',
      displayOrder: initialData?.displayOrder || 0,
      iconUrl: initialData?.iconUrl || '',
      dataAiHintIcon: initialData?.dataAiHintIcon || '',
      iconMediaId: initialData?.iconMediaId || null,
    },
  });
  
  React.useEffect(() => {
    form.reset({
      name: initialData?.name || '',
      parentCategoryId: initialData?.parentCategoryId || '',
      description: initialData?.description || '',
      displayOrder: initialData?.displayOrder || 0,
      iconUrl: initialData?.iconUrl || '',
      dataAiHintIcon: initialData?.dataAiHintIcon || '',
      iconMediaId: initialData?.iconMediaId || null,
    });
  }, [initialData, form]);

  React.useImperativeHandle(ref, () => ({
    requestSubmit: form.handleSubmit(onSubmitAction),
  }));

  const iconUrlPreview = useWatch({ control: form.control, name: 'iconUrl' });
  const validIconUrl = isValidImageUrl(iconUrlPreview) ? iconUrlPreview : null;
  
  const handleRefetchCategories = React.useCallback(async () => {
    setIsFetchingCategories(true);
    const data = await getLotCategories();
    setParentCategories(data);
    setIsFetchingCategories(false);
  }, []);

  const handleMediaSelect = (selectedItems: Partial<MediaItem>[]) => {
    if (selectedItems.length > 0) {
      const selectedMediaItem = selectedItems[0];
      if (selectedMediaItem?.urlOriginal) {
        form.setValue('iconUrl', selectedMediaItem.urlOriginal);
        form.setValue('iconMediaId', selectedMediaItem.id || null);
      } else {
        toast({ title: "Seleção Inválida", description: "O item de mídia selecionado não possui uma URL válida.", variant: "destructive" });
      }
    }
    setIsMediaDialogOpen(false);
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitAction)} className="space-y-6">
          <FormField
            control={form.control}
            name="parentCategoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria Principal</FormLabel>
                <EntitySelector
                  value={field.value}
                  onChange={field.onChange}
                  options={parentCategories.map(c => ({ value: c.id, label: c.name }))}
                  placeholder="Selecione a categoria principal"
                  searchPlaceholder="Buscar categoria..."
                  emptyStateMessage="Nenhuma categoria encontrada."
                  createNewUrl="/admin/categories/new"
                  editUrlPrefix="/admin/categories"
                  onRefetch={handleRefetchCategories}
                  isFetching={isFetchingCategories}
                />
                <FormDescription>A subcategoria pertencerá a esta categoria principal.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Subcategoria</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Apartamentos, Carros Esportivos" {...field} />
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
                <FormLabel>Descrição (Opcional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Breve descrição da subcategoria." {...field} value={field.value ?? ""} rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="displayOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ordem de Exibição (Opcional)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                </FormControl>
                <FormDescription>Números menores aparecem primeiro. Padrão é 0.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>Ícone da Subcategoria</FormLabel>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden border">
                {validIconUrl ? (
                  <Image src={validIconUrl} alt="Prévia do Ícone" fill className="object-contain" />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="flex-grow space-y-2">
                <Button type="button" variant="outline" onClick={() => setIsMediaDialogOpen(true)}>
                  {validIconUrl ? 'Alterar Ícone' : 'Escolher da Biblioteca'}
                </Button>
                <FormField
                  control={form.control}
                  name="iconUrl"
                  render={({ field }) => (
                      <FormControl>
                          <Input type="url" placeholder="Ou cole a URL aqui" {...field} value={field.value ?? ""} className="text-xs h-8" />
                      </FormControl>
                  )}
                  />
                <FormMessage />
              </div>
            </div>
          </FormItem>
        </form>
      </Form>
      <ChooseMediaDialog
        isOpen={isMediaDialogOpen}
        onOpenChange={setIsMediaDialogOpen}
        onMediaSelect={handleMediaSelect}
        allowMultiple={false}
      />
    </>
  );
});

SubcategoryForm.displayName = 'SubcategoryForm';
export default SubcategoryForm;

