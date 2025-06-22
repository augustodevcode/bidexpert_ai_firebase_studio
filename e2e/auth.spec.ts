import { test, expect, Page } from '@playwright/test';

// Helper function para preencher o endereço (simulando busca por CEP)
async function fillAddress(page: Page) {
  // Em um teste real, poderíamos ter um mock para a API de CEP ou preencher o CEP e esperar os campos serem autopreenchidos.
  // Por agora, vamos preencher manualmente.
  await page.locator('input[name="zipCode"]').fill('80000000'); // data-testid="zipCodeInput"
  // Adicionar um pequeno delay ou esperar que um campo específico seja preenchido se houvesse autopreenchimento
  // await page.waitForTimeout(500);
  await page.locator('input[name="street"]').fill('Rua Teste Mock'); // data-testid="streetInput"
  await page.locator('input[name="neighborhood"]').fill('Bairro Mock'); // data-testid="neighborhoodInput"
  await page.locator('input[name="city"]').fill('Cidade Mock'); // data-testid="cityInput"
  await page.locator('select[name="state"]').selectOption({ label: 'Paraná' }); // ou { value: 'PR' } data-testid="stateSelect"
}


test.describe('Fluxo de Autenticação de Usuário (Pessoa Física)', () => {
  let uniqueEmail: string;
  const password = 'Password123!';
  const timestamp = Date.now();

  test.beforeEach(() => {
    uniqueEmail = `testuser_${timestamp}@example.com`;
  });

  test('Deve registrar um novo usuário Pessoa Física e depois fazer login', async ({ page }) => {
    // 2a. Navegar para a página de registro
    await page.goto('/auth/register'); // ou a URL completa se baseURL não estiver configurado
    console.log(`Navegou para /auth/register`);

    // 2b. Preencher o formulário de registro
    console.log(`Iniciando preenchimento do formulário com email: ${uniqueEmail}`);

    // Selecionar Tipo de Pessoa: Física (assumindo que é o padrão ou há um seletor)
    // Exemplo: await page.locator('input[name="accountType"][value="PHYSICAL"]').check(); // data-testid="accountTypePhysicalRadio"
    // Se for um select: await page.locator('select[name="accountType"]').selectOption('PHYSICAL');
    // Por enquanto, vamos assumir que "Pessoa Física" é o padrão ou não requer seleção explícita se os campos de PF estiverem visíveis.

    await page.locator('input[name="fullName"]').fill('Usuário Teste Playwright'); // data-testid="fullNameInput"
    await page.locator('input[name="cpf"]').fill('123.456.789-00'); // data-testid="cpfInput" - Usar um gerador de CPF válido para testes reais

    // Data de Nascimento - Playwright pode ter dificuldade com date pickers complexos.
    // Se for um input type="date":
    await page.locator('input[name="dateOfBirth"]').fill('1990-01-01'); // data-testid="dateOfBirthInput"
    // Se for um date picker customizado, precisaria de seletores específicos para interagir com ele.

    await page.locator('input[name="email"]').fill(uniqueEmail); // data-testid="emailInput"
    await page.locator('input[name="emailConfirmation"]').fill(uniqueEmail); // data-testid="emailConfirmationInput"

    await page.locator('input[name="cellPhone"]').fill('11999998888'); // data-testid="cellPhoneInput"
    await page.locator('input[name="cellPhoneConfirmation"]').fill('11999998888'); // data-testid="cellPhoneConfirmationInput"

    await page.locator('input[name="password"]').fill(password); // data-testid="passwordInput"
    await page.locator('input[name="passwordConfirmation"]').fill(password); // data-testid="passwordConfirmationInput"

    // Endereço
    // Idealmente, testaríamos o autopreenchimento pelo CEP, mas vamos preencher manualmente por simplicidade.
    await fillAddress(page);
    await page.locator('input[name="number"]').fill('123'); // data-testid="addressNumberInput"
    await page.locator('input[name="complement"]').fill('Apto 101'); // data-testid="addressComplementInput"

    // Marcar termos
    // Seletor precisa ser ajustado para o checkbox real dos termos
    // Ex: await page.locator('input[name="termsAccepted"]').check(); // data-testid="termsCheckbox"
    // Ou se for um label clicável associado:
    await page.locator('label:has-text("Li e aceito os Termos de Uso e a Política de Privacidade")').click(); // ou um seletor mais específico
    console.log(`Preencheu os campos do formulário de registro.`);

    // 2c. Submeter o formulário de registro
    // Usar o seletor do botão de submissão
    // Ex: await page.locator('button[type="submit"]:has-text("Cadastrar")').click(); // data-testid="registerSubmitButton"
    await page.getByRole('button', { name: /Cadastrar/i }).click();
    console.log(`Formulário de registro submetido.`);

    // 2d. Verificar se uma mensagem de sucesso é exibida
    // Esta verificação depende de como as mensagens de sucesso são implementadas (ex: toast, texto na página)
    // Exemplo com toast (pode precisar de ajuste no seletor):
    // const successToast = page.locator('.toast-success, [data-testid="success-message"]'); // Ajustar seletor
    // await expect(successToast).toBeVisible({ timeout: 10000 }); // Aumentar timeout se necessário
    // await expect(successToast).toContainText(/sucesso|bem-sucedido/i);
    // Por enquanto, vamos pular a verificação explícita do toast e confiar no redirecionamento.
    console.log(`Verificando redirecionamento ou mensagem de sucesso...`);

    // 2e. Verificar redirecionamento para a página de login
    // O URL pode variar dependendo da implementação (ex: incluir query params)
    await expect(page).toHaveURL(/.*\/auth\/login/, { timeout: 15000 }); // Aumentar timeout para permitir processamento do backend
    console.log(`Redirecionado para /auth/login com sucesso.`);

    // 2f. Na página de login, preencher o email e a senha
    await page.locator('input[name="email"]').fill(uniqueEmail); // data-testid="loginEmailInput"
    await page.locator('input[name="password"]').fill(password); // data-testid="loginPasswordInput"
    console.log(`Campos de login preenchidos.`);

    // 2g. Submeter o formulário de login
    // await page.locator('button[type="submit"]:has-text("Entrar")').click(); // data-testid="loginSubmitButton"
    await page.getByRole('button', { name: /Entrar/i }).click();
    console.log(`Formulário de login submetido.`);

    // 2h. Verificar se o login é bem-sucedido
    // Opção 1: Redirecionamento para dashboard
    await expect(page).toHaveURL(/.*\/dashboard\/overview/, { timeout: 10000 });
    console.log(`Redirecionado para /dashboard/overview com sucesso.`);

    // Opção 2: Presença de elemento que indica usuário logado
    // Ex: const userNavButton = page.locator('[data-testid="user-nav-button"]'); // Ou outro seletor
    // await expect(userNavButton).toBeVisible();
    // await expect(userNavButton).toContainText(/Usuário Teste Playwright/i); // Se o nome for exibido

    // Opção 3: Ausência de mensagens de erro de login
    // const errorMessage = page.locator('[data-testid="login-error-message"]'); // Ou seletor da mensagem de erro
    // await expect(errorMessage).not.toBeVisible();

    console.log('Login bem-sucedido!');
  });
});

console.log('Arquivo de teste e2e/auth.spec.ts criado.');
