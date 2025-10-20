// src/app/admin/settings/notifications/page.tsx
/**
 * @fileoverview Página de administração para as configurações de Notificações.
 * Permite ao administrador habilitar ou desabilitar o envio de e-mails
 * automáticos para diferentes eventos da plataforma.
 */
'use client';

import React from 'react';
import SettingsFormWrapper from '../settings-form-wrapper';
import { FormField, FormItem, FormLabel, FormDescription, FormControl } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';

export default function NotificationSettingsPage() {
  return (
    <SettingsFormWrapper
      title="Configurações de Notificações"
      description="Controle quais notificações por e-mail são enviadas aos usuários e assinantes."
    >
      {(form) => (
        <>
          <FormField
            control={form.control}
            name="notificationSettings.notifyOnNewAuction"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Novos Leilões</FormLabel>
                  <FormDescription>Enviar notificação quando um novo leilão for publicado.</FormDescription>
                </div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notificationSettings.notifyOnFeaturedLot"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Lotes em Destaque</FormLabel>
                  <FormDescription>Notificar assinantes sobre novos lotes em destaque.</FormDescription>
                </div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notificationSettings.notifyOnAuctionEndingSoon"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Leilões Encerrando</FormLabel>
                  <FormDescription>Enviar alerta quando leilões estiverem próximos do fim.</FormDescription>
                </div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notificationSettings.notifyOnPromotions"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Promoções e Banners</FormLabel>
                  <FormDescription>Enviar e-mails sobre promoções especiais da plataforma.</FormDescription>
                </div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )}
          />
        </>
      )}
    </SettingsFormWrapper>
  );
}
