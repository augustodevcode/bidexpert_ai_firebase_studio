
// src/components/admin/wizard/steps/step-3-auction-details.tsx
'use client';

import { useWizard } from '../wizard-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { LotCategory, AuctioneerProfileInfo, SellerProfileInfo, JudicialProcess } from '@/types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useEffect, useMemo } from 'react';

interface Step3AuctionDetailsProps {
  categories: LotCategory[];
  auctioneers: AuctioneerProfileInfo[];
  sellers: SellerProfileInfo[];
}

const auctionDetailsSchema = z.object({
  title: z.string().min(10, 'O título deve ter pelo menos 10 caracteres.'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'A categoria principal é obrigatória.'),
  auctioneer: z.string().min(1, 'Selecione um leiloeiro.'),
  seller: z.string().min(1, 'Selecione um comitente.'),
  auctionDate: z.date({ required_error: 'A data de início é obrigatória.' }),
  endDate: z.date().optional().nullable(),
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
      auctioneer: wizardData.auctionDetails?.auctioneer || '',
      seller: wizardData.auctionDetails?.seller || '',
      auctionDate: wizardData.auctionDetails?.auctionDate ? new Date(wizardData.auctionDetails.auctionDate) : new Date(),
      endDate: wizardData.auctionDetails?.endDate ? new Date(wizardData.auctionDetails.endDate) : undefined,
    }
  });

  const judicialProcessSellerName = wizardData.auctionType === 'JUDICIAL' && wizardData.judicialProcess 
    ? wizardData.judicialProcess.sellerName 
    : null;

  useEffect(() => {
    // If we have a seller from the judicial process, set it as the auction's seller.
    if (judicialProcessSellerName && form.getValues('seller') !== judicialProcessSellerName) {
      form.setValue('seller', judicialProcessSellerName);
    }
  }, [judicialProcessSellerName, form]);

  const availableSellers = useMemo(() => {
    if (wizardData.auctionType === 'JUDICIAL') {
      return sellers.filter(s => s.isJudicial);
    }
    return sellers;
  }, [sellers, wizardData.auctionType]);


  useEffect(() => {
    const subscription = form.watch((value) => {
      const auctioneerDetails = auctioneers.find(a => a.name === value.auctioneer);
      const sellerDetails = sellers.find(s => s.name === value.seller);
      
      setWizardData(prev => ({
        ...prev,
        auctionDetails: {
          ...prev.auctionDetails,
          ...value,
          auctioneerId: auctioneerDetails ? auctioneerDetails.id : prev.auctionDetails?.auctioneerId,
          sellerId: sellerDetails ? sellerDetails.id : prev.auctionDetails?.sellerId,
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
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título do Leilão</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Grande Leilão Judicial da Vara X" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição (Opcional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Breve descrição sobre o leilão..." {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria Principal do Leilão</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione a categoria..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <FormField
                control={form.control}
                name="auctioneer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leiloeiro Responsável</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                      <SelectContent>
                        {auctioneers.map(a => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="seller"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comitente/Vendedor</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                      <SelectContent>
                        {availableSellers.length > 0 ? (
                           availableSellers.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)
                        ) : (
                          <p className="p-2 text-xs text-muted-foreground">Nenhum comitente judicial encontrado.</p>
                        )}
                      </SelectContent>
                    </Select>
                     {judicialProcessSellerName && (
                        <FormDescription className="text-xs">
                            Sugerido: "{judicialProcessSellerName}" (do processo judicial).
                        </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="auctionDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Data de Início</FormLabel>
                    <Popover><PopoverTrigger asChild><FormControl>
                          <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl></PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover><FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Data de Fim (Opcional)</FormLabel>
                    <Popover><PopoverTrigger asChild><FormControl>
                          <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl></PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} />
                      </PopoverContent>
                    </Popover><FormMessage />
                  </FormItem>
                )}
              />
          </div>
        </form>
      </Form>
    </div>
  );
}
