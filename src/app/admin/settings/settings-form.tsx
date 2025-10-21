// src/app/admin/settings/settings-form.tsx
/**
 * @fileoverview Este arquivo contém o componente de formulário para as configurações
 * da plataforma. Ele permite a edição de várias configurações globais, organizadas
 * em seções lógicas para facilitar o gerenciamento.
 */
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
import { platformSettingsFormSchema, type PlatformSettingsFormValues } from './settings-form-schema';
import type { PlatformSettings, MapSettings, BiddingSettings, PaymentGatewaySettings, NotificationSettings } from '@/types';
import { Loader2, Save, Palette, Fingerprint, Wrench, MapPin as MapIcon, Search as SearchIconLucide, Clock as ClockIcon, Link2, Database, PlusCircle, Trash2, ArrowUpDown, Zap, Rows, Bell, CreditCard } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { updatePlatformSettings } from './actions';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface SettingsFormProps {
  initialData: PlatformSettings;
  onUpdateSuccess?: () => void;
}

const defaultMapSettings: MapSettings = {
    defaultProvider: 'openstreetmap',
    googleMapsApiKey: '',
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

const defaultNotificationSettings: NotificationSettings = {
  notifyOnNewAuction: true,
  notifyOnFeaturedLot: false,
  notifyOnAuctionEndingSoon: true,
  notifyOnPromotions: true,
};

export default function SettingsForm({ initialData, onUpdateSuccess }: SettingsFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<PlatformSettingsFormValues>({
    resolver: zodResolver(platformSettingsFormSchema),
    mode: 'onChange', // Adicionado para validação em tempo real
    defaultValues: {
      siteTitle: initialData?.siteTitle || 'BidExpert',
      siteTagline: initialData?.siteTagline || 'Sua plataforma de leilões online.',
      logoUrl: initialData?.logoUrl || '',
      crudFormMode: initialData?.crudFormMode || 'modal',
      mapSettings: initialData?.mapSettings || defaultMapSettings,
      biddingSettings: initialData?.biddingSettings || defaultBiddingSettings,
      platformPublicIdMasks: initialData?.platformPublicIdMasks || { auctions: '', lots: ''},
      paymentGatewaySettings: initialData?.paymentGatewaySettings || defaultPaymentGatewaySettings,
      notificationSettings: initialData?.notificationSettings || defaultNotificationSettings,
      themes: initialData?.themes || [],
      variableIncrementTable: initialData?.variableIncrementTable || [],
    },
  });
  
  const { formState } = form; // Get form state

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variableIncrementTable',
  });
  
  React.useEffect(() => {
    form.reset({
        ...initialData,
        crudFormMode: initialData?.crudFormMode || 'modal',
        mapSettings: initialData?.mapSettings || defaultMapSettings,
        biddingSettings: initialData?.biddingSettings || defaultBiddingSettings,
        paymentGatewaySettings: initialData?.paymentGatewaySettings || defaultPaymentGatewaySettings,
        notificationSettings: initialData?.notificationSettings || defaultNotificationSettings,
        themes: initialData?.themes || [],
        variableIncrementTable: initialData?.variableIncrementTable || [],
    });
  }, [initialData, form]);
  
  async function onSubmit(values: PlatformSettingsFormValues) {
    setIsSubmitting(true);
    try {
      const result = await updatePlatformSettings(values);
      if (result.success) {
        toast({ title: 'Sucesso!', description: result.message });
        if (onUpdateSuccess) {
          await onUpdateSuccess();
        }
        form.reset(values); // Re-sync form state after successful submission
      } else {
        toast({ title: 'Erro ao Salvar', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro Inesperado', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
        
        <section className="space-y-6" data-ai-id="settings-section-identity">
            <h3 className="text-lg font-semibold text-primary border-b pb-2 flex items-center gap-2"><Fingerprint />Identidade do Site</h3>
            <FormField control={form.control} name="siteTitle" render={({ field }) => (<FormItem><FormLabel>Título do Site<span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="Ex: BidExpert Leilões" {...field} value={field.value ?? ""} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="siteTagline" render={({ field }) => (<FormItem><FormLabel>Slogan / Tagline</FormLabel><FormControl><Input placeholder="Sua plataforma de leilões" {...field} value={field.value ?? ""} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="logoUrl" render={({ field }) => (<FormItem><FormLabel>URL do Logo</FormLabel><FormControl><Input type="url" {...field} value={field.value ?? ""} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
        </section>

        <Separator />
        
        <section className="space-y-6" data-ai-id="settings-section-general">
             <h3 className="text-lg font-semibold text-primary border-b pb-2 flex items-center gap-2"><Wrench />Configurações Gerais</h3>
             <FormField
                control={form.control}
                name="crudFormMode"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Modo de Edição (Admin)</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col sm:flex-row gap-4"
                        disabled={isSubmitting}
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="modal" />
                          </FormControl>
                          <FormLabel className="font-normal">Modal (Janela)</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="sheet" />
                          </FormControl>
                          <FormLabel className="font-normal">Painel Lateral (Sheet)</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormDescription>
                      Escolha como os formulários de criação/edição serão abertos no painel de administração.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
             <FormField control={form.control} name="platformPublicIdMasks.auctionCodeMask" render={({ field }) => (<FormItem><FormLabel>Máscara de ID (Leilões)</FormLabel><FormControl><Input placeholder="LEIL-" {...field} value={field.value ?? ""} disabled={isSubmitting} /></FormControl><FormDescription>Prefixo para os IDs públicos de leilões.</FormDescription><FormMessage /></FormItem>)} />
             <FormField control={form.control} name="platformPublicIdMasks.lotCodeMask" render={({ field }) => (<FormItem><FormLabel>Máscara de ID (Lotes)</FormLabel><FormControl><Input placeholder="LOTE-" {...field} value={field.value ?? ""} disabled={isSubmitting} /></FormControl><FormDescription>Prefixo para os IDs públicos de lotes.</FormDescription><FormMessage /></FormItem>)} />
        </section>
        
        <Separator />
        
        <section className="space-y-6" data-ai-id="settings-section-bidding">
             <h3 className="text-lg font-semibold text-primary border-b pb-2 flex items-center gap-2"><Zap />Lances e Automação</h3>
             <FormField control={form.control} name="biddingSettings.instantBiddingEnabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel>Habilitar Lances Instantâneos</FormLabel><FormDescription>Permitir que os lances sejam processados instantaneamente sem confirmação.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} /></FormControl></FormItem>)} />
            <FormField control={form.control} name="biddingSettings.biddingInfoCheckIntervalSeconds" render={({ field }) => (<FormItem><FormLabel>Intervalo de Atualização (Segundos)</FormLabel><FormControl><Input type="number" {...field} disabled={isSubmitting} /></FormControl><FormDescription>Intervalo em segundos para verificar novas informações de lances.</FormDescription><FormMessage /></FormItem>)} />
        </section>

        <Separator />
        
        <section className="space-y-6" data-ai-id="settings-section-increment">
             <h3 className="text-lg font-semibold text-primary border-b pb-2 flex items-center gap-2"><ArrowUpDown />Incremento de Lance Variável</h3>
             <div className="space-y-2">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-2 p-2 border rounded-md">
                        <FormField control={form.control} name={`variableIncrementTable.${index}.from`} render={({ field: fromField }) => (<FormItem className="flex-1"><FormLabel className="text-xs">De (R$)</FormLabel><FormControl><Input type="number" {...fromField} disabled={isSubmitting} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name={`variableIncrementTable.${index}.to`} render={({ field: toField }) => (<FormItem className="flex-1"><FormLabel className="text-xs">Até (R$)</FormLabel><FormControl><Input type="number" placeholder="em diante" {...toField} value={toField.value ?? ''} disabled={isSubmitting} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name={`variableIncrementTable.${index}.increment`} render={({ field: incField }) => (<FormItem className="flex-1"><FormLabel className="text-xs">Incremento (R$)</FormLabel><FormControl><Input type="number" {...incField} disabled={isSubmitting} /></FormControl></FormItem>)} />
                        <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="h-9 w-9 flex-shrink-0" disabled={isSubmitting}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                ))}
             </div>
             <Button type="button" variant="outline" size="sm" onClick={() => append({ from: 0, to: null, increment: 0 })} disabled={isSubmitting}><PlusCircle className="mr-2 h-4 w-4"/>Adicionar Faixa</Button>
        </section>

        <Separator />

        <section className="space-y-6" data-ai-id="settings-section-payment">
            <h3 className="text-lg font-semibold text-primary border-b pb-2 flex items-center gap-2"><CreditCard />Pagamentos</h3>
          <FormField control={form.control} name="paymentGatewaySettings.defaultGateway" render={({ field }) => (<FormItem><FormLabel>Gateway de Pagamento Padrão</FormLabel><Select onValueChange={field.onChange} value={field.value || 'Manual'} disabled={isSubmitting}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Manual">Processamento Manual</SelectItem><SelectItem value="Pagarme">Pagar.me (Em breve)</SelectItem><SelectItem value="Stripe">Stripe (Em breve)</SelectItem></SelectContent></Select><FormDescription>Selecione o provedor para processar pagamentos.</FormDescription><FormMessage /></FormItem>)} />
           <FormField control={form.control} name="paymentGatewaySettings.platformCommissionPercentage" render={({ field }) => (<FormItem><FormLabel>Comissão da Plataforma (%)</FormLabel><FormControl><Input type="number" step="0.1" {...field} value={field.value ?? 5} disabled={isSubmitting} /></FormControl><FormDescription>Percentual da comissão retida sobre cada venda.</FormDescription><FormMessage /></FormItem>)} />
        </section>
        
        <Separator />
        
        <section className="space-y-6" data-ai-id="settings-section-notifications">
            <h3 className="text-lg font-semibold text-primary border-b pb-2 flex items-center gap-2"><Bell />Notificações por E-mail</h3>
          <FormField control={form.control} name="notificationSettings.notifyOnNewAuction" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel>Novos Leilões</FormLabel><FormDescription>Enviar notificação quando um novo leilão for publicado.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} /></FormControl></FormItem>)} />
           <FormField control={form.control} name="notificationSettings.notifyOnFeaturedLot" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel>Lotes em Destaque</FormLabel><FormDescription>Notificar assinantes sobre novos lotes em destaque.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} /></FormControl></FormItem>)} />
           <FormField control={form.control} name="notificationSettings.notifyOnAuctionEndingSoon" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel>Leilões Encerrando</FormLabel><FormDescription>Enviar alerta quando leilões estiverem próximos do fim.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} /></FormControl></FormItem>)} />
           <FormField control={form.control} name="notificationSettings.notifyOnPromotions" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel>Promoções e Banners</FormLabel><FormDescription>Enviar e-mails sobre promoções especiais da plataforma.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} /></FormControl></FormItem>)} />
        </section>
        
        <Separator />
        
        <section className="space-y-6" data-ai-id="settings-section-maps">
             <h3 className="text-lg font-semibold text-primary border-b pb-2 flex items-center gap-2"><MapIcon />Configurações de Mapa</h3>
            <FormField control={form.control} name="mapSettings.defaultProvider" render={({ field }) => (<FormItem><FormLabel>Provedor de Mapa Padrão</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="openstreetmap">OpenStreetMap (Gratuito)</SelectItem><SelectItem value="google">Google Maps</SelectItem><SelectItem value="staticImage">Imagem Estática (Fallback)</SelectItem></SelectContent></FormItem>)} />
            <FormField control={form.control} name="mapSettings.googleMapsApiKey" render={({ field }) => (<FormItem><FormLabel>Chave de API - Google Maps</FormLabel><FormControl><Input {...field} value={field.value ?? ''} disabled={isSubmitting} /></FormControl><FormDescription>Necessário se &quot;Google Maps&quot; for o provedor selecionado.</FormDescription><FormMessage /></FormItem>)} />
        </section>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Todas as Configurações
          </Button>
        </div>
      </form>
    </Form>
  );
}
