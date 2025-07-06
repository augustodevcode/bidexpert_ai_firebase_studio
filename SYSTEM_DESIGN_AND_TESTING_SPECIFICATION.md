# Documento de Especificação de Design e Testes do Sistema de Leilões

## 1. Introdução

*   **Objetivo do Documento:** Descrever as especificações funcionais, de design de interface (alto nível), e a estratégia de testes (BDD/TDD) para a plataforma de leilões. Este documento visa servir como referência central para as equipes de desenvolvimento, QA, produto e design.
*   **Escopo:** Detalhar as principais funcionalidades da plataforma, incluindo autenticação, gerenciamento de leilões e lotes, processo de lances, perfis de usuário, painéis administrativos e de usuário, e funcionalidades de busca. Serão cobertas regras de negócio, layouts de página (conceitual), e abordagens de teste para cada funcionalidade.
*   **Público Alvo:** Desenvolvedores, Engenheiros de QA, Product Owners, UI/UX Designers e outros stakeholders envolvidos no ciclo de vida do projeto.

## 2. Perfis de Usuário (Personas)

*   [Esta seção deve descrever cada persona principal do sistema, suas necessidades, objetivos e como interagem com a plataforma. Incluir detalhes demográficos, técnicos e comportamentais relevantes. Exemplos de personas incluem: Administrador da Plataforma, Licitante (Comprador PF/PJ), Comitente (Vendedor PF/PJ), Leiloeiro, Visitante Não Autenticado.]
    *   **2.1. Administrador da Plataforma**
        *   [Descrição detalhada: Responsabilidades, nível de conhecimento técnico, principais tarefas (ex: gerenciar usuários, configurar leilões, monitorar sistema), objetivos (ex: garantir integridade da plataforma, auxiliar usuários), frustrações (ex: processos manuais demorados).]
    *   **2.2. Licitante (Comprador)**
        *   [Descrição detalhada: Pode ser Pessoa Física ou Jurídica. Motivações (ex: encontrar bons negócios, itens raros), tarefas (ex: buscar lotes, dar lances, acompanhar leilões, pagar arremates), nível de familiaridade com leilões online, dispositivos usados.]
    *   **2.3. Comitente (Vendedor)**
        *   [Descrição detalhada: Pode ser Pessoa Física ou Jurídica. Motivações (ex: vender itens rapidamente, alcançar bom preço), tarefas (ex: cadastrar itens/lotes, acompanhar vendas, receber pagamentos), necessidades (ex: interface fácil para cadastro, relatórios de vendas).]
    *   **2.4. Leiloeiro**
        *   [Descrição detalhada: Profissional responsável pela condução dos leilões. Tarefas (ex: gerenciar leilões atribuídos, aprovar lances, conduzir pregão), necessidades (ex: ferramentas eficientes para gerenciamento do leilão em tempo real, comunicação com comitentes e licitantes).]
    *   **2.5. Visitante Não Autenticado**
        *   [Descrição detalhada: Usuário que navega na plataforma sem login. Objetivos (ex: explorar leilões, conhecer a plataforma), limitações (ex: não pode dar lances ou acessar áreas restritas).]

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

*   [Esta seção pode ser usada para adicionar futuras funcionalidades que ainda não foram detalhadas, como por exemplo: Sistema de Notificações Avançado, Integração com Pagamentos para Depósitos de Caução, Perfis Detalhados de Leiloeiros e Comitentes com Reputação, etc.]

### 3.6. Biblioteca de Mídia (Gerenciamento)

*   **3.6.1. Descrição Geral:**
    *   A Biblioteca de Mídia é um repositório centralizado para todos os arquivos de mídia (imagens como JPG, PNG, WEBP; documentos como PDF) utilizados na plataforma. Ela permite que administradores (ou usuários com permissão) façam upload, visualizem, gerenciem metadados e excluam esses arquivos. A biblioteca facilita a reutilização de mídias em diferentes contextos, como imagens de lotes, logotipos de leiloeiros/comitentes, ou documentos anexos a leilões.
*   **3.6.2. Personas Envolvidas:**
    *   **Administrador da Plataforma:** Acesso total para upload, gerenciamento e exclusão de mídias.
    *   **Analista de Leilão/Conteúdo:** Pode ter permissões para fazer upload e gerenciar mídias relacionadas a leilões e lotes.
    *   **Outros Papéis (Comitente, Leiloeiro - se permitido):** Poderiam ter permissão para fazer upload de mídias específicas para seus perfis ou itens, possivelmente com um fluxo de aprovação.
*   **3.6.3. Cenários BDD (Gherkin):**
    ```gherkin
    Feature: Gerenciamento da Biblioteca de Mídia
      Como um usuário com permissão de gerenciamento de mídia
      Eu quero poder fazer upload, visualizar, editar e excluir arquivos de mídia
      Para popular e manter os ativos visuais e documentais da plataforma.

      Scenario: Upload bem-sucedido de uma nova imagem para a biblioteca
        Given Estou logado como Administrador
        And Estou na página de upload de mídia "/admin/media/upload"
        When Eu seleciono o arquivo de imagem "produto_novo.jpg" (tipo "image/jpeg", tamanho 1MB)
        And Eu preencho o campo "Título" com "Imagem do Produto Novo"
        And Eu preencho o campo "Texto Alternativo" com "Foto de um produto novo em sua embalagem"
        And Eu clico no botão "Fazer Upload"
        Then Eu devo ver uma mensagem de sucesso "Arquivo enviado com sucesso!"
        And O item "Imagem do Produto Novo" deve aparecer na lista de mídias em "/admin/media"
        And Um registro `MediaItem` deve ser criado no banco de dados com as informações e URL do arquivo no storage.

      Scenario: Tentativa de upload de arquivo com tipo não suportado
        Given Estou logado como Administrador
        And Estou na página de upload de mídia "/admin/media/upload"
        When Eu seleciono o arquivo "documento_importante.docx" (tipo "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        Then Eu devo ver uma mensagem de erro "Tipo de arquivo não suportado. Formatos aceitos: JPG, PNG, WEBP, PDF."
        And Nenhum arquivo deve ser enviado.

      Scenario: Tentativa de upload de arquivo com tamanho excedido
        Given Estou logado como Administrador
        And Estou na página de upload de mídia "/admin/media/upload"
        And O limite máximo de tamanho de arquivo é 5MB
        When Eu seleciono o arquivo de imagem "imagem_muito_grande.jpg" (tamanho 10MB)
        Then Eu devo ver uma mensagem de erro "Arquivo excede o limite de tamanho de 5MB."
        And Nenhum arquivo deve ser enviado.

      Scenario: Visualização da lista de mídias na biblioteca
        Given Estou logado como Administrador
        And Existem itens de mídia na biblioteca, incluindo "imagem_lote_carro.png" e "edital_leilao_123.pdf"
        When Eu navego para a página "/admin/media"
        Then Eu devo ver uma galeria ou lista de itens de mídia
        And Eu devo ver uma miniatura para "imagem_lote_carro.png"
        And Eu devo ver um ícone de PDF para "edital_leilao_123.pdf"
        And Cada item deve exibir informações como nome do arquivo, tipo, data de upload e tamanho.

      Scenario: Administrador edita metadados de um item de mídia
        Given Estou logado como Administrador
        And Existe um item de mídia "imagem_antiga.jpg" com título "Foto Antiga"
        When Eu seleciono "imagem_antiga.jpg" na biblioteca e escolho "Editar Metadados"
        And Eu altero o campo "Título" para "Imagem Detalhada do Vaso Antigo"
        And Eu preencho o campo "Descrição" com "Vaso de cerâmica do século XVIII, com detalhes em ouro."
        And Eu clico no botão "Salvar Metadados"
        Then Eu devo ver uma mensagem de sucesso "Metadados atualizados."
        And O título do item de mídia deve ser "Imagem Detalhada do Vaso Antigo".

      Scenario: Administrador exclui um item de mídia
        Given Estou logado como Administrador
        And Existe um item de mídia "imagem_para_excluir.png" na biblioteca e no storage
        When Eu seleciono "imagem_para_excluir.png" e clico em "Excluir"
        And Eu confirmo a exclusão
        Then Eu devo ver uma mensagem de sucesso "Item de mídia excluído com sucesso."
        And "imagem_para_excluir.png" não deve mais aparecer na lista de mídias
        And O arquivo correspondente deve ser removido do Firebase Storage.

      Scenario: Usuário seleciona uma imagem da biblioteca para um lote
        Given Estou logado como Administrador e editando o lote "LOTEABC"
        When Eu clico no botão "Escolher Imagem Principal" (que abre o `ChooseMediaDialog`)
        And Eu seleciono a imagem "imagem_do_lote.jpg" na aba "Biblioteca" do diálogo
        And Eu clico em "Confirmar Seleção"
        Then O campo "URL da Imagem Principal" do formulário do lote deve ser preenchido com a URL de "imagem_do_lote.jpg"
        And O ID de "imagem_do_lote.jpg" deve ser adicionado a `Lot.mediaItemIds` (ou campo similar).
    ```
*   **3.6.4. Regras de Negócio e Validações:**
    *   **Upload de Arquivos (`handleImageUpload` action):**
        *   Tipos de arquivo permitidos (`MediaItem.mimeType`): `image/png`, `image/jpeg`, `image/webp`, `application/pdf`. A validação deve ocorrer no frontend (componente de upload) e ser reforçada no backend.
        *   Limite de tamanho de arquivo: Ex: 5MB. Validação no frontend e backend.
        *   Nomenclatura no Storage: Arquivos são renomeados para `uuidv4() + extname(originalFilename)` para garantir unicidade e evitar conflitos (lógica em `handleImageUpload`).
        *   Armazenamento: Arquivos são enviados para o Firebase Storage no bucket configurado (caminho `galleryImageBasePath` de `PlatformSettings` pode ser relevante para a organização).
        *   Criação de Registro `MediaItem`: Após upload bem-sucedido para o storage, um documento `MediaItem` é criado no banco de dados com metadados (nome original, novo nome no storage, URL pública, tipo MIME, tamanho, data de upload, `uploadedBy`, etc.).
    *   **Metadados (`MediaItem`):**
        *   Campos editáveis: `title`, `altText`, `caption`, `description`.
        *   Action `updateMediaItemMetadata` atualiza esses campos e `updatedAt`.
    *   **Exclusão (`deleteMediaItem` action):**
        *   Remove o arquivo do Firebase Storage.
        *   Remove o registro `MediaItem` do banco de dados.
        *   (Consideração: O que acontece se a mídia estiver vinculada a lotes em `linkedLotIds`? A exclusão é impedida, ou os links são removidos, ou os lotes ficam com imagem/documento quebrado? Idealmente, a exclusão seria impedida ou um alerta seria emitido se houver vínculos ativos.)
    *   **Vinculação com Lotes (`linkMediaItemsToLot`, `unlinkMediaItemFromLot` actions):**
        *   `linkedLotIds` (array em `MediaItem`): Armazena os IDs dos lotes que utilizam esta mídia. É principalmente informativo e deve ser mantido sincronizado.
        *   `Lot.mediaItemIds` e `Lot.galleryImageUrls`: Campos no lote que referenciam os `MediaItem.id` ou `MediaItem.urlOriginal` para a imagem principal e galeria.
    *   **Permissões:**
        *   `media:upload`: Permite fazer upload de novos arquivos.
        *   `media:read`: Permite visualizar a biblioteca de mídia.
        *   `media:update`: Permite editar metadados dos itens de mídia.
        *   `media:delete`: Permite excluir itens de mídia.
*   **3.6.5. Layout e Páginas Envolvidas:**
    *   **Página da Biblioteca de Mídia (`/admin/media`):**
        *   Exibição dos itens de mídia em formato de grade ou lista.
        *   Miniaturas para imagens, ícones para PDFs.
        *   Informações exibidas: nome do arquivo, título (se houver), tipo, tamanho, data de upload.
        *   Opções por item: Editar Metadados, Excluir, Visualizar.
        *   Botão/Link para a página de Upload (`/admin/media/upload`).
        *   (Opcional) Funcionalidades de busca por nome/título e filtros por tipo de arquivo.
    *   **Página de Upload de Mídia (`/admin/media/upload`):**
        *   Interface para arrastar e soltar ou selecionar arquivos.
        *   Exibição de prévia para imagens.
        *   Campos para preenchimento de metadados iniciais (título, alt text).
        *   Feedback de progresso do upload.
        *   Exibição de mensagens de erro (tipo/tamanho inválido).
    *   **Componente `ChooseMediaDialog` (em `src/components/admin/media/choose-media-dialog.tsx`):**
        *   Usado em formulários (ex: `LotForm`) para permitir que o usuário selecione uma mídia existente da biblioteca ou faça upload de uma nova.
        *   Abas: "Biblioteca" (para selecionar existentes) e "Fazer Upload" (interface de upload).
        *   Funcionalidade de seleção e confirmação.
    *   **Modal de Edição de Metadados:**
        *   Aberto a partir da página da biblioteca.
        *   Formulário com campos `title`, `altText`, `caption`, `description`.
*   **3.6.6. Considerações sobre TDD:**
    *   **Testes Unitários:**
        *   Funções utilitárias para validação de tipo e tamanho de arquivo no frontend (se houver, antes do envio para a action).
        *   Validação de metadados (ex: comprimento máximo de `dataAiHintLogo` no `sellerFormSchema` e `auctioneerFormSchema`).
    *   **Testes de Integração (Server Actions - `src/app/admin/media/actions.ts`):**
        *   `handleImageUpload`:
            *   Mockar `storageAdmin.bucket().file().save()` e `file.makePublic()`.
            *   Mockar `adapter.createMediaItem()`.
            *   Testar com arquivo válido: verificar se os dados corretos são passados para `createMediaItem` e se a URL pública é retornada.
            *   Testar com tipo de arquivo inválido (simular erro antes do upload ou na validação da action).
            *   Testar com tamanho de arquivo excedido.
        *   `getMediaItems`: Mockar `adapter.getMediaItems()` e verificar se os dados são retornados corretamente.
        *   `updateMediaItemMetadata`: Mockar `adapter.updateMediaItemMetadata()` e verificar se é chamado com os dados corretos.
        *   `deleteMediaItem`: Mockar `adapter.deleteMediaItemFromDb()` e `storageAdmin.bucket().file().delete()`. Verificar se ambos são chamados.
        *   `linkMediaItemsToLot` e `unlinkMediaItemFromLot`: Mockar os métodos correspondentes do adapter e verificar as chamadas.
    *   **Testes de UI (Componente):**
        *   Página `/admin/media/page.tsx`: Testar a renderização da lista/grade de mídias, interação com botões de editar/excluir (mockando as actions).
        *   Página `/admin/media/upload/page.tsx`: Testar a interface de upload, feedback de erro para tipo/tamanho inválido, submissão (mockando a action).
        *   `ChooseMediaDialog`: Testar a navegação entre abas, seleção de mídia, upload de nova mídia, e a chamada da função de callback ao confirmar.
    *   **Testes End-to-End (E2E):**
        *   Fluxo completo: Upload de uma imagem, visualização na biblioteca, edição de seus metadados.
        *   Vincular a imagem a um lote através do `LotForm` e `ChooseMediaDialog`.
        *   Excluir a imagem da biblioteca e verificar se ela não está mais disponível (e se o link no lote foi removido ou tratado).

### 3.7. Habilitação de Usuários e Gerenciamento de Documentos

*   **3.7.1. Descrição Geral:**
    *   A habilitação de usuários é um processo crucial para permitir que participem de leilões (especialmente para dar lances). Envolve a submissão de documentos comprobatórios que são então analisados pela equipe administrativa da plataforma. Este processo visa garantir a legitimidade dos participantes, aumentar a segurança das transações e cumprir requisitos legais ou específicos de determinados tipos de leilão. O status de habilitação de um usuário (`UserProfileData.habilitationStatus`) é dinâmico e reflete o progresso e o resultado dessa análise.
*   **3.7.2. Personas Envolvidas:**
    *   **Usuário (Licitante/Comitente):** Pessoa que deseja se habilitar para participar plenamente da plataforma, submetendo seus documentos.
    *   **Administrador/Analista de Leilão:** Responsável por definir os tipos de documentos necessários, revisar os documentos enviados pelos usuários, e aprovar ou rejeitar a habilitação.
*   **3.7.3. Cenários BDD (Gherkin):**
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
*   **3.7.4. Regras de Negócio e Validações:**
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
*   **3.7.5. Layout e Páginas Envolvidas:**
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
*   **3.7.6. Considerações sobre TDD:**
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

### 3.8. Gestão de Usuários e Papéis (Visão Administrativa)

*   **3.8.1. Descrição Geral:**
    *   Permite que Administradores da plataforma gerenciem todas as contas de usuário e seus respectivos níveis de acesso. Isso inclui visualizar detalhes de usuários, editar informações de perfil (exceto dados sensíveis como senha direta), atribuir papéis (Roles), gerenciar o status de habilitação, e excluir usuários. Adicionalmente, os Administradores podem criar, editar e excluir Papéis (Roles), definindo as permissões associadas a cada um, com exceção de papéis de sistema protegidos.
*   **3.8.2. Personas Envolvidas:**
    *   **Administrador da Plataforma:** Persona principal com plenos poderes sobre o gerenciamento de usuários e papéis.
*   **3.8.3. Cenários BDD (Gherkin):**
    ```gherkin
    Feature: Gestão de Usuários e Papéis (Admin)

      Scenario: Admin visualiza a lista de todos os usuários
        Given Estou logado como Administrador
        And Existem usuários cadastrados no sistema
        When Eu navego para a página "/admin/users"
        Then Eu devo ver uma tabela ou lista com os usuários
        And As colunas devem incluir "Nome Completo", "Email", "Papel", "Status de Habilitação", "Data de Cadastro".
        And Deve haver opções de filtro (ex: por papel, por status de habilitação) e busca (ex: por nome, por email).

      Scenario: Admin visualiza os detalhes de um usuário específico
        Given Estou logado como Administrador
        And Existe um usuário "joana.silva@example.com"
        When Eu clico em "Ver Detalhes" ou no nome do usuário "joana.silva@example.com" na lista
        Then Eu sou direcionado para a página de edição/visualização do usuário (ex: "/admin/users/joana_uid")
        And Eu vejo todos os dados de perfil de "joana.silva@example.com".

      Scenario: Admin edita dados de perfil de um usuário
        Given Estou logado como Administrador na página de edição do usuário "pedro.santos@example.com"
        And O campo "Nome Completo" do usuário é "Pedro Santos"
        When Eu altero o campo "Nome Completo" para "Pedro Santos Almeida"
        And Eu clico no botão "Salvar Alterações"
        Then Eu devo ver uma mensagem de sucesso "Perfil do usuário atualizado."
        And O nome completo do usuário deve ser "Pedro Santos Almeida".

      Scenario: Admin atribui/altera o papel de um usuário
        Given Estou logado como Administrador na página de edição do usuário "ana.costa@example.com"
        And O papel atual de "ana.costa@example.com" é "USER"
        And Existe um papel "LEILOEIRO" no sistema
        When Eu seleciono o papel "LEILOEIRO" na lista de papéis disponíveis para o usuário
        And Eu clico no botão "Atualizar Papel" (ou "Salvar Alterações")
        Then Eu devo ver uma mensagem de sucesso "Papel do usuário atualizado."
        And O papel de "ana.costa@example.com" deve ser "LEILOEIRO"
        And As permissões de "ana.costa@example.com" devem corresponder às do papel "LEILOEIRO".

      Scenario: Admin exclui um usuário
        Given Estou logado como Administrador
        And Existe um usuário "usuario_a_excluir@example.com"
        When Eu encontro "usuario_a_excluir@example.com" na lista de usuários e clico em "Excluir"
        And Eu confirmo a exclusão
        Then Eu devo ver uma mensagem de sucesso "Usuário excluído com sucesso."
        And "usuario_a_excluir@example.com" não deve mais aparecer na lista de usuários.
        And A conta do usuário no Firebase Auth (se FIRESTORE) deve ser deletada.

      Scenario: Admin altera manualmente o UserHabilitationStatus de um usuário
        Given Estou logado como Administrador na página de edição do usuário "usuario_pendente@example.com"
        And O `UserHabilitationStatus` do usuário é "PENDENTE_ANALYSIS"
        When Eu altero o `UserHabilitationStatus` para "HABILITADO" (e possivelmente adiciono uma nota administrativa)
        And Eu clico em "Salvar Status de Habilitação"
        Then Eu devo ver uma mensagem "Status de habilitação atualizado."
        And O `UserHabilitationStatus` do usuário deve ser "HABILITADO".

      Scenario: Admin cria um novo papel com permissões específicas
        Given Estou logado como Administrador
        And Estou na página de criação de papéis "/admin/roles/new"
        When Eu preencho o campo "Nome do Papel" com "Analista Financeiro"
        And Eu preencho o campo "Descrição" com "Acesso a relatórios financeiros e de pagamentos."
        And Eu seleciono as permissões "view_reports", "manage_payments" (permissões hipotéticas)
        And Eu clico no botão "Salvar Papel"
        Then Eu devo ver uma mensagem de sucesso "Papel 'Analista Financeiro' criado com sucesso."
        And O papel "Analista Financeiro" deve aparecer na lista de papéis em "/admin/roles".

      Scenario: Admin edita as permissões de um papel existente (customizado)
        Given Estou logado como Administrador
        And Existe um papel customizado "Suporte Nível 1" com permissão "tickets:view_basic"
        When Eu navego para a página de edição do papel "Suporte Nível 1"
        And Eu adiciono a permissão "tickets:edit_basic"
        And Eu removo a permissão "old_permission_to_remove" (se existir)
        And Eu clico no botão "Salvar Alterações"
        Then Eu devo ver uma mensagem de sucesso "Papel atualizado."
        And O papel "Suporte Nível 1" deve agora ter a permissão "tickets:edit_basic".

      Scenario: Admin não consegue editar nome de papéis de sistema (ADMINISTRATOR, USER)
        Given Estou logado como Administrador
        When Eu tento editar o papel "ADMINISTRATOR"
        Then O campo "Nome do Papel" deve estar desabilitado para edição.
        And Eu posso alterar a descrição e permissões (com cautela).

      Scenario: Admin exclui um papel customizado
        Given Estou logado como Administrador
        And Existe um papel customizado "Papel Obsoleto" que não está sendo usado por nenhum usuário
        When Eu encontro "Papel Obsoleto" na lista de papéis e clico em "Excluir"
        And Eu confirmo a exclusão
        Then Eu devo ver uma mensagem de sucesso "Papel excluído."
        And "Papel Obsoleto" não deve mais aparecer na lista.
    ```
*   **3.8.4. Regras de Negócio e Validações:**
    *   **Gerenciamento de Usuários (`UserProfileData`):**
        *   Campos editáveis por Admin (via `UserForm` ou interface similar): `fullName`, `email` (com ressalvas, pode impactar login no Auth), `cpf`, `cellPhone`, `dateOfBirth`, campos de endereço, `accountType`, `razaoSocial`, `cnpj`, etc. O tipo `EditableUserProfileData` define os campos que o próprio usuário pode editar; o admin pode ter um escopo similar ou maior.
        *   Alteração de senha: Admin não deve poder definir/ver senhas diretamente. Deve haver um fluxo de "reset de senha" que o usuário completa.
        *   `status` da conta (ex: 'ATIVO', 'SUSPENSO'): Admin pode alterar para bloquear/desbloquear acesso.
        *   `habilitationStatus`: Admin pode alterar manualmente (com justificativa) ou é alterado automaticamente pelo fluxo de aprovação de documentos.
    *   **Atribuição de Papéis (`Role`):**
        *   Um usuário possui um `roleId` e `roleName` em seu `UserProfileData`.
        *   Admin pode alterar o `roleId` de um usuário. Isso atualiza o `roleName` e as `permissions` do usuário para refletir o novo papel. (Action `updateUserRole`).
    *   **Exclusão de Usuário (`deleteUser` action):**
        *   Se `ACTIVE_DATABASE_SYSTEM === 'FIRESTORE'`, a exclusão deve remover o usuário do Firebase Authentication (`authAdmin.deleteUser(userId)`).
        *   O perfil `UserProfileData` deve ser removido do banco de dados da aplicação (`adapter.deleteUserProfile(userId)`).
        *   Considerar o que acontece com dados relacionados (leilões, lotes, lances feitos por este usuário). Soft delete ou anonimização podem ser necessários em vez de hard delete, dependendo dos requisitos de integridade de dados.
    *   **Gerenciamento de Papéis (`Role`):**
        *   Criação (`createRole` action): Nome do papel deve ser único (verificação por `name_normalized`). Permissões são selecionadas de uma lista predefinida (`predefinedPermissions`).
        *   Edição (`updateRole` action): Nome, descrição e permissões podem ser alterados para papéis customizados.
        *   Exclusão (`deleteRole` action): Papéis customizados podem ser excluídos, idealmente se não estiverem em uso.
        *   Papéis de Sistema: Papéis como 'ADMINISTRATOR' e 'USER' são protegidos contra exclusão e, possivelmente, contra alteração de nome ou remoção de permissões essenciais.
    *   **Permissões Administrativas:**
        *   `users:read`, `users:create`, `users:update`, `users:delete`: Para gerenciamento de usuários.
        *   `users:assign_roles`: Para alterar o papel de um usuário.
        *   `roles:read`, `roles:create`, `roles:update`, `roles:delete`: Para gerenciamento de papéis.
        *   `manage_all`: Concede todas as permissões acima.
*   **3.8.5. Layout e Páginas Envolvidas:**
    *   **Usuários:**
        *   `/admin/users`: Listagem de usuários (`DataTable`) com colunas para Nome, Email, Papel, Status Habilitação, Data Cadastro. Funcionalidades de busca e filtro. Botões de ação por linha (Editar, Excluir). Botão "Novo Usuário".
        *   `/admin/users/new`: Formulário (`UserForm` de `src/app/admin/users/user-form.tsx`) para criar novo usuário. Permite definir dados de perfil e, opcionalmente, o papel inicial.
        *   `/admin/users/[userId]/edit`: Página de edição de usuário.
            *   Usa `UserForm` para editar dados do `UserProfileData`.
            *   Usa `UserRoleForm` (de `src/app/admin/users/user-role-form.tsx`) para alterar o `roleId` do usuário.
            *   Pode ter abas/seções para visualizar documentos, histórico de lances, etc.
    *   **Papéis:**
        *   `/admin/roles`: Listagem de papéis (`DataTable`) com colunas para Nome, Descrição, Nº de Usuários (opcional). Botões de ação (Editar, Excluir - exceto para papéis de sistema). Botão "Novo Papel".
        *   `/admin/roles/new`: Formulário (`RoleForm` de `src/app/admin/roles/role-form.tsx`) para criar novo papel, com seleção de permissões.
        *   `/admin/roles/[roleId]/edit`: Formulário (`RoleForm`) para editar papel existente.
*   **3.8.6. Considerações sobre TDD:**
    *   **Testes Unitários:**
        *   `userFormSchema.ts` e `roleFormSchema.ts`: Testar validações (já implementados).
        *   Funções utilitárias para manipulação de permissões ou dados de usuário/papel.
    *   **Testes de Integração (Server Actions):**
        *   `getUsersWithRoles`, `getUserProfileData`: Mockar adapter e verificar retorno e formatação de dados.
        *   `updateUserRole`: Mockar adapter, verificar se `adapter.updateUserRole` é chamado com os dados corretos e se `revalidatePath` é acionado.
        *   `deleteUser`: Mockar `adapter.deleteUserProfile` e `authAdmin.deleteUser` (se FIRESTORE). Verificar `revalidatePath`.
        *   `createUser` (contexto admin): Similar ao teste de registro público, mas pode envolver atribuição direta de papel diferente de 'USER'.
        *   `createRole`, `getRoles`, `getRole`, `updateRole`, `deleteRole`: Mockar adapter, testar lógica de negócio (ex: não permitir exclusão de papel de sistema), verificar `revalidatePath`.
    *   **Testes de UI (Componente):**
        *   `UserForm`, `UserRoleForm`, `RoleForm`: Testar renderização, preenchimento, validações de cliente, submissão (mockando server actions).
        *   Páginas de listagem (`/admin/users`, `/admin/roles`): Testar renderização da tabela, interações com filtros, paginação, botões de ação.
    *   **Testes End-to-End (E2E):**
        *   Fluxo completo de criação de um novo usuário por um admin.
        *   Fluxo de edição de perfil e papel de um usuário.
        *   Fluxo de exclusão de um usuário.
        *   Fluxo completo de criação, edição e exclusão de um papel customizado.
        *   Tentar editar/excluir um papel de sistema e verificar se a UI impede ou a action falha corretamente.

### 3.9. Vendas Diretas (DirectSaleOffer)

*   **3.9.1. Descrição Geral:**
    *   Permite a comercialização de itens a um preço fixo ("Compre Agora") ou através da submissão de propostas por parte dos interessados ("Aceita Propostas"), funcionando como uma alternativa aos leilões tradicionais. Esta modalidade atende à necessidade de venda de itens que podem não se encaixar no formato de leilão ou para os quais o vendedor prefere uma negociação mais direta. As ofertas são gerenciadas por Comitentes/Vendedores ou Administradores, e os Compradores podem interagir de acordo com o tipo de oferta.

*   **3.9.2. Personas Envolvidas:**
    *   **Vendedor/Comitente:** Usuário (PF ou PJ) que cria e gerencia as ofertas de venda direta para seus itens. Define o tipo de oferta, preço (para "Compre Agora"), preço mínimo (opcional para "Aceita Propostas"), e gerencia as propostas recebidas.
    *   **Comprador:** Usuário interessado em adquirir itens. Pode visualizar a lista de ofertas, filtrar por diversos critérios, visualizar detalhes da oferta, comprar diretamente um item "Compre Agora", ou submeter propostas para itens "Aceita Propostas".
    *   **Administrador da Plataforma:** Pode criar/gerenciar ofertas em nome dos vendedores, moderar ofertas, e ter uma visão geral de todas as transações de venda direta.

*   **3.9.3. Cenários BDD (Gherkin):**
    ```gherkin
    Feature: Vendas Diretas (DirectSaleOffer)
      Como um usuário da plataforma
      Eu quero poder participar de Vendas Diretas
      Para comprar ou vender itens de forma direta.

      Scenario: Vendedor cria uma nova oferta "Compre Agora"
        Given Estou logado como Vendedor e na página de criação de Venda Direta
        When Eu preencho o campo "Título da Oferta" com "Cadeira de Escritório Ergonômica Usada"
        And Eu seleciono o tipo de oferta "Compre Agora"
        And Eu preencho o campo "Preço" com "250.00"
        And Eu preencho a "Descrição" com "Cadeira em bom estado, pouco uso, com ajuste de altura."
        And Eu seleciono a "Categoria" como "Móveis de Escritório"
        And Eu faço upload da imagem principal "cadeira.jpg"
        And Eu clico em "Publicar Oferta"
        Then Eu devo ver uma mensagem "Oferta publicada com sucesso!"
        And A oferta "Cadeira de Escritório Ergonômica Usada" deve estar listada como "ATIVA" em meu painel de vendas.

      Scenario: Vendedor cria uma nova oferta "Aceita Propostas" com preço mínimo
        Given Estou logado como Vendedor e na página de criação de Venda Direta
        When Eu preencho o campo "Título da Oferta" com "Coleção de Selos Raros"
        And Eu seleciono o tipo de oferta "Aceita Propostas"
        And Eu preencho o campo "Preço Mínimo para Proposta" com "500.00"
        And Eu preencho a "Descrição" com "Coleção completa de selos da década de 50."
        And Eu seleciono a "Categoria" como "Colecionáveis"
        And Eu clico em "Publicar Oferta"
        Then Eu devo ver uma mensagem "Oferta publicada com sucesso!"
        And A oferta "Coleção de Selos Raros" deve estar listada como "ATIVA".

      Scenario: Comprador visualiza lista de ofertas de venda direta
        Given Estou logado como Comprador e na página "/direct-sales"
        And Existem ofertas de venda direta publicadas
        When Eu aplico o filtro de categoria "Eletrônicos"
        And Eu ordeno por "Preço Menor para Maior"
        Then Eu devo ver uma lista de ofertas de venda direta correspondentes aos filtros e ordenação.
        And Cada oferta deve exibir título, imagem, preço (ou indicação de propostas) e nome do vendedor.

      Scenario: Comprador compra um item "Compre Agora"
        Given Estou logado como Comprador e visualizando a oferta "Cadeira de Escritório Ergonômica Usada" do tipo "Compre Agora" com preço "250.00"
        When Eu clico no botão "Comprar Agora"
        And Eu confirmo a intenção de compra
        Then Eu devo ser redirecionado para a página de checkout (simulado)
        And O status da oferta "Cadeira de Escritório Ergonômica Usada" deve mudar para "VENDIDO".
        And Eu devo receber uma notificação de compra bem-sucedida.

      Scenario: Comprador submete uma proposta válida para uma oferta "Aceita Propostas"
        Given Estou logado como Comprador e visualizando a oferta "Coleção de Selos Raros" do tipo "Aceita Propostas"
        And A oferta não possui preço mínimo ou o preço mínimo é "500.00"
        When Eu preencho o campo "Valor da Proposta" com "550.00"
        And Eu clico no botão "Enviar Proposta"
        Then Eu devo ver uma mensagem "Proposta enviada com sucesso!"
        And O vendedor deve ser notificado sobre a nova proposta.
        And O contador `proposalsCount` da oferta deve ser incrementado.

      Scenario: Comprador tenta submeter proposta abaixo do preço mínimo
        Given Estou logado como Comprador e visualizando a oferta "Coleção de Selos Raros" com preço mínimo "500.00"
        When Eu preencho o campo "Valor da Proposta" com "450.00"
        And Eu clico no botão "Enviar Proposta"
        Then Eu devo ver uma mensagem de erro "Sua proposta deve ser igual ou superior ao preço mínimo de R$ 500,00."

      Scenario: Vendedor visualiza propostas recebidas
        Given Estou logado como Vendedor da oferta "Coleção de Selos Raros"
        And Foram recebidas propostas de "comprador1@example.com" (R$ 550) e "comprador2@example.com" (R$ 600)
        When Eu acesso meu painel de vendas e seleciono a oferta "Coleção de Selos Raros"
        Then Eu devo ver uma lista das propostas recebidas, incluindo o nome do proponente (ou identificador) e o valor.

      Scenario: Vendedor aceita uma proposta
        Given Estou logado como Vendedor e visualizando as propostas da oferta "Coleção de Selos Raros"
        And A proposta de "comprador2@example.com" por "R$ 600,00" é a melhor
        When Eu clico em "Aceitar Proposta" para a proposta de "comprador2@example.com"
        Then O status da oferta "Coleção de Selos Raros" deve mudar para "VENDIDO"
        And O Comprador "comprador2@example.com" deve ser notificado que sua proposta foi aceita.
        And Outros proponentes podem ser notificados que suas propostas não foram aceitas.

      Scenario: Vendedor rejeita uma proposta
        Given Estou logado como Vendedor e visualizando a proposta de "comprador1@example.com" por "R$ 550,00" para a oferta "Coleção de Selos Raros"
        When Eu clico em "Rejeitar Proposta"
        Then A proposta de "comprador1@example.com" deve ser marcada como rejeitada.
        And (Opcional) O Comprador "comprador1@example.com" é notificado.

      Scenario: Oferta ativa atinge data de expiração
        Given Existe uma oferta "Produto Antigo" com `expiresAt` definido para uma data passada
        And O status da oferta é "ACTIVE"
        When O sistema verifica as ofertas expiradas (ex: através de uma tarefa agendada ou na visualização)
        Then O status da oferta "Produto Antigo" deve mudar para "EXPIRED".

      Scenario: Contador de visualizações é incrementado
        Given A oferta "Cadeira de Escritório Ergonômica Usada" tem 10 visualizações (`views: 10`)
        When Um Comprador visualiza os detalhes da oferta "Cadeira de Escritório Ergonômica Usada"
        Then O contador de visualizações (`views`) da oferta deve ser incrementado para 11.
    ```

*   **3.9.4. Regras de Negócio e Validações:**
    *   **Criação/Edição de `DirectSaleOffer` (baseado no tipo `DirectSaleOffer` em `src/types/index.ts` e `BUSINESS_RULES.md`):**
        *   Campos Obrigatórios: `title`, `description`, `imageUrl` (ou `mediaItemIds`), `offerType`, `category`, `sellerName` (geralmente o usuário logado, se comitente).
        *   Se `offerType` for `BUY_NOW`, o campo `price` (numérico, positivo) é obrigatório.
        *   Se `offerType` for `ACCEPTS_PROPOSALS`, o campo `minimumOfferPrice` (numérico, positivo) é opcional.
        *   `sellerId` é o ID do usuário que cria a oferta.
        *   `status` inicial geralmente é `ACTIVE` ou `PENDING_APPROVAL` (se houver fluxo de moderação).
        *   `expiresAt` (opcional): Se definido, deve ser uma data futura.
    *   **Transição de Status (`DirectSaleOfferStatus`):**
        *   `PENDING_APPROVAL` -> `ACTIVE` (após aprovação do admin).
        *   `ACTIVE` -> `SOLD` (após compra direta ou aceitação de proposta).
        *   `ACTIVE` -> `EXPIRED` (se `expiresAt` for atingido).
        *   Uma vez `SOLD` ou `EXPIRED`, a oferta não pode mais ser comprada ou receber propostas.
    *   **Validação de Propostas:**
        *   Valor da proposta deve ser positivo.
        *   Se `minimumOfferPrice` estiver definido na oferta, a proposta deve ser maior ou igual a ele.
        *   Um usuário não pode fazer proposta em sua própria oferta.
    *   **Contadores:**
        *   `views`: Incrementado a cada visualização da página de detalhes da oferta.
        *   `proposalsCount`: Incrementado a cada nova proposta válida submetida.
    *   **Permissões:**
        *   Comitentes (`direct_sales:manage_own` ou similar): Criar, editar, excluir suas próprias ofertas. Visualizar e gerenciar propostas para suas ofertas.
        *   Administradores (`direct_sales:manage_all` ou `manage_all`): Criar, editar, excluir qualquer oferta. Moderar ofertas.
        *   Compradores (`direct_sales:place_proposal`, `direct_sales:buy_now`): Comprar itens "Compre Agora", submeter propostas.

*   **3.9.5. Layout e Páginas Envolvidas:**
    *   **Página de Listagem de Vendas Diretas (`/direct-sales` ou `src/app/direct-sales/page.tsx`):**
        *   Galeria ou lista de `DirectSaleOfferCard`.
        *   Filtros: Categoria, tipo de oferta (`BUY_NOW`, `ACCEPTS_PROPOSALS`), faixa de preço, localização (cidade/estado), nome do vendedor.
        *   Ordenação: Data de publicação, preço, popularidade (visualizações).
        *   Paginação.
    *   **Página de Detalhes da Oferta (`/direct-sales/[offerId]` ou `src/app/direct-sales/[offerId]/page.tsx`):**
        *   Exibição completa dos detalhes da `DirectSaleOffer`: título, descrição, galeria de imagens, preço (se `BUY_NOW`), informações do vendedor.
        *   Se `offerType` for `BUY_NOW`: Botão "Comprar Agora".
        *   Se `offerType` for `ACCEPTS_PROPOSALS`: Formulário para submissão de proposta (campo de valor, botão "Enviar Proposta"). Exibição do `minimumOfferPrice` se houver.
        *   (Opcional) Seção de perguntas e respostas.
    *   **Painel do Comitente/Vendedor (Interface Inferida, ex: `/consignor-dashboard/direct-sales`):**
        *   Listagem das ofertas criadas pelo vendedor.
        *   Opções para criar nova oferta, editar ou excluir ofertas existentes (se `status` permitir).
        *   Para ofertas do tipo "Aceita Propostas": Interface para visualizar propostas recebidas, com opções para aceitar ou rejeitar cada proposta.
    *   **Painel do Administrador (Interface Inferida, ex: `/admin/direct-sales`):**
        *   Listagem de todas as ofertas de venda direta.
        *   Filtros por status (`PENDING_APPROVAL`, `ACTIVE`, `SOLD`, `EXPIRED`).
        *   Opções para aprovar, rejeitar (moderar), editar ou excluir qualquer oferta.
    *   **Componentes Reutilizáveis:**
        *   `DirectSaleOfferCard` (em `src/components/direct-sale-offer-card.tsx`): Card para exibir um resumo da oferta nas listagens.
        *   Formulário de criação/edição de `DirectSaleOffer` (pode usar um schema Zod).
        *   Formulário de submissão de proposta.

*   **3.9.6. Considerações sobre TDD:**
    *   **Testes Unitários:**
        *   Schema Zod para o formulário de criação/edição de `DirectSaleOffer`: Validar campos obrigatórios, tipos, formatos (preço positivo, URL de imagem, etc.), lógica condicional (ex: `price` obrigatório se `offerType` for `BUY_NOW`).
        *   Schema Zod para o formulário de submissão de proposta: Validar valor da proposta.
        *   Funções utilitárias (ex: para verificar se uma oferta está expirada).
    *   **Testes de Integração (Server Actions - a serem criadas/identificadas):**
        *   `createDirectSaleOffer`: Mockar adapter, verificar criação correta no DB, `revalidatePath`.
        *   `updateDirectSaleOffer`: Mockar adapter, verificar atualização no DB, `revalidatePath`.
        *   `deleteDirectSaleOffer`: Mockar adapter, verificar exclusão no DB, `revalidatePath`.
        *   `getDirectSaleOffer(s)`: Mockar adapter, verificar retorno dos dados.
        *   `submitProposal`: Mockar adapter, verificar criação de registro de proposta, atualização de `proposalsCount`, notificações (se houver).
        *   `acceptProposal`: Mockar adapter, verificar mudança de status da oferta para `SOLD`, notificação ao proponente vencedor e outros.
        *   `rejectProposal`: Mockar adapter, verificar status da proposta, notificação (se houver).
        *   (Admin) `approveDirectSaleOffer`, `rejectDirectSaleOffer`: Mockar adapter, verificar mudança de status da oferta.
    *   **Testes de UI (Componente):**
        *   Formulário de criação/edição de `DirectSaleOffer`: Testar renderização, preenchimento, validações de cliente, submissão (mockando a action).
        *   `DirectSaleOfferCard`: Testar renderização de informações.
        *   Página de detalhes da oferta: Testar exibição condicional de botões ("Comprar Agora" vs. formulário de proposta).
        *   Formulário de proposta: Testar validação e submissão.
        *   Interfaces de gerenciamento de propostas para o vendedor.
    *   **Testes End-to-End (E2E):**
        *   Fluxo 1: Vendedor cria oferta "Compre Agora" -> Comprador visualiza e compra o item.
        *   Fluxo 2: Vendedor cria oferta "Aceita Propostas" -> Comprador A submete proposta -> Comprador B submete proposta maior -> Vendedor visualiza propostas e aceita a do Comprador B.
        *   Fluxo 3: Oferta expira e seu status é atualizado.
        *   Fluxo 4 (Admin): Moderar (aprovar/rejeitar) uma oferta pendente.

### 3.10. Painel do Usuário (Dashboard)

*   **3.10.1. Descrição Geral:**
    *   O Painel do Usuário (Dashboard) é a área centralizada onde usuários registrados podem gerenciar suas atividades, informações pessoais e interações com a plataforma de leilões e vendas diretas. Ele fornece uma visão geral consolidada e acesso rápido a seções específicas como lances atuais, lotes arrematados, itens favoritos, status de documentos de habilitação, histórico de navegação, notificações e relatórios de atividades.
    *   O objetivo é oferecer uma experiência de usuário organizada e eficiente, permitindo que acompanhem facilmente seus interesses e obrigações na plataforma.

*   **3.10.2. Personas Envolvidas:**
    *   **Usuário Registrado (Licitante/Comprador):** Principal persona. Utiliza o dashboard para acompanhar lances, arremates, gerenciar documentos, favoritos, notificações e visualizar seu histórico e relatórios de compras.
    *   **Usuário Registrado (Comitente/Vendedor):** Embora possa ter um painel específico para gerenciamento de vendas (ex: `/consignor-dashboard`), algumas informações gerais ou notificações do dashboard principal podem ser relevantes. Esta especificação foca no dashboard do comprador/licitante, mas o layout de navegação deve permitir acesso a painéis específicos de vendedor, se aplicável.

*   **3.10.3. Cenários BDD (Gherkin):**
    ```gherkin
    Feature: Painel do Usuário (Dashboard)
      Como um usuário registrado
      Eu quero acessar meu Painel (Dashboard)
      Para visualizar e gerenciar minhas atividades e informações na plataforma.

      Scenario: Usuário acessa a Visão Geral do Dashboard
        Given Estou logado como "usuario_ativo@example.com"
        When Eu navego para "/dashboard/overview"
        Then Eu devo ver um resumo das minhas atividades recentes
        And Eu devo ver uma seção de "Lances Ativos" com os principais lances que estou ganhando ou perdendo
        And Eu devo ver uma seção de "Arremates Recentes" com os últimos lotes que ganhei
        And Se eu tiver documentos pendentes, devo ver um alerta ou link para "/dashboard/documents".

      Scenario: Usuário acessa Meus Lances
        Given Estou logado como "licitante_frequente@example.com"
        And Eu fiz lances em "LOTE_ABC" (status GANHANDO) e "LOTE_XYZ" (status PERDENDO)
        When Eu navego para "/dashboard/bids"
        Then Eu devo ver uma lista dos meus lances
        And "LOTE_ABC" deve ser listado com status "GANHANDO" e valor do meu último lance
        And "LOTE_XYZ" deve ser listado com status "PERDENDO", meu último lance e o lance atual do lote.
        And Deve haver filtros para status do lance (Ganhando, Perdendo, Arrematado, Não Arrematado).

      Scenario: Usuário acessa Meus Arremates
        Given Estou logado como "comprador_sortudo@example.com"
        And Eu arrematei "LOTE_VENCIDO_1" por R$500 (Pagamento PENDENTE) e "LOTE_VENCIDO_2" por R$300 (Pagamento PAGO)
        When Eu navego para "/dashboard/wins"
        Then Eu devo ver uma lista dos meus lotes arrematados
        And "LOTE_VENCIDO_1" deve ser listado com valor R$500 e status de pagamento "PENDENTE"
        And "LOTE_VENCIDO_2" deve ser listado com valor R$300 e status de pagamento "PAGO".
        And Para cada arremate, deve haver um link para detalhes do lote e informações de pagamento.

      Scenario: Usuário acessa e gerencia Favoritos
        Given Estou logado como "usuario_planejador@example.com"
        And Eu adicionei "LOTE_FAV_1" e "LOTE_FAV_2" aos meus favoritos
        When Eu navego para "/dashboard/favorites"
        Then Eu devo ver "LOTE_FAV_1" e "LOTE_FAV_2" listados com suas informações principais (imagem, título, preço atual).
        When Eu clico em "Remover dos Favoritos" para "LOTE_FAV_1"
        Then "LOTE_FAV_1" não deve mais aparecer na lista de favoritos.

      Scenario: Usuário acessa Meus Documentos (referência à Seção 3.7)
        Given Estou logado como "usuario_novo_docs@example.com" com status de habilitação "PENDENTE_DOCUMENTOS"
        When Eu navego para "/dashboard/documents"
        Then Eu sou direcionado para a funcionalidade de gerenciamento de documentos descrita na Seção 3.7
        And Eu vejo a lista de documentos requeridos e seus status.

      Scenario: Usuário acessa Histórico de Navegação
        Given Estou logado como "usuario_navegador@example.com"
        And Eu visitei os lotes "LOTE_RECENTE_A", "LOTE_RECENTE_B", "LOTE_RECENTE_C" (nesta ordem, C é o mais recente)
        When Eu navego para "/dashboard/history"
        Then Eu devo ver uma lista dos lotes que visitei recentemente
        And "LOTE_RECENTE_C" deve aparecer primeiro na lista, seguido por "LOTE_RECENTE_B" e "LOTE_RECENTE_A".

      Scenario: Usuário acessa Notificações
        Given Estou logado como "usuario_informado@example.com"
        And Eu recebi uma notificação "Seu lance no LOTE_XYZ foi coberto" (não lida)
        And Eu recebi uma notificação "O leilão LEILAO_IMPORTANTE começa em 1 hora" (lida)
        When Eu navego para "/dashboard/notifications"
        Then Eu devo ver a notificação sobre "LOTE_XYZ" marcada como "não lida"
        And Eu devo ver a notificação sobre "LEILAO_IMPORTANTE" marcada como "lida".
        When Eu clico na notificação sobre "LOTE_XYZ"
        Then A notificação sobre "LOTE_XYZ" deve ser marcada como "lida"
        And (Opcional) Eu posso ser redirecionado para a página do "LOTE_XYZ".

      Scenario: Usuário acessa Relatórios (Exemplo: Gastos)
        Given Estou logado como "usuario_analitico@example.com"
        And Eu arrematei 3 lotes no último mês, totalizando R$1250,00
        When Eu navego para "/dashboard/reports"
        And Eu seleciono o relatório de "Gastos Totais por Período"
        And Eu defino o período como "Último Mês"
        Then Eu devo ver um relatório indicando que meus gastos totais foram R$1250,00.
    ```

*   **3.10.4. Regras de Negócio e Validações:**
    *   **Acesso:** Todas as seções do dashboard são restritas a usuários autenticados.
    *   **Privacidade de Dados:** Um usuário só pode visualizar suas próprias informações (seus lances, seus arremates, seus favoritos, etc.). As queries de backend devem sempre filtrar os dados pelo `userId` do usuário logado.
    *   **Visão Geral (`/dashboard/overview`):**
        *   Exibe um número limitado de itens recentes (ex: últimos 5 lances ativos, últimos 3 arremates).
        *   Alerta para documentos pendentes deve ser proeminente se `UserProfileData.habilitationStatus` for `PENDING_DOCUMENTS` ou `REJECTED_DOCUMENTS`.
    *   **Meus Lances (`/dashboard/bids` - `UserBid`):**
        *   Lista lances com informações do lote (`lotTitle`, `lotImageUrl`, `lotEndDate`), valor do lance do usuário (`userBidAmount`), preço atual do lote (`currentLotPrice`), e `bidStatus` (`GANHANDO`, `PERDENDO`, `SUPERADO_POR_OUTRO`, `SUPERADO_PELO_PROPRIO_MAXIMO`, `ARREMATADO`, `NAO_ARREMATADO`).
        *   Permite filtrar por `bidStatus`.
        *   Paginação para grande quantidade de lances.
    *   **Meus Arremates (`/dashboard/wins` - `UserWin`):**
        *   Lista lotes arrematados com informações do lote (`Lot`), valor do arremate (`winningBidAmount`), data do arremate (`winDate`), e status do pagamento (`paymentStatus` - `PENDENTE`, `PROCESSANDO`, `PAGO`, `FALHOU`).
        *   Links para detalhes do lote e, se aplicável, para o sistema de pagamento.
    *   **Favoritos (`/dashboard/favorites` - `Lot.isFavorite`):**
        *   A funcionalidade de favoritar um lote (marcar/desmarcar `Lot.isFavorite = true/false`) ocorre nas páginas de listagem ou detalhes do lote.
        *   O dashboard apenas exibe a lista de lotes onde `isFavorite` é `true` para o usuário logado.
        *   A remoção de um favorito no dashboard deve atualizar o estado `isFavorite` do lote.
    *   **Meus Documentos (`/dashboard/documents`):**
        *   Redireciona ou integra a funcionalidade descrita na Seção `3.7. Habilitação de Usuários e Gerenciamento de Documentos`.
    *   **Histórico de Navegação (`/dashboard/history` - `RecentlyViewedLotInfo`):**
        *   Armazena uma lista dos últimos N lotes visualizados pelo usuário (ex: últimos 20).
        *   Cada item deve conter ID do lote, título, imagem, e data da última visualização.
        *   A lógica de registrar um lote como "visto recentemente" ocorre na página de detalhes do lote.
    *   **Notificações (`/dashboard/notifications` - `UserNotification` - tipo hipotético):**
        *   Lista de notificações geradas pelo sistema para o usuário (ex: lance coberto, leilão de interesse iniciando, documento aprovado/rejeitado, proposta recebida/aceita/rejeitada, etc.).
        *   Cada notificação deve ter um status de `lida`/`não lida`.
        *   Clicar em uma notificação deve marcá-la como `lida` e pode redirecionar para a página relevante.
    *   **Relatórios (`/dashboard/reports`):**
        *   A disponibilidade e tipos de relatórios podem variar. Exemplos:
            *   Gastos totais em arremates por período.
            *   Número de lances feitos por período.
            *   Categorias de lotes mais arrematados.
        *   Requerem agregação de dados do backend.

*   **3.10.5. Layout e Páginas Envolvidas:**
    *   **Layout Geral do Dashboard:**
        *   Geralmente utiliza o layout principal da aplicação (Header e Footer globais).
        *   Adiciona uma navegação secundária específica para o dashboard, que pode ser uma barra lateral (ex: `DashboardNav` em `src/components/layout/dashboard-nav.tsx`) ou abas no topo da área de conteúdo do dashboard.
        *   Links de navegação: Visão Geral, Meus Lances, Meus Arremates, Favoritos, Documentos, Histórico, Notificações, Relatórios, Minha Conta (perfil).
    *   **Páginas de Subseção:**
        *   `/dashboard/overview`: (`src/app/dashboard/overview/page.tsx`)
            *   Cards ou seções resumidas para "Lances Ativos", "Arremates Recentes", "Lotes Vistos Recentemente", "Alerta de Documentos".
        *   `/dashboard/bids`: (`src/app/dashboard/bids/page.tsx`)
            *   Tabela ou lista de `UserBidCard` (componente hipotético) ou linhas de tabela. Filtros de status.
        *   `/dashboard/wins`: (`src/app/dashboard/wins/page.tsx`)
            *   Tabela ou lista de `UserWinCard` (componente hipotético) ou linhas de tabela.
        *   `/dashboard/favorites`: (`src/app/dashboard/favorites/page.tsx`)
            *   Grade ou lista de `LotCard` para os lotes favoritados.
        *   `/dashboard/documents`: (`src/app/dashboard/documents/page.tsx`)
            *   Conforme descrito na Seção 3.7.5.
        *   `/dashboard/history`: (`src/app/dashboard/history/page.tsx`)
            *   Lista de `LotCard` ou similar para lotes vistos recentemente.
        *   `/dashboard/notifications`: (`src/app/dashboard/notifications/page.tsx`)
            *   Lista de itens de notificação, com distinção visual para lidas/não lidas.
        *   `/dashboard/reports`: (`src/app/dashboard/reports/page.tsx`)
            *   Interface para seleção de tipo de relatório e filtros (ex: período). Exibição dos dados em tabelas ou gráficos simples.
    *   **Componentes Chave de Exibição:**
        *   `DashboardNav`: Menu de navegação do dashboard.
        *   Cards específicos para cada tipo de dado (lances, arremates, favoritos, notificações).
        *   Tabelas (`DataTable`) para listagens mais densas.

*   **3.10.6. Considerações sobre TDD:**
    *   **Testes Unitários:**
        *   Funções utilitárias para formatação de datas, valores monetários, ou cálculo de resumos para a Visão Geral.
        *   Lógica de componentes de UI isolados (ex: um componente de filtro de relatório).
    *   **Testes de Integração (Server Actions - a serem criadas/identificadas):**
        *   `getUserDashboardOverview(userId: string)`: Action que busca os dados resumidos para a página de visão geral. Mockar chamadas ao DB adapter para `UserBid`, `UserWin`, `UserProfileData.habilitationStatus`.
        *   `getUserBids(userId: string, filters?: any)`: Action para buscar os lances do usuário. Mockar adapter.
        *   `getUserWins(userId: string, filters?: any)`: Action para buscar os arremates do usuário. Mockar adapter.
        *   `getUserFavoriteLots(userId: string)`: Action para buscar os lotes favoritados. Mockar adapter.
        *   `getUserRecentlyViewedLots(userId: string)`: Action para buscar o histórico de navegação. Mockar adapter.
        *   `getUserNotifications(userId: string, filters?: any)`: Action para buscar as notificações. Mockar adapter.
        *   `markNotificationAsRead(notificationId: string, userId: string)`: Action para atualizar o status de uma notificação.
        *   `generateUserReport(userId: string, reportType: string, params: any)`: Action para gerar dados de relatório. Mockar adapter.
    *   **Testes de UI (Componente - usando React Testing Library):**
        *   Para cada página do dashboard (`overview/page.tsx`, `bids/page.tsx`, etc.):
            *   Testar a renderização correta dos dados (usando dados mockados passados como props ou retornados por server actions mockadas).
            *   Testar interações do usuário (filtros, paginação, marcar notificação como lida, remover favorito).
            *   Verificar se os links de navegação no `DashboardNav` direcionam corretamente (simulando a navegação).
    *   **Testes End-to-End (E2E - usando Playwright):**
        *   Login de um usuário.
        *   Navegar para cada seção do dashboard e verificar se os dados (consistentes com o estado do usuário mockado/semeado no DB de teste) são exibidos.
        *   Fluxo: Adicionar um lote aos favoritos na página de um leilão -> navegar para `/dashboard/favorites` -> verificar se o lote aparece -> remover o lote dos favoritos -> verificar se ele some da lista.
        *   Fluxo: Fazer um lance em um lote -> navegar para `/dashboard/bids` -> verificar se o lance aparece com status "GANHANDO".
        *   Fluxo: (Simular) Arrematar um lote -> navegar para `/dashboard/wins` -> verificar se o arremate aparece.
        *   Fluxo: Clicar em uma notificação não lida -> verificar se ela é marcada como lida.

### 3.11. Painel do Comitente (Consignor Dashboard)

*   **3.11.1. Descrição Geral:**
    *   O Painel do Comitente é uma área dedicada para usuários que atuam como vendedores ou comitentes na plataforma. Seu propósito é fornecer ferramentas e informações para que possam gerenciar seus itens à venda (seja em leilão ou venda direta), acompanhar o desempenho de suas vendas, visualizar relatórios financeiros relacionados às suas transações e gerenciar seu perfil de vendedor.
    *   Este painel visa simplificar o processo de venda, oferecendo uma visão clara do status dos itens, propostas recebidas, valores arrecadados e pendências.

*   **3.11.2. Personas Envolvidas:**
    *   **Comitente/Vendedor:** Usuário com papel `CONSIGNOR` ou com permissões apropriadas (ex: `auctions:manage_own`, `direct_sales:manage_own`, `consignor_dashboard:view`). Esta é a persona principal que interage com este painel para gerenciar suas atividades de venda.

*   **3.11.3. Cenários BDD (Gherkin):**
    ```gherkin
    Feature: Painel do Comitente (Consignor Dashboard)
      Como um Comitente/Vendedor registrado na plataforma
      Eu quero acessar meu Painel de Comitente
      Para gerenciar meus itens à venda, acompanhar meu desempenho e visualizar informações financeiras.

      Scenario: Comitente acessa a Visão Geral do Painel
        Given Estou logado como Comitente "vendedor_pro@example.com"
        And Eu possuo leilões ativos e ofertas de venda direta
        When Eu navego para "/consignor-dashboard/overview"
        Then Eu devo ver um resumo das minhas atividades como comitente
        And Eu devo ver estatísticas chave como "Total de Itens Ativos", "Vendas nos Últimos 30 dias", "Valor Pendente de Repasse".
        And Eu devo ver links rápidos para criar novos leilões ou ofertas de venda direta.
        And (Se `src/app/consignor-dashboard/overview/page.tsx` for um placeholder) Eu devo ver uma mensagem "Página em Desenvolvimento" ou similar, indicando que a visão geral completa ainda não está implementada.

      Scenario: Comitente tenta acessar "Meus Leilões" (Funcionalidade Futura)
        Given Estou logado como Comitente "vendedor_leiloes@example.com"
        And Eu navego para o Painel do Comitente
        When Eu clico no link "Meus Leilões" na barra lateral de navegação do painel do comitente
        Then O link pode estar desabilitado, ou se clicável, serei direcionado para uma página placeholder (ex: "/consignor-dashboard/auctions")
        And A página placeholder deve indicar "Funcionalidade em desenvolvimento: Gerenciamento de Leilões do Comitente".
        And (Comportamento Esperado Futuro) Eu deverei ver uma lista dos meus leilões (criados por mim ou onde sou o comitente principal), com status, datas, número de lotes, e opções para visualizar detalhes, editar (se o status permitir) ou acompanhar o desempenho.

      Scenario: Comitente tenta acessar "Meus Lotes" (Funcionalidade Futura)
        Given Estou logado como Comitente "vendedor_lotes@example.com"
        And Eu navego para o Painel do Comitente
        When Eu clico no link "Meus Lotes" na barra lateral
        Then O link pode estar desabilitado, ou serei direcionado para uma página placeholder (ex: "/consignor-dashboard/lots")
        And A página placeholder deve indicar "Funcionalidade em desenvolvimento: Gerenciamento de Lotes do Comitente".
        And (Comportamento Esperado Futuro) Eu deverei ver uma lista de todos os meus lotes (associados a leilões ou itens de venda direta), com status, preço, e opções para adicionar novos lotes (independentes ou para um leilão), editar detalhes, ou visualizar o desempenho individual.

      Scenario: Comitente tenta acessar "Venda Direta" (Funcionalidade Futura)
        Given Estou logado como Comitente "vendedor_direto_plus@example.com"
        And Eu navego para o Painel do Comitente
        When Eu clico no link "Venda Direta" na barra lateral
        Then O link pode estar desabilitado, ou serei direcionado para uma página placeholder (ex: "/consignor-dashboard/direct-sales")
        And A página placeholder deve indicar "Funcionalidade em desenvolvimento: Gerenciamento de Vendas Diretas do Comitente".
        And (Comportamento Esperado Futuro) Eu deverei poder criar novas ofertas de Venda Direta (`DirectSaleOffer`), listar minhas ofertas ativas/inativas, editar ofertas existentes, visualizar e gerenciar propostas recebidas (conforme detalhado na Seção 3.9 para Vendedores).

      Scenario: Comitente tenta acessar "Financeiro" (Funcionalidade Futura)
        Given Estou logado como Comitente "vendedor_financeiro@example.com"
        And Eu navego para o Painel do Comitente
        When Eu clico no link "Financeiro" na barra lateral
        Then O link pode estar desabilitado, ou serei direcionado para uma página placeholder (ex: "/consignor-dashboard/financials")
        And A página placeholder deve indicar "Funcionalidade em desenvolvimento: Relatórios Financeiros do Comitente".
        And (Comportamento Esperado Futuro) Eu deverei poder visualizar relatórios detalhados de vendas concluídas, valores totais vendidos, comissões da plataforma (se aplicável), status de repasses de pagamento, e extratos por período.
    ```

*   **3.11.4. Regras de Negócio e Validações:**
    *   **Acesso ao Painel:**
        *   Restrito a usuários com papel `CONSIGNOR` ou permissões específicas como `consignor_dashboard:view`.
        *   O acesso pode ser um item de menu no `UserNav` ou um redirecionamento após login se o papel principal for `CONSIGNOR`.
    *   **Visão Geral (`/consignor-dashboard/overview`):**
        *   A página atual (`src/app/consignor-dashboard/overview/page.tsx`) parece ser um placeholder simples ("Consignor Overview Page").
        *   **Futuramente, deveria exibir:**
            *   Métricas chave: Total de leilões ativos, total de lotes ativos (em leilão e venda direta), total de vendas realizadas (últimos 30 dias/período selecionável), valor total pendente de repasse.
            *   Lista de leilões recentes com status.
            *   Lista de ofertas de venda direta recentes com status.
            *   Alertas importantes (ex: propostas aguardando resposta, leilões encerrando em breve com itens não vendidos).
    *   **Meus Leilões (Futuro):**
        *   Listagem de leilões onde o usuário é o comitente principal.
        *   Filtros por status do leilão.
        *   Opção de criar novo leilão (pode redirecionar para `/auctions/create` ou interface administrativa de criação).
        *   Visualização de detalhes do leilão, incluindo lotes associados e seu desempenho.
    *   **Meus Lotes (Futuro):**
        *   Listagem de todos os lotes do comitente, tanto os associados a leilões quanto os de Venda Direta.
        *   Filtros por status, tipo (leilão/venda direta), categoria.
        *   Opção de adicionar novo lote (para um leilão existente ou como um item solto que pode ser posteriormente adicionado a um leilão ou oferta de venda direta).
        *   Edição de detalhes do lote (descrição, imagens, preço de reserva - se permitido antes do leilão iniciar).
    *   **Venda Direta (Futuro):**
        *   Interface completa para CRUD de `DirectSaleOffer` pertencentes ao comitente.
        *   Gerenciamento de propostas (aceitar/rejeitar).
        *   Acompanhamento de status das ofertas.
    *   **Financeiro (Futuro):**
        *   Relatórios de vendas: Detalhamento de itens vendidos, valor de venda, data da venda, comissão da plataforma, valor líquido a receber.
        *   Status de Pagamento/Repasse: Indicação de quais vendas já foram pagas pelo comprador e quais valores já foram repassados ao comitente.
        *   Filtros por período.

*   **3.11.5. Layout e Páginas Envolvidas:**
    *   **Layout Geral (`src/app/consignor-dashboard/layout.tsx`):**
        *   Utiliza um layout específico para o painel do comitente.
        *   Inclui uma barra lateral de navegação (`ConsignorSidebar` de `src/components/layout/consignor-sidebar.tsx`).
        *   O `ConsignorSidebar` atualmente possui links para:
            *   `Visão Geral` (`/consignor-dashboard/overview`) - Ativo.
            *   `Meus Leilões` (`/consignor-dashboard/auctions`) - Desabilitado.
            *   `Meus Lotes` (`/consignor-dashboard/lots`) - Desabilitado.
            *   `Venda Direta` (`/consignor-dashboard/direct-sales`) - Desabilitado.
            *   `Financeiro` (`/consignor-dashboard/financials`) - Desabilitado.
            *   `Configurações` (`/consignor-dashboard/settings`) - Desabilitado.
    *   **Página de Visão Geral (`/consignor-dashboard/overview/page.tsx`):**
        *   Atualmente, exibe apenas um título "Consignor Overview Page".
        *   **Futuramente, deveria conter:** Cards de métricas, listas resumidas de leilões/ofertas, alertas.
    *   **Páginas Futuras (Esboço):**
        *   `/consignor-dashboard/auctions`: Tabela/lista de leilões do comitente, com filtros e ações.
        *   `/consignor-dashboard/lots`: Tabela/lista de lotes do comitente, com filtros e ações para adicionar/editar.
        *   `/consignor-dashboard/direct-sales`: Interface para gerenciar `DirectSaleOffer` (similar ao que um admin faria, mas restrito aos itens do comitente).
        *   `/consignor-dashboard/financials`: Seção com tabelas e gráficos para visualização de dados financeiros.
        *   `/consignor-dashboard/settings`: Formulários para o comitente gerenciar informações do seu perfil de vendedor (`SellerProfileInfo`), como dados de contato, informações bancárias para repasse (se aplicável), etc.

*   **3.11.6. Considerações sobre TDD:**
    *   **Testes Unitários:**
        *   Para a página de Visão Geral atual: Testar a renderização do conteúdo placeholder.
        *   **Futuramente:**
            *   Funções utilitárias para calcular métricas do comitente (ex: total de vendas, valor pendente).
            *   Schemas Zod para quaisquer formulários específicos do painel do comitente (ex: configurações do perfil de vendedor).
    *   **Testes de Integração (Server Actions - a serem criadas):**
        *   `getConsignorOverviewData(consignorUserId: string)`: Buscar dados para a visão geral.
        *   `getConsignorAuctions(consignorUserId: string, filters?: any)`: Buscar leilões do comitente.
        *   `getConsignorLots(consignorUserId: string, filters?: any)`: Buscar lotes do comitente.
        *   `getConsignorDirectSaleOffers(consignorUserId: string, filters?: any)`: Buscar ofertas de venda direta do comitente.
        *   `getConsignorFinancialReport(consignorUserId: string, reportParams: any)`: Gerar dados financeiros.
        *   Actions para CRUD de leilões/lotes/ofertas via painel do comitente, respeitando as permissões (`auctions:manage_own`, etc.).
    *   **Testes de UI (Componente):**
        *   Página `overview/page.tsx`: Testar a renderização do conteúdo atual.
        *   **Futuramente:**
            *   Testar a exibição correta das métricas e listas na Visão Geral (com dados mockados).
            *   Testar as tabelas de listagem para "Meus Leilões", "Meus Lotes", "Venda Direta" (com dados mockados e interações de filtro/paginaçãso).
            *   Testar os formulários de criação/edição (se houver interfaces dedicadas no painel do comitente que não reutilizem as de admin).
            *   Testar a interface de relatórios financeiros.
    *   **Testes End-to-End (E2E):**
        *   **Futuramente:**
            *   Login como Comitente -> Acessar o painel -> Verificar a Visão Geral.
            *   Comitente cria um novo lote para um de seus leilões.
            *   Comitente cria uma nova oferta de Venda Direta.
            *   Comitente visualiza suas propostas recebidas e aceita/rejeita uma.
            *   Comitente visualiza um relatório financeiro básico.

### 3.12. Painel de Administração (Admin Dashboard e Listagens)

*   **3.12.1. Descrição Geral:**
    *   O Painel de Administração é o centro de controle da plataforma, acessível apenas por usuários com privilégios administrativos. Ele fornece uma visão geral do sistema e acesso a funcionalidades de gerenciamento de todas as entidades principais, como leilões, lotes, usuários, categorias, perfis de comitentes e leiloeiros, papéis de usuário, biblioteca de mídia e configurações da plataforma.
    *   O objetivo é permitir que os administradores monitorem a saúde do sistema, gerenciem conteúdo, usuários e transações, configurem parâmetros da plataforma e garantam o bom funcionamento geral.

*   **3.12.2. Personas Envolvidas:**
    *   **Administrador da Plataforma:** Usuário com o papel `ADMINISTRATOR` ou que possua a permissão `manage_all` (ou um conjunto granular de permissões administrativas). Responsável por todas as operações de gerenciamento e configuração da plataforma.

*   **3.12.3. Cenários BDD (Gherkin):**
    ```gherkin
    Feature: Painel de Administração (Admin Dashboard e Listagens)
      Como um Administrador da Plataforma
      Eu quero acessar e navegar pelo Painel de Administração
      Para gerenciar e monitorar todos os aspectos do sistema.

      Scenario: Admin acessa o Dashboard Principal do Admin
        Given Estou logado como Administrador "admin_master@example.com"
        When Eu navego para "/admin/dashboard"
        Then Eu devo ver um painel com estatísticas chave da plataforma (ex: "Total de Usuários", "Leilões Ativos", "Vendas Recentes", "Lotes Cadastrados").
        And Eu devo ver atalhos para as principais seções de gerenciamento (ex: "Gerenciar Leilões", "Gerenciar Usuários").
        And (Se `src/app/admin/dashboard/page.tsx` for um placeholder) Eu devo ver uma mensagem "Página Principal do Admin em Desenvolvimento" ou similar.

      Scenario: Admin navega para a listagem de Leilões
        Given Estou logado como Administrador no Painel de Admin
        When Eu clico em "Leilões" no menu lateral (`AdminSidebar`)
        Then Eu sou direcionado para a página "/admin/auctions"
        And Eu devo ver uma tabela (`DataTable`) listando os leilões com colunas como "Título", "Status", "Tipo", "Data de Início", "Nº de Lotes".
        And Deve haver um botão "Novo Leilão" visível.

      Scenario: Admin usa filtro na listagem de Leilões
        Given Estou na página de listagem de Leilões "/admin/auctions"
        And Existem leilões com status "EM_BREVE" e "ABERTO_PARA_LANCES"
        When Eu aplico um filtro para exibir apenas leilões com status "EM_BREVE" (se a UI permitir)
        Then A tabela de leilões deve ser atualizada para mostrar apenas os leilões "EM_BREVE".

      Scenario: Admin clica em um Leilão para editar
        Given Estou na página de listagem de Leilões "/admin/auctions"
        And O leilão "Leilão de Arte Moderna" está listado
        When Eu clico no título ou em um botão "Editar" para o "Leilão de Arte Moderna"
        Then Eu sou direcionado para a página de edição do leilão (ex: "/admin/auctions/[auctionId]/edit").

      Scenario: Admin navega para a listagem de Lotes
        Given Estou logado como Administrador no Painel de Admin
        When Eu clico em "Lotes" no menu lateral
        Then Eu sou direcionado para a página "/admin/lots"
        And Eu devo ver uma tabela listando os lotes com colunas como "Título", "Leilão Associado", "Status", "Preço Atual".
        And Deve haver um botão "Novo Lote" visível.

      Scenario: Admin navega para a listagem de Usuários
        Given Estou logado como Administrador no Painel de Admin
        When Eu clico em "Usuários" no menu lateral
        Then Eu sou direcionado para a página "/admin/users"
        And Eu devo ver uma tabela listando os usuários com colunas como "Nome Completo", "Email", "Papel", "Status Habilitação".
        And Deve haver um botão "Novo Usuário" visível.

      Scenario: Admin navega para a listagem de Categorias de Lote
        Given Estou logado como Administrador no Painel de Admin
        When Eu clico em "Categorias" no menu lateral
        Then Eu sou direcionado para a página "/admin/categories"
        And Eu devo ver uma tabela listando as categorias com colunas como "Nome", "Slug", "Contagem de Itens".
        And Deve haver um botão "Nova Categoria" visível.

      Scenario: Admin navega para a listagem de Perfis de Leiloeiro
        Given Estou logado como Administrador no Painel de Admin
        When Eu clico em "Leiloeiros" no menu lateral
        Then Eu sou direcionado para a página "/admin/auctioneers"
        And Eu devo ver uma tabela listando os perfis de leiloeiro com colunas como "Nome", "Email", "Nº Registro".
        And Deve haver um botão "Novo Leiloeiro" visível.

      Scenario: Admin navega para a listagem de Perfis de Comitente
        Given Estou logado como Administrador no Painel de Admin
        When Eu clico em "Comitentes" no menu lateral
        Then Eu sou direcionado para a página "/admin/sellers"
        And Eu devo ver uma tabela listando os perfis de comitente com colunas como "Nome", "Email", "CNPJ/CPF".
        And Deve haver um botão "Novo Comitente" visível.

      Scenario: Admin navega para a listagem de Papéis de Usuário
        Given Estou logado como Administrador no Painel de Admin
        When Eu clico em "Papéis" no menu lateral
        Then Eu sou direcionado para a página "/admin/roles"
        And Eu devo ver uma tabela listando os papéis com colunas como "Nome", "Descrição".
        And Deve haver um botão "Novo Papel" visível.

      Scenario: Admin navega para a Biblioteca de Mídia
        Given Estou logado como Administrador no Painel de Admin
        When Eu clico em "Mídia" no menu lateral
        Then Eu sou direcionado para a página "/admin/media"
        And Eu devo ver a interface da biblioteca de mídia.
        And Deve haver um botão "Upload" visível.

      Scenario: Admin navega para Configurações da Plataforma
        Given Estou logado como Administrador no Painel de Admin
        When Eu clico em "Configurações" no menu lateral
        Then Eu sou direcionado para a página "/admin/settings"
        And Eu devo ver campos para configurar parâmetros da plataforma (ex: máscaras de ID público, temas).

      Scenario: Verificação de contador na listagem de Usuários
        Given Estou na página de listagem de Usuários "/admin/users"
        And Existem 50 usuários cadastrados que correspondem ao filtro atual (se houver)
        Then Um totalizador na página deve exibir "50 usuários" (ou similar).
    ```

*   **3.12.4. Regras de Negócio e Validações (Foco na Interface de Admin):**
    *   **Acesso ao Painel de Admin:**
        *   Restrito a usuários com papel `ADMINISTRATOR` ou permissão `manage_all`. Acesso a subseções específicas pode ser granularizado por permissões (ex: `users:read`, `auctions:read`), mas geralmente o Admin tem acesso total.
    *   **Dashboard Principal (`/admin/dashboard`):**
        *   A página atual (`src/app/admin/dashboard/page.tsx`) é um placeholder.
        *   **Futuramente, deveria exibir:**
            *   Estatísticas chave: Total de usuários, total de leilões (ativos, encerrados), total de lotes, volume de vendas, novos registros.
            *   Gráficos de tendência (ex: novos usuários por semana, volume de vendas por mês).
            *   Atalhos para seções de gerenciamento mais usadas.
            *   Lista de atividades recentes do sistema ou itens que requerem atenção (ex: documentos pendentes de aprovação).
    *   **Listagens de Entidades (Geral):**
        *   As páginas de listagem (ex: `/admin/auctions`, `/admin/users`) devem usar `DataTable` (ou componente similar) para apresentar os dados de forma organizada.
        *   **Colunas Típicas:** Devem exibir os campos mais relevantes da entidade para identificação e status rápido.
        *   **Busca:** Funcionalidade de busca por campos chave (ex: título de leilão, nome/email de usuário).
        *   **Filtros:** Filtros por campos de status (ex: status do leilão, status de habilitação do usuário), tipo, categoria, etc.
        *   **Ordenação:** Clicar nos cabeçalhos das colunas para ordenar os dados.
        *   **Paginação:** Para lidar com grandes volumes de dados.
        *   **Ações por Linha:** Botões ou menus para "Editar", "Excluir", "Ver Detalhes" para cada item da lista.
        *   **Ações da Página:** Botão "Novo [Entidade]" para ir ao formulário de criação.
    *   **Contadores e Totalizadores:** As listagens devem exibir contagem total de itens (respeitando filtros aplicados).

*   **3.12.5. Layout e Páginas Envolvidas:**
    *   **Layout Geral do Admin (`src/app/admin/layout.tsx`):**
        *   Provê a estrutura base para todas as páginas do painel de administração.
        *   Inclui a `AdminSidebar` para navegação entre as diferentes seções de gerenciamento.
    *   **Barra Lateral de Administração (`AdminSidebar` em `src/components/layout/admin-sidebar.tsx`):**
        *   Contém links de navegação para: Dashboard, Leilões, Lotes, Usuários, Categorias, Leiloeiros, Comitentes, Papéis, Mídia, Configurações, etc.
    *   **Página Principal do Dashboard Admin (`/admin/dashboard/page.tsx`):**
        *   Atualmente, um placeholder. Futuramente, conterá widgets de estatísticas e atalhos.
    *   **Páginas de Listagem de Entidades (ex: `/admin/auctions/page.tsx`, `/admin/users/page.tsx`):**
        *   Tipicamente contêm um título, um botão "Novo [Entidade]", e uma `DataTable` para exibir os registros.
        *   A `DataTable` é configurada com colunas específicas para cada entidade e pode incluir funcionalidades de busca, filtro, ordenação e paginação.
        *   As actions de CRUD (criar, editar, excluir) já foram detalhadas nas seções específicas de cada entidade (3.3 para Leilões, 3.4 para Lotes, 3.8 para Usuários, etc.) e são acessadas a partir dessas listagens.

*   **3.12.6. Considerações sobre TDD:**
    *   **Testes Unitários:**
        *   Para quaisquer funções utilitárias usadas nas páginas de admin (ex: formatação de dados para exibição em tabelas).
        *   Testes para componentes de UI específicos do admin que tenham lógica complexa (ex: um componente de filtro avançado, se existir).
    *   **Testes de Integração (Server Actions):**
        *   Testar as Server Actions que buscam dados para as listagens (ex: `getAuctions`, `getUsersWithRoles`, `getLots`, `getCategories`, etc.).
            *   Mockar o DB adapter.
            *   Verificar se os dados são retornados corretamente, incluindo a aplicação de filtros, ordenação e paginação (se implementados na action).
            *   Testar a contagem total de registros para a paginação.
    *   **Testes de UI (Componente - usando React Testing Library):**
        *   Página `/admin/dashboard/page.tsx`: Testar a renderização do conteúdo atual (placeholder) e, futuramente, dos widgets de estatísticas.
        *   Para cada página de listagem de entidade (ex: `/admin/auctions/page.tsx`):
            *   Testar a renderização da `DataTable` com colunas e dados mockados.
            *   Verificar se os botões de ação ("Novo", "Editar", "Excluir" por linha) estão presentes.
            *   Testar interações com filtros, busca, ordenação e paginação (mockando as server actions de busca para retornar diferentes conjuntos de dados).
        *   `AdminSidebar`: Testar se os links de navegação estão corretos.
    *   **Testes End-to-End (E2E - usando Playwright):**
        *   Login como Administrador.
        *   Navegar para o Admin Dashboard (`/admin/dashboard`).
        *   Navegar para cada uma das principais páginas de listagem (Leilões, Lotes, Usuários, etc.) através da `AdminSidebar`.
        *   Em uma listagem (ex: Leilões):
            *   Verificar se a tabela de dados é carregada.
            *   Aplicar um filtro (se a UI permitir) e verificar se a lista é atualizada.
            *   Clicar em um item para navegar para sua página de edição.
            *   Voltar para a listagem e clicar no botão "Novo" para navegar para o formulário de criação.

### 3.13. Páginas Públicas de Detalhes

Esta seção descreve as páginas públicas que exibem informações detalhadas sobre entidades específicas como Categorias de Lotes, Leiloeiros e Vendedores/Comitentes. Essas páginas são importantes para SEO e para que os usuários explorem o conteúdo da plataforma de forma agrupada.

*   **3.13.1. Página de Detalhes da Categoria (`/category/[categorySlug]`)**
    *   **3.13.1.1. Descrição Geral:**
        *   Exibe informações sobre uma categoria de lote específica e lista os leilões e/ou lotes (ou ofertas de venda direta) ativos pertencentes a essa categoria.
        *   Permite aos usuários descobrir itens de interesse dentro de uma temática específica.
        *   A página é acessada através de um slug da categoria (ex: `/category/veiculos-antigos`).
    *   **3.13.1.2. Personas Envolvidas:**
        *   **Visitante:** Pode visualizar a página para explorar itens em uma categoria.
        *   **Usuário Registrado (Licitante/Comprador):** Mesmo que visitante, mas pode interagir com os lotes/leilões listados (ex: favoritar, dar lance).
    *   **3.13.1.3. Cenários BDD (Gherkin):**
        ```gherkin
        Feature: Página de Detalhes da Categoria
          Como um usuário da plataforma
          Eu quero visualizar uma página dedicada a uma categoria específica
          Para encontrar leilões e lotes de meu interesse agrupados tematicamente.

          Scenario: Usuário acessa uma página de categoria válida
            Given Existe uma categoria "Eletrônicos" com slug "eletronicos"
            And A categoria "Eletrônicos" possui 2 leilões ativos e 5 lotes em venda direta ativos
            When Eu navego para "/category/eletronicos"
            Then Eu devo ver o título "Eletrônicos" como cabeçalho da página
            And (Opcional) Eu devo ver uma descrição da categoria "Eletrônicos"
            And Eu devo ver uma lista de leilões ativos contendo os 2 leilões da categoria "Eletrônicos"
            And Eu devo ver uma lista de lotes/ofertas de venda direta ativos contendo os 5 itens da categoria "Eletrônicos"
            And Cada item listado (leilão/lote) deve ser um card clicável para sua respectiva página de detalhes.

          Scenario: Usuário acessa uma página de categoria com slug inválido/inexistente
            Given Não existe uma categoria com slug "categoria-fantasma"
            When Eu navego para "/category/categoria-fantasma"
            Then Eu devo ver uma mensagem de erro "Categoria não encontrada"
            And (Opcional) Eu posso ser redirecionado para uma página de erro 404 ou para a listagem principal de categorias.

          Scenario: Página de categoria exibe contagem correta de itens
            Given A categoria "Joias Raras" (slug "joias-raras") possui 10 lotes ativos associados
            When Eu acesso a página "/category/joias-raras"
            Then O título da seção de lotes pode indicar "10 itens encontrados em Joias Raras" (ou similar)
            And A lista de lotes deve exibir 10 cards de lote.
        ```
    *   **3.13.1.4. Regras de Negócio e Validações (Foco na Exibição):**
        *   A página é identificada pelo `categorySlug`. O backend (ex: `getLotCategoryBySlug` ou similar) busca a `LotCategory` correspondente.
        *   **Informações da Categoria Exibidas:** `LotCategory.name`, `LotCategory.description` (se houver).
        *   **Listagem de Itens Associados:**
            *   A página deve listar leilões (`Auction`) e/ou lotes individuais (`Lot`) ou ofertas de venda direta (`DirectSaleOffer`) que pertencem à categoria.
            *   Apenas itens com status apropriado (ex: `Auction.status = ABERTO_PARA_LANCES`, `Lot.status = ABERTO_PARA_LANCES`, `DirectSaleOffer.status = ACTIVE`) devem ser exibidos.
            *   A listagem de itens associados pode ser paginada se o volume for grande.
            *   Pode haver filtros básicos disponíveis para os itens listados (ex: tipo de item - leilão, venda direta; faixa de preço).
            *   O componente `CategoryDisplay` (`src/components/category/category-display.tsx`) é usado para renderizar esta página, recebendo dados da categoria e dos itens.
    *   **3.13.1.5. Layout e Páginas Envolvidas:**
        *   Página: `/category/[categorySlug]` (ex: `src/app/category/[categorySlug]/page.tsx`).
        *   Layout: Padrão da aplicação (Header, Footer, Navegação Principal).
        *   Conteúdo:
            *   Título da Categoria.
            *   (Opcional) Descrição da Categoria.
            *   Seção para Leilões da Categoria (lista de `AuctionCard`).
            *   Seção para Lotes/Ofertas de Venda Direta da Categoria (lista de `LotCard` / `DirectSaleOfferCard`).
            *   Paginação para as listas, se aplicável.
    *   **3.13.1.6. Considerações sobre TDD:**
        *   **Testes de Integração (Server Action/Data Fetching):**
            *   Testar a função que busca a categoria pelo slug e seus itens associados (ex: `getCategoryWithItems(slug: string)`).
            *   Mockar o DB adapter.
            *   Cenário de sucesso: Categoria encontrada, retorna dados da categoria e lista de itens ativos filtrados corretamente.
            *   Cenário de falha: Slug não encontrado, retorna erro ou nulo.
        *   **Testes de UI (Componente):**
            *   `CategoryDisplay` e a página `/category/[categorySlug]/page.tsx`:
                *   Testar a renderização correta do nome e descrição da categoria (com dados mockados).
                *   Testar a renderização das listas de `AuctionCard`, `LotCard`, `DirectSaleOfferCard` (com dados mockados).
                *   Testar a exibição de mensagem de "categoria não encontrada" ou "nenhum item encontrado".
                *   Testar interações com paginação e filtros (se houver).
        *   **Testes End-to-End (E2E):**
            *   Navegar para uma página de categoria existente a partir de um link na home ou em outra página.
            *   Verificar se o título da categoria está correto e se os itens listados pertencem à categoria.
            *   Tentar acessar uma URL de categoria com slug inválido e verificar a página de erro.

*   **3.13.2. Página de Detalhes do Leiloeiro (`/auctioneers/[auctioneerSlug]`)**
    *   **3.13.2.1. Descrição Geral:**
        *   Apresenta informações públicas sobre um leiloeiro específico, incluindo seu nome, descrição, informações de contato (se públicas), e uma lista dos leilões (ativos e possivelmente passados) conduzidos por ele.
        *   Permite que usuários conheçam mais sobre os leiloeiros atuantes na plataforma e acessem seus leilões.
        *   A página é acessada via slug do leiloeiro (ex: `/auctioneers/leiloeiro-joao-silva`).
    *   **3.13.2.2. Personas Envolvidas:**
        *   **Visitante:** Pode visualizar a página para conhecer o leiloeiro e seus leilões.
        *   **Usuário Registrado (Licitante/Comprador):** Mesmo que visitante, mas pode interagir com os leilões listados.
    *   **3.13.2.3. Cenários BDD (Gherkin):**
        ```gherkin
        Feature: Página de Detalhes do Leiloeiro
          Como um usuário da plataforma
          Eu quero visualizar uma página dedicada a um leiloeiro específico
          Para conhecer mais sobre ele e seus leilões.

          Scenario: Usuário acessa uma página de leiloeiro válida
            Given Existe um leiloeiro "João Silva Leiloeiro" com slug "joao-silva-leiloeiro"
            And "João Silva Leiloeiro" possui 3 leilões ativos e 5 leilões encerrados
            When Eu navego para "/auctioneers/joao-silva-leiloeiro"
            Then Eu devo ver o nome "João Silva Leiloeiro" como título ou cabeçalho
            And Eu devo ver a descrição, logo e informações de contato (se disponíveis) de "João Silva Leiloeiro"
            And Eu devo ver uma lista de leilões ativos contendo os 3 leilões ativos de "João Silva Leiloeiro"
            And (Opcional) Eu devo ver uma seção ou filtro para visualizar seus 5 leilões encerrados.

          Scenario: Usuário acessa uma página de leiloeiro com slug inválido/inexistente
            Given Não existe um leiloeiro com slug "leiloeiro-fantasma"
            When Eu navego para "/auctioneers/leiloeiro-fantasma"
            Then Eu devo ver uma mensagem de erro "Leiloeiro não encontrado"
            And (Opcional) Eu posso ser redirecionado para uma página de erro 404 ou para a lista de leiloeiros.
        ```
    *   **3.13.2.4. Regras de Negócio e Validações (Foco na Exibição):**
        *   A página é identificada pelo `auctioneerSlug`. O backend busca o `AuctioneerProfileInfo` correspondente.
        *   **Informações do Leiloeiro Exibidas:** `AuctioneerProfileInfo.name`, `AuctioneerProfileInfo.description`, `AuctioneerProfileInfo.logoUrl`, `AuctioneerProfileInfo.contactName`, `AuctioneerProfileInfo.email`, `AuctioneerProfileInfo.phone`, `AuctioneerProfileInfo.website` (campos públicos).
        *   **Listagem de Leilões Associados:**
            *   Lista os leilões (`Auction`) onde `Auction.auctioneerId` corresponde ao ID do leiloeiro.
            *   Pode haver abas ou filtros para separar leilões "Ativos/Em Breve" de "Encerrados".
            *   A listagem deve ser paginada.
    *   **3.13.2.5. Layout e Páginas Envolvidas:**
        *   Página: `/auctioneers/[auctioneerSlug]` (ex: `src/app/auctioneers/[auctioneerSlug]/page.tsx`).
        *   Layout: Padrão da aplicação.
        *   Conteúdo:
            *   Seção de Perfil do Leiloeiro (com nome, logo, descrição, contatos).
            *   Seção de Listagem de Leilões (com `AuctionCard`), possivelmente com abas/filtros para status.
            *   Paginação para a lista de leilões.
    *   **3.13.2.6. Considerações sobre TDD:**
        *   **Testes de Integração (Server Action/Data Fetching):**
            *   Testar a função que busca o perfil do leiloeiro e seus leilões associados (ex: `getAuctioneerProfileWithAuctions(slug: string)`).
            *   Mockar DB adapter.
            *   Cenário de sucesso: Retorna dados do leiloeiro e lista de leilões (ativos/encerrados).
            *   Cenário de falha: Slug não encontrado.
        *   **Testes de UI (Componente):**
            *   Página `/auctioneers/[auctioneerSlug]/page.tsx`:
                *   Testar a renderização correta das informações do perfil do leiloeiro.
                *   Testar a renderização da lista de `AuctionCard`.
                *   Testar mensagem de "leiloeiro não encontrado".
        *   **Testes End-to-End (E2E):**
            *   Navegar para uma página de leiloeiro a partir de um link em um leilão.
            *   Verificar se os dados do leiloeiro e a lista de seus leilões estão corretos.
            *   Acessar URL de leiloeiro inválido.

*   **3.13.3. Página de Detalhes do Vendedor/Comitente (`/sellers/[sellerSlugOrId]`)**
    *   **3.13.3.1. Descrição Geral:**
        *   Apresenta informações públicas sobre um vendedor/comitente específico, como nome, descrição (se houver), e uma lista dos leilões ou ofertas de venda direta associados a ele.
        *   Permite que usuários conheçam os vendedores e explorem todos os itens que eles estão oferecendo na plataforma.
        *   A página é acessada via slug ou ID público do vendedor (ex: `/sellers/grande-empresa-vendas` ou `/sellers/sellerPublicId123`). O uso de `sellerId` (que pode ser o `publicId`) é visto em `src/app/sellers/[sellerId]/page.tsx`.
    *   **3.13.3.2. Personas Envolvidas:**
        *   **Visitante:** Pode visualizar a página para conhecer o vendedor e seus itens.
        *   **Usuário Registrado (Licitante/Comprador):** Mesmo que visitante, mas pode interagir com os itens listados.
    *   **3.13.3.3. Cenários BDD (Gherkin):**
        ```gherkin
        Feature: Página de Detalhes do Vendedor/Comitente
          Como um usuário da plataforma
          Eu quero visualizar uma página dedicada a um vendedor/comitente específico
          Para conhecer mais sobre ele e todos os itens que ele está vendendo.

          Scenario: Usuário acessa uma página de vendedor válida
            Given Existe um vendedor "Loja de Antiguidades XYZ" com ID público "sellerXYZ"
            And "Loja de Antiguidades XYZ" possui 2 leilões ativos e 3 ofertas de venda direta ativas
            When Eu navego para "/sellers/sellerXYZ"
            Then Eu devo ver o nome "Loja de Antiguidades XYZ" como título ou cabeçalho
            And Eu devo ver a descrição e logo (se disponíveis) de "Loja de Antiguidades XYZ"
            And Eu devo ver uma lista de leilões ativos contendo os 2 leilões de "Loja de Antiguidades XYZ"
            And Eu devo ver uma lista de ofertas de venda direta ativas contendo as 3 ofertas de "Loja de Antiguidades XYZ".

          Scenario: Usuário acessa uma página de vendedor com ID inválido/inexistente
            Given Não existe um vendedor com ID "vendedor-fantasma-id"
            When Eu navego para "/sellers/vendedor-fantasma-id"
            Then Eu devo ver uma mensagem de erro "Vendedor não encontrado"
            And (Opcional) Eu posso ser redirecionado para uma página de erro 404.
        ```
    *   **3.13.3.4. Regras de Negócio e Validações (Foco na Exibição):**
        *   A página é identificada pelo `sellerId` (que é o `publicId` do `SellerProfileInfo`). O backend busca o `SellerProfileInfo` correspondente.
        *   **Informações do Vendedor Exibidas:** `SellerProfileInfo.name`, `SellerProfileInfo.description`, `SellerProfileInfo.logoUrl`, e outros campos públicos conforme definido em `BUSINESS_RULES.md`.
        *   **Listagem de Itens Associados:**
            *   Lista leilões (`Auction`) onde `Auction.sellerId` corresponde ao ID do vendedor.
            *   Lista ofertas de venda direta (`DirectSaleOffer`) onde `DirectSaleOffer.sellerId` corresponde ao ID do vendedor.
            *   Apenas itens com status apropriado (ativos) devem ser exibidos.
            *   As listagens podem ser paginadas.
    *   **3.13.3.5. Layout e Páginas Envolvidas:**
        *   Página: `/sellers/[sellerId]` (ex: `src/app/sellers/[sellerId]/page.tsx`).
        *   Layout: Padrão da aplicação.
        *   Conteúdo:
            *   Seção de Perfil do Vendedor (nome, logo, descrição, etc.).
            *   Seção para Leilões do Vendedor (lista de `AuctionCard`).
            *   Seção para Ofertas de Venda Direta do Vendedor (lista de `DirectSaleOfferCard`).
            *   Paginação para as listas, se aplicável.
    *   **3.13.3.6. Considerações sobre TDD:**
        *   **Testes de Integração (Server Action/Data Fetching):**
            *   Testar a função que busca o perfil do vendedor e seus itens associados (ex: `getSellerProfileWithItems(sellerId: string)`).
            *   Mockar DB adapter.
            *   Cenário de sucesso: Retorna dados do vendedor e listas de leilões/ofertas ativas.
            *   Cenário de falha: ID não encontrado.
        *   **Testes de UI (Componente):**
            *   Página `/sellers/[sellerId]/page.tsx`:
                *   Testar a renderização correta das informações do perfil do vendedor.
                *   Testar a renderização das listas de `AuctionCard` e `DirectSaleOfferCard`.
                *   Testar mensagem de "vendedor não encontrado".
        *   **Testes End-to-End (E2E):**
            *   Navegar para uma página de vendedor a partir de um link (ex: em um lote ou leilão).
            *   Verificar se os dados do vendedor e a lista de seus itens estão corretos.
            *   Acessar URL de vendedor inválido.

### 3.14. Página Principal de Busca e Filtros (`/search`)

*   **3.14.1. Descrição Geral:**
    *   A página de Busca e Filtros (`/search`) é a principal interface para que os usuários encontrem leilões, lotes e ofertas de venda direta na plataforma. Ela permite a busca por termos textuais e a aplicação de múltiplos filtros combinados (categoria, tipo de item, status, faixa de preço, localização, etc.) para refinar os resultados. Os resultados são exibidos de forma paginada e podem ser ordenados por diferentes critérios.
    *   O objetivo é fornecer uma ferramenta poderosa e flexível para que os usuários descubram rapidamente os itens de seu interesse entre todos os disponíveis na plataforma.

*   **3.14.2. Personas Envolvidas:**
    *   **Visitante:** Pode usar a página de busca para explorar os itens disponíveis publicamente.
    *   **Usuário Registrado (Licitante/Comprador):** Mesma funcionalidade do visitante, mas com a capacidade de interagir com os resultados (ex: favoritar, ir para a página do lote para dar lance).

*   **3.14.3. Cenários BDD (Gherkin):**
    ```gherkin
    Feature: Página Principal de Busca e Filtros
      Como um usuário da plataforma
      Eu quero poder buscar e filtrar itens (leilões, lotes, vendas diretas)
      Para encontrar rapidamente o que me interessa.

      Scenario: Usuário realiza uma busca por termo textual
        Given Estou na página "/search"
        And Existem itens (leilões, lotes) contendo o termo "raro" em seus títulos ou descrições
        When Eu preencho o campo de busca principal com "raro"
        And Eu clico no botão "Buscar" (ou a busca é automática ao digitar)
        Then Eu devo ver uma lista de resultados contendo itens com o termo "raro"
        And Os resultados podem ser uma mistura de `AuctionCard`, `LotCard` e `DirectSaleOfferCard`.

      Scenario: Usuário aplica filtro de categoria
        Given Estou na página "/search"
        And Existem itens na categoria "Veículos" e "Móveis"
        When Eu seleciono a categoria "Veículos" no filtro de categorias
        Then A lista de resultados deve ser atualizada para mostrar apenas itens da categoria "Veículos".

      Scenario: Usuário aplica filtro de tipo de item (Leilões)
        Given Estou na página "/search"
        And Existem leilões e ofertas de venda direta
        When Eu seleciono o filtro "Tipo de Item" para "Leilões"
        Then A lista de resultados deve mostrar apenas `AuctionCard` (ou `LotCard` de leilões).

      Scenario: Usuário aplica filtro de tipo de item (Venda Direta)
        Given Estou na página "/search"
        When Eu seleciono o filtro "Tipo de Item" para "Venda Direta"
        Then A lista de resultados deve mostrar apenas `DirectSaleOfferCard`.

      Scenario: Usuário aplica filtro de status do item (Ex: "Abertos para Lances")
        Given Estou na página "/search"
        When Eu seleciono o filtro "Status" para "Abertos para Lances"
        Then A lista de resultados deve mostrar apenas lotes/leilões com status "ABERTO_PARA_LANCES".

      Scenario: Usuário aplica filtro de faixa de preço
        Given Estou na página "/search"
        When Eu defino o filtro de "Faixa de Preço" entre "R$ 100,00" e "R$ 500,00"
        Then A lista de resultados deve mostrar apenas itens cujo preço atual (ou lance inicial) esteja entre R$ 100,00 e R$ 500,00.

      Scenario: Usuário aplica filtro de localização (Estado e Cidade)
        Given Estou na página "/search"
        And Existem itens localizados em "São Paulo - SP" e "Rio de Janeiro - RJ"
        When Eu seleciono "SP" no filtro de "Estado"
        And Eu seleciono "São Paulo" no filtro de "Cidade" (após selecionar o estado)
        Then A lista de resultados deve mostrar apenas itens localizados em "São Paulo - SP".

      Scenario: Usuário combina múltiplos filtros (Termo, Categoria e Preço)
        Given Estou na página "/search"
        When Eu preencho o campo de busca com "notebook"
        And Eu seleciono a categoria "Eletrônicos"
        And Eu defino a faixa de preço até "R$ 3000,00"
        Then A lista de resultados deve mostrar apenas notebooks eletrônicos com preço até R$ 3000,00.

      Scenario: Usuário ordena os resultados por "Preço Crescente"
        Given Estou na página "/search" com uma lista de resultados
        When Eu seleciono a opção de ordenação "Preço: Menor para Maior"
        Then A lista de resultados deve ser reordenada, mostrando os itens mais baratos primeiro.

      Scenario: Usuário ordena os resultados por "Data de Encerramento Mais Próxima"
        Given Estou na página "/search" com uma lista de resultados (lotes/leilões)
        When Eu seleciono a opção de ordenação "Encerramento: Mais Próximo"
        Then A lista de resultados deve ser reordenada, mostrando os itens com data de encerramento mais próxima primeiro.

      Scenario: Paginação dos resultados da busca
        Given Estou na página "/search"
        And Minha busca/filtros retornaram 50 itens, e a página exibe 12 itens por página
        Then Eu devo ver 12 itens na primeira página de resultados
        And Eu devo ver controles de paginação (ex: "Página 1 de 5", "Próxima", "Anterior").
        When Eu clico em "Próxima"
        Then Eu devo ver os próximos 12 itens (da página 2).

      Scenario: Busca sem resultados
        Given Estou na página "/search"
        When Eu busco pelo termo "termoinexistente123xyz" que não corresponde a nenhum item
        Then Eu devo ver uma mensagem "Nenhum item encontrado para sua busca."
        And (Opcional) Sugestões para refazer a busca podem ser exibidas.

      Scenario: Filtros são mantidos na URL (para compartilhamento e recarga)
        Given Estou na página "/search"
        When Eu busco por "carro" e filtro pela categoria "Veículos" e estado "SP"
        Then A URL deve ser atualizada para refletir esses parâmetros (ex: "/search?term=carro&category=veiculos&state=SP")
        When Eu recarrego a página com essa URL
        Then Os campos de busca e filtros devem ser preenchidos com "carro", "Veículos", "SP"
        And Os resultados correspondentes devem ser exibidos.
    ```

*   **3.14.4. Regras de Negócio e Validações:**
    *   **Parâmetros de Busca e Filtro (Query Params na URL, ex: `searchParams`):**
        *   `term` (string): Termo de busca textual. A busca deve ser feita em campos relevantes como `Lot.title`, `Lot.description`, `Auction.title`, `Auction.description`, `DirectSaleOffer.title`, `DirectSaleOffer.description`.
        *   `category` (string - slug ou ID): Filtra por `LotCategory`.
        *   `itemType` (enum: 'auction', 'lot', 'direct_sale'): Filtra pelo tipo principal do item.
        *   `status` (string ou enum: `AuctionStatus` / `LotStatus` / `DirectSaleOfferStatus`): Filtra pelo status do item (ex: 'ABERTO_PARA_LANCES', 'EM_BREVE', 'ACTIVE').
        *   `minPrice`, `maxPrice` (number): Filtra pela faixa de preço atual do lote/oferta.
        *   `state` (string - UF): Filtra por estado de localização do lote/leilão.
        *   `city` (string): Filtra por cidade de localização.
        *   `auctioneerId` (string): Filtra por leiloeiro.
        *   `sellerId` (string): Filtra por comitente/vendedor.
        *   `sortBy` (enum: 'relevance', 'price_asc', 'price_desc', 'end_date_asc', 'creation_date_desc'): Define a ordenação dos resultados.
        *   `page` (number): Para paginação.
    *   **Lógica de Busca no Backend (Server Action `searchItems`):**
        *   A action recebe os `searchParams` e constrói uma query complexa para o banco de dados.
        *   Deve ser capaz de buscar em múltiplas entidades (Leilões, Lotes, Ofertas de Venda Direta) ou em uma visão unificada, se existir.
        *   A busca textual (`term`) deve usar funcionalidades de full-text search do banco de dados, se possível, ou `LIKE` com cuidado para performance.
        *   A combinação de filtros deve ser feita com lógica `AND`.
        *   Apenas itens "públicos" e com status apropriados (ex: não mostrar lotes 'VENDIDO' em uma busca padrão, a menos que um filtro específico seja aplicado).
    *   **Resultados da Busca:**
        *   A action retorna uma lista paginada de itens que podem ser uma mistura de `Auction`, `Lot`, `DirectSaleOffer` (ou um tipo unificado `SearchResultItem`).
        *   Inclui informações de paginação (total de itens, total de páginas, página atual).
    *   **Atualização da UI:** Os filtros selecionados na UI devem atualizar os `searchParams` na URL, e a mudança na URL (ou nos `searchParams` diretamente) deve disparar uma nova busca.

*   **3.14.5. Layout e Páginas Envolvidas:**
    *   **Página Principal (`/search` - ex: `src/app/search/page.tsx`):**
        *   Layout: Padrão da aplicação.
        *   **Elementos de UI Chave:**
            *   **Barra de Busca Principal:** Campo de texto grande para o `term`.
            *   **Painel de Filtros (Sidebar ou Dropdowns):**
                *   Seleção de Categoria (lista de `LotCategory`).
                *   Seleção de Tipo de Item (Leilões, Lotes, Venda Direta).
                *   Seleção de Status (Abertos, Em Breve, Encerrados - dependendo do tipo de item).
                *   Sliders ou campos de entrada para Faixa de Preço.
                *   Selects para Estado e Cidade (cidade é dependente do estado).
                *   (Opcional) Selects para Leiloeiro, Vendedor.
                *   Botão "Aplicar Filtros" (ou aplicação automática ao mudar).
                *   Botão "Limpar Filtros".
            *   **Área de Resultados:**
                *   Contagem de resultados encontrados.
                *   Dropdown para Ordenação (`sortBy`).
                *   Grade ou lista de cards (`AuctionCard`, `LotCard`, `DirectSaleOfferCard`).
                *   Controles de Paginação.
                *   Mensagem de "Nenhum item encontrado".
    *   **Componentes Reutilizáveis:**
        *   `AuctionCard`, `LotCard`, `DirectSaleOfferCard`.
        *   Componentes de filtro (selects, sliders de preço).
        *   Componente de paginação.

*   **3.14.6. Considerações sobre TDD:**
    *   **Testes Unitários:**
        *   Funções utilitárias para construir query strings a partir de objetos de filtro.
        *   Funções para validar ou normalizar parâmetros de busca (ex: `minPrice` não pode ser maior que `maxPrice`).
        *   Lógica de componentes de filtro isolados.
    *   **Testes de Integração (Server Action `searchItems`):**
        *   Mockar o DB adapter.
        *   Testar a action com diversos cenários de `searchParams`:
            *   Apenas `term`.
            *   Apenas filtros (categoria, preço, etc.).
            *   Combinação de `term` e múltiplos filtros.
            *   Diferentes opções de `sortBy`.
            *   Paginação (pedir página 2, verificar offset/limit na query ao adapter).
            *   Verificar se a estrutura de retorno (lista de itens, dados de paginação) está correta.
            *   Testar com `searchParams` que não resultariam em nenhum item.
    *   **Testes de UI (Componente - página `/search/page.tsx`):**
        *   Testar a renderização inicial da página (filtros vazios, sem resultados ou resultados iniciais se houver uma busca padrão).
        *   Interação com o campo de busca textual: digitar termo, submeter (mockando a action `searchItems` para retornar resultados esperados).
        *   Interação com cada tipo de filtro:
            *   Selecionar categoria -> verificar se a action `searchItems` é chamada com o parâmetro correto.
            *   Ajustar faixa de preço -> verificar parâmetros.
            *   Mudar ordenação -> verificar parâmetro.
        *   Testar a exibição dos resultados (cards corretos) com base nos dados mockados retornados pela action.
        *   Testar a paginação (clicar em "Próxima" e verificar se a action é chamada com o novo número de página).
        *   Testar a exibição da mensagem "Nenhum item encontrado".
        *   Verificar se a URL é atualizada corretamente ao aplicar filtros e busca.
    *   **Testes End-to-End (E2E):**
        *   Navegar para `/search`.
        *   Realizar uma busca textual e verificar se os resultados são relevantes.
        *   Aplicar um filtro de categoria e verificar se os resultados são filtrados.
        *   Aplicar um filtro de faixa de preço.
        *   Combinar termo e filtros.
        *   Mudar a ordenação e verificar se a ordem dos resultados muda.
        *   Navegar entre páginas de resultados.
        *   Limpar os filtros e verificar se a busca é resetada.
        *   Copiar a URL com filtros, abrir em nova aba e verificar se os filtros são restaurados.

## 4. Dicionário de Dados Global

Para um dicionário de dados completo e detalhado de cada entidade mencionada neste documento, incluindo todos os campos, tipos de dados, descrições, regras de validação e observações relevantes, por favor, **consulte o arquivo `BUSINESS_RULES.md`**. Este arquivo é a fonte primária e mais atualizada para a estrutura de dados da plataforma.

As principais entidades, cujos dicionários de dados podem ser encontrados no `BUSINESS_RULES.md`, incluem (mas não se limitam a):

*   **`UserProfileData`**: Informações do perfil do usuário (Veja Seção 2 do `BUSINESS_RULES.md`).
*   **`Role`**: Papéis de usuário e suas permissões (Veja Seção 3 do `BUSINESS_RULES.md`).
*   **`UserDocument`** e **`DocumentType`**: Documentos de habilitação de usuário (Veja Seção 4 do `BUSINESS_RULES.md`).
*   **`Auction`** e **`AuctionStage`**: Detalhes de leilões e seus estágios (Veja Seção 5 do `BUSINESS_RULES.md`).
*   **`Lot`**: Detalhes de lotes dentro de um leilão (Veja Seção 6 do `BUSINESS_RULES.md`).
*   **`BidInfo`** e **`UserBid`**: Informações sobre lances (Veja Seção 7 do `BUSINESS_RULES.md`).
*   **`UserWin`**: Informações sobre arremates (Veja Seção 8 do `BUSINESS_RULES.md`).
*   **`SellerProfileInfo`**: Perfis de comitentes/vendedores (Veja Seção 9 do `BUSINESS_RULES.md`).
*   **`AuctioneerProfileInfo`**: Perfis de leiloeiros (Veja Seção 10 do `BUSINESS_RULES.md`).
*   **`DirectSaleOffer`**: Ofertas de venda direta (Veja Seção 11 do `BUSINESS_RULES.md`).
*   **`MediaItem`**: Itens da biblioteca de mídia (Veja Seção 12 do `BUSINESS_RULES.md`).
*   **`LotCategory`**, **`StateInfo`**, **`CityInfo`**: Dados de categorização e geográficos (Veja Seção 14 do `BUSINESS_RULES.md`).
*   **`PlatformSettings`**: Configurações globais da plataforma (Veja Seção 14 do `BUSINESS_RULES.md`).

A consulta ao `BUSINESS_RULES.md` é essencial para um entendimento completo da modelagem de dados do sistema.

## 5. Arquitetura Geral da Interface (Layouts Globais e Navegação)

*   **5.1. Layout Principal (App):**
    *   [Esta seção deve descrever o layout base da aplicação que é compartilhado entre a maioria das páginas públicas e de usuário. Incluir:
        *   **Header Global:** Com logo, campo de busca principal, links de navegação (ex: Leilões, Venda Direta, Como Funciona), e o componente `UserNav` para acesso ao perfil/login.
        *   **Área de Conteúdo Principal:** Onde o conteúdo específico de cada página é renderizado.
        *   **Footer Global:** Com links institucionais (ex: Sobre Nós, Termos de Uso, Política de Privacidade), informações de contato, e direitos autorais.
        *   Considerar responsividade e como o layout se adapta a diferentes tamanhos de tela.]
    *   [Um wireframe ou mockup de baixo/médio nível seria útil aqui para ilustrar a disposição dos elementos.]
*   **5.2. Layout do Painel Administrativo (`/admin`):**
    *   [Descrição do layout específico para a área administrativa:
        *   **`AdminSidebar`:** Barra lateral persistente com links para todas as seções de gerenciamento (Dashboard Admin, Leilões, Lotes, Usuários, Categorias, etc.).
        *   **Header do Admin (opcional):** Pode conter o nome do usuário administrador, notificações específicas do admin, ou um breadcrumb da seção atual. Se não houver header específico, o header global pode ser adaptado.
        *   **Área de Conteúdo do Admin:** Onde as tabelas de dados, formulários de gerenciamento e dashboards específicos do admin são renderizados.]
    *   [Wireframe/Mockup da estrutura do painel administrativo.]
*   **5.3. Layout do Dashboard do Usuário (`/dashboard` e `/consignor-dashboard`):**
    *   [Descrição da estrutura dos painéis de usuário:
        *   **Navegação do Dashboard:** Geralmente uma barra lateral (`DashboardNav` para usuários, `ConsignorSidebar` para comitentes) com links para as subseções (Visão Geral, Meus Lances, Meus Documentos, etc.).
        *   **Header:** Pode ser o header global da aplicação ou um header simplificado específico para o contexto do dashboard.
        *   **Área de Conteúdo do Dashboard:** Onde o conteúdo de cada subseção do painel é exibido.]
    *   [Wireframe/Mockup da estrutura dos dashboards de usuário.]
*   **5.4. Navegação Principal:**
    *   [Detalhar a estrutura e os itens do menu de navegação principal (geralmente no Header Global):
        *   **Visitantes Não Autenticados:** Links como "Leilões", "Vendas Diretas", "Categorias", "Como Funciona", "Login", "Cadastre-se".
        *   **Usuários Autenticados:** Similar ao visitante, mas "Login" e "Cadastre-se" são substituídos pelo `UserNav` (menu do usuário com links para "Meu Painel", "Minha Conta", "Sair"). Links para painéis específicos (ex: "Painel do Comitente") podem aparecer aqui se o usuário tiver o papel correspondente.]
*   **5.5. Componentes Reutilizáveis Chave:**
    *   [Listar e descrever brevemente os principais componentes de UI que são reutilizados em várias partes da plataforma, promovendo consistência visual e funcional. Exemplos:
        *   **`AuctionCard`**: Componente para exibir informações resumidas de um leilão em listagens.
        *   **`LotCard`**: Componente para exibir informações resumidas de um lote.
        *   **`DirectSaleOfferCard`**: Componente para exibir informações resumidas de uma oferta de venda direta.
        *   **`DataTable`**: Componente genérico para exibir dados tabulares com funcionalidades de busca, filtro, ordenação e paginação (usado extensivamente no painel de admin).
        *   **Modais Padrão:** Para confirmações, diálogos de seleção (ex: `ChooseMediaDialog`).
        *   **Botões Padrão:** Estilos consistentes para botões de ação primária, secundária, etc.
        *   **Campos de Formulário Padronizados:** Inputs, selects, checkboxes com estilização e validação consistentes (ShadCN UI).
        *   **`BiddingPanel`**: Componente para entrada de lances.
        *   **`UserNav`**: Menu de navegação do usuário no header.]
    *   [Referenciar a biblioteca de componentes (ex: ShadCN UI) e quaisquer guias de estilo ou design systems internos, se existirem.]

## 6. Considerações Gerais sobre TDD na Plataforma

*   **6.1. Testes Unitários:**
    *   **Foco:** Testar a menor unidade de código isoladamente. Ideal para funções puras, lógica de negócios complexa dentro de componentes ou serviços, schemas de validação (ex: Zod), e hooks customizados React.
    *   **Objetivo:** Garantir que cada unidade funcione conforme esperado, independentemente de suas dependências.
    *   **Ferramentas:** Jest, React Testing Library (para hooks e componentes simples).
    *   **Exemplos:**
        *   Validar um schema Zod para um formulário com entradas corretas e incorretas.
        *   Testar uma função utilitária que formata datas ou calcula valores.
        *   Testar um hook customizado que gerencia um estado local complexo.
*   **6.2. Testes de Integração (Server Actions e Componentes Compostos):**
    *   **Foco:** Testar a interação entre diferentes unidades de código. Para Server Actions, isso significa testar a action em si, mockando apenas as dependências mais externas (ex: o adaptador do banco de dados, SDKs de serviços externos como Firebase Auth). Para componentes, testar a interação entre um componente pai e seus filhos, ou um componente que utiliza server actions.
    *   **Objetivo:** Verificar se as diferentes partes do sistema colaboram corretamente.
    *   **Ferramentas:** Jest (para Server Actions), React Testing Library (para componentes que chamam actions).
    *   **Exemplos:**
        *   Testar uma Server Action que recebe dados, valida, chama o DB adapter para persistir os dados, e retorna uma resposta.
        *   Testar um formulário React que, ao ser submetido, chama uma Server Action mockada e reage corretamente à resposta (sucesso ou erro).
*   **6.3. Testes End-to-End (E2E):**
    *   **Foco:** Simular fluxos de usuário completos através da interface gráfica, como se um usuário real estivesse interagindo com a aplicação em um navegador.
    *   **Objetivo:** Validar a integração de todas as camadas da aplicação (frontend, backend, banco de dados em ambiente de teste) e garantir que os principais fluxos de usuário funcionem de ponta a ponta.
    *   **Ferramentas:** Playwright.
    *   **Exemplos:**
        *   Fluxo de registro de usuário: preencher formulário, submeter, verificar redirecionamento e (se possível) criação do usuário no DB de teste.
        *   Fluxo de login: inserir credenciais válidas/inválidas e verificar comportamento.
        *   Fluxo de criação de leilão: preencher formulário de leilão, adicionar lotes, publicar.
        *   Fluxo de lance: encontrar um lote, dar um lance, verificar atualização do status.
*   **6.4. Cobertura de Teste:**
    *   **Metas:** Definir metas de cobertura de código (ex: 80% para testes unitários em lógica de negócios crítica, 70% para testes de integração de Server Actions). As metas podem variar por tipo de teste e criticidade do módulo.
    *   **Estratégia:** Focar em testar a lógica de negócios, validações, e os caminhos mais críticos e complexos. Não buscar 100% de cobertura cegamente, mas sim garantir que as partes mais importantes e propensas a erro estejam bem testadas.
    *   **Monitoramento:** Usar ferramentas de cobertura de teste integradas ao processo de CI/CD para acompanhar o progresso e identificar áreas não testadas.
*   **6.5. Ambiente de Teste:**
    *   **Banco de Dados de Teste:** Utilizar um banco de dados separado para testes E2E e, possivelmente, para alguns testes de integração. Este banco deve ser resetável e poder ser semeado com dados consistentes (`seed data`) antes da execução dos testes.
    *   **Mocking de Serviços Externos:** Para testes unitários e de integração, serviços externos (gateways de pagamento, APIs de terceiros) devem ser mockados para evitar dependência e instabilidade.
    *   **CI/CD:** Integrar a execução de todos os tipos de testes no pipeline de Integração Contínua/Entrega Contínua para garantir que novas alterações não quebrem funcionalidades existentes.

---
Este esqueleto servirá como base para o detalhamento das especificações.
