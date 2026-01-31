/**
 * @fileoverview Formulário de Identidade Visual e Temas com tokens completos do Shadcn.
 * Centraliza a UI do formulário e integração com biblioteca de mídia.
 */

'use client';

import React, { useCallback, useState } from 'react';
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog';
import type { MediaItem } from '@/types';
import type { UseFormReturn } from 'react-hook-form';
import type { PlatformSettingsFormValues } from '@/app/admin/settings/settings-form-schema';
import ThemeSettingsFields from '@/components/admin/settings/theme-settings-fields';

interface ThemeSettingsFormProps {
  form: UseFormReturn<PlatformSettingsFormValues>;
}

export default function ThemeSettingsForm({ form }: ThemeSettingsFormProps) {
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);

  const handleMediaSelect = useCallback((selectedItems: Partial<MediaItem>[]) => {
    const selected = selectedItems?.[0];
    if (!selected?.id) return;
    const resolvedUrl =
      selected.urlLarge ||
      selected.urlMedium ||
      selected.urlOriginal ||
      selected.urlThumbnail ||
      '';

    form.setValue('logoMediaId', selected.id, { shouldDirty: true, shouldTouch: true });
    form.setValue('logoUrl', resolvedUrl, { shouldDirty: true, shouldTouch: true });
    setIsMediaDialogOpen(false);
  }, [form]);

  return (
    <>
      <ThemeSettingsFields
        form={form}
        onSelectLogo={() => setIsMediaDialogOpen(true)}
        onClearLogo={() => {
          form.setValue('logoMediaId', null, { shouldDirty: true, shouldTouch: true });
          form.setValue('logoUrl', '', { shouldDirty: true, shouldTouch: true });
        }}
      />

      <ChooseMediaDialog
        isOpen={isMediaDialogOpen}
        onOpenChange={setIsMediaDialogOpen}
        allowMultiple={false}
        onMediaSelect={handleMediaSelect}
      />
    </>
  );
}
