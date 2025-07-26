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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon, PlusCircle, Trash2, ClockIcon, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useEffect, useMemo } from 'react';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import AuctionStagesTimeline from '@/components/auction/auction-stages-timeline';
import { Card } from '@/components/ui/card';

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
  auctionDate: z.date({ required_error: 'A data de início é obrigatória.' }),
  endDate: z.date().optional().nullable(),
  auctionStages: z.array(
    z.object({
      name: z.string().min(1, "Nome da praça é obrigatório"),
      endDate: z.date({ required_error: "Data de encerramento da praça é obrigatória" }),
      initialPrice: z.coerce.number().positive("Lance inicial da praça deve ser positivo").optional(),
    })
  ).optional(),
  automaticBiddingEnabled: z.boolean().optional().default(false),
  allowInstallmentBids: z.boolean().optional().default(false),
  softCloseEnabled: z.boolean().optional().default(false),
  softCloseMinutes: z.coerce.number().int().min(1).max(30).optional().default(2),
});

type FormValues = z.infer<typeof auctionDetailsSchema>;

export default function Step3AuctionDetails({ categories, auctioneers, sellers }: Step3AuctionDetailsProps) {
  const { wizardData, setWizardData } = useWizard();

  const form = useForm<FormValues>({
    resolver: zodResolver(auctionDetailsSchema),
    defaultValues: {
      title: wizardData.auctionDetails?.title || '',
      description: wizardData.auctionDetails?.description || '',
      categoryId: wizardData.auctionDetails?.categoryId || '',
      auctioneerId: wizardData.auctionDetails?.auctioneerId || '',
      sellerId: wizardData.auctionDetails?.sellerId || '',
      auctionDate: wizardData.auctionDetails?.auctionDate ? new Date(wizardData.auctionDetails.auctionDate) : new Date(),
      endDate: wizardData.auctionDetails?.endDate ? new Date(wizardData.auctionDetails.endDate) : undefined,
      auctionStages: wizardData.auctionDetails?.auctionStages?.map(stage => ({...stage, endDate: new Date(stage.endDate as Date)})) || [{ name: '1ª Praça', endDate: new Date() }],
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
  
  const watchedAuctionDate = useWatch({ control: form.control, name: 'auctionDate' });
  const watchedStages = useWatch({ control: form.control, name: 'auctionStages' });
  const softCloseEnabled = useWatch({ control: form.control, name: 'softCloseEnabled' });

  const judicialProcessSellerId = wizardData.auctionType === 'JUDICIAL' && wizardData.judicialProcess
    ? wizardData.judicialProcess.sellerId
    : null;

  useEffect(() => {
    if (judicialProcessSellerId && form.getValues('sellerId') !== judicialProcessSellerId) {
      form.setValue('sellerId', judicialProcessSellerId);
    }
  }, [judicialProcessSellerId, form]);

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
      
      setWizardData(prev => ({
        ...prev,
        auctionDetails: {
          ...prev.auctionDetails,
          ...value,
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
          <FormField control={form.control} name="categoryId" render={({ field }) => (<FormItem><FormLabel>Categoria Principal</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="auctioneerId" render={({ field }) => (<FormItem><FormLabel>Leiloeiro</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent>{auctioneers.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="sellerId" render={({ field }) => (<FormItem><FormLabel>Comitente</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent>{availableSellers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
          </div>
          
          <Separator />
           <h3 className="text-md font-semibold text-muted-foreground pt-2">Parâmetros e Datas</h3>
          <FormField control={form.control} name="auctionDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Data de Início (Geral)</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />

           {fields.map((field, index) => (
              <Card key={field.id} className="p-3 bg-secondary/30">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-sm">Praça / Etapa {index + 1}</h4>
                  {fields.length > 1 && (<Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:text-destructive/80 h-7 w-7"><Trash2 className="h-4 w-4" /></Button>)}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name={`auctionStages.${index}.name`} render={({ field: stageField }) => (<FormItem><FormLabel className="text-xs">Nome</FormLabel><FormControl><Input {...stageField} placeholder={`Ex: ${index+1}ª Praça`} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name={`auctionStages.${index}.endDate`} render={({ field: stageField }) => (<FormItem className="flex flex-col"><FormLabel className="text-xs">Data de Encerramento</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full pl-3 text-left font-normal bg-background", !stageField.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{stageField.value ? format(stageField.value, "dd/MM/yy HH:mm", { locale: ptBR }) : <span>Escolha</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={stageField.value} onSelect={stageField.onChange} initialFocus /><div className="p-2 border-t"><Input type="time" defaultValue={stageField.value ? format(stageField.value, "HH:mm") : "10:00"} onChange={(e) => { const [h, m] = e.target.value.split(':'); const d = stageField.value ? new Date(stageField.value) : new Date(); d.setHours(Number(h), Number(m)); stageField.onChange(d); }} /></div></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                </div>
              </Card>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ name: `${fields.length + 1}ª Praça`, endDate: new Date() })}><PlusCircle className="mr-2 h-3.5 w-3.5"/>Adicionar Praça/Etapa</Button>
            
            <AuctionStagesTimeline auctionOverallStartDate={watchedAuctionDate} stages={watchedStages as AuctionStage[]} />
            
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
