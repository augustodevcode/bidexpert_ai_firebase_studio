# Exemplo de Implementação: Módulo Tenants

## Implementação Completa com Logging e Validação

Este documento demonstra a implementação completa do sistema de logging e validação no módulo de Tenants.

## 1. Tenant Form Schema (Existente ou Novo)

```typescript
// src/app/admin/tenants/tenant-form-schema.ts
import { z } from 'zod';

export const tenantFormSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  subdomain: z.string()
    .min(3, 'Subdomínio deve ter no mínimo 3 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Subdomínio deve conter apenas letras minúsculas, números e hífens'),
  logo: z.string().url('URL do logo inválida').optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor primária inválida').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor secundária inválida').optional(),
  contactEmail: z.string().email('Email inválido').optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  isActive: z.boolean().default(true),
  settings: z.record(z.any()).optional(),
});

export type TenantFormValues = z.infer<typeof tenantFormSchema>;
```

## 2. Tenant Form Component com Logging e Validação

```typescript
// src/app/admin/tenants/tenant-form.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedCrudForm } from '@/hooks/use-enhanced-crud-form';
import { CrudFormLayout } from '@/components/crud/crud-form-layout';
import { CrudFormActions } from '@/components/crud/crud-form-actions';
import { CrudFormFooter } from '@/components/crud/crud-form-footer';
import { tenantFormSchema, type TenantFormValues } from './tenant-form-schema';
import { Building2, Palette, Mail, Phone, MapPin } from 'lucide-react';
import { logNavigation, logInteraction } from '@/lib/user-action-logger';
import { loggedInputChange, loggedSwitchChange, logSectionChange } from '@/lib/form-logging-helpers';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { Tenant } from '@prisma/client';

interface TenantFormProps {
  initialData?: Tenant | null;
  onSubmitAction: (data: TenantFormValues) => Promise<{ success: boolean; message: string; data?: any }>;
  mode: 'create' | 'edit';
}

export function TenantForm({ initialData, onSubmitAction, mode }: TenantFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const { form, handleSubmit, isSubmitting, validation } = useEnhancedCrudForm({
    schema: tenantFormSchema,
    onSubmitAction,
    moduleName: 'Tenants',
    defaultValues: initialData || {
      name: '',
      subdomain: '',
      isActive: true,
    },
    mode: 'onChange',
    autoValidate: false,
    onSuccess: (data) => {
      logNavigation('Tenant form submitted successfully', { mode, tenantId: data?.id }, 'Tenants');
      router.push('/admin/tenants');
      router.refresh();
    },
    successMessage: mode === 'create' 
      ? 'Tenant criado com sucesso!' 
      : 'Tenant atualizado com sucesso!',
  });

  const handleCancel = () => {
    logInteraction('Form cancelled', { mode }, 'Tenants');
    router.push('/admin/tenants');
  };

  React.useEffect(() => {
    logNavigation('Tenant form loaded', { mode, hasTenant: !!initialData }, 'Tenants');
  }, [mode, initialData]);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-8">
        <CrudFormLayout
          title={mode === 'create' ? 'Criar Novo Tenant' : 'Editar Tenant'}
          description="Preencha os dados do tenant (leiloeiro/cliente)"
        >
          <Accordion type="multiple" defaultValue={['basic', 'contact', 'branding']} className="w-full">
            {/* Informações Básicas */}
            <AccordionItem value="basic">
              <AccordionTrigger 
                onClick={() => logSectionChange('Informações Básicas', 'Tenants')}
                className="text-lg font-semibold"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Informações Básicas
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Tenant *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Ex: Leiloeiro XYZ"
                              onChange={(e) => {
                                loggedInputChange(field.onChange, 'name', 'Tenants')(e);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Nome completo do leiloeiro ou empresa
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subdomain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subdomínio *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Ex: leiloeiro-xyz"
                              onChange={(e) => {
                                loggedInputChange(field.onChange, 'subdomain', 'Tenants')(e);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Subdomínio único para acesso (apenas letras minúsculas, números e hífens)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Tenant Ativo</FormLabel>
                            <FormDescription>
                              Habilita ou desabilita o acesso do tenant
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                loggedSwitchChange(field.onChange, 'isActive', 'Tenants')(checked);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* Informações de Contato */}
            <AccordionItem value="contact">
              <AccordionTrigger 
                onClick={() => logSectionChange('Informações de Contato', 'Tenants')}
                className="text-lg font-semibold"
              >
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Informações de Contato
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email de Contato</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="contato@exemplo.com"
                              onChange={(e) => {
                                loggedInputChange(field.onChange, 'contactEmail', 'Tenants')(e);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="(11) 99999-9999"
                              onChange={(e) => {
                                loggedInputChange(field.onChange, 'contactPhone', 'Tenants')(e);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Endereço completo"
                              rows={3}
                              onChange={(e) => {
                                loggedInputChange(field.onChange, 'address', 'Tenants')(e as any);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cidade</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Cidade"
                                onChange={(e) => {
                                  loggedInputChange(field.onChange, 'city', 'Tenants')(e);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="UF"
                                maxLength={2}
                                onChange={(e) => {
                                  loggedInputChange(field.onChange, 'state', 'Tenants')(e);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="00000-000"
                              onChange={(e) => {
                                loggedInputChange(field.onChange, 'zipCode', 'Tenants')(e);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* Branding */}
            <AccordionItem value="branding">
              <AccordionTrigger 
                onClick={() => logSectionChange('Branding', 'Tenants')}
                className="text-lg font-semibold"
              >
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Branding
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <FormField
                      control={form.control}
                      name="logo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL do Logo</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="url"
                              placeholder="https://exemplo.com/logo.png"
                              onChange={(e) => {
                                loggedInputChange(field.onChange, 'logo', 'Tenants')(e);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            URL completa do logo do tenant
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="primaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cor Primária</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="color"
                                onChange={(e) => {
                                  loggedInputChange(field.onChange, 'primaryColor', 'Tenants')(e);
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Cor principal do tema
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="secondaryColor"
                        render=({({ field }) => (
                          <FormItem>
                            <FormLabel>Cor Secundária</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="color"
                                onChange={(e) => {
                                  loggedInputChange(field.onChange, 'secondaryColor', 'Tenants')(e);
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Cor secundária do tema
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CrudFormLayout>

        <CrudFormFooter>
          <CrudFormActions
            isSubmitting={isSubmitting}
            onSave={handleSubmit}
            onCancel={handleCancel}
            onValidationCheck={validation.performValidationCheck}
            showValidation={true}
            saveLabel={mode === 'create' ? 'Criar Tenant' : 'Atualizar Tenant'}
          />
        </CrudFormFooter>
      </form>
    </Form>
  );
}
```

## 3. Página de Listagem com Logging

```typescript
// src/app/admin/tenants/page.tsx (atualizado)
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTenants } from './actions';
import type { Tenant } from '@prisma/client';
import { Briefcase, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { logNavigation, logInteraction } from '@/lib/user-action-logger';

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPageData = useCallback(async () => {
    logInteraction('Loading tenants list', {}, 'Tenants');
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedTenants = await getTenants();
      setTenants(fetchedTenants);
      logNavigation('Tenants list loaded', { count: fetchedTenants.length }, 'Tenants');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar tenants.";
      console.error("Error fetching tenants:", e);
      setError(errorMessage);
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handleCreateClick = () => {
    logNavigation('Navigate to create tenant', {}, 'Tenants');
  };

  const columns = useMemo(() => createColumns(), []);

  return (
    <div className="space-y-6" data-ai-id="admin-tenants-page-container">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold font-headline flex items-center">
                <Briefcase className="h-6 w-6 mr-2 text-primary" />
                Gerenciar Tenants (Leiloeiros)
              </CardTitle>
              <CardDescription>
                Visualize e gerencie os tenants (clientes/leiloeiros) da sua plataforma.
              </CardDescription>
            </div>
            <Link href="/admin/tenants/new" onClick={handleCreateClick}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Tenant
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={tenants}
            isLoading={isLoading}
            error={error}
            searchColumnId="name"
            searchPlaceholder="Buscar por nome ou subdomínio..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

## 4. Testes Playwright

```typescript
// tests/tenants-crud.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Tenants CRUD with Logging', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/tenants');
  });

  test('should log navigation to tenants list', async ({ page }) => {
    // Wait for page load
    await page.waitForSelector('[data-ai-id="admin-tenants-page-container"]');
    
    // Check last action
    const lastAction = await page.getAttribute('body', 'data-last-action');
    expect(lastAction).toContain('Tenants list loaded');
  });

  test('should log tenant creation', async ({ page }) => {
    // Navigate to create page
    await page.click('text=Novo Tenant');
    
    // Wait for form
    await page.waitForSelector('input[name="name"]');
    
    // Check navigation log
    let lastAction = await page.getAttribute('body', 'data-last-action');
    expect(lastAction).toContain('Tenant form loaded');
    
    // Fill form with logging
    await page.fill('input[name="name"]', 'Test Tenant');
    await page.waitForTimeout(100);
    lastAction = await page.getAttribute('body', 'data-last-action');
    expect(lastAction).toContain('field changed: name');
    
    await page.fill('input[name="subdomain"]', 'test-tenant');
    await page.waitForTimeout(100);
    lastAction = await page.getAttribute('body', 'data-last-action');
    expect(lastAction).toContain('field changed: subdomain');
  });

  test('should validate form before submit', async ({ page }) => {
    await page.click('text=Novo Tenant');
    await page.waitForSelector('input[name="name"]');
    
    // Click validation button
    await page.click('text=Validar Formulário');
    
    // Check validation dialog
    await expect(page.locator('text=Validação Reprovada')).toBeVisible();
    await expect(page.locator('text=Campos obrigatórios faltando')).toBeVisible();
    
    // Check validation log
    const lastAction = await page.getAttribute('body', 'data-last-action');
    expect(lastAction).toContain('validation check performed');
  });

  test('should show validation success when form is valid', async ({ page }) => {
    await page.click('text=Novo Tenant');
    await page.waitForSelector('input[name="name"]');
    
    // Fill required fields
    await page.fill('input[name="name"]', 'Valid Tenant');
    await page.fill('input[name="subdomain"]', 'valid-tenant');
    
    // Click validation button
    await page.click('text=Validar Formulário');
    
    // Check validation success
    await expect(page.locator('text=Validação Aprovada')).toBeVisible();
    await expect(page.locator('text=Tudo Pronto!')).toBeVisible();
  });

  test('should log section navigation', async ({ page }) => {
    await page.click('text=Novo Tenant');
    await page.waitForSelector('input[name="name"]');
    
    // Open contact section
    await page.click('text=Informações de Contato');
    
    // Check section log
    const lastAction = await page.getAttribute('body', 'data-last-action');
    expect(lastAction).toContain('section opened: Informações de Contato');
  });

  test('should access logger from console', async ({ page }) => {
    await page.click('text=Novo Tenant');
    await page.waitForSelector('input[name="name"]');
    
    // Fill some fields
    await page.fill('input[name="name"]', 'Test');
    await page.fill('input[name="subdomain"]', 'test');
    
    // Get logs from browser
    const logs = await page.evaluate(() => {
      const logger = (window as any).__userActionLogger;
      return logger.getLogs({ module: 'Tenants' });
    });
    
    expect(logs).toBeDefined();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.some((log: any) => log.action.includes('field changed'))).toBeTruthy();
  });
});
```

## Resumo da Implementação

### Arquivos Criados/Modificados

1. ✅ `tenant-form-schema.ts` - Schema Zod
2. ✅ `tenant-form.tsx` - Formulário com logging e validação
3. ✅ `page.tsx` - Lista com logging de navegação
4. ✅ `tenants-crud.spec.ts` - Testes Playwright

### Funcionalidades Implementadas

- ✅ Logging de todas as ações do formulário
- ✅ Botão de validação visual
- ✅ Logging de navegação entre seções
- ✅ Logging de navegação de páginas
- ✅ Testes Playwright completos
- ✅ Validação em tempo real (opcional)
- ✅ Acesso ao logger via console

### Benefícios

1. **Debug Facilitado**: Todos os logs coloridos no console
2. **Testes Robustos**: Playwright pode detectar ações via data attributes
3. **UX Melhorada**: Validação visual antes de submeter
4. **Manutenibilidade**: Código reutilizável e padronizado
5. **Analytics**: Dados de uso para análise futura
