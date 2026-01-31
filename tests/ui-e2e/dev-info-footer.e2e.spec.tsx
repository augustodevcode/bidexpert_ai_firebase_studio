/**
 * @fileoverview Teste UI E2E do rodape Dev Info no dashboard.
 * BDD: Garantir que o rodape exibe dados padrao em tela.
 * TDD: Verificar visibilidade dos campos principais.
 */
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import DevInfoIndicator from '../../src/components/layout/dev-info-indicator';

describe('Dev Info Footer - UI E2E', () => {
  beforeEach(async () => {
    await page.viewport(1280, 720);
  });

  it('exibe os campos principais do rodape', async () => {
    await render(
      <div className="p-6 bg-background" data-ai-id="dev-info-e2e-wrapper">
        <DevInfoIndicator />
      </div>
    );

    const footer = page.getByTestId('dev-info-indicator');
    await expect.element(footer).toBeVisible();

    await expect.element(page.getByText('1', { exact: true })).toBeVisible();
    await expect.element(page.getByText('admin@bidexpert.ai', { exact: true })).toBeVisible();
    await expect.element(page.getByText('MYSQL', { exact: true })).toBeVisible();
    await expect.element(page.getByText('bidexpert', { exact: true })).toBeVisible();
  });
});
