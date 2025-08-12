
// src/app/admin/auctions/auction-form.tsx
'use client';

import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
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
import { useRouter } from 'next/navigation';
import { auctionFormSchema, type AuctionFormValues } from './auction-form-schema';
import type { Auction, AuctionStatus, LotCategory, AuctioneerProfileInfo, SellerProfileInfo, AuctionStage, MediaItem, WizardData, AuctionParticipation, AuctionMethod, AuctionType, StateInfo, CityInfo } from '@/types';
import { Loader2, Save, CalendarIcon, Gavel, Bot, Percent, FileText, PlusCircle, Trash2, Landmark, ClockIcon, Image as ImageIcon, Zap, TrendingDown, HelpCircle, Repeat, MicOff, FileSignature, XCircle, MapPin, HandCoins, Globe, Building, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format, differenceInMilliseconds } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAuctionStatusText } from '@/lib/ui-helpers';
import { Separator } from '@/components/ui/separator';
import AuctionStagesTimeline from '@/components/auction/auction-stages-timeline';
import Image from 'next/image';
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

interface AuctionFormProps {
  formRef?: React.MutableRefObject<any>;
  initialData?: Partial<Auction> | null;
  categories: LotCategory[];
  auctioneers: AuctioneerProfileInfo[];
  sellers: SellerProfileInfo[];
  states?: StateInfo[];
  allCities?: CityInfo[];
  onSubmitAction?: (data: AuctionFormValues) => Promise<{ success: boolean; message: string; auctionId?: string }>;
  formTitle: string;
  formDescription: string;
  submitButtonText?: string;
  isViewMode?: boolean;
  onUpdateSuccess?: () => void;
  onCancelEdit?: () => void;
  isWizardMode?: boolean;
  onWizardDataChange?: (data: Partial<Auction>) => void;
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

const DatePickerWithTime = ({ field, label, disabled = false }: { field: any, label: string, disabled?: boolean }) => (
    <FormItem className="flex flex-col">
    <FormLabel className="text-xs">{label}</FormLabel>
    <Popover>
        <PopoverTrigger asChild>
        <FormControl>
            <Button
            variant={"outline"}
            className={cn("w-full pl-3 text-left font-normal bg-card", !field.value && "text-muted-foreground")}
            disabled={disabled}
            >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {field.value ? format(new Date(field.value), "dd/MM/yy HH:mm", { locale: ptBR }) : <span>Escolha</span>}
            </Button>
        </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
        <div className="p-2 border-t">
            <Input type="time" defaultValue={field.value ? format(new Date(field.value), "HH:mm") : "10:00"}
            onChange={(e) => {
                const [hours, minutes] = e.target.value.split(':');
                const newDate = field.value ? new Date(field.value) : new Date();
                newDate.setHours(Number(hours), Number(minutes));
                field.onChange(newDate);
            }} />
        </div>
        </PopoverContent>
    </Popover>
    <FormMessage />
    </FormItem>
);

export default function AuctionForm({
  formRef,
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
  onWizardDataChange
}: AuctionFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = React.useState(false);
  
  const [categories, setCategories] = React.useState(initialCategories);
  const [auctioneers, setAuctioneers] = React.useState(initialAuctioneers);
  const [sellers, setSellers] = React.useState(initialSellers);
  const [states, setStates] = React.useState(initialStates);
  const [allCities, setAllCities] = React.useState(initialAllCities);

  const [isFetchingCategories, setIsFetchingCategories] = React.useState(false);
  const [isFetchingAuctioneers, setIsFetchingAuctioneers] = React.useState(false);
  const [isFetchingSellers, setIsFetchingSellers] = React.useState(false);
  const [isFetchingStates, setIsFetchingStates] = React.useState(false);
  const [isFetchingCities, setIsFetchingCities] = React.useState(false);

  const [syncStages, setSyncStages] = React.useState(true);
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
      onlineUrl: initialData?.onlineUrl || 'https://',
      address: initialData?.address || '',
      cityId: initialData?.cityId || undefined,
      stateId: initialData?.stateId || undefined,
      zipCode: initialData?.zipCode || '',
      auctioneerId: initialData?.auctioneerId || '',
      sellerId: initialData?.sellerId || '',
      categoryId: initialData?.categoryId || '',
      imageUrl: initialData?.imageUrl || 'https://',
      imageMediaId: initialData?.imageMediaId || null,
      documentsUrl: initialData?.documentsUrl || 'https://',
      evaluationReportUrl: initialData?.evaluationReportUrl || 'https://',
      auctionCertificateUrl: initialData?.auctionCertificateUrl || 'https://',
      sellingBranch: initialData?.sellingBranch || '',
      automaticBiddingEnabled: initialData?.automaticBiddingEnabled || false,
      allowInstallmentBids: initialData?.allowInstallmentBids === false ? false : true,
      silentBiddingEnabled: initialData?.silentBiddingEnabled || false,
      allowMultipleBidsPerUser: initialData?.allowMultipleBidsPerUser === false ? false : true,
      softCloseEnabled: initialData?.softCloseEnabled || false,
      softCloseMinutes: initialData?.softCloseMinutes || 2,
      estimatedRevenue: initialData?.estimatedRevenue || undefined,
      isFeaturedOnMarketplace: initialData?.isFeaturedOnMarketplace || false,
      marketplaceAnnouncementTitle: initialData?.marketplaceAnnouncementTitle || '',
      auctionStages: initialData?.auctionStages?.map(stage => ({ ...stage, startDate: new Date(stage.startDate as Date), endDate: new Date(stage.endDate as Date) })) || [{ name: '1ª Praça', startDate: new Date(), endDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), initialPrice: null }],
      decrementAmount: initialData?.decrementAmount || undefined,
      decrementIntervalSeconds: initialData?.decrementIntervalSeconds || undefined,
      floorPrice: initialData?.floorPrice || undefined,
      autoRelistSettings: initialData?.autoRelistSettings || { enableAutoRelist: false, recurringAutoRelist: false, relistIfWinnerNotPaid: false, relistIfWinnerNotPaidAfterHours: 2, relistIfNoBids: false, relistIfNoBidsAfterHours: 2, relistDurationInHours: 150 }
    },
  });
  
  const { fields, append, remove, update } = useFieldArray({ control: form.control, name: "auctionStages" });
  const watchedParticipation = useWatch({ control: form.control, name: 'participation' });
  const watchedAuctionMethod = useWatch({ control: form.control, name: 'auctionMethod' });
  const watchedStages = useWatch({ control: form.control, name: 'auctionStages' });
  const softCloseEnabled = useWatch({ control: form.control, name: 'softCloseEnabled' });
  const selectedStateId = useWatch({ control: form.control, name: 'stateId' });
  
  const filteredCities = useMemo(() => {
    if (!selectedStateId) return [];
    return allCities.filter(city => city.stateId === selectedStateId);
  }, [selectedStateId, allCities]);


  React.useImperativeHandle(formRef, () => form);
  
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

  useEffect(() => {
    if (!syncStages) return;
    watchedStages?.forEach((stage, index) => {
      if (index > 0) {
        const prevStage = watchedStages?.[index - 1];
        if (prevStage?.endDate && stage.startDate?.getTime() !== prevStage.endDate.getTime()) {
           const newStartDate = new Date(prevStage.endDate);
           const currentDuration = stage.endDate && stage.startDate ? differenceInMilliseconds(new Date(stage.endDate), new Date(stage.startDate)) : 7 * 24 * 60 * 60 * 1000;
           const newEndDate = new Date(newStartDate.getTime() + currentDuration);
           form.setValue(`auctionStages.${index}.startDate`, newStartDate, { shouldDirty: true });
           form.setValue(`auctionStages.${index}.endDate`, newEndDate, { shouldDirty: true });
        }
      }
    });
  }, [watchedStages, syncStages, form]);

  const handleRefetch = React.useCallback(async (entity: 'categories' | 'auctioneers' | 'sellers' | 'states' | 'cities') => {
    if (entity === 'categories') { setIsFetchingCategories(true); const data = await refetchCategories(); setCategories(data); setIsFetchingCategories(false); }
    if (entity === 'auctioneers') { setIsFetchingAuctioneers(true); const data = await refetchAuctioneers(); setAuctioneers(data); setIsFetchingAuctioneers(false); }
    if (entity === 'sellers') { setIsFetchingSellers(true); const data = await refetchSellers(); setSellers(data); setIsFetchingSellers(false); }
    if (entity === 'states') { setIsFetchingStates(true); const data = await refetchStates(); setStates(data); setIsFetchingStates(false); }
    if (entity === 'cities') { setIsFetchingCities(true); const data = await refetchCities(); setAllCities(data); setIsFetchingCities(false); }
  }, []);
  
  useEffect(() => {
    if (!initialStates || initialStates.length === 0) handleRefetch('states');
    if (!initialAllCities || initialAllCities.length === 0) handleRefetch('cities');
  }, [initialStates, initialAllCities, handleRefetch]);

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
      toast({ title: 'Erro Inesperado', description: 'Ocorreu um erro.', variant: 'destructive' });
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
        const foundState = states.find(s => s.uf === result.data.uf);
        if (foundState) {
            form.setValue('stateId', foundState.id);
            // After setting state, city needs to be found within the now-filtered list.
            const citiesOfState = allCities.filter(c => c.stateId === foundState.id);
            const foundCity = citiesOfState.find(c => c.name.toLowerCase() === result.data.localidade.toLowerCase());
            if (foundCity) {
                form.setValue('cityId', foundCity.id);
            } else {
                toast({ title: 'Cidade não encontrada', description: `A cidade "${result.data.localidade}" não foi encontrada no estado de ${foundState.name}. Cadastre-a primeiro.`, variant: 'default' });
                form.setValue('cityId', '');
            }
        } else {
             toast({ title: 'Estado não encontrado', description: `O estado com UF "${result.data.uf}" não foi encontrado. Cadastre-o primeiro.`, variant: 'default' });
             form.setValue('stateId', '');
             form.setValue('cityId', '');
        }
    } else {
        toast({ title: 'CEP não encontrado', description: result.message, variant: 'destructive'});
    }
    setIsCepLoading(false);
  }

  const handleCancelClick = () => {
    if (onCancelEdit) onCancelEdit();
    else router.back();
  };
  
  const accordionItems = [
    { value: "geral", title: "Informações Gerais", content: (
        <div className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título do Leilão</FormLabel><FormControl><Input placeholder="Ex: Leilão de Imóveis da Empresa X" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição (Opcional)</FormLabel><FormControl><Textarea placeholder="Detalhes sobre o leilão, informações importantes, etc." {...field} value={field.value ?? ""} rows={4} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status do Leilão</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger></FormControl><SelectContent>{auctionStatusOptions.map(option => <SelectItem key={option.value} value={option.value!}>{option.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="categoryId" render={({ field }) => (<FormItem><FormLabel>Categoria Principal</FormLabel><EntitySelector value={field.value} onChange={field.onChange} options={categories.map(c => ({ value: c.id, label: c.name }))} placeholder="Selecione a categoria" searchPlaceholder="Buscar categoria..." emptyStateMessage="Nenhuma categoria encontrada." createNewUrl="/admin/categories/new" editUrlPrefix="/admin/categories" onRefetch={() => handleRefetch('categories')} isFetching={isFetchingCategories} disabled={isViewMode} /><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="auctioneerId" render={({ field }) => (<FormItem><FormLabel>Leiloeiro Responsável</FormLabel><EntitySelector value={field.value} onChange={field.onChange} options={auctioneers.map(a => ({ value: a.id, label: a.name }))} placeholder="Selecione o leiloeiro" searchPlaceholder="Buscar leiloeiro..." emptyStateMessage="Nenhum leiloeiro encontrado." createNewUrl="/admin/auctioneers/new" editUrlPrefix="/admin/auctioneers" onRefetch={() => handleRefetch('auctioneers')} isFetching={isFetchingAuctioneers} disabled={isViewMode} /><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="sellerId" render={({ field }) => (<FormItem><FormLabel>Comitente/Vendedor Principal</FormLabel><EntitySelector value={field.value} onChange={field.onChange} options={sellers.map(s => ({ value: s.id, label: s.name }))} placeholder="Selecione o comitente" searchPlaceholder="Buscar comitente..." emptyStateMessage="Nenhum comitente encontrado." createNewUrl="/admin/sellers/new" editUrlPrefix="/admin/sellers" onRefetch={() => handleRefetch('sellers')} isFetching={isFetchingSellers} disabled={isViewMode} /><FormMessage /></FormItem>)} />
        </div>
    )},
    { value: "participacao", title: "Modalidade, Método e Local", content: (
        <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
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
                    <FormField control={form.control} name="zipCode" render={({ field }) => (<FormItem><FormLabel>CEP</FormLabel><div className="flex gap-2"><FormControl><Input placeholder="00000-000" {...field} value={field.value ?? ''} onChange={(e) => { field.onChange(e); if (e.target.value.replace(/\D/g, '').length === 8) { handleCepLookup(e.target.value); }}}/></FormControl><Button type="button" variant="secondary" onClick={() => handleCepLookup(form.getValues('zipCode') || '')} disabled={isCepLoading}>{isCepLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Buscar'}</Button></div><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Endereço</FormLabel><FormControl><Input placeholder="Rua Exemplo, 123" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="stateId" render={({ field }) => (<FormItem><FormLabel>Estado</FormLabel><EntitySelector value={field.value} onChange={field.onChange} options={states.map(s => ({ value: s.id, label: s.uf }))} placeholder="Selecione o estado" searchPlaceholder="Buscar..." onRefetch={() => handleRefetch('states')} isFetching={isFetchingStates} /><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="cityId" render={({ field }) => (<FormItem><FormLabel>Cidade</FormLabel><EntitySelector value={field.value} onChange={field.onChange} options={filteredCities.map(c => ({ value: c.id, label: c.name }))} placeholder={!selectedStateId ? "Selecione um estado" : "Selecione a cidade"} searchPlaceholder="Buscar..." onRefetch={() => handleRefetch('cities')} isFetching={isFetchingCities} disabled={!selectedStateId} /><FormMessage /></FormItem>)} />
                    </div>
                </div>
            )}
        </div>
    )},
    { value: "datas", title: "Datas e Prazos", content: (
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="flex flex-wrap gap-4 justify-between items-center"><h3 className="text-md font-semibold text-muted-foreground flex items-center gap-2"><ClockIcon className="h-4 w-4" />Praças / Etapas do Leilão</h3><div className="flex items-center space-x-2"><Label htmlFor="sync-stages-main" className="text-xs font-normal">Sincronizar Etapas</Label><Switch id="sync-stages-main" checked={syncStages} onCheckedChange={setSyncStages} disabled={isViewMode} /></div></div>
                {fields.map((field, index) => (
                <Card key={field.id} className="p-3 bg-background">
                    <div className="flex justify-between items-start mb-2"><h4 className="font-medium">Praça / Etapa {index + 1}</h4>{!isViewMode && fields.length > 1 && (<Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:text-destructive/80 h-7 w-7"><Trash2 className="h-4 w-4" /></Button>)}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                    <FormField control={form.control} name={`auctionStages.${index}.name`} render={({ field: stageField }) => (<FormItem><FormLabel className="text-xs">Nome da Etapa</FormLabel><FormControl><Input placeholder={`Ex: ${index + 1}ª Praça`} {...stageField} /></FormControl><FormMessage /></FormItem>)} />
                    <DatePickerWithTime field={{...form.register(`auctionStages.${index}.startDate`), value: form.getValues(`auctionStages.${index}.startDate`), onChange: (date: Date | undefined) => form.setValue(`auctionStages.${index}.startDate`, date!)}} label="Início" disabled={isViewMode || (syncStages && index > 0)} />
                    <DatePickerWithTime field={{...form.register(`auctionStages.${index}.endDate`), value: form.getValues(`auctionStages.${index}.endDate`), onChange: (date: Date | undefined) => form.setValue(`auctionStages.${index}.endDate`, date!)}} label="Fim" disabled={isViewMode} />
                    </div>
                </Card>
                ))}
                {!isViewMode && (<Button type="button" variant="outline" size="sm" onClick={() => { const lastStage = fields[fields.length - 1]; const lastEndDate = lastStage?.endDate ? new Date(lastStage.endDate) : new Date(); const nextStartDate = syncStages ? lastEndDate : new Date(lastEndDate.getTime() + 60000); const nextEndDate = new Date(nextStartDate.getTime() + 7 * 24 * 60 * 60 * 1000); append({ name: `${fields.length + 1}ª Praça`, startDate: nextStartDate, endDate: nextEndDate, initialPrice: null }) }} className="text-xs mt-2"><PlusCircle className="mr-2 h-3.5 w-3.5" /> Adicionar Praça/Etapa</Button>)}
            </div>
            <AuctionStagesTimeline stages={watchedStages as AuctionStage[]} />
        </div>
    )},
     { value: "opcoes", title: "Opções Avançadas", content: (
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
              />
            )}
        </div>
    )},
  ];

  const defaultAccordionValues = accordionItems.map(item => item.value);

  return (
    <>
      <TooltipProvider>
        <ChooseMediaDialog isOpen={isMediaDialogOpen} onOpenChange={setIsMediaDialogOpen} onMediaSelect={() => {}} allowMultiple={false} />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <fieldset disabled={isViewMode} className="group">
              {isWizardMode ? (
                <div className="p-4">
                  <Accordion type="multiple" defaultValue={defaultAccordionValues} className="w-full">
                    {accordionItems.map(item => (
                      <AccordionItem key={item.value} value={item.value}>
                        <AccordionTrigger>{item.title}</AccordionTrigger>
                        <AccordionContent>{item.content}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ) : (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Gavel className="h-6 w-6 text-primary" /> {formTitle}</CardTitle>
                    <CardDescription>{formDescription}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 bg-secondary/30">
                    <Accordion type="multiple" defaultValue={defaultAccordionValues} className="w-full space-y-4">
                        {accordionItems.map(item => (
                        <AccordionItem key={item.value} value={item.value} className="border bg-background/50 rounded-lg shadow-sm px-4">
                            <AccordionTrigger className="hover:no-underline">{item.title}</AccordionTrigger>
                            <AccordionContent className="pt-4 border-t">
                                {item.content}
                            </AccordionContent>
                        </AccordionItem>
                        ))}
                    </Accordion>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 p-6 border-t">
                      <Button type="button" variant="outline" onClick={handleCancelClick} disabled={isSubmitting}><XCircle className="mr-2 h-4 w-4"/> Cancelar</Button>
                      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} {submitButtonText}</Button>
                  </CardFooter>
                </Card>
              )}
            </fieldset>
          </form>
        </Form>
      </TooltipProvider>
    </>
  );
}
