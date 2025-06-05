
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
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { platformSettingsFormSchema, type PlatformSettingsFormValues } from './settings-form-schema';
import type { PlatformSettings } from '@/types';
import { Loader2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

interface SettingsFormProps {
  initialData: PlatformSettings;
}

// A action de submit será importada de './actions'
import { updatePlatformSettings } from './actions';

export default function SettingsForm({ initialData }: SettingsFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<PlatformSettingsFormValues>({
    resolver: zodResolver(platformSettingsFormSchema),
    defaultValues: {
      galleryImageBasePath: initialData?.galleryImageBasePath || '/media/gallery/',
      // Initialize other default values from initialData here
    },
  });

  async function onSubmit(values: PlatformSettingsFormValues) {
    setIsSubmitting(true);
    try {
      const result = await updatePlatformSettings(values);
      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: result.message,
        });
        router.refresh(); // Re-fetch server-side data for the current page
      } else {
        toast({
          title: 'Erro ao Salvar',
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
      console.error("Unexpected error in settings form:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    // O Card envolvente já está em page.tsx, aqui focamos no formulário em si
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="galleryImageBasePath"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Caminho Base para Imagens da Galeria</FormLabel>
              <FormControl>
                <Input placeholder="/uploads/media_gallery/" {...field} />
              </FormControl>
              <FormDescription>
                O caminho no servidor (relativo à pasta pública ou raiz do seu servidor de arquivos estáticos) onde as imagens da galeria serão armazenadas e acessadas. Deve começar e terminar com uma barra "/".
                Exemplo: <code>/media/gallery/</code>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Adicione outros campos de configuração aqui no futuro, por exemplo:
        <FormField
          control={form.control}
          name="siteName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Site</FormLabel>
              <FormControl>
                <Input placeholder="BidExpert Leilões" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        /> 
        */}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Configurações
          </Button>
        </div>
      </form>
    </Form>
  );
}
