# Cenários de Teste (TDD) para o Fluxo de Configuração Inicial (Setup)

## Funcionalidade: `src/app/setup/*` e `src/app/setup-redirect.tsx`

**Objetivo:** Garantir que o assistente de configuração inicial funcione corretamente, seja exibido apenas quando necessário, e que o estado de conclusão seja persistido no banco de dados.

---

### Cenário 1: Redirecionamento para o Setup

*   **Dado:** A plataforma está sendo acessada pela primeira vez.
*   **E:** A flag `isSetupComplete` na tabela `PlatformSettings` do banco de dados é `false`.
*   **Quando:** Um usuário tenta acessar qualquer página da aplicação (ex: a homepage `/`).
*   **Então:** O usuário DEVE ser imediatamente e automaticamente redirecionado para a página `/setup`.
*   **E:** O layout principal da aplicação (cabeçalho, rodapé) NÃO DEVE ser renderizado.

**Exemplo de Verificação (Playwright):**
```javascript
test('should redirect to /setup when setup is not complete', async ({ page }) => {
  // Simular a condição do DB antes do teste
  await prisma.platformSettings.update({
    where: { id: '1' }, // Assumindo ID global
    data: { isSetupComplete: false },
  });

  await page.goto('/');
  await page.waitForURL('/setup');
  await expect(page.locator('h1')).toContainText('Bem-vindo ao Assistente');
});
```

---

### Cenário 2: Conclusão do Fluxo de Setup

*   **Dado:** O usuário está na última etapa do assistente de configuração (`/setup`, na tela de "Finalização").
*   **Quando:** O usuário clica no botão "Ir para o Painel de Administração".
*   **Então:** Uma `server action` (`markSetupAsComplete`) DEVE ser chamada.
*   **E:** A flag `isSetupComplete` na tabela `PlatformSettings` do banco de dados DEVE ser atualizada para `true`.
*   **E:** O usuário DEVE ser redirecionado para o painel de administração (`/admin/dashboard`).

**Exemplo de Verificação (Playwright):**
```javascript
// ... chegar até a última etapa do setup ...
await page.getByRole('button', { name: 'Ir para o Painel de Administração' }).click();

// Verificar redirecionamento
await page.waitForURL('/admin/dashboard');

// Verificar no DB (pseudo-código, pois seria feito no teste de integração)
const settings = await prisma.platformSettings.findFirst();
expect(settings.isSetupComplete).toBe(true);
```

---

### Cenário 3: Bloqueio do Acesso ao Setup Após Conclusão

*   **Dado:** O setup da plataforma já foi concluído.
*   **E:** A flag `isSetupComplete` na tabela `PlatformSettings` é `true`.
*   **Quando:** Um usuário tenta acessar a página `/setup` diretamente pela URL.
*   **Então:** O usuário DEVE ser redirecionado para a página inicial (`/`) ou para o dashboard, caso esteja logado.
*   **E:** O assistente de configuração NÃO DEVE ser exibido.

**Exemplo de Verificação (Playwright):**
```javascript
// Simular a condição do DB antes do teste
await prisma.platformSettings.update({
  where: { id: '1' },
  data: { isSetupComplete: true },
});

await page.goto('/setup');
await page.waitForURL(/\/$/); // Espera ser redirecionado para a raiz
await expect(page).not.toHaveURL('/setup');
```

---

### Cenário 4: Reset do Setup pelo Administrador

*   **Dado:** Um administrador está logado e na página de Configurações (`/admin/settings`).
*   **E:** A "Zona de Perigo" com a opção "Reiniciar Setup" é visível.
*   **Quando:** O administrador clica no botão "Reiniciar Setup" e confirma a ação em um diálogo de alerta.
*   **Então:** Uma `server action` DEVE ser chamada para atualizar a flag `isSetupComplete` para `false` no banco de dados.
*   **E:** O administrador é redirecionado para a página `/setup`.

**Exemplo de Verificação (Playwright):**
```javascript
await page.goto('/admin/settings');
await page.getByRole('button', { name: 'Reiniciar Setup' }).click();
await page.getByRole('button', { name: 'Confirmar' }).click();

await page.waitForURL('/setup');

// Verificar no DB
const settings = await prisma.platformSettings.findFirst();
expect(settings.isSetupComplete).toBe(false);
```

---

**Conclusão dos Testes:** A automação destes cenários garante que o fluxo de configuração inicial seja robusto, seguro e que o estado da aplicação seja corretamente gerenciado através do banco de dados, prevenindo acessos indevidos e permitindo a reconfiguração controlada pelo administrador.
