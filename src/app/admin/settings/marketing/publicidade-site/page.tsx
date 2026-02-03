/**
 * @fileoverview Página de configurações de Publicidade do Site (Super Oportunidades).
 */
'use client';

import React from 'react';
import SettingsFormWrapper from '../../settings-form-wrapper';
import SiteAdsSettingsFields from '@/components/admin/settings/site-ads-settings-fields';

export default function MarketingSiteAdsSettingsPage() {
  return (
    <SettingsFormWrapper
      title="Publicidade do Site"
      description="Controle a visibilidade da seção Super Oportunidades e a frequência de rolagem do carousel."
    >
      {(form) => <SiteAdsSettingsFields form={form} />}
    </SettingsFormWrapper>
  );
}
