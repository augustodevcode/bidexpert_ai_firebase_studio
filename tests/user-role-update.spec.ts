// tests/user-role-update.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Role Update', () => {
  test.setTimeout(60000); // Aumentar timeout para 60 segundos
  
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('input[name="email"]', { timeout: 15000 });
    await page.fill('input[name="email"]', 'admin@bidexpert.com.br');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Aguardar navegação após login
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
  });

  test('deve permitir alterar perfis de um usuário', async ({ page }) => {
    console.log('=== Teste: Alteração de Perfis de Usuário ===');
    
    // Navegar para a página de usuários
    console.log('Navegando para /admin/users...');
    await page.goto('http://localhost:3000/admin/users');
    await page.waitForLoadState('networkidle');
    
    // Procurar por um usuário que não seja admin (para não quebrar o sistema)
    // Vamos procurar pelo usuário "advogado@bidexpert.com.br" criado no seed
    console.log('Procurando usuário advogado...');
    
    // Aguardar a tabela carregar
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Procurar linha do advogado
    const advogadoRow = page.locator('table tbody tr').filter({ 
      hasText: 'advogado@bidexpert.com.br' 
    });
    
    const advogadoExists = await advogadoRow.count() > 0;
    
    if (!advogadoExists) {
      console.log('Usuário advogado não encontrado, usando primeiro usuário não-admin da lista');
      // Pegar o segundo usuário (primeiro que não é admin)
      const secondRow = page.locator('table tbody tr').nth(1);
      await secondRow.locator('button[aria-label="Actions"]').first().click();
    } else {
      console.log('Usuário advogado encontrado');
      await advogadoRow.locator('button[aria-label="Actions"]').first().click();
    }
    
    // Clicar em "Editar" no menu de ações
    await page.waitForTimeout(500);
    console.log('Clicando em Editar...');
    await page.getByRole('menuitem', { name: /editar/i }).click();
    
    // Aguardar página de edição carregar
    await page.waitForURL('**/admin/users/**/edit', { timeout: 10000 });
    console.log('Página de edição carregada');
    
    // Scroll até o formulário de perfis
    const roleFormCard = page.locator('[data-ai-id="user-role-form"]');
    await roleFormCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    
    // Capturar perfis atuais
    const currentRoles = await roleFormCard.locator('input[type="checkbox"]:checked').count();
    console.log('Perfis atuais selecionados:', currentRoles);
    
    // Desmarcar todos os checkboxes primeiro
    const allCheckboxes = roleFormCard.locator('input[type="checkbox"]');
    const checkboxCount = await allCheckboxes.count();
    console.log('Total de perfis disponíveis:', checkboxCount);
    
    for (let i = 0; i < checkboxCount; i++) {
      const checkbox = allCheckboxes.nth(i);
      const isChecked = await checkbox.isChecked();
      if (isChecked) {
        console.log(`Desmarcando perfil ${i + 1}`);
        await checkbox.click();
        await page.waitForTimeout(300);
      }
    }
    
    // Verificar que o botão está desabilitado (nenhum perfil selecionado)
    const saveButton = roleFormCard.getByRole('button', { name: /salvar perfis/i });
    const isDisabledNoRoles = await saveButton.isDisabled();
    console.log('Botão desabilitado sem perfis:', isDisabledNoRoles);
    expect(isDisabledNoRoles).toBe(true);
    
    // Selecionar um perfil diferente (por exemplo, o primeiro disponível)
    console.log('Selecionando primeiro perfil...');
    await allCheckboxes.nth(0).click();
    await page.waitForTimeout(500);
    
    // Verificar que o botão está habilitado
    const isEnabledWithRole = await saveButton.isDisabled();
    console.log('Botão desabilitado após selecionar perfil:', isEnabledWithRole);
    expect(isEnabledWithRole).toBe(false);
    
    // Selecionar mais um perfil para ter certeza que múltiplos perfis funcionam
    if (checkboxCount > 1) {
      console.log('Selecionando segundo perfil...');
      await allCheckboxes.nth(1).click();
      await page.waitForTimeout(500);
    }
    
    // Capturar quais perfis estão selecionados antes de salvar
    const selectedRolesBefore = [];
    for (let i = 0; i < checkboxCount; i++) {
      const checkbox = allCheckboxes.nth(i);
      const isChecked = await checkbox.isChecked();
      if (isChecked) {
        const label = await checkbox.locator('..').locator('..').locator('label').textContent();
        selectedRolesBefore.push(label?.trim());
      }
    }
    console.log('Perfis selecionados antes de salvar:', selectedRolesBefore);
    
    // Clicar no botão Salvar Perfis
    console.log('Clicando em Salvar Perfis...');
    await saveButton.click();
    
    // Aguardar toast de sucesso
    await page.waitForSelector('text=/sucesso/i', { timeout: 10000 });
    console.log('Toast de sucesso exibido');
    
    // Aguardar redirecionamento para /admin/users
    await page.waitForURL('**/admin/users', { timeout: 10000 });
    console.log('Redirecionado para lista de usuários');
    
    // Aguardar a tabela recarregar
    await page.waitForTimeout(2000);
    
    // Voltar para a página de edição para verificar se os perfis foram salvos
    console.log('Voltando para a página de edição para verificar...');
    
    if (advogadoExists) {
      const advogadoRowAgain = page.locator('table tbody tr').filter({ 
        hasText: 'advogado@bidexpert.com.br' 
      });
      await advogadoRowAgain.locator('button[aria-label="Actions"]').first().click();
    } else {
      const secondRow = page.locator('table tbody tr').nth(1);
      await secondRow.locator('button[aria-label="Actions"]').first().click();
    }
    
    await page.waitForTimeout(500);
    await page.getByRole('menuitem', { name: /editar/i }).click();
    await page.waitForURL('**/admin/users/**/edit', { timeout: 10000 });
    
    // Verificar perfis após salvar
    const roleFormCardAfter = page.locator('[data-ai-id="user-role-form"]');
    await roleFormCardAfter.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    
    const selectedRolesAfter: string[] = [];
    const allCheckboxesAfter = roleFormCardAfter.locator('input[type="checkbox"]');
    const checkboxCountAfter = await allCheckboxesAfter.count();
    
    for (let i = 0; i < checkboxCountAfter; i++) {
      const checkbox = allCheckboxesAfter.nth(i);
      const isChecked = await checkbox.isChecked();
      if (isChecked) {
        const label = await checkbox.locator('..').locator('..').locator('label').textContent();
        if (label) {
          selectedRolesAfter.push(label.trim());
        }
      }
    }
    
    console.log('Perfis selecionados após recarregar:', selectedRolesAfter);
    
    // Verificar se os perfis selecionados foram mantidos
    expect(selectedRolesAfter.length).toBeGreaterThan(0);
    console.log('Verificação: Pelo menos um perfil foi salvo');
    
    // Verificar que os perfis correspondem aos que foram selecionados
    const allRolesMatch = selectedRolesBefore.every(role => 
      selectedRolesAfter.some(savedRole => savedRole?.includes(role?.split('\n')[0] || ''))
    );
    
    console.log('Todos os perfis selecionados foram salvos:', allRolesMatch);
    expect(allRolesMatch).toBe(true);
    
    console.log('=== Teste concluído com sucesso ===');
  });

  test('deve validar que pelo menos um perfil é obrigatório', async ({ page }) => {
    console.log('=== Teste: Validação de perfil obrigatório ===');
    
    await page.goto('http://localhost:3000/admin/users');
    await page.waitForLoadState('networkidle');
    
    // Pegar segundo usuário
    const secondRow = page.locator('table tbody tr').nth(1);
    await secondRow.locator('button[aria-label="Actions"]').first().click();
    await page.waitForTimeout(500);
    await page.getByRole('menuitem', { name: /editar/i }).click();
    await page.waitForURL('**/admin/users/**/edit', { timeout: 10000 });
    
    const roleFormCard = page.locator('[data-ai-id="user-role-form"]');
    await roleFormCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    
    // Desmarcar todos os checkboxes
    const allCheckboxes = roleFormCard.locator('input[type="checkbox"]');
    const checkboxCount = await allCheckboxes.count();
    
    for (let i = 0; i < checkboxCount; i++) {
      const checkbox = allCheckboxes.nth(i);
      const isChecked = await checkbox.isChecked();
      if (isChecked) {
        await checkbox.click();
        await page.waitForTimeout(200);
      }
    }
    
    // Verificar que o botão está desabilitado
    const saveButton = roleFormCard.getByRole('button', { name: /salvar perfis/i });
    const isDisabled = await saveButton.isDisabled();
    
    console.log('Botão desabilitado quando nenhum perfil está selecionado:', isDisabled);
    expect(isDisabled).toBe(true);
    
    console.log('=== Teste de validação concluído ===');
  });
});
