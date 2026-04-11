/**
 * @fileoverview Regressao visual do conteudo reutilizavel de Dev Info.
 * BDD: Validar apresentacao consistente do painel exibido no modal.
 * TDD: Capturar screenshot do bloco sem o titulo do dialog.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import DevInfoIndicator from '../../src/components/layout/dev-info-indicator';

describe('Dev Info Panel - Visual', () => {
  beforeEach(async () => {
    await page.viewport(1280, 720);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          dbSystem: 'MYSQL',
          dbProvider: 'Prisma',
          project: 'bidexpert',
          remoteServerUrl: 'https://bidexpert-demo.vercel.app',
          branch: 'demo-stable',
        }),
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mantem o painel Dev Info consistente', async () => {
    await render(
      <>
        <style>{`
          *, *::before, *::after {
            animation-duration: 0s !important;
            transition-duration: 0s !important;
            caret-color: transparent !important;
          }
        `}</style>
        <div className="p-6 bg-background" data-ai-id="dev-info-visual-wrapper">
          <DevInfoIndicator
            tenantId="1"
            userEmail="admin@bidexpert.ai"
            showTitle={false}
            className="border-0 bg-transparent p-0"
          />
        </div>
      </>
    );

    const footer = page.getByTestId('dev-info-indicator');
    await expect.element(footer).toBeVisible();
    await expect.element(page.getByText('demo-stable')).toBeVisible();
    await expect(footer).toMatchScreenshot('dev-info-footer.png');
  });
});
