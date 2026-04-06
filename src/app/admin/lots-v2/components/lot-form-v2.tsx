// src/app/admin/lots-v2/components/lot-form-v2.tsx
/**
 * @fileoverview Formulário de Lote V2 com React Hook Form + Zod.
 * Organizado em seções com abas para melhor usabilidade.
 * Suporta modo criação e edição com feedback visual imediato.
 */
'use client';

import React, { useTransition, useCallback, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Loader2,
  Save,
  Package,
  Banknote,
  MapPin,
  Settings,
  Star,
  ArrowLeft,
} from 'lucide-react';

import { lotFormSchemaV2, type LotFormValuesV2, LOT_STATUS_LABELS } from '../lot-form-schema-v2';
import { lotStatusValues as allLotStatusValues } from '@/lib/zod-enums';
import { formatCurrency, toMonetaryNumber } from '@/lib/format';
import type { Lot, Auction, LotCategory, StateInfo, CityInfo } from '@/types';
import { cn } from '@/lib/utils';

// ─── Props ──────────────────────────────────────────────────────────────────

interface LotFormV2Props {
  initialData?: Lot | null;
  auctions: Auction[];
  categories: LotCategory[];
  states: StateInfo[];
  allCities: CityInfo[];
  onSubmit: (data: LotFormValuesV2) => Promise<{ success: boolean; message: string }>;
  submitLabel?: string;
  isLoading?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// formatCurrency and toMonetaryNumber are imported from @/lib/format
// ─── Component ───────────────────────────────────────────────────────────────

export default function LotFormV2({
  initialData,
  auctions,
  categories,
  states,
  allCities,
  onSubmit,
  submitLabel = 'Salvar Lote',
  isLoading: externalLoading = false,
}: LotFormV2Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selectedStateId, setSelectedStateId] = useState<string>(initialData?.stateId ?? '');
  const [filteredCities, setFilteredCities] = useState<CityInfo[]>([]);

  const isLoading = isPending || externalLoading;

  // Filter cities based on selected state
  useEffect(() => {
    if (selectedStateId) {
      setFilteredCities(allCities.filter((c) => c.stateId === selectedStateId));
    } else {
      setFilteredCities(allCities);
    }
  }, [selectedStateId, allCities]);

  const form = useForm<LotFormValuesV2>({
    resolver: zodResolver(lotFormSchemaV2),
    defaultValues: {
      title: initialData?.title ?? '',
      number: initialData?.number ?? '',
      description: initialData?.description ?? '',
      auctionId: initialData?.auctionId ?? '',
      status: (initialData?.status as string) ?? 'RASCUNHO',
      type: initialData?.type ?? '',
      categoryId: initialData?.categoryId ?? '',
      subcategoryId: initialData?.subcategoryId ?? '',
      price: initialData?.price ?? 0,
      initialPrice: initialData?.initialPrice ?? undefined,
      bidIncrementStep: initialData?.bidIncrementStep ?? undefined,
      stateId: initialData?.stateId ?? '',
      cityId: initialData?.cityId ?? '',
      mapAddress: initialData?.mapAddress ?? '',
      latitude: initialData?.latitude ?? undefined,
      longitude: initialData?.longitude ?? undefined,
      sellerId: initialData?.sellerId ?? '',
      auctioneerId: initialData?.auctioneerId ?? '',
      imageUrl: initialData?.imageUrl ?? '',
      imageMediaId: initialData?.imageMediaId ? String(initialData.imageMediaId) : '',
      isFeatured: initialData?.isFeatured ?? false,
      isExclusive: initialData?.isExclusive ?? false,
      dataAiHint: initialData?.dataAiHint ?? '',
    },
  });

  const controlAny = form.control as any;
  const handleSubmit = useCallback(
    (values: LotFormValuesV2) => {
      startTransition(async () => {
        try {
          const result = await onSubmit(values);
          if (result.success) {
            toast({ title: 'Sucesso!', description: result.message });
          } else {
            toast({ title: 'Erro', description: result.message, variant: 'destructive' });
          }
        } catch (error) {
          toast({
            title: 'Erro inesperado',
            description: 'Tente novamente mais tarde.',
            variant: 'destructive',
          });
        }
      });
    },
    [onSubmit, toast],
  );

  const currentStatus = form.watch('status');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit as any)} className="space-y-6">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              'text-sm',
              currentStatus === 'ABERTO_PARA_LANCES' && 'border-emerald-500 text-emerald-700',
              currentStatus === 'VENDIDO' && 'border-indigo-500 text-indigo-700',
              currentStatus === 'CANCELADO' && 'border-destructive text-destructive',
              currentStatus === 'RASCUNHO' && 'border-muted-foreground text-muted-foreground',
            )}
          >
            {LOT_STATUS_LABELS[currentStatus] ?? currentStatus}
          </Badge>
          {initialData && (
            <span className="text-xs text-muted-foreground">
              ID: {initialData.publicId || initialData.id}
            </span>
          )}
        </div>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">
              <Package className="h-4 w-4 mr-1.5" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="pricing">
              <Banknote className="h-4 w-4 mr-1.5" />
              Valores
            </TabsTrigger>
            <TabsTrigger value="location">
              <MapPin className="h-4 w-4 mr-1.5" />
              Localização
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-1.5" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* ─── Aba: Informações ─────────────────────────────────── */}
          <TabsContent value="info" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dados Principais</CardTitle>
                <CardDescription>Título, número e descrição do lote.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <FormField
                    control={controlAny}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do Lote</FormLabel>
                        <FormControl>
                          <Input placeholder="001" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="col-span-3">
                    <FormField
                      control={controlAny}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Apartamento 3 Quartos, Centro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={controlAny}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o lote detalhadamente..."
                          className="min-h-[120px] resize-y"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription>Máximo 5.000 caracteres.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Associação e Classificação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={controlAny}
                    name="auctionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Leilão *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o leilão" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {auctions.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={controlAny}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {allLotStatusValues.map((s) => (
                              <SelectItem key={s} value={s}>
                                {LOT_STATUS_LABELS[s] ?? s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={controlAny}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo / Categoria *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Imóvel, Veículo, Máquina..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={controlAny}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Nenhuma</SelectItem>
                            {categories.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Aba: Valores ─────────────────────────────────────── */}
          <TabsContent value="pricing" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Precificação</CardTitle>
                <CardDescription>
                  Lance mínimo, avaliação e incremento de lances.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={controlAny}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lance Mínimo (R$) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0,00"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Valor inicial para lances.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={controlAny}
                    name="initialPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avaliação (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0,00"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === '' ? null : parseFloat(e.target.value),
                              )
                            }
                          />
                        </FormControl>
                        <FormDescription>Valor de avaliação do bem.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={controlAny}
                    name="bidIncrementStep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incremento (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0,00"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === '' ? null : parseFloat(e.target.value),
                              )
                            }
                          />
                        </FormControl>
                        <FormDescription>Incremento mínimo entre lances.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Preview de preços */}
                {form.watch('price') > 0 && (
                  <div className="rounded-lg bg-muted p-3 flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Lance mínimo: </span>
                      <span className="font-semibold">
                        {formatCurrency(form.watch('price'))}
                      </span>
                    </div>
                    {form.watch('initialPrice') != null && (
                      <div>
                        <span className="text-muted-foreground">Avaliação: </span>
                        <span className="font-semibold">
                          {formatCurrency(form.watch('initialPrice'))}
                        </span>
                      </div>
                    )}
                    {form.watch('initialPrice') != null &&
                      form.watch('price') > 0 && (
                        <div>
                          <span className="text-muted-foreground">Deságio: </span>
                          <span className="font-semibold text-emerald-600">
                            {(
                              ((toMonetaryNumber(form.watch('initialPrice')) - toMonetaryNumber(form.watch('price'))) /
                                toMonetaryNumber(form.watch('initialPrice'))) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                      )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Aba: Localização ──────────────────────────────────── */}
          <TabsContent value="location" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Localização</CardTitle>
                <CardDescription>Estado, cidade e endereço do bem.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={controlAny}
                    name="stateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select
                          onValueChange={(v) => {
                            field.onChange(v);
                            setSelectedStateId(v);
                            form.setValue('cityId', '');
                          }}
                          value={field.value ?? ''}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Todos os estados</SelectItem>
                            {states.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name} ({(s as any).abbreviation})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={controlAny}
                    name="cityId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ''}
                          disabled={filteredCities.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  filteredCities.length === 0
                                    ? 'Selecione o estado primeiro'
                                    : 'Selecione a cidade'
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Nenhuma cidade</SelectItem>
                            {filteredCities.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={controlAny}
                  name="mapAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Rua, número, bairro..."
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={controlAny}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.000001"
                            placeholder="-23.550520"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === '' ? null : parseFloat(e.target.value),
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={controlAny}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.000001"
                            placeholder="-46.633308"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === '' ? null : parseFloat(e.target.value),
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Aba: Configurações ──────────────────────────────────── */}
          <TabsContent value="settings" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configurações Avançadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-4">
                  <FormField
                    control={controlAny}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <FormLabel className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            Lote em Destaque
                          </FormLabel>
                          <FormDescription>
                            Exibe este lote com destaque visual na listagem.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={controlAny}
                    name="isExclusive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <FormLabel>Lote Exclusivo</FormLabel>
                          <FormDescription>
                            Marca o lote como oportunidade exclusiva.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <FormField
                  control={controlAny}
                  name="dataAiHint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dica para IA (SEO)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: apartamento centro urbano, 3 quartos"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Palavras-chave para geração de imagem por IA. Máximo 100 caracteres.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ─── Ações do formulário ──────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancelar
          </Button>

          <Button type="submit" disabled={isLoading} className="min-w-[140px]">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {submitLabel}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
