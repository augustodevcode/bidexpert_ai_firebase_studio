import { test, expect } from '@playwright/test';

test.describe('User Registration', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the registration page before each test
    await page.goto('/auth/register');
    await expect(page.getByRole('heading', { name: 'Criar uma Conta' })).toBeVisible();
  });

  test('should allow a new user to register as Pessoa Física', async ({ page }) => {
    const uniqueEmail = `testuser_pf_${Date.now()}@example.com`;

    // Select "Pessoa Física"
    await page.getByRole('radio', { name: 'Pessoa Física' }).check();
    await expect(page.getByLabel('Nome Completo*')).toBeVisible();

    // Fill in personal details
    await page.getByLabel('Nome Completo*').fill('Test User Physical');
    await page.getByLabel('CPF*').fill('123.456.789-00');

    // Fill in date of birth
    await page.getByRole('button', { name: /Selecione uma data/i }).click();
    await page.getByRole('button', { name: '2000' }).click(); // Select year
    await page.getByRole('button', { name: 'Jan' }).click(); // Select month
    await page.getByRole('gridcell', { name: '15' }).click(); // Select day

    // Fill in contact and access info
    await page.getByLabel('Telefone Celular*').fill('(11) 98765-4321');
    await page.getByLabel('Confirmar Celular*').fill('(11) 98765-4321');
    await page.getByLabel('Email*').fill(uniqueEmail);
    await page.getByLabel('Confirmar Email*').fill(uniqueEmail);
    await page.getByLabel('Senha*').fill('Password123!');
    await page.getByLabel('Confirmar Senha*').fill('Password123!');

    // Fill in address
    await page.getByLabel('CEP').fill('12345-678');
    await page.getByLabel('Logradouro (Rua/Avenida)').fill('Rua Teste');
    await page.getByLabel('Número').fill('123');
    await page.getByLabel('Bairro').fill('Bairro Teste');
    await page.getByLabel('Cidade').fill('Cidade Teste');
    await page.getByLabel('Estado (UF)').fill('TS');

    // Accept terms
    await page.getByLabel(/Li e aceito os Termos de Uso/i).check();

    // Submit the form
    await page.getByRole('button', { name: 'Registrar' }).click();

    // Verify successful registration by being redirected to the login page
    await expect(page).toHaveURL(/.*\/auth\/login/, { timeout: 20000 });
    await expect(page.getByRole('heading', { name: 'Bem-vindo de Volta!' })).toBeVisible();

    // Optional: A success toast/message could also be asserted if one exists
    // await expect(page.locator('text=Registro bem-sucedido!')).toBeVisible();
  });

  test('should allow a new user to register as Pessoa Jurídica', async ({ page }) => {
    const uniqueEmail = `testuser_pj_${Date.now()}@example.com`;

    // Select "Pessoa Jurídica"
    await page.getByRole('radio', { name: 'Pessoa Jurídica' }).check();
    await expect(page.getByLabel('Razão Social*')).toBeVisible();

    // Fill in company details
    await page.getByLabel('Razão Social*').fill('Test Company Ltd.');
    await page.getByLabel('CNPJ*').fill('12.345.678/0001-99');

    // Fill in contact and access info
    await page.getByLabel('Telefone Celular*').fill('(11) 91234-5678');
    await page.getByLabel('Confirmar Celular*').fill('(11) 91234-5678');
    await page.getByLabel('Email*').fill(uniqueEmail);
    await page.getByLabel('Confirmar Email*').fill(uniqueEmail);
    await page.getByLabel('Senha*').fill('Password123!');
    await page.getByLabel('Confirmar Senha*').fill('Password123!');

    // Accept terms
    await page.getByLabel(/Li e aceito os Termos de Uso/i).check();

    // Submit the form
    await page.getByRole('button', { name: 'Registrar' }).click();

    // Verify successful registration
    await expect(page).toHaveURL(/.*\/auth\/login/, { timeout: 20000 });
    await expect(page.getByRole('heading', { name: 'Bem-vindo de Volta!' })).toBeVisible();
  });

  test('should show an error if passwords do not match', async ({ page }) => {
    // Fill in basic info
    await page.getByLabel('Nome Completo*').fill('Test User Mismatch');
    await page.getByLabel('CPF*').fill('987.654.321-00');
    await page.getByLabel('Email*').fill(`mismatch_${Date.now()}@example.com`);
    await page.getByLabel('Confirmar Email*').fill(`mismatch_${Date.now()}@example.com`);

    // Enter mismatching passwords
    await page.getByLabel('Senha*').fill('Password123!');
    await page.getByLabel('Confirmar Senha*').fill('DifferentPassword123!');

    // Accept terms
    await page.getByLabel(/Li e aceito os Termos de Uso/i).check();

    // Submit
    await page.getByRole('button', { name: 'Registrar' }).click();

    // Verify error message
    const errorMessage = page.locator('[class*="destructive"], [role="alert"]');
    await expect(errorMessage.first()).toBeVisible();
    await expect(errorMessage.first()).toContainText(/senhas não coincidem/i);

    // Verify we are still on the registration page
    await expect(page.getByRole('heading', { name: 'Criar uma Conta' })).toBeVisible();
  });
});
