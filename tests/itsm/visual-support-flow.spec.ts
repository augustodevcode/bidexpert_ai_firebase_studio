import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Este teste valida o fluxo completo de suporte técnico:
 * 1. Usuário abre um novo ticket com anexo e dados técnicos.
 * 2. Usuário é redirecionado para página de sucesso.
 * 3. Admin visualiza o ticket na lista.
 * 4. Admin acessa detalhes e atualiza o status.
 * 
 * Para rodar visualmente: npx playwright test tests/itsm/visual-support-flow.spec.ts --ui
 */
test.describe('Fluxo Visual de Suporte Técnico', () => {

  test('Deve permitir abrir um ticket com anexo e gerenciar via admin', async ({ page }) => {
    
    // --- 0. Login ---
    await page.goto('/auth/login');
    
    // Check if redirect happens (if already logged in)
    if (page.url().includes('/auth/login')) {
        // Handle Tenant Selection if present
        const tenantSelector = page.locator('[data-ai-id="auth-login-tenant-select"]');
        if (await tenantSelector.isVisible()) {
            await tenantSelector.click();
            await page.waitForTimeout(500);
            const tenantOption = page.locator('[role="option"]').last();
            await tenantOption.click();
        }

        await page.locator('[data-ai-id="auth-login-email-input"]').fill('test-admin-ticket@bidexpert.com');
        await page.locator('[data-ai-id="auth-login-password-input"]').fill('password123');
        await page.locator('[data-ai-id="auth-login-submit-button"]').click();
        
        // Wait for login to complete (redirect or dashboard)
        await page.waitForURL(/\/admin|\/dashboard|\/$/i, { timeout: 30000 });
    }

    // --- 1. Abertura do Ticket ---
    await page.goto('/support/new');
    
    // Validar carregamento
    await expect(page.getByRole('heading', { name: 'Abrir Novo Ticket de Suporte' })).toBeVisible();

    // Preencher formulário
    await page.getByLabel('Assunto').fill('Problema no Login [Teste Automatizado]');
    await page.getByLabel('Descrição Detalhada').fill('Estou enfrentando problemas ao tentar fazer login. O botão parece travado.');
    
    // Selecionar Categoria (Combobox)
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Problema Técnico' }).click();

    // Upload de arquivo
    const fileChooserPromise = page.waitForEvent('filechooser');
    // Clicar na área de upload (simulando clique no input oculto ou label)
    // O input está oculto, mas o label ou container dispara o clique. 
    // Vamos usar setInputFiles no input file diretamente se possível, ou disparar evento.
    // O código usa um input type file hidden com opacity 0 sobre um container.
    await page.locator('input[type="file"]').setInputFiles('tests/fixtures/sample-attachment.txt');
    
    // Validar que arquivo aparece na lista
    await expect(page.getByText('sample-attachment.txt')).toBeVisible();

    // Marcar checkbox de dados técnicos (já vem marcado default, mas vamos garantir)
    const shareCheckbox = page.getByLabel('Compartilhar dados técnicos para diagnóstico');
    if (!(await shareCheckbox.isChecked())) {
        await shareCheckbox.check();
    }

    // Submeter
    await page.getByRole('button', { name: 'Abrir Ticket' }).click();

    // --- 2. Sucesso ---
    await expect(page).toHaveURL(/\/support\/success/);
    await expect(page.getByText('Ticket Criado!')).toBeVisible();

    // --- 3. Admin View ---
    await page.goto('/admin/support-tickets');
    
    // Buscar pelo ticket recém criado
    await page.getByPlaceholder('Buscar por ID, título ou email...').fill('Problema no Login [Teste Automatizado]');
    
    // Aguardar filtragem e verificar presença
    await expect(page.getByText('Problema no Login [Teste Automatizado]')).toBeVisible();

    // --- 4. Admin Details & Update ---
    // Clicar em "Ver Detalhes" do primeiro item
    await page.getByRole('button', { name: 'Ver Detalhes' }).first().click();

    // Validar página de detalhes
    await expect(page.getByText('Problema no Login [Teste Automatizado]')).toBeVisible();
    await expect(page.getByText('Estou enfrentando problemas ao tentar fazer login')).toBeVisible();
    
    // Validar anexo nos detalhes
    await expect(page.getByText('sample-attachment.txt')).toBeVisible();

    // Validar dados técnicos (User Agent deve estar visível)
    await expect(page.getByText('User Agent:')).toBeVisible();

    // Atualizar Status
    // O Select de Status está no sidebar.
    // Encontrar o select de status (primeiro select na sidebar de gerenciamento)
    // O rótulo é "Status"
    const statusSelectTrigger = page.locator('button[role="combobox"]').nth(0); // A página tem vários selects, precisamos ser específicos ou usar label
    // Melhor usar a estrutura do card "Gerenciamento"
    
    // Localizando pelo texto próximo
    await page.locator('div').filter({ hasText: /^Status$/ }).getByRole('combobox').click();
    await page.getByRole('option', { name: 'Em Andamento' }).click();

    // Atualizar Prioridade
    await page.locator('div').filter({ hasText: /^Prioridade$/ }).getByRole('combobox').click();
    await page.getByRole('option', { name: 'Alta' }).click();

    // Salvar
    await page.getByRole('button', { name: 'Atualizar Ticket' }).click();

    // Verificar Toast de sucesso
    await expect(page.getByText('Ticket atualizado.')).toBeVisible();

    // Reload para garantir que persistiu
    await page.reload();
    await expect(page.getByRole('combobox').first()).toHaveText('Em Andamento'); // Ajustar seletor se necessário
    await expect(page.getByRole('combobox').nth(1)).toHaveText('Alta');

  });

});
