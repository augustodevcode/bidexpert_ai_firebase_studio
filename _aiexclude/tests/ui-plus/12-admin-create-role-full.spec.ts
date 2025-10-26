// tests/ui-plus/12-admin-create-role-full.spec.ts
import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testRoleName = `Perfil Exaustivo P+ ${testRunId}`;
const prisma = new PrismaClient();
let createdRoleId: string | null = null;

test.describe('Testes de UI Exaustivos - Criação de Perfil (Role)', () => {

  test.afterAll(async () => {
    if (createdRoleId) {
      await prisma.role.delete({ where: { id: createdRoleId } }).catch(e => console.error(e));
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
    await page.goto('/admin/roles/new');
    await expect(page.getByRole('heading', { name: 'Novo Perfil de Usuário' })).toBeVisible({ timeout: 15000 });
  });

  test('Cenário: Deve preencher nome, descrição e múltiplas permissões e salvar com sucesso', async ({ page }) => {
    const roleForm = page.locator('form'); // O formulário de role é simples

    // Preencher campos
    await roleForm.getByLabel('Nome do Perfil').fill(testRoleName);
    await roleForm.getByLabel('Descrição (Opcional)').fill('Descrição completa para o perfil de teste exaustivo.');
    
    // Selecionar múltiplas permissões de diferentes grupos
    await roleForm.getByRole('button', { name: 'Leilões' }).click();
    await roleForm.getByLabel('Leilões: Criar').check();
    await roleForm.getByLabel('Leilões: Publicar').check();
    
    await roleForm.getByRole('button', { name: 'Usuários e Perfis' }).click();
    await roleForm.getByLabel('Usuários: Ver').check();
    
    await roleForm.getByRole('button', { name: 'Biblioteca de Mídia' }).click();
    await roleForm.getByLabel('Mídia: Fazer Upload').check();

    // Salvar
    await page.getByRole('button', { name: 'Criar Perfil' }).click();

    // Verificação
    await expect(page.getByText('Perfil criado com sucesso.')).toBeVisible({ timeout: 15000 });
    await page.waitForURL('/admin/roles');
    
    const createdRow = page.getByRole('row', { name: new RegExp(testRoleName, 'i') });
    await expect(createdRow).toBeVisible();
    await expect(createdRow).toContainText('4 permissão(ões)'); // Verifica a contagem

    const createdInDB = await prisma.role.findFirst({ where: { name: testRoleName } });
    expect(createdInDB).toBeDefined();
    expect(createdInDB?.permissions).toEqual(['auctions:create', 'auctions:publish', 'users:read', 'media:upload']);
    createdRoleId = createdInDB!.id;
  });
});
