// tests/ui-plus/15-admin-create-document-template-full.spec.ts
import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testTemplateName = `Template Exaustivo P+ ${testRunId}`;
const prisma = new PrismaClient();
let createdTemplateId: string | null = null;

test.describe('Testes de UI Exaustivos - Criação de Template de Documento', () => {

  test.afterAll(async () => {
    if (createdTemplateId) {
      await prisma.documentTemplate.delete({ where: { id: createdTemplateId } }).catch(e => console.error(e));
    }
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('bidexpert_setup_complete', 'true'));
    await page.goto('/auth/login');
    await page.locator('[data-ai-id="auth-login-email-input"]').fill('admin@bidexpert.com.br');
    await page.locator('[data-ai-id="auth-login-password-input"]').fill('Admin@123');
    await page.locator('[data-ai-id="auth-login-submit-button"]').click();
    await page.waitForURL('/dashboard/overview');
    await page.goto('/admin/document-templates/new');
    await expect(page.getByRole('heading', { name: 'Novo Template de Documento' })).toBeVisible({ timeout: 15000 });
  });

  test('Cenário: Deve preencher todos os campos do formulário de Template e salvar', async ({ page }) => {
    const form = page.locator('form'); // Formulário é simples

    // Preencher campos
    await form.getByLabel('Nome do Template').fill(testTemplateName);
    
    await form.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Laudo de Avaliação' }).click();

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><title>{{leilao.titulo}}</title></head>
        <body>
            <h1>Laudo de Avaliação do Leilão: {{{leilao.titulo}}}</h1>
            <p>Este laudo foi gerado em: {{{dataAtual}}}</p>
        </body>
        </html>
    `;
    await form.getByLabel('Conteúdo do Template (HTML)').fill(htmlContent);
    
    // Copiar uma variável para garantir que o botão funciona
    await page.getByRole('button', { name: 'Copiar' }).first().click();
    await expect(page.getByText('Copiado!')).toBeVisible();

    // Salvar
    await page.getByRole('button', { name: 'Criar Template' }).click();
    
    // Verificação
    await expect(page.getByText('Template criado com sucesso.')).toBeVisible({ timeout: 15000 });
    await page.waitForURL('/admin/document-templates');
    
    const createdRow = page.getByRole('row', { name: new RegExp(testTemplateName, 'i') });
    await expect(createdRow).toBeVisible();
    await expect(createdRow).toContainText('Laudo de Avaliação');

    const createdInDB = await prisma.documentTemplate.findFirst({ where: { name: testTemplateName } });
    expect(createdInDB).toBeDefined();
    expect(createdInDB?.content).toContain('{{{leilao.titulo}}}');
    createdTemplateId = createdInDB!.id;
  });
});
