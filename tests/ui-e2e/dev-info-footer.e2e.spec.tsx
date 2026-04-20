/**
 * @fileoverview Teste UI E2E do gatilho Dev Info sob demanda.
 * BDD: Garantir que o modal so aparece apos clique no botao da sidebar.
 * TDD: Verificar abertura do dialog e exibicao dos campos principais.
 */
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import EnvInfoButton from '../../src/components/layout/env-info-button';

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    userProfileWithPermissions: {
      email: 'admin@bidexpert.ai',
      tenants: [{ tenant: { id: '1' } }],
    },
    activeTenantId: '1',
  }),
}));

describe('Dev Info Button - UI E2E', () => {
  beforeEach(async () => {
    await page.viewport(1280, 720);
  });

  it('abre o modal e exibe os campos principais', async () => {
    await render(
      <div className="p-6 bg-background" data-ai-id="dev-info-e2e-wrapper">
        <EnvInfoButton />
      </div>
    );

    await expect.element(page.getByRole('button', { name: 'Dev Info' })).toBeVisible();
    await page.getByRole('button', { name: 'Dev Info' }).click();

    const modal = page.getByTestId('dev-info-indicator');
    await expect.element(modal).toBeVisible();

    await expect.element(page.getByText('1', { exact: true })).toBeVisible();
    await expect.element(page.getByText('admin@bidexpert.ai', { exact: true })).toBeVisible();
    await expect.element(page.getByText('MYSQL', { exact: true })).toBeVisible();
    await expect.element(page.getByText('bidexpert', { exact: true })).toBeVisible();
  });
});
