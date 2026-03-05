/**
 * @fileoverview Testes unitarios do rodape de Dev Info no dashboard.
 * BDD: Garantir que o rodape exibe as informacoes padrao de ambiente.
 * TDD: Validar renderizacao de labels e valores do contexto de autenticacao.
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
});
