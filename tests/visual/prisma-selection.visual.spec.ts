/**
 * @fileoverview Teste visual básico para validar fluxo de navegação e screenshot.
 *
 * BDD: Garantir que o ambiente de teste visual suporta interação e captura.
 * TDD: Criar componente visual simples com clique e screenshot.
 */

import { describe, expect, test } from 'vitest';
import { page } from 'vitest/browser';

describe('Visual Regression - Prisma Selection', () => {
  test('interação básica e screenshot', async () => {
    const container = document.createElement('div');
    container.setAttribute('data-testid', 'prisma-demo-card');
    container.setAttribute('data-ai-id', 'prisma-demo-card');
    container.innerHTML = `
      <div data-ai-id="prisma-demo-card-inner" style="padding: 16px; border: 1px solid #ccc; border-radius: 8px;">
        <h2 data-ai-id="prisma-demo-card-title" style="margin: 0 0 8px;">Demo DB Selection</h2>
        <button data-testid="prisma-demo-button" data-ai-id="prisma-demo-button" style="padding: 8px 12px;">Test</button>
      </div>
    `;
    document.body.appendChild(container);

    const card = page.getByTestId('prisma-demo-card');
    await expect.element(card).toBeVisible();

    const button = page.getByTestId('prisma-demo-button');
    await button.click();

    await page.screenshot({
      path: 'tests/visual/__screenshots__/prisma-selection-demo-card.png',
    });

    document.body.removeChild(container);
  });
});
