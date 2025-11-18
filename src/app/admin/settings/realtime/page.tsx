// src/app/admin/settings/realtime/page.tsx
'use client';

import React from 'react';
import SettingsFormWrapper from '../settings-form-wrapper';
import { RealtimeConfig } from '../realtime-config';

export default function RealtimeSettingsPage() {
  return (
    <SettingsFormWrapper
      title="Configurações em Tempo Real"
      description="Gerencie soft close, blockchain e monetização do portal de advogados."
    >
      {(form) => <RealtimeConfig form={form} />}
    </SettingsFormWrapper>
  );
}
