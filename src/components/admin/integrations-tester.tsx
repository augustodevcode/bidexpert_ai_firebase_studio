'use client';

import React, { useState } from 'react';

export interface IntegrationsTesterProps {
  tenantId: string;
}

/**
 * Integrations Tester Component
 * Componente para testar integrações com FIPE, Cartório e Tribunal
 * Todos os elementos têm className contextualizados para fácil identificação nos testes
 */
export function IntegrationsTester({ tenantId }: IntegrationsTesterProps) {
  const [activeTab, setActiveTab] = useState<'fipe' | 'cartorio' | 'tribunal'>('fipe');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // FIPE Query
  const [fipePlate, setFipePlate] = useState('ABC1234');
  const [fipeBrand, setFipeBrand] = useState('FIAT');
  const [fipaModel, setFipaModel] = useState('UNO');
  const [fipaYear, setFipaYear] = useState('2020');

  // Cartório Query
  const [cartorioCode, setCartorioCode] = useState('SP');
  const [cartorioMatricula, setCartorioMatricula] = useState('12345');

  // Tribunal Query
  const [tribunalCode, setTribunalCode] = useState('SP');
  const [tribunalProcess, setTribunalProcess] = useState('0000001');

  const handleTestFipe = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/integrations/fipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate: fipePlate || undefined,
          brand: fipeBrand || undefined,
          model: fipaModel || undefined,
          year: fipaYear ? parseInt(fipaYear) : undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to query FIPE');
      const json = await response.json();
      setResult(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to query FIPE');
    } finally {
      setLoading(false);
    }
  };

  const handleTestCartorio = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/integrations/cartorio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartorioCode,
          matricula: cartorioMatricula,
        }),
      });

      if (!response.ok) throw new Error('Failed to query Cartório');
      const json = await response.json();
      setResult(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to query Cartório');
    } finally {
      setLoading(false);
    }
  };

  const handleTestTribunal = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/integrations/tribunal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtCode: tribunalCode,
          processNumber: tribunalProcess,
        }),
      });

      if (!response.ok) throw new Error('Failed to query Tribunal');
      const json = await response.json();
      setResult(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to query Tribunal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="integrations-tester-container space-y-6 p-6 bg-white rounded-lg shadow"
      data-testid="integrations-tester-container"
    >
      <h2 className="integrations-tester-title text-2xl font-bold">Testador de Integrações</h2>

      {/* Tabs */}
      <div className="integrations-tester-tabs flex gap-2 border-b">
        <button
          className={`integrations-tester-tab-fipe px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'fipe'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('fipe')}
          data-testid="integrations-tester-tab-fipe"
        >
          FIPE
        </button>
        <button
          className={`integrations-tester-tab-cartorio px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'cartorio'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('cartorio')}
          data-testid="integrations-tester-tab-cartorio"
        >
          Cartório
        </button>
        <button
          className={`integrations-tester-tab-tribunal px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'tribunal'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('tribunal')}
          data-testid="integrations-tester-tab-tribunal"
        >
          Tribunal
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="integrations-tester-error bg-red-50 border border-red-200 p-3 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* FIPE Tab */}
      {activeTab === 'fipe' && (
        <div className="integrations-tester-fipe-panel space-y-4" data-testid="integrations-tester-fipe-panel">
          <h3 className="integrations-tester-fipe-title text-lg font-semibold">
            Consulta FIPE - Valores de Veículos
          </h3>
          <div className="integrations-tester-fipe-inputs space-y-3">
            <div className="integrations-tester-fipe-plate">
              <label className="integrations-tester-fipe-plate-label block text-sm font-medium mb-1">
                Placa (opcional):
                <input
                  type="text"
                  className="integrations-tester-fipe-plate-input w-full mt-1 px-3 py-2 border rounded"
                  value={fipePlate}
                  onChange={(e) => setFipePlate(e.target.value)}
                  placeholder="ABC1234"
                  data-testid="integrations-fipe-plate-input"
                />
              </label>
            </div>
            <div className="integrations-tester-fipe-details space-y-3">
              <p className="text-sm text-gray-600">Ou informar os dados do veículo:</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="integrations-tester-fipe-brand">
                  <label className="integrations-tester-fipe-brand-label block text-sm font-medium mb-1">
                    Marca:
                    <input
                      type="text"
                      className="integrations-tester-fipe-brand-input w-full mt-1 px-3 py-2 border rounded"
                      value={fipeBrand}
                      onChange={(e) => setFipeBrand(e.target.value)}
                      placeholder="FIAT"
                      data-testid="integrations-fipe-brand-input"
                    />
                  </label>
                </div>
                <div className="integrations-tester-fipe-model">
                  <label className="integrations-tester-fipe-model-label block text-sm font-medium mb-1">
                    Modelo:
                    <input
                      type="text"
                      className="integrations-tester-fipe-model-input w-full mt-1 px-3 py-2 border rounded"
                      value={fipaModel}
                      onChange={(e) => setFipaModel(e.target.value)}
                      placeholder="UNO"
                      data-testid="integrations-fipe-model-input"
                    />
                  </label>
                </div>
                <div className="integrations-tester-fipe-year">
                  <label className="integrations-tester-fipe-year-label block text-sm font-medium mb-1">
                    Ano:
                    <input
                      type="number"
                      className="integrations-tester-fipe-year-input w-full mt-1 px-3 py-2 border rounded"
                      value={fipaYear}
                      onChange={(e) => setFipaYear(e.target.value)}
                      placeholder="2020"
                      data-testid="integrations-fipe-year-input"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
          <button
            className="integrations-tester-fipe-button px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            onClick={handleTestFipe}
            disabled={loading}
            data-testid="integrations-fipe-query-button"
          >
            {loading ? 'Consultando...' : 'Consultar FIPE'}
          </button>
        </div>
      )}

      {/* Cartório Tab */}
      {activeTab === 'cartorio' && (
        <div
          className="integrations-tester-cartorio-panel space-y-4"
          data-testid="integrations-tester-cartorio-panel"
        >
          <h3 className="integrations-tester-cartorio-title text-lg font-semibold">
            Consulta Cartório - Matrículas Imobiliárias
          </h3>
          <div className="integrations-tester-cartorio-inputs space-y-3">
            <div className="integrations-tester-cartorio-code">
              <label className="integrations-tester-cartorio-code-label block text-sm font-medium mb-1">
                Código do Cartório:
                <input
                  type="text"
                  className="integrations-tester-cartorio-code-input w-full mt-1 px-3 py-2 border rounded"
                  value={cartorioCode}
                  onChange={(e) => setCartorioCode(e.target.value)}
                  placeholder="SP"
                  data-testid="integrations-cartorio-code-input"
                />
              </label>
            </div>
            <div className="integrations-tester-cartorio-matricula">
              <label className="integrations-tester-cartorio-matricula-label block text-sm font-medium mb-1">
                Matrícula:
                <input
                  type="text"
                  className="integrations-tester-cartorio-matricula-input w-full mt-1 px-3 py-2 border rounded"
                  value={cartorioMatricula}
                  onChange={(e) => setCartorioMatricula(e.target.value)}
                  placeholder="12345"
                  data-testid="integrations-cartorio-matricula-input"
                />
              </label>
            </div>
          </div>
          <button
            className="integrations-tester-cartorio-button px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            onClick={handleTestCartorio}
            disabled={loading}
            data-testid="integrations-cartorio-query-button"
          >
            {loading ? 'Consultando...' : 'Consultar Cartório'}
          </button>
        </div>
      )}

      {/* Tribunal Tab */}
      {activeTab === 'tribunal' && (
        <div
          className="integrations-tester-tribunal-panel space-y-4"
          data-testid="integrations-tester-tribunal-panel"
        >
          <h3 className="integrations-tester-tribunal-title text-lg font-semibold">
            Consulta Tribunal - Processos Judiciais
          </h3>
          <div className="integrations-tester-tribunal-inputs space-y-3">
            <div className="integrations-tester-tribunal-code">
              <label className="integrations-tester-tribunal-code-label block text-sm font-medium mb-1">
                Código do Tribunal:
                <input
                  type="text"
                  className="integrations-tester-tribunal-code-input w-full mt-1 px-3 py-2 border rounded"
                  value={tribunalCode}
                  onChange={(e) => setTribunalCode(e.target.value)}
                  placeholder="SP"
                  data-testid="integrations-tribunal-code-input"
                />
              </label>
            </div>
            <div className="integrations-tester-tribunal-process">
              <label className="integrations-tester-tribunal-process-label block text-sm font-medium mb-1">
                Número do Processo:
                <input
                  type="text"
                  className="integrations-tester-tribunal-process-input w-full mt-1 px-3 py-2 border rounded"
                  value={tribunalProcess}
                  onChange={(e) => setTribunalProcess(e.target.value)}
                  placeholder="0000001"
                  data-testid="integrations-tribunal-process-input"
                />
              </label>
            </div>
          </div>
          <button
            className="integrations-tester-tribunal-button px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            onClick={handleTestTribunal}
            disabled={loading}
            data-testid="integrations-tribunal-query-button"
          >
            {loading ? 'Consultando...' : 'Consultar Tribunal'}
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="integrations-tester-result bg-green-50 border border-green-200 p-4 rounded">
          <h4 className="integrations-tester-result-title font-semibold text-green-900 mb-2">
            Resultado da Consulta
          </h4>
          <pre className="integrations-tester-result-content bg-white p-3 rounded border text-xs overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
