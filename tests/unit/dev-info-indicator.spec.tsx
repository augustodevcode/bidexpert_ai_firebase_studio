/**
 * @fileoverview Testes unitarios do rodape de Dev Info no dashboard.
 * BDD: Garantir que o rodape exibe as informacoes padrao de ambiente.
 * TDD: Validar renderizacao de labels e valores fixos.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DevInfoIndicator from '../../src/components/layout/dev-info-indicator';

describe('DevInfoIndicator', () => {
  it('renderiza labels e valores esperados', () => {
    render(<DevInfoIndicator />);

    expect(screen.getByText('Dev Info')).toBeInTheDocument();
    expect(screen.getByText('Tenant ID')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('admin@bidexpert.ai')).toBeInTheDocument();
    expect(screen.getByText('DB System')).toBeInTheDocument();
    expect(screen.getByText('MYSQL')).toBeInTheDocument();
    expect(screen.getByText('Project')).toBeInTheDocument();
    expect(screen.getByText('bidexpert')).toBeInTheDocument();
  });
});
