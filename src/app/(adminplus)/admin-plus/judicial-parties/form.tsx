/**
 * Formulário de criação/edição de JudicialParty (Parte Processual).
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { CrudFormShell } from '@/components/admin-plus/crud-form-shell';
import { Field } from '@/components/admin-plus/field';

import { judicialPartySchema, PARTY_TYPE_OPTIONS } from './schema';
import type { JudicialPartyRow } from './types';
import { listJudicialProcesses } from '../judicial-processes/actions';

type FormValues = z.infer<typeof judicialPartySchema>;

interface Props { open: boolean; onOpenChange: (o: boolean) => void; onSubmit: (d: FormValues) => Promise<void>; defaultValues?: JudicialPartyRow | null; }

export function JudicialPartyForm({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const [processes, setProcesses] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({ resolver: zodResolver(judicialPartySchema), defaultValues: { name: '', documentNumber: '', partyType: '', processId: '' } });

  useEffect(() => {
    if (!open) return;
    if (defaultValues) { form.reset({ name: defaultValues.name, documentNumber: defaultValues.documentNumber, partyType: defaultValues.partyType, processId: defaultValues.processId }); }
    else { form.reset({ name: '', documentNumber: '', partyType: '', processId: '' }); }
    listJudicialProcesses({ page: 1, pageSize: 500 }).then((res) => {
      if (res.success && res.data?.data) setProcesses(res.data.data.map((p: any) => ({ id: p.id, label: p.processNumber || p.publicId })));
    });
  }, [open, defaultValues, form]);

  const handleSubmit = async (v: FormValues) => { setLoading(true); try { await onSubmit(v); } finally { setLoading(false); } };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto" data-ai-id="judicial-party-form-sheet">
        <SheetHeader><SheetTitle>{defaultValues ? 'Editar Parte' : 'Nova Parte Processual'}</SheetTitle></SheetHeader>
        <CrudFormShell form={form} onSubmit={handleSubmit}>
          <Field label="Nome" name="name" error={form.formState.errors.name}>
            <Input {...form.register('name')} data-ai-id="judicial-party-name-input" />
          </Field>
          <Field label="Documento" name="documentNumber" error={form.formState.errors.documentNumber}>
            <Input {...form.register('documentNumber')} data-ai-id="judicial-party-document" />
          </Field>
          <Field label="Tipo de Parte" name="partyType" error={form.formState.errors.partyType}>
            <Select value={form.watch('partyType')} onValueChange={(v) => form.setValue('partyType', v, { shouldValidate: true })}>
              <SelectTrigger data-ai-id="judicial-party-type-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{PARTY_TYPE_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
            </Select>
          </Field>
          <Field label="Processo" name="processId" error={form.formState.errors.processId}>
            <Select value={form.watch('processId')} onValueChange={(v) => form.setValue('processId', v, { shouldValidate: true })}>
              <SelectTrigger data-ai-id="judicial-party-process-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{processes.map((p) => (<SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>))}</SelectContent>
            </Select>
          </Field>
          <SheetFooter className="pt-4"><Button type="submit" disabled={loading} data-ai-id="judicial-party-submit">{loading ? 'Salvando...' : defaultValues ? 'Atualizar' : 'Criar'}</Button></SheetFooter>
        </CrudFormShell>
      </SheetContent>
    </Sheet>
  );
}
