/**
 * @fileoverview Regressao visual do rodape Dev Info do dashboard.
 * BDD: Validar apresentacao consistente do bloco Dev Info.
 * TDD: Capturar screenshot do rodape padrao.
 */
import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import DevInfoIndicator from '../../src/components/layout/dev-info-indicator';

describe('Dev Info Footer - Visual', () => {
  beforeEach(async () => {
    await page.viewport(1280, 720);
  });

  it('mantem o rodape Dev Info consistente', async () => {
    await render(
      <div className="p-6 bg-background" data-ai-id="dev-info-visual-wrapper">
        <DevInfoIndicator />
      </div>
    );

    const footer = page.getByTestId('dev-info-indicator');
    await expect.element(footer).toBeVisible();
    await expect(footer).toMatchScreenshot('dev-info-footer.png');
  });
});
