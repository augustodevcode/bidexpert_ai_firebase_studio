// src/app/admin/auctions/auction-form.tsx
'use client';

import React, { useEffect, useCallback, useState, useRef } from 'react';
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
import type { Auction, AuctionStatus, LotCategory, AuctioneerProfileInfo, SellerProfileInfo, AuctionStage, MediaItem, WizardData } from '@/types';
import { Loader2, Save, CalendarIcon, Gavel, Bot, Percent, FileText, PlusCircle, Trash2, Landmark, ClockIcon, Image as ImageIcon, Zap, TrendingDown, HelpCircle, Repeat, MicOff, FileSignature, XCircle, MapPin, HandCoins } from 'lucide-react';
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
import { Label } from '@/components/ui/label';

interface AuctionFormProps {
  formRef?: React.MutableRefObject<any>;
  initialData?: Partial<Auction> | null;
  categories: LotCategory[];
  auctioneers: AuctioneerProfileInfo[];
  sellers: SellerProfileInfo[];
  onSubmitAction?: (data: AuctionFormValues) => Promise<{ success: boolean; message: string; auctioneerId?: string }>;
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

const auctionTypeOptions = [
  { value: 'JUDICIAL', label: 'Judicial' },
  { value: 'EXTRAJUDICIAL', label: 'Extrajudicial' },
  { value: 'PARTICULAR', label: 'Particular' },
  { value: 'TOMADA_DE_PRECOS', label: 'Tomada de Preços' },
  { value: 'DUTCH', label: 'Holandês (Reverso)' },
  { value: 'SILENT', label: 'Silencioso (Lance Fechado)' },
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
  const [isFetchingCategories, setIsFetchingCategories] = React.useState(false);
  const [isFetchingAuctioneers, setIsFetchingAuctioneers] = React.useState(false);
  const [isFetchingSellers, setIsFetchingSellers] = React.useState(false);
  const [syncStages, setSyncStages] = React.useState(true);
  
  const form = useForm<AuctionFormValues>({
    resolver: zodResolver(auctionFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      status: initialData?.status || 'RASCUNHO',
      auctionType: initialData?.auctionType || undefined,
      auctioneerId: initialData?.auctioneerId || '',
      sellerId: initialData?.sellerId || '',
      categoryId: initialData?.categoryId || '',
      mapAddress: initialData?.mapAddress || '',
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
  const watchedAuctionType = useWatch({ control: form.control, name: 'auctionType' });
  const watchedStages = useWatch({ control: form.control, name: 'auctionStages' });
  
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
        auctioneer: auctioneerDetails?.name,
        seller: sellerDetails?.name,
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
           const currentDuration = differenceInMilliseconds(new Date(stage.endDate!), new Date(stage.startDate!));
           const newEndDate = new Date(newStartDate.getTime() + currentDuration);
           form.setValue(`auctionStages.${index}.startDate`, newStartDate, { shouldDirty: true });
           form.setValue(`auctionStages.${index}.endDate`, newEndDate, { shouldDirty: true });
        }
      }
    });
  }, [watchedStages, syncStages, form]);

  const handleRefetch = React.useCallback(async (entity: 'categories' | 'auctioneers' | 'sellers') => {
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
      toast({ title: 'Erro Inesperado', description: 'Ocorreu um erro.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const handleCancelClick = () => {
    if (onCancelEdit) onCancelEdit();
    else router.back();
  };

  return (
    <>
      <TooltipProvider>
        <ChooseMediaDialog isOpen={isMediaDialogOpen} onOpenChange={setIsMediaDialogOpen} onMediaSelect={() => {}} allowMultiple={false} />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <fieldset disabled={isViewMode} className="group">
              <div className={cn(
                "space-y-6",
                isWizardMode && "bg-secondary/30 p-4 rounded-md border"
              )}>
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título do Leilão</FormLabel><FormControl><Input placeholder="Ex: Leilão de Imóveis da Empresa X" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição (Opcional)</FormLabel><FormControl><Textarea placeholder="Detalhes sobre o leilão, informações importantes, etc." {...field} value={field.value ?? ""} rows={4} /></FormControl><FormMessage /></FormItem>)} />
                {!isWizardMode && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status do Leilão</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger></FormControl><SelectContent>{auctionStatusOptions.map(option => <SelectItem key={option.value} value={option.value!}>{option.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="auctionType" render={({ field }) => (<FormItem><FormLabel>Modalidade de Leilão</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo/modalidade" /></SelectTrigger></FormControl><SelectContent>{auctionTypeOptions.map(option => <SelectItem key={option.value} value={option.value!}>{option.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                  </div>
                )}
                <FormField control={form.control} name="categoryId" render={({ field }) => (<FormItem><FormLabel>Categoria Principal</FormLabel><EntitySelector value={field.value} onChange={field.onChange} options={categories.map(c => ({ value: c.id, label: c.name }))} placeholder="Selecione a categoria principal" searchPlaceholder="Buscar categoria..." emptyStateMessage="Nenhuma categoria encontrada." createNewUrl="/admin/categories/new" editUrlPrefix="/admin/categories" onRefetch={() => handleRefetch('categories')} isFetching={isFetchingCategories} disabled={isViewMode} /><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="auctioneerId" render={({ field }) => (<FormItem><FormLabel>Leiloeiro Responsável</FormLabel><EntitySelector value={field.value} onChange={field.onChange} options={auctioneers.map(a => ({ value: a.id, label: a.name }))} placeholder="Selecione o leiloeiro" searchPlaceholder="Buscar leiloeiro..." emptyStateMessage="Nenhum leiloeiro encontrado." createNewUrl="/admin/auctioneers/new" editUrlPrefix="/admin/auctioneers" onRefetch={() => handleRefetch('auctioneers')} isFetching={isFetchingAuctioneers} disabled={isViewMode} /><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="sellerId" render={({ field }) => (<FormItem><FormLabel>Comitente/Vendedor Principal</FormLabel><EntitySelector value={field.value} onChange={field.onChange} options={sellers.map(s => ({ value: s.id, label: s.name }))} placeholder="Selecione o comitente" searchPlaceholder="Buscar comitente..." emptyStateMessage="Nenhum comitente encontrado." createNewUrl="/admin/sellers/new" editUrlPrefix="/admin/sellers" onRefetch={() => handleRefetch('sellers')} isFetching={isFetchingSellers} disabled={isViewMode} /><FormMessage /></FormItem>)} />
                <Separator />
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-4 justify-between items-center"><h3 className="text-md font-semibold text-muted-foreground flex items-center gap-2"><ClockIcon className="h-4 w-4" />Praças / Etapas do Leilão</h3><div className="flex items-center space-x-2"><Label htmlFor="sync-stages-main" className="text-xs font-normal">Sincronizar Etapas</Label><Switch id="sync-stages-main" checked={syncStages} onCheckedChange={setSyncStages} disabled={isViewMode} /></div></div>
                  {fields.map((field, index) => (
                    <Card key={field.id} className="p-3 bg-background">
                      <div className="flex justify-between items-start mb-2"><h4 className="font-medium">Praça / Etapa {index + 1}</h4>{!isViewMode && fields.length > 1 && (<Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:text-destructive/80 h-7 w-7"><Trash2 className="h-4 w-4" /></Button>)}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                        <FormField control={form.control} name={`auctionStages.${index}.name`} render={({ field: stageField }) => (<FormItem><FormLabel className="text-xs">Nome da Etapa</FormLabel><FormControl><Input placeholder={`Ex: ${index + 1}ª Praça`} {...stageField} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`auctionStages.${index}.startDate`} render={({ field: stageField }) => <DatePickerWithTime field={stageField} label="Início" disabled={isViewMode || (syncStages && index > 0)} />} />
                        <FormField control={form.control} name={`auctionStages.${index}.endDate`} render={({ field: stageField }) => <DatePickerWithTime field={stageField} label="Fim" disabled={isViewMode} />} />
                      </div>
                    </Card>
                  ))}
                  {!isViewMode && (<Button type="button" variant="outline" size="sm" onClick={() => { const lastStage = fields[fields.length - 1]; const lastEndDate = lastStage?.endDate ? new Date(lastStage.endDate) : new Date(); const nextStartDate = syncStages ? lastEndDate : new Date(lastEndDate.getTime() + 60000); const nextEndDate = new Date(nextStartDate.getTime() + 7 * 24 * 60 * 60 * 1000); append({ name: `${fields.length + 1}ª Praça`, startDate: nextStartDate, endDate: nextEndDate, initialPrice: null }) }} className="text-xs mt-2"><PlusCircle className="mr-2 h-3.5 w-3.5" /> Adicionar Praça/Etapa</Button>)}
                </div>
                <AuctionStagesTimeline stages={watchedStages as AuctionStage[]} />
              </div>

              {!isWizardMode && (
                <Card className="shadow-lg mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Gavel className="h-6 w-6 text-primary" /> {formTitle}</CardTitle>
                    <CardDescription>{formDescription}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6 bg-secondary/30 group-disabled:bg-muted/10">
                      {/* O conteúdo do formulário está acima */}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 p-6 border-t">
                      <Button type="button" variant="outline" onClick={handleCancelClick} disabled={isSubmitting}><XCircle className="mr-2 h-4 w-4" /> Cancelar Edição</Button>
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
```