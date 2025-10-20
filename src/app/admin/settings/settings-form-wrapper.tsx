// src/app/admin/settings/settings-form-wrapper.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { platformSettingsFormSchema, type PlatformSettingsFormValues } from './settings-form-schema';
import type { PlatformSettings } from '@/types';
import { getPlatformSettings, updatePlatformSettings } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { Wrench } from 'lucide-react';

interface SettingsFormWrapperProps {
  title: string;
  description: string;
  children: (form: ReturnType<typeof useForm<PlatformSettingsFormValues>>) => React.ReactNode;
}

export default function SettingsFormWrapper({ title, description, children }: SettingsFormWrapperProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);

  const form = useForm<PlatformSettingsFormValues>({
    resolver: zodResolver(platformSettingsFormSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    async function fetchSettings() {
      setIsLoading(true);
      const fetchedSettings = await getPlatformSettings();
      setSettings(fetchedSettings);
      if (fetchedSettings) {
        form.reset({
          ...fetchedSettings,
          themes: fetchedSettings.themes || undefined,
          mapSettings: fetchedSettings.mapSettings || undefined,
          biddingSettings: fetchedSettings.biddingSettings || undefined,
          platformPublicIdMasks: fetchedSettings.platformPublicIdMasks || undefined,
        });
      }
      setIsLoading(false);
    }
    fetchSettings();
  }, [form]);

  const onSubmit = async (data: PlatformSettingsFormValues) => {
    setIsSaving(true);
    const result = await updatePlatformSettings(data);
    if (result.success) {
      toast({ title: 'Sucesso', description: 'Configurações salvas.' });
    } else {
      toast({ title: 'Erro', description: result.message, variant: 'destructive' });
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-28" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Wrench className="h-6 w-6 mr-2 text-primary" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {children(form)}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" /> Salvar Alterações
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
