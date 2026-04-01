import { describe, expect, it } from 'vitest';
import { appendSessionAssetId, getSessionScopedAssets } from '@/components/admin/wizard/wizard-session-utils';

describe('wizard-session-utils', () => {
  it('deduplica ids de ativos da sessão', () => {
    expect(appendSessionAssetId(['10'], '10')).toEqual(['10']);
    expect(appendSessionAssetId(['10'], '11')).toEqual(['10', '11']);
  });

  it('restringe o loteamento aos ativos criados na sessão quando houver ids rastreados', () => {
    const assets = [
      { id: '10', title: 'Ativo Antigo' },
      { id: '11', title: 'Ativo da Sessão' },
      { id: 12n, title: 'Outro Ativo da Sessão' },
    ] as any[];

    expect(getSessionScopedAssets(assets as any, ['11', '12'])).toEqual([
      { id: '11', title: 'Ativo da Sessão' },
      { id: 12n, title: 'Outro Ativo da Sessão' },
    ]);
  });

  it('mantém o comportamento legado quando ainda não há ativos rastreados na sessão', () => {
    const assets = [
      { id: '10', title: 'Ativo A' },
      { id: '11', title: 'Ativo B' },
    ] as any[];

    expect(getSessionScopedAssets(assets as any, [])).toEqual(assets);
    expect(getSessionScopedAssets(assets as any, undefined)).toEqual(assets);
  });
});