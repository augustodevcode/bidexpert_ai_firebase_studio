// src/app/admin/auctions/auction-form.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, useWatch, FormProvider } from 'react-hook-form';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

import { auctionFormSchema, type AuctionFormValues } from './auction-form-schema';
import type { Auction, LotCategory, AuctioneerProfileInfo, SellerProfileInfo, JudicialProcess, StateInfo, CityInfo, MediaItem, PlatformSettings, AuctionStage } from '@/types';
import { cn } from '@/lib/utils';
import { Info, Users, Landmark, Map, Gavel, FileText as FileTextIcon, ImageIcon, Settings, DollarSign, Repeat, Clock, PlusCircle, Trash2, TrendingDown, Loader2, Save } from 'lucide-react';
import EntitySelector from '@/components/ui/entity-selector';
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog';
import { getAuctioneers } from '@/app/admin/auctioneers/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { getStates } from '@/app/admin/states/actions';
import { getJudicialProcesses } from '@/app/admin/judicial-processes/actions';
import Image from 'next/image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import AuctionStagesForm from '@/components/auction/auction-stages-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getPlatformSettings } from '../settings/actions';
import { addDays } from 'date-fns';
import { getMediaItems } from '@/app/admin/media/actions';
import { isValidImageUrl } from '@/lib/ui-helpers';
import { getCities } from '../cities/actions';
import AddressGroup from '@/components/address-group';
import { getLotCategories } from '../categories/actions';
import { ChangeHistoryTab } from '@/components/audit/change-history-tab';

const auctionStatusOptions = [
  'RASCUNHO',
  'EM_PREPARACAO',
  'EM_BREVE',
  'ABERTO',
  'ABERTO_PARA_LANCES',
  'ENCERRADO',
  'FINALIZADO',
  'CANCELADO',
  'SUSPENSO',
];
const auctionTypeOptions = ['JUDICIAL', 'EXTRAJUDICIAL', 'PARTICULAR', 'TOMADA_DE_PRECOS'];
const auctionParticipationOptions = ['ONLINE', 'PRESENCIAL', 'HIBRIDO'];
const auctionMethodOptions = ['STANDARD', 'DUTCH', 'SILENT'];

interface AuctionFormProps {
  initialData?: Partial<Auction> | null;
  auctioneers: AuctioneerProfileInfo[];
  sellers: SellerProfileInfo[];
  states: StateInfo[];
  allCities: CityInfo[];
  judicialProcesses?: JudicialProcess[];
  categories: LotCategory[];
  onSubmitAction: (data: Partial<AuctionFormValues>) => Promise<any>;
  formTitle: string;
  formDescription: string;
  submitButtonText?: string;
  isWizardMode?: boolean;
  onWizardDataChange?: (data: Partial<AuctionFormValues>) => void;
  formRef?: React.Ref<any>;
  defaultAuctionId?: string;
  onSuccessCallback?: () => void;
  onAddNewEntity?: (entity: 'auctioneer' | 'seller' | 'judicialProcess' | 'category') => void;
}

// Placeholder refetch functions – real implementations can be injected later
const handleRefetchCategories = async () => {};
const handleRefetchAuctioneers = async () => {};
const handleRefetchSellers = async () => {};
const handleRefetchProcesses = async () => {};

const renderAccordionContent = (
  section: string,
  form: any,
  initialCategories: any[],
  initialAuctioneers: any[],
  initialSellers: any[],
  initialJudicialProcesses: any[],
  allCities: any[],
  initialStates: any[],
  isSubmitting: boolean,
  watchedAuctionMethod: string,
  watchedImageMediaId: string | null,
  displayImageUrl: string | null | undefined,
  setIsMediaDialogOpen: React.Dispatch<React.SetStateAction<boolean>>,
  handleAddStageWithDefaults: () => void,
  remove: (index: number) => void
) => {
  switch (section) {
    case 'geral':
      return (
        <div className="space-y-4">
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Título do Leilão<span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input placeholder="Ex: Leilão de Veículos da Empresa X" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Descreva os detalhes gerais do leilão, regras de visitação, etc." {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel>Status<span className="text-destructive">*</span></FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {auctionStatusOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="categoryId" render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria Principal<span className="text-destructive">*</span></FormLabel>
                <EntitySelector
                  value={field.value}
                  onChange={field.onChange}
                  options={(initialCategories || []).map((c) => ({ value: c.id, label: c.name }))}
                  placeholder="Selecione a categoria"
                  searchPlaceholder="Buscar..."
                  emptyStateMessage="Nenhuma categoria."
                  onRefetch={handleRefetchCategories}
                  isFetching={isSubmitting}
                />
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>
      );
    case 'participantes':
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField control={form.control} name="auctioneerId" render={({ field }) => (
            <FormItem>
              <FormLabel>Leiloeiro<span className="text-destructive">*</span></FormLabel>
              <EntitySelector
                value={field.value}
                onChange={field.onChange}
                options={(initialAuctioneers || []).map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Selecione o leiloeiro"
                searchPlaceholder="Buscar..."
                emptyStateMessage="Nenhum leiloeiro."
                onRefetch={handleRefetchAuctioneers}
                isFetching={isSubmitting}
              />
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="sellerId" render={({ field }) => (
            <FormItem>
              <FormLabel>Comitente/Vendedor<span className="text-destructive">*</span></FormLabel>
              <EntitySelector
                value={field.value}
                onChange={field.onChange}
                options={(initialSellers || []).map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Selecione o comitente"
                searchPlaceholder="Buscar..."
                emptyStateMessage="Nenhum comitente."
                onRefetch={handleRefetchSellers}
                isFetching={isSubmitting}
              />
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="judicialProcessId" render={({ field }) => (
            <FormItem>
              <FormLabel>Processo Judicial (Opcional)</FormLabel>
              <EntitySelector
                value={field.value}
                onChange={field.onChange}
                options={(initialJudicialProcesses || []).map((p) => ({ value: p.id, label: p.processNumber }))}
                placeholder="Vincule a um processo"
                searchPlaceholder="Buscar processo..."
                emptyStateMessage="Nenhum processo."
                onRefetch={handleRefetchProcesses}
                isFetching={isSubmitting}
              />
              <FormDescription>Para bens de origem judicial.</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
        </div>
      );
    case 'modalidade':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={form.control} name="auctionType" render={({ field }) => (
              <FormItem>
                <FormLabel>Modalidade<span className="text-destructive">*</span></FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {auctionTypeOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="participation" render={({ field }) => (
              <FormItem>
                <FormLabel>Participação<span className="text-destructive">*</span></FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {auctionParticipationOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="auctionMethod" render={({ field }) => (
              <FormItem>
                <FormLabel>Método<span className="text-destructive">*</span></FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {auctionMethodOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <FormField control={form.control} name="onlineUrl" render={({ field }) => (
            <FormItem>
              <FormLabel>URL do Leilão Online</FormLabel>
              <FormControl>
                <Input placeholder="https://meet.google.com/..." {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
      );
    case 'localizacao':
      return <AddressGroup form={form} allCities={allCities} allStates={initialStates} />;
    case 'prazos':
      return (
        <AuctionStagesForm
          stages={form.watch('auctionStages') || []}
          onAddStage={handleAddStageWithDefaults}
          onRemoveStage={remove}
          onStageChange={(index, field, value) =>
            form.setValue(`auctionStages.${index}.${field}`, value, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />
      );
    case 'midia':
      return (
        <div className="space-y-4">
          <FormField control={form.control} name="imageMediaId" render={({ field }) => (
            <FormItem>
              <FormLabel>Imagem Principal do Leilão</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || 'CUSTOM'}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CUSTOM">Imagem Customizada</SelectItem>
                  <SelectItem value="INHERIT">Herdar do Lote em Destaque</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Você pode definir uma imagem específica ou herdar dinamicamente da imagem do lote que estiver marcado como destaque.</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
          {watchedImageMediaId !== 'INHERIT' && (
            <FormItem>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden border">
                  {isValidImageUrl(displayImageUrl) ? (
                    <Image src={displayImageUrl!} alt="Prévia" fill className="object-contain" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground m-auto" />
                  )}
                </div>
                <div className="space-y-2 flex-grow">
                  <Button type="button" variant="outline" onClick={() => setIsMediaDialogOpen(true)}>
                    {isValidImageUrl(displayImageUrl) ? 'Alterar Imagem' : 'Escolher da Biblioteca'}
                  </Button>
                </div>
              </div>
            </FormItem>
          )}
          {watchedImageMediaId === 'INHERIT' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800 flex items-center gap-3">
              <Info className="h-5 w-5 flex-shrink-0" />
              <div>A imagem deste leilão será a mesma do lote que você marcar como "Destaque". Se nenhum lote for marcado, uma imagem padrão será usada.</div>
            </div>
          )}
        </div>
      );
    case 'opcoes':
      return (
        <div className="space-y-4">
          {watchedAuctionMethod === 'DUTCH' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown />Configurações do Leilão Holandês
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="decrementAmount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Decremento (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="decrementIntervalSeconds" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intervalo do Decremento (Segundos)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="floorPrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Mínimo (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>
          )}
          <FormField control={form.control} name="isFeaturedOnMarketplace" render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
              <div className="space-y-0.5">
                <FormLabel>Destaque no Marketplace</FormLabel>
                <FormDescription>Exibir este leilão na seção de destaques da home page.</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="allowInstallmentBids" render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
              <div className="space-y-0.5">
                <FormLabel>Permitir Lances Parcelados</FormLabel>
                <FormDescription>Habilita a opção de checkout com parcelamento para os lotes deste leilão.</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )} />
        </div>
      );
    default:
      return null;
  }
};

const AuctionForm = forwardRef<any, AuctionFormProps>(({
  initialData,
  auctioneers: initialAuctioneers,
  sellers: initialSellers,
  states: initialStates,
  allCities,
  judicialProcesses: initialJudicialProcesses,
  categories: initialCategories,
  onSubmitAction,
  submitButtonText = "Salvar",
  isWizardMode = false,
  onWizardDataChange,
  formRef,
  defaultAuctionId,
  onSuccessCallback,
  onAddNewEntity,
}, ref) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

  const form = useForm<AuctionFormValues>({
    resolver: zodResolver(auctionFormSchema),
    mode: 'onChange',
    defaultValues: {
      ...initialData,
      auctionType: initialData?.auctionType ?? '',
      auctionMethod: initialData?.auctionMethod ?? '',
      participation: initialData?.participation ?? '',
      status: initialData?.status ?? '',
      softCloseEnabled: initialData?.softCloseEnabled ?? false,
      softCloseMinutes: initialData?.softCloseMinutes ?? 0,
      auctionStages: initialData?.auctionStages?.length 
        ? initialData.auctionStages.map((s) => ({ ...s, startDate: new Date(s.startDate), endDate: new Date(s.endDate) })) 
        : [{ name: '1ª Praça', startDate: new Date(), endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), initialPrice: null }],
    },
  });

  const watchedValues = useWatch({ control: form.control });

  useEffect(() => {
    if (isWizardMode && onWizardDataChange) {
      const subscription = form.watch((value) => {
        onWizardDataChange(value as Partial<AuctionFormValues>);
      });
      return () => subscription.unsubscribe();
    }
  }, [form, isWizardMode, onWizardDataChange, watchedValues]);

  useImperativeHandle(ref, () => ({
    requestSubmit: form.handleSubmit(onSubmitAction),
    setValue: form.setValue,
    getValues: form.getValues,
    formState: form.formState,
  }));

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "auctionStages",
  });

  const watchedImageMediaId = useWatch({ control: form.control, name: 'imageMediaId' });
  const watchedImageUrl = form.watch('imageUrl');

  const displayImageUrl = useMemo(() => {
    if (watchedImageMediaId && watchedImageMediaId !== 'INHERIT') {
      const selectedMedia = mediaItems.find((item) => item.id === watchedImageMediaId);
      return selectedMedia?.urlOriginal || watchedImageUrl;
    }
    return watchedImageUrl;
  }, [watchedImageMediaId, watchedImageUrl, mediaItems]);

  const watchedAuctionMethod = useWatch({ control: form.control, name: 'auctionMethod' });

  useEffect(() => {
    getPlatformSettings().then((settings) => setPlatformSettings(settings as PlatformSettings));
    getMediaItems().then((items) => setMediaItems(items));
  }, []);

  const handleMediaSelect = (selectedItems: Partial<MediaItem>[]) => {
    if (selectedItems.length > 0 && selectedItems[0]) {
      const { id, urlOriginal } = selectedItems[0];
      form.setValue('imageMediaId', id || null, { shouldDirty: true });
      form.setValue('imageUrl', urlOriginal || null, { shouldDirty: true });
    }
    setIsMediaDialogOpen(false);
  };

  const handleAddStageWithDefaults = useCallback(() => {
    const lastStage = fields[fields.length - 1];
    const durationDays = platformSettings?.biddingSettings?.defaultStageDurationDays || 7;
    const intervalDays = platformSettings?.biddingSettings?.defaultDaysBetweenStages || 1;
    let newStartDate = new Date();
    if (lastStage?.endDate) {
      newStartDate = addDays(new Date(lastStage.endDate as Date), intervalDays);
    }
    const newEndDate = addDays(newStartDate, durationDays);
    append({
      name: `Praça ${fields.length + 1}`,
      startDate: newStartDate,
      endDate: newEndDate,
      initialPrice: null,
    });
  }, [fields, append, platformSettings]);

  async function onSubmit(values: AuctionFormValues) {
    setIsSubmitting(true);
    try {
      await onSubmitAction(values);
    } catch (error) {
      toast({ title: 'Erro Inesperado', description: 'Ocorreu um erro ao processar sua solicitação.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div data-ai-id="admin-auction-form-card">
        <FormProvider {...form}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Accordion type="multiple" defaultValue={["geral", "participantes", "prazos"]} className="w-full">
                <AccordionItem value="geral">
                  <AccordionTrigger>Informações Gerais</AccordionTrigger>
                  <AccordionContent className="p-4">
                    {renderAccordionContent(
                      "geral",
                      form,
                      initialCategories,
                      initialAuctioneers,
                      initialSellers,
                      initialJudicialProcesses || [],
                      allCities,
                      initialStates,
                      isSubmitting,
                      watchedAuctionMethod,
                      watchedImageMediaId,
                      displayImageUrl ?? null,
                      setIsMediaDialogOpen,
                      handleAddStageWithDefaults,
                      remove
                    )}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="participantes">
                  <AccordionTrigger>Participantes</AccordionTrigger>
                  <AccordionContent className="p-4">
                    {renderAccordionContent(
                      "participantes",
                      form,
                      initialCategories,
                      initialAuctioneers,
                      initialSellers,
                      initialJudicialProcesses || [],
                      allCities,
                      initialStates,
                      isSubmitting,
                      watchedAuctionMethod,
                      watchedImageMediaId,
                      displayImageUrl ?? null,
                      setIsMediaDialogOpen,
                      handleAddStageWithDefaults,
                      remove
                    )}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="modalidade">
                  <AccordionTrigger>Modalidade, Método e Local</AccordionTrigger>
                  <AccordionContent className="p-4">
                    {renderAccordionContent(
                      "modalidade",
                      form,
                      initialCategories,
                      initialAuctioneers,
                      initialSellers,
                      initialJudicialProcesses || [],
                      allCities,
                      initialStates,
                      isSubmitting,
                      watchedAuctionMethod,
                      watchedImageMediaId,
                      displayImageUrl ?? null,
                      setIsMediaDialogOpen,
                      handleAddStageWithDefaults,
                      remove
                    )}
                    {renderAccordionContent(
                      "localizacao",
                      form,
                      initialCategories,
                      initialAuctioneers,
                      initialSellers,
                      initialJudicialProcesses || [],
                      allCities,
                      initialStates,
                      isSubmitting,
                      watchedAuctionMethod,
                      watchedImageMediaId,
                      displayImageUrl ?? null,
                      setIsMediaDialogOpen,
                      handleAddStageWithDefaults,
                      remove
                    )}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="prazos">
                  <AccordionTrigger>Datas e Prazos</AccordionTrigger>
                  <AccordionContent className="p-4">
                    {renderAccordionContent(
                      "prazos",
                      form,
                      initialCategories,
                      initialAuctioneers,
                      initialSellers,
                      initialJudicialProcesses || [],
                      allCities,
                      initialStates,
                      isSubmitting,
                      watchedAuctionMethod,
                      watchedImageMediaId,
                      displayImageUrl ?? null,
                      setIsMediaDialogOpen,
                      handleAddStageWithDefaults,
                      remove
                    )}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="midia">
                  <AccordionTrigger>Mídia</AccordionTrigger>
                  <AccordionContent className="p-4">
                    {renderAccordionContent(
                      "midia",
                      form,
                      initialCategories,
                      initialAuctioneers,
                      initialSellers,
                      initialJudicialProcesses || [],
                      allCities,
                      initialStates,
                      isSubmitting,
                      watchedAuctionMethod,
                      watchedImageMediaId,
                      displayImageUrl ?? null,
                      setIsMediaDialogOpen,
                      handleAddStageWithDefaults,
                      remove
                    )}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="opcoes">
                  <AccordionTrigger>Opções Avançadas</AccordionTrigger>
                  <AccordionContent className="p-4">
                    {renderAccordionContent(
                      "opcoes",
                      form,
                      initialCategories,
                      initialAuctioneers,
                      initialSellers,
                      initialJudicialProcesses || [],
                      allCities,
                      initialStates,
                      isSubmitting,
                      watchedAuctionMethod,
                      watchedImageMediaId,
                      displayImageUrl ?? null,
                      setIsMediaDialogOpen,
                      handleAddStageWithDefaults,
                      remove
                    )}
                  </AccordionContent>
                </AccordionItem>
                {initialData?.id && (
                  <AccordionItem value="historico">
                    <AccordionTrigger>Histórico de Alterações</AccordionTrigger>
                    <AccordionContent className="p-4">
                      <ChangeHistoryTab
                        entityType="Auction"
                        entityId={String(initialData.id)}
                      />
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
              {!isWizardMode && (
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                    {submitButtonText}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </FormProvider>
      </div>
      <ChooseMediaDialog isOpen={isMediaDialogOpen} onOpenChange={setIsMediaDialogOpen} onMediaSelect={handleMediaSelect} allowMultiple={false} />
    </>
  );
});

AuctionForm.displayName = "AuctionForm";

export default AuctionForm;
