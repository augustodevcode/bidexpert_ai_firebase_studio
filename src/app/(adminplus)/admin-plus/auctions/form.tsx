/**
 * @fileoverview Formulário de Auction — Admin Plus.
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  auctionSchema, type AuctionSchema,
  AUCTION_STATUSES, AUCTION_TYPES, AUCTION_METHODS, AUCTION_PARTICIPATIONS,
} from './schema';
import type { AuctionRow } from './types';
import { listAuctioneers } from '../auctioneers/actions';
import { listSellers } from '../sellers/actions';
import { listLotCategories } from '../lot-categories/actions';
import { listCitiesAction } from '../cities/actions';
import { listStatesAction } from '../states/actions';
import { listJudicialProcesses } from '../judicial-processes/actions';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AuctionSchema) => Promise<void>;
  defaultValues?: AuctionRow | null;
}

export function AuctionForm({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const isEdit = !!defaultValues;
  const [auctioneers, setAuctioneers] = useState<{ id: string; name: string }[]>([]);
  const [sellers, setSellers] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [states, setStates] = useState<{ id: string; name: string }[]>([]);
  const [processes, setProcesses] = useState<{ id: string; name: string }[]>([]);

  const form = useForm<AuctionSchema>({
    resolver: zodResolver(auctionSchema),
    defaultValues: {
      title: '', slug: '', description: '', status: '', auctionType: '',
      auctionMethod: '', participation: '', auctionDate: '', endDate: '',
      initialOffer: '', onlineUrl: '', address: '', zipCode: '',
      isFeaturedOnMarketplace: false, auctioneerId: '', sellerId: '',
      categoryId: '', cityId: '', stateId: '', judicialProcessId: '',
      supportPhone: '', supportEmail: '', supportWhatsApp: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      const [aR, sR, cR, ciR, stR, pR] = await Promise.all([
        listAuctioneers({ page: 1, pageSize: 500 }),
        listSellers({ page: 1, pageSize: 500 }),
        listLotCategories({ page: 1, pageSize: 200 }),
        listCitiesAction({ page: 1, pageSize: 500 }),
        listStatesAction({ page: 1, pageSize: 500 }),
        listJudicialProcesses({ page: 1, pageSize: 500 }),
      ]);
      const m = (r: any, nameField = 'name') =>
        r?.success && r.data
          ? r.data.data
            ? r.data.data.map(
                (x: any) => ({ id: String(x.id), name: String(x[nameField] ?? x.name ?? '') })
              )
            : []
          : [];
      setAuctioneers(m(aR));
      setSellers(m(sR));
      setCategories(m(cR));
      setCities(m(ciR));
      setStates(m(stR));
      setProcesses(
        pR?.success && pR.data?.data
          ? pR.data.data.map((x) => ({
              id: String(x.id),
              name: String((x as any).processNumber ?? ''),
            }))
          : [],
      );
    };
    load();
  }, [open]);

  useEffect(() => {
    if (open && defaultValues) {
      form.reset({
        title: defaultValues.title ?? '',
        slug: defaultValues.slug ?? '',
        description: defaultValues.description ?? '',
        status: defaultValues.status ?? '',
        auctionType: defaultValues.auctionType ?? '',
        auctionMethod: defaultValues.auctionMethod ?? '',
        participation: defaultValues.participation ?? '',
        auctionDate: defaultValues.auctionDate ? defaultValues.auctionDate.slice(0, 16) : '',
        endDate: defaultValues.endDate ? defaultValues.endDate.slice(0, 16) : '',
        initialOffer: defaultValues.initialOffer != null ? String(defaultValues.initialOffer) : '',
        onlineUrl: defaultValues.onlineUrl ?? '',
        address: defaultValues.address ?? '',
        zipCode: defaultValues.zipCode ?? '',
        isFeaturedOnMarketplace: defaultValues.isFeaturedOnMarketplace ?? false,
        auctioneerId: defaultValues.auctioneerId ?? '',
        sellerId: defaultValues.sellerId ?? '',
        categoryId: defaultValues.categoryId ?? '',
        cityId: defaultValues.cityId ?? '',
        stateId: defaultValues.stateId ?? '',
        judicialProcessId: defaultValues.judicialProcessId ?? '',
        supportPhone: defaultValues.supportPhone ?? '',
        supportEmail: defaultValues.supportEmail ?? '',
        supportWhatsApp: defaultValues.supportWhatsApp ?? '',
      });
    } else if (open) {
      form.reset();
    }
  }, [open, defaultValues, form]);

  const handleFormSubmit = form.handleSubmit(async (values) => { await onSubmit(values); });

  const renderSelect = (
    name: keyof AuctionSchema,
    label: string,
    options: readonly { value: string; label: string }[],
    aiId: string,
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={form.watch(name) as string ?? ''} onValueChange={(v) => form.setValue(name, v)}>
        <SelectTrigger data-ai-id={aiId}><SelectValue placeholder="Selecione" /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  const renderFkSelect = (
    name: keyof AuctionSchema,
    label: string,
    items: { id: string; name: string }[],
    aiId: string,
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={form.watch(name) as string ?? ''} onValueChange={(v) => form.setValue(name, v)}>
        <SelectTrigger data-ai-id={aiId}><SelectValue placeholder="Selecione" /></SelectTrigger>
        <SelectContent>
          {items.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto" data-ai-id="auction-form-sheet">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar Leilão' : 'Novo Leilão'}</SheetTitle>
          <SheetDescription>{isEdit ? 'Atualize os dados do leilão.' : 'Preencha os dados do novo leilão.'}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleFormSubmit} className="mt-6 space-y-4" data-ai-id="auction-form">
          <div className="space-y-2">
            <Label htmlFor="au-title">Título *</Label>
            <Input id="au-title" {...form.register('title')} data-ai-id="auction-field-title" />
            {form.formState.errors.title && <p className="text-destructive text-xs">{form.formState.errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="au-slug">Slug</Label>
              <Input id="au-slug" {...form.register('slug')} data-ai-id="auction-field-slug" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="au-initialOffer">Oferta Inicial (R$)</Label>
              <Input id="au-initialOffer" type="number" step="0.01" {...form.register('initialOffer')} data-ai-id="auction-field-initialOffer" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="au-description">Descrição</Label>
            <Textarea id="au-description" rows={3} {...form.register('description')} data-ai-id="auction-field-description" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {renderSelect('status', 'Status', AUCTION_STATUSES, 'auction-field-status')}
            {renderSelect('auctionType', 'Tipo', AUCTION_TYPES, 'auction-field-auctionType')}
            {renderSelect('auctionMethod', 'Método', AUCTION_METHODS, 'auction-field-auctionMethod')}
            {renderSelect('participation', 'Participação', AUCTION_PARTICIPATIONS, 'auction-field-participation')}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="au-auctionDate">Data do Leilão</Label>
              <Input id="au-auctionDate" type="datetime-local" {...form.register('auctionDate')} data-ai-id="auction-field-auctionDate" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="au-endDate">Data Fim</Label>
              <Input id="au-endDate" type="datetime-local" {...form.register('endDate')} data-ai-id="auction-field-endDate" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="au-featured"
              checked={form.watch('isFeaturedOnMarketplace')}
              onCheckedChange={(c) => form.setValue('isFeaturedOnMarketplace', Boolean(c))}
              data-ai-id="auction-field-featured"
            />
            <Label htmlFor="au-featured">Destaque no Marketplace</Label>
          </div>

          <Separator />
          <p className="text-sm font-medium text-muted-foreground">Vínculos</p>

          <div className="grid grid-cols-2 gap-4">
            {renderFkSelect('auctioneerId', 'Leiloeiro', auctioneers, 'auction-field-auctioneerId')}
            {renderFkSelect('sellerId', 'Vendedor', sellers, 'auction-field-sellerId')}
            {renderFkSelect('categoryId', 'Categoria', categories, 'auction-field-categoryId')}
            {renderFkSelect('judicialProcessId', 'Processo Judicial', processes, 'auction-field-judicialProcessId')}
            {renderFkSelect('cityId', 'Cidade', cities, 'auction-field-cityId')}
            {renderFkSelect('stateId', 'Estado', states, 'auction-field-stateId')}
          </div>

          <Separator />
          <p className="text-sm font-medium text-muted-foreground">Local / Contato</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="au-address">Endereço</Label>
              <Input id="au-address" {...form.register('address')} data-ai-id="auction-field-address" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="au-zipCode">CEP</Label>
              <Input id="au-zipCode" {...form.register('zipCode')} data-ai-id="auction-field-zipCode" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="au-onlineUrl">URL Online</Label>
              <Input id="au-onlineUrl" {...form.register('onlineUrl')} data-ai-id="auction-field-onlineUrl" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="au-phone">Tel. Suporte</Label>
              <Input id="au-phone" {...form.register('supportPhone')} data-ai-id="auction-field-supportPhone" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="au-email">Email Suporte</Label>
              <Input id="au-email" {...form.register('supportEmail')} data-ai-id="auction-field-supportEmail" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="au-whatsapp">WhatsApp</Label>
              <Input id="au-whatsapp" {...form.register('supportWhatsApp')} data-ai-id="auction-field-supportWhatsApp" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-ai-id="auction-form-cancel">Cancelar</Button>
            <Button type="submit" disabled={form.formState.isSubmitting} data-ai-id="auction-form-submit">
              {isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
