// src/components/admin/wizard/steps/step-3-auction-details.tsx
'use client';

import { useWizard } from '../wizard-context';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { LotCategory, AuctioneerProfileInfo, SellerProfileInfo, AuctionStage } from '@/types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon, PlusCircle, Trash2, Zap, ClockIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInMilliseconds } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import AuctionStagesTimeline from '@/components/auction/auction-stages-timeline';
import { Card } from '@/components/ui/card';
import EntitySelector from '@/components/ui/entity-selector';
import { getAuctioneers as refetchAuctioneers, getSellers as refetchSellers } from '@/app/admin/auctions/actions';
import { getLotCategories as refetchCategories } from '@/app/admin/categories/actions';
import { Label } from '@/components/ui/label';

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

interface Step3AuctionDetailsProps {
  categories: LotCategory[];
  auctioneers: AuctioneerProfileInfo[];
  sellers: SellerProfileInfo[];
}

const auctionDetailsSchema = z.object({
  title: z.string().min(10, 'O título deve ter pelo menos 10 caracteres.'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'A categoria principal é obrigatória.'),
  auctioneerId: z.string().min(1, 'Selecione um leiloeiro.'),
  sellerId: z.string().min(1, 'Selecione um comitente.'),
  auctionStages: z.array(
    z.object({
      name: z.string().min(1, "Nome da praça é obrigatório"),
      startDate: z.date({ required_error: "Data de início da praça é obrigatória" }),
      endDate: z.date({ required_error: "Data de encerramento da praça é obrigatória" }),
      initialPrice: z.coerce.number().positive("Lance inicial da praça deve ser positivo").optional().nullable(),
    })
  ).min(1, "O leilão deve ter pelo menos uma praça/etapa."),
  automaticBiddingEnabled: z.boolean().optional().default(false),
  allowInstallmentBids: z.boolean().optional().default(false),
  softCloseEnabled: z.boolean().optional().default(false),
  softCloseMinutes: z.coerce.number().int().min(1).max(30).optional().default(2),
});

type FormValues = z.infer<typeof auctionDetailsSchema>;

export default function Step3AuctionDetails({ 
    categories: initialCategories, 
    auctioneers: initialAuctioneers, 
    sellers: initialSellers 
}: Step3AuctionDetailsProps) {
  const { wizardData, setWizardData } = useWizard();
  
  const [categories, setCategories] = useState(initialCategories);
  const [auctioneers, setAuctioneers] = useState(initialAuctioneers);
  const [sellers, setSellers] = useState(initialSellers);
  const [isFetchingCategories, setIsFetchingCategories] = useState(false);
  const [isFetchingAuctioneers, setIsFetchingAuctioneers] = useState(false);
  const [isFetchingSellers, setIsFetchingSellers] = useState(false);
  const [syncStages, setSyncStages] = useState(true);


  const form = useForm<FormValues>({
    resolver: zodResolver(auctionDetailsSchema),
    defaultValues: {
      title: wizardData.auctionDetails?.title || '',
      description: wizardData.auctionDetails?.description || '',
      categoryId: wizardData.auctionDetails?.categoryId || '',
      auctioneerId: wizardData.auctionDetails?.auctioneerId || '',
      sellerId: wizardData.auctionDetails?.sellerId || '',
      auctionStages: wizardData.auctionDetails?.auctionStages?.map(stage => ({...stage, startDate: new Date(stage.startDate as Date), endDate: new Date(stage.endDate as Date), initialPrice: stage.initialPrice || undefined })) || [{ name: '1ª Praça', startDate: new Date(), endDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000) }],
      automaticBiddingEnabled: wizardData.auctionDetails?.automaticBiddingEnabled || false,
      allowInstallmentBids: wizardData.auctionDetails?.allowInstallmentBids || false,
      softCloseEnabled: wizardData.auctionDetails?.softCloseEnabled || false,
      softCloseMinutes: wizardData.auctionDetails?.softCloseMinutes || 2,
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "auctionStages",
  });
  
  const handleRefetch = useCallback(async (entity: 'categories' | 'auctioneers' | 'sellers') => {
    if (entity === 'categories') {
        setIsFetchingCategories(true);
        const data = await refetchCategories();
        setCategories(data);
        setIsFetchingCategories(false);
    } else if (entity === 'auctioneers') {
        setIsFetchingAuctioneers(true);
        const data = await refetchAuctioneers();
        setAuctioneers(data);
        setIsFetchingAuctioneers(false);
    } else if (entity === 'sellers') {
        setIsFetchingSellers(true);
        const data = await refetchSellers();
        setSellers(data);
        setIsFetchingSellers(false);
    }
  }, []);

  const watchedStages = useWatch({ control: form.control, name: 'auctionStages' });
  const softCloseEnabled = useWatch({ control: form.control, name: 'softCloseEnabled' });

  // Logic to sync stage dates
  useEffect(() => {
    if (!syncStages) return;

    watchedStages.forEach((stage, index) => {
      if (index > 0) {
        const prevStage = watchedStages[index - 1];
        if (prevStage.endDate && stage.startDate?.getTime() !== prevStage.endDate.getTime()) {
           const newStartDate = new Date(prevStage.endDate);
           // Maintain duration
           const currentDuration = differenceInMilliseconds(new Date(stage.endDate!), new Date(stage.startDate!));
           const newEndDate = new Date(newStartDate.getTime() + currentDuration);
           
           form.setValue(`auctionStages.${index}.startDate`, newStartDate, { shouldDirty: true });
           form.setValue(`auctionStages.${index}.endDate`, newEndDate, { shouldDirty: true });
        }
      }
    });
  }, [watchedStages, syncStages, form]);

  const judicialProcessSellerName = wizardData.auctionType === 'JUDICIAL' && wizardData.judicialProcess
    ? wizardData.judicialProcess.sellerName
    : null;

  useEffect(() => {
    const seller = sellers.find(s => s.name === judicialProcessSellerName);
    if (seller && form.getValues('sellerId') !== seller.id) {
      form.setValue('sellerId', seller.id);
    }
  }, [judicialProcessSellerName, form, sellers]);

  const availableSellers = useMemo(() => {
    if (wizardData.auctionType === 'JUDICIAL') {
      return sellers.filter(s => s.isJudicial);
    }
    return sellers;
  }, [sellers, wizardData.auctionType]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      const auctioneerDetails = auctioneers.find(a => a.id === value.auctioneerId);
      const sellerDetails = sellers.find(s => s.id === value.sellerId);
      
      const auctionDate = (value.auctionStages && value.auctionStages.length > 0 && value.auctionStages[0].startDate) ? value.auctionStages[0].startDate : new Date();
      
      setWizardData(prev => ({
        ...prev,
        auctionDetails: {
          ...prev.auctionDetails,
          ...value,
          auctionDate: auctionDate, // Set the main date from the first stage
          auctioneer: auctioneerDetails?.name,
          seller: sellerDetails?.name,
        }
      }));
    });
    return () => subscription.unsubscribe();
  }, [form, setWizardData, auctioneers, sellers]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Detalhes Principais do Leilão</h3>
      <Form {...form}>
        <form className="space-y-4">
          <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título do Leilão</FormLabel><FormControl><Input placeholder="Ex: Grande Leilão Judicial da Vara X" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição (Opcional)</FormLabel><FormControl><Textarea placeholder="Breve descrição sobre o leilão..." {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
          
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria Principal</FormLabel>
                <EntitySelector
                  value={field.value}
                  onChange={field.onChange}
                  options={categories.map(c => ({ value: c.id, label: c.name }))}
                  placeholder="Selecione a categoria"
                  searchPlaceholder="Buscar categoria..."
                  emptyStateMessage="Nenhuma categoria encontrada."
                  createNewUrl="/admin/categories/new"
                  editUrlPrefix="/admin/categories"
                  onRefetch={() => handleRefetch('categories')}
                  isFetching={isFetchingCategories}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          
           <FormField
              control={form.control}
              name="auctioneerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leiloeiro</FormLabel>
                   <EntitySelector
                      value={field.value}
                      onChange={field.onChange}
                      options={auctioneers.map(a => ({ value: a.id, label: a.name }))}
                      placeholder="Selecione o leiloeiro"
                      searchPlaceholder="Buscar leiloeiro..."
                      emptyStateMessage="Nenhum leiloeiro encontrado."
                      createNewUrl="/admin/auctioneers/new"
                      editUrlPrefix="/admin/auctioneers"
                      onRefetch={() => handleRefetch('auctioneers')}
                      isFetching={isFetchingAuctioneers}
                    />
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="sellerId"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Comitente</FormLabel>
                    <EntitySelector
                      value={field.value}
                      onChange={field.onChange}
                      options={availableSellers.map(s => ({ value: s.id, label: s.name }))}
                      placeholder="Selecione o comitente"
                      searchPlaceholder="Buscar comitente..."
                      emptyStateMessage="Nenhum comitente encontrado."
                      createNewUrl="/admin/sellers/new"
                      editUrlPrefix="/admin/sellers"
                      onRefetch={() => handleRefetch('sellers')}
                      isFetching={isFetchingSellers}
                    />
                    <FormMessage />
                </FormItem>
                )}
            />
          
          <Separator />
           <div className="flex flex-wrap gap-4 justify-between items-center pt-2">
                <h3 className="text-md font-semibold text-muted-foreground">Praças / Etapas do Leilão</h3>
                <div className="flex items-center space-x-2">
                    <Label htmlFor="sync-stages" className="text-xs font-normal">Sincronizar Etapas</Label>
                    <Switch id="sync-stages" checked={syncStages} onCheckedChange={setSyncStages}/>
                </div>
            </div>
           <div className="space-y-2">
            {fields.map((field, index) => (
                <Card key={field.id} className="p-3 bg-background">
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">Praça / Etapa {index + 1}</h4>
                        {fields.length > 1 && (<Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:text-destructive/80 h-7 w-7"><Trash2 className="h-4 w-4" /></Button>)}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                       <div className="flex-grow"><FormField control={form.control} name={`auctionStages.${index}.name`} render={({ field: stageField }) => (<FormItem><FormLabel className="text-xs">Nome da Etapa</FormLabel><FormControl><Input placeholder={`Ex: ${index+1}ª Praça`} {...stageField} /></FormControl><FormMessage /></FormItem>)} /></div>
                       <div className="flex-grow"><FormField control={form.control} name={`auctionStages.${index}.startDate`} render={({ field: stageField }) => <DatePickerWithTime field={stageField} label="Início" disabled={(syncStages && index > 0)} />} /></div>
                       <div className="flex-grow"><FormField control={form.control} name={`auctionStages.${index}.endDate`} render={({ field: stageField }) => <DatePickerWithTime field={stageField} label="Fim" />} /></div>
                    </div>
                </Card>
            ))}
             <Button type="button" variant="outline" size="sm" onClick={() => {
                      const lastStage = fields.length > 0 ? fields[fields.length - 1] : null;
                      const lastEndDate = lastStage?.endDate ? new Date(lastStage.endDate) : new Date();
                      const nextStartDate = syncStages ? lastEndDate : new Date(lastEndDate.getTime() + 60000); // Add 1 minute if not synced
                      const nextEndDate = new Date(nextStartDate.getTime() + 7 * 24 * 60 * 60 * 1000); // Add 7 days
                      append({ name: `${fields.length + 1}ª Praça`, startDate: nextStartDate, endDate: nextEndDate, initialPrice: null })
                  }} className="text-xs mt-2">
                      <PlusCircle className="mr-2 h-3.5 w-3.5" /> Adicionar Praça/Etapa
              </Button>
            </div>
            
            <AuctionStagesTimeline stages={watchedStages as AuctionStage[]} />
            
             <Separator />
            <h3 className="text-md font-semibold text-muted-foreground pt-2">Opções Adicionais</h3>
            <FormField control={form.control} name="automaticBiddingEnabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Robô de Lances</FormLabel><FormDescription className="text-xs">Permitir lances automáticos (robô)?</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
            <FormField control={form.control} name="allowInstallmentBids" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Lance Parcelado</FormLabel><FormDescription className="text-xs">Permitir lances parcelados?</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
            <FormField control={form.control} name="softCloseEnabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel className="flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" /> Soft-Close</FormLabel><FormDescription className="text-xs">Estender o tempo final com novos lances?</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
            {softCloseEnabled && (
                 <FormField control={form.control} name="softCloseMinutes" render={({ field }) => (
                  <FormItem className="pl-4">
                    <FormLabel>Minutos para Soft-Close</FormLabel>
                    <FormControl><Input type="number" {...field} value={field.value ?? 2} onChange={e => field.onChange(parseInt(e.target.value, 10))} className="w-24" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
            )}
        </form>
      </Form>
    </div>
  );
}