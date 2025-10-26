// tests/ui/bidder-dashboard.spec.ts
/**
 * @fileoverview Testes E2E do painel do arrematante (bidder dashboard)
 * Testa todas as funcionalidades do bidder dashboard usando Playwright
 */

import { test, expect } from '@playwright/test';

test.describe('Bidder Dashboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup básico para todos os testes
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
      window.localStorage.removeItem('bidexpert-subscription-popup-seen');
    });

    // Login como bidder
    await page.goto('/auth/login', { timeout: 300000 });

    // Handle subscription modal if appears
    const subscriptionModal = page.locator('[data-ai-id="subscription-modal"]');
    if (await subscriptionModal.isVisible({ timeout: 10000 })) {
      await page.click('[data-ai-id="subscription-close-button"]');
    }

    // Login como bidder
    await page.fill('input[type="email"], [data-ai-id="auth-login-email-input"]', 'bidder@test.com');
    await page.fill('input[type="password"], [data-ai-id="auth-login-password-input"]', 'Bidder@123');
    await page.click('button[type="submit"], [data-ai-id="auth-login-submit-button"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 300000 });
  });

  test('should display bidder dashboard overview', async ({ page }) => {
    // Should show dashboard header
    await expect(page.locator('[data-ai-id="bidder-dashboard"]')).toBeVisible({ timeout: 60000 });
    await expect(page.locator('h1')).toContainText(/Meu Dashboard|Dashboard do Arrematante/);

    // Should show overview cards
    await expect(page.locator('[data-ai-id="won-lots-count"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="total-spent"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="pending-payments"]')).toBeVisible();

    // Should show navigation tabs
    await expect(page.locator('[data-ai-id="dashboard-nav"], [data-ai-id="dashboard-tabs"]')).toBeVisible();
    await expect(page.locator('text=Meus Arremates')).toBeVisible();
    await expect(page.locator('text=Pagamentos')).toBeVisible();
    await expect(page.locator('text=Documentos')).toBeVisible();
    await expect(page.locator('text=Notificações')).toBeVisible();
    await expect(page.locator('text=Histórico')).toBeVisible();
  });

  test('should navigate between dashboard sections', async ({ page }) => {
    // Test navigation to won lots
    await page.click('text=Meus Arremates');
    await expect(page.locator('[data-ai-id="won-lots-section"]')).toBeVisible({ timeout: 30000 });

    // Test navigation to payments
    await page.click('text=Pagamentos');
    await expect(page.locator('[data-ai-id="payments-section"]')).toBeVisible({ timeout: 30000 });

    // Test navigation to documents
    await page.click('text=Documentos');
    await expect(page.locator('[data-ai-id="documents-section"]')).toBeVisible({ timeout: 30000 });

    // Test navigation to notifications
    await page.click('text=Notificações');
    await expect(page.locator('[data-ai-id="notifications-section"]')).toBeVisible({ timeout: 30000 });

    // Test navigation to history
    await page.click('text=Histórico');
    await expect(page.locator('[data-ai-id="history-section"]')).toBeVisible({ timeout: 30000 });

    // Test navigation back to overview
    await page.click('text=Visão Geral');
    await expect(page.locator('[data-ai-id="dashboard-overview"]')).toBeVisible({ timeout: 30000 });
  });

  test('should display won lots section', async ({ page }) => {
    await page.click('text=Meus Arremates');

    // Should show won lots table or cards
    await expect(page.locator('[data-ai-id="won-lots-grid"], [data-ai-id="won-lots-table"]')).toBeVisible({ timeout: 60000 });

    // Should show search and filters
    await expect(page.locator('[data-ai-id="won-lots-search"], input[placeholder*="Buscar"]')).toBeVisible();

    // Should show filter options
    await expect(page.locator('[data-ai-id="won-lots-filters"], select')).toBeVisible();

    // If there are won lots, should show lot cards
    const wonLotCards = page.locator('[data-ai-id="won-lot-card"]');
    if (await wonLotCards.count() > 0) {
      // Check first won lot card
      const firstCard = wonLotCards.first();
      await expect(firstCard.locator('[data-ai-id="lot-title"]')).toBeVisible();
      await expect(firstCard.locator('[data-ai-id="lot-final-bid"]')).toBeVisible();
      await expect(firstCard.locator('[data-ai-id="lot-status"]')).toBeVisible();
      await expect(firstCard.locator('[data-ai-id="lot-actions"]')).toBeVisible();
    }
  });

  test('should display payment methods section', async ({ page }) => {
    await page.click('text=Pagamentos');

    // Should show payment methods section
    await expect(page.locator('[data-ai-id="payment-methods-section"]')).toBeVisible({ timeout: 60000 });

    // Should show add payment method button
    await expect(page.locator('[data-ai-id="add-payment-method"], button:contains("Adicionar")')).toBeVisible();

    // Should show payment methods list or empty state
    const paymentMethods = page.locator('[data-ai-id="payment-method-card"]');
    const emptyState = page.locator('text=Nenhum método de pagamento|Adicione seu primeiro método');

    await expect(paymentMethods.or(emptyState)).toBeVisible({ timeout: 30000 });

    // If payment methods exist, should show method cards
    if (await paymentMethods.count() > 0) {
      const firstMethod = paymentMethods.first();
      await expect(firstMethod.locator('[data-ai-id="payment-method-type"]')).toBeVisible();
      await expect(firstMethod.locator('[data-ai-id="payment-method-actions"]')).toBeVisible();
    }
  });

  test('should display documents section', async ({ page }) => {
    await page.click('text=Documentos');

    // Should show documents section
    await expect(page.locator('[data-ai-id="documents-section"]')).toBeVisible({ timeout: 60000 });

    // Should show document status
    await expect(page.locator('[data-ai-id="document-status"], [data-ai-id="document-progress"]')).toBeVisible();

    // Should show required documents list
    await expect(page.locator('[data-ai-id="required-documents"]')).toBeVisible();

    // Should show upload options for each document type
    const documentItems = page.locator('[data-ai-id="document-item"], [data-ai-id="document-card"]');
    if (await documentItems.count() > 0) {
      const firstDocument = documentItems.first();
      await expect(firstDocument.locator('[data-ai-id="document-status-badge"]')).toBeVisible();
      await expect(firstDocument.locator('button:contains("Enviar"), button:contains("Upload")')).toBeVisible();
    }
  });

  test('should display notifications section', async ({ page }) => {
    await page.click('text=Notificações');

    // Should show notifications section
    await expect(page.locator('[data-ai-id="notifications-section"]')).toBeVisible({ timeout: 60000 });

    // Should show notification filters
    await expect(page.locator('[data-ai-id="notification-filters"], [data-ai-id="notification-tabs"]')).toBeVisible();

    // Should show notifications list or empty state
    const notificationsList = page.locator('[data-ai-id="notifications-list"]');
    const emptyState = page.locator('text=Nenhuma notificação|Nenhuma notificação encontrada');

    await expect(notificationsList.or(emptyState)).toBeVisible({ timeout: 30000 });

    // If notifications exist, should show notification items
    if (await notificationsList.isVisible()) {
      const firstNotification = page.locator('[data-ai-id="notification-item"]').first();
      await expect(firstNotification.locator('[data-ai-id="notification-title"]')).toBeVisible();
      await expect(firstNotification.locator('[data-ai-id="notification-message"]')).toBeVisible();
      await expect(firstNotification.locator('[data-ai-id="notification-date"]')).toBeVisible();
    }
  });

  test('should display participation history section', async ({ page }) => {
    await page.click('text=Histórico');

    // Should show history section
    await expect(page.locator('[data-ai-id="history-section"]')).toBeVisible({ timeout: 60000 });

    // Should show search and filters
    await expect(page.locator('[data-ai-id="history-search"], input[placeholder*="Buscar"]')).toBeVisible();

    // Should show filter options
    await expect(page.locator('[data-ai-id="history-filters"], select')).toBeVisible();

    // Should show history list or empty state
    const historyList = page.locator('[data-ai-id="history-list"]');
    const emptyState = page.locator('text=Nenhuma participação|Nenhum histórico encontrado');

    await expect(historyList.or(emptyState)).toBeVisible({ timeout: 30000 });

    // If history exists, should show history items
    if (await historyList.isVisible()) {
      const firstHistory = page.locator('[data-ai-id="history-item"]').first();
      await expect(firstHistory.locator('[data-ai-id="history-title"]')).toBeVisible();
      await expect(firstHistory.locator('[data-ai-id="history-result"]')).toBeVisible();
      await expect(firstHistory.locator('[data-ai-id="history-date"]')).toBeVisible();
    }
  });

  test('should handle won lots actions', async ({ page }) => {
    await page.click('text=Meus Arremates');

    const wonLotCards = page.locator('[data-ai-id="won-lot-card"]');
    if (await wonLotCards.count() > 0) {
      const firstCard = wonLotCards.first();

      // Test view details action
      await firstCard.click('[data-ai-id="view-details"], button:contains("Ver Detalhes")');
      await expect(page.locator('[data-ai-id="lot-details-modal"]')).toBeVisible({ timeout: 30000 });

      // Close modal
      await page.click('[data-ai-id="close-modal"], button:contains("Fechar")');
      await expect(page.locator('[data-ai-id="lot-details-modal"]')).not.toBeVisible({ timeout: 5000 });

      // Test payment action if available
      const payButton = firstCard.locator('[data-ai-id="pay-button"], button:contains("Pagar")');
      if (await payButton.isVisible()) {
        await payButton.click();
        await expect(page.locator('[data-ai-id="payment-modal"]')).toBeVisible({ timeout: 30000 });
        await page.click('[data-ai-id="cancel-payment"], button:contains("Cancelar")');
      }

      // Test boleto generation if available
      const boletoButton = firstCard.locator('[data-ai-id="boleto-button"], button:contains("Boleto")');
      if (await boletoButton.isVisible()) {
        await boletoButton.click();
        await expect(page.locator('[data-ai-id="boleto-modal"]')).toBeVisible({ timeout: 30000 });
        await page.click('[data-ai-id="close-boleto"], button:contains("Fechar")');
      }
    }
  });

  test('should handle payment methods management', async ({ page }) => {
    await page.click('text=Pagamentos');
    await page.click('[data-ai-id="add-payment-method"], button:contains("Adicionar")');

    // Should show payment method modal or page
    await expect(page.locator('[data-ai-id="payment-method-modal"], [data-ai-id="payment-method-form"]')).toBeVisible({ timeout: 30000 });

    // Test adding credit card (if form is available)
    const creditCardOption = page.locator('button:contains("Cartão"), [data-ai-id="credit-card-option"]');
    if (await creditCardOption.isVisible()) {
      await creditCardOption.click();

      // Fill credit card form
      await page.fill('[data-ai-id="card-number"], input[placeholder*="número"]', '4111111111111111');
      await page.fill('[data-ai-id="card-holder"], input[placeholder*="nome"]', 'João Silva');
      await page.fill('[data-ai-id="card-expiry"], input[placeholder*="validade"]', '12/25');
      await page.fill('[data-ai-id="card-cvv"], input[placeholder*="cvv"]', '123');

      // Submit form
      await page.click('[data-ai-id="save-card"], button:contains("Salvar")');

      // Should show success message or return to list
      await expect(page.locator('[data-ai-id="success-message"], [data-ai-id="payment-methods-section"]')).toBeVisible({ timeout: 30000 });
    }
  });

  test('should handle document upload', async ({ page }) => {
    await page.click('text=Documentos');

    const uploadButtons = page.locator('button:contains("Enviar"), button:contains("Upload")');
    if (await uploadButtons.count() > 0) {
      await uploadButtons.first().click();

      // Should show upload modal or form
      await expect(page.locator('[data-ai-id="document-upload-modal"], [data-ai-id="file-input"]')).toBeVisible({ timeout: 30000 });

      // Test file upload (if input is available)
      const fileInput = page.locator('[data-ai-id="file-input"], input[type="file"]');
      if (await fileInput.isVisible()) {
        // Create a test file
        const testFile = await page.evaluate(() => {
          const blob = new Blob(['test content'], { type: 'application/pdf' });
          const file = new File([blob], 'test-document.pdf', { type: 'application/pdf' });
          return file;
        });

        await fileInput.setInputFiles([testFile]);

        // Should show upload progress or success
        await expect(page.locator('[data-ai-id="upload-progress"], [data-ai-id="upload-success"]')).toBeVisible({ timeout: 30000 });
      }
    }
  });

  test('should handle notifications actions', async ({ page }) => {
    await page.click('text=Notificações');

    const notificationItems = page.locator('[data-ai-id="notification-item"]');
    if (await notificationItems.count() > 0) {
      const firstNotification = notificationItems.first();

      // Test mark as read
      const markReadButton = firstNotification.locator('[data-ai-id="mark-read"], button:contains("Lida")');
      if (await markReadButton.isVisible()) {
        await markReadButton.click();
        await expect(firstNotification.locator('[data-ai-id="read-indicator"]')).toBeVisible({ timeout: 10000 });
      }

      // Test delete notification
      const deleteButton = firstNotification.locator('[data-ai-id="delete-notification"], button:contains("Excluir")');
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        // Should show confirmation or remove notification
        await expect(page.locator('[data-ai-id="delete-confirmation"], [data-ai-id="notification-item"]')).toHaveCount(await notificationItems.count() - 1);
      }
    }

    // Test mark all as read
    const markAllButton = page.locator('[data-ai-id="mark-all-read"], button:contains("Marcar todas")');
    if (await markAllButton.isVisible()) {
      await markAllButton.click();
      await expect(page.locator('[data-ai-id="unread-indicator"]')).toHaveCount(0, { timeout: 10000 });
    }
  });

  test('should handle history details', async ({ page }) => {
    await page.click('text=Histórico');

    const historyItems = page.locator('[data-ai-id="history-item"]');
    if (await historyItems.count() > 0) {
      const firstHistory = historyItems.first();

      // Test view details
      await firstHistory.click('[data-ai-id="view-details"], button:contains("Detalhes")');
      await expect(page.locator('[data-ai-id="history-details-modal"]')).toBeVisible({ timeout: 30000 });

      // Should show detailed information
      await expect(page.locator('[data-ai-id="history-bid-amount"]')).toBeVisible();
      await expect(page.locator('[data-ai-id="history-result"]')).toBeVisible();
      await expect(page.locator('[data-ai-id="history-auction-info"]')).toBeVisible();

      // Close modal
      await page.click('[data-ai-id="close-details"], button:contains("Fechar")');
      await expect(page.locator('[data-ai-id="history-details-modal"]')).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle responsive design', async ({ page }) => {
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });

    // Should show mobile navigation
    await expect(page.locator('[data-ai-id="mobile-nav"], nav')).toBeVisible();

    // Should show dashboard content
    await expect(page.locator('[data-ai-id="bidder-dashboard"]')).toBeVisible();

    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 1024 });

    // Should show tablet layout
    await expect(page.locator('[data-ai-id="bidder-dashboard"]')).toBeVisible();

    // Test desktop layout
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Should show desktop layout
    await expect(page.locator('[data-ai-id="bidder-dashboard"]')).toBeVisible();
  });

  test('should handle error states', async ({ page }) => {
    // Test network error handling
    await page.route('**/api/bidder/**', route => route.abort());

    // Should show error message
    await expect(page.locator('[data-ai-id="error-message"], .error, [role="alert"]')).toBeVisible({ timeout: 10000 });

    // Should show retry button
    await expect(page.locator('[data-ai-id="retry-button"], button:contains("Tentar novamente")')).toBeVisible();
  });

  test('should handle loading states', async ({ page }) => {
    await page.click('text=Meus Arremates');

    // Should show loading indicators
    await expect(page.locator('[data-ai-id="loading"], .loading, [role="status"]')).toBeVisible({ timeout: 5000 });

    // Should eventually show content or empty state
    await expect(page.locator('[data-ai-id="won-lots-grid"], [data-ai-id="empty-state"]')).toBeVisible({ timeout: 60000 });
  });

  test('should handle empty states', async ({ page }) => {
    // Navigate through all sections
    const sections = ['Meus Arremates', 'Pagamentos', 'Documentos', 'Notificações', 'Histórico'];

    for (const section of sections) {
      await page.click(`text=${section}`);

      // Should handle empty state gracefully
      const emptyState = page.locator('text=Nenhum|Nenhuma|Não há|Empty');
      const content = page.locator('[data-ai-id*="list"], [data-ai-id*="grid"], [data-ai-id*="table"]');

      await expect(emptyState.or(content)).toBeVisible({ timeout: 30000 });

      if (await emptyState.isVisible()) {
        // Should show helpful message and action
        await expect(page.locator('text=Explorar|Adicionar|Ver|Começar')).toBeVisible();
      }
    }
  });

  test('should handle search and filters', async ({ page }) => {
    // Test won lots search
    await page.click('text=Meus Arremates');
    const searchInput = page.locator('[data-ai-id="won-lots-search"], input[placeholder*="Buscar"]');

    if (await searchInput.isVisible()) {
      await searchInput.fill('test search');
      // Should filter results or show no results
      await expect(page.locator('[data-ai-id="won-lots-grid"], [data-ai-id="no-results"]')).toBeVisible({ timeout: 10000 });
    }

    // Test won lots filters
    const statusFilter = page.locator('[data-ai-id="status-filter"], select');
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('WON');
      await expect(page.locator('[data-ai-id="won-lots-grid"]')).toBeVisible({ timeout: 10000 });
    }

    // Test history search
    await page.click('text=Histórico');
    const historySearch = page.locator('[data-ai-id="history-search"], input[placeholder*="Buscar"]');

    if (await historySearch.isVisible()) {
      await historySearch.fill('auction test');
      await expect(page.locator('[data-ai-id="history-list"], [data-ai-id="no-results"]')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should handle profile section', async ({ page }) => {
    // Navigate to profile (if available)
    const profileButton = page.locator('[data-ai-id="profile-menu"], button:contains("Perfil")');
    if (await profileButton.isVisible()) {
      await profileButton.click();

      // Should show profile section
      await expect(page.locator('[data-ai-id="profile-section"], [data-ai-id="user-profile"]')).toBeVisible({ timeout: 30000 });

      // Should show profile information
      await expect(page.locator('[data-ai-id="profile-name"], [data-ai-id="user-name"]')).toBeVisible();
      await expect(page.locator('[data-ai-id="profile-email"], [data-ai-id="user-email"]')).toBeVisible();

      // Test edit profile if available
      const editButton = page.locator('[data-ai-id="edit-profile"], button:contains("Editar")');
      if (await editButton.isVisible()) {
        await editButton.click();
        await expect(page.locator('[data-ai-id="profile-form"], form')).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('should handle logout', async ({ page }) => {
    // Find logout button (usually in header or menu)
    const logoutButton = page.locator('[data-ai-id="logout"], button:contains("Sair"), button:contains("Logout")');

    if (await logoutButton.isVisible()) {
      await logoutButton.click();

      // Should redirect to login or home
      await expect(page).toHaveURL(/\/login|\/$/, { timeout: 30000 });

      // Should clear session
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login|\/auth/, { timeout: 30000 });
    }
  });

  test('should handle session timeout', async ({ page }) => {
    // Wait for potential session timeout
    await page.waitForTimeout(60000);

    // Try to access protected route
    await page.goto('/dashboard');

    // Should redirect to login if session expired
    await expect(page).toHaveURL(/\/login|\/auth/, { timeout: 30000 });
  });

  test('should handle breadcrumb navigation', async ({ page }) => {
    // Navigate to a section
    await page.click('text=Meus Arremates');

    // Should show breadcrumbs if implemented
    const breadcrumbs = page.locator('[data-ai-id="breadcrumbs"], nav[aria-label="breadcrumb"]');
    if (await breadcrumbs.isVisible()) {
      await expect(breadcrumbs.locator('a, span')).toContainText(/Dashboard|Arremates/);
    }

    // Navigate back using breadcrumbs
    const homeBreadcrumb = breadcrumbs.locator('a:contains("Dashboard"), a:contains("Início")');
    if (await homeBreadcrumb.isVisible()) {
      await homeBreadcrumb.click();
      await expect(page.locator('[data-ai-id="dashboard-overview"]')).toBeVisible({ timeout: 30000 });
    }
  });
});
