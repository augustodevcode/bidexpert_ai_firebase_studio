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
import type { PlatformSettings, MapSettings, SearchPaginationType, StorageProviderType, VariableIncrementRule, BiddingSettings, PaymentGatewaySettings, NotificationSettings } from '@/types';
import { Loader2, Save, Palette, Fingerprint, Wrench, MapPin as MapIcon, Search as SearchIconLucide, Clock as ClockIcon, Link2, Database, PlusCircle, Trash2, ArrowUpDown, Zap, Rows, RefreshCw, AlertTriangle, CreditCard, Bell } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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

const defaultNotificationSettings: NotificationSettings = {
  notifyOnNewAuction: true,
  notifyOnFeaturedLot: false,
  notifyOnAuctionEndingSoon: true,
  notifyOnPromotions: true,
};

export default function SettingsForm({ initialData, activeSection, onUpdateSuccess }: SettingsFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<PlatformSettingsFormValues>({
    resolver: zodResolver(platformSettingsFormSchema),
    defaultValues: {
      siteTitle: initialData?.siteTitle || 'BidExpert',
      siteTagline: initialData?.siteTagline || 'Sua plataforma de leilões online.',
      galleryImageBasePath: initialData?.galleryImageBasePath || '/uploads/media/',
      storageProvider: initialData?.storageProvider || 'local',
      firebaseStorageBucket: initialData?.firebaseStorageBucket || '',
      activeThemeName: initialData?.activeThemeName || null,
      themesJson: initialData?.themes || [],
      platformPublicIdMasksJson: initialData?.platformPublicIdMasks || { auctions: '', lots: '', auctioneers: '', sellers: ''},
      mapSettingsJson: initialData?.mapSettings || defaultMapSettings,
      biddingSettingsJson: initialData?.biddingSettings || defaultBiddingSettings,
      paymentGatewaySettingsJson: initialData?.paymentGatewaySettings || defaultPaymentGatewaySettings,
      notificationSettingsJson: initialData?.notificationSettings || defaultNotificationSettings,
      searchPaginationType: initialData?.searchPaginationType || 'loadMore',
      searchItemsPerPage: initialData?.searchItemsPerPage || 12,
      searchLoadMoreCount: initialData?.searchLoadMoreCount || 12,
      showCountdownOnLotDetail: initialData?.showCountdownOnLotDetail === undefined ? true : initialData.showCountdownOnLotDetail,
      showCountdownOnCards: initialData?.showCountdownOnCards === undefined ? true : initialData.showCountdownOnCards,
      showRelatedLotsOnLotDetail: initialData?.showRelatedLotsOnLotDetail === undefined ? true : initialData.showRelatedLotsOnLotDetail,
      relatedLotsCount: initialData?.relatedLotsCount || 5,
      variableIncrementTableJson: initialData?.variableIncrementTable || [],
      defaultListItemsPerPage: initialData?.defaultListItemsPerPage || 10,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variableIncrementTableJson',
  });
  
  React.useEffect(() => {
    form.reset({
        ...initialData,
        mapSettingsJson: initialData?.mapSettings || defaultMapSettings,
        biddingSettingsJson: initialData?.biddingSettings || defaultBiddingSettings,
        paymentGatewaySettingsJson: initialData?.paymentGatewaySettings || defaultPaymentGatewaySettings,
        notificationSettingsJson: initialData?.notificationSettings || defaultNotificationSettings,
        themesJson: initialData?.themes || [],
        variableIncrementTableJson: initialData?.variableIncrementTable || [],
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
        
        {activeSection === 'general' && (
             <section className="space-y-6">
                 <FormField control={form.control} name="platformPublicIdMasksJson.auctions" render={({ field }) => (<FormItem><FormLabel>Máscara de ID (Leilões)</FormLabel><FormControl><Input placeholder="LEIL-" {...field} value={field.value ?? ""} /></FormControl><FormDescription>Prefixo para os IDs públicos de leilões.</FormDescription><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="platformPublicIdMasksJson.lots" render={({ field }) => (<FormItem><FormLabel>Máscara de ID (Lotes)</FormLabel><FormControl><Input placeholder="LOTE-" {...field} value={field.value ?? ""} /></FormControl><FormDescription>Prefixo para os IDs públicos de lotes.</FormDescription><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="platformPublicIdMasksJson.auctioneers" render={({ field }) => (<FormItem><FormLabel>Máscara de ID (Leiloeiros)</FormLabel><FormControl><Input placeholder="LEILOE-" {...field} value={field.value ?? ""} /></FormControl><FormDescription>Prefixo para os IDs públicos de leiloeiros.</FormDescription><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="platformPublicIdMasksJson.sellers" render={({ field }) => (<FormItem><FormLabel>Máscara de ID (Comitentes)</FormLabel><FormControl><Input placeholder="COMI-" {...field} value={field.value ?? ""} /></FormControl><FormDescription>Prefixo para os IDs públicos de comitentes.</FormDescription><FormMessage /></FormItem>)} />
             </section>
        )}
        
        {activeSection === 'storage' && (
             <section className="space-y-6">
                <FormField control={form.control} name="storageProvider" render={({ field }) => (<FormItem><FormLabel>Provedor de Armazenamento</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="local">Local</SelectItem><SelectItem value="firebase">Firebase Storage</SelectItem></SelectContent></Select><FormDescription>Onde os arquivos de mídia (imagens, documentos) serão salvos.</FormDescription><FormMessage /></FormItem>)} />
                {watchedStorageProvider === 'firebase' && (
                     <FormField control={form.control} name="firebaseStorageBucket" render={({ field }) => (<FormItem><FormLabel>Firebase Storage Bucket</FormLabel><FormControl><Input placeholder="seu-projeto.appspot.com" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                )}
                 <FormField control={form.control} name="galleryImageBasePath" render={({ field }) => (<FormItem><FormLabel>Caminho Base das Imagens (Local)</FormLabel><FormControl><Input placeholder="/uploads/media/" {...field} value={field.value ?? ""} /></FormControl><FormDescription>Caminho público para acessar as imagens salvas localmente.</FormDescription><FormMessage /></FormItem>)} />
             </section>
        )}
        
        {activeSection === 'appearance' && (
             <section className="space-y-6">
                <FormField control={form.control} name="showCountdownOnCards" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel>Contagem Regressiva nos Cards</FormLabel><FormDescription>Exibir o cronômetro de contagem regressiva nos cards de leilão/lote.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
                <FormField control={form.control} name="showRelatedLotsOnLotDetail" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel>Exibir Lotes Relacionados</FormLabel><FormDescription>Mostrar uma seção de &quot;Outros Lotes do Leilão&quot; na página de detalhes do lote.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
                {form.watch('showRelatedLotsOnLotDetail') && (
                    <FormField control={form.control} name="relatedLotsCount" render={({ field }) => (<FormItem><FormLabel>Nº de Lotes Relacionados</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                )}
             </section>
        )}
        
        {activeSection === 'listDisplay' && (
             <section className="space-y-6">
                <FormField control={form.control} name="defaultListItemsPerPage" render={({ field }) => (<FormItem><FormLabel>Itens por Página (Padrão)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Número padrão de itens a serem exibidos nas tabelas do painel de administração.</FormDescription><FormMessage /></FormItem>)} />
             </section>
        )}

        {activeSection === 'bidding' && (
             <section className="space-y-6">
                 <FormField control={form.control} name="biddingSettingsJson.instantBiddingEnabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel>Habilitar Lances Instantâneos</FormLabel><FormDescription>Permitir que os lances sejam processados instantaneamente sem confirmação.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="biddingSettingsJson.biddingInfoCheckIntervalSeconds" render={({ field }) => (<FormItem><FormLabel>Intervalo de Atualização (Segundos)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Intervalo em segundos para verificar novas informações de lances.</FormDescription><FormMessage /></FormItem>)} />
             </section>
        )}
        
        {activeSection === 'variableIncrements' && (
             <section className="space-y-6">
                 <div className="space-y-2">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-2 p-2 border rounded-md">
                            <FormField control={form.control} name={`variableIncrementTableJson.${index}.from`} render={({ field: fromField }) => (<FormItem className="flex-1"><FormLabel className="text-xs">De (R$)</FormLabel><FormControl><Input type="number" {...fromField} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name={`variableIncrementTableJson.${index}.to`} render={({ field: toField }) => (<FormItem className="flex-1"><FormLabel className="text-xs">Até (R$)</FormLabel><FormControl><Input type="number" placeholder="em diante" {...toField} value={toField.value ?? ''} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name={`variableIncrementTableJson.${index}.increment`} render={({ field: incField }) => (<FormItem className="flex-1"><FormLabel className="text-xs">Incremento (R$)</FormLabel><FormControl><Input type="number" {...incField} /></FormControl></FormItem>)} />
                            <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="h-9 w-9 flex-shrink-0"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    ))}
                 </div>
                 <Button type="button" variant="outline" size="sm" onClick={() => append({ from: 0, to: null, increment: 0 })}><PlusCircle className="mr-2 h-4 w-4"/>Adicionar Faixa</Button>
             </section>
        )}
        
        {activeSection === 'payments' && (
          <section className="space-y-6">
            <FormField control={form.control} name="paymentGatewaySettingsJson.defaultGateway" render={({ field }) => (<FormItem><FormLabel>Gateway de Pagamento Padrão</FormLabel><Select onValueChange={field.onChange} value={field.value || 'Manual'}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Manual">Processamento Manual</SelectItem><SelectItem value="Pagarme">Pagar.me (Em breve)</SelectItem><SelectItem value="Stripe">Stripe (Em breve)</SelectItem></SelectContent></Select><FormDescription>Selecione o provedor para processar pagamentos.</FormDescription><FormMessage /></FormItem>)} />
             <FormField control={form.control} name="paymentGatewaySettingsJson.platformCommissionPercentage" render={({ field }) => (<FormItem><FormLabel>Comissão da Plataforma (%)</FormLabel><FormControl><Input type="number" step="0.1" {...field} value={field.value ?? 5} /></FormControl><FormDescription>Percentual da comissão retida sobre cada venda.</FormDescription><FormMessage /></FormItem>)} />
             <FormField control={form.control} name="paymentGatewaySettingsJson.gatewayApiKey" render={({ field }) => (<FormItem><FormLabel>Chave de API do Gateway</FormLabel><FormControl><Input placeholder="Sua chave de API" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
             <FormField control={form.control} name="paymentGatewaySettingsJson.gatewayEncryptionKey" render={({ field }) => (<FormItem><FormLabel>Chave de Criptografia do Gateway</FormLabel><FormControl><Input placeholder="Sua chave de criptografia" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
          </section>
        )}
        
        {activeSection === 'notifications' && (
          <section className="space-y-4">
             <FormField control={form.control} name="notificationSettingsJson.notifyOnNewAuction" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel>Novos Leilões</FormLabel><FormDescription>Enviar notificação quando um novo leilão for publicado.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
             <FormField control={form.control} name="notificationSettingsJson.notifyOnFeaturedLot" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel>Lotes em Destaque</FormLabel><FormDescription>Notificar assinantes sobre novos lotes em destaque.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
             <FormField control={form.control} name="notificationSettingsJson.notifyOnAuctionEndingSoon" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel>Leilões Encerrando</FormLabel><FormDescription>Enviar alerta quando leilões estiverem próximos do fim.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
             <FormField control={form.control} name="notificationSettingsJson.notifyOnPromotions" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel>Promoções e Banners</FormLabel><FormDescription>Enviar e-mails sobre promoções especiais da plataforma.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
          </section>
        )}
        
        {activeSection === 'maps' && (
             <section className="space-y-6">
                <FormField control={form.control} name="mapSettingsJson.defaultProvider" render={({ field }) => (<FormItem><FormLabel>Provedor de Mapa Padrão</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="openstreetmap">OpenStreetMap (Gratuito)</SelectItem><SelectItem value="google">Google Maps</SelectItem><SelectItem value="staticImage">Imagem Estática (Fallback)</SelectItem></SelectContent></Select></FormItem>)} />
                <FormField control={form.control} name="mapSettingsJson.googleMapsApiKey" render={({ field }) => (<FormItem><FormLabel>Chave de API - Google Maps</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormDescription>Necessário se &quot;Google Maps&quot; for o provedor selecionado.</FormDescription><FormMessage /></FormItem>)} />
             </section>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Configurações da Seção
          </Button>
        </div>
      </form>
    </Form>
  );
}
