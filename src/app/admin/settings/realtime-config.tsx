// src/app/admin/settings/realtime-config.tsx
'use client';

import React from 'react';
import { FormField, FormItem, FormLabel, FormDescription, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { cn } from '@/lib/utils';
import type { LawyerMonetizationModel } from '@/lib/feature-flags';

interface RealtimeConfigProps {
  form: UseFormReturn<any>;
}

export function RealtimeConfig({ form }: RealtimeConfigProps) {
  const blockchainEnabled = form.watch('realtimeSettings.blockchainEnabled');
  const softCloseEnabled = form.watch('realtimeSettings.softCloseEnabled');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Parâmetros em Tempo Real</h3>
      </div>

      {/* Blockchain */}
      <FormField
        control={form.control}
        name="realtimeSettings.blockchainEnabled"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base" htmlFor="blockchain">Blockchain Habilitado</FormLabel>
              <FormDescription>
                Ativa registro imutável de lances e transações via Hyperledger Fabric
              </FormDescription>
            </div>
            <FormControl>
              <input
                id="blockchain"
                type="checkbox"
                checked={Boolean(field.value)}
                onChange={(event) => field.onChange(event.target.checked)}
                className="h-4 w-4 rounded border border-border"
              />
            </FormControl>
          </FormItem>
        )}
      />

      {blockchainEnabled && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Atenção:</strong> Blockchain requer configuração de nós Hyperledger. Recomendado apenas para produção.
          </AlertDescription>
        </Alert>
      )}

      {/* Lawyer Monetization */}
      <FormField
        control={form.control}
        name="realtimeSettings.lawyerMonetizationModel"
        render={({ field }) => {
          const options: Array<{
            value: LawyerMonetizationModel;
            title: string;
            description: string;
            id: string;
          }> = [
            {
              value: 'SUBSCRIPTION',
              title: 'Assinatura Mensal',
              description: 'Taxa fixa (ex: R$ 199/mês) para acesso ilimitado ao portal',
              id: 'lawyer-model-subscription',
            },
            {
              value: 'PAY_PER_USE',
              title: 'Pagar por Uso',
              description: 'Cobrança por consulta de matrícula, due diligence, relatório (ex: R$ 50-100)',
              id: 'lawyer-model-pay-per-use',
            },
            {
              value: 'REVENUE_SHARE',
              title: 'Revenue Share',
              description: '% do valor do arremate quando advogado auxilia (ex: 2-5%)',
              id: 'lawyer-model-revenue-share',
            },
          ];

          const handleSelection = (value: LawyerMonetizationModel) => {
            field.onChange(value);
            form.setValue('realtimeSettings.lawyerMonetizationModel', value, {
              shouldDirty: true,
              shouldTouch: true,
            });
          };

          return (
            <FormItem className="space-y-3">
              <FormLabel>Modelo de Monetização do Portal de Advogados</FormLabel>
              <FormDescription>
                Define como os advogados serão cobrados pela plataforma
              </FormDescription>
              <FormControl>
                <div className="space-y-3" data-ai-id="lawyer-monetization-options">
                  {options.map((option) => {
                    const isSelected = field.value === option.value;
                    return (
                      <label
                        key={option.value}
                        htmlFor={option.id}
                        data-ai-id={`lawyer-monetization-option-${option.value.toLowerCase()}`}
                        className={cn(
                          'flex cursor-pointer items-center space-x-3 rounded-lg border p-3 transition',
                          isSelected
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'hover:border-primary'
                        )}
                        aria-checked={isSelected}
                      >
                        <input
                          id={option.id}
                          type="radio"
                          name="realtimeSettings.lawyerMonetizationModel"
                          value={option.value}
                          data-ai-id={`lawyer-monetization-input-${option.value.toLowerCase()}`}
                          checked={isSelected}
                          onChange={(event) =>
                            handleSelection(event.target.value as LawyerMonetizationModel)
                          }
                          className="h-4 w-4 border border-border"
                        />
                        <div className="flex-1">
                          <span className="block font-medium">{option.title}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </FormControl>
            </FormItem>
          );
        }}
      />

      {/* Soft Close */}
      <FormField
        control={form.control}
        name="realtimeSettings.softCloseEnabled"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base" htmlFor="softclose">Soft Close Habilitado (Default da Plataforma)</FormLabel>
              <FormDescription>
                Estende automaticamente o prazo do leilão se houver lances nos últimos minutos.
                <br />
                <span className="text-xs text-muted-foreground italic">
                  Este valor é o padrão da plataforma. Cada leilão pode sobrescrever esta configuração.
                </span>
              </FormDescription>
            </div>
            <FormControl>
              <input
                id="softclose"
                type="checkbox"
                checked={Boolean(field.value)}
                onChange={(event) => field.onChange(event.target.checked)}
                className="h-4 w-4 rounded border border-border"
              />
            </FormControl>
          </FormItem>
        )}
      />

      {softCloseEnabled && (
        <FormField
          control={form.control}
          name="realtimeSettings.softCloseMinutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minutos antes do fechamento para disparar extensão</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    {...field}
                    value={field.value ?? 5}
                    onChange={(event) => field.onChange(parseInt(event.target.value, 10) || 1)}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">minutos</span>
                </div>
              </FormControl>
              <FormDescription>
                Se houver lance com menos de {form.watch('realtimeSettings.softCloseMinutes') ?? 5} minutos para o fim, o leilão é
                estendido por +5 minutos automaticamente.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
