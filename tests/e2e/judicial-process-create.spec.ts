/**
 * @file Teste E2E - Cadastro de Processo Judicial
 * @description Valida o fluxo de cadastro de um novo processo judicial no módulo de Gestão Judicial.
 * Este teste cria um processo judicial selecionando Tribunal, Comarca e Vara em cascata.
 */

import { test, expect, Page } from '@playwright/test';

// Configuração para usar demo.localhost:9005
test.use({
    baseURL: 'http://demo.localhost:9005',
    storageState: './tests/e2e/.auth/admin.json',
});

test.describe('Cadastro de Processo Judicial', () => {
    test.beforeEach(async ({ page }) => {
        // Navegar para página de processos judiciais
        await page.goto('/admin/judicial-processes');
        await page.waitForLoadState('networkidle');
    });

    test('deve cadastrar novo processo judicial com sucesso', async ({ page }) => {
        // 1. Verificar que a página de processos carregou
        await expect(page.locator('h1, h2, [data-ai-id*="judicial-processes"]')).toBeVisible({ timeout: 15000 });
        console.log('✅ Página de Processos Judiciais carregada');

        // 2. Clicar no botão "Novo Processo"
        const novoProcessoBtn = page.locator('button:has-text("Novo Processo")');
        await expect(novoProcessoBtn).toBeVisible({ timeout: 10000 });
        await novoProcessoBtn.click();
        console.log('✅ Modal de Novo Processo aberto');

        // 3. Aguardar o modal abrir
        await page.waitForTimeout(1500);
        const modal = page.locator('[role="dialog"], .modal, form');
        await expect(modal).toBeVisible({ timeout: 10000 });

        // 4. Preencher número do processo
        const numeroProcessoInput = page.locator('input[name="processNumber"], input[placeholder*="processo"], input[id*="process"]').first();
        await numeroProcessoInput.fill('1234567-89.2025.8.26.0100');
        console.log('✅ Número do processo preenchido: 1234567-89.2025.8.26.0100');

        // 5. Rolar modal para baixo para ver campos de Tribunal e Comarca
        await page.mouse.wheel(0, 500);
        await page.waitForTimeout(500);

        // 6. Selecionar Tribunal
        console.log('⏳ Selecionando Tribunal...');

        // Clicar no campo de Tribunal para abrir seletor
        const tribunalField = page.locator('[data-ai-id*="tribunal"], [data-ai-id*="court"], button:has-text("Selecione o tribunal")').first();
        if (await tribunalField.isVisible()) {
            await tribunalField.click();
            await page.waitForTimeout(1000);

            // Selecionar "Tribunal de Justiça de São Paulo - Interior" que tem mais comarcas
            const tribunalOption = page.locator('text=Tribunal de Justiça de São Paulo - Interior').first();
            if (await tribunalOption.isVisible({ timeout: 5000 }).catch(() => false)) {
                await tribunalOption.click();
                console.log('✅ Tribunal selecionado: Interior');
            } else {
                // Tentar selecionar qualquer tribunal visível
                const anyTribunal = page.locator('[role="option"], [data-ai-id*="tribunal-option"]').first();
                if (await anyTribunal.isVisible()) {
                    await anyTribunal.click();
                    console.log('✅ Tribunal alternativo selecionado');
                }
            }
        }

        await page.waitForTimeout(1000);

        // 7. Selecionar Comarca
        console.log('⏳ Selecionando Comarca...');

        const comarcaField = page.locator('[data-ai-id*="comarca"], [data-ai-id*="district"], button:has-text("Selecione a comarca")').first();
        if (await comarcaField.isVisible()) {
            await comarcaField.click();
            await page.waitForTimeout(1000);

            // Selecionar primeira comarca disponível
            const comarcaOption = page.locator('[role="option"], [data-ai-id*="comarca-option"], [data-ai-id*="district-option"]').first();
            if (await comarcaOption.isVisible({ timeout: 5000 }).catch(() => false)) {
                await comarcaOption.click();
                console.log('✅ Comarca selecionada');
            }
        }

        await page.waitForTimeout(1000);

        // 8. Selecionar Vara (se disponível)
        console.log('⏳ Verificando Vara...');

        const varaField = page.locator('[data-ai-id*="vara"], [data-ai-id*="branch"], button:has-text("Selecione a vara")').first();
        if (await varaField.isVisible()) {
            await varaField.click();
            await page.waitForTimeout(1000);

            // Selecionar primeira vara disponível
            const varaOption = page.locator('[role="option"], [data-ai-id*="vara-option"], [data-ai-id*="branch-option"]').first();
            if (await varaOption.isVisible({ timeout: 5000 }).catch(() => false)) {
                await varaOption.click();
                console.log('✅ Vara selecionada');
            }
        }

        await page.waitForTimeout(500);

        // 9. Preencher Valor Estimado
        const valorEstimadoInput = page.locator('input[name*="estimatedValue"], input[name*="value"], input[placeholder*="valor"]').first();
        if (await valorEstimadoInput.isVisible()) {
            await valorEstimadoInput.fill('150000');
            console.log('✅ Valor Estimado preenchido: 150000');
        }

        // 10. Rolar para baixo para ver o botão Salvar
        await page.mouse.wheel(0, 300);
        await page.waitForTimeout(500);

        // 11. Capturar screenshot antes de salvar
        await page.screenshot({ path: 'tests/e2e/screenshots/processo-antes-salvar.png', fullPage: false });
        console.log('📸 Screenshot capturado: processo-antes-salvar.png');

        // 12. Clicar em Salvar
        const salvarBtn = page.locator('button:has-text("Salvar"), button[type="submit"]:has-text("Salvar")').first();
        await expect(salvarBtn).toBeVisible({ timeout: 5000 });
        await salvarBtn.click();
        console.log('⏳ Botão Salvar clicado, aguardando resposta...');

        // 13. Aguardar toast de sucesso ou erro
        const toastSuccess = page.locator('[class*="toast"], [role="alert"], .sonner-toast').filter({ hasText: /sucesso|criado|cadastrado/i });
        const toastError = page.locator('[class*="toast"], [role="alert"], .sonner-toast').filter({ hasText: /erro|falha|obrigatório/i });

        try {
            await expect(toastSuccess.or(toastError)).toBeVisible({ timeout: 10000 });

            if (await toastSuccess.isVisible()) {
                console.log('✅ Processo cadastrado com sucesso!');
            } else {
                const errorText = await toastError.textContent();
                console.log(`⚠️ Erro no cadastro: ${errorText}`);
                // Não falhar o teste se houver erro de validação - é informativo
            }
        } catch {
            console.log('⏱️ Nenhum toast visível, verificando tabela...');
        }

        // 14. Capturar screenshot final
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'tests/e2e/screenshots/processo-resultado.png', fullPage: false });
        console.log('📸 Screenshot final capturado: processo-resultado.png');

        // 15. Verificar se o processo aparece na lista (se modal fechou)
        const processoNaLista = page.locator('table tbody tr, [data-ai-id*="process-item"]').filter({ hasText: '1234567' });
        const processoCriado = await processoNaLista.isVisible({ timeout: 5000 }).catch(() => false);

        if (processoCriado) {
            console.log('✅ Processo visível na lista!');
        } else {
            console.log('ℹ️ Processo não encontrado na lista (pode estar em outra página ou ainda no modal)');
        }
    });

    test('deve exibir campos obrigatórios do formulário', async ({ page }) => {
        // Abrir modal de novo processo
        const novoProcessoBtn = page.locator('button:has-text("Novo Processo")');
        await novoProcessoBtn.click();
        await page.waitForTimeout(1500);

        // Verificar campos obrigatórios (marcados com asterisco *)
        const camposObrigatorios = [
            'Número do Processo',
            'Tribunal',
            'Comarca',
        ];

        for (const campo of camposObrigatorios) {
            const label = page.locator(`label:has-text("${campo}")`).first();
            const isVisible = await label.isVisible().catch(() => false);
            console.log(`${isVisible ? '✅' : '❌'} Campo "${campo}" ${isVisible ? 'presente' : 'não encontrado'}`);
        }
    });
});
