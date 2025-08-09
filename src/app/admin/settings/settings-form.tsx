
// src/app/admin/settings/settings-form.tsx
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
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
import type { PlatformSettings, MapSettings, SearchPaginationType, StorageProviderType, VariableIncrementRule, BiddingSettings, PaymentGatewaySettings } from '@/types';
import { Loader2, Save, Palette, Fingerprint, Wrench, MapPin as MapIcon, Search as SearchIconLucide, Clock as ClockIcon, Link2, Database, PlusCircle, Trash2, ArrowUpDown, Zap, Rows, RefreshCw, AlertTriangle, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { runFullSeedAction } from './actions';
import { updatePlatformSettings } from './actions';

interface SettingsFormProps {
  initialData: PlatformSettings;
  activeSection: string;
  onUpdateSuccess?: () => void;
}

const defaultMapSettings: MapSettings = {
    defaultProvider: 'openstreetmap',
    googleMapsApiKey: '',
    staticImageMapZoom: 15,
    staticImageMapMarkerColor: 'blue',
};

const defaultBiddingSettings: BiddingSettings = {
  instantBiddingEnabled: true,
  getBidInfoInstantly: true,
  biddingInfoCheckIntervalSeconds: 1,
};

const defaultPaymentGatewaySettings: PaymentGatewaySettings = {
  defaultGateway: 'Manual',
  platformCommissionPercentage: 5,
  gatewayApiKey: '',
  gatewayEncryptionKey: '',
};

export default function SettingsForm({ initialData, activeSection, onUpdateSuccess }: SettingsFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<PlatformSettingsFormValues>({
    resolver: zodResolver(platformSettingsFormSchema),
    defaultValues: {
      siteTitle: initialData?.siteTitle || 'BidExpert',
      siteTagline: initialData?.siteTagline || 'Leilões Online Especializados',
      galleryImageBasePath: initialData?.galleryImageBasePath || '/uploads/media/',
      storageProvider: initialData?.storageProvider || 'local',
      firebaseStorageBucket: initialData?.firebaseStorageBucket || '',
      activeThemeName: initialData?.activeThemeName || null,
      themes: initialData?.themes || [],
      platformPublicIdMasks: initialData?.platformPublicIdMasks || { auctions: '', lots: '', auctioneers: '', sellers: ''},
      mapSettings: initialData?.mapSettings || defaultMapSettings,
      biddingSettings: initialData?.biddingSettings || defaultBiddingSettings,
      paymentGatewaySettings: initialData?.paymentGatewaySettings || defaultPaymentGatewaySettings, // Adicionado
      searchPaginationType: initialData?.searchPaginationType || 'loadMore',
      searchItemsPerPage: initialData?.searchItemsPerPage || 12,
      searchLoadMoreCount: initialData?.searchLoadMoreCount || 12,
      showCountdownOnLotDetail: initialData?.showCountdownOnLotDetail === undefined ? true : initialData.showCountdownOnLotDetail,
      showCountdownOnCards: initialData?.showCountdownOnCards === undefined ? true : initialData.showCountdownOnCards,
      showRelatedLotsOnLotDetail: initialData?.showRelatedLotsOnLotDetail === undefined ? true : initialData.showRelatedLotsOnLotDetail,
      relatedLotsCount: initialData?.relatedLotsCount || 5,
      variableIncrementTable: initialData?.variableIncrementTable || [],
      defaultListItemsPerPage: initialData?.defaultListItemsPerPage || 10,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variableIncrementTable',
  });
  
  React.useEffect(() => {
    form.reset({
        ...initialData,
        mapSettings: initialData?.mapSettings || defaultMapSettings,
        biddingSettings: initialData?.biddingSettings || defaultBiddingSettings,
        paymentGatewaySettings: initialData?.paymentGatewaySettings || defaultPaymentGatewaySettings,
        themes: initialData?.themes || [],
        variableIncrementTable: initialData?.variableIncrementTable || [],
    });
  }, [initialData, form.reset]);
  
  async function onSubmit(values: PlatformSettingsFormValues) {
    setIsSubmitting(true);
    try {
      const result = await updatePlatformSettings(values);
      if (result.success) {
        toast({ title: 'Sucesso!', description: result.message });
        onUpdateSuccess?.();
      } else {
        toast({ title: 'Erro ao Salvar', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro Inesperado', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const watchedStorageProvider = form.watch('storageProvider');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {activeSection === 'identity' && (
            <section className="space-y-6">
                <FormField control={form.control} name="siteTitle" render={({ field }) => (<FormItem><FormLabel>Título do Site</FormLabel><FormControl><Input placeholder="Ex: BidExpert Leilões" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="siteTagline" render={({ field }) => (<FormItem><FormLabel>Tagline do Site</FormLabel><FormControl><Input placeholder="Sua plataforma de leilões" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
            </section>
        )}
        
        {activeSection === 'payments' && (
          <section className="space-y-6">
            <FormField
              control={form.control}
              name="paymentGatewaySettings.defaultGateway"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gateway de Pagamento Padrão</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || 'Manual'}>
                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Manual">Processamento Manual</SelectItem>
                      <SelectItem value="Pagarme">Pagar.me (Em breve)</SelectItem>
                      <SelectItem value="Stripe">Stripe (Em breve)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Selecione o provedor para processar pagamentos.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="paymentGatewaySettings.platformCommissionPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comissão da Plataforma (%)</FormLabel>
                  <FormControl><Input type="number" step="0.1" {...field} value={field.value ?? 5} /></FormControl>
                  <FormDescription>Percentual da comissão retida sobre cada venda.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField control={form.control} name="paymentGatewaySettings.gatewayApiKey" render={({ field }) => (<FormItem><FormLabel>Chave de API do Gateway</FormLabel><FormControl><Input placeholder="Sua chave de API" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
             <FormField control={form.control} name="paymentGatewaySettings.gatewayEncryptionKey" render={({ field }) => (<FormItem><FormLabel>Chave de Criptografia do Gateway</FormLabel><FormControl><Input placeholder="Sua chave de criptografia" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
          </section>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Configurações
          </Button>
        </div>
      </form>
    </Form>
  );
}
