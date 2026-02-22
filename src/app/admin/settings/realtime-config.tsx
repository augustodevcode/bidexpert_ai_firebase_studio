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
  const communicationStrategy = form.watch('realtimeSettings.communicationStrategy');
  const videoStrategy = form.watch('realtimeSettings.videoStrategy');
  const idempotencyStrategy = form.watch('realtimeSettings.idempotencyStrategy');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Parâmetros em Tempo Real</h3>
      </div>

      {/* === V2 Monitor Pregão: Communication Strategy === */}
      <div data-ai-id="admin-toggle-communication-strategy" className="space-y-3">
        <FormField
          control={form.control}
          name="realtimeSettings.communicationStrategy"
          render={({ field }) => {
            const options = [
              {
                value: 'WEBSOCKET' as const,
                title: 'WebSocket (Socket.io)',
                description: 'Comunicação bidirecional em tempo real. Lances são transmitidos instantaneamente via Socket.io com fallback automático para Long Polling. Ideal para pregões ao vivo com alta frequência de lances.',
                id: 'comm-strategy-websocket',
              },
              {
                value: 'POLLING' as const,
                title: 'Polling HTTP',
                description: 'O cliente faz requisições periódicas ao servidor (intervalo configurável). Mais simples de operar e não requer infraestrutura WebSocket/Redis. Adequado para leilões com ritmo mais lento.',
                id: 'comm-strategy-polling',
              },
            ];
            return (
              <FormItem className="space-y-3">
                <FormLabel className="text-base font-semibold">Estratégia de Comunicação</FormLabel>
                <FormDescription>
                  Define como os lances e atualizações são enviados do servidor para os navegadores dos arrematantes.
                </FormDescription>
                <FormControl>
                  <div className="space-y-3">
                    {options.map((option) => {
                      const isSelected = field.value === option.value;
                      return (
                        <label
                          key={option.value}
                          htmlFor={option.id}
                          data-ai-id={`comm-strategy-option-${option.value.toLowerCase()}`}
                          className={cn(
                            'flex cursor-pointer items-center space-x-3 rounded-lg border p-3 transition',
                            isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary'
                          )}
                        >
                          <input
                            id={option.id}
                            type="radio"
                            name="realtimeSettings.communicationStrategy"
                            value={option.value}
                            checked={isSelected}
                            onChange={() => field.onChange(option.value)}
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
        {communicationStrategy === 'WEBSOCKET' && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>WebSocket ativo:</strong> Requer servidor Socket.io + Redis para escalar horizontalmente. Latência típica: &lt;100ms.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* === V2 Monitor Pregão: Video Strategy === */}
      <div data-ai-id="admin-toggle-video-strategy" className="space-y-3">
        <FormField
          control={form.control}
          name="realtimeSettings.videoStrategy"
          render={({ field }) => {
            const options = [
              {
                value: 'HLS' as const,
                title: 'HLS (HTTP Live Streaming)',
                description: 'Stream de vídeo adaptativo via HTTP. Funciona em todos os navegadores nativamente. Latência de 5-15s (aceitável para leilões). Usa CDN para escala.',
                id: 'video-strategy-hls',
              },
              {
                value: 'WEBRTC' as const,
                title: 'WebRTC (Peer-to-Peer)',
                description: 'Streaming com latência ultra-baixa (<1s). Ideal para pregões presenciais+online simultâneos. Requer servidor TURN/STUN. Mais complexo de operar.',
                id: 'video-strategy-webrtc',
              },
              {
                value: 'DISABLED' as const,
                title: 'Desabilitado',
                description: 'Sem transmissão de vídeo. O monitor mostra apenas a área de lances e informações do lote. Recomendado se o pregão não necessita de streaming visual.',
                id: 'video-strategy-disabled',
              },
            ];
            return (
              <FormItem className="space-y-3">
                <FormLabel className="text-base font-semibold">Estratégia de Vídeo</FormLabel>
                <FormDescription>
                  Define o protocolo de transmissão de vídeo ao vivo durante o pregão.
                </FormDescription>
                <FormControl>
                  <div className="space-y-3">
                    {options.map((option) => {
                      const isSelected = field.value === option.value;
                      return (
                        <label
                          key={option.value}
                          htmlFor={option.id}
                          data-ai-id={`video-strategy-option-${option.value.toLowerCase()}`}
                          className={cn(
                            'flex cursor-pointer items-center space-x-3 rounded-lg border p-3 transition',
                            isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary'
                          )}
                        >
                          <input
                            id={option.id}
                            type="radio"
                            name="realtimeSettings.videoStrategy"
                            value={option.value}
                            checked={isSelected}
                            onChange={() => field.onChange(option.value)}
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
        {videoStrategy === 'WEBRTC' && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>WebRTC:</strong> Requer servidores TURN/STUN configurados. Para ambientes de produção, considere Twilio ou mediasoup.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* === V2 Monitor Pregão: Idempotency Strategy === */}
      <div data-ai-id="admin-toggle-idempotency-strategy" className="space-y-3">
        <FormField
          control={form.control}
          name="realtimeSettings.idempotencyStrategy"
          render={({ field }) => {
            const options = [
              {
                value: 'SERVER_HASH' as const,
                title: 'Hash no Servidor (SHA-256)',
                description: 'O servidor gera a chave de idempotência via SHA-256(lotId + bidderId + amount + timestamp_10s). Protege contra cliques duplos e retransmissões. Zero esforço do frontend.',
                id: 'idempotency-server-hash',
              },
              {
                value: 'CLIENT_UUID' as const,
                title: 'UUID no Cliente',
                description: 'O frontend gera um UUID v4 único por tentativa de lance e o envia no header X-Idempotency-Key. O servidor rejeita UUIDs duplicados. Mais transparente para auditoria.',
                id: 'idempotency-client-uuid',
              },
            ];
            return (
              <FormItem className="space-y-3">
                <FormLabel className="text-base font-semibold">Estratégia de Idempotência</FormLabel>
                <FormDescription>
                  Define como o sistema previne lances duplicados (double-click, retransmissão de rede, race condition).
                </FormDescription>
                <FormControl>
                  <div className="space-y-3">
                    {options.map((option) => {
                      const isSelected = field.value === option.value;
                      return (
                        <label
                          key={option.value}
                          htmlFor={option.id}
                          data-ai-id={`idempotency-option-${option.value.toLowerCase().replace('_', '-')}`}
                          className={cn(
                            'flex cursor-pointer items-center space-x-3 rounded-lg border p-3 transition',
                            isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary'
                          )}
                        >
                          <input
                            id={option.id}
                            type="radio"
                            name="realtimeSettings.idempotencyStrategy"
                            value={option.value}
                            checked={isSelected}
                            onChange={() => field.onChange(option.value)}
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
