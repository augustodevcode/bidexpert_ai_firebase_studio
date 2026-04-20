/**
 * @fileoverview Testes unitarios do painel de Dev Info reutilizavel.
 * BDD: Garantir que o painel renderiza os dados padrao e suporta uso sem titulo no modal.
 * TDD: Validar labels, valores e variacoes de apresentacao.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DevInfoIndicator from '../../src/components/layout/dev-info-indicator';

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    userProfileWithPermissions: { email: 'admin@bidexpert.ai' },
    activeTenantId: '1',
  }),
}));

describe('DevInfoIndicator', () => {
  it('renderiza labels e valores esperados', async () => {
    render(<DevInfoIndicator />);

    await waitFor(() => {
      expect(screen.getByText('Dev Info')).toBeInTheDocument();
    });

    expect(screen.getByText('Tenant ID')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('admin@bidexpert.ai')).toBeInTheDocument();
    expect(screen.getByText('DB System')).toBeInTheDocument();
    // DB system falls back to 'MYSQL' when NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM is not set
    expect(screen.getByTestId('dev-info-indicator')).toBeInTheDocument();
    expect(screen.getByText('Project')).toBeInTheDocument();
  });

  it('permite ocultar o titulo para uso dentro do modal', () => {
    render(<DevInfoIndicator showTitle={false} className="border-0 bg-transparent p-0" />);

    expect(screen.queryByText('Dev Info')).not.toBeInTheDocument();
    expect(screen.getByTestId('dev-info-indicator')).toBeInTheDocument();
  });
});
