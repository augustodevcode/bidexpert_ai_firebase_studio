/**
 * @fileoverview Wrapper de formulário para configurações globais da plataforma.
 */
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
import { defaultRadiusValue, defaultThemeTokensDark, defaultThemeTokensLight } from '@/lib/theme-tokens';

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
    defaultValues: {
      siteTitle: 'BidExpert', // Valor padrão obrigatório
      siteTagline: '',
      logoUrl: '',
      logoMediaId: null,
      radiusValue: defaultRadiusValue,
      themeColorsLight: defaultThemeTokensLight,
      themeColorsDark: defaultThemeTokensDark,
      // RealtimeSettings agrupado em objeto
      realtimeSettings: {
        blockchainEnabled: false,
        blockchainNetwork: 'NONE',
        softCloseEnabled: false,
        softCloseMinutes: 5,
        lawyerPortalEnabled: true,
        lawyerMonetizationModel: 'SUBSCRIPTION',
        lawyerSubscriptionPrice: null,
        lawyerPerUsePrice: null,
        lawyerRevenueSharePercent: null,
      },
      mentalTriggerSettings: {
        showDiscountBadge: true,
        showPopularityBadge: true,
        popularityViewThreshold: 500,
        showHotBidBadge: true,
        hotBidThreshold: 10,
        showExclusiveBadge: true,
      },
      sectionBadgeVisibility: {
        searchGrid: {
          showStatusBadge: true,
          showDiscountBadge: true,
          showUrgencyTimer: true,
          showPopularityBadge: true,
          showHotBidBadge: true,
          showExclusiveBadge: true,
        },
      },
      marketingSiteAdsSuperOpportunitiesEnabled: true,
      marketingSiteAdsSuperOpportunitiesScrollIntervalSeconds: 6,
    },
  });

  useEffect(() => {
    async function fetchSettings() {
      setIsLoading(true);
      const fetchedSettings = await getPlatformSettings();
      setSettings(fetchedSettings);
      if (fetchedSettings) {
        form.reset({
          ...fetchedSettings,
          siteTitle: fetchedSettings.siteTitle || 'BidExpert',
          // RealtimeSettings como objeto aninhado
          realtimeSettings: fetchedSettings.realtimeSettings || {
            blockchainEnabled: false,
            blockchainNetwork: 'NONE',
            softCloseEnabled: false,
            softCloseMinutes: 5,
            lawyerPortalEnabled: true,
            lawyerMonetizationModel: 'SUBSCRIPTION',
            lawyerSubscriptionPrice: null,
            lawyerPerUsePrice: null,
            lawyerRevenueSharePercent: null,
          },
          logoMediaId: fetchedSettings.logoMediaId ?? null,
          logoUrl: fetchedSettings.logoUrl || '',
          radiusValue: fetchedSettings.radiusValue || defaultRadiusValue,
          themeColorsLight: fetchedSettings.themeColorsLight ?? defaultThemeTokensLight,
          themeColorsDark: fetchedSettings.themeColorsDark ?? defaultThemeTokensDark,
          mapSettings: fetchedSettings.mapSettings || undefined,
          biddingSettings: fetchedSettings.biddingSettings || undefined,
          platformPublicIdMasks: fetchedSettings.platformPublicIdMasks || undefined,
          mentalTriggerSettings: fetchedSettings.mentalTriggerSettings || {
            showDiscountBadge: true,
            showPopularityBadge: true,
            popularityViewThreshold: 500,
            showHotBidBadge: true,
            hotBidThreshold: 10,
            showExclusiveBadge: true,
          },
          sectionBadgeVisibility: fetchedSettings.sectionBadgeVisibility || {
            searchGrid: {
              showStatusBadge: true,
              showDiscountBadge: true,
              showUrgencyTimer: true,
              showPopularityBadge: true,
              showHotBidBadge: true,
              showExclusiveBadge: true,
            },
          },
          marketingSiteAdsSuperOpportunitiesEnabled: fetchedSettings.marketingSiteAdsSuperOpportunitiesEnabled ?? true,
          marketingSiteAdsSuperOpportunitiesScrollIntervalSeconds: fetchedSettings.marketingSiteAdsSuperOpportunitiesScrollIntervalSeconds ?? 6,
        });
      }
      setIsLoading(false);
    }
    fetchSettings();
  }, [form]);

  const onSubmit = async (data: PlatformSettingsFormValues) => {
    setIsSaving(true);
    try {
      const result = await updatePlatformSettings(data);
      if (result.success) {
        toast({ title: 'Sucesso', description: 'Configurações salvas com sucesso!' });
        // Resets form dirty state após salvar
        form.reset(data);
      } else {
        toast({ title: 'Erro', description: result.message, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message || 'Falha ao salvar configurações.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await form.trigger();
    if (!isValid) {
      const errors = form.formState.errors;
      const errorMessages = Object.entries(errors)
        .map(([key, value]) => `${key}: ${(value as any)?.message || 'Campo inválido'}`)
        .join(', ');
      toast({ 
        title: 'Erro de validação', 
        description: errorMessages || 'Por favor, corrija os campos inválidos.', 
        variant: 'destructive' 
      });
      return;
    }
    form.handleSubmit(onSubmit)();
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
      <form onSubmit={handleFormSubmit}>
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
          <CardFooter className="flex items-center justify-between">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" /> Salvar Alterações
            </Button>
            {form.formState.isDirty && (
              <span className="text-sm text-muted-foreground">Há alterações não salvas</span>
            )}
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
