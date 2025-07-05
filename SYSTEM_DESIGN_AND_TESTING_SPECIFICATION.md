# Documento de Especificação de Design e Testes do Sistema de Leilões

## 1. Introdução

*   [Objetivo do Documento: Descrever as especificações funcionais, de design de interface (alto nível), e a estratégia de testes (BDD/TDD) para a plataforma de leilões.]
*   [Escopo: Detalhar as principais funcionalidades, perfis de usuário, regras de negócio, layouts de página, e abordagens de teste.]
*   [Público Alvo: Desenvolvedores, QAs, Product Owners, Designers.]

## 2. Perfis de Usuário (Personas)

*   [Descrever cada persona principal do sistema, suas necessidades, objetivos e como interagem com a plataforma. Ex: Administrador, Comprador/Licitante (Pessoa Física e Jurídica), Vendedor/Comitente, Leiloeiro, Visitante Não Autenticado.]
    *   **2.1. Administrador da Plataforma**
        *   [Descrição, Objetivos, Tarefas Principais]
    *   **2.2. Licitante (Comprador)**
        *   [Descrição, Objetivos, Tarefas Principais - PF e PJ]
    *   **2.3. Comitente (Vendedor)**
        *   [Descrição, Objetivos, Tarefas Principais]
    *   **2.4. Leiloeiro**
        *   [Descrição, Objetivos, Tarefas Principais]
    *   **2.5. Visitante Não Autenticado**
        *   [Descrição, Objetivos, Tarefas Principais]

## 3. Principais Funcionalidades e Especificações

### 3.1. Autenticação de Usuário (Login)

*   **3.1.1. Descrição Geral:**
    *   Permite que usuários registrados acessem a plataforma utilizando seu email e senha. O sistema valida as credenciais e, em caso de sucesso, estabelece uma sessão autenticada para o usuário. Garante o tratamento adequado de erros para credenciais inválidas ou outros problemas de login. A autenticação é crucial para proteger dados e funcionalidades restritas.
*   **3.1.2. Cenários BDD (Given/When/Then):**
    ```gherkin
    Feature: Autenticação de Usuário
      Como um usuário da plataforma
      Eu quero poder me autenticar
      Para acessar as funcionalidades restritas e minha conta.

      Scenario: Login bem-sucedido
        Given Estou na página de login em "/auth/login"
        And Existe um usuário registrado com email "usuario@example.com" e senha "senhaValida123"
        When Eu preencho o campo "email" com "usuario@example.com"
        And Eu preencho o campo "senha" com "senhaValida123"
        And Eu clico no botão "Entrar"
        Then Eu devo ser redirecionado para a página de dashboard "/dashboard/overview"
        And Eu devo ver o nome "Usuário Exemplo" no painel de navegação do usuário.

      Scenario: Tentativa de login com email não cadastrado
        Given Estou na página de login em "/auth/login"
        When Eu preencho o campo "email" com "naoexiste@example.com"
        And Eu preencho o campo "senha" com "qualquersenha"
        And Eu clico no botão "Entrar"
        Then Eu devo continuar na página de login
        And Eu devo ver uma mensagem de erro "Usuário não encontrado ou senha inválida."

      Scenario: Tentativa de login com senha incorreta
        Given Estou na página de login em "/auth/login"
        And Existe um usuário registrado com email "usuario@example.com" e senha "senhaCorreta"
        When Eu preencho o campo "email" com "usuario@example.com"
        And Eu preencho o campo "senha" com "senhaIncorreta"
        And Eu clico no botão "Entrar"
        Then Eu devo continuar na página de login
        And Eu devo ver uma mensagem de erro "Usuário não encontrado ou senha inválida."

      Scenario: Logout de um usuário autenticado
        Given Estou logado na plataforma como "usuario@example.com"
        And Estou na página de dashboard "/dashboard/overview"
        When Eu clico no botão/link de "Sair" no menu do usuário
        Then Eu devo ser redirecionado para a página inicial "/" ou "/auth/login"
        And Eu não devo mais ver meu nome no painel de navegação do usuário.
    ```
*   **3.1.3. Regras de Negócio e Validações:**
    *   **Campos do Formulário:**
        *   `email`: Obrigatório, deve ser um formato de email válido.
        *   `password`: Obrigatório, sem validação de formato no frontend (mas pode ter no backend, ex: mínimo de caracteres).
    *   **Validação (Client-side e Server-side):**
        *   Os campos são validados no frontend antes da submissão (ex: usando Zod no `login-form.tsx`).
        *   A Server Action (`authenticateUserSql` em `src/app/auth/actions.ts`) realiza a validação final no backend.
    *   **Segurança da Senha (Backend):**
        *   A senha fornecida pelo usuário deve ser comparada com a senha armazenada no banco de dados de forma segura.
        *   **IMPORTANTE:** A implementação atual (`authenticateUserSql`) compara senhas em texto plano, o que é **INSEGURO**. Deve ser substituído por comparação de hash (ex: bcrypt) em produção. (Referência: `BUSINESS_RULES.md`).
    *   **Redirecionamentos:**
        *   Após login bem-sucedido: Redirecionar para `/dashboard/overview` ou para a página que o usuário tentou acessar antes de ser redirecionado para o login (se aplicável).
        *   Após logout: Redirecionar para a página inicial (`/`) ou para a página de login (`/auth/login`).
    *   **Gerenciamento de Sessão:**
        *   O sistema deve estabelecer uma sessão segura para o usuário após o login (ex: usando cookies HTTP-only, tokens JWT).
        *   A interface (`UserNav` em `src/components/layout/header.tsx`) deve refletir o estado de autenticação, mostrando o nome do usuário e opções de conta/logout, ou links de login/registro.
        *   Acesso a rotas protegidas requer uma sessão válida.
    *   **Tratamento de Erros:**
        *   Mensagens de erro claras devem ser exibidas para: email não encontrado, senha incorreta, conta bloqueada/inativa (se aplicável).
        *   A action `authenticateUserSql` retorna `SqlAuthResult` com `{ success: boolean, message: string, user?: UserProfileData }`.
*   **3.1.4. Layout e Páginas Envolvidas:**
    *   **Página Principal:** `/auth/login`
        *   **Elementos de UI Chave:**
            *   Título (ex: "Acessar minha conta").
            *   Campo de entrada para "Email" (tipo `email`, nome `email`).
            *   Campo de entrada para "Senha" (tipo `password`, nome `password`).
            *   Botão de submissão (ex: "Entrar").
            *   Link para "Esqueci minha senha" (ex: `/auth/forgot-password`).
            *   Link para "Não tem uma conta? Registre-se" (ex: `/auth/register`).
            *   Área para exibição de mensagens de erro.
    *   **Componente `UserNav` (em `src/components/layout/user-nav.tsx` e usado no `Header`):**
        *   **Estado Não Autenticado:** Exibe links/botões para "Entrar" e "Cadastre-se".
        *   **Estado Autenticado:** Exibe o nome do usuário (`UserProfileData.fullName`), avatar (`UserProfileData.avatarUrl`), e um menu dropdown com links para "Meu Painel", "Minha Conta", "Sair".
*   **3.1.5. Considerações sobre TDD:**
    *   **Testes Unitários:**
        *   Para o schema Zod do formulário de login (se houver um específico, ou para as validações de campo se feitas manualmente no componente): verificar regras de obrigatoriedade e formato para email/senha.
        *   Para uma função pura de validação de credenciais (se separada da chamada ao DB): testar a lógica de validação de formato, sem interagir com serviços externos.
    *   **Testes de Integração (Server Action):**
        *   Testar a action `authenticateUserSql` (arquivo `src/app/auth/actions.test.ts` já iniciado):
            *   Mockar `getDatabaseAdapter()` para retornar um adapter que simula a busca de usuário (`getUserByEmail`).
            *   Cenário 1: `getUserByEmail` retorna usuário com senha correspondente -> action retorna `{ success: true, user: ... }`.
            *   Cenário 2: `getUserByEmail` retorna `null` -> action retorna `{ success: false, message: "Usuário não encontrado." }`.
            *   Cenário 3: `getUserByEmail` retorna usuário mas senha não confere -> action retorna `{ success: false, message: "Senha incorreta." }`.
            *   Cenário 4: `getUserByEmail` lança uma exceção -> action retorna `{ success: false, message: "Erro..." }`.
    *   **Testes de UI (Componente):**
        *   Usar React Testing Library para testar o componente do formulário de login (`src/app/auth/login/page.tsx` ou o componente de formulário interno).
        *   Verificar renderização correta dos campos e botão.
        *   Testar validações de frontend (ex: mensagens de erro ao submeter com campos vazios ou email inválido).
        *   Simular submissão e mockar a server action para verificar o comportamento do formulário (ex: desabilitar botão durante submissão, exibir mensagem de erro global retornada pela action).
    *   **Testes End-to-End (E2E):**
        *   O teste `e2e/auth.spec.ts` já cobre o fluxo de login bem-sucedido após o registro.
        *   Adicionar cenários E2E específicos para login com credenciais inválidas e verificar as mensagens de erro na UI.
        *   Testar o fluxo de logout.

### 3.2. Registro de Novo Usuário (Cadastro)

*   **3.2.1. Descrição Geral:**
    *   Permite que novos usuários criem uma conta na plataforma. O processo de registro coleta informações pessoais, de contato, endereço e credenciais. O formulário se adapta para diferentes tipos de conta, como Pessoa Física (PF), Pessoa Jurídica (PJ), e Comitente para Venda Direta. O consentimento com os Termos de Uso e Política de Privacidade é obrigatório. Após o registro bem-sucedido, o usuário geralmente é direcionado para a página de login ou para completar etapas adicionais, como o envio de documentos para habilitação.
*   **3.2.2. Cenários BDD (Gherkin):**
    ```gherkin
    Feature: Registro de Novo Usuário
      Como um novo visitante da plataforma
      Eu quero poder me registrar
      Para ter acesso às funcionalidades e participar dos leilões.

      Scenario: Registro bem-sucedido como Pessoa Física
        Given Estou na página de registro em "/auth/register"
        When Eu seleciono o tipo de conta "Pessoa Física"
        And Eu preencho o campo "Nome Completo" com "Maria Silva Teste"
        And Eu preencho o campo "CPF" com "111.222.333-44"
        And Eu preencho o campo "Data de Nascimento" com "01/01/1985"
        And Eu preencho o campo "Email" com "maria.silva.teste@example.com"
        And Eu preencho o campo "Confirmação de Email" com "maria.silva.teste@example.com"
        And Eu preencho o campo "Celular" com "11988776655"
        And Eu preencho o campo "Confirmação de Celular" com "11988776655"
        And Eu preencho o campo "Senha" com "SenhaForte123!"
        And Eu preencho o campo "Confirmação de Senha" com "SenhaForte123!"
        And Eu preencho o campo "CEP" com "01001-000" e os campos de endereço são autopreenchidos
        And Eu preencho o campo "Número" (endereço) com "100"
        And Eu marco a caixa de "Li e aceito os Termos de Uso e a Política de Privacidade"
        And Eu clico no botão "Cadastrar"
        Then Eu devo ver uma mensagem de sucesso "Cadastro realizado com sucesso!"
        And Eu devo ser redirecionado para a página de login "/auth/login"

      Scenario: Registro bem-sucedido como Pessoa Jurídica
        Given Estou na página de registro em "/auth/register"
        When Eu seleciono o tipo de conta "Pessoa Jurídica"
        And Eu preencho o campo "Razão Social" com "Empresa Teste Exemplo Ltda"
        And Eu preencho o campo "CNPJ" com "11.222.333/0001-44"
        And Eu preencho o campo "Email" com "contato@empresateste.example.com"
        And Eu preencho o campo "Confirmação de Email" com "contato@empresateste.example.com"
        And Eu preencho o campo "Celular Corporativo" com "11977665544"
        And Eu preencho o campo "Confirmação de Celular Corporativo" com "11977665544"
        And Eu preencho o campo "Senha" com "SuperSenhaPJ@2024"
        And Eu preencho o campo "Confirmação de Senha" com "SuperSenhaPJ@2024"
        And Eu preencho o campo "Nome Completo do Responsável" com "Carlos Administrador"
        And Eu preencho o campo "CPF do Responsável" com "444.555.666-77"
        And Eu preencho o campo "CEP" com "02002-000" e os campos de endereço são autopreenchidos
        And Eu preencho o campo "Número" (endereço) com "200B"
        And Eu marco a caixa de "Li e aceito os Termos de Uso e a Política de Privacidade"
        And Eu clico no botão "Cadastrar"
        Then Eu devo ver uma mensagem de sucesso "Cadastro realizado com sucesso!"
        And Eu devo ser redirecionado para a página de login "/auth/login"

      Scenario: Tentativa de registro com email já cadastrado
        Given Estou na página de registro em "/auth/register"
        And Existe um usuário registrado com o email "existente@example.com"
        When Eu preencho o campo "Email" com "existente@example.com"
        And Eu preencho os demais campos obrigatórios
        And Eu clico no botão "Cadastrar"
        Then Eu devo continuar na página de registro
        And Eu devo ver uma mensagem de erro "Este email já está cadastrado."

      Scenario: Tentativa de registro com senhas que não coincidem
        Given Estou na página de registro em "/auth/register"
        When Eu preencho o campo "Senha" com "SenhaForte123!"
        And Eu preencho o campo "Confirmação de Senha" com "SenhaDiferente123!"
        And Eu preencho os demais campos obrigatórios
        And Eu clico no botão "Cadastrar"
        Then Eu devo continuar na página de registro
        And Eu devo ver uma mensagem de erro "As senhas não coincidem." próximo ao campo de confirmação de senha.

      Scenario: Tentativa de registro sem preencher campo obrigatório (Nome Completo)
        Given Estou na página de registro em "/auth/register"
        When Eu preencho o campo "Email" com "novo.usuario@example.com"
        And Eu deixo o campo "Nome Completo" em branco
        And Eu preencho os demais campos obrigatórios
        And Eu clico no botão "Cadastrar"
        Then Eu devo continuar na página de registro
        And Eu devo ver uma mensagem de erro "O nome completo é obrigatório." próximo ao campo "Nome Completo".

      Scenario: Tentativa de registro sem aceitar os Termos de Uso
        Given Estou na página de registro em "/auth/register"
        When Eu preencho todos os campos obrigatórios
        And Eu NÃO marco a caixa de "Li e aceito os Termos de Uso e a Política de Privacidade"
        And Eu clico no botão "Cadastrar"
        Then Eu devo continuar na página de registro
        And Eu devo ver uma mensagem de erro "Você deve aceitar os Termos de Uso e a Política de Privacidade para continuar."
    ```
*   **3.2.3. Regras de Negócio e Validações:**
    *   **Campos do Formulário (baseado em `UserFormValues` de `user-form-schema.ts` e lógica de registro):**
        *   **Comum a todos:**
            *   `email`: Obrigatório, formato de email válido, único no sistema. (Validação Zod: `z.string().email()`)
            *   `emailConfirmation`: Obrigatório, deve ser igual ao campo `email`.
            *   `password`: Obrigatório, mínimo de 6 caracteres. (Validação Zod: `z.string().min(6)`)
            *   `passwordConfirmation`: Obrigatório, deve ser igual ao campo `password`.
            *   `cellPhone`: Obrigatório, formato de telefone/celular (validação de formato pode ser via regex ou lib específica).
            *   `cellPhoneConfirmation`: Obrigatório, deve ser igual ao campo `cellPhone`.
            *   `zipCode` (CEP): Obrigatório, formato "00000-000". Idealmente, aciona busca de endereço.
            *   `street` (Rua): Obrigatório (pode ser autopreenchido pelo CEP).
            *   `number` (Número): Obrigatório.
            *   `complement` (Complemento): Opcional.
            *   `neighborhood` (Bairro): Obrigatório (pode ser autopreenchido pelo CEP).
            *   `city` (Cidade): Obrigatório (pode ser autopreenchido pelo CEP).
            *   `state` (Estado/UF): Obrigatório (pode ser autopreenchido pelo CEP).
            *   `termsAccepted` (Checkbox "Li e aceito os Termos..."): Obrigatório (deve ser marcado).
            *   `optInMarketing` (Checkbox "Desejo receber..."): Opcional, default `false`. (Validação Zod: `z.boolean().default(false).optional()`)
        *   **Pessoa Física (`accountType: 'PHYSICAL'`):**
            *   `fullName`: Obrigatório, min 3 caracteres, max 150. (Validação Zod: `z.string().min(3).max(150)`)
            *   `cpf`: Obrigatório, formato CPF válido, único. (Validação Zod: `z.string()`, formato específico via `.refine()`)
            *   `dateOfBirth`: Obrigatório, data válida. (Validação Zod: `z.date()`)
        *   **Pessoa Jurídica (`accountType: 'LEGAL'`):**
            *   `razaoSocial`: Obrigatório, min 3 caracteres.
            *   `cnpj`: Obrigatório, formato CNPJ válido, único. (Validação Zod: `z.string()`, formato específico via `.refine()`)
            *   `inscricaoEstadual`: Opcional.
            *   `websiteComitente`: Opcional, formato URL válido. (Validação Zod: `z.string().url().optional().or(z.literal(''))`)
            *   `fullName` (do responsável): Obrigatório.
            *   `cpf` (do responsável): Obrigatório.
            *   `dateOfBirth` (do responsável): Obrigatório.
        *   **Comitente Venda Direta (`accountType: 'DIRECT_SALE_CONSIGNOR'`):**
            *   Similar a PF ou PJ, dependendo da natureza do comitente. Precisa de definição mais clara dos campos específicos.
    *   **Regras Gerais:**
        *   Unicidade de Email: A Server Action `createUser` verifica se o email já existe no sistema de autenticação (Firebase Auth se `ACTIVE_DATABASE_SYSTEM === 'FIRESTORE'`).
        *   Unicidade de CPF/CNPJ: Deve ser validado no backend (DB adapter).
        *   Confirmação de Senha: Validação no frontend e, opcionalmente, no backend.
        *   Confirmação de Email/Celular: Validação no frontend.
        *   Aceite dos Termos: Campo booleano obrigatório.
        *   Atribuição de Papel Padrão: Novos usuários recebem o papel 'USER' e `habilitationStatus: 'PENDENTE_DOCUMENTOS'` por padrão (lógica em `createUser` e `ensureUserRole`).
        *   Criação de Conta:
            *   Se `ACTIVE_DATABASE_SYSTEM === 'FIRESTORE'`, primeiro tenta criar no Firebase Auth. Se sucesso, prossegue para criar no DB da aplicação via `ensureUserRole`. Se `ensureUserRole` falhar, o usuário no Firebase Auth é deletado (rollback).
            *   Se outro sistema de DB, a lógica de criação de usuário e autenticação pode variar.
        *   Redirecionamento: Após registro bem-sucedido, o usuário é tipicamente redirecionado para a página de login (`/auth/login`) ou uma página de "verifique seu email" (se aplicável).
*   **3.2.4. Layout e Páginas Envolvidas:**
    *   **Página Principal:** `/auth/register`
    *   **Elementos de UI Chave:**
        *   Título (ex: "Criar minha conta").
        *   Seletor de tipo de conta (ex: Rádios ou Select para "Pessoa Física", "Pessoa Jurídica", "Comitente Venda Direta").
        *   **Campos Condicionais (baseado no tipo de conta):**
            *   PF: Nome Completo, CPF, Data de Nascimento.
            *   PJ: Razão Social, CNPJ, Inscrição Estadual, Website, Nome do Responsável, CPF do Responsável, Data de Nascimento do Responsável.
        *   **Campos Comuns:** Email, Confirmação de Email, Celular, Confirmação de Celular, Senha, Confirmação de Senha.
        *   **Seção de Endereço:** CEP (com busca automática), Rua, Número, Complemento, Bairro, Cidade, Estado.
        *   Checkbox para "Li e aceito os Termos de Uso e a Política de Privacidade".
        *   Checkbox opcional para "Desejo receber novidades e promoções por email".
        *   Botão de submissão (ex: "Cadastrar", "Criar Conta").
        *   Link para "Já tem uma conta? Faça login" (ex: `/auth/login`).
        *   Área para exibição de mensagens de erro (por campo e globais).
*   **3.2.5. Considerações sobre TDD:**
    *   **Testes Unitários:**
        *   Para o schema Zod de registro (ex: `userFormSchema` adaptado ou um novo `registrationFormSchema`):
            *   Validar cada campo individualmente (obrigatoriedade, tipo, formato, min/max length).
            *   Testar refinamentos (ex: `password === passwordConfirmation`, unicidade de email/CPF/CNPJ simulada com mocks).
            *   Testar a lógica condicional de campos baseada no `accountType`.
    *   **Testes de Integração (Server Action):**
        *   Testar a action `createUser` (arquivo `src/app/admin/users/actions.test.ts` já iniciado):
            *   Mockar `ensureAdminInitialized` (para Firebase Auth) e `getDatabaseAdapter`.
            *   Cenário 1 (FIRESTORE): `auth.getUserByEmail` retorna `null`, `auth.createUser` sucesso, `adapter.ensureUserRole` sucesso -> action retorna `{ success: true, user: ... }`.
            *   Cenário 2 (FIRESTORE): `auth.getUserByEmail` retorna usuário existente -> action retorna `{ success: false, message: "Email já existe..." }`.
            *   Cenário 3 (FIRESTORE): `auth.createUser` sucesso, `adapter.ensureUserRole` falha -> `auth.deleteUser` é chamado, action retorna `{ success: false, message: "Falha ao criar perfil..." }`.
            *   Cenário 4: Criação com `roleId` específico (se o formulário de registro público permitir, caso contrário, mais relevante para criação via admin).
            *   Testar a criação para diferentes `accountType` e verificar se os dados corretos são passados para `adapter.ensureUserRole`.
    *   **Testes de UI (Componente):**
        *   Usar React Testing Library para testar o componente de formulário de registro (`src/app/auth/register/page.tsx`).
        *   Verificar renderização correta dos campos, incluindo a condicional baseada no tipo de conta.
        *   Testar validações de frontend (mensagens de erro ao submeter com campos inválidos/vazios, senhas não conferem).
        *   Simular submissão e mockar a server action `createUser` para verificar comportamento (ex: feedback ao usuário, redirecionamento).
    *   **Testes End-to-End (E2E):**
        *   O teste `e2e/auth.spec.ts` já cobre o fluxo de registro de Pessoa Física.
        *   Adicionar cenários E2E para registro de Pessoa Jurídica.
        *   Testar cenários de erro (email duplicado, campos inválidos) e verificar as mensagens na UI.

### 3.3. Gerenciamento de Leilões (CRUD - Visão Admin e Comitente)

*   **3.3.1. Descrição Geral:**
    *   Esta funcionalidade permite a criação, visualização, listagem, edição e exclusão de leilões. Administradores têm acesso total ao CRUD de todos os leilões. Comitentes (Vendedores) podem ter permissão para criar e gerenciar seus próprios leilões através de uma interface simplificada, possivelmente assistida por IA (`/auctions/create`). Leiloeiros podem ter permissão para gerenciar leilões que lhes são atribuídos.
*   **3.3.2. Cenários BDD (Gherkin):**
    ```gherkin
    Feature: Gerenciamento de Leilões
      Como um usuário autorizado (Admin/Comitente/Leiloeiro)
      Eu quero poder gerenciar leilões
      Para organizar e disponibilizar itens para venda.

      Scenario: Administrador cria um novo leilão com sucesso
        Given Estou logado como Administrador
        And Estou na página de criação de leilões "/admin/auctions/new"
        When Eu preencho o campo "Título do Leilão" com "Leilão de Eletrônicos Usados"
        And Eu seleciono o status "EM_BREVE"
        And Eu preencho o campo "Categoria" com "Eletrônicos" (ou seleciono ID)
        And Eu preencho o campo "Leiloeiro" com "Leiloeiro Oficial Teste" (ou seleciono ID)
        And Eu preencho o campo "Comitente" com "Empresa Vende Tudo" (ou seleciono ID)
        And Eu seleciono a "Data do Leilão" para "20/12/2024 10:00"
        And Eu clico no botão "Salvar Leilão"
        Then Eu devo ver uma mensagem de sucesso "Leilão criado com sucesso!"
        And Eu devo ser redirecionado para a lista de leilões "/admin/auctions"
        And O leilão "Leilão de Eletrônicos Usados" deve aparecer na lista.

      Scenario: Comitente cria um leilão usando a interface assistida por IA
        Given Estou logado como Comitente
        And Estou na página de criação de leilão assistida "/auctions/create"
        When Eu forneço uma descrição básica do que quero leiloar, como "Vários itens de escritório e alguns notebooks"
        And A IA sugere detalhes como título "Leilão de Itens de Escritório e Notebooks", categoria "Móveis de Escritório e Informática"
        And Eu aceito as sugestões da IA e preencho informações adicionais como datas e local
        And Eu submeto o formulário de criação de leilão
        Then Eu devo ver uma mensagem "Leilão enviado para aprovação" ou "Leilão criado com sucesso"
        And O leilão deve constar no meu painel de comitente.

      Scenario: Usuário autorizado visualiza a lista de leilões no painel administrativo
        Given Estou logado como Administrador
        And Existem leilões cadastrados no sistema
        When Eu acesso a página "/admin/auctions"
        Then Eu devo ver uma tabela ou lista com os leilões, exibindo colunas como "Título", "Status", "Data", "Leiloeiro", "Comitente".
        And Eu devo ter opções para filtrar e paginar os resultados.

      Scenario: Administrador edita um leilão existente
        Given Estou logado como Administrador
        And Existe um leilão com título "Leilão Antigo" e status "EM_BREVE"
        When Eu navego para a página de edição do "Leilão Antigo"
        And Eu altero o campo "Título do Leilão" para "Leilão de Antiguidades Raras"
        And Eu altero o status para "ABERTO_PARA_LANCES"
        And Eu clico no botão "Salvar Alterações"
        Then Eu devo ver uma mensagem de sucesso "Leilão atualizado com sucesso!"
        And O leilão deve agora se chamar "Leilão de Antiguidades Raras" e ter status "ABERTO_PARA_LANCES".

      Scenario: Tentativa de criação de leilão com categoria inexistente (se nomes são resolvidos)
        Given Estou logado como Administrador
        And Estou na página de criação de leilões "/admin/auctions/new"
        When Eu preencho o campo "Título do Leilão" com "Leilão Fantasma"
        And Eu preencho o campo "Categoria" com "Categoria Que Não Existe"
        And Eu preencho os demais campos obrigatórios
        And Eu clico no botão "Salvar Leilão"
        Then Eu devo ver uma mensagem de erro "Categoria 'Categoria Que Não Existe' não encontrada."
        And O leilão não deve ser criado.

      Scenario: Administrador exclui um leilão
        Given Estou logado como Administrador
        And Existe um leilão com título "Leilão a Ser Excluído" sem lotes associados
        When Eu encontro "Leilão a Ser Excluído" na lista de leilões "/admin/auctions"
        And Eu clico na opção de "Excluir" para este leilão
        And Eu confirmo a exclusão
        Then Eu devo ver uma mensagem de sucesso "Leilão excluído com sucesso!"
        And "Leilão a Ser Excluído" não deve mais aparecer na lista.

      Scenario: Verificação do contador de lotes no card do leilão
        Given Estou logado como Administrador e na página "/admin/auctions"
        And Existe um leilão "Leilão de Exemplo com Lotes" que possui 3 lotes associados
        When Eu visualizo o card ou a linha da tabela para "Leilão de Exemplo com Lotes"
        Then O contador de lotes (ex: `Auction.totalLots` ou similar no `AuctionCard`) deve exibir "3".
    ```
*   **3.3.3. Regras de Negócio e Validações:**
    *   **Campos do Formulário (`AuctionFormData` - schema `auctionFormSchema.ts`):**
        *   `title`: Obrigatório, min 5 caracteres, max 200.
        *   `fullTitle`: Opcional, max 300.
        *   `description`: Opcional, max 5000.
        *   `status`: Obrigatório, deve ser um valor do enum `AuctionStatus` (ex: 'EM_BREVE', 'ABERTO_PARA_LANCES', etc.).
        *   `auctionType`: Opcional, valor do enum `Auction['auctionType']` ('JUDICIAL', 'EXTRAJUDICIAL', 'PARTICULAR').
        *   `category`: Obrigatório (nome da categoria), min 1, max 100. Será resolvido para `categoryId`.
        *   `auctioneer`: Obrigatório (nome do leiloeiro), min 1, max 150. Será resolvido para `auctioneerId`.
        *   `seller`: Opcional (nome do comitente), max 150. Será resolvido para `sellerId`.
        *   `auctionDate`: Obrigatório, data válida.
        *   `endDate`: Opcional, data válida, não pode ser anterior a `auctionDate`.
        *   `city`: Opcional, max 100.
        *   `state`: Opcional, UF (ex: 'SP') ou nome do estado, max 50.
        *   `imageUrl`: Opcional, URL válida ou string vazia. Pode ser integrado com a `MediaItem` para upload.
        *   `documentsUrl`: Opcional, URL válida ou string vazia (para edital, etc.).
        *   `sellingBranch`: Opcional, max 100.
    *   **Estágios do Leilão (`AuctionStage`):**
        *   Um leilão pode ter múltiplos estágios (ex: 1ª Praça, 2ª Praça). Cada estágio (`AuctionStage`) tem `name` e `endDate`.
        *   As datas de término dos estágios devem ser sequenciais e lógicas.
    *   **Resolução de Nomes para IDs:**
        *   Nas actions (`src/app/admin/auctions/actions.ts`), os nomes fornecidos para `category`, `auctioneer`, e `seller` no formulário são usados para buscar os respectivos IDs no banco de dados (via `getLotCategoryByName`, `getAuctioneerByName`, `getSellerByName`).
        *   O objeto `AuctionDbData` persistido armazena os IDs (`categoryId`, `auctioneerId`, `sellerId`).
    *   **Permissões:**
        *   Administradores (`manage_all` ou `auctions:create/update/delete`) podem gerenciar todos os leilões.
        *   Comitentes (`auctions:manage_own`) podem criar/gerenciar seus próprios leilões.
        *   Leiloeiros (`auctions:manage_assigned`) podem gerenciar leilões a eles atribuídos.
    *   **Contador de Lotes (`Auction.totalLots`):** Deve ser atualizado (incrementado/decrementado) quando lotes são adicionados/removidos do leilão.
    *   **Imagem do Leilão (`Auction.imageUrl`):** Pode ser uma URL externa ou integrada com a entidade `MediaItem` para permitir uploads e seleção da biblioteca de mídia da plataforma.
    *   **Documentos do Leilão (`Auction.documentsUrl`):** Link para o edital ou outros documentos relevantes. Pode ser uma URL externa ou, idealmente, integrado com `MediaItem` para upload.
*   **3.3.4. Layout e Páginas Envolvidas:**
    *   **Painel Administrativo:**
        *   `/admin/auctions`: Listagem de todos os leilões em formato de tabela (usando `DataTable` com colunas como Título, Status, Data, Leiloeiro, Comitente, Nº de Lotes, Ações). Inclui filtros e paginação.
        *   `/admin/auctions/new`: Formulário (`AuctionForm`) para criação de novo leilão.
        *   `/admin/auctions/[auctionId]/edit`: Formulário (`AuctionForm`) pré-preenchido para edição de leilão existente. Pode incluir abas ou seções para gerenciamento de lotes associados.
    *   **Criação Assistida por IA (Comitente/Usuário):**
        *   `/auctions/create`: Interface simplificada onde o usuário descreve os itens a serem leiloados, e a IA (`suggest-listing-details`, `predict-opening-value`) auxilia no preenchimento dos detalhes do leilão e dos lotes.
    *   **Componentes Chave:**
        *   `AuctionForm` (em `src/app/admin/auctions/auction-form.tsx`): Componente reutilizável para criar e editar leilões, utilizando `auctionFormSchema` para validação.
        *   `AuctionCard` (em `src/components/auction-card.tsx`): Usado na listagem pública, mas pode haver uma versão ou similar para a lista administrativa.
*   **3.3.5. Considerações sobre TDD:**
    *   **Testes Unitários:**
        *   `auction-form-schema.ts`: Testar todas as validações de campo, obrigatoriedade, formatos, e limites (já implementado em `src/app/admin/auctions/auction-form-schema.test.ts`).
    *   **Testes de Integração (Server Actions):**
        *   `createAuction` (em `src/app/admin/auctions/actions.ts`):
            *   Mockar `getDatabaseAdapter()` e as actions de busca por nome (`getLotCategoryByName`, etc.).
            *   Cenário de sucesso: Verificar se `adapter.createAuction` é chamado com `AuctionDbData` contendo os IDs resolvidos e os dados corretos. Verificar `revalidatePath`.
            *   Cenários de falha: Categoria/Leiloeiro/Comitente não encontrado, falha no `adapter.createAuction`.
        *   `updateAuction`: Similar ao `createAuction`, testar a lógica de atualização e resolução de nomes para IDs.
        *   `deleteAuction`: Mockar `adapter.deleteAuction` e verificar `revalidatePath`.
        *   `getAuction` e `getAuctions`: Mockar os métodos correspondentes do adapter e verificar a transformação/formatação dos dados, se houver.
        *   Actions de IA (em `src/app/auctions/create/actions.ts`): Mockar os fluxos Genkit (`suggestListingDetailsFlow`, `predictOpeningValueFlow`) e testar a lógica de formatação de entrada/saída dessas actions.
    *   **Testes de UI (Componente):**
        *   `AuctionForm`: Usar React Testing Library para testar a renderização do formulário, preenchimento de campos, validações de cliente (exibição de erros), e submissão (mockando a server action).
        *   Página de listagem `/admin/auctions`: Testar renderização da tabela, filtros, paginação.
    *   **Testes End-to-End (E2E):**
        *   Fluxo completo de criação de um leilão por um Administrador.
        *   Fluxo de edição de um leilão.
        *   Fluxo de exclusão de um leilão.
        *   (Se aplicável) Fluxo de criação de leilão por um Comitente via `/auctions/create`.

### 3.4. Gerenciamento de Lotes (CRUD - Visão Admin/Leiloeiro/Comitente)

*   **3.4.1. Descrição Geral:**
    *   Permite a criação, listagem, visualização, edição e exclusão de lotes, que são os itens individuais dentro de um leilão. Administradores têm controle total. Comitentes podem gerenciar lotes de seus próprios leilões (`lots:manage_own`). Leiloeiros podem gerenciar lotes de leilões a eles atribuídos (`auctions:manage_assigned` pode implicar gerenciamento de lotes). A interface de criação/edição de lotes permite detalhar o item, incluindo informações específicas (ex: para veículos), imagens e precificação.
*   **3.4.2. Cenários BDD (Gherkin):**
    ```gherkin
    Feature: Gerenciamento de Lotes
      Como um usuário autorizado (Admin/Comitente/Leiloeiro)
      Eu quero poder gerenciar lotes dentro de um leilão
      Para detalhar os itens a serem leiloados.

      Scenario: Admin adiciona um novo lote a um leilão existente
        Given Estou logado como Administrador
        And Existe um leilão com ID "leilaoExistente123"
        When Eu navego para a página de adição de novo lote para o leilão "leilaoExistente123" (ex: "/admin/lots/new?auctionId=leilaoExistente123")
        And Eu preencho o campo "Título do Lote" com "Notebook Gamer Super Potente"
        And Eu seleciono o leilão "leilaoExistente123" no campo "ID do Leilão" (ou ele já vem preenchido)
        And Eu preencho o campo "Preço (Lance Inicial)" com "3500.00"
        And Eu seleciono o status "EM_BREVE"
        And Eu preencho o campo "Tipo/Categoria do Lote" com "Eletrônicos" (ou seleciono ID da categoria)
        And Eu defino a "Data de Encerramento" do lote para "25/12/2024 18:00"
        And Eu adiciono a URL da imagem principal "https://example.com/notebook.jpg"
        And Eu seleciono imagens da galeria da biblioteca de mídia (IDs: "media1", "media2")
        And Eu clico no botão "Salvar Lote"
        Then Eu devo ver uma mensagem de sucesso "Lote criado com sucesso!"
        And O lote "Notebook Gamer Super Potente" deve estar associado ao leilão "leilaoExistente123".

      Scenario: Usuário autorizado visualiza a lista de lotes de um leilão
        Given Estou logado como Administrador
        And O leilão com ID "leilaoComLotes456" possui 5 lotes cadastrados
        When Eu navego para a página de edição do leilão "leilaoComLotes456" (ex: "/admin/auctions/leilaoComLotes456/edit")
        And Eu acesso a aba/seção de "Lotes"
        Then Eu devo ver uma tabela ou lista com os 5 lotes, exibindo colunas como "Número do Lote", "Título", "Status", "Preço Atual".

      Scenario: Usuário autorizado edita um lote existente
        Given Estou logado como Administrador
        And Existe um lote "Carro Usado" com preço inicial de "15000.00" no leilão "leilaoDeCarros789"
        When Eu navego para a página de edição do lote "Carro Usado"
        And Eu altero o campo "Preço (Lance Inicial)" para "14500.00"
        And Eu altero a descrição para "Carro usado, bom estado, com pequenos reparos a fazer."
        And Eu clico no botão "Salvar Alterações"
        Then Eu devo ver uma mensagem de sucesso "Lote atualizado com sucesso!"
        And O preço inicial do lote "Carro Usado" deve ser "14500.00".

      Scenario: Tentativa de criação de lote com ID de leilão inválido
        Given Estou logado como Administrador
        And Estou na página de criação de novo lote
        When Eu preencho o campo "Título do Lote" com "Lote Teste"
        And Eu preencho o campo "ID do Leilão" com "idDeLeilaoInexistente"
        And Eu preencho os demais campos obrigatórios
        And Eu clico no botão "Salvar Lote"
        Then Eu devo ver uma mensagem de erro "Leilão com ID 'idDeLeilaoInexistente' não encontrado."
        And O lote não deve ser criado.

      Scenario: Administrador exclui um lote de um leilão
        Given Estou logado como Administrador
        And O leilão "leilaoComLotes456" tem um lote chamado "Item Obsoleto"
        When Eu encontro o lote "Item Obsoleto" na lista de lotes do leilão
        And Eu clico na opção de "Excluir" para este lote
        And Eu confirmo a exclusão
        Then Eu devo ver uma mensagem de sucesso "Lote excluído com sucesso!"
        And O lote "Item Obsoleto" não deve mais aparecer na lista de lotes do leilão "leilaoComLotes456".

      Scenario: Contador de lances (`Lot.bidsCount`) é atualizado após um lance
        Given Estou logado como Licitante
        And O lote "Notebook Gamer Super Potente" está "ABERTO_PARA_LANCES" e tem 0 lances (`bidsCount: 0`)
        When Eu realizo um lance válido de "3600.00" no "Notebook Gamer Super Potente"
        Then O contador de lances (`bidsCount`) do lote deve ser atualizado para 1.
    ```
*   **3.4.3. Regras de Negócio e Validações:**
    *   **Campos do Formulário (`LotFormData` - schema `lot-form-schema.ts`):**
        *   `title`: Obrigatório, min 5 caracteres, max 200.
        *   `auctionId`: Obrigatório, ID de um leilão (`Auction`) existente.
        *   `auctionName`: Opcional (usado para exibição, denormalizado).
        *   `description`: Opcional, max 2000.
        *   `price`: Obrigatório (lance inicial/preço atual), número positivo.
        *   `initialPrice`: Opcional, número positivo (pode ser o mesmo que `price` ou valor de 1ª praça).
        *   `status`: Obrigatório, valor do enum `LotStatus` (ex: 'EM_BREVE', 'ABERTO_PARA_LANCES').
        *   `stateId`: Opcional, ID de um estado (`StateInfo`). Será resolvido para `stateUf`.
        *   `cityId`: Opcional, ID de uma cidade (`CityInfo`). Será resolvido para `cityName`.
        *   `type`: Obrigatório (nome da categoria), min 1, max 100. Será resolvido para `categoryId`.
        *   `imageUrl`: Opcional (URL da imagem principal), formato URL ou string vazia.
        *   `galleryImageUrls`: Opcional, array de strings URL válidas.
        *   `mediaItemIds`: Opcional, array de IDs de `MediaItem`.
        *   `endDate`: Obrigatório, data válida (data de encerramento do lote).
        *   `lotSpecificAuctionDate`: Opcional, data válida (data de início específica para o lote, se diferente do leilão).
        *   `secondAuctionDate`: Opcional, data válida (para 2ª praça).
        *   `secondInitialPrice`: Opcional, número positivo (para 2ª praça).
        *   Campos específicos de veículo (ex: `year`, `make`, `model`, `vin`, `odometer`) são opcionais e com suas próprias validações de tipo/formato se aplicável.
    *   **Resolução de IDs:**
        *   Na action `createLot` (e `updateLot`), o `auctionId` fornecido (pode ser publicId) é validado.
        *   `type` (nome da categoria) é resolvido para `categoryId`.
        *   `stateId` e `cityId` (podem ser slugs ou IDs numéricos) são resolvidos para os IDs numéricos e nomes/UFs correspondentes.
    *   **Gerenciamento de Mídia:**
        *   `imageUrl` pode ser uma URL direta ou o resultado da seleção de um `MediaItem` principal.
        *   `galleryImageUrls` pode ser uma lista de URLs ou IDs de `MediaItem` da galeria.
        *   `mediaItemIds` é usado para associar mídias da biblioteca (`MediaItem`) ao lote, geralmente gerenciado através de um componente como `ChooseMediaDialog`.
    *   **Status e Datas:**
        *   `Lot.status` (ex: `EM_BREVE`, `ABERTO_PARA_LANCES`, `ENCERRADO`, `VENDIDO`, `NAO_VENDIDO`) determina a disponibilidade do lote para lances.
        *   `Lot.endDate` é a data/hora final para recebimento de lances no lote.
    *   **Permissões:**
        *   Administradores (`manage_all` ou `lots:create/update/delete`) podem gerenciar todos os lotes.
        *   Comitentes (`lots:manage_own` ou `auctions:manage_own`) podem gerenciar lotes de seus próprios leilões.
        *   Leiloeiros (`auctions:manage_assigned`) podem ter permissão para gerenciar lotes dos leilões que conduzem.
    *   **Contadores:**
        *   `Lot.views`: Contador de visualizações do lote.
        *   `Lot.bidsCount`: Contador de lances recebidos pelo lote.
*   **3.4.4. Layout e Páginas Envolvidas:**
    *   **Painel Administrativo:**
        *   `/admin/lots`: Pode existir uma listagem geral de todos os lotes, com filtros avançados.
        *   `/admin/auctions/[auctionId]/edit`: A página de edição de um leilão geralmente possui uma aba ou seção para listar, adicionar, editar e remover lotes associados a esse leilão.
        *   `/admin/lots/new` (ou `/admin/auctions/[auctionId]/lots/new`): Formulário (`LotForm`) para criação de novo lote, potencialmente com `auctionId` pré-selecionado.
        *   `/admin/lots/[lotId]/edit`: Formulário (`LotForm`) pré-preenchido para edição de lote existente.
    *   **Componentes Chave:**
        *   `LotForm` (em `src/app/admin/lots/lot-form.tsx`): Componente reutilizável para criar e editar lotes, utilizando `lotFormSchema` para validação. Inclui campos para todas as propriedades do lote, incluindo os campos específicos de veículos e a integração com `ChooseMediaDialog` para seleção de imagens da biblioteca.
        *   `ChooseMediaDialog` (em `src/components/admin/media/choose-media-dialog.tsx`): Modal para selecionar ou fazer upload de `MediaItem` a serem associados ao lote (imagem principal, galeria).
*   **3.4.5. Considerações sobre TDD:**
    *   **Testes Unitários:**
        *   `lot-form-schema.ts`: Testar todas as validações de campo (obrigatoriedade, tipos, formatos, limites, números positivos, URLs válidas, etc.) (já implementado em `src/app/admin/lots/lot-form-schema.test.ts`).
    *   **Testes de Integração (Server Actions):**
        *   `createLot` (em `src/app/admin/lots/actions.ts`):
            *   Mockar `getDatabaseAdapter()` e as actions de busca por nome/ID (ex: `getLotCategoryByName`, `getAuction`, `getState`, `getCity`).
            *   Cenário de sucesso: Verificar se `adapter.createLot` é chamado com `LotDbData` contendo os IDs resolvidos e os dados corretos (ex: `mediaItemIds`, `galleryImageUrls` como arrays vazios se não fornecidos). Verificar `revalidatePath`.
            *   Cenários de falha: Categoria não encontrada, Leilão não encontrado, falha no `adapter.createLot`.
        *   `updateLot`: Similar ao `createLot`, testar a lógica de atualização, resolução de IDs, e tratamento de arrays de mídia.
        *   `deleteLot`: Mockar `adapter.deleteLot` e verificar `revalidatePath`.
        *   `getLot`, `getLots`, `getBidsForLot`: Mockar os métodos correspondentes do adapter e verificar a transformação/formatação dos dados.
    *   **Testes de UI (Componente):**
        *   `LotForm`: Usar React Testing Library para testar a renderização do formulário (incluindo campos específicos de veículo), preenchimento, validações de cliente, interação com `ChooseMediaDialog` (mockado), e submissão (mockando a server action).
    *   **Testes End-to-End (E2E):**
        *   Fluxo completo de criação de um lote por um Administrador dentro de um leilão existente.
        *   Fluxo de edição de um lote.
        *   Fluxo de exclusão de um lote.
        *   Verificar a correta exibição dos detalhes do lote na página pública do leilão.

### 3.5. Processo de Lance (Visão do Licitante)

*   **3.5.1. Descrição Geral:**
    *   Esta funcionalidade permite que usuários autenticados e devidamente habilitados (`UserProfileData.habilitationStatus === 'HABILITADO'`) participem ativamente de leilões, submetendo lances para os lotes de seu interesse. O sistema valida cada lance em relação ao preço atual do lote, incrementos mínimos e o status do lote/leilão. O feedback sobre o sucesso ou falha do lance é fornecido ao usuário, e o status do seu lance (ganhando, perdendo, arrematado) é atualizado. A funcionalidade de "Lance Máximo" (Proxy Bidding), se implementada, permite que o sistema cubra lances automaticamente em nome do usuário até um valor pré-definido.
*   **3.5.2. Cenários BDD (Gherkin):**
    ```gherkin
    Feature: Processo de Lance
      Como um Licitante habilitado
      Eu quero poder dar lances em lotes
      Para tentar arrematar os itens de meu interesse.

      Scenario: Licitante habilitado faz um lance bem-sucedido
        Given Estou logado como Licitante "licitante_habilitado@example.com" e estou habilitado
        And Existe um lote "LOTE001" no leilão "LEILAO123" com status "ABERTO_PARA_LANCES" e preço atual de "R$ 100,00"
        And O incremento mínimo para o lote é "R$ 10,00"
        When Eu navego para a página do lote "LOTE001"
        And Eu insiro "110.00" no campo de valor do lance
        And Eu clico no botão "Fazer Lance"
        Then Eu devo ver uma mensagem de sucesso "Lance realizado com sucesso!"
        And O preço atual do lote "LOTE001" deve ser atualizado para "R$ 110,00"
        And Meu status de lance para "LOTE001" deve ser "GANHANDO".

      Scenario: Tentativa de lance com valor inferior ao lance atual + incremento
        Given Estou logado como Licitante "licitante_habilitado@example.com" e estou habilitado
        And Existe um lote "LOTE002" com status "ABERTO_PARA_LANCES" e preço atual de "R$ 200,00"
        And O incremento mínimo para o lote é "R$ 20,00"
        When Eu navego para a página do lote "LOTE002"
        And Eu insiro "210.00" no campo de valor do lance
        And Eu clico no botão "Fazer Lance"
        Then Eu devo ver uma mensagem de erro "O valor do lance deve ser maior ou igual a R$ 220,00."
        And O preço atual do lote "LOTE002" deve permanecer "R$ 200,00".

      Scenario: Tentativa de lance em lote com status não 'ABERTO_PARA_LANCES'
        Given Estou logado como Licitante "licitante_habilitado@example.com" e estou habilitado
        And Existe um lote "LOTE003" com status "EM_BREVE"
        When Eu navego para a página do lote "LOTE003"
        Then O painel de lances deve estar desabilitado ou indicar que o lote não está aberto para lances.
        Or When Eu tento submeter um lance (se a UI permitir por engano)
        Then Eu devo ver uma mensagem de erro "Este lote não está aberto para lances."

      Scenario: Tentativa de lance por usuário não habilitado
        Given Estou logado como Usuário "usuario_nao_habilitado@example.com" cujo `habilitationStatus` é "PENDENTE_DOCUMENTOS"
        And Existe um lote "LOTE004" com status "ABERTO_PARA_LANCES"
        When Eu navego para a página do lote "LOTE004"
        Then O painel de lances deve estar desabilitado
        And Eu devo ver uma mensagem indicando que preciso completar minha habilitação para dar lances.

      Scenario: Comportamento do Lance Máximo (Proxy Bidding) - Usuário A cobre lance de Usuário B
        Given Estou logado como Licitante "usuario_A@example.com" e estou habilitado
        And O lote "LOTEPROXY01" está "ABERTO_PARA_LANCES" com preço atual de "R$ 500,00" e incremento de "R$ 50,00"
        And Eu registrei um Lance Máximo de "R$ 1000,00" para o "LOTEPROXY01"
        When Outro Licitante "usuario_B@example.com" faz um lance de "R$ 600,00" no "LOTEPROXY01"
        Then O sistema deve automaticamente cobrir o lance de "usuario_B@example.com" em meu nome
        And O preço atual do lote "LOTEPROXY01" deve ser "R$ 650,00" (lance de B + incremento)
        And Meu status de lance para "LOTEPROXY01" deve ser "GANHANDO".

      Scenario: Visualização do histórico de lances de um lote
        Given Estou na página do lote "LOTEHIST01" que está "ABERTO_PARA_LANCES"
        And Foram feitos os seguintes lances: "Licitante Z" - R$ 100, "Licitante Y" - R$ 110, "Licitante X" - R$ 120
        When Eu olho a seção de "Histórico de Lances"
        Then Eu devo ver uma lista dos lances em ordem cronológica decrescente (ou crescente)
        And Cada entrada no histórico deve mostrar o nome (ou identificador) do licitante e o valor do lance.

      Scenario: Validação de contadores `Lot.price` e `Lot.bidsCount`
        Given O lote "LOTE001" está "ABERTO_PARA_LANCES", preço atual "R$ 110,00", `bidsCount` é 1
        When Eu, como "novo_licitante@example.com", faço um lance de "R$ 120,00" no "LOTE001"
        Then O `Lot.price` para "LOTE001" deve ser atualizado para "120.00" no banco de dados
        And O `Lot.bidsCount` para "LOTE001" deve ser atualizado para 2 no banco de dados.
    ```
*   **3.5.3. Regras de Negócio e Validações:**
    *   **Pré-condições para Licitante:**
        *   Usuário deve estar autenticado.
        *   Usuário deve estar habilitado (`UserProfileData.habilitationStatus === 'HABILITADO'`). (Esta verificação deve ocorrer no backend via Server Action `placeBidOnLot`).
        *   Possuir a permissão `place_bids` (geralmente associada ao status `HABILITADO`).
    *   **Condições do Lote/Leilão:**
        *   Leilão (`Auction.status`) deve ser 'ABERTO_PARA_LANCES' ou 'ABERTO'.
        *   Lote (`Lot.status`) deve ser 'ABERTO_PARA_LANCES'.
        *   A data/hora atual deve ser anterior à `Lot.endDate` (e `AuctionStage.endDate` / `Auction.endDate` se aplicável).
    *   **Validação do Valor do Lance:**
        *   O valor do lance (`bidAmount`) deve ser numérico e positivo.
        *   O `bidAmount` deve ser maior que o `Lot.price` atual.
        *   **Incremento Mínimo:** O `bidAmount` deve ser igual ou superior ao `Lot.price` + `incrementoMinimo`.
            *   A regra de incremento mínimo não está explicitamente definida como um campo em `Lot` ou `Auction` no `BUSINESS_RULES.md`. O `BiddingPanel.tsx` calcula o "próximo lance" como `currentPrice + (currentPrice * 0.05)` ou `currentPrice + 1`, sugerindo um incremento de 5% ou um valor mínimo absoluto. Esta regra precisa ser formalizada e consistentemente aplicada no backend.
            *   Idealmente, o incremento mínimo deveria ser configurável (ex: por categoria, por faixa de valor, ou por leilão/lote).
    *   **Processamento do Lance (Server Action `placeBidOnLot`):**
        *   Cria um novo registro `BidInfo` com `lotId`, `auctionId`, `bidderId`, `bidderDisplay`, `amount`, e `timestamp`.
        *   Atualiza o `Lot` correspondente:
            *   `Lot.price` é atualizado para o `bidAmount`.
            *   `Lot.bidsCount` é incrementado.
            *   `Lot.updatedAt` é atualizado.
    *   **Atualização de Status do Usuário (`UserBidStatus`):**
        *   O licitante que fez o lance passa a ter `UserBidStatus: 'GANHANDO'` para aquele lote.
        *   Outros licitantes para o mesmo lote que estavam 'GANHANDO' ou tinham lances inferiores devem ter seu `UserBidStatus` atualizado para 'PERDENDO' ou 'SUPERADO'. (Esta lógica de atualização para outros usuários não está explícita na action `placeBidOnLot` e pode ser gerenciada por triggers no DB ou um processo assíncrono).
    *   **Lance Máximo (Proxy Bidding):**
        *   A UI (`BiddingPanel`) sugere a funcionalidade ("Lance Máximo").
        *   Se implementado, o usuário define um valor máximo confidencial. O sistema automaticamente dá lances em nome do usuário, usando o incremento mínimo necessário para superar outros lances, até o limite máximo do usuário.
        *   Regras de desempate (ex: quem definiu o lance máximo primeiro) são necessárias.
        *   O backend para esta funcionalidade não foi detalhado nas análises anteriores.
*   **3.5.4. Layout e Páginas Envolvidas:**
    *   **Página de Detalhes do Lote:** `/auctions/[auctionId]/lots/[lotId]`
        *   Exibe todas as informações do lote (`Lot.title`, `Lot.description`, `Lot.imageUrl`, `Lot.price` atual, `Lot.endDate`, etc.).
        *   Contém o `BiddingPanel`.
    *   **Auditório Virtual/Página de Leilão ao Vivo:** `/auctions/[auctionId]/live`
        *   Pode exibir o `CurrentLotDisplay` com o `BiddingPanel` para o lote atualmente em pregão.
    *   **Componente `BiddingPanel` (em `src/components/auction/bidding-panel.tsx`):**
        *   **Elementos de UI Chave:**
            *   Campo de entrada para o valor do lance (ex: `input[name="bidAmount"]`).
            *   Sugestões de valores de lance (botões de incremento rápido).
            *   Campo para "Lance Máximo" (se a funcionalidade estiver ativa).
            *   Botão de submissão (ex: "Fazer Lance").
            *   Exibição do "Próximo lance mínimo sugerido".
            *   Feedback visual durante e após a submissão do lance (ex: toasts, mensagens de status).
    *   **Histórico de Lances:**
        *   Geralmente exibido na página de detalhes do lote.
        *   Lista os lances anteriores, mostrando identificador do licitante (pode ser anonimizado, ex: "Licitante A***B") e o valor/data do lance.
*   **3.5.5. Considerações sobre TDD:**
    *   **Testes Unitários:**
        *   Validações de frontend no `BiddingPanel` (ex: se o valor do lance é numérico, se excede o lance mínimo visível).
        *   Funções utilitárias para cálculo de incremento mínimo.
        *   (Se Proxy Bidding) Lógica de cálculo de lances automáticos.
    *   **Testes de Integração (Server Action):**
        *   Testar a action `placeBidOnLot` (arquivo `src/app/admin/lots/actions.test.ts` já iniciado):
            *   Mockar `getDatabaseAdapter()`.
            *   Cenário 1: Lance bem-sucedido -> `adapter.placeBidOnLot` é chamado com os dados corretos, retorna sucesso, e a action repassa.
            *   Cenário 2: Lote não encontrado -> `adapter.placeBidOnLot` (ou uma verificação anterior) falha, action retorna falha.
            *   Cenário 3: Lance abaixo do permitido -> `adapter.placeBidOnLot` falha, action retorna falha.
            *   Cenário 4: Usuário não habilitado (a action `placeBidOnLot` em si não parece verificar isso, mas o adapter ou uma camada superior deveria; se a verificação for na action, testar).
            *   Cenário 5: Lote não está aberto para lances (verificação de status).
    *   **Testes de UI (Componente):**
        *   `BiddingPanel`: Usar React Testing Library para testar a renderização, entrada de valores, habilitação/desabilitação de botões, exibição de mensagens de erro do frontend, e interação com a server action mockada.
        *   Testar a atualização visual do preço atual e do histórico de lances após um novo lance (pode requerer mock de WebSocket ou polling se os dados forem em tempo real).
    *   **Testes End-to-End (E2E):**
        *   O teste `e2e/bidding.spec.ts` já simula um lance. Expandir para:
            *   Verificar a atualização do preço do lote na UI após o lance.
            *   Testar o fluxo de proxy bidding (se implementado).
            *   Testar o comportamento quando um lance é superado por outro usuário (requer setup com múltiplos usuários virtuais).
            *   Testar lances em diferentes status de lote/leilão.

### ... (Platzhalter für weitere Funktionen)

*   [Exemplos: Vendas Diretas, Dashboard do Usuário, Busca e Filtros, Auditório Virtual (Live Bidding), etc.]

### 3.6. Habilitação de Usuários e Gerenciamento de Documentos

*   **3.6.1. Descrição Geral:**
    *   A habilitação de usuários é um processo crucial para permitir que participem de leilões (especialmente para dar lances). Envolve a submissão de documentos comprobatórios que são então analisados pela equipe administrativa da plataforma. Este processo visa garantir a legitimidade dos participantes, aumentar a segurança das transações e cumprir requisitos legais ou específicos de determinados tipos de leilão. O status de habilitação de um usuário (`UserProfileData.habilitationStatus`) é dinâmico e reflete o progresso e o resultado dessa análise.
*   **3.6.2. Personas Envolvidas:**
    *   **Usuário (Licitante/Comitente):** Pessoa que deseja se habilitar para participar plenamente da plataforma, submetendo seus documentos.
    *   **Administrador/Analista de Leilão:** Responsável por definir os tipos de documentos necessários, revisar os documentos enviados pelos usuários, e aprovar ou rejeitar a habilitação.
*   **3.6.3. Cenários BDD (Gherkin):**
    ```gherkin
    Feature: Habilitação de Usuários e Gerenciamento de Documentos

      Scenario: Usuário visualiza documentos pendentes em seu dashboard
        Given Estou logado como "usuario_novo@example.com"
        And Meu status de habilitação é "PENDENTE_DOCUMENTOS"
        When Eu navego para a página "/dashboard/documents"
        Then Eu devo ver uma lista de tipos de documentos requeridos (ex: "RG/CNH Frente", "Comprovante de Residência")
        And Para cada documento requerido, devo ver o status "NÃO ENVIADO" ou "PENDENTE".

      Scenario: Usuário faz upload de um documento obrigatório com sucesso
        Given Estou na página "/dashboard/documents"
        And O documento "RG/CNH Frente" é obrigatório e está com status "NÃO ENVIADO"
        When Eu seleciono um arquivo de imagem "rg_frente.jpg" para o tipo de documento "RG/CNH Frente"
        And Eu clico no botão "Enviar Documento"
        Then Eu devo ver uma mensagem de sucesso "Documento enviado para análise."
        And O status do documento "RG/CNH Frente" deve mudar para "EM ANÁLISE" (ou "PENDENTE_ANALYSIS").
        And O arquivo "rg_frente.jpg" deve estar associado ao documento enviado.

      Scenario: Usuário envia todos os documentos obrigatórios
        Given Estou logado como "usuario_com_docs@example.com"
        And Enviei todos os documentos marcados como obrigatórios
        When O sistema processa o envio do último documento obrigatório
        Then Meu status geral de habilitação (`UserProfileData.habilitationStatus`) deve mudar para "PENDING_ANALYSIS".

      Scenario: Admin visualiza lista de usuários com documentos pendentes de análise
        Given Estou logado como Administrador
        And Existem usuários com status de habilitação "PENDING_ANALYSIS"
        When Eu navego para a área administrativa de "Gerenciamento de Habilitações" (ou similar)
        Then Eu devo ver uma lista de usuários cujo `habilitationStatus` é "PENDING_ANALYSIS"
        And Para cada usuário, devo poder acessar seus documentos enviados.

      Scenario: Admin aprova um documento individual de um usuário
        Given Estou logado como Administrador e visualizando os documentos do usuário "doc_pendente@example.com"
        And O documento "Comprovante de Residência" com status "PENDING_ANALYSIS" é válido
        When Eu clico no botão "Aprovar" para o "Comprovante de Residência"
        Then O status do "Comprovante de Residência" para "doc_pendente@example.com" deve mudar para "APPROVED".
        And Uma notificação (opcional) pode ser enviada ao usuário.

      Scenario: Admin rejeita um documento individual de um usuário com motivo
        Given Estou logado como Administrador e visualizando os documentos do usuário "doc_rejeitar@example.com"
        And O documento "RG/CNH Frente" com status "PENDING_ANALYSIS" está ilegível
        When Eu clico no botão "Rejeitar" para o "RG/CNH Frente"
        And Eu preencho o campo "Motivo da Rejeição" com "Imagem do documento está ilegível ou cortada."
        And Eu confirmo a rejeição
        Then O status do "RG/CNH Frente" para "doc_rejeitar@example.com" deve mudar para "REJECTED".
        And O motivo da rejeição deve ser salvo e visível para o usuário.

      Scenario: Admin aprova todos os documentos obrigatórios e usuário se torna habilitado
        Given Estou logado como Administrador
        And O usuário "quase_habilitado@example.com" tem todos os documentos obrigatórios com status "APPROVED"
        When O último documento obrigatório do usuário "quase_habilitado@example.com" é aprovado
        Then O `UserProfileData.habilitationStatus` do usuário "quase_habilitado@example.com" deve mudar para "HABILITADO".
        And O usuário "quase_habilitado@example.com" deve receber a permissão "place_bids".

      Scenario: Admin rejeita um documento obrigatório crucial e status de habilitação muda
        Given Estou logado como Administrador
        And O usuário "doc_problema@example.com" está com `habilitationStatus` "PENDING_ANALYSIS"
        When Eu rejeito o documento obrigatório "CPF" do usuário "doc_problema@example.com"
        Then O `UserProfileData.habilitationStatus` do usuário "doc_problema@example.com" deve mudar para "REJECTED_DOCUMENTS".

      Scenario: Usuário visualiza status atualizado de seus documentos e habilitação
        Given Estou logado como "doc_rejeitar@example.com"
        And Meu documento "RG/CNH Frente" foi rejeitado com o motivo "Imagem ilegível"
        And Meu `habilitationStatus` é "REJECTED_DOCUMENTS"
        When Eu navego para a página "/dashboard/documents"
        Then Eu devo ver que o status do "RG/CNH Frente" é "REJECTED"
        And Eu devo ver o motivo "Imagem ilegível"
        And Eu devo ver meu status geral de habilitação como "Documentos Rejeitados".
        And Eu devo ter a opção de reenviar o documento "RG/CNH Frente".
    ```
*   **3.6.4. Regras de Negócio e Validações:**
    *   **Tipos de Documento (`DocumentType`):**
        *   `isRequired` (boolean): Indica se o documento é mandatório para o processo de habilitação.
        *   `allowedFormats` (string[]): Lista de extensões de arquivo permitidas (ex: 'pdf', 'jpg', 'png'). A validação deve ocorrer no frontend e no backend.
        *   Limites de tamanho de arquivo: Definidos pela UI de upload e impostos pelo backend (na action de upload de `MediaItem`).
    *   **Documento do Usuário (`UserDocument`):**
        *   `status` (`UserDocumentStatus`): Controla o ciclo de vida do documento:
            *   `NOT_SENT`: Estado inicial.
            *   `SUBMITTED`: Usuário enviou o arquivo, aguardando processamento inicial (ex: upload para storage). Este status pode ser breve.
            *   `PENDING_ANALYSIS`: Arquivo carregado, aguardando revisão do administrador/analista.
            *   `APPROVED`: Documento revisado e aprovado.
            *   `REJECTED`: Documento revisado e rejeitado. `rejectionReason` deve ser preenchido.
        *   `fileUrl`: Armazena a URL do arquivo após o upload (geralmente um `MediaItem`).
        *   `analysisDate`, `analystId`: Registram quem e quando analisou o documento.
    *   **Status de Habilitação do Usuário (`UserProfileData.habilitationStatus`):**
        *   `PENDING_DOCUMENTS`: Estado inicial após o registro ou se algum documento obrigatório foi rejeitado e precisa de reenvio.
        *   `PENDING_ANALYSIS`: Todos os `UserDocument` onde `DocumentType.isRequired === true` foram enviados (status `SUBMITTED` ou `PENDING_ANALYSIS`).
        *   `HABILITADO`: Todos os `UserDocument` onde `DocumentType.isRequired === true` estão com status `APPROVED`. O usuário ganha a permissão `place_bids`.
        *   `REJECTED_DOCUMENTS`: Pelo menos um `UserDocument` obrigatório está com status `REJECTED`.
        *   `BLOCKED`: Status administrativo, impede participação.
    *   **Permissões:**
        *   Administradores/Analistas precisam de permissões para visualizar documentos de usuários e alterar o status de `UserDocument` e `UserProfileData.habilitationStatus` (ex: `users:manage_habilitation`, `documents:review`).
    *   **Notificações (Desejável):**
        *   Usuário deve ser notificado sobre:
            *   Sucesso/falha no upload de documentos.
            *   Aprovação ou rejeição de documentos (incluindo motivo).
            *   Mudança em seu `habilitationStatus` geral.
*   **3.6.5. Layout e Páginas Envolvidas:**
    *   **Dashboard do Usuário - Meus Documentos (`/dashboard/documents`):**
        *   Componente: `UserDocumentsPage` (em `src/app/dashboard/documents/page.tsx`).
        *   Lista os `DocumentType`s definidos.
        *   Para cada tipo de documento, exibe o status atual do `UserDocument` correspondente (`NOT_SENT`, `PENDING_ANALYSIS`, `APPROVED`, `REJECTED`).
        *   Se `REJECTED`, exibe o `rejectionReason`.
        *   Permite o upload de arquivos para documentos `NOT_SENT` ou `REJECTED`.
        *   Exibe o status geral de habilitação do usuário (`UserProfileData.habilitationStatus`).
        *   Pode incluir informações sobre formatos de arquivo aceitos e limites de tamanho.
    *   **Painel Administrativo - Gerenciamento de Habilitações/Documentos (Interface Necessária - Inferida):**
        *   **Listagem de Usuários/Solicitações:** Uma tabela ou lista de usuários com `habilitationStatus` igual a `PENDING_ANALYSIS` ou `REJECTED_DOCUMENTS`.
            *   Colunas: Nome do Usuário, Email, Tipo de Conta, Data da Submissão/Última Atualização, Status Atual.
            *   Filtros por status.
        *   **Visão Detalhada do Usuário para Análise:** Ao selecionar um usuário da lista:
            *   Exibição dos dados do perfil do usuário.
            *   Lista de todos os `UserDocument`s submetidos pelo usuário.
            *   Para cada documento: Nome do Tipo de Documento, link para visualização/download do `fileUrl`, status atual.
            *   Opções para o Admin/Analista:
                *   "Aprovar" documento: Muda `UserDocument.status` para `APPROVED`.
                *   "Rejeitar" documento: Abre um campo para `rejectionReason` e muda `UserDocument.status` para `REJECTED`.
            *   (Opcional) Botão para definir manualmente o `habilitationStatus` geral do usuário, com campo para justificativa.
    *   **Componentes de UI Reutilizáveis:**
        *   Upload de arquivo com barra de progresso e validação de tipo/tamanho.
        *   Exibição de status com cores/ícones (ex: `Badge` com cores diferentes para `APPROVED`, `REJECTED`, etc.).
*   **3.6.6. Considerações sobre TDD:**
    *   **Testes Unitários:**
        *   Funções utilitárias para determinar o `habilitationStatus` geral com base nos status dos `UserDocument`s individuais.
        *   Validações de frontend para o formulário de upload (tipo de arquivo, tamanho).
    *   **Testes de Integração (Server Actions):**
        *   Action de Upload de Documento (associada à criação de `UserDocument` e `MediaItem`):
            *   Mockar o upload real para o storage.
            *   Verificar se o `UserDocument` é criado/atualizado corretamente com o `fileUrl` e o status (`SUBMITTED` ou `PENDING_ANALYSIS`).
            *   Verificar a atualização do `UserProfileData.habilitationStatus` se todos os documentos obrigatórios foram enviados.
        *   Actions de Aprovação/Rejeição de Documentos (a serem criadas para o Admin):
            *   Mockar `getDatabaseAdapter()`.
            *   Verificar se `UserDocument.status`, `UserDocument.analysisDate`, `UserDocument.analystId`, `UserDocument.rejectionReason` são atualizados corretamente.
            *   Verificar se `UserProfileData.habilitationStatus` é atualizado corretamente com base na aprovação/rejeição de documentos obrigatórios.
            *   Testar a lógica de permissão (somente usuários autorizados podem aprovar/rejeitar).
    *   **Testes de UI (Componente):**
        *   `UserDocumentsPage`: Testar a listagem de tipos de documento, exibição de status, funcionalidade de upload (mockando a action de upload), e exibição de mensagens de erro/sucesso.
        *   (Hipotético) Componentes da interface administrativa para análise de documentos: Testar a listagem de solicitações, visualização de documentos, e interação com botões de aprovar/rejeitar.
    *   **Testes End-to-End (E2E):**
        *   Fluxo completo:
            1.  Usuário se registra e tem `habilitationStatus: PENDING_DOCUMENTS`.
            2.  Usuário faz login, vai para `/dashboard/documents`, envia todos os documentos obrigatórios.
            3.  `habilitationStatus` muda para `PENDING_ANALYSIS`.
            4.  Admin faz login, encontra o usuário, revisa e aprova os documentos.
            5.  `habilitationStatus` do usuário muda para `HABILITADO`.
            6.  Usuário agora pode realizar ações que exigem habilitação (ex: dar um lance).
        *   Cenário de rejeição de documento e reenvio pelo usuário.

## 4. Dicionário de Dados Global

*   [Nota: Este documento pode referenciar extensivamente o `BUSINESS_RULES.md` que já contém dicionários de dados detalhados para cada entidade (`Auction`, `Lot`, `UserProfileData`, `Role`, `BidInfo`, `UserDocument`, `DocumentType`, `MediaItem`, `SellerProfileInfo`, `AuctioneerProfileInfo`, `DirectSaleOffer`, etc.).]
*   [Opcionalmente, resumir aqui as entidades mais críticas ou adicionar links para as seções relevantes do `BUSINESS_RULES.md`.]
*   [Exemplo:
    *   **Entidade `Auction`:** Veja `BUSINESS_RULES.md#Entidade-Principal-Auction`
    *   **Entidade `Lot`:** Veja `BUSINESS_RULES.md#Entidade-Principal-Lot`
    *   ...]

## 5. Arquitetura Geral da Interface (Layouts Globais e Navegação)

*   **5.1. Layout Principal (App):**
    *   [Descrição do layout base: Header, Footer, Navegação principal, área de conteúdo.]
    *   [Wireframe/Mockup geral.]
*   **5.2. Layout do Painel Administrativo:**
    *   [Descrição: Sidebar de navegação administrativa, Header específico do admin, área de conteúdo.]
    *   [Wireframe/Mockup.]
*   **5.3. Layout do Dashboard do Usuário (Licitante/Comitente):**
    *   [Descrição: Navegação específica do dashboard, seções comuns.]
    *   [Wireframe/Mockup.]
*   **5.4. Navegação Principal:**
    *   [Estrutura do menu principal para visitantes e usuários logados.]
*   **5.5. Componentes Reutilizáveis Chave:**
    *   [Listar e descrever brevemente componentes UI globais (ex: Cards de Leilão/Lote, Tabelas de Dados, Modais, Botões Padrão, etc.). Referenciar biblioteca de componentes se existir.]

## 6. Considerações Gerais sobre TDD na Plataforma

*   **6.1. Testes Unitários:**
    *   [Foco: Funções utilitárias, schemas de validação (Zod), lógica de componentes React isolados (hooks customizados, etc.).]
    *   [Ferramentas: Jest, React Testing Library.]
*   **6.2. Testes de Integração (Server Actions):**
    *   [Foco: Testar server actions mockando o mínimo de dependências externas (ex: DB Adapters, Firebase Auth SDK).]
    *   [Garantir que a lógica da action (validações, chamadas a serviços, formatação de dados) funcione como esperado.]
    *   [Ferramentas: Jest, com mocks para serviços externos.]
*   **6.3. Testes End-to-End (E2E):**
    *   [Foco: Simular fluxos de usuário completos através da interface gráfica.]
    *   [Validar a integração entre frontend, server actions, e (potencialmente) um ambiente de teste com banco de dados semeado.]
    *   [Ferramentas: Playwright.]
*   **6.4. Cobertura de Teste:**
    *   [Metas de cobertura (ex: 80% para unitários em lógica crítica).]
    *   [Estratégia para monitoramento e manutenção da cobertura.]
*   **6.5. Ambiente de Teste:**
    *   [Considerações sobre banco de dados de teste, dados de semente (seeding), e reset de ambiente para E2E.]

---
Este esqueleto servirá como base para o detalhamento das especificações.
