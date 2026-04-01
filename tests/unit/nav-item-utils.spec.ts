/**
 * @fileoverview Testes unitários para deduplicação de itens do header público.
 * BDD: Garantir que o header preserve o destaque de /lots sem renderizar entradas duplicadas.
 */

import { describe, expect, it } from 'vitest';

import { dedupeNavItems } from '../../src/components/layout/nav-item-utils';

describe('dedupeNavItems', () => {
  it('remove duplicatas por href preservando a primeira ocorrência', () => {
    const items = [
      { href: '/lots', label: 'Lotes' },
      { href: '/', label: 'Início' },
      { href: '/home-v2', label: 'Nova Home' },
      { href: '/lots', label: 'Lotes' },
    ];

    expect(dedupeNavItems(items)).toEqual([
      { href: '/lots', label: 'Lotes' },
      { href: '/', label: 'Início' },
      { href: '/home-v2', label: 'Nova Home' },
    ]);
  });

  it('remove duplicatas de mega menu por contentKey', () => {
    const items = [
      { label: 'Modalidades', contentKey: 'modalities' as const },
      { label: 'Comitentes', contentKey: 'consignors' as const },
      { label: 'Modalidades', contentKey: 'modalities' as const },
    ];

    expect(dedupeNavItems(items)).toEqual([
      { label: 'Modalidades', contentKey: 'modalities' },
      { label: 'Comitentes', contentKey: 'consignors' },
    ]);
  });
});