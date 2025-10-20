// src/app/admin/settings/payment/page.tsx
/**
 * @fileoverview Página de administração para as configurações de Gateway de Pagamento.
 * Permite ao administrador configurar o provedor de pagamento, comissões e chaves de API.
 */
'use client';

import React from 'react';
import SettingsFormWrapper from '../settings-form-wrapper';
import { FormField, FormItem, FormLabel, FormDescription, FormControl } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export default function PaymentGatewaySettingsPage() {
  return (
    <SettingsFormWrapper
      title="Gateway de Pagamento"
      description="Gerencie o provedor de pagamentos, comissão da plataforma e chaves de API."
    >
      {(form) => (
        <>
          <FormField
            control={form.control}
            name="paymentGatewaySettings.defaultGateway"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gateway de Pagamento Padrão</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Manual">Processamento Manual</SelectItem>
                    <SelectItem value="Pagarme">Pagar.me (Em breve)</SelectItem>
                    <SelectItem value="Stripe">Stripe (Em breve)</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Selecione o provedor para processar pagamentos.</FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="paymentGatewaySettings.platformCommissionPercentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comissão da Plataforma (%)</FormLabel>
                <FormControl><Input type="number" step="0.1" {...field} value={field.value ?? 5} /></FormControl>
                <FormDescription>Percentual da comissão retida sobre cada venda.</FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="paymentGatewaySettings.gatewayApiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chave de API do Gateway</FormLabel>
                <FormControl><Input type="password" {...field} value={field.value ?? ''} /></FormControl>
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="paymentGatewaySettings.gatewayEncryptionKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chave de Criptografia do Gateway</FormLabel>
                <FormControl><Input type="password" {...field} value={field.value ?? ''} /></FormControl>
              </FormItem>
            )}
          />
        </>
      )}
    </SettingsFormWrapper>
  );
}
