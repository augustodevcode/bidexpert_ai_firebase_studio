
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
import { Textarea } from '@/components/ui/textarea'; // Importar Textarea

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
      siteTitle: initialData?.siteTitle || 'BidExpert',
      siteTagline: initialData?.siteTagline || 'Leilões Online Especializados',
      galleryImageBasePath: initialData?.galleryImageBasePath || '/media/gallery/',
      themes: initialData?.themes || [],
      platformPublicIdMasks: initialData?.platformPublicIdMasks || {},
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
        router.refresh(); 
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="siteTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título do Site</FormLabel>
              <FormControl>
                <Input placeholder="Ex: BidExpert Leilões" {...field} />
              </FormControl>
              <FormDescription>
                O título principal que aparecerá no cabeçalho e na aba do navegador.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="siteTagline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tagline do Site (Slogan)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Seu parceiro especialista em leilões online." {...field} />
              </FormControl>
              <FormDescription>
                Uma frase curta que descreve o seu site, exibida abaixo do título no cabeçalho.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
        
        {/* Campos de Máscara de ID Público - Futuro */}
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Máscaras de ID Público (Avançado)</CardTitle>
                <CardDescription>Defina prefixos para IDs públicos de diferentes entidades (ex: LEIL- para leilões). Deixe em branco para usar o padrão.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="platformPublicIdMasks.auctions"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Máscara para Leilões</FormLabel>
                            <FormControl><Input placeholder="Ex: LEIL-" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="platformPublicIdMasks.lots"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Máscara para Lotes</FormLabel>
                            <FormControl><Input placeholder="Ex: LOTE-" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 {/* Adicionar mais campos de máscara aqui conforme necessário */}
            </CardContent>
        </Card>


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
