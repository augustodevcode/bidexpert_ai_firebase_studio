// src/app/admin/settings/themes/page.tsx
/**
 * @fileoverview Página de administração para as configurações de Identidade Visual e Tema.
 * Permite que o administrador altere o título do site, slogan, logo e o tema de cores.
 */
'use client';

import React from 'react';
import SettingsFormWrapper from '../settings-form-wrapper';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

export default function ThemeSettingsPage() {
  return (
    <SettingsFormWrapper
      title="Identidade Visual e Temas"
      description="Personalize o título, slogan, logo e as cores da plataforma."
    >
      {(form) => (
        <>
          <div className="space-y-4">
              <h3 className="font-semibold text-lg text-foreground">Identidade</h3>
              <FormField control={form.control} name="siteTitle" render={({ field }) => (<FormItem><FormLabel>Título do Site</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="siteTagline" render={({ field }) => (<FormItem><FormLabel>Slogan</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
               <FormField control={form.control} name="logoUrl" render={({ field }) => (<FormItem><FormLabel>URL do Logo</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-foreground">Cores do Tema</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 p-4 border rounded-md">
                  <h4 className="font-medium">Tema Claro</h4>
                  <FormField control={form.control} name="themes.colors.light.primary" render={({ field }) => (<FormItem><FormLabel>Primária</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="themes.colors.light.background" render={({ field }) => (<FormItem><FormLabel>Fundo</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="themes.colors.light.accent" render={({ field }) => (<FormItem><FormLabel>Destaque</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
               <div className="space-y-3 p-4 border rounded-md">
                  <h4 className="font-medium">Tema Escuro</h4>
                  <FormField control={form.control} name="themes.colors.dark.primary" render={({ field }) => (<FormItem><FormLabel>Primária</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="themes.colors.dark.background" render={({ field }) => (<FormItem><FormLabel>Fundo</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="themes.colors.dark.accent" render={({ field }) => (<FormItem><FormLabel>Destaque</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
             </div>
          </div>
        </>
      )}
    </SettingsFormWrapper>
  );
}
