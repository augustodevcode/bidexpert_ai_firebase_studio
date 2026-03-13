/**
 * @fileoverview Formulário dialog para ThemeSettings — Admin Plus.
 * Campos: name + light/dark JSON editors.
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';

import { themeSettingsSchema, type ThemeSettingsFormValues } from './schema';
import { createThemeSettingsAction, updateThemeSettingsAction } from './actions';
import type { ThemeSettingsRow } from './types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editRow?: ThemeSettingsRow | null;
  onSuccess: () => void;
}

function safeStringify(v: unknown): string {
  if (v == null) return '';
  try { return JSON.stringify(v, null, 2); } catch { return ''; }
}
function safeParse(text: string): unknown {
  if (!text.trim()) return null;
  try { return JSON.parse(text); } catch { return undefined; }
}

export function ThemeSettingsForm({ open, onOpenChange, editRow, onSuccess }: Props) {
  const [saving, setSaving] = useState(false);
  const [lightJson, setLightJson] = useState('');
  const [darkJson, setDarkJson] = useState('');
  const isEdit = !!editRow;

  const form = useForm<ThemeSettingsFormValues>({
    resolver: zodResolver(themeSettingsSchema),
    defaultValues: { name: '', platformSettingsId: null, light: null, dark: null },
  });

  useEffect(() => {
    if (open && editRow) {
      form.reset({ name: editRow.name, platformSettingsId: editRow.platformSettingsId });
      setLightJson(safeStringify(editRow.light));
      setDarkJson(safeStringify(editRow.dark));
    } else if (open) {
      form.reset({ name: '', platformSettingsId: null, light: null, dark: null });
      setLightJson('');
      setDarkJson('');
    }
  }, [open, editRow, form]);

  const onSubmit = async (values: ThemeSettingsFormValues) => {
    const light = safeParse(lightJson);
    const dark = safeParse(darkJson);
    if (lightJson.trim() && light === undefined) { toast.error('JSON inválido em Light'); return; }
    if (darkJson.trim() && dark === undefined) { toast.error('JSON inválido em Dark'); return; }

    setSaving(true);
    try {
      const payload = { ...values, light: light ?? null, dark: dark ?? null };
      const action = isEdit
        ? updateThemeSettingsAction({ ...payload, id: editRow!.id })
        : createThemeSettingsAction(payload);
      const res = await action;
      if (res?.success) {
        toast.success(isEdit ? 'Tema atualizado.' : 'Tema criado.');
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(res?.error ?? 'Erro ao salvar.');
      }
    } catch {
      toast.error('Erro inesperado.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" data-ai-id="theme-settings-dialog">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Tema' : 'Novo Tema'}</DialogTitle>
        </DialogHeader>
        <CrudFormShell form={form} onSubmit={onSubmit}>
          <div className="grid gap-4">
            <Field label="Nome *">
              <Input {...form.register('name')} data-ai-id="theme-name" />
            </Field>
            <Field label="Light Theme (JSON)">
              <Textarea
                className="font-mono text-sm min-h-[120px]"
                value={lightJson}
                onChange={(e) => setLightJson(e.target.value)}
                placeholder="{}"
                data-ai-id="theme-light"
              />
            </Field>
            <Field label="Dark Theme (JSON)">
              <Textarea
                className="font-mono text-sm min-h-[120px]"
                value={darkJson}
                onChange={(e) => setDarkJson(e.target.value)}
                placeholder="{}"
                data-ai-id="theme-dark"
              />
            </Field>
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={saving} data-ai-id="theme-settings-save">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </CrudFormShell>
      </DialogContent>
    </Dialog>
  );
}
