/**
 * Formulário de criação/edição de DirectSaleOffer (Oferta de Venda Direta).
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';

import { directSaleOfferSchema, OFFER_TYPE_OPTIONS, OFFER_STATUS_OPTIONS } from './schema';
import type { DirectSaleOfferRow } from './types';
import { listLotCategories } from '../lot-categories/actions';
import { listSellers } from '../sellers/actions';

type FormValues = z.infer<typeof directSaleOfferSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormValues) => Promise<void>;
  defaultValues?: DirectSaleOfferRow | null;
}

export function DirectSaleOfferForm({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [sellers, setSellers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(directSaleOfferSchema),
    defaultValues: {
      title: '',
      description: '',
      offerType: 'BUY_NOW',
      price: '',
      minimumOfferPrice: '',
      status: 'ACTIVE',
      locationCity: '',
      locationState: '',
      imageUrl: '',
      expiresAt: '',
      categoryId: '',
      sellerId: '',
      sellerName: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    if (defaultValues) {
      form.reset({
        title: defaultValues.title,
        description: defaultValues.description,
        offerType: defaultValues.offerType,
        price: defaultValues.price != null ? String(defaultValues.price) : '',
        minimumOfferPrice: defaultValues.minimumOfferPrice != null ? String(defaultValues.minimumOfferPrice) : '',
        status: defaultValues.status,
        locationCity: defaultValues.locationCity,
        locationState: defaultValues.locationState,
        imageUrl: defaultValues.imageUrl,
        expiresAt: defaultValues.expiresAt ? defaultValues.expiresAt.substring(0, 10) : '',
        categoryId: defaultValues.categoryId,
        sellerId: defaultValues.sellerId,
        sellerName: defaultValues.sellerName,
      });
    } else {
      form.reset({
        title: '',
        description: '',
        offerType: 'BUY_NOW',
        price: '',
        minimumOfferPrice: '',
        status: 'ACTIVE',
        locationCity: '',
        locationState: '',
        imageUrl: '',
        expiresAt: '',
        categoryId: '',
        sellerId: '',
        sellerName: '',
      });
    }
    // Load FK data
    listLotCategories({ page: 1, pageSize: 500 }).then((res) => {
      if (res.success && res.data?.data) setCategories(res.data.data.map((c: any) => ({ id: c.id, name: c.name })));
    });
    listSellers({ page: 1, pageSize: 500 }).then((res) => {
      if (res.success && res.data?.data) setSellers(res.data.data.map((s: any) => ({ id: s.id, name: s.companyName || s.name || s.id })));
    });
  }, [open, defaultValues, form]);

  const handleSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      await onSubmit(values);
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = form.watch('categoryId');
  const selectedSeller = form.watch('sellerId');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto" data-ai-id="direct-sale-offer-form-sheet">
        <SheetHeader>
          <SheetTitle>{defaultValues ? 'Editar Oferta' : 'Nova Oferta de Venda Direta'}</SheetTitle>
        </SheetHeader>

        <CrudFormShell form={form} onSubmit={handleSubmit}>
          {/* Identificação */}
          <Field label="Título" name="title" error={form.formState.errors.title}>
            <Input {...form.register('title')} data-ai-id="direct-sale-offer-title" />
          </Field>

          <Field label="Descrição" name="description" error={form.formState.errors.description}>
            <Textarea {...form.register('description')} rows={3} data-ai-id="direct-sale-offer-description" />
          </Field>

          <Separator />

          {/* Classificação */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tipo de Oferta" name="offerType" error={form.formState.errors.offerType}>
              <Select value={form.watch('offerType')} onValueChange={(v) => form.setValue('offerType', v, { shouldValidate: true })}>
                <SelectTrigger data-ai-id="direct-sale-offer-type-select">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {OFFER_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Status" name="status" error={form.formState.errors.status}>
              <Select value={form.watch('status')} onValueChange={(v) => form.setValue('status', v, { shouldValidate: true })}>
                <SelectTrigger data-ai-id="direct-sale-offer-status-select">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {OFFER_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Separator />

          {/* Valores */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Preço (R$)" name="price" error={form.formState.errors.price}>
              <Input type="number" step="0.01" {...form.register('price')} data-ai-id="direct-sale-offer-price" />
            </Field>
            <Field label="Preço Mínimo (R$)" name="minimumOfferPrice" error={form.formState.errors.minimumOfferPrice}>
              <Input type="number" step="0.01" {...form.register('minimumOfferPrice')} data-ai-id="direct-sale-offer-min-price" />
            </Field>
          </div>

          <Separator />

          {/* Localização */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Cidade" name="locationCity" error={form.formState.errors.locationCity}>
              <Input {...form.register('locationCity')} data-ai-id="direct-sale-offer-city" />
            </Field>
            <Field label="Estado" name="locationState" error={form.formState.errors.locationState}>
              <Input {...form.register('locationState')} data-ai-id="direct-sale-offer-state" />
            </Field>
          </div>

          <Separator />

          {/* Vínculos */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Categoria" name="categoryId" error={form.formState.errors.categoryId}>
              <Select value={selectedCategory} onValueChange={(v) => form.setValue('categoryId', v, { shouldValidate: true })}>
                <SelectTrigger data-ai-id="direct-sale-offer-category-select">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Vendedor" name="sellerId" error={form.formState.errors.sellerId}>
              <Select value={selectedSeller} onValueChange={(v) => form.setValue('sellerId', v, { shouldValidate: true })}>
                <SelectTrigger data-ai-id="direct-sale-offer-seller-select">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {sellers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Nome do Vendedor (exibição)" name="sellerName" error={form.formState.errors.sellerName}>
            <Input {...form.register('sellerName')} data-ai-id="direct-sale-offer-seller-name" />
          </Field>

          <Separator />

          {/* Imagem e Expiração */}
          <Field label="URL da Imagem" name="imageUrl" error={form.formState.errors.imageUrl}>
            <Input {...form.register('imageUrl')} data-ai-id="direct-sale-offer-image-url" />
          </Field>

          <Field label="Expira em" name="expiresAt" error={form.formState.errors.expiresAt}>
            <Input type="date" {...form.register('expiresAt')} data-ai-id="direct-sale-offer-expires" />
          </Field>

          <SheetFooter className="pt-4">
            <Button type="submit" disabled={loading} data-ai-id="direct-sale-offer-submit">
              {loading ? 'Salvando...' : defaultValues ? 'Atualizar' : 'Criar'}
            </Button>
          </SheetFooter>
        </CrudFormShell>
      </SheetContent>
    </Sheet>
  );
}
