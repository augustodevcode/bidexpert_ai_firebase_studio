/**
 * @fileoverview PÃ¡gina de ConfiguraÃ§Ãµes Gerais da Plataforma â€” Admin Plus.
 * FormulÃ¡rio com 7 seÃ§Ãµes: Branding, Cores, E-mail/SMS, Features, Busca/ExibiÃ§Ã£o, Marketing, Suporte + JSON avanÃ§ado.
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Settings, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

import { platformSettingsSchema, type PlatformSettingsFormValues } from './schema';
import { getPlatformSettingsAction, updatePlatformSettingsAction } from './actions';

function safeStringify(v: unknown): string {
  if (v == null) return '';
  try { return JSON.stringify(v, null, 2); } catch { return ''; }
}

function safeParse(text: string): unknown {
  if (!text.trim()) return null;
  try { return JSON.parse(text); } catch { return undefined; }
}

const DEFAULTS: PlatformSettingsFormValues = {
  siteTitle: null, siteTagline: null, logoUrl: null, faviconUrl: null,
  isSetupComplete: false, customFontUrl: null, customCss: null, customHeadScripts: null,
  primaryColorHsl: null, primaryForegroundHsl: null, secondaryColorHsl: null, secondaryForegroundHsl: null,
  accentColorHsl: null, accentForegroundHsl: null, destructiveColorHsl: null, mutedColorHsl: null,
  backgroundColorHsl: null, foregroundColorHsl: null, borderColorHsl: null, radiusValue: null,
  emailFromName: null, emailFromAddress: null, smsFromName: null,
  enableBlockchain: false, enableRealtime: true, enableSoftClose: true,
  enableDirectSales: true, enableMapSearch: true, enableAIFeatures: false,
  crudFormMode: 'modal', galleryImageBasePath: null, storageProvider: null,
  firebaseStorageBucket: null, activeThemeName: null,
  searchPaginationType: null, searchItemsPerPage: 12, searchLoadMoreCount: 12,
  showCountdownOnLotDetail: true, showCountdownOnCards: true,
  showRelatedLotsOnLotDetail: true, relatedLotsCount: 5,
  defaultUrgencyTimerHours: null, defaultListItemsPerPage: 10,
  marketingSiteAdsSuperOpportunitiesEnabled: true,
  marketingSiteAdsSuperOpportunitiesScrollIntervalSeconds: 6,
  marketingSiteAdsSuperOpportunitiesDaysBeforeClosing: 7,
  supportAddress: null, supportBusinessHours: null, supportEmail: null,
  supportPhone: null, supportWhatsApp: null,
  auditTrailConfig: null, themeColorsDark: null, themeColorsLight: null, featureFlags: null,
};

export default function PlatformSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jsonFields, setJsonFields] = useState({
    auditTrailConfig: '',
    themeColorsDark: '',
    themeColorsLight: '',
    featureFlags: '',
  });

  const form = useForm<PlatformSettingsFormValues>({
    resolver: zodResolver(platformSettingsSchema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getPlatformSettingsAction({});
        if (res?.success && res.data) {
          const d = res.data as Record<string, unknown>;
          const mapped: Record<string, unknown> = {};
          for (const key of Object.keys(DEFAULTS)) {
            mapped[key] = d[key] ?? (DEFAULTS as Record<string, unknown>)[key];
          }
          form.reset(mapped as PlatformSettingsFormValues);
          setJsonFields({
            auditTrailConfig: safeStringify(d.auditTrailConfig),
            themeColorsDark: safeStringify(d.themeColorsDark),
            themeColorsLight: safeStringify(d.themeColorsLight),
            featureFlags: safeStringify(d.featureFlags),
          });
        }
      } catch {
        toast.error('Erro ao carregar configuraÃ§Ãµes da plataforma.');
      } finally {
        setLoading(false);
      }
    })();
  }, [form]);

  const onSubmit = async (values: PlatformSettingsFormValues) => {
    // Parse JSON fields
    const jsonParsed: Record<string, unknown> = {};
    for (const [key, text] of Object.entries(jsonFields)) {
      const parsed = safeParse(text);
      if (text.trim() && parsed === undefined) {
        toast.error(`JSON invÃ¡lido em "${key}".`);
        return;
      }
      jsonParsed[key] = parsed ?? null;
    }

    setSaving(true);
    try {
      const res = await updatePlatformSettingsAction({ ...values, ...jsonParsed });
      if (res?.success) {
        toast.success('ConfiguraÃ§Ãµes da plataforma salvas com sucesso.');
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
      <div className="space-y-6" data-ai-id="platform-settings-skeleton">
        <Skeleton className="h-8 w-64" />
        {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <>
      <h3 className="text-base font-semibold mt-6">{children}</h3>
      <Separator className="mb-4" />
    </>
  );

  return (
    <div data-ai-id="platform-settings-page">
      <PageHeader title="ConfiguraÃ§Ãµes Gerais da Plataforma" icon={Settings} />

      <CrudFormShell form={form} onSubmit={onSubmit}>
        {/* â”€â”€ BRANDING â”€â”€ */}
        <SectionTitle>Branding e Identidade</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <Field label="TÃ­tulo do Site">
            <Input {...form.register('siteTitle')} data-ai-id="ps-site-title" />
          </Field>
          <Field label="Tagline">
            <Input {...form.register('siteTagline')} data-ai-id="ps-site-tagline" />
          </Field>
          <Field label="URL do Logo">
            <Input {...form.register('logoUrl')} data-ai-id="ps-logo-url" />
          </Field>
          <Field label="URL do Favicon">
            <Input {...form.register('faviconUrl')} data-ai-id="ps-favicon-url" />
          </Field>
          <Field label="URL Fonte Personalizada">
            <Input {...form.register('customFontUrl')} data-ai-id="ps-custom-font" />
          </Field>
          <Field label="Tema Ativo">
            <Input {...form.register('activeThemeName')} data-ai-id="ps-active-theme" />
          </Field>
          <Field label="Setup Completo">
            <Switch
              checked={form.watch('isSetupComplete')}
              onCheckedChange={(v) => form.setValue('isSetupComplete', v, { shouldDirty: true })}
              data-ai-id="ps-setup-complete"
            />
          </Field>
        </div>

        {/* â”€â”€ CORES â”€â”€ */}
        <SectionTitle>Cores HSL do Tema</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          {([
            ['primaryColorHsl', 'Primary'],
            ['primaryForegroundHsl', 'Primary Foreground'],
            ['secondaryColorHsl', 'Secondary'],
            ['secondaryForegroundHsl', 'Secondary Foreground'],
            ['accentColorHsl', 'Accent'],
            ['accentForegroundHsl', 'Accent Foreground'],
            ['destructiveColorHsl', 'Destructive'],
            ['mutedColorHsl', 'Muted'],
            ['backgroundColorHsl', 'Background'],
            ['foregroundColorHsl', 'Foreground'],
            ['borderColorHsl', 'Border'],
          ] as const).map(([key, label]) => (
            <Field key={key} label={label}>
              <Input {...form.register(key)} placeholder="210 40% 98%" data-ai-id={`ps-color-${key}`} />
            </Field>
          ))}
          <Field label="Border Radius">
            <Input {...form.register('radiusValue')} placeholder="0.5rem" data-ai-id="ps-radius" />
          </Field>
        </div>

        {/* â”€â”€ EMAIL / SMS â”€â”€ */}
        <SectionTitle>E-mail e SMS</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <Field label="Nome Remetente E-mail">
            <Input {...form.register('emailFromName')} data-ai-id="ps-email-name" />
          </Field>
          <Field label="EndereÃ§o Remetente">
            <Input {...form.register('emailFromAddress')} data-ai-id="ps-email-address" />
          </Field>
          <Field label="Nome Remetente SMS">
            <Input {...form.register('smsFromName')} data-ai-id="ps-sms-name" />
          </Field>
        </div>

        {/* â”€â”€ FEATURES â”€â”€ */}
        <SectionTitle>Feature Toggles</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          {([
            ['enableBlockchain', 'Blockchain'],
            ['enableRealtime', 'Realtime'],
            ['enableSoftClose', 'Soft Close'],
            ['enableDirectSales', 'Venda Direta'],
            ['enableMapSearch', 'Busca por Mapa'],
            ['enableAIFeatures', 'Recursos de IA'],
          ] as const).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <span className="text-sm font-medium">{label}</span>
              <Switch
                checked={form.watch(key)}
                onCheckedChange={(v) => form.setValue(key, v, { shouldDirty: true })}
                data-ai-id={`ps-feature-${key}`}
              />
            </div>
          ))}
        </div>

        {/* â”€â”€ CRUD / STORAGE â”€â”€ */}
        <SectionTitle>CRUD e Armazenamento</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <Field label="Modo de FormulÃ¡rio CRUD">
            <Select
              value={form.watch('crudFormMode') ?? 'modal'}
              onValueChange={(v) => form.setValue('crudFormMode', v, { shouldDirty: true })}
            >
              <SelectTrigger data-ai-id="ps-crud-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modal">Modal</SelectItem>
                <SelectItem value="page">PÃ¡gina</SelectItem>
                <SelectItem value="drawer">Drawer</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Provedor de Storage">
            <Select
              value={form.watch('storageProvider') ?? ''}
              onValueChange={(v) => form.setValue('storageProvider', v as 'LOCAL' | 'FIREBASE', { shouldDirty: true })}
            >
              <SelectTrigger data-ai-id="ps-storage-provider">
                <SelectValue placeholder="Selecionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOCAL">Local</SelectItem>
                <SelectItem value="FIREBASE">Firebase</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Base Path Galeria">
            <Input {...form.register('galleryImageBasePath')} data-ai-id="ps-gallery-path" />
          </Field>
          <Field label="Firebase Storage Bucket">
            <Input {...form.register('firebaseStorageBucket')} data-ai-id="ps-firebase-bucket" />
          </Field>
        </div>

        {/* â”€â”€ BUSCA E EXIBIÃ‡ÃƒO â”€â”€ */}
        <SectionTitle>Busca e ExibiÃ§Ã£o</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          <Field label="Tipo de PaginaÃ§Ã£o">
            <Select
              value={form.watch('searchPaginationType') ?? ''}
              onValueChange={(v) => form.setValue('searchPaginationType', v as 'loadMore' | 'numberedPages', { shouldDirty: true })}
            >
              <SelectTrigger data-ai-id="ps-search-pagination">
                <SelectValue placeholder="Selecionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="loadMore">Carregar Mais</SelectItem>
                <SelectItem value="numberedPages">PaginaÃ§Ã£o Numerada</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Itens por PÃ¡gina (Busca)">
            <Input type="number" {...form.register('searchItemsPerPage', { valueAsNumber: true })} data-ai-id="ps-search-per-page" />
          </Field>
          <Field label="Load More Count">
            <Input type="number" {...form.register('searchLoadMoreCount', { valueAsNumber: true })} data-ai-id="ps-load-more-count" />
          </Field>
          <Field label="Lotes Relacionados (qtd)">
            <Input type="number" {...form.register('relatedLotsCount', { valueAsNumber: true })} data-ai-id="ps-related-count" />
          </Field>
          <Field label="Timer UrgÃªncia (horas)">
            <Input type="number" {...form.register('defaultUrgencyTimerHours', { valueAsNumber: true })} data-ai-id="ps-urgency-hours" />
          </Field>
          <Field label="Itens por PÃ¡gina (Listas)">
            <Input type="number" {...form.register('defaultListItemsPerPage', { valueAsNumber: true })} data-ai-id="ps-list-per-page" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          {([
            ['showCountdownOnLotDetail', 'Countdown no Detalhe'],
            ['showCountdownOnCards', 'Countdown nos Cards'],
            ['showRelatedLotsOnLotDetail', 'Lotes Relacionados'],
          ] as const).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <span className="text-sm font-medium">{label}</span>
              <Switch
                checked={form.watch(key) ?? true}
                onCheckedChange={(v) => form.setValue(key, v, { shouldDirty: true })}
                data-ai-id={`ps-display-${key}`}
              />
            </div>
          ))}
        </div>

        {/* â”€â”€ MARKETING â”€â”€ */}
        <SectionTitle>Marketing / Super Oportunidades</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <Field label="Habilitado">
            <Switch
              checked={form.watch('marketingSiteAdsSuperOpportunitiesEnabled')}
              onCheckedChange={(v) => form.setValue('marketingSiteAdsSuperOpportunitiesEnabled', v, { shouldDirty: true })}
              data-ai-id="ps-mkt-enabled"
            />
          </Field>
          <Field label="Intervalo Scroll (seg)">
            <Input type="number" {...form.register('marketingSiteAdsSuperOpportunitiesScrollIntervalSeconds', { valueAsNumber: true })} data-ai-id="ps-mkt-scroll" />
          </Field>
          <Field label="Dias antes do Encerramento">
            <Input type="number" {...form.register('marketingSiteAdsSuperOpportunitiesDaysBeforeClosing', { valueAsNumber: true })} data-ai-id="ps-mkt-days" />
          </Field>
        </div>

        {/* â”€â”€ SUPORTE â”€â”€ */}
        <SectionTitle>Suporte</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <Field label="E-mail de Suporte">
            <Input {...form.register('supportEmail')} data-ai-id="ps-support-email" />
          </Field>
          <Field label="Telefone">
            <Input {...form.register('supportPhone')} data-ai-id="ps-support-phone" />
          </Field>
          <Field label="WhatsApp">
            <Input {...form.register('supportWhatsApp')} data-ai-id="ps-support-whatsapp" />
          </Field>
          <Field label="HorÃ¡rio de Funcionamento">
            <Input {...form.register('supportBusinessHours')} data-ai-id="ps-support-hours" />
          </Field>
          <Field label="EndereÃ§o" className="sm:col-span-2">
            <Input {...form.register('supportAddress')} data-ai-id="ps-support-address" />
          </Field>
        </div>

        {/* â”€â”€ CSS / SCRIPTS â”€â”€ */}
        <SectionTitle>CSS e Scripts Customizados</SectionTitle>
        <div className="grid gap-4 mb-6">
          <Field label="CSS Customizado">
            <Textarea className="font-mono text-sm min-h-[120px]" {...form.register('customCss')} data-ai-id="ps-custom-css" />
          </Field>
          <Field label="Scripts no Head">
            <Textarea className="font-mono text-sm min-h-[120px]" {...form.register('customHeadScripts')} data-ai-id="ps-custom-scripts" />
          </Field>
        </div>

        {/* â”€â”€ JSON AVANÃ‡ADO â”€â”€ */}
        <SectionTitle>ConfiguraÃ§Ãµes AvanÃ§adas (JSON)</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          {([
            ['auditTrailConfig', 'Audit Trail Config'],
            ['themeColorsDark', 'Theme Colors Dark'],
            ['themeColorsLight', 'Theme Colors Light'],
            ['featureFlags', 'Feature Flags'],
          ] as const).map(([key, label]) => (
            <Field key={key} label={label}>
              <Textarea
                className="font-mono text-sm min-h-[120px]"
                value={jsonFields[key]}
                onChange={(e) => setJsonFields(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder="{}"
                data-ai-id={`ps-json-${key}`}
              />
            </Field>
          ))}
        </div>

        <div className="flex justify-end pt-6">
          <Button type="submit" disabled={saving} data-ai-id="platform-settings-save">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar ConfiguraÃ§Ãµes
          </Button>
        </div>
      </CrudFormShell>
    </div>
  );
}
