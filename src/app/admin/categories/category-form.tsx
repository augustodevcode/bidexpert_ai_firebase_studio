
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
import type { LotCategory } from '@/types';
import { Loader2, Save, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface CategoryFormProps {
  initialData?: LotCategory | null;
  onSubmitAction: (data: CategoryFormValues) => Promise<{ success: boolean; message: string; categoryId?: string }>;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
}

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

  return (
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
            
            <FormField
              control={form.control}
              name="coverImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Imagem de Capa (Banner)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://exemplo.com/capa.jpg" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>Esta imagem será usada como banner principal na página da categoria.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dataAiHintCover"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dica para IA (Capa - Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: imoveis cidade, carros leilao" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>Duas palavras para a IA gerar uma imagem de placeholder, se a URL não for fornecida.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Logo da Categoria (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://exemplo.com/logo.png" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>Um ícone ou logo pequeno para representar a categoria em listas.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="megaMenuImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Imagem do Mega Menu (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://exemplo.com/megamenu.jpg" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>Imagem promocional a ser exibida no mega menu de categorias.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
  );
}
