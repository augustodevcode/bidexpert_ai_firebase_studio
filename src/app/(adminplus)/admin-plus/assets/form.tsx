/**
 * @fileoverview Formulário CRUD de Asset — Admin Plus.
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { assetSchema, ASSET_STATUSES } from './schema';
import type { AssetRow } from './types';
import { createAsset, updateAsset } from './actions';
import { listLotCategories } from '../lot-categories/actions';
import { listSubcategories } from '../subcategories/actions';
import { listSellers } from '../sellers/actions';
import { listJudicialProcesses } from '../judicial-processes/actions';
import type { z } from 'zod';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; row?: AssetRow | null; onSuccess: () => void; }

type FkItem = { id: string; label: string };

export default function AssetForm({ open, onOpenChange, row, onSuccess }: Props) {
  const isEdit = !!row;
  const form = useForm<z.infer<typeof assetSchema>>({ resolver: zodResolver(assetSchema), defaultValues: {} });
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<FkItem[]>([]);
  const [subcategories, setSubcategories] = useState<FkItem[]>([]);
  const [sellers, setSellers] = useState<FkItem[]>([]);
  const [processes, setProcesses] = useState<FkItem[]>([]);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      listLotCategories({ page: 1, pageSize: 200 }).then((r) => r.success && r.data ? (r.data as { data: { id: string; name: string }[] }).data.map((i) => ({ id: i.id, label: i.name })) : []),
      listSubcategories({ page: 1, pageSize: 200 }).then((r) => r.success && r.data ? (r.data as { data: { id: string; name: string }[] }).data.map((i) => ({ id: i.id, label: i.name })) : []),
      listSellers({ page: 1, pageSize: 200 }).then((r) => r.success && r.data ? (r.data as { data: { id: string; name: string }[] }).data.map((i) => ({ id: i.id, label: i.name })) : []),
      listJudicialProcesses({ page: 1, pageSize: 200 }).then((r) => r.success && r.data ? (r.data as { data: { id: string; processNumber: string }[] }).data.map((i) => ({ id: i.id, label: i.processNumber })) : []),
    ]).then(([c, s, se, jp]) => { setCategories(c); setSubcategories(s); setSellers(se); setProcesses(jp); });
    if (row) {
      form.reset({
        title: row.title ?? '',
        description: row.description ?? '',
        status: row.status ?? '',
        evaluationValue: row.evaluationValue != null ? String(row.evaluationValue) : '',
        imageUrl: row.imageUrl ?? '',
        locationCity: row.locationCity ?? '',
        locationState: row.locationState ?? '',
        address: row.address ?? '',
        categoryId: row.categoryId ?? '',
        subcategoryId: row.subcategoryId ?? '',
        sellerId: row.sellerId ?? '',
        judicialProcessId: row.judicialProcessId ?? '',
        plate: row.plate ?? '',
        make: row.make ?? '',
        model: row.model ?? '',
        year: row.year != null ? String(row.year) : '',
        mileage: row.mileage != null ? String(row.mileage) : '',
        color: row.color ?? '',
        fuelType: row.fuelType ?? '',
        totalArea: row.totalArea != null ? String(row.totalArea) : '',
        builtArea: row.builtArea != null ? String(row.builtArea) : '',
        bedrooms: row.bedrooms != null ? String(row.bedrooms) : '',
        parkingSpaces: row.parkingSpaces != null ? String(row.parkingSpaces) : '',
      });
    } else {
      form.reset({ title: '', description: '', status: '', evaluationValue: '', imageUrl: '', locationCity: '', locationState: '', address: '', categoryId: '', subcategoryId: '', sellerId: '', judicialProcessId: '', plate: '', make: '', model: '', year: '', mileage: '', color: '', fuelType: '', totalArea: '', builtArea: '', bedrooms: '', parkingSpaces: '' });
    }
  }, [open, row, form]);

  const renderFkSelect = (name: string, label: string, items: FkItem[]) => (
    <div className="space-y-1" data-ai-id={`asset-field-${name}`}>
      <Label htmlFor={name}>{label}</Label>
      <Select value={form.watch(name as keyof z.infer<typeof assetSchema>) ?? ''} onValueChange={(v) => form.setValue(name as keyof z.infer<typeof assetSchema>, v)}>
        <SelectTrigger id={name}><SelectValue placeholder={`Selecione ${label.toLowerCase()}`} /></SelectTrigger>
        <SelectContent>{items.map((i) => (<SelectItem key={i.id} value={i.id}>{i.label}</SelectItem>))}</SelectContent>
      </Select>
    </div>
  );

  const renderEnumSelect = (name: string, label: string, options: readonly { value: string; label: string }[]) => (
    <div className="space-y-1" data-ai-id={`asset-field-${name}`}>
      <Label htmlFor={name}>{label}</Label>
      <Select value={form.watch(name as keyof z.infer<typeof assetSchema>) ?? ''} onValueChange={(v) => form.setValue(name as keyof z.infer<typeof assetSchema>, v)}>
        <SelectTrigger id={name}><SelectValue placeholder={`Selecione ${label.toLowerCase()}`} /></SelectTrigger>
        <SelectContent>{options.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
      </Select>
    </div>
  );

  const onSubmit = async (values: z.infer<typeof assetSchema>) => {
    setSaving(true);
    try {
      const res = isEdit ? await updateAsset(row!.id, values) : await createAsset(values);
      if (res.success) { toast.success(isEdit ? 'Ativo atualizado!' : 'Ativo criado!'); onSuccess(); onOpenChange(false); }
      else toast.error(res.error ?? 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg" data-ai-id="asset-form-sheet">
        <SheetHeader><SheetTitle>{isEdit ? 'Editar Ativo' : 'Novo Ativo'}</SheetTitle></SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div className="space-y-1" data-ai-id="asset-field-title">
            <Label htmlFor="title">Título *</Label>
            <Input id="title" {...form.register('title')} />
            {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
          </div>
          <div className="space-y-1" data-ai-id="asset-field-description">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" {...form.register('description')} rows={3} />
          </div>
          {renderEnumSelect('status', 'Status', ASSET_STATUSES)}
          <div className="space-y-1" data-ai-id="asset-field-evaluationValue">
            <Label htmlFor="evaluationValue">Valor de Avaliação (R$)</Label>
            <Input id="evaluationValue" type="number" step="0.01" {...form.register('evaluationValue')} />
          </div>
          <div className="space-y-1" data-ai-id="asset-field-imageUrl">
            <Label htmlFor="imageUrl">URL da Imagem</Label>
            <Input id="imageUrl" {...form.register('imageUrl')} />
          </div>

          <Separator />
          <p className="text-sm font-medium text-muted-foreground">Vínculos</p>
          {renderFkSelect('categoryId', 'Categoria', categories)}
          {renderFkSelect('subcategoryId', 'Subcategoria', subcategories)}
          {renderFkSelect('sellerId', 'Vendedor', sellers)}
          {renderFkSelect('judicialProcessId', 'Processo Judicial', processes)}

          <Separator />
          <p className="text-sm font-medium text-muted-foreground">Localização</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1" data-ai-id="asset-field-locationCity">
              <Label htmlFor="locationCity">Cidade</Label>
              <Input id="locationCity" {...form.register('locationCity')} />
            </div>
            <div className="space-y-1" data-ai-id="asset-field-locationState">
              <Label htmlFor="locationState">Estado</Label>
              <Input id="locationState" {...form.register('locationState')} />
            </div>
          </div>
          <div className="space-y-1" data-ai-id="asset-field-address">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" {...form.register('address')} />
          </div>

          <Separator />
          <p className="text-sm font-medium text-muted-foreground">Veículo</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label htmlFor="plate">Placa</Label><Input id="plate" {...form.register('plate')} /></div>
            <div className="space-y-1"><Label htmlFor="make">Marca</Label><Input id="make" {...form.register('make')} /></div>
            <div className="space-y-1"><Label htmlFor="model">Modelo</Label><Input id="model" {...form.register('model')} /></div>
            <div className="space-y-1"><Label htmlFor="year">Ano</Label><Input id="year" type="number" {...form.register('year')} /></div>
            <div className="space-y-1"><Label htmlFor="mileage">Quilometragem</Label><Input id="mileage" type="number" {...form.register('mileage')} /></div>
            <div className="space-y-1"><Label htmlFor="color">Cor</Label><Input id="color" {...form.register('color')} /></div>
          </div>
          <div className="space-y-1"><Label htmlFor="fuelType">Combustível</Label><Input id="fuelType" {...form.register('fuelType')} /></div>

          <Separator />
          <p className="text-sm font-medium text-muted-foreground">Imóvel</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label htmlFor="totalArea">Área Total (m²)</Label><Input id="totalArea" type="number" step="0.01" {...form.register('totalArea')} /></div>
            <div className="space-y-1"><Label htmlFor="builtArea">Área Construída (m²)</Label><Input id="builtArea" type="number" step="0.01" {...form.register('builtArea')} /></div>
            <div className="space-y-1"><Label htmlFor="bedrooms">Quartos</Label><Input id="bedrooms" type="number" {...form.register('bedrooms')} /></div>
            <div className="space-y-1"><Label htmlFor="parkingSpaces">Vagas</Label><Input id="parkingSpaces" type="number" {...form.register('parkingSpaces')} /></div>
          </div>

          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar'}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
