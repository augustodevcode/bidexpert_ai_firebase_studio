# Cenários de Teste (E2E) para Modos de Edição CRUD Dinâmicos

## Funcionalidade: `CrudFormContainer.tsx` e Padronização de Formulários

**Objetivo:** Garantir que o administrador possa escolher entre os modos de edição "modal" e "sheet" nas configurações da plataforma e que todos os formulários CRUD se abram corretamente dentro do contêiner escolhido, utilizando `react-hook-form` para validação.

---

### Pré-condições para os Testes:
- O usuário deve estar logado como administrador (`manage_all`).
- A aplicação deve ter entidades CRUD existentes (ex: Comitentes, Leiloeiros, Ativos).
- Deve existir uma página de configurações em `/admin/settings/general` com a opção de selecionar o "Modo de Edição".

---

### Cenário 1: Verificação do Modo "Sheet" (Painel Lateral)

*   **Dado** que o administrador está na página de Configurações Gerais (`/admin/settings/general`).
*   **Quando** ele seleciona a opção "Painel Lateral (Sheet)" para o "Modo de Edição".
*   **E** ele clica em "Salvar Alterações".
*   **E** ele navega para a página de listagem de Comitentes (`/admin/sellers`).
*   **E** ele clica no botão "Novo Comitente".
*   **Então** um painel lateral (Sheet) DEVE abrir a partir da direita da tela.
*   **E** o título "Novo Comitente" DEVE ser visível dentro do cabeçalho do painel.
*   **E** o formulário `SellerForm` DEVE estar renderizado dentro do painel.
*   **E** o botão "Salvar" no formulário DEVE estar inicialmente desabilitado (devido à validação do `react-hook-form`).

---

### Cenário 2: Verificação do Modo "Modal" (Janela)

*   **Dado** que o administrador está na página de Configurações Gerais.
*   **Quando** ele seleciona a opção "Modal (Janela)" para o "Modo de Edição".
*   **E** ele clica em "Salvar Alterações".
*   **E** ele navega para a página de listagem de Leilões (`/admin/auctions`).
*   **E** ele clica no botão "Novo Leilão".
*   **Então** uma janela modal (Dialog) DEVE aparecer centralizada na tela.
*   **E** o título "Novo Leilão" DEVE ser visível dentro do cabeçalho do modal.
*   **E** o formulário `AuctionForm` DEVE estar renderizado dentro do modal.
*   **E** o botão "Salvar" DEVE estar desabilitado.

---

### Cenário 3: Verificação do Modo de Edição (Preenchimento de Dados)

*   **Dado** que o modo de edição está configurado como "Sheet".
*   **E** que existe um Ativo (Bem) chamado "Carro Antigo de Coleção" no sistema.
*   **Quando** o administrador navega para `/admin/assets`.
*   **E** ele encontra a linha correspondente ao "Carro Antigo de Coleção".
*   **E** ele clica no botão "Editar" nesta linha.
*   **Então** um painel lateral (Sheet) DEVE abrir.
*   **E** o título no painel DEVE ser "Editar Ativo".
*   **E** o campo "Título/Nome do Bem" no formulário DEVE estar preenchido com "Carro Antigo de Coleção".

---

### Cenário 4: Responsividade Automática para Mobile

*   **Dado** que o modo de edição está configurado como "Modal" no desktop.
*   **Quando** a página é visualizada em uma tela com largura menor que 768px (viewport de celular).
*   **E** o usuário navega para `/admin/sellers` e clica em "Novo Comitente".
*   **Então** o formulário DEVE SEMPRE abrir em um painel lateral (Sheet), ignorando a configuração "Modal" para melhorar a usabilidade em telas pequenas.

---

**Conclusão dos Testes:** A automação destes cenários garante que o `CrudFormContainer` é flexível, respeita as configurações do administrador, se adapta a diferentes dispositivos e que a padronização dos formulários com `react-hook-form` está funcionando como esperado.