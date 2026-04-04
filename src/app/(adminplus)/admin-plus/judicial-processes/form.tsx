/**
 * @fileoverview Formulário de JudicialProcess — Admin Plus.
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { judicialProcessSchema, type JudicialProcessSchema, ACTION_TYPES } from './schema';
import type { JudicialProcessRow } from './types';
import { listCourtsAction } from '../courts/actions';
import { listJudicialDistricts } from '../judicial-districts/actions';
import { listJudicialBranches } from '../judicial-branches/actions';
import { listSellers } from '../sellers/actions';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: JudicialProcessSchema) => Promise<void>;
  defaultValues?: JudicialProcessRow | null;
}

export function JudicialProcessForm({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const isEdit = !!defaultValues;
  const [courts, setCourts] = useState<{ id: string; name: string }[]>([]);
  const [districts, setDistricts] = useState<{ id: string; name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [sellers, setSellers] = useState<{ id: string; name: string }[]>([]);

  const form = useForm<JudicialProcessSchema>({
    resolver: zodResolver(judicialProcessSchema),
    defaultValues: {
      processNumber: '', isElectronic: true, courtId: '', districtId: '',
      branchId: '', sellerId: '', propertyMatricula: '', propertyRegistrationNumber: '',
      actionType: '', actionDescription: '', actionCnjCode: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    const fetchAll = async () => {
      const [cRes, dRes, bRes, sRes] = await Promise.all([
        listCourtsAction({ page: 1, pageSize: 500 }),
        listJudicialDistricts({ page: 1, pageSize: 500 }),
        listJudicialBranches({ page: 1, pageSize: 500 }),
        listSellers({ page: 1, pageSize: 500 }),
      ]);
      if (cRes?.success && cRes.data?.data) setCourts(cRes.data.data.map(c => ({ id: String(c.id), name: String((c as any).name) })));
      if (dRes?.success && dRes.data?.data) setDistricts(dRes.data.data.map(d => ({ id: String(d.id), name: String((d as any).name) })));
      if (bRes?.success && bRes.data?.data) setBranches(bRes.data.data.map(b => ({ id: String(b.id), name: String((b as any).name) })));
      if (sRes?.success && sRes.data?.data) setSellers(sRes.data.data.map(s => ({ id: String(s.id), name: String((s as any).name) })));
    };
    fetchAll();
  }, [open]);

  useEffect(() => {
    if (open && defaultValues) {
      form.reset({
        processNumber: defaultValues.processNumber ?? '',
        isElectronic: defaultValues.isElectronic ?? true,
        courtId: defaultValues.courtId ?? '',
        districtId: defaultValues.districtId ?? '',
        branchId: defaultValues.branchId ?? '',
        sellerId: defaultValues.sellerId ?? '',
        propertyMatricula: defaultValues.propertyMatricula ?? '',
        propertyRegistrationNumber: defaultValues.propertyRegistrationNumber ?? '',
        actionType: defaultValues.actionType ?? '',
        actionDescription: defaultValues.actionDescription ?? '',
        actionCnjCode: defaultValues.actionCnjCode ?? '',
      });
    } else if (open) {
      form.reset();
    }
  }, [open, defaultValues, form]);

  const handleFormSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto" data-ai-id="judicial-process-form-sheet">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar Processo Judicial' : 'Novo Processo Judicial'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Atualize os dados do processo.' : 'Preencha os dados do novo processo.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleFormSubmit} className="mt-6 space-y-4" data-ai-id="judicial-process-form">
          {/* Dados Principais */}
          <div className="space-y-2">
            <Label htmlFor="jp-processNumber">Nº Processo *</Label>
            <Input id="jp-processNumber" {...form.register('processNumber')} data-ai-id="judicial-process-field-processNumber" />
            {form.formState.errors.processNumber && (
              <p className="text-destructive text-xs">{form.formState.errors.processNumber.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="jp-isElectronic"
              checked={form.watch('isElectronic')}
              onCheckedChange={(checked) => form.setValue('isElectronic', Boolean(checked))}
              data-ai-id="judicial-process-field-isElectronic"
            />
            <Label htmlFor="jp-isElectronic">Processo Eletrônico</Label>
          </div>

          <Separator />
          <p className="text-sm font-medium text-muted-foreground">Vínculos</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tribunal</Label>
              <Select value={form.watch('courtId') ?? ''} onValueChange={(v) => form.setValue('courtId', v)}>
                <SelectTrigger data-ai-id="judicial-process-field-courtId">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {courts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Comarca</Label>
              <Select value={form.watch('districtId') ?? ''} onValueChange={(v) => form.setValue('districtId', v)}>
                <SelectTrigger data-ai-id="judicial-process-field-districtId">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Vara</Label>
              <Select value={form.watch('branchId') ?? ''} onValueChange={(v) => form.setValue('branchId', v)}>
                <SelectTrigger data-ai-id="judicial-process-field-branchId">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Vendedor</Label>
              <Select value={form.watch('sellerId') ?? ''} onValueChange={(v) => form.setValue('sellerId', v)}>
                <SelectTrigger data-ai-id="judicial-process-field-sellerId">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {sellers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />
          <p className="text-sm font-medium text-muted-foreground">Ação Judicial</p>

          <div className="space-y-2">
            <Label>Tipo de Ação</Label>
            <Select value={form.watch('actionType') ?? ''} onValueChange={(v) => form.setValue('actionType', v)}>
              <SelectTrigger data-ai-id="judicial-process-field-actionType">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jp-actionDescription">Descrição da Ação</Label>
            <Textarea id="jp-actionDescription" rows={3} {...form.register('actionDescription')} data-ai-id="judicial-process-field-actionDescription" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jp-actionCnjCode">Código CNJ</Label>
            <Input id="jp-actionCnjCode" {...form.register('actionCnjCode')} data-ai-id="judicial-process-field-actionCnjCode" />
          </div>

          <Separator />
          <p className="text-sm font-medium text-muted-foreground">Imóvel</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jp-propertyMatricula">Matrícula</Label>
              <Input id="jp-propertyMatricula" {...form.register('propertyMatricula')} data-ai-id="judicial-process-field-propertyMatricula" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jp-propertyRegistrationNumber">Nº Registro</Label>
              <Input id="jp-propertyRegistrationNumber" {...form.register('propertyRegistrationNumber')} data-ai-id="judicial-process-field-propertyRegistrationNumber" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-ai-id="judicial-process-form-cancel">
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting} data-ai-id="judicial-process-form-submit">
              {isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
