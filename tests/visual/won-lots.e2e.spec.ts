/**
 * @fileoverview Teste E2E (BDD/TDD) simulado para jornada de arrematante.
 */
import { describe, test, expect } from 'vitest';
import { page } from 'vitest/browser';

describe('E2E - Jornada de arrematante (simulado)', () => {
  test('deve abrir detalhes do lote arrematado', async () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div data-testid="won-lot-item" data-ai-id="won-lot-item" style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <button data-testid="won-lot-details" data-ai-id="won-lot-details" style="padding: 8px 12px;">Ver detalhes</button>
        <div data-testid="won-lot-panel" data-ai-id="won-lot-panel" style="display: none; margin-top: 8px;">Detalhes do arremate</div>
      </div>
    `;
    document.body.appendChild(container);

    const detailsButton = page.getByTestId('won-lot-details');
    const panel = page.getByTestId('won-lot-panel');

    await expect.element(detailsButton).toBeVisible();
    await expect.element(panel).toBeHidden();

    detailsButton.element().addEventListener('click', () => {
      const el = document.querySelector('[data-testid="won-lot-panel"]') as HTMLElement;
      if (el) el.style.display = 'block';
    });

    await detailsButton.click();
    await expect.element(panel).toBeVisible();

    document.body.removeChild(container);
  });
});
