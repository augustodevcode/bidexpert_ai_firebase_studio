# Cenários de Teste (TDD) para Validação de Formulários e Feedback de UI

## Funcionalidade: Validação de Formulários e Feedback de UI

**Objetivo:** Garantir que todos os formulários da aplicação sejam intuitivos, à prova de erros e forneçam feedback claro ao usuário, prevenindo submissões incompletas ou inválidas e evitando falhas silenciosas.

---

### Cenário 1: Indicação de Campos Obrigatórios

*   **Dado:** Um formulário de criação ou edição é renderizado (ex: Formulário de Ativo).
*   **Quando:** O usuário visualiza o formulário.
*   **Então:** Todos os campos cujo preenchimento é obrigatório segundo o schema de validação (Zod) DEVEM exibir um asterisco vermelho (`*`) ao lado do seu `label`.
*   **E:** Campos opcionais NÃO DEVEM exibir o asterisco.

**Exemplo de Verificação (Playwright):**
```javascript
const titleLabel = page.getByLabel('Título/Nome do Bem*');
await expect(titleLabel).toBeVisible();

const descriptionLabel = page.getByLabel('Descrição Detalhada');
await expect(descriptionLabel).not.toContainText('*');
```

---

### Cenário 2: Desabilitação do Botão de Submissão

*   **Dado:** Um formulário é renderizado em seu estado inicial.
*   **Quando:** O formulário possui campos obrigatórios que ainda não foram preenchidos.
*   **Então:** O botão principal de submissão (ex: "Criar Ativo", "Salvar Alterações") DEVE estar desabilitado (`disabled`).
*   **E:** O botão SÓ DEVE ser habilitado quando todos os campos obrigatórios forem preenchidos com dados que atendam aos critérios mínimos de validação (ex: `min(5)` para um título).

**Exemplo de Verificação (Playwright):**
```javascript
const submitButton = page.getByRole('button', { name: /Criar/i });
await expect(submitButton).toBeDisabled();

await page.getByLabel('Título/Nome do Bem*').fill('Ativo Teste');
await page.locator('[data-ai-id="entity-selector-trigger-category"]').click();
await page.locator('[data-ai-id="entity-selector-modal-category"] ...').click(); // Preenche categoria

await expect(submitButton).toBeEnabled();
```

---

### Cenário 3: Feedback de Sucesso na Submissão

*   **Dado:** Um formulário com todos os campos obrigatórios preenchidos corretamente.
*   **Quando:** O usuário clica no botão de submissão habilitado.
*   **E:** A `server action` correspondente retorna um resultado de sucesso.
*   **Então:** Um componente `Toast` de sucesso DEVE aparecer na tela, contendo uma mensagem clara (ex: "Ativo criado com sucesso.").
*   **E:** O formulário DEVE ser resetado para seu estado inicial ou o usuário DEVE ser redirecionado para a página de listagem ou edição, conforme o fluxo definido.

**Exemplo de Verificação (Playwright):**
```javascript
await page.getByRole('button', { name: 'Criar Ativo' }).click();
await expect(page.getByText('Ativo criado com sucesso.')).toBeVisible();
await expect(page).toHaveURL(/.*\/admin\/assets/); // Verifica redirecionamento
```

---

### Cenário 4: Feedback de Erro na Validação do Backend

*   **Dado:** Um formulário com dados que passam na validação do frontend, mas falham na validação do backend (ex: email duplicado).
*   **Quando:** O usuário clica no botão de submissão.
*   **E:** A `server action` correspondente retorna um resultado de falha com uma mensagem de erro.
*   **Então:** Um componente `Toast` de erro (`destructive`) DEVE aparecer na tela, exibindo a mensagem de erro retornada pelo backend (ex: "Já existe um comitente com este nome.").
*   **E:** O formulário NÃO DEVE ser resetado, permitindo que o usuário corrija os dados.

**Exemplo de Verificação (Playwright):**
```javascript
// Preenche com um email que já existe
await page.getByLabel('Email*').fill('email_duplicado@teste.com');
await page.getByRole('button', { name: 'Salvar' }).click();

await expect(page.getByText('Erro ao Salvar')).toBeVisible();
await expect(page.getByText('Este email já está em uso.')).toBeVisible();
```

---

**Conclusão dos Testes:** A aplicação deste conjunto de cenários a cada formulário da plataforma garantirá uma experiência de usuário consistente, robusta e livre de erros silenciosos.
