'use client';

import React, { useState, useEffect } from 'react';
import { FeatureFlags } from '@/lib/feature-flags';

export interface AdminSettingsPanelProps {
  tenantId: string;
}

/**
 * Admin Settings Panel Component
 * Componente para gerenciar feature flags e configurações da plataforma
 * Todos os elementos têm className contextualizados para fácil identificação nos testes
 */
export function AdminSettingsPanel({ tenantId }: AdminSettingsPanelProps) {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Carregar feature flags ao montar
  useEffect(() => {
    const fetchFeatureFlags = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/feature-flags');
        if (!response.ok) throw new Error('Failed to fetch feature flags');
        const json = await response.json();
        setFeatureFlags(json.data.featureFlags);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchFeatureFlags();
  }, []);

  const handleToggle = async (key: keyof FeatureFlags, value: boolean) => {
    if (!featureFlags) return;

    const updated = { ...featureFlags, [key]: value };
    setFeatureFlags(updated);

    try {
      setSaving(true);
      const response = await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
      if (!response.ok) throw new Error('Failed to save');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      // Revert change
      setFeatureFlags(featureFlags);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-settings-panel-loading" data-testid="admin-settings-loading">
        <p className="text-gray-500">Carregando configurações...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-settings-panel-error" data-testid="admin-settings-error">
        <p className="text-red-600">Erro: {error}</p>
      </div>
    );
  }

  if (!featureFlags) {
    return (
      <div className="admin-settings-panel-empty" data-testid="admin-settings-empty">
        <p className="text-gray-500">Nenhuma configuração disponível</p>
      </div>
    );
  }

  return (
    <div
      className="admin-settings-panel-container space-y-6 p-6 bg-white rounded-lg shadow"
      data-testid="admin-settings-container"
    >
      <h2 className="admin-settings-panel-title text-2xl font-bold">Configurações da Plataforma</h2>

      {/* Soft Close Settings */}
      <div className="admin-settings-softclose-section border-t pt-4">
        <h3 className="admin-settings-softclose-title text-lg font-semibold mb-3">
          Configuração de Soft Close
        </h3>
        <div className="admin-settings-softclose-toggle flex items-center gap-4">
          <label className="admin-settings-softclose-label flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="admin-settings-softclose-checkbox w-5 h-5"
              checked={featureFlags.softCloseEnabled}
              onChange={(e) => handleToggle('softCloseEnabled', e.target.checked)}
              disabled={saving}
              data-testid="softclose-enabled-toggle"
            />
            <span className="admin-settings-softclose-text">Habilitar Soft Close</span>
          </label>
          <span className="admin-settings-softclose-status text-sm text-gray-600">
            {featureFlags.softCloseEnabled ? '✓ Ativado' : '✗ Desativado'}
          </span>
        </div>
        {featureFlags.softCloseEnabled && (
          <div className="admin-settings-softclose-minutes mt-2">
            <label className="admin-settings-softclose-minutes-label block text-sm">
              Minutos para Soft Close:
              <input
                type="number"
                className="admin-settings-softclose-minutes-input ml-2 px-3 py-2 border rounded"
                value={featureFlags.softCloseMinutes}
                disabled={saving}
                data-testid="softclose-minutes-input"
                readOnly
              />
            </label>
          </div>
        )}
      </div>

      {/* Blockchain Settings */}
      <div className="admin-settings-blockchain-section border-t pt-4">
        <h3 className="admin-settings-blockchain-title text-lg font-semibold mb-3">
          Configuração de Blockchain
        </h3>
        <div className="admin-settings-blockchain-toggle flex items-center gap-4">
          <label className="admin-settings-blockchain-label flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="admin-settings-blockchain-checkbox w-5 h-5"
              checked={featureFlags.blockchainEnabled}
              onChange={(e) => handleToggle('blockchainEnabled', e.target.checked)}
              disabled={saving}
              data-testid="blockchain-enabled-toggle"
            />
            <span className="admin-settings-blockchain-text">Habilitar Blockchain</span>
          </label>
          <span className="admin-settings-blockchain-status text-sm text-gray-600">
            {featureFlags.blockchainEnabled ? '✓ Ativado' : '✗ Desativado'}
          </span>
        </div>
      </div>

      {/* Lawyer Portal Settings */}
      <div className="admin-settings-lawyer-section border-t pt-4">
        <h3 className="admin-settings-lawyer-title text-lg font-semibold mb-3">
          Portal de Advogados
        </h3>
        <div className="admin-settings-lawyer-toggle flex items-center gap-4">
          <label className="admin-settings-lawyer-label flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="admin-settings-lawyer-checkbox w-5 h-5"
              checked={featureFlags.lawyerPortalEnabled}
              onChange={(e) => handleToggle('lawyerPortalEnabled', e.target.checked)}
              disabled={saving}
              data-testid="lawyer-portal-enabled-toggle"
            />
            <span className="admin-settings-lawyer-text">Habilitar Portal de Advogados</span>
          </label>
          <span className="admin-settings-lawyer-status text-sm text-gray-600">
            {featureFlags.lawyerPortalEnabled ? '✓ Ativado' : '✗ Desativado'}
          </span>
        </div>
        {featureFlags.lawyerPortalEnabled && (
          <div className="admin-settings-lawyer-model mt-3 p-3 bg-gray-50 rounded">
            <p className="admin-settings-lawyer-model-label text-sm font-medium">
              Modelo de Monetização:
              <span className="admin-settings-lawyer-model-value ml-2 font-bold">
                {featureFlags.lawyerMonetizationModel}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* PWA Settings */}
      <div className="admin-settings-pwa-section border-t pt-4">
        <h3 className="admin-settings-pwa-title text-lg font-semibold mb-3">
          Aplicativo Progressivo (PWA)
        </h3>
        <div className="admin-settings-pwa-toggle flex items-center gap-4">
          <label className="admin-settings-pwa-label flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="admin-settings-pwa-checkbox w-5 h-5"
              checked={featureFlags.pwaEnabled}
              onChange={(e) => handleToggle('pwaEnabled', e.target.checked)}
              disabled={saving}
              data-testid="pwa-enabled-toggle"
            />
            <span className="admin-settings-pwa-text">Habilitar PWA</span>
          </label>
          <span className="admin-settings-pwa-status text-sm text-gray-600">
            {featureFlags.pwaEnabled ? '✓ Ativado' : '✗ Desativado'}
          </span>
        </div>
      </div>

      {/* Integration Settings */}
      <div className="admin-settings-integrations-section border-t pt-4">
        <h3 className="admin-settings-integrations-title text-lg font-semibold mb-3">
          Integrações Externas
        </h3>
        <div className="admin-settings-integrations-list space-y-2">
          <label className="admin-settings-integrations-fipe flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="admin-settings-integrations-fipe-checkbox w-5 h-5"
              checked={featureFlags.fipeIntegrationEnabled}
              onChange={(e) => handleToggle('fipeIntegrationEnabled', e.target.checked)}
              disabled={saving}
              data-testid="fipe-integration-toggle"
            />
            <span>FIPE (Valores de Veículos)</span>
          </label>
          <label className="admin-settings-integrations-cartorio flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="admin-settings-integrations-cartorio-checkbox w-5 h-5"
              checked={featureFlags.cartorioIntegrationEnabled}
              onChange={(e) => handleToggle('cartorioIntegrationEnabled', e.target.checked)}
              disabled={saving}
              data-testid="cartorio-integration-toggle"
            />
            <span>Cartório (Matrículas Imobiliárias)</span>
          </label>
          <label className="admin-settings-integrations-tribunal flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="admin-settings-integrations-tribunal-checkbox w-5 h-5"
              checked={featureFlags.tribunalIntegrationEnabled}
              onChange={(e) => handleToggle('tribunalIntegrationEnabled', e.target.checked)}
              disabled={saving}
              data-testid="tribunal-integration-toggle"
            />
            <span>Tribunal (Processos Judiciais)</span>
          </label>
        </div>
      </div>

      {saving && (
        <div className="admin-settings-saving text-center text-blue-600 text-sm">
          Salvando alterações...
        </div>
      )}
    </div>
  );
}
