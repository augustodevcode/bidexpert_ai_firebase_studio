/**
 * @fileoverview Página de máscaras de ID — Admin Plus.
 * Formulário com 8 campos de máscara para identificadores de entidades.
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Hash, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

import { idMasksSchema, type IdMasksFormValues } from './schema';
import { getIdMasksAction, updateIdMasksAction } from './actions';

const MASK_FIELDS = [
  { key: 'auctionCodeMask' as const, label: 'Leilão', placeholder: 'LEI-{YYYY}-{SEQ:6}' },
  { key: 'lotCodeMask' as const, label: 'Lote', placeholder: 'LOT-{YYYY}-{SEQ:8}' },
  { key: 'sellerCodeMask' as const, label: 'Vendedor', placeholder: 'VEN-{SEQ:6}' },
  { key: 'auctioneerCodeMask' as const, label: 'Leiloeiro', placeholder: 'LEL-{SEQ:6}' },
  { key: 'userCodeMask' as const, label: 'Usuário', placeholder: 'USR-{SEQ:6}' },
  { key: 'assetCodeMask' as const, label: 'Ativo', placeholder: 'AST-{YYYY}-{SEQ:8}' },
  { key: 'categoryCodeMask' as const, label: 'Categoria', placeholder: 'CAT-{SEQ:4}' },
  { key: 'subcategoryCodeMask' as const, label: 'Subcategoria', placeholder: 'SUB-{SEQ:4}' },
] as const;

export default function IdMasksPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<IdMasksFormValues>({
    resolver: zodResolver(idMasksSchema),
    defaultValues: {
      auctionCodeMask: null,
      lotCodeMask: null,
      sellerCodeMask: null,
      auctioneerCodeMask: null,
      userCodeMask: null,
      assetCodeMask: null,
      categoryCodeMask: null,
      subcategoryCodeMask: null,
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getIdMasksAction({});
        if (res?.success && res.data) {
          form.reset({
            auctionCodeMask: res.data.auctionCodeMask ?? null,
            lotCodeMask: res.data.lotCodeMask ?? null,
            sellerCodeMask: res.data.sellerCodeMask ?? null,
            auctioneerCodeMask: res.data.auctioneerCodeMask ?? null,
            userCodeMask: res.data.userCodeMask ?? null,
            assetCodeMask: res.data.assetCodeMask ?? null,
            categoryCodeMask: res.data.categoryCodeMask ?? null,
            subcategoryCodeMask: res.data.subcategoryCodeMask ?? null,
          });
        }
      } catch {
        toast.error('Erro ao carregar máscaras de ID.');
      } finally {
        setLoading(false);
      }
    })();
  }, [form]);

  const onSubmit = async (values: IdMasksFormValues) => {
    setSaving(true);
    try {
      const res = await updateIdMasksAction(values);
      if (res?.success) {
        toast.success('Máscaras de ID salvas com sucesso.');
      } else {
        toast.error(res?.error ?? 'Erro ao salvar.');
      }
    } catch {
      toast.error('Erro inesperado ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" data-ai-id="id-masks-skeleton">
        <Skeleton className="h-8 w-64" />
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }

  return (
    <div data-ai-id="id-masks-page">
      <PageHeader title="Máscaras de Identificadores" icon={Hash} />

      <CrudFormShell form={form} onSubmit={onSubmit}>
        <p className="text-sm text-muted-foreground mb-4">
          Defina os padrões de formatação dos IDs gerados pelo sistema. Use tokens como{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">{'{YYYY}'}</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">{'{MM}'}</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">{'{SEQ:N}'}</code>{' '}
          para sequencial com N dígitos.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {MASK_FIELDS.map(({ key, label, placeholder }) => (
            <Field key={key} label={`ID ${label}`}>
              <Input
                {...form.register(key)}
                placeholder={placeholder}
                data-ai-id={`id-mask-${key}`}
              />
            </Field>
          ))}
        </div>

        <div className="flex justify-end pt-6">
          <Button type="submit" disabled={saving} data-ai-id="id-masks-save">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Máscaras
          </Button>
        </div>
      </CrudFormShell>
    </div>
  );
}
