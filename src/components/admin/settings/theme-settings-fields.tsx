/**
 * @fileoverview Campos do formulário de Identidade Visual e Temas (UI pura).
 * Separa os campos de UI da integração com a biblioteca de mídia.
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { themeTokenGroups } from '@/lib/theme-tokens';
import type { UseFormReturn } from 'react-hook-form';
import type { PlatformSettingsFormValues } from '@/app/admin/settings/settings-form-schema';

interface ThemeSettingsFieldsProps {
  form: UseFormReturn<PlatformSettingsFormValues>;
  onSelectLogo: () => void;
  onClearLogo: () => void;
}

export default function ThemeSettingsFields({ form, onSelectLogo, onClearLogo }: ThemeSettingsFieldsProps) {
  return (
    <>
      <div className="space-y-4" data-ai-id="settings-theme-identity-section">
        <h3 className="font-semibold text-lg text-foreground" data-ai-id="settings-theme-identity-title">Identidade</h3>
        <FormField
          control={form.control}
          name="siteTitle"
          render={({ field }) => (
            <FormItem data-ai-id="settings-theme-site-title-item">
              <FormLabel data-ai-id="settings-theme-site-title-label">Título do Site</FormLabel>
              <FormControl>
                <Input {...field} data-ai-id="settings-theme-site-title-input" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="siteTagline"
          render={({ field }) => (
            <FormItem data-ai-id="settings-theme-site-tagline-item">
              <FormLabel data-ai-id="settings-theme-site-tagline-label">Slogan</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} data-ai-id="settings-theme-site-tagline-input" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="logoMediaId"
          render={({ field }) => (
            <FormItem data-ai-id="settings-theme-logo-media-id-item">
              <FormControl>
                <Input type="hidden" {...field} value={field.value ?? ''} data-ai-id="settings-theme-logo-media-id-input" />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="logoUrl"
          render={({ field }) => (
            <FormItem data-ai-id="settings-theme-logo-url-item">
              <FormLabel data-ai-id="settings-theme-logo-url-label">Logo (Biblioteca de Mídia)</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} readOnly data-ai-id="settings-theme-logo-url-input" />
              </FormControl>
              <FormDescription>O logo deve existir na biblioteca de mídia.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-wrap gap-2" data-ai-id="settings-theme-logo-actions">
          <Button type="button" onClick={onSelectLogo} data-ai-id="settings-theme-logo-select-button">
            Selecionar Logo
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onClearLogo}
            data-ai-id="settings-theme-logo-clear-button"
          >
            Remover Logo
          </Button>
        </div>

        {form.watch('logoUrl') ? (
          <Card className="p-4 flex items-center gap-4" data-ai-id="settings-theme-logo-preview">
            <div className="relative h-16 w-32" data-ai-id="settings-theme-logo-preview-container">
              <Image
                src={form.watch('logoUrl') as string}
                alt={form.watch('siteTitle') || 'Logo BidExpert'}
                fill
                className="object-contain"
                data-ai-id="settings-theme-logo-preview-image"
              />
            </div>
            <div className="text-sm text-muted-foreground" data-ai-id="settings-theme-logo-preview-text">
              Logo aplicado ao site.
            </div>
          </Card>
        ) : null}
      </div>

      <Separator />

      <div className="space-y-4" data-ai-id="settings-theme-radius-section">
        <h3 className="font-semibold text-lg text-foreground" data-ai-id="settings-theme-radius-title">Raio das Bordas</h3>
        <FormField
          control={form.control}
          name="radiusValue"
          render={({ field }) => (
            <FormItem data-ai-id="settings-theme-radius-item">
              <FormLabel data-ai-id="settings-theme-radius-label">Valor do Radius</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} placeholder="Ex: 0.5rem" data-ai-id="settings-theme-radius-input" />
              </FormControl>
              <FormDescription>Define o arredondamento padrão do design system.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Separator />

      <div className="space-y-6" data-ai-id="settings-theme-colors-section">
        <h3 className="font-semibold text-lg text-foreground" data-ai-id="settings-theme-colors-title">Cores do Tema (Shadcn)</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-ai-id="settings-theme-colors-grid">
          <div className="space-y-4" data-ai-id="settings-theme-light">
            <h4 className="font-medium" data-ai-id="settings-theme-light-title">Tema Claro</h4>
            {themeTokenGroups.map(section => (
              <Card key={`light-${section.id}`} className="p-4 space-y-3" data-ai-id={`settings-theme-light-${section.id}`}>
                <h5 className="text-sm font-semibold" data-ai-id={`settings-theme-light-${section.id}-title`}>{section.title}</h5>
                <div className="grid gap-3" data-ai-id={`settings-theme-light-${section.id}-fields`}>
                  {section.fields.map(fieldDef => (
                    <FormField
                      key={`light-${fieldDef.key}`}
                      control={form.control}
                      name={`themeColorsLight.${fieldDef.key}`}
                      render={({ field }) => (
                        <FormItem data-ai-id={`settings-theme-light-${fieldDef.key}-item`}>
                          <FormLabel data-ai-id={`settings-theme-light-${fieldDef.key}-label`}>{fieldDef.label}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ''}
                              placeholder="Ex: 217 91% 60%"
                              data-ai-id={`settings-theme-light-${fieldDef.key}-input`}
                            />
                          </FormControl>
                          {fieldDef.description ? (
                            <FormDescription>{fieldDef.description}</FormDescription>
                          ) : null}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-4" data-ai-id="settings-theme-dark">
            <h4 className="font-medium" data-ai-id="settings-theme-dark-title">Tema Escuro</h4>
            {themeTokenGroups.map(section => (
              <Card key={`dark-${section.id}`} className="p-4 space-y-3" data-ai-id={`settings-theme-dark-${section.id}`}>
                <h5 className="text-sm font-semibold" data-ai-id={`settings-theme-dark-${section.id}-title`}>{section.title}</h5>
                <div className="grid gap-3" data-ai-id={`settings-theme-dark-${section.id}-fields`}>
                  {section.fields.map(fieldDef => (
                    <FormField
                      key={`dark-${fieldDef.key}`}
                      control={form.control}
                      name={`themeColorsDark.${fieldDef.key}`}
                      render={({ field }) => (
                        <FormItem data-ai-id={`settings-theme-dark-${fieldDef.key}-item`}>
                          <FormLabel data-ai-id={`settings-theme-dark-${fieldDef.key}-label`}>{fieldDef.label}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ''}
                              placeholder="Ex: 217 91% 60%"
                              data-ai-id={`settings-theme-dark-${fieldDef.key}-input`}
                            />
                          </FormControl>
                          {fieldDef.description ? (
                            <FormDescription>{fieldDef.description}</FormDescription>
                          ) : null}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
