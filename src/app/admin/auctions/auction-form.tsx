
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { auctionFormSchema, type AuctionFormValues } from './auction-form-schema';
import type { Auction, AuctionStatus, LotCategory, AuctioneerProfileInfo, SellerProfileInfo } from '@/types';
import { Loader2, Save, CalendarIcon, Gavel } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAuctionStatusText } from '@/lib/sample-data';

interface AuctionFormProps {
  initialData?: Auction | null;
  categories: LotCategory[];
  auctioneers: AuctioneerProfileInfo[]; 
  sellers: SellerProfileInfo[]; 
  onSubmitAction: (data: AuctionFormValues) => Promise<{ success: boolean; message: string; auctionId?: string }>;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
}

const auctionStatusOptions: { value: AuctionStatus; label: string }[] = [
  { value: 'EM_BREVE', label: getAuctionStatusText('EM_BREVE') },
  { value: 'ABERTO', label: getAuctionStatusText('ABERTO') },
  { value: 'ABERTO_PARA_LANCES', label: getAuctionStatusText('ABERTO_PARA_LANCES') },
  { value: 'ENCERRADO', label: getAuctionStatusText('ENCERRADO') },
  { value: 'FINALIZADO', label: getAuctionStatusText('FINALIZADO') },
  { value: 'CANCELADO', label: getAuctionStatusText('CANCELADO') },
  { value: 'SUSPENSO', label: getAuctionStatusText('SUSPENSO') },
];

const auctionTypeOptions = [
  { value: 'JUDICIAL', label: 'Judicial' },
  { value: 'EXTRAJUDICIAL', label: 'Extrajudicial' },
  { value: 'PARTICULAR', label: 'Particular' },
];

export default function AuctionForm({
  initialData,
  categories,
  auctioneers, 
  sellers,    
  onSubmitAction,
  formTitle,
  formDescription,
  submitButtonText,
}: AuctionFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<AuctionFormValues>({
    resolver: zodResolver(auctionFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      fullTitle: initialData?.fullTitle || '',
      description: initialData?.description || '',
      status: initialData?.status || 'EM_BREVE',
      auctionType: initialData?.auctionType || undefined,
      category: initialData?.category || '',
      auctioneer: initialData?.auctioneer || '', 
      seller: initialData?.seller || '',       
      auctionDate: initialData?.auctionDate ? new Date(initialData.auctionDate) : new Date(),
      endDate: initialData?.endDate ? new Date(initialData.endDate) : null,
      city: initialData?.city || '',
      state: initialData?.state || '',
      imageUrl: initialData?.imageUrl || '',
      documentsUrl: initialData?.documentsUrl || '',
      sellingBranch: initialData?.sellingBranch || '',
    },
  });

  async function onSubmit(values: AuctionFormValues) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(values);
      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: result.message,
        });
        router.push('/admin/auctions');
        router.refresh();
      } else {
        toast({
          title: 'Erro',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro Inesperado',
        description: 'Ocorreu um erro ao processar sua solicitação.',
        variant: 'destructive',
      });
      console.error("Unexpected error in auction form:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-3xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Gavel className="h-6 w-6 text-primary" /> {formTitle}</CardTitle>
        <CardDescription>{formDescription}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Leilão</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Leilão de Imóveis da Empresa X" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fullTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título Completo (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Título mais descritivo para SEO e clareza" {...field} />
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
                    <Textarea placeholder="Detalhes sobre o leilão, informações importantes, etc." {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status do Leilão</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {auctionStatusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="auctionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Leilão (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {auctionTypeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value!}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className="grid md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Categoria Principal</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {categories.length === 0 ? (
                             <p className="p-2 text-sm text-muted-foreground">Nenhuma categoria cadastrada</p>
                           ) : (
                             categories.map(cat => (
                               <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                             ))
                           )}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                  control={form.control}
                  name="auctioneer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leiloeiro Responsável</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o leiloeiro" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {auctioneers.length === 0 ? (
                            <p className="p-2 text-sm text-muted-foreground">Nenhum leiloeiro cadastrado</p>
                          ) : (
                            auctioneers.map(auc => (
                              <SelectItem key={auc.id} value={auc.name}>{auc.name}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
             <FormField
                control={form.control}
                name="seller"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Comitente/Vendedor Principal (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o comitente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                         {sellers.length === 0 ? (
                            <p className="p-2 text-sm text-muted-foreground">Nenhum comitente cadastrado</p>
                          ) : (
                           sellers.map(sel => (
                            <SelectItem key={sel.id} value={sel.name}>{sel.name}</SelectItem>
                          ))
                         )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
            <div className="grid md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="auctionDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Data Principal do Leilão</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}
                            >
                            {field.value ? format(field.value, "PPP HH:mm", { locale: ptBR }) : <span>Escolha data e hora</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        <div className="p-2 border-t">
                            <Input type="time" defaultValue={field.value ? format(field.value, "HH:mm") : "10:00"}
                            onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(':').map(Number);
                                const newDate = field.value ? new Date(field.value) : new Date();
                                newDate.setHours(hours, minutes);
                                field.onChange(newDate);
                            }} />
                        </div>
                        </PopoverContent>
                    </Popover>
                    <FormDescription>Data e hora de início do evento principal do leilão (ex: 1ª praça).</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Data de Encerramento Geral (Opcional)</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                            {field.value ? format(field.value, "PPP HH:mm", { locale: ptBR }) : <span>Escolha data e hora</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus />
                         <div className="p-2 border-t">
                            <Input type="time" defaultValue={field.value ? format(field.value, "HH:mm") : "17:00"}
                            onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(':').map(Number);
                                const newDate = field.value ? new Date(field.value) : new Date();
                                newDate.setHours(hours, minutes);
                                field.onChange(newDate);
                            }}/>
                        </div>
                        </PopoverContent>
                    </Popover>
                    <FormDescription>Data final para todos os lances, se aplicável (ex: fim da 2ª praça).</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Cidade Principal do Leilão (Opcional)</FormLabel>
                        <FormControl><Input placeholder="Ex: São Paulo" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>UF (Opcional)</FormLabel>
                        <FormControl><Input placeholder="Ex: SP" {...field} maxLength={2} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>URL da Imagem de Capa (Opcional)</FormLabel>
                    <FormControl><Input type="url" placeholder="https://exemplo.com/imagem-leilao.jpg" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="documentsUrl"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>URL do Edital/Documentos (Opcional)</FormLabel>
                    <FormControl><Input type="url" placeholder="https://exemplo.com/edital.pdf" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="sellingBranch"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Filial de Venda (Opcional)</FormLabel>
                    <FormControl><Input placeholder="Ex: Matriz SP, Filial RJ" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/auctions')} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {submitButtonText}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

    

    