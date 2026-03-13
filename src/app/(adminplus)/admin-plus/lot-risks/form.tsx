/**
 * Formulário CRUD para LotRisk (Riscos de Lotes).
 */
'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { lotRiskSchema, LOT_RISK_TYPES, LOT_RISK_LEVELS } from './schema';
import type { LotRiskRow } from './types';
import { createLotRisk, updateLotRisk } from './actions';
import { listLots } from '../lots/actions';
import { listUsersAction } from '../users/actions';

type FormData = z.infer<typeof lotRiskSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRow?: LotRiskRow | null;
  onSuccess?: () => void;
}

export default function LotRiskForm({ open, onOpenChange, editingRow, onSuccess }: Props) {
  const [lots, setLots] = useState<{ id: string; label: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({ resolver: zodResolver(lotRiskSchema), defaultValues: { lotId: '', riskType: '', riskLevel: '', riskDescription: '', mitigationStrategy: '', verifiedBy: '', verified: false } });
  const isEdit = !!editingRow;
  const verified = form.watch('verified');

  useEffect(() => {
    if (!open) return;
    Promise.all([listLots({ page: 1, pageSize: 500 }), listUsersAction({ page: 1, pageSize: 500 })]).then(([lr, ur]) => {
      if (lr.success && lr.data) setLots((lr.data as any).data?.map((d: any) => ({ id: d.id, label: d.title || d.id })) ?? []);
      if (ur.success && ur.data) setUsers((ur.data as any).data?.map((d: any) => ({ id: d.id, label: d.name || d.email || d.id })) ?? []);
    });
  }, [open]);

  useEffect(() => { if (open && editingRow) { form.reset({ lotId: editingRow.lotId, riskType: editingRow.riskType, riskLevel: editingRow.riskLevel, riskDescription: editingRow.riskDescription, mitigationStrategy: editingRow.mitigationStrategy ?? '', verifiedBy: editingRow.verifiedBy ?? '', verified: editingRow.verified }); } else if (open) { form.reset({ lotId: '', riskType: '', riskLevel: '', riskDescription: '', mitigationStrategy: '', verifiedBy: '', verified: false }); } }, [open, editingRow, form]);

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const res = isEdit ? await updateLotRisk({ id: editingRow!.id, ...data }) : await createLotRisk(data);
      if (res.success) { toast.success(isEdit ? 'Risco atualizado!' : 'Risco criado!'); onOpenChange(false); onSuccess?.(); } else { toast.error(res.error ?? 'Erro ao salvar'); }
    } finally { setLoading(false); }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto" data-ai-id="lot-risk-form-sheet">
        <SheetHeader><SheetTitle>{isEdit ? 'Editar Risco' : 'Novo Risco'}</SheetTitle></SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4" data-ai-id="lot-risk-form">
          <div className="space-y-2">
            <Label htmlFor="lotId">Lote *</Label>
            <Select value={form.watch('lotId')} onValueChange={v => form.setValue('lotId', v)}>
              <SelectTrigger id="lotId" data-ai-id="lot-risk-lotId-select"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{lots.map(l => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}</SelectContent>
            </Select>
            {form.formState.errors.lotId && <p className="text-sm text-destructive">{form.formState.errors.lotId.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="riskType">Tipo de Risco *</Label>
              <Select value={form.watch('riskType')} onValueChange={v => form.setValue('riskType', v)}>
                <SelectTrigger id="riskType" data-ai-id="lot-risk-riskType-select"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{LOT_RISK_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
              {form.formState.errors.riskType && <p className="text-sm text-destructive">{form.formState.errors.riskType.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="riskLevel">Nível *</Label>
              <Select value={form.watch('riskLevel')} onValueChange={v => form.setValue('riskLevel', v)}>
                <SelectTrigger id="riskLevel" data-ai-id="lot-risk-riskLevel-select"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{LOT_RISK_LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
              {form.formState.errors.riskLevel && <p className="text-sm text-destructive">{form.formState.errors.riskLevel.message}</p>}
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="riskDescription">Descrição do Risco *</Label>
            <Textarea id="riskDescription" {...form.register('riskDescription')} rows={3} data-ai-id="lot-risk-description-textarea" />
            {form.formState.errors.riskDescription && <p className="text-sm text-destructive">{form.formState.errors.riskDescription.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="mitigationStrategy">Estratégia de Mitigação</Label>
            <Textarea id="mitigationStrategy" {...form.register('mitigationStrategy')} rows={3} data-ai-id="lot-risk-mitigation-textarea" />
          </div>
          <Separator />
          <div className="flex items-center gap-3">
            <Switch id="verified" checked={verified} onCheckedChange={v => form.setValue('verified', v)} data-ai-id="lot-risk-verified-switch" />
            <Label htmlFor="verified">Verificado</Label>
          </div>
          {verified && (
            <div className="space-y-2">
              <Label htmlFor="verifiedBy">Verificado por</Label>
              <Select value={form.watch('verifiedBy') ?? ''} onValueChange={v => form.setValue('verifiedBy', v)}>
                <SelectTrigger id="verifiedBy" data-ai-id="lot-risk-verifiedBy-select"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-ai-id="lot-risk-cancel-btn">Cancelar</Button>
            <Button type="submit" disabled={loading} data-ai-id="lot-risk-submit-btn">{loading ? 'Salvando...' : isEdit ? 'Atualizar' : 'Criar'}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
