
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
import { useRouter, useSearchParams } from 'next/navigation';
import { lotFormSchema, type LotFormValues } from './lot-form-schema';
import type { Lot, LotStatus, LotCategory, Auction } from '@/types';
import { Loader2, Save, CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAuctionStatusText } from '@/lib/sample-data';

interface LotFormProps {
  initialData?: Lot | null;
  categories: LotCategory[];
  auctions: Auction[]; // Nova prop para listar leilões
  onSubmitAction: (data: LotFormValues) => Promise<{ success: boolean; message: string; lotId?: string }>;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
  defaultAuctionId?: string; // Para pré-selecionar vindo de query params
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
  auctions, // Recebe a lista de leilões
  onSubmitAction,
  formTitle,
  formDescription,
  submitButtonText,
  defaultAuctionId,
}: LotFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
      location: initialData?.location || '',
      type: initialData?.type || '',
      imageUrl: initialData?.imageUrl || '',
      endDate: initialData?.endDate ? new Date(initialData.endDate) : new Date(),
      views: initialData?.views || 0,
      bidsCount: initialData?.bidsCount || 0,
    },
  });

  React.useEffect(() => {
    if (defaultAuctionId) {
      form.setValue('auctionId', defaultAuctionId);
      const selectedAuction = auctions.find(a => a.id === defaultAuctionId);
      if (selectedAuction) {
        form.setValue('auctionName', selectedAuction.title);
      }
    }
  }, [defaultAuctionId, form, auctions]);

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
        <CardTitle>{formTitle}</CardTitle>
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
                    disabled={!!defaultAuctionId && initialData?.auctionId === defaultAuctionId} // Desabilita se pré-selecionado e não for edição
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
                <FormItem className="hidden"> {/* Campo escondido, preenchido automaticamente */}
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
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tipo/Categoria do Lote</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo/categoria do lote" />
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
                    name="location"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Localização (Opcional)</FormLabel>
                        <FormControl>
                        <Input placeholder="Ex: São Paulo - SP" {...field} />
                        </FormControl>
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
                  <FormLabel>Data de Encerramento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP HH:mm:ss", { locale: ptBR })
                          ) : (
                            <span>Escolha uma data e hora</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) }
                      />
                       <div className="p-2 border-t">
                        <Input
                          type="time"
                          defaultValue={field.value ? format(field.value, "HH:mm") : "00:00"}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(':').map(Number);
                            const newDate = field.value ? new Date(field.value) : new Date();
                            newDate.setHours(hours, minutes);
                            field.onChange(newDate);
                          }}
                        />
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
