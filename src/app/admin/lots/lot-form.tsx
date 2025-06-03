
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
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
import { useRouter, useSearchParams } from 'next/navigation';
import { lotFormSchema, type LotFormValues } from './lot-form-schema';
import type { Lot, LotStatus, LotCategory, Auction, StateInfo, CityInfo } from '@/types';
import { Loader2, Save, CalendarIcon, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAuctionStatusText } from '@/lib/sample-data';

interface LotFormProps {
  initialData?: Lot | null;
  categories: LotCategory[];
  auctions: Auction[];
  states: StateInfo[]; // Nova prop para estados
  allCities: CityInfo[]; // Nova prop para todas as cidades
  onSubmitAction: (data: LotFormValues) => Promise<{ success: boolean; message: string; lotId?: string }>;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
  defaultAuctionId?: string; 
}

const lotStatusOptions: { value: LotStatus; label: string }[] = [
  { value: 'EM_BREVE', label: getAuctionStatusText('EM_BREVE') },
  { value: 'ABERTO_PARA_LANCES', label: getAuctionStatusText('ABERTO_PARA_LANCES') },
  { value: 'ENCERRADO', label: getAuctionStatusText('ENCERRADO') },
  { value: 'VENDIDO', label: getAuctionStatusText('VENDIDO') },
  { value: 'NAO_VENDIDO', label: getAuctionStatusText('NAO_VENDIDO') },
];

export default function LotForm({
  initialData,
  categories,
  auctions,
  states,
  allCities,
  onSubmitAction,
  formTitle,
  formDescription,
  submitButtonText,
  defaultAuctionId,
}: LotFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [filteredCities, setFilteredCities] = React.useState<CityInfo[]>([]);

  const form = useForm<LotFormValues>({
    resolver: zodResolver(lotFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      auctionId: defaultAuctionId || initialData?.auctionId || '',
      auctionName: initialData?.auctionName || '',
      description: initialData?.description || '',
      price: initialData?.price || 0,
      initialPrice: initialData?.initialPrice || undefined,
      status: initialData?.status || 'EM_BREVE',
      stateId: initialData?.stateId || undefined,
      cityId: initialData?.cityId || undefined,
      type: initialData?.type || '',
      imageUrl: initialData?.imageUrl || '',
      endDate: initialData?.endDate ? new Date(initialData.endDate) : new Date(),
      lotSpecificAuctionDate: initialData?.lotSpecificAuctionDate ? new Date(initialData.lotSpecificAuctionDate) : null,
      secondAuctionDate: initialData?.secondAuctionDate ? new Date(initialData.secondAuctionDate) : null,
      secondInitialPrice: initialData?.secondInitialPrice || null,
      views: initialData?.views || 0,
      bidsCount: initialData?.bidsCount || 0,
    },
  });

  const selectedStateId = form.watch('stateId');

  React.useEffect(() => {
    if (defaultAuctionId) {
      form.setValue('auctionId', defaultAuctionId);
      const selectedAuction = auctions.find(a => a.id === defaultAuctionId);
      if (selectedAuction) {
        form.setValue('auctionName', selectedAuction.title);
      }
    }
  }, [defaultAuctionId, form, auctions]);

  React.useEffect(() => {
    if (selectedStateId) {
      setFilteredCities(allCities.filter(city => city.stateId === selectedStateId));
      // Se o estado mudar e a cidade selecionada anteriormente não pertencer ao novo estado, limpe-a.
      const currentCityId = form.getValues('cityId');
      if (currentCityId && !allCities.find(c => c.id === currentCityId && c.stateId === selectedStateId)) {
        form.setValue('cityId', undefined);
      }
    } else {
      setFilteredCities([]);
      form.setValue('cityId', undefined);
    }
  }, [selectedStateId, allCities, form]);

  // On initial load with initialData, filter cities for the pre-selected state
  React.useEffect(() => {
    if (initialData?.stateId && allCities.length > 0) {
      setFilteredCities(allCities.filter(city => city.stateId === initialData.stateId));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.stateId, allCities]); // Only run once on initial load with initialData

  async function onSubmit(values: LotFormValues) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(values);
      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: result.message,
        });
        router.push('/admin/lots');
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
      console.error("Unexpected error in lot form:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-3xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Package className="h-6 w-6 text-primary"/>{formTitle}</CardTitle>
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
                  <FormLabel>Título do Lote</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Carro Ford Ka 2019" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="auctionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leilão Associado</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      const selectedAuction = auctions.find(a => a.id === value);
                      form.setValue('auctionName', selectedAuction?.title || '');
                    }}
                    value={field.value}
                    disabled={!!defaultAuctionId && initialData?.auctionId === defaultAuctionId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o leilão" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {auctions.length === 0 ? (
                        <p className="p-2 text-sm text-muted-foreground">Nenhum leilão cadastrado</p>
                      ) : (
                        auctions.map(auction => (
                          <SelectItem key={auction.id} value={auction.id}>{auction.title} (ID: ...{auction.id.slice(-6)})</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>Associe este lote a um leilão existente.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="auctionName"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormLabel>Nome do Leilão (Automático)</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly />
                  </FormControl>
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
                    <Textarea placeholder="Detalhes sobre o lote..." {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (Lance Inicial/Atual)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ex: 15000.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="initialPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lance Inicial Base (Opcional)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ex: 14500.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className="grid md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status do Lote</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {lotStatusOptions.map(option => (
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
                name="type" /* Categoria do Lote */
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tipo/Categoria do Lote</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo/categoria" />
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
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                 <FormField
                    control={form.control}
                    name="stateId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Estado (Opcional)</FormLabel>
                        <Select onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('cityId', undefined); // Reset city when state changes
                        }} value={field.value || ''}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Selecione o estado" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="">Nenhum</SelectItem>
                            {states.map(state => (
                                <SelectItem key={state.id} value={state.id}>{state.name} ({state.uf})</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="cityId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Cidade (Opcional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''} disabled={!selectedStateId || filteredCities.length === 0}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder={!selectedStateId ? "Selecione um estado primeiro" : "Selecione a cidade"} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="">Nenhuma</SelectItem>
                            {filteredCities.map(city => (
                            <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        {!selectedStateId && <FormDescription className="text-xs">Selecione um estado para ver as cidades.</FormDescription>}
                        {selectedStateId && filteredCities.length === 0 && <FormDescription className="text-xs">Nenhuma cidade cadastrada para este estado.</FormDescription>}
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
                  <FormLabel>URL da Imagem Principal (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://exemplo.com/imagem.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Encerramento do Lote</FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="lotSpecificAuctionDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Data 1ª Praça/Leilão (Opcional)</FormLabel>
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
                            <Input type="time" defaultValue={field.value ? format(field.value, "HH:mm") : "10:00"}
                            onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(':').map(Number);
                                const newDate = field.value ? new Date(field.value) : new Date();
                                newDate.setHours(hours, minutes);
                                field.onChange(newDate);
                            }}/>
                        </div>
                        </PopoverContent>
                    </Popover>
                    <FormDescription>Data específica da primeira praça deste lote.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                    control={form.control}
                    name="secondInitialPrice"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Lance Inicial 2ª Praça (Opcional)</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="Ex: 10000.00" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            <FormField
            control={form.control}
            name="secondAuctionDate"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Data 2ª Praça/Leilão (Opcional)</FormLabel>
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
                        <Input type="time" defaultValue={field.value ? format(field.value, "HH:mm") : "10:00"}
                        onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(':').map(Number);
                            const newDate = field.value ? new Date(field.value) : new Date();
                            newDate.setHours(hours, minutes);
                            field.onChange(newDate);
                        }}/>
                    </div>
                    </PopoverContent>
                </Popover>
                <FormDescription>Data específica da segunda praça deste lote, se aplicável.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />

            <div className="grid md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="views"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Visualizações (Opcional)</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="bidsCount"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Contagem de Lances (Opcional)</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>

          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/lots')} disabled={isSubmitting}>
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

    