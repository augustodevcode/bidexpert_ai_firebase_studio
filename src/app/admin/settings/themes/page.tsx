// src/app/admin/settings/themes/page.tsx
/**
 * @fileoverview Página de administração para as configurações de Identidade Visual e Tema.
 * Permite que o administrador altere o título do site, slogan, logo e o tema de cores.
 */
'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { platformSettingsFormSchema, type PlatformSettingsFormValues } from '../settings-form-schema';
import type { PlatformSettings, ThemeSettings } from '@/types';
import { getPlatformSettings, updatePlatformSettings } from '../actions';

import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Palette } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Save } from 'lucide-react';


export default function ThemeSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);

  const form = useForm<PlatformSettingsFormValues>({
    resolver: zodResolver(platformSettingsFormSchema),
    defaultValues: {
      siteTitle: '',
      siteTagline: '',
      logoUrl: '',
      themes: {
        colors: {
          light: {
            primary: '',
            background: '',
            accent: '',
          },
          dark: {
            primary: '',
            background: '',
            accent: '',
          }
        }
      }
    }
  });

  useEffect(() => {
    async function fetchSettings() {
      setIsLoading(true);
      const fetchedSettings = await getPlatformSettings();
      setSettings(fetchedSettings);
      if (fetchedSettings) {
        form.reset({
          siteTitle: fetchedSettings.siteTitle || '',
          siteTagline: fetchedSettings.siteTagline || '',
          logoUrl: fetchedSettings.logoUrl || '',
          themes: fetchedSettings.themes || { colors: { light: {}, dark: {} } },
        });
      }
      setIsLoading(false);
    }
    fetchSettings();
  }, [form]);
  
  const onSubmit = async (data: PlatformSettingsFormValues) => {
    setIsSaving(true);
    const result = await updatePlatformSettings({
        siteTitle: data.siteTitle,
        siteTagline: data.siteTagline,
        logoUrl: data.logoUrl,
        themes: data.themes,
    });
    if (result.success) {
      toast({ title: 'Sucesso', description: 'Configurações de tema salvas.' });
    } else {
      toast({ title: 'Erro', description: result.message, variant: 'destructive' });
    }
    setIsSaving(false);
  };
  
  if (isLoading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Palette className="h-6 w-6 mr-2 text-primary" />
              Identidade Visual e Temas
            </CardTitle>
            <CardDescription>
              Personalize o título, slogan e as cores da plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
                <h3 className="font-semibold text-lg text-foreground">Identidade</h3>
                <FormField control={form.control} name="siteTitle" render={({ field }) => (<FormItem><FormLabel>Título do Site</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="siteTagline" render={({ field }) => (<FormItem><FormLabel>Slogan</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="logoUrl" render={({ field }) => (<FormItem><FormLabel>URL do Logo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-foreground">Cores do Tema</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 p-4 border rounded-md">
                    <h4 className="font-medium">Tema Claro</h4>
                    <FormField control={form.control} name="themes.colors.light.primary" render={({ field }) => (<FormItem><FormLabel>Primária</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="themes.colors.light.background" render={({ field }) => (<FormItem><FormLabel>Fundo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="themes.colors.light.accent" render={({ field }) => (<FormItem><FormLabel>Destaque</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                 <div className="space-y-3 p-4 border rounded-md">
                    <h4 className="font-medium">Tema Escuro</h4>
                    <FormField control={form.control} name="themes.colors.dark.primary" render={({ field }) => (<FormItem><FormLabel>Primária</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="themes.colors.dark.background" render={({ field }) => (<FormItem><FormLabel>Fundo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="themes.colors.dark.accent" render={({ field }) => (<FormItem><FormLabel>Destaque</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
               </div>
            </div>
          </CardContent>
          <CardFooter>
             <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                <Save className="mr-2 h-4 w-4" /> Salvar Configurações de Tema
             </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
