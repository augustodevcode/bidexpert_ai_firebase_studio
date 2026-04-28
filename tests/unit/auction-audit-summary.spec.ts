// @vitest-environment jsdom
/**
 * @fileoverview Cobertura unitária do resumo mínimo de auditoria do leilão.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { AuctionAuditSummary } from '@/components/admin/auctions/auction-audit-summary';

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    React.createElement('a', { href, ...props }, children)
  ),
}));

describe('AuctionAuditSummary', () => {
  it('renderiza dados e atalho para o histórico completo', () => {
    render(
      React.createElement(AuctionAuditSummary, {
        createdByUserId: '42',
        updatedAt: '2026-04-27T10:00:00.000Z',
        submittedAt: '2026-04-27T11:00:00.000Z',
        validatedAt: '2026-04-27T12:00:00.000Z',
        validatedBy: '84',
        historyHref: '/admin/auctions/auction-1/history',
      }),
    );

    expect(screen.getByText('Auditoria mínima')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('84')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /abrir histórico completo/i })).toHaveAttribute(
      'href',
      '/admin/auctions/auction-1/history',
    );
  });

  it('não renderiza quando não há dados auditáveis nem histórico', () => {
    const { container } = render(React.createElement(AuctionAuditSummary));

    expect(container).toBeEmptyDOMElement();
  });
});