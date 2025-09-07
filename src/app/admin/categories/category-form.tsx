// src/app/admin/categories/category-form.tsx
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import type { LotCategory, MediaItem } from '@/types';
import { categoryFormSchema, type CategoryFormValues } from './category-form-schema';
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isValidImageUrl } from '@/lib/ui-helpers';


interface CategoryFormProps {
  initialData?: LotCategory | null;
  onSubmitAction: (data: CategoryFormValues) => Promise<any>;
}

type DialogTarget = 'coverImageUrl' | 'megaMenuImageUrl' | 'logoUrl';

const CategoryForm = React.forwardRef<any, CategoryFormProps>(({
  initialData,
  onSubmitAction,
}, ref) => {
  const { toast } = useToast();
  const [isMediaDialogOpen, setIsMediaDialogOpen] = React.useState(false);
  const [dialogTarget, setDialogTarget] = React.useState<DialogTarget | null>(null);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      iconName: initialData?.iconName || '',
      logoUrl: initialData?.logoUrl || '',
      logoMediaId: initialData?.logoMediaId || null,
      dataAiHintIcon: initialData?.dataAiHintIcon || '',
      coverImageUrl: initialData?.coverImageUrl || '',
      coverImageMediaId: initialData?.coverImageMediaId || null,
      dataAiHintCover: initialData?.dataAiHintCover || '',
      megaMenuImageUrl: initialData?.megaMenuImageUrl || '',
      megaMenuImageMediaId: initialData?.megaMenuImageMediaId || null,
      dataAiHintMegaMenu: initialData?.dataAiHintMegaMenu || '',
    },
  });
  
  React.useEffect(() => {
    form.reset({
      name: initialData?.name || '',
      description: initialData?.description || '',
      iconName: initialData?.iconName || '',
      logoUrl: initialData?.logoUrl || '',
      logoMediaId: initialData?.logoMediaId || null,
      dataAiHintIcon: initialData?.dataAiHintIcon || '',
      coverImageUrl: initialData?.coverImageUrl || '',
      coverImageMediaId: initialData?.coverImageMediaId || null,
      dataAiHintCover: initialData?.dataAiHintCover || '',
      megaMenuImageUrl: initialData?.megaMenuImageUrl || '',
      megaMenuImageMediaId: initialData?.megaMenuImageMediaId || null,
      dataAiHintMegaMenu: initialData?.dataAiHintMegaMenu || '',
    });
  }, [initialData, form]);

  React.useImperativeHandle(ref, () => ({
    requestSubmit: form.handleSubmit(onSubmitAction),
  }));

  const coverImageUrlPreview = form.watch('coverImageUrl');
  const megaMenuImageUrlPreview = form.watch('megaMenuImageUrl');
  const logoUrlPreview = form.watch('logoUrl');
  
  const validCoverUrl = isValidImageUrl(coverImageUrlPreview) ? coverImageUrlPreview : null;
  const validMegaMenuUrl = isValidImageUrl(megaMenuImageUrlPreview) ? megaMenuImageUrlPreview : null;
  const validLogoUrl = isValidImageUrl(logoUrlPreview) ? logoUrlPreview : null;

  const openMediaDialog = (target: DialogTarget) => {
    setDialogTarget(target);
    setIsMediaDialogOpen(true);
  };

  const handleMediaSelect = (selectedItems: Partial<MediaItem>[]) => {
    if (selectedItems.length > 0 && dialogTarget) {
      const selectedMediaItem = selectedItems[0];
      if (selectedMediaItem?.urlOriginal) {
        form.setValue(dialogTarget, selectedMediaItem.urlOriginal);
        // @ts-ignore
        form.setValue(`${dialogTarget.replace('Url', '')}MediaId`, selectedMediaItem.id || null);
      } else {
        toast({ title: "Seleção Inválida", description: "O item de mídia selecionado não possui uma URL válida.", variant: "destructive" });
      }
    }
    setIsMediaDialogOpen(false);
  };
  
  const renderImageInput = (
    field: keyof CategoryFormValues,
    label: string,
    description: string,
    previewUrl: string | null | undefined,
    dialogTarget: DialogTarget
  ) => (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden border">
          {previewUrl ? (
            <Image src={previewUrl} alt={`Prévia ${label}`} fill className="object-contain" data-ai-hint="previa imagem categoria" />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <ImageIcon className="h-8 w-8" />
            </div>
          )}
        </div>
        <div className="flex-grow space-y-2">
          <Button type="button" variant="outline" onClick={() => openMediaDialog(dialogTarget)}>
            {previewUrl ? 'Alterar Imagem' : 'Escolher da Biblioteca'}
          </Button>
          <FormField
            control={form.control}
            name={field}
            render={({ field }) => (
                <FormControl>
                    <Input type="text" placeholder="Ou cole a URL aqui" {...field} value={field.value ?? ""} className="text-xs h-8" />
                </FormControl>
            )}
            />
          <FormDescription>{description}</FormDescription>
           <FormMessage />
        </div>
      </div>
    </FormItem>
  );

  return (
    <>
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitAction)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Categoria</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Veículos, Imóveis, Arte" {...field} />
                  </FormControl>
                  <FormDescription>
                    O nome principal da categoria como aparecerá no site.
                  </FormDescription>
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
                    <Textarea
                      placeholder="Uma breve descrição sobre esta categoria de lotes."
                      className="resize-none"
                      {...field}
                      rows={3}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {renderImageInput('logoUrl', 'Logo da Categoria', 'Ícone que representa a categoria, exibido em listas.', validLogoUrl, 'logoUrl')}

            <Separator />
            <div className="space-y-1">
              <h3 className="text-md font-semibold flex items-center gap-2"><ImageIcon className="h-4 w-4 text-muted-foreground" /> Imagens da Categoria</h3>
              <p className="text-sm text-muted-foreground">Forneça URLs para as imagens da categoria. Elas serão usadas em banners e menus.</p>
            </div>
            
            <div className="space-y-6 rounded-md border p-4 bg-background">
              {renderImageInput('coverImageUrl', 'Imagem de Capa (Banner)', 'Esta imagem será usada como banner principal na página da categoria.', validCoverUrl, 'coverImageUrl')}
              <Separator />
              {renderImageInput('megaMenuImageUrl', 'Imagem do Mega Menu', 'Imagem promocional a ser exibida no mega menu.', validMegaMenuUrl, 'megaMenuImageUrl')}
            </div>
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

CategoryForm.displayName = 'CategoryForm';
export default CategoryForm;
