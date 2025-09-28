// src/app/admin/auctions/auction-form.tsx
/**
 * @fileoverview Componente de formulário reutilizável para criar e editar Leilões.
 * Utiliza `react-hook-form` para gerenciamento de estado e Zod para validação.
 * É um componente complexo que inclui seletores de entidade, campos dinâmicos
 * para diferentes métodos de leilão, e gerenciamento de etapas/praças.
 * É usado tanto na página de edição/criação de leilão quanto no Wizard.
 */
'use client';

import React, { useEffect, useCallback, useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller, useFieldArray, useWatch, type UseFormReturn } from 'react-hook-form';
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
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { auctionFormSchema, type AuctionFormValues } from './auction-form-schema';
import type { Auction, AuctionStatus, LotCategory, AuctioneerProfileInfo, SellerProfileInfo, AuctionStage, MediaItem, WizardData, AuctionParticipation, AuctionMethod, AuctionType, StateInfo, CityInfo, Lot } from '@/types';
import { Loader2, Save, CalendarIcon, Gavel, Bot, Percent, FileText, PlusCircle, Trash2, Landmark, ClockIcon, Image as ImageIcon, Zap, TrendingDown, HelpCircle, Repeat, MicOff, FileSignature, XCircle, MapPin, HandCoins, Globe, Building, TrendingUp, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format, differenceInMilliseconds } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAuctionStatusText, isValidImageUrl } from '@/lib/ui-helpers';
import { Separator } from '@/components/ui/separator';
import AuctionStagesTimeline from '@/components/auction/auction-stages-timeline';
import Image from 'next/image';
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog';
import { Tooltip, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import EntitySelector from '@/components/ui/entity-selector';
import { getAuctioneers as refetchAuctioneers, getSellers as refetchSellers } from './actions';
import { getLotCategories as refetchCategories } from '../categories/actions';
import { getStates as refetchStates } from '../states/actions';
import { getCities as refetchCities } from '../cities/actions';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { consultaCepAction } from '@/lib/actions/cep';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import dynamic from 'next/dynamic';
import { getLots as getLotsAction } from '../lots/actions';


const MapPicker = dynamic(() => import('@/components/map-picker'), {
  loading: () => <div className="h-64 w-full bg-muted animate-pulse rounded-md" />,
  ssr: false,
});


interface AuctionFormProps {
  initialData?: Partial<Auction> | null;
  categories: LotCategory[];
  auctioneers: AuctioneerProfileInfo[];
  sellers: SellerProfileInfo[];
  states?: StateInfo[];
  allCities?: CityInfo[];
  onSubmitAction: (data: AuctionFormValues) => Promise<{ success: boolean; message: string; auctionId?: string }>;
  formTitle: string;
  formDescription: string;
  submitButtonText?: string;
  isViewMode?: boolean;
  onUpdateSuccess?: () => void;
  onCancelEdit?: () => void;
  isWizardMode?: boolean;
  onWizardDataChange?: (data: Partial<Auction>) => void;
  formRef?: React.Ref<any>;
}

const auctionStatusOptions: { value: AuctionStatus; label: string }[] = [
  'RASCUNHO', 'EM_PREPARACAO', 'EM_BREVE', 'ABERTO', 'ABERTO_PARA_LANCES', 'ENCERRADO', 'FINALIZADO', 'CANCELADO', 'SUSPENSO'
].map(status => ({ value: status, label: getAuctionStatusText(status) }));

const auctionTypeOptions: { value: AuctionType, label: string }[] = [
  { value: 'JUDICIAL', label: 'Judicial' },
  { value: 'EXTRAJUDICIAL', label: 'Extrajudicial' },
  { value: 'PARTICULAR', label: 'Particular' },
  { value: 'TOMADA_DE_PRECOS', label: 'Tomada de Preços' },
];

const participationOptions: { value: AuctionParticipation, label: string, description: string }[] = [
    { value: 'ONLINE', label: 'Somente Online', description: 'O leilão ocorre exclusivamente pela internet.' },
    { value: 'PRESENCIAL', label: 'Somente Presencial', description: 'O leilão ocorre em um local físico, sem participação online.' },
    { value: 'HIBRIDO', label: 'Híbrido (Online e Presencial)', description: 'Participantes podem dar lances tanto online quanto no local físico.' },
];

const methodOptions: { value: AuctionMethod, label: string, icon: React.ElementType }[] = [
    { value: 'STANDARD', label: 'Padrão (Inglês)', icon: TrendingUp },
    { value: 'DUTCH', label: 'Holandês (Reverso)', icon: TrendingDown },
    { value: 'SILENT', label: 'Silencioso (Fechado)', icon: MicOff },
];

const accordionItemsData = [
    { value: "geral", title: "Informações Gerais" },
    { value: "participacao", title: "Modalidade, Método e Local" },
    { value: "datas", title: "Datas e Prazos" },
    { value: "midia", title: "Mídia e Documentos" },
    { value: "opcoes", title: "Opções Avançadas" },
];

const DatePickerWithTime = ({ field, label, disabled }: { field: any; label: string; disabled: boolean; }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <FormControl>
          <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")} disabled={disabled}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {field.value ? format(field.value, "PPP HH:mm", { locale: ptBR }) : <span>{label}</span>}
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={disabled} />
        <div className="p-3 border-t border-border">
            <Input
                type="time"
                value={field.value ? format(field.value, 'HH:mm') : ''}
                onChange={(e) => {
                    const time = e.target.value;
                    const [hours, minutes] = time.split(':').map(Number);
                    const newDate = field.value ? new Date(field.value) : new Date();
                    newDate.setHours(hours, minutes);
                    field.onChange(newDate);
                }}
                disabled={disabled}
            />
        </div>
      </PopoverContent>
    </Popover>
  );
};


const AuctionForm = forwardRef<any, AuctionFormProps>(({
  initialData,
  categories: initialCategories,
  auctioneers: initialAuctioneers,
  sellers: initialSellers,
  states: initialStates = [],
  allCities: initialAllCities = [],
  onSubmitAction,
  formTitle,
  formDescription,
  submitButtonText = "Salvar",
  isViewMode = false,
  onUpdateSuccess,
  onCancelEdit,
  isWizardMode = false,
  onWizardDataChange,
  formRef,
}, ref) => {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = React.useState(false);
  
  const [categories, setCategories] = React.useState(initialCategories);
  const [auctioneers, setAuctioneers] = React.useState(initialAuctioneers);
  const [sellers, setSellers] = React.useState(initialSellers);
  const [lots, setLots] = useState<Lot[]>([]);
  
  const [isFetchingCategories, setIsFetchingCategories] = React.useState(false);
  const [isFetchingAuctioneers, setIsFetchingAuctioneers] = React.useState(false);
  const [isFetchingSellers, setIsFetchingSellers] = React.useState(false);
  
  const [isCepLoading, setIsCepLoading] = React.useState(false);
  
  const form = useForm<AuctionFormValues>({
    resolver: zodResolver(auctionFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      status: initialData?.status || 'RASCUNHO',
      auctionType: initialData?.auctionType || 'EXTRAJUDICIAL',
      auctionMethod: initialData?.auctionMethod || 'STANDARD',
      participation: initialData?.participation || 'ONLINE',
      onlineUrl: initialData?.onlineUrl || '',
      address: initialData?.address || '',
      cityId: initialData?.cityId || undefined,
      stateId: initialData?.stateId || undefined,
      zipCode: initialData?.zipCode || '',
      latitude: initialData?.latitude ? Number(initialData.latitude) : undefined,
      longitude: initialData?.longitude ? Number(initialData.longitude) : undefined,
      auctioneerId: initialData?.auctioneerId || '',
      sellerId: initialData?.sellerId || '',
      categoryId: initialData?.categoryId || '',
      imageUrl: initialData?.imageUrl || '',
      imageMediaId: initialData?.imageMediaId || null,
      documentsUrl: initialData?.documentsUrl || '',
      evaluationReportUrl: initialData?.evaluationReportUrl || '',
      auctionCertificateUrl: initialData?.auctionCertificateUrl || '',
      sellingBranch: initialData?.sellingBranch || '',
      automaticBiddingEnabled: initialData?.automaticBiddingEnabled || false,
      allowInstallmentBids: initialData?.allowInstallmentBids === false ? false : true,
      silentBiddingEnabled: initialData?.silentBiddingEnabled || false,
      allowMultipleBidsPerUser: initialData?.allowMultipleBidsPerUser === false ? false : true,
      softCloseEnabled: initialData?.softCloseEnabled || false,
      softCloseMinutes: initialData?.softCloseMinutes || 2,
      estimatedRevenue: initialData?.estimatedRevenue ? Number(initialData.estimatedRevenue) : undefined,
      isFeaturedOnMarketplace: initialData?.isFeaturedOnMarketplace || false,
      marketplaceAnnouncementTitle: initialData?.marketplaceAnnouncementTitle || '',
      auctionStages: initialData?.auctionStages?.map(stage => ({ ...stage, startDate: new Date(stage.startDate as Date), endDate: new Date(stage.endDate as Date) })) || [{ name: '1ª Praça', startDate: new Date(), endDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), initialPrice: null }],
      decrementAmount: initialData?.decrementAmount ? Number(initialData.decrementAmount) : undefined,
      decrementIntervalSeconds: initialData?.decrementIntervalSeconds || undefined,
      floorPrice: initialData?.floorPrice ? Number(initialData.floorPrice) : undefined,
      autoRelistSettings: initialData?.autoRelistSettings || { enableAutoRelist: false, recurringAutoRelist: false, relistIfWinnerNotPaid: false, relistIfWinnerNotPaidAfterHours: 2, relistIfNoBids: false, relistIfNoBidsAfterHours: 2, relistDurationInHours: 150 }
    },
  });
  
  useImperativeHandle(ref, () => ({
    setValue: form.setValue,
    requestSubmit: form.handleSubmit(onSubmit)
  }));
  
  useEffect(() => {
    if (initialData?.id) {
      getLotsAction(initialData.id).then(setLots);
    }
  }, [initialData?.id]);

  const { fields, append, remove, update } = useFieldArray({ control: form.control, name: "auctionStages" });
  const watchedParticipation = useWatch({ control: form.control, name: 'participation' });
  const watchedAuctionMethod = useWatch({ control: form.control, name: 'auctionMethod' });
  const watchedStages = useWatch({ control: form.control, name: 'auctionStages' });
  const softCloseEnabled = useWatch({ control: form.control, name: 'softCloseEnabled' });
  const selectedStateId = useWatch({ control: form.control, name: 'stateId' });
  const watchedLatitude = useWatch({ control: form.control, name: 'latitude' });
  const watchedLongitude = useWatch({ control: form.control, name: 'longitude' });

  const filteredCities = useMemo(() => {
    if (!selectedStateId) return [];
    return initialAllCities.filter(city => city.stateId === selectedStateId);
  }, [selectedStateId, initialAllCities]);
  
   useEffect(() => {
    if (!isWizardMode || !onWizardDataChange) return;
    const subscription = form.watch((value) => {
      const auctioneerDetails = auctioneers.find(a => a.id === value.auctioneerId);
      const sellerDetails = sellers.find(s => s.id === value.sellerId);
      
      const auctionDate = (value.auctionStages && value.auctionStages.length > 0 && value.auctionStages[0].startDate)
        ? value.auctionStages[0].startDate
        : new Date();

      const transformedData: Partial<Auction> = {
        ...(value as Partial<Auction>),
        auctionDate: auctionDate,
        auctioneerName: auctioneerDetails?.name,
        sellerName: sellerDetails?.name,
      };
      
      onWizardDataChange(transformedData);
    });
    return () => subscription.unsubscribe();
  }, [form, onWizardDataChange, isWizardMode, auctioneers, sellers]);


  const handleRefetch = React.useCallback(async (entity: 'categories' | 'auctioneers' | 'sellers' | 'states' | 'cities') => {
    if (entity === 'categories') { setIsFetchingCategories(true); const data = await refetchCategories(); setCategories(data); setIsFetchingCategories(false); }
    if (entity === 'auctioneers') { setIsFetchingAuctioneers(true); const data = await refetchAuctioneers(); setAuctioneers(data); setIsFetchingAuctioneers(false); }
    if (entity === 'sellers') { setIsFetchingSellers(true); const data = await refetchSellers(); setSellers(data); setIsFetchingSellers(false); }
  }, []);

  async function onSubmit(values: AuctionFormValues) {
    if (!onSubmitAction) return;
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(values);
      if (result.success) {
        toast({ title: 'Sucesso!', description: result.message });
        if (onUpdateSuccess) onUpdateSuccess();
        else { router.push('/admin/auctions'); router.refresh(); }
      } else {
        toast({ title: 'Erro', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro Inesperado', description: 'Ocorreu um erro ao processar sua solicitação.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const handleCepLookup = async (cep: string) => {
    if (!cep || cep.replace(/\D/g, '').length !== 8) return;
    setIsCepLoading(true);
    const result = await consultaCepAction(cep);
    if (result.success && result.data) {
        form.setValue('address', result.data.logradouro);
        const foundState = initialStates.find(s => s.uf === result.data.uf);
        if (foundState) {
            form.setValue('stateId', foundState.id);
            const citiesOfState = initialAllCities.filter(c => c.stateId === foundState.id);
            const foundCity = citiesOfState.find(c => c.name.toLowerCase() === result.data.localidade.toLowerCase());
            if (foundCity) {
                form.setValue('cityId', foundCity.id);
            } else {
                toast({ title: 'Cidade não encontrada', description: `A cidade "${result.data.localidade}" não foi encontrada no estado de ${foundState.name}. Cadastre-a primeiro.`, variant: 'default' });
                form.setValue('cityId', '');
            }
        } else {
             toast({ title: 'Estado não encontrado', description: `A UF "${result.data.uf}" não foi encontrada. Cadastre-o primeiro.`, variant: 'default' });
             form.setValue('stateId', '');
             form.setValue('cityId', '');
        }
    } else {
        toast({ title: 'CEP não encontrado', description: result.message, variant: 'destructive'});
    }
    setIsCepLoading(false);
  };

  const handleCancelClick = () => {
    if (onCancelEdit) onCancelEdit();
    else router.back();
  };

  const handleMediaSelect = (selectedItems: Partial<MediaItem>[]) => {
    if (selectedItems.length > 0) {
      const selectedMediaItem = selectedItems[0];
      if (selectedMediaItem?.urlOriginal) {
        form.setValue('imageUrl', selectedMediaItem.urlOriginal);
        form.setValue('imageMediaId', selectedMediaItem.id || null);
      } else {
        toast({ title: "Seleção Inválida", description: "O item de mídia selecionado não possui uma URL válida.", variant: "destructive" });
      }
    }
    setIsMediaDialogOpen(false);
  };
  
    const accordionContent = (section: string) => {
    switch (section) {
        case "geral": return (
            <div className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título do Leilão</FormLabel><FormControl><Input placeholder="Ex: Leilão de Imóveis da Empresa X" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição (Opcional)</FormLabel><FormControl><Textarea placeholder="Detalhes sobre o leilão, informações importantes, etc." {...field} value={field.value ?? ""} rows={4} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status do Leilão</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger></FormControl><SelectContent>{auctionStatusOptions.map(option => <SelectItem key={option.value} value={option.value!}>{option.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="categoryId" render={({ field }) => (<FormItem><FormLabel>Categoria Principal</FormLabel><EntitySelector entityName="category" value={field.value} onChange={field.onChange} options={categories.map(c => ({ value: c.id, label: c.name }))} placeholder="Selecione a categoria" searchPlaceholder="Buscar categoria..." emptyStateMessage="Nenhuma categoria encontrada." createNewUrl="/admin/categories/new" editUrlPrefix="/admin/categories" onRefetch={() => handleRefetch('categories')} isFetching={isFetchingCategories} disabled={isViewMode} /><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="auctioneerId" render={({ field }) => (<FormItem><FormLabel>Leiloeiro Responsável</FormLabel><EntitySelector entityName="auctioneer" value={field.value} onChange={field.onChange} options={auctioneers.map(a => ({ value: a.id, label: a.name }))} placeholder="Selecione o leiloeiro" searchPlaceholder="Buscar leiloeiro..." emptyStateMessage="Nenhum leiloeiro encontrado." createNewUrl="/admin/auctioneers/new" editUrlPrefix="/admin/auctioneers" onRefetch={() => handleRefetch('auctioneers')} isFetching={isFetchingAuctioneers} disabled={isViewMode} /><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="sellerId" render={({ field }) => (<FormItem><FormLabel>Comitente/Vendedor Principal</FormLabel><EntitySelector entityName="seller" value={field.value} onChange={field.onChange} options={sellers.map(s => ({ value: s.id, label: s.name }))} placeholder="Selecione o comitente" searchPlaceholder="Buscar comitente..." emptyStateMessage="Nenhum comitente encontrado" createNewUrl="/admin/sellers/new" editUrlPrefix="/admin/sellers" onRefetch={() => handleRefetch('sellers')} isFetching={isFetchingSellers} disabled={isViewMode} /><FormMessage /></FormItem>)} />
            </div>
        );
        case "participacao": return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="auctionType" render={({ field }) => (<FormItem><FormLabel>Modalidade do Leilão</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione a modalidade" /></SelectTrigger></FormControl><SelectContent>{auctionTypeOptions.map(option => <SelectItem key={option.value} value={option.value!}>{option.label}</SelectItem>)}</SelectContent></Select><FormDescription>Define a natureza jurídica ou comercial.</FormDescription><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="auctionMethod" render={({ field }) => (<FormItem><FormLabel>Método de Leilão</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{methodOptions.map(opt => <SelectItem key={opt.value} value={opt.value}><div className="flex items-center gap-2"><opt.icon className="h-4 w-4"/>{opt.label}</div></SelectItem>)}</SelectContent></Select><FormDescription>Como os lances serão processados.</FormDescription><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="participation" render={({ field }) => (<FormItem><FormLabel>Forma de Participação</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{participationOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select><FormDescription>{participationOptions.find(o => o.value === field.value)?.description}</FormDescription><FormMessage /></FormItem>)} />
                {(watchedParticipation === 'ONLINE' || watchedParticipation === 'HIBRIDO') && (
                    <FormField control={form.control} name="onlineUrl" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Globe className="h-4 w-4"/> URL do Leilão Online</FormLabel><FormControl><Input placeholder="https://auditorio.bidexpert.com/sala/xyz" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                )}
                {(watchedParticipation === 'PRESENCIAL' || watchedParticipation === 'HIBRIDO') && (
                    <div className="space-y-4 p-4 border rounded-md bg-background/50">
                        <h4 className="font-semibold flex items-center gap-2 text-sm"><Building className="h-4 w-4"/> Endereço do Evento Presencial</h4>
                        <FormField control={form.control} name="zipCode" render={({ field }) => (<FormItem><FormLabel>CEP</FormLabel><div className="flex flex-col sm:flex-row gap-2"><FormControl><Input placeholder="00000-000" {...field} value={field.value ?? ''} onChange={(e) => { field.onChange(e); if (e.target.value.replace(/\D/g, '').length === 8) { handleCepLookup(e.target.value); }}}/></FormControl><Button type="button" variant="secondary" onClick={() => handleCepLookup(form.getValues('zipCode') || '')} disabled={isCepLoading} className="w-full sm:w-auto">{isCepLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Buscar'}</Button></div><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Endereço</FormLabel><FormControl><Input placeholder="Rua Exemplo, 123" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="stateId" render={({ field }) => (<FormItem><FormLabel>Estado</FormLabel><EntitySelector entityName="state" value={field.value} onChange={field.onChange} options={initialStates.map(s => ({ value: s.id, label: `${s.name} (${s.uf})` }))} placeholder="Selecione o estado" searchPlaceholder="Buscar..." onRefetch={() => {}} isFetching={false} /><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="cityId" render={({ field }) => (<FormItem><FormLabel>Cidade</FormLabel><EntitySelector entityName="city" value={field.value} onChange={field.onChange} options={filteredCities.map(c => ({ value: c.id, label: c.name }))} placeholder={!selectedStateId ? "Selecione um estado" : "Selecione a cidade"} searchPlaceholder="Buscar..." onRefetch={() => {}} isFetching={false} disabled={!selectedStateId} /><FormMessage /></FormItem>)} />
                        </div>
                         <div className="space-y-2 pt-2">
                            <Label>Localização no Mapa</Label>
                            <p className="text-xs text-muted-foreground">Clique no mapa para definir um marcador preciso ou preencha a latitude e longitude.</p>
                            <MapPicker latitude={watchedLatitude} longitude={watchedLongitude} setValue={form.setValue} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="latitude" render={({ field }) => ( <FormItem><FormLabel>Latitude</FormLabel><FormControl><Input type="number" step="any" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="longitude" render={({ field }) => ( <FormItem><FormLabel>Longitude</FormLabel><FormControl><Input type="number" step="any" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                    </div>
                )}
            </div>
        );
        case "datas": return (
            <div className="space-y-4">
                <div className="space-y-2">
                    <h3 className="text-md font-semibold text-muted-foreground flex items-center gap-2"><ClockIcon className="h-4 w-4" />Praças / Etapas do Leilão</h3>
                    {fields.map((field, index) => (
                    <Card key={field.id} className="p-3 bg-background">
                        <div className="flex justify-between items-start mb-2"><h4 className="font-medium">Praça / Etapa {index + 1}</h4>{!isViewMode && fields.length > 1 && (<Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:text-destructive/80 h-7 w-7"><Trash2 className="h-4 w-4" /></Button>)}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                          <FormField control={form.control} name={`auctionStages.${index}.name`} render={({ field: stageField }) => (<FormItem><FormLabel className="text-xs">Nome da Etapa</FormLabel><FormControl><Input placeholder={`Ex: ${index + 1}ª Praça`} {...stageField} /></FormControl><FormMessage /></FormItem>)} />
                          <DatePickerWithTime field={{...form.register(`auctionStages.${index}.startDate`), value: form.getValues(`auctionStages.${index}.startDate`), onChange: (date: Date | undefined) => form.setValue(`auctionStages.${index}.startDate`, date!)}} label="Início" disabled={isViewMode} />
                          <DatePickerWithTime field={{...form.register(`auctionStages.${index}.endDate`), value: form.getValues(`auctionStages.${index}.endDate`), onChange: (date: Date | undefined) => form.setValue(`auctionStages.${index}.endDate`, date!)}} label="Fim" disabled={isViewMode} />
                          <FormField control={form.control} name={`auctionStages.${index}.initialPrice`} render={({ field: stageField }) => (<FormItem><FormLabel className="text-xs">Lance Inicial (R$)</FormLabel><FormControl><Input type="number" placeholder="1000.00" {...stageField} value={stageField.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                    </Card>
                    ))}
                    {!isViewMode && (<Button type="button" variant="outline" size="sm" onClick={() => { const lastStage = fields[fields.length - 1]; const lastEndDate = lastStage?.endDate ? new Date(lastStage.endDate) : new Date(); const nextStartDate = new Date(lastEndDate.getTime() + 60000); const nextEndDate = new Date(nextStartDate.getTime() + 7 * 24 * 60 * 60 * 1000); append({ name: `${fields.length + 1}ª Praça`, startDate: nextStartDate, endDate: nextEndDate, initialPrice: null }) }} className="text-xs mt-2"><PlusCircle className="mr-2 h-3.5 w-3.5" /> Adicionar Praça/Etapa</Button>)}
                </div>
                <AuctionStagesTimeline stages={watchedStages as AuctionStage[]} />
            </div>
        );
        case "midia":
            const featuredLot = lots.find(l => l.isFeatured);
            return (
                <div className="space-y-4">
                    <FormField control={form.control} name="imageMediaId" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Imagem Principal do Leilão</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || 'custom'}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Selecione a fonte da imagem..." /></SelectTrigger></FormControl>
                              <SelectContent>
                                  <SelectItem value="custom">Imagem Customizada (URL)</SelectItem>
                                  {featuredLot && (<SelectItem value={`INHERIT`}>Herdar do Lote em Destaque: {featuredLot.title}</SelectItem>)}
                              </SelectContent>
                          </Select>
                          <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="documentsUrl" render={({ field }) => (<FormItem><FormLabel>Link para Edital / Documentos</FormLabel><FormControl><Input placeholder="https://..." {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
            );
        case "opcoes": return (
            <div className="space-y-4">
                {watchedAuctionMethod === 'DUTCH' && (
                    <Card className="p-4 bg-background border-amber-500/50"><CardHeader className="p-0 mb-2"><CardTitle className="text-md flex items-center gap-2"><TrendingDown className="text-amber-600"/>Configurações do Leilão Holandês</CardTitle></CardHeader><CardContent className="p-0 space-y-3">
                        <FormField control={form.control} name="decrementAmount" render={({ field }) => (<FormItem><FormLabel className="text-xs">Valor do Decremento (R$)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="decrementIntervalSeconds" render={({ field }) => (<FormItem><FormLabel className="text-xs">Intervalo do Decremento (segundos)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="floorPrice" render={({ field }) => (<FormItem><FormLabel className="text-xs">Preço Mínimo (R$)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                    </CardContent></Card>
                )}
                <FormField control={form.control} name="automaticBiddingEnabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background"><div className="space-y-0.5"><FormLabel>Robô de Lances</FormLabel><FormDescription className="text-xs">Permitir lances automáticos (robô)?</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="allowInstallmentBids" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background"><div className="space-y-0.5"><FormLabel>Lance Parcelado</FormLabel><FormDescription className="text-xs">Permitir lances parcelados?</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="softCloseEnabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background"><div className="space-y-0.5"><FormLabel className="flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" /> Soft-Close</FormLabel><FormDescription className="text-xs">Estender o tempo final com novos lances?</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                {softCloseEnabled && (
                    <FormField
                    control={form.control}
                    name="softCloseMinutes"
                    render={({ field }) => (
                    <FormItem className="pl-4">
                        <FormLabel>Minutos para Soft-Close</FormLabel>
                        <FormControl><Input type="number" {...field} value={field.value ?? 2} onChange={e => field.onChange(parseInt(e.target.value, 10))} className="w-24" /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                )}
            </div>
        );
        default: return null;
    }
  };

  const defaultAccordionValues = accordionItemsData.map(item => item.value);

  return (
    <>
      <TooltipProvider>
        <ChooseMediaDialog isOpen={isMediaDialogOpen} onOpenChange={setIsMediaDialogOpen} onMediaSelect={handleMediaSelect} allowMultiple={false} />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitAction)}>
            <fieldset disabled={isViewMode || isSubmitting} className="group">
              {isWizardMode ? (
                <div className="p-1">
                  <Accordion type="multiple" defaultValue={defaultAccordionValues} className="w-full">
                    {accordionItemsData.map(item => (
                      <AccordionItem key={item.value} value={item.value}>
                        <AccordionTrigger>{item.title}</AccordionTrigger>
                        <AccordionContent>{accordionContent(item.value)}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ) : (
                <Card className="shadow-lg" data-ai-id="admin-auction-form-card">
                  <CardContent className="p-6 bg-secondary/30 group-disabled:bg-background/30 group-disabled:cursor-not-allowed">
                    <Accordion type="multiple" defaultValue={defaultAccordionValues} className="w-full space-y-4">
                        {accordionItemsData.map(item => (
                        <AccordionItem key={item.value} value={item.value} className="border bg-background/50 rounded-lg shadow-sm px-4">
                            <AccordionTrigger className="hover:no-underline">{item.title}</AccordionTrigger>
                            <AccordionContent className="pt-4 border-t">
                                {accordionContent(item.value)}
                            </AccordionContent>
                        </AccordionItem>
                        ))}
                    </Accordion>
                  </CardContent>
                </Card>
              )}
            </fieldset>
          </form>
        </Form>
      </TooltipProvider>
    </>
  );
});

AuctionForm.displayName = "AuctionForm";

export default AuctionForm;

