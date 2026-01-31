// src/app/admin/settings/themes/page.tsx
/**
 * @fileoverview Página de administração para as configurações de Identidade Visual e Tema.
 * Permite ao administrador alterar o título do site, slogan, logo e o tema de cores.
 */
'use client';

import React from 'react';
import SettingsFormWrapper from '../settings-form-wrapper';
import ThemeSettingsForm from '@/components/admin/settings/theme-settings-form';

export default function ThemeSettingsPage() {
  return (
    <SettingsFormWrapper
      title="Identidade Visual e Temas"
      description="Personalize o título, slogan, logo e as cores da plataforma."
    >
      {(form) => <ThemeSettingsForm form={form} />}
    </SettingsFormWrapper>
  );
}
