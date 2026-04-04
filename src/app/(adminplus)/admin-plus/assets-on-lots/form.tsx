/**
 * Form component for AssetsOnLots junction (Admin Plus CRUD).
 * Links an Asset to a Lot.
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { assetsOnLotsSchema } from './schema';
import type { AssetsOnLotsRow } from './types';
import { createAssetsOnLots, updateAssetsOnLots } from './actions';
import { listLots } from '../lots/actions';
import { listAssets } from '../assets/actions';
import { toast } from 'sonner';

type FormValues = z.infer<typeof assetsOnLotsSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem: AssetsOnLotsRow | null;
  onSuccess: () => void;
}

export default function AssetsOnLotsForm({ open, onOpenChange, editItem, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [lots, setLots] = useState<{ id: string; title: string }[]>([]);
  const [assets, setAssets] = useState<{ id: string; title: string }[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(assetsOnLotsSchema),
    defaultValues: { lotId: '', assetId: '', assignedBy: '' },
  });

  useEffect(() => {
    if (!open) return;
    Promise.all([
      listLots({ page: 1, pageSize: 200 }),
      listAssets({ page: 1, pageSize: 200 }),
    ]).then(([lotsRes, assetsRes]) => {
      if (lotsRes.success && lotsRes.data) setLots(lotsRes.data.data.map((l) => ({ id: l.id, title: l.title })));
      if (assetsRes.success && assetsRes.data) setAssets(assetsRes.data.data.map((a) => ({ id: a.id, title: a.title })));
    });
  }, [open]);

  useEffect(() => {
    if (open && editItem) {
      form.reset({ lotId: editItem.lotId, assetId: editItem.assetId, assignedBy: editItem.assignedBy });
    } else if (open) {
      form.reset({ lotId: '', assetId: '', assignedBy: '' });
    }
  }, [open, editItem, form]);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const result = editItem
        ? await updateAssetsOnLots({ ...values })
        : await createAssetsOnLots(values);
      if (result.success) {
        toast.success(editItem ? 'Vínculo atualizado!' : 'Vínculo criado!');
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error ?? 'Erro ao salvar.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto" data-ai-id="assets-on-lots-form-sheet">
        <SheetHeader>
          <SheetTitle>{editItem ? 'Editar Vínculo' : 'Novo Vínculo Ativo ↔ Lote'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4" data-ai-id="assets-on-lots-form">
          <div className="space-y-1">
            <Label htmlFor="aol-lotId">Lote *</Label>
            <Select value={form.watch('lotId')} onValueChange={(v) => form.setValue('lotId', v)} disabled={!!editItem}>
              <SelectTrigger id="aol-lotId" data-ai-id="aol-lot-select">
                <SelectValue placeholder="Selecione o lote" />
              </SelectTrigger>
              <SelectContent>
                {lots.map((l) => <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>)}
              </SelectContent>
            </Select>
            {form.formState.errors.lotId && <p className="text-sm text-destructive">{form.formState.errors.lotId.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="aol-assetId">Ativo *</Label>
            <Select value={form.watch('assetId')} onValueChange={(v) => form.setValue('assetId', v)} disabled={!!editItem}>
              <SelectTrigger id="aol-assetId" data-ai-id="aol-asset-select">
                <SelectValue placeholder="Selecione o ativo" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((a) => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}
              </SelectContent>
            </Select>
            {form.formState.errors.assetId && <p className="text-sm text-destructive">{form.formState.errors.assetId.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="aol-assignedBy">Atribuído por *</Label>
            <Input id="aol-assignedBy" data-ai-id="aol-assigned-by-input" {...form.register('assignedBy')} />
            {form.formState.errors.assignedBy && <p className="text-sm text-destructive">{form.formState.errors.assignedBy.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : editItem ? 'Atualizar' : 'Criar'}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
