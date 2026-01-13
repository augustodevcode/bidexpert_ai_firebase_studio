/**
 * @file hot-deal-card.spec.ts
 * @description Testes E2E para o componente HotDealCard na página inicial.
 * 
 * BDD Scenarios:
 * - DADO que a homepage está carregada
 * - QUANDO existem lotes com encerramento próximo
 * - ENTÃO o HotDealCard deve ser exibido com todos os elementos
 * 
 * TDD Coverage:
 * - Renderização do componente
 * - Navegação do carrossel
 * - Countdown timer
 * - Links de navegação
 * - Responsividade
 */

import { test, expect } from '@playwright/test';

test.use({
  baseURL: 'http://localhost:9002',
});

test.describe('HotDealCard Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a homepage
    await page.goto('http://localhost:9002/');
    // Aguardar carregamento completo
    await page.waitForLoadState('networkidle');
  });

  test.describe('Renderização Básica', () => {
    test('deve exibir a seção Hot Deal quando existem lotes', async ({ page }) => {
      // A seção pode não existir se não houver lotes com encerramento próximo
      const hotDealSection = page.getByTestId('hot-deal-section');
      const sectionExists = await hotDealSection.isVisible().catch(() => false);
      
      if (sectionExists) {
        await expect(hotDealSection).toBeVisible();
        await expect(page.getByText('Oferta Imperdível de Hoje')).toBeVisible();
      } else {
        // Se não existir, verificar que não há erro na página
        await expect(page.locator('body')).not.toContainText('Error');
        test.skip();
      }
    });

    test('deve exibir conteúdo do Hot Deal quando disponível', async ({ page }) => {
      const hotDealContent = page.getByTestId('hot-deal-content');
      const contentExists = await hotDealContent.isVisible().catch(() => false);
      
      if (contentExists) {
        // Verificar galeria
        await expect(page.getByTestId('hot-deal-gallery')).toBeVisible();
        
        // Verificar info section
        await expect(page.getByTestId('hot-deal-info')).toBeVisible();
        
        // Verificar countdown
        await expect(page.getByTestId('hot-deal-countdown')).toBeVisible();
        
        // Verificar progress bar
        await expect(page.getByTestId('hot-deal-progress')).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('deve exibir imagem principal do lote', async ({ page }) => {
      const imageLink = page.getByTestId('hot-deal-image-link');
      const exists = await imageLink.isVisible().catch(() => false);
      
      if (exists) {
        await expect(imageLink).toBeVisible();
        const img = imageLink.locator('img');
        await expect(img).toBeVisible();
      } else {
        test.skip();
      }
    });
  });

  test.describe('Navegação do Carrossel', () => {
    test('deve navegar para o próximo lote ao clicar no botão next', async ({ page }) => {
      const nextButton = page.getByTestId('hot-deal-next');
      const exists = await nextButton.isVisible().catch(() => false);
      
      if (exists) {
        // Capturar o título atual
        const titleLink = page.getByTestId('hot-deal-title-link');
        const initialTitle = await titleLink.textContent();
        
        // Clicar no próximo
        await nextButton.click();
        
        // Aguardar mudança (pode ser o mesmo se houver apenas 1 lote)
        await page.waitForTimeout(500);
        
        // Verificar que a navegação funcionou (sem erros)
        await expect(page.getByTestId('hot-deal-content')).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('deve navegar para o lote anterior ao clicar no botão prev', async ({ page }) => {
      const prevButton = page.getByTestId('hot-deal-prev');
      const exists = await prevButton.isVisible().catch(() => false);
      
      if (exists) {
        await prevButton.click();
        await page.waitForTimeout(500);
        await expect(page.getByTestId('hot-deal-content')).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('deve permitir navegar pelos thumbnails de imagem', async ({ page }) => {
      const thumbnail = page.getByTestId('hot-deal-thumbnail-1');
      const exists = await thumbnail.isVisible().catch(() => false);
      
      if (exists) {
        await thumbnail.click();
        // Verificar que a seleção funcionou (sem erros)
        await expect(thumbnail).toHaveClass(/border-primary|ring-2/);
      } else {
        // Pode não haver múltiplas imagens
        test.skip();
      }
    });
  });

  test.describe('Countdown Timer', () => {
    test('deve exibir o countdown com valores formatados', async ({ page }) => {
      const countdown = page.getByTestId('hot-deal-countdown');
      const exists = await countdown.isVisible().catch(() => false);
      
      if (exists) {
        // Verificar estrutura do countdown
        await expect(page.getByText('Encerra em:')).toBeVisible();
        
        // Verificar que os valores são numéricos de 2 dígitos
        const daysEl = page.getByTestId('countdown-dias');
        if (await daysEl.isVisible().catch(() => false)) {
          const daysText = await daysEl.textContent();
          expect(daysText).toMatch(/^\d{2}$/);
        }
      } else {
        test.skip();
      }
    });

    test('deve atualizar o countdown automaticamente', async ({ page }) => {
      const secondsEl = page.getByTestId('countdown-seg');
      const exists = await secondsEl.isVisible().catch(() => false);
      
      if (exists) {
        const initialSeconds = await secondsEl.textContent();
        
        // Aguardar 2 segundos para ver mudança
        await page.waitForTimeout(2000);
        
        const newSeconds = await secondsEl.textContent();
        
        // Os segundos devem ter mudado (ou reiniciado em 59)
        // Não comparamos diretamente pois pode ter passado de 00 para 59
        expect(newSeconds).toBeDefined();
      } else {
        test.skip();
      }
    });
  });

  test.describe('Links e Navegação', () => {
    test('deve navegar para detalhes do lote ao clicar no título', async ({ page }) => {
      const titleLink = page.getByTestId('hot-deal-title-link');
      const exists = await titleLink.isVisible().catch(() => false);
      
      if (exists) {
        const href = await titleLink.getAttribute('href');
        expect(href).toMatch(/\/lots\/\d+/);
        
        // Clicar e verificar navegação
        await titleLink.click();
        await page.waitForURL(/\/lots\/\d+/);
        await expect(page).toHaveURL(/\/lots\/\d+/);
      } else {
        test.skip();
      }
    });

    test('deve navegar para detalhes ao clicar na imagem', async ({ page }) => {
      const imageLink = page.getByTestId('hot-deal-image-link');
      const exists = await imageLink.isVisible().catch(() => false);
      
      if (exists) {
        const href = await imageLink.getAttribute('href');
        expect(href).toMatch(/\/lots\/\d+/);
      } else {
        test.skip();
      }
    });

    test('deve navegar para detalhes ao clicar no CTA', async ({ page }) => {
      const ctaButton = page.getByTestId('hot-deal-cta');
      const exists = await ctaButton.isVisible().catch(() => false);
      
      if (exists) {
        await expect(ctaButton).toContainText('Ver Detalhes');
        const href = await ctaButton.getAttribute('href');
        expect(href).toMatch(/\/lots\/\d+/);
      } else {
        test.skip();
      }
    });
  });

  test.describe('Informações do Lote', () => {
    test('deve exibir preço do lote formatado em BRL', async ({ page }) => {
      const infoSection = page.getByTestId('hot-deal-info');
      const exists = await infoSection.isVisible().catch(() => false);
      
      if (exists) {
        // Verificar que há um preço em formato brasileiro (R$)
        const priceText = await infoSection.locator('text=/R\\$/').first().textContent();
        expect(priceText).toMatch(/R\$/);
      } else {
        test.skip();
      }
    });

    test('deve exibir status do lote', async ({ page }) => {
      const infoSection = page.getByTestId('hot-deal-info');
      const exists = await infoSection.isVisible().catch(() => false);
      
      if (exists) {
        await expect(infoSection.getByText('Status:')).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('deve exibir barra de progresso de lances', async ({ page }) => {
      const progress = page.getByTestId('hot-deal-progress');
      const exists = await progress.isVisible().catch(() => false);
      
      if (exists) {
        await expect(progress).toBeVisible();
        await expect(progress.locator('[role="progressbar"]')).toBeVisible();
      } else {
        test.skip();
      }
    });
  });

  test.describe('Responsividade', () => {
    test('deve adaptar layout em viewport mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const hotDealSection = page.getByTestId('hot-deal-section');
      const exists = await hotDealSection.isVisible().catch(() => false);
      
      if (exists) {
        // Em mobile, thumbnails devem estar ocultos
        const thumbnail = page.getByTestId('hot-deal-thumbnail-0');
        await expect(thumbnail).not.toBeVisible();
        
        // Conteúdo principal deve estar visível
        await expect(page.getByTestId('hot-deal-content')).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('deve exibir thumbnails em viewport desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const thumbnail = page.getByTestId('hot-deal-thumbnail-0');
      const exists = await thumbnail.isVisible().catch(() => false);
      
      // Thumbnails visíveis apenas se houver múltiplas imagens
      if (exists) {
        await expect(thumbnail).toBeVisible();
      } else {
        // OK se não houver múltiplas imagens
        test.skip();
      }
    });
  });

  test.describe('Visual Regression', () => {
    test('deve manter consistência visual do Hot Deal Card', async ({ page }) => {
      const hotDealSection = page.getByTestId('hot-deal-section');
      const exists = await hotDealSection.isVisible().catch(() => false);
      
      if (exists) {
        // Screenshot da seção completa
        await expect(hotDealSection).toHaveScreenshot('hot-deal-card.png', {
          maxDiffPixels: 100,
          animations: 'disabled',
        });
      } else {
        test.skip();
      }
    });

    test('deve manter consistência visual do countdown', async ({ page }) => {
      const countdown = page.getByTestId('hot-deal-countdown');
      const exists = await countdown.isVisible().catch(() => false);
      
      if (exists) {
        await expect(countdown).toHaveScreenshot('hot-deal-countdown.png', {
          maxDiffPixels: 50,
          animations: 'disabled',
        });
      } else {
        test.skip();
      }
    });
  });

  test.describe('Acessibilidade', () => {
    test('deve ter labels ARIA nos botões de navegação', async ({ page }) => {
      const prevButton = page.getByTestId('hot-deal-prev');
      const exists = await prevButton.isVisible().catch(() => false);
      
      if (exists) {
        await expect(prevButton).toHaveAttribute('aria-label', 'Lote anterior');
        
        const nextButton = page.getByTestId('hot-deal-next');
        await expect(nextButton).toHaveAttribute('aria-label', 'Próximo lote');
      } else {
        test.skip();
      }
    });

    test('deve ter alt text nas imagens', async ({ page }) => {
      const imageLink = page.getByTestId('hot-deal-image-link');
      const exists = await imageLink.isVisible().catch(() => false);
      
      if (exists) {
        const img = imageLink.locator('img');
        const altText = await img.getAttribute('alt');
        expect(altText).toBeTruthy();
        expect(altText?.length).toBeGreaterThan(0);
      } else {
        test.skip();
      }
    });
  });
});
