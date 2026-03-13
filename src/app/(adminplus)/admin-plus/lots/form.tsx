/**
 * Form component for Creating/Editing a Lot (Admin Plus CRUD).
 * 7 FK Select dropdowns, 2 enum Selects, sectioned layout.
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';
import { lotSchema, LOT_STATUSES, LOT_SALE_MODES } from './schema';
import type { LotRow } from './types';
import { listAuctions } from '../auctions/actions';
import { listAuctioneers } from '../auctioneers/actions';
import { listLotCategories } from '../lot-categories/actions';
import { listSubcategories } from '../subcategories/actions';
import { listCitiesAction } from '../cities/actions';
import { listStatesAction } from '../states/actions';
import { listSellers } from '../sellers/actions';

type LotFormValues = z.infer<typeof lotSchema>;

interface LotFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: LotFormValues) => Promise<void>;
  defaultValues?: Partial<LotRow>;
  isSubmitting?: boolean;
}

interface FKOption {
  id: string;
  label: string;
}

export function LotForm({ open, onOpenChange, onSubmit, defaultValues, isSubmitting }: LotFormProps) {
  const isEditing = Boolean(defaultValues?.id);

  const form = useForm<LotFormValues>({
    resolver: zodResolver(lotSchema),
    defaultValues: {
      title: '',
      price: 0,
      status: 'EM_BREVE',
      type: '',
      auctionId: '',
      auctioneerId: '',
      lotCategoryId: '',
      subcategoryId: '',
      cityId: '',
      stateId: '',
      sellerId: '',
      saleMode: '',
      condition: '',
      description: '',
      imageUrl: '',
      slug: '',
      number: undefined,
      initialPrice: undefined,
      secondInitialPrice: undefined,
      bidIncrementStep: undefined,
      mapAddress: '',
      latitude: undefined,
      longitude: undefined,
      requiresDepositGuarantee: false,
      depositGuaranteeAmount: undefined,
      depositGuaranteeInfo: '',
      isFeatured: false,
      isExclusive: false,
      discountPercentage: undefined,
    },
  });

  const [auctions, setAuctions] = useState<FKOption[]>([]);
  const [auctioneers, setAuctioneers] = useState<FKOption[]>([]);
  const [categories, setCategories] = useState<FKOption[]>([]);
  const [subcategories, setSubcategories] = useState<FKOption[]>([]);
  const [cities, setCities] = useState<FKOption[]>([]);
  const [states, setStates] = useState<FKOption[]>([]);
  const [sellers, setSellers] = useState<FKOption[]>([]);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      listAuctions({ page: 1, pageSize: 500 }),
      listAuctioneers({ page: 1, pageSize: 500 }),
      listLotCategories({ page: 1, pageSize: 500 }),
      listSubcategories({ page: 1, pageSize: 500 }),
      listCitiesAction({ page: 1, pageSize: 1000 }),
      listStatesAction({ page: 1, pageSize: 100 }),
      listSellers({ page: 1, pageSize: 500 }),
    ]).then(([aRes, auRes, cRes, scRes, ciRes, stRes, seRes]) => {
      if (aRes.success && aRes.data) setAuctions(aRes.data.data.map((r: Record<string, unknown>) => ({ id: String(r.id), label: String((r as Record<string, unknown>).title ?? (r as Record<string, unknown>).name ?? r.id) })));
      if (auRes.success && auRes.data) setAuctioneers(auRes.data.data.map((r: Record<string, unknown>) => ({ id: String(r.id), label: String((r as Record<string, unknown>).name ?? r.id) })));
      if (cRes.success && cRes.data) setCategories(cRes.data.data.map((r: Record<string, unknown>) => ({ id: String(r.id), label: String((r as Record<string, unknown>).name ?? r.id) })));
      if (scRes.success && scRes.data) setSubcategories(scRes.data.data.map((r: Record<string, unknown>) => ({ id: String(r.id), label: String((r as Record<string, unknown>).name ?? r.id) })));
      if (ciRes.success && ciRes.data) setCities(ciRes.data.data.map((r: Record<string, unknown>) => ({ id: String(r.id), label: String((r as Record<string, unknown>).name ?? r.id) })));
      if (stRes.success && stRes.data) setStates(stRes.data.data.map((r: Record<string, unknown>) => ({ id: String(r.id), label: `${(r as Record<string, unknown>).name} (${(r as Record<string, unknown>).uf})` })));
      if (seRes.success && seRes.data) setSellers(seRes.data.data.map((r: Record<string, unknown>) => ({ id: String(r.id), label: String((r as Record<string, unknown>).name ?? r.id) })));
    });
  }, [open]);

  useEffect(() => {
    if (open && defaultValues) {
      form.reset({
        title: defaultValues.title ?? '',
        price: defaultValues.price ?? 0,
        status: defaultValues.status ?? 'EM_BREVE',
        type: defaultValues.type ?? '',
        auctionId: defaultValues.auctionId ?? '',
        auctioneerId: defaultValues.auctioneerId ?? '',
        lotCategoryId: defaultValues.lotCategoryId ?? '',
        subcategoryId: defaultValues.subcategoryId ?? '',
        cityId: defaultValues.cityId ?? '',
        stateId: defaultValues.stateId ?? '',
        sellerId: defaultValues.sellerId ?? '',
        saleMode: defaultValues.saleMode ?? '',
        condition: defaultValues.condition ?? '',
        description: defaultValues.description ?? '',
        imageUrl: defaultValues.imageUrl ?? '',
        slug: defaultValues.slug ?? '',
        number: defaultValues.number ?? undefined,
        initialPrice: defaultValues.initialPrice ?? undefined,
        secondInitialPrice: defaultValues.secondInitialPrice ?? undefined,
        bidIncrementStep: defaultValues.bidIncrementStep ?? undefined,
        mapAddress: defaultValues.mapAddress ?? '',
        latitude: defaultValues.latitude ?? undefined,
        longitude: defaultValues.longitude ?? undefined,
        requiresDepositGuarantee: defaultValues.requiresDepositGuarantee ?? false,
        depositGuaranteeAmount: defaultValues.depositGuaranteeAmount ?? undefined,
        depositGuaranteeInfo: defaultValues.depositGuaranteeInfo ?? '',
        isFeatured: defaultValues.isFeatured ?? false,
        isExclusive: defaultValues.isExclusive ?? false,
        discountPercentage: defaultValues.discountPercentage ?? undefined,
      });
    } else if (open) {
      form.reset();
    }
  }, [open, defaultValues, form]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto" data-ai-id="lot-form-sheet">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Editar Lote' : 'Novo Lote'}</SheetTitle>
        </SheetHeader>

        <CrudFormShell form={form} onSubmit={onSubmit} isSubmitting={isSubmitting}>
          {/* === Dados Básicos === */}
          <Field label="Título *" name="title" form={form}>
            <Input {...form.register('title')} placeholder="Título do lote" data-ai-id="lot-title-input" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tipo *" name="type" form={form}>
              <Input {...form.register('type')} placeholder="Tipo (ex: Imóvel, Veículo)" data-ai-id="lot-type-input" />
            </Field>
            <Field label="Número" name="number" form={form}>
              <Input type="number" {...form.register('number', { valueAsNumber: true })} placeholder="Nº do lote" data-ai-id="lot-number-input" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Status *" name="status" form={form}>
              <Select value={form.watch('status')} onValueChange={(v) => form.setValue('status', v)}>
                <SelectTrigger data-ai-id="lot-status-select">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {LOT_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Modo de Venda" name="saleMode" form={form}>
              <Select value={form.watch('saleMode') ?? ''} onValueChange={(v) => form.setValue('saleMode', v)}>
                <SelectTrigger data-ai-id="lot-sale-mode-select">
                  <SelectValue placeholder="Modo de venda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {LOT_SALE_MODES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Descrição" name="description" form={form}>
            <Textarea {...form.register('description')} placeholder="Descrição detalhada..." rows={3} data-ai-id="lot-description-input" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Slug" name="slug" form={form}>
              <Input {...form.register('slug')} placeholder="slug-do-lote" data-ai-id="lot-slug-input" />
            </Field>
            <Field label="Condição" name="condition" form={form}>
              <Input {...form.register('condition')} placeholder="Novo, Usado, etc." data-ai-id="lot-condition-input" />
            </Field>
          </div>

          <Field label="URL da Imagem" name="imageUrl" form={form}>
            <Input {...form.register('imageUrl')} placeholder="https://..." data-ai-id="lot-image-url-input" />
          </Field>

          {/* === Vínculos === */}
          <Separator className="my-4" />
          <h3 className="text-sm font-semibold text-muted-foreground">Vínculos</h3>

          <Field label="Leilão *" name="auctionId" form={form}>
            <Select value={form.watch('auctionId')} onValueChange={(v) => form.setValue('auctionId', v)}>
              <SelectTrigger data-ai-id="lot-auction-select">
                <SelectValue placeholder="Selecione o leilão" />
              </SelectTrigger>
              <SelectContent>
                {auctions.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Leiloeiro" name="auctioneerId" form={form}>
              <Select value={form.watch('auctioneerId') ?? ''} onValueChange={(v) => form.setValue('auctioneerId', v)}>
                <SelectTrigger data-ai-id="lot-auctioneer-select">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {auctioneers.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Vendedor" name="sellerId" form={form}>
              <Select value={form.watch('sellerId') ?? ''} onValueChange={(v) => form.setValue('sellerId', v)}>
                <SelectTrigger data-ai-id="lot-seller-select">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {sellers.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Categoria" name="lotCategoryId" form={form}>
              <Select value={form.watch('lotCategoryId') ?? ''} onValueChange={(v) => form.setValue('lotCategoryId', v)}>
                <SelectTrigger data-ai-id="lot-category-select">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {categories.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Subcategoria" name="subcategoryId" form={form}>
              <Select value={form.watch('subcategoryId') ?? ''} onValueChange={(v) => form.setValue('subcategoryId', v)}>
                <SelectTrigger data-ai-id="lot-subcategory-select">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {subcategories.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* === Preços === */}
          <Separator className="my-4" />
          <h3 className="text-sm font-semibold text-muted-foreground">Preços</h3>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Preço *" name="price" form={form}>
              <Input type="number" step="0.01" {...form.register('price', { valueAsNumber: true })} data-ai-id="lot-price-input" />
            </Field>
            <Field label="Preço Inicial" name="initialPrice" form={form}>
              <Input type="number" step="0.01" {...form.register('initialPrice', { valueAsNumber: true })} data-ai-id="lot-initial-price-input" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="2º Lance Inicial" name="secondInitialPrice" form={form}>
              <Input type="number" step="0.01" {...form.register('secondInitialPrice', { valueAsNumber: true })} data-ai-id="lot-second-price-input" />
            </Field>
            <Field label="Incremento de Lance" name="bidIncrementStep" form={form}>
              <Input type="number" step="0.01" {...form.register('bidIncrementStep', { valueAsNumber: true })} data-ai-id="lot-bid-increment-input" />
            </Field>
          </div>

          <Field label="Desconto (%)" name="discountPercentage" form={form}>
            <Input type="number" step="0.01" {...form.register('discountPercentage', { valueAsNumber: true })} placeholder="0.00" data-ai-id="lot-discount-input" />
          </Field>

          {/* === Localização === */}
          <Separator className="my-4" />
          <h3 className="text-sm font-semibold text-muted-foreground">Localização</h3>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Cidade" name="cityId" form={form}>
              <Select value={form.watch('cityId') ?? ''} onValueChange={(v) => form.setValue('cityId', v)}>
                <SelectTrigger data-ai-id="lot-city-select">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {cities.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Estado" name="stateId" form={form}>
              <Select value={form.watch('stateId') ?? ''} onValueChange={(v) => form.setValue('stateId', v)}>
                <SelectTrigger data-ai-id="lot-state-select">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {states.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Endereço / Mapa" name="mapAddress" form={form}>
            <Input {...form.register('mapAddress')} placeholder="Endereço completo" data-ai-id="lot-address-input" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Latitude" name="latitude" form={form}>
              <Input type="number" step="any" {...form.register('latitude', { valueAsNumber: true })} data-ai-id="lot-lat-input" />
            </Field>
            <Field label="Longitude" name="longitude" form={form}>
              <Input type="number" step="any" {...form.register('longitude', { valueAsNumber: true })} data-ai-id="lot-lng-input" />
            </Field>
          </div>

          {/* === Depósito / Caução === */}
          <Separator className="my-4" />
          <h3 className="text-sm font-semibold text-muted-foreground">Depósito / Caução</h3>

          <div className="flex items-center gap-3">
            <Switch
              checked={form.watch('requiresDepositGuarantee')}
              onCheckedChange={(v) => form.setValue('requiresDepositGuarantee', v)}
              data-ai-id="lot-deposit-switch"
            />
            <Label>Exige depósito caução</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Valor do Depósito" name="depositGuaranteeAmount" form={form}>
              <Input type="number" step="0.01" {...form.register('depositGuaranteeAmount', { valueAsNumber: true })} data-ai-id="lot-deposit-amount-input" />
            </Field>
            <Field label="Informações do Depósito" name="depositGuaranteeInfo" form={form}>
              <Input {...form.register('depositGuaranteeInfo')} placeholder="Detalhes..." data-ai-id="lot-deposit-info-input" />
            </Field>
          </div>

          {/* === Flags === */}
          <Separator className="my-4" />
          <h3 className="text-sm font-semibold text-muted-foreground">Destaques</h3>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.watch('isFeatured')}
                onCheckedChange={(v) => form.setValue('isFeatured', v)}
                data-ai-id="lot-featured-switch"
              />
              <Label>Destaque</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.watch('isExclusive')}
                onCheckedChange={(v) => form.setValue('isExclusive', v)}
                data-ai-id="lot-exclusive-switch"
              />
              <Label>Exclusivo</Label>
            </div>
          </div>
        </CrudFormShell>
      </SheetContent>
    </Sheet>
  );
}
