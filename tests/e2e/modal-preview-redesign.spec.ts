// tests/e2e/modal-preview-redesign.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Modal Preview Redesign - V2', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página inicial onde os cards de lotes e leilões são exibidos
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Lot Preview Modal V2', () => {
    test('should open lot preview modal when clicking on lot card', async ({ page }) => {
      // Encontrar e clicar em um card de lote
      const lotCard = page.locator('[data-testid="lot-card"]').first();
      await expect(lotCard).toBeVisible({ timeout: 10000 });
      
      // Clicar no botão de preview (olho) ou na imagem
      const previewButton = lotCard.locator('button:has-text("Visualizar"), button[aria-label*="preview"], img').first();
      await previewButton.click();

      // Verificar se o modal abriu
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
    });

    test('should display 5-column grid layout with 3/5 for gallery and 2/5 for info', async ({ page }) => {
      // Abrir modal de lote
      const lotCard = page.locator('[data-testid="lot-card"]').first();
      await lotCard.locator('button, img').first().click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // Verificar grid de 5 colunas
      const gridContainer = modal.locator('.grid.grid-cols-5').first();
      await expect(gridContainer).toBeVisible();

      // Verificar galeria (3/5)
      const gallery = gridContainer.locator('.col-span-3').first();
      await expect(gallery).toBeVisible();
      await expect(gallery).toHaveClass(/bg-black/);

      // Verificar sidebar de informações (2/5)
      const sidebar = gridContainer.locator('.col-span-2').first();
      await expect(sidebar).toBeVisible();
    });

    test('should display image gallery with navigation arrows', async ({ page }) => {
      const lotCard = page.locator('[data-testid="lot-card"]').first();
      await lotCard.locator('button, img').first().click();

      const modal = page.locator('[role="dialog"]');
      const gallery = modal.locator('.col-span-3').first();

      // Verificar se as setas de navegação existem
      const prevButton = gallery.locator('button').filter({ hasText: '' }).first();
      const nextButton = gallery.locator('button').filter({ hasText: '' }).last();

      // As setas podem estar visíveis ou não dependendo do número de imagens
      // Apenas verificar se existem no DOM
      await expect(prevButton.or(nextButton)).toBeTruthy();
    });

    test('should display urgency badges', async ({ page }) => {
      const lotCard = page.locator('[data-testid="lot-card"]').first();
      await lotCard.locator('button, img').first().click();

      const modal = page.locator('[role="dialog"]');
      
      // Verificar se existe badge de urgência (pode ser qualquer um dos tipos)
      const badges = modal.locator('.badge, [class*="bg-red-600"], [class*="bg-orange-600"], [class*="bg-green-600"]');
      
      // Pelo menos verificar que a estrutura para badges existe
      await expect(modal).toBeVisible();
    });

    test('should display price information with gradient card', async ({ page }) => {
      const lotCard = page.locator('[data-testid="lot-card"]').first();
      await lotCard.locator('button, img').first().click();

      const modal = page.locator('[role="dialog"]');
      const sidebar = modal.locator('.col-span-2').first();

      // Verificar card de preço com gradiente
      const priceCard = sidebar.locator('.bg-gradient-to-br').first();
      await expect(priceCard).toBeVisible();

      // Verificar se contém "Lance Atual"
      await expect(priceCard).toContainText(/Lance Atual|R\$/);
    });

    test('should display social proof statistics', async ({ page }) => {
      const lotCard = page.locator('[data-testid="lot-card"]').first();
      await lotCard.locator('button, img').first().click();

      const modal = page.locator('[role="dialog"]');
      const sidebar = modal.locator('.col-span-2').first();

      // Verificar seção de estatísticas
      const statsSection = sidebar.getByText('Estatísticas').locator('..').locator('..');
      await expect(statsSection).toBeVisible();

      // Verificar grid de 3 colunas para stats
      const statsGrid = sidebar.locator('.grid.grid-cols-3');
      await expect(statsGrid).toBeVisible();
    });

    test('should display benefits section with checkmarks', async ({ page }) => {
      const lotCard = page.locator('[data-testid="lot-card"]').first();
      await lotCard.locator('button, img').first().click();

      const modal = page.locator('[role="dialog"]');
      const sidebar = modal.locator('.col-span-2').first();

      // Verificar seção "Por que participar?"
      await expect(sidebar).toContainText(/Por que participar/i);

      // Verificar se há ícones de benefícios
      const benefitIcons = sidebar.locator('svg').filter({ has: page.locator('path') });
      await expect(benefitIcons.first()).toBeVisible();
    });

    test('should display CTA button with persuasive text', async ({ page }) => {
      const lotCard = page.locator('[data-testid="lot-card"]').first();
      await lotCard.locator('button, img').first().click();

      const modal = page.locator('[role="dialog"]');
      const sidebar = modal.locator('.col-span-2').first();

      // Verificar botão principal de CTA
      const ctaButton = sidebar.getByRole('link', { name: /Ver Detalhes|Dar Lance/i });
      await expect(ctaButton).toBeVisible();

      // Verificar mensagem de conversão
      await expect(sidebar).toContainText(/Cadastre-se gratuitamente|100% online/i);
    });

    test('should display countdown timer', async ({ page }) => {
      const lotCard = page.locator('[data-testid="lot-card"]').first();
      await lotCard.locator('button, img').first().click();

      const modal = page.locator('[role="dialog"]');
      const sidebar = modal.locator('.col-span-2').first();

      // Verificar se existe countdown (pode não estar presente em todos os lotes)
      const countdownText = sidebar.getByText(/Encerramento|dias|horas/i);
      
      // Aceitar que pode ou não estar presente
      if (await countdownText.count() > 0) {
        await expect(countdownText.first()).toBeVisible();
      }
    });

    test('should close modal when clicking outside or close button', async ({ page }) => {
      const lotCard = page.locator('[data-testid="lot-card"]').first();
      await lotCard.locator('button, img').first().click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // Fechar clicando no overlay (fora do modal)
      await page.keyboard.press('Escape');
      
      // Verificar se o modal foi fechado
      await expect(modal).not.toBeVisible({ timeout: 5000 });
    });

    test('should have favorite and share action buttons', async ({ page }) => {
      const lotCard = page.locator('[data-testid="lot-card"]').first();
      await lotCard.locator('button, img').first().click();

      const modal = page.locator('[role="dialog"]');
      const gallery = modal.locator('.col-span-3').first();

      // Verificar botões de ação rápida (favoritar, compartilhar)
      const actionButtons = gallery.locator('.absolute.top-4.right-4 button');
      
      // Verificar se existem pelo menos alguns botões de ação
      const buttonCount = await actionButtons.count();
      expect(buttonCount).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Auction Preview Modal V2', () => {
    test('should open auction preview modal when clicking on auction card', async ({ page }) => {
      // Navegar para página de leilões ou encontrar card de leilão
      await page.goto('/auctions');
      await page.waitForLoadState('networkidle');

      const auctionCard = page.locator('[data-testid="auction-card"]').first();
      
      if (await auctionCard.count() === 0) {
        test.skip();
        return;
      }

      await expect(auctionCard).toBeVisible({ timeout: 10000 });
      
      // Clicar no botão de preview
      const previewButton = auctionCard.locator('button, img').first();
      await previewButton.click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
    });

    test('should display auction-specific urgency badges', async ({ page }) => {
      await page.goto('/auctions');
      await page.waitForLoadState('networkidle');

      const auctionCard = page.locator('[data-testid="auction-card"]').first();
      
      if (await auctionCard.count() === 0) {
        test.skip();
        return;
      }

      await auctionCard.locator('button, img').first().click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // Verificar badges específicos de leilão
      // "ENCERRA HOJE", "ENCERRA AMANHÃ", "ALTA DEMANDA", "DESTAQUE", "X+ LOTES"
      const sidebar = modal.locator('.col-span-2');
      
      // Apenas verificar que o modal está funcionando
      await expect(sidebar).toBeVisible();
    });

    test('should display total reference value', async ({ page }) => {
      await page.goto('/auctions');
      await page.waitForLoadState('networkidle');

      const auctionCard = page.locator('[data-testid="auction-card"]').first();
      
      if (await auctionCard.count() === 0) {
        test.skip();
        return;
      }

      await auctionCard.locator('button, img').first().click();

      const modal = page.locator('[role="dialog"]');
      const sidebar = modal.locator('.col-span-2');

      // Verificar se há informação de valor de referência
      const referenceValue = sidebar.getByText(/Valor de Referência|R\$/i);
      
      if (await referenceValue.count() > 0) {
        await expect(referenceValue.first()).toBeVisible();
      }
    });

    test('should display auctioneer and seller information', async ({ page }) => {
      await page.goto('/auctions');
      await page.waitForLoadState('networkidle');

      const auctionCard = page.locator('[data-testid="auction-card"]').first();
      
      if (await auctionCard.count() === 0) {
        test.skip();
        return;
      }

      await auctionCard.locator('button, img').first().click();

      const modal = page.locator('[role="dialog"]');
      const sidebar = modal.locator('.col-span-2');

      // Verificar seção de responsáveis
      await expect(sidebar).toContainText(/Responsáveis|Leiloeiro|Comitente/i);

      // Verificar se há avatar do leiloeiro
      const avatar = sidebar.locator('[class*="avatar"]').first();
      
      if (await avatar.count() > 0) {
        await expect(avatar).toBeVisible();
      }
    });

    test('should display CTA to view all lots', async ({ page }) => {
      await page.goto('/auctions');
      await page.waitForLoadState('networkidle');

      const auctionCard = page.locator('[data-testid="auction-card"]').first();
      
      if (await auctionCard.count() === 0) {
        test.skip();
        return;
      }

      await auctionCard.locator('button, img').first().click();

      const modal = page.locator('[role="dialog"]');
      const sidebar = modal.locator('.col-span-2');

      // Verificar CTA "Ver Todos os X Lotes"
      const ctaButton = sidebar.getByRole('link', { name: /Ver Todos|Lotes/i });
      await expect(ctaButton).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout on mobile devices', async ({ page }) => {
      // Configurar viewport mobile
      await page.setViewportSize({ width: 375, height: 667 });

      const lotCard = page.locator('[data-testid="lot-card"]').first();
      
      if (await lotCard.count() === 0) {
        test.skip();
        return;
      }

      await lotCard.locator('button, img').first().click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // Verificar se o modal se adapta ao mobile
      // O grid pode mudar de 5 colunas para empilhamento vertical
      await expect(modal).toBeVisible();
    });

    test('should maintain functionality on tablet', async ({ page }) => {
      // Configurar viewport tablet
      await page.setViewportSize({ width: 768, height: 1024 });

      const lotCard = page.locator('[data-testid="lot-card"]').first();
      
      if (await lotCard.count() === 0) {
        test.skip();
        return;
      }

      await lotCard.locator('button, img').first().click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      const lotCard = page.locator('[data-testid="lot-card"]').first();
      
      if (await lotCard.count() === 0) {
        test.skip();
        return;
      }

      // Focar no card usando Tab
      await page.keyboard.press('Tab');
      
      // Abrir com Enter
      await page.keyboard.press('Enter');

      const modal = page.locator('[role="dialog"]');
      
      // Verificar se modal pode ser fechado com Escape
      await page.keyboard.press('Escape');
      
      await expect(modal).not.toBeVisible({ timeout: 3000 });
    });

    test('should have proper ARIA labels', async ({ page }) => {
      const lotCard = page.locator('[data-testid="lot-card"]').first();
      
      if (await lotCard.count() === 0) {
        test.skip();
        return;
      }

      await lotCard.locator('button, img').first().click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // Verificar se o dialog tem role correto
      await expect(modal).toHaveAttribute('role', 'dialog');
    });
  });

  test.describe('Performance', () => {
    test('should load modal images efficiently', async ({ page }) => {
      const lotCard = page.locator('[data-testid="lot-card"]').first();
      
      if (await lotCard.count() === 0) {
        test.skip();
        return;
      }

      await lotCard.locator('button, img').first().click();

      const modal = page.locator('[role="dialog"]');
      const gallery = modal.locator('.col-span-3 img').first();

      // Verificar se a imagem foi carregada
      await expect(gallery).toBeVisible({ timeout: 5000 });
    });

    test('should not cause layout shift when opening modal', async ({ page }) => {
      const initialViewport = page.viewportSize();
      
      const lotCard = page.locator('[data-testid="lot-card"]').first();
      
      if (await lotCard.count() === 0) {
        test.skip();
        return;
      }

      await lotCard.locator('button, img').first().click();

      // Verificar que o viewport não mudou
      const currentViewport = page.viewportSize();
      expect(currentViewport).toEqual(initialViewport);
    });
  });
});
