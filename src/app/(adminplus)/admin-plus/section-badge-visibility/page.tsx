/**
 * @fileoverview Página de visibilidade de badges por seção — Admin Plus.
 * Permite configurar quais badges aparecem no grid de busca e na página de detalhe do lote via JSON.
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

import { sectionBadgeVisibilitySchema, type SectionBadgeVisibilityFormValues } from './schema';
import { getSectionBadgeVisibilityAction, updateSectionBadgeVisibilityAction } from './actions';

function safeStringify(value: unknown): string {
  if (value == null) return '';
  try { return JSON.stringify(value, null, 2); } catch { return ''; }
}

function safeParse(text: string): unknown {
  if (!text.trim()) return null;
  try { return JSON.parse(text); } catch { return undefined; }
}

export default function SectionBadgeVisibilityPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchGridText, setSearchGridText] = useState('');
  const [lotDetailText, setLotDetailText] = useState('');

  const form = useForm<SectionBadgeVisibilityFormValues>({
    resolver: zodResolver(sectionBadgeVisibilitySchema),
    defaultValues: { searchGrid: null, lotDetail: null },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getSectionBadgeVisibilityAction({});
        if (res?.success && res.data) {
          setSearchGridText(safeStringify(res.data.searchGrid));
          setLotDetailText(safeStringify(res.data.lotDetail));
          form.reset({
            searchGrid: res.data.searchGrid ?? null,
            lotDetail: res.data.lotDetail ?? null,
          });
        }
      } catch {
        toast.error('Erro ao carregar configurações de badges.');
      } finally {
        setLoading(false);
      }
    })();
  }, [form]);

  const onSubmit = async () => {
    const sg = safeParse(searchGridText);
    const ld = safeParse(lotDetailText);

    if (searchGridText.trim() && sg === undefined) {
      toast.error('JSON inválido em "Grid de Busca".');
      return;
    }
    if (lotDetailText.trim() && ld === undefined) {
      toast.error('JSON inválido em "Detalhe do Lote".');
      return;
    }

    setSaving(true);
    try {
      const res = await updateSectionBadgeVisibilityAction({
        searchGrid: sg ?? null,
        lotDetail: ld ?? null,
      });
      if (res?.success) {
        toast.success('Visibilidade de badges salva com sucesso.');
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
      <div className="space-y-6" data-ai-id="section-badge-visibility-skeleton">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div data-ai-id="section-badge-visibility-page">
      <PageHeader title="Visibilidade de Badges por Seção" icon={Eye} />

      <CrudFormShell form={form} onSubmit={onSubmit}>
        <p className="text-sm text-muted-foreground mb-4">
          Configure quais badges aparecem no grid de busca e na página de detalhe do lote.
          Use JSON válido (array de chaves de badge ou objeto de configuração).
        </p>

        <Field label="Grid de Busca (JSON)">
          <Textarea
            className="font-mono text-sm min-h-[160px]"
            value={searchGridText}
            onChange={(e) => setSearchGridText(e.target.value)}
            placeholder='["discount", "popularity", "exclusive"]'
            data-ai-id="section-badge-search-grid"
          />
        </Field>

        <Separator className="my-4" />

        <Field label="Detalhe do Lote (JSON)">
          <Textarea
            className="font-mono text-sm min-h-[160px]"
            value={lotDetailText}
            onChange={(e) => setLotDetailText(e.target.value)}
            placeholder='["discount", "hotBid", "exclusive"]'
            data-ai-id="section-badge-lot-detail"
          />
        </Field>

        <div className="flex justify-end pt-6">
          <Button type="submit" disabled={saving} data-ai-id="section-badge-save">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Configurações
          </Button>
        </div>
      </CrudFormShell>
    </div>
  );
}
