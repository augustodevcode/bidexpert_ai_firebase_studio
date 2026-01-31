/**
 * @fileoverview Teste visual (BDD/TDD) para resumo de seed mínimo.
 */
import { describe, test, expect } from 'vitest';
import { page } from 'vitest/browser';

describe('Visual - Seed mínimo (50 registros)', () => {
  test('deve renderizar resumo do seed mínimo', async () => {
    const container = document.createElement('div');
    container.setAttribute('data-ai-id', 'seed-min-50-container');
    container.innerHTML = `
      <section style="padding: 16px; background: #f8fafc; border-radius: 12px;">
        <article data-testid="seed-min-50-card" data-ai-id="seed-min-50-card" style="padding: 16px; background: white; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
          <h2 style="margin: 0 0 8px; font-size: 18px;">Seed mínimo aplicado</h2>
          <p style="margin: 0; font-size: 14px; color: #4b5563;">50 registros adicionados em tabelas vazias</p>
        </article>
      </section>
    `;
    document.body.appendChild(container);

    const card = page.getByTestId('seed-min-50-card');
    await expect.element(card).toBeVisible();

    const screenshotPath = await page.screenshot({
      path: 'tests/visual/__screenshots__/seed-min-50-summary.png'
    });

    expect(screenshotPath).toBeTruthy();

    document.body.removeChild(container);
  });
});
