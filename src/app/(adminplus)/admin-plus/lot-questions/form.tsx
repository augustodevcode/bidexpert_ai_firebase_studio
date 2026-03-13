/**
 * Form component for creating/editing LotQuestion records.
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { lotQuestionSchema } from './schema';
import { createLotQuestion, updateLotQuestion } from './actions';
import { listLots } from '../lots/actions';
import { listAuctions } from '../auctions/actions';
import { listUsersAction } from '../users/actions';
import type { LotQuestionRow } from './types';

type FormValues = z.infer<typeof lotQuestionSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRow?: LotQuestionRow | null;
  onSuccess: () => void;
}

export function LotQuestionForm({ open, onOpenChange, editingRow, onSuccess }: Props) {
  const [lots, setLots] = useState<{ id: string; label: string }[]>([]);
  const [auctions, setAuctions] = useState<{ id: string; label: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; label: string }[]>([]);
  const isEditing = !!editingRow;

  const form = useForm<FormValues>({
    resolver: zodResolver(lotQuestionSchema),
    defaultValues: { lotId: '', auctionId: '', userId: '', userDisplayName: '', questionText: '', answerText: '', isPublic: true, answeredByUserId: '', answeredByUserDisplayName: '' },
  });

  useEffect(() => {
    if (!open) return;
    Promise.all([
      listLots({ page: 1, pageSize: 500 }),
      listAuctions({ page: 1, pageSize: 500 }),
      listUsersAction({ page: 1, pageSize: 500 }),
    ]).then(([lr, ar, ur]) => {
      if (lr.success && lr.data) setLots((lr.data as any).data?.map((l: any) => ({ id: l.id, label: l.title })) ?? []);
      if (ar.success && ar.data) setAuctions((ar.data as any).data?.map((a: any) => ({ id: a.id, label: a.title })) ?? []);
      if (ur.success && ur.data) setUsers((ur.data as any).data?.map((u: any) => ({ id: u.id, label: u.name })) ?? []);
    });
  }, [open]);

  useEffect(() => {
    if (open && editingRow) {
      form.reset({
        lotId: editingRow.lotId,
        auctionId: editingRow.auctionId,
        userId: editingRow.userId,
        userDisplayName: editingRow.userDisplayName,
        questionText: editingRow.questionText,
        answerText: editingRow.answerText ?? '',
        isPublic: editingRow.isPublic,
        answeredByUserId: editingRow.answeredByUserId ?? '',
        answeredByUserDisplayName: editingRow.answeredByUserDisplayName ?? '',
      });
    } else if (open) {
      form.reset({ lotId: '', auctionId: '', userId: '', userDisplayName: '', questionText: '', answerText: '', isPublic: true, answeredByUserId: '', answeredByUserDisplayName: '' });
    }
  }, [open, editingRow, form]);

  async function onSubmit(values: FormValues) {
    const res = isEditing
      ? await updateLotQuestion({ id: editingRow!.id, ...values })
      : await createLotQuestion(values);
    if (res.success) { toast.success(isEditing ? 'Pergunta atualizada' : 'Pergunta criada'); onSuccess(); onOpenChange(false); }
    else toast.error(res.error ?? 'Erro ao salvar');
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto" data-ai-id="lot-question-form-sheet">
        <SheetHeader><SheetTitle>{isEditing ? 'Editar Pergunta' : 'Nova Pergunta'}</SheetTitle></SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4" data-ai-id="lot-question-form">
            {/* FK Selects */}
            <FormField control={form.control} name="lotId" render={() => (
              <FormItem>
                <FormLabel>Lote *</FormLabel>
                <Select value={form.watch('lotId')} onValueChange={(v) => form.setValue('lotId', v, { shouldValidate: true })}>
                  <FormControl><SelectTrigger data-ai-id="lot-question-lot-select"><SelectValue placeholder="Selecione o lote" /></SelectTrigger></FormControl>
                  <SelectContent>{lots.map((l) => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="auctionId" render={() => (
              <FormItem>
                <FormLabel>Leilão *</FormLabel>
                <Select value={form.watch('auctionId')} onValueChange={(v) => form.setValue('auctionId', v, { shouldValidate: true })}>
                  <FormControl><SelectTrigger data-ai-id="lot-question-auction-select"><SelectValue placeholder="Selecione o leilão" /></SelectTrigger></FormControl>
                  <SelectContent>{auctions.map((a) => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="userId" render={() => (
              <FormItem>
                <FormLabel>Usuário *</FormLabel>
                <Select value={form.watch('userId')} onValueChange={(v) => form.setValue('userId', v, { shouldValidate: true })}>
                  <FormControl><SelectTrigger data-ai-id="lot-question-user-select"><SelectValue placeholder="Selecione o usuário" /></SelectTrigger></FormControl>
                  <SelectContent>{users.map((u) => <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="userDisplayName" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome exibido *</FormLabel>
                <FormControl><Input {...field} data-ai-id="lot-question-displayname-input" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Separator />

            <FormField control={form.control} name="questionText" render={({ field }) => (
              <FormItem>
                <FormLabel>Pergunta *</FormLabel>
                <FormControl><Textarea {...field} rows={3} data-ai-id="lot-question-text-input" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="answerText" render={({ field }) => (
              <FormItem>
                <FormLabel>Resposta</FormLabel>
                <FormControl><Textarea {...field} rows={3} data-ai-id="lot-question-answer-input" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="answeredByUserId" render={() => (
                <FormItem>
                  <FormLabel>Respondido por</FormLabel>
                  <Select value={form.watch('answeredByUserId') ?? ''} onValueChange={(v) => form.setValue('answeredByUserId', v)}>
                    <FormControl><SelectTrigger data-ai-id="lot-question-answeredby-select"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>{users.map((u) => <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="isPublic" render={({ field }) => (
                <FormItem className="flex items-center gap-2 pt-6">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-ai-id="lot-question-ispublic-switch" /></FormControl>
                  <FormLabel className="!mt-0">Público</FormLabel>
                </FormItem>
              )} />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" data-ai-id="lot-question-submit-btn">{isEditing ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
