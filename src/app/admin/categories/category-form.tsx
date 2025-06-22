
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { categoryFormSchema, type CategoryFormValues } from './category-form-schema';
import type { LotCategory, MediaItem } from '@/types';
import { Loader2, Save, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog';
import Image from 'next/image';

interface CategoryFormProps {
  initialData?: LotCategory | null;
  onSubmitAction: (data: CategoryFormValues) => Promise<{ success: boolean; message: string; categoryId?: string }>;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
}

type DialogTarget = 'logoUrl' | 'coverImageUrl' | 'megaMenuImageUrl';

export default function CategoryForm({
  initialData,
  onSubmitAction,
  formTitle,
  formDescription,
  submitButtonText,
}: CategoryFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = React.useState(false);
  const [dialogTarget, setDialogTarget] = React.useState<DialogTarget | null>(null);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      logoUrl: initialData?.logoUrl || '',
      dataAiHintLogo: initialData?.dataAiHintLogo || '',
      coverImageUrl: initialData?.coverImageUrl || '',
      dataAiHintCover: initialData?.dataAiHintCover || '',
      megaMenuImageUrl: initialData?.megaMenuImageUrl || '',
      dataAiHintMegaMenu: initialData?.dataAiHintMegaMenu || '',
    },
  });

  const logoUrlPreview = form.watch('logoUrl');
  const coverImageUrlPreview = form.watch('coverImageUrl');
  const megaMenuImageUrlPreview = form.watch('megaMenuImageUrl');

  const openMediaDialog = (target: DialogTarget) => {
    setDialogTarget(target);
    setIsMediaDialogOpen(true);
  };

  const handleMediaSelect = (selectedItems: Partial<MediaItem>[]) => {
    if (selectedItems.length > 0 && dialogTarget) {
      const selectedMediaItem = selectedItems[0];
      if (selectedMediaItem?.urlOriginal) {
        form.setValue(dialogTarget, selectedMediaItem.urlOriginal);
      } else {
        toast({ title: "Seleção Inválida", description: "O item de mídia selecionado não possui uma URL válida.", variant: "destructive" });
      }
    }
  };

  async function onSubmit(values: CategoryFormValues) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(values);
      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: result.message,
        });
        router.push('/admin/categories');
        router.refresh();
      } else {
        toast({
          title: 'Erro',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro Inesperado',
        description: 'Ocorreu um erro ao processar sua solicitação.',
        variant: 'destructive',
      });
      console.error("Unexpected error in category form:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

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
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle>{formTitle}</CardTitle>
        <CardDescription>{formDescription}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
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

            <Separator />
            <div className="space-y-1">
              <h3 className="text-md font-semibold flex items-center gap-2"><ImageIcon className="h-4 w-4 text-muted-foreground" /> Imagens da Categoria</h3>
              <p className="text-sm text-muted-foreground">Forneça URLs para as imagens da categoria. Elas serão usadas em banners e menus.</p>
            </div>
            
            <div className="space-y-6 rounded-md border p-4">
              {renderImageInput('coverImageUrl', 'Imagem de Capa (Banner)', 'Esta imagem será usada como banner principal na página da categoria.', coverImageUrlPreview, 'coverImageUrl')}
              <Separator />
              {renderImageInput('logoUrl', 'Logo da Categoria', 'Um ícone ou logo pequeno para representar a categoria.', logoUrlPreview, 'logoUrl')}
              <Separator />
              {renderImageInput('megaMenuImageUrl', 'Imagem do Mega Menu', 'Imagem promocional a ser exibida no mega menu.', megaMenuImageUrlPreview, 'megaMenuImageUrl')}
            </div>

          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/categories')} disabled={isSubmitting}>
              Cancelar
            </Button>
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
