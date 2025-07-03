
'use client';

import { useWizard } from '../wizard-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { LotCategory, AuctioneerProfileInfo, SellerProfileInfo, JudicialProcess } from '@/types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
import React, { useEffect } from 'react';

interface Step3AuctionDetailsProps {
  categories: LotCategory[];
  auctioneers: AuctioneerProfileInfo[];
  sellers: SellerProfileInfo[];
  wizardData: { judicialProcess?: JudicialProcess; auctionDetails?: any; }; // Simplified type for props
  setWizardData: React.Dispatch<React.SetStateAction<any>>;
}

const auctionDetailsSchema = z.object({
  title: z.string().min(10, 'O título deve ter pelo menos 10 caracteres.'),
  description: z.string().optional(),
  auctioneer: z.string().min(1, 'Selecione um leiloeiro.'),
  seller: z.string().min(1, 'Selecione um comitente.'),
  auctionDate: z.date({ required_error: 'A data de início é obrigatória.' }),
  endDate: z.date().optional().nullable(),
});

type FormValues = z.infer<typeof auctionDetailsSchema>;

export default function Step3AuctionDetails({ categories, auctioneers, sellers, wizardData, setWizardData }: Step3AuctionDetailsProps) {
  
  const form = useForm<FormValues>({
    resolver: zodResolver(auctionDetailsSchema),
    defaultValues: {
      title: wizardData.auctionDetails?.title || '',
      description: wizardData.auctionDetails?.description || '',
      auctioneer: wizardData.auctionDetails?.auctioneer || '',
      seller: wizardData.auctionDetails?.seller || '',
      auctionDate: wizardData.auctionDetails?.auctionDate ? new Date(wizardData.auctionDetails.auctionDate) : new Date(),
      endDate: wizardData.auctionDetails?.endDate ? new Date(wizardData.auctionDetails.endDate) : undefined,
    }
  });

  // Auto-populate seller from judicial process when it changes
  useEffect(() => {
    if (wizardData.auctionType === 'JUDICIAL' && wizardData.judicialProcess) {
      const defendant = wizardData.judicialProcess.parties.find(p => p.partyType === 'REU');
      if (defendant && defendant.name) {
        // Check if a seller with this name exists, if so, use it. Otherwise, just set the name.
        const existingSeller = sellers.find(s => s.name.toLowerCase() === defendant.name.toLowerCase());
        const sellerNameToSet = existingSeller ? existingSeller.name : defendant.name;
        
        if (form.getValues('seller') !== sellerNameToSet) {
          form.setValue('seller', sellerNameToSet);
        }
      }
    }
  }, [wizardData.judicialProcess, wizardData.auctionType, sellers, form]);


  useEffect(() => {
    const subscription = form.watch((value) => {
      setWizardData((prev: any) => ({
        ...prev,
        auctionDetails: {
          ...prev.auctionDetails,
          ...value
        }
      }));
    });
    return () => subscription.unsubscribe();
  }, [form, setWizardData]);


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
                     <Select onValueChange={field.onChange} value={field.value || ''} disabled={wizardData.auctionType === 'JUDICIAL' && !!wizardData.judicialProcess}>
                      <FormControl><SelectTrigger><SelectValue placeholder={wizardData.auctionType === 'JUDICIAL' ? 'Definido pelo Processo' : 'Selecione...'} /></SelectTrigger></FormControl>
                      <SelectContent>
                        {sellers.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
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
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
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
