# Plataforma de Leilões BidExpert

Bem-vindo ao projeto BidExpert, uma plataforma de leilões full-stack construída com Next.js, Prisma, e Genkit.

## Estrutura do Projeto

O projeto segue uma arquitetura MVC com uma camada de serviço e repositório para garantir a separação de responsabilidades e a manutenibilidade.

-   `src/app`: Rotas da aplicação (App Router).
-   `src/app/admin`: Painel de administração.
-   `src/services`: Lógica de negócio da aplicação.
-   `src/repositories`: Camada de acesso a dados usando Prisma.
-   `src/components`: Componentes React reutilizáveis.
-   `prisma`: Schema do banco de dados.
-   `tests`: Testes de integração e end-to-end.
-   `tests/ui`: Testes de interface do usuário com Playwright.

## Funcionalidades da Plataforma

Para um entendimento detalhado de todas as funcionalidades, regras de negócio e o progresso atual do projeto, é essencial ler os arquivos de documentação na pasta `/home/user/studio/context`. Eles servem como a fonte da verdade para o que a plataforma faz e como ela deve se comportar.

## Como Executar os Testes

Para garantir a qualidade e a estabilidade do código, siga a ordem de execução abaixo.

### 1. Preparar o Banco de Dados

Este comando irá garantir que o schema do seu banco de dados está atualizado com a versão mais recente definida em `prisma/schema.prisma`.

```bash
npm run db:push
```

### 2. Popular com Dados de Amostra

Este comando executa o script `seed-db-sample-data.ts`, que preenche o banco de dados com um conjunto rico de dados de exemplo (leilões, lotes, usuários, etc.), criando um ambiente realista para os testes.

```bash
npm run db:seed:samples
```
*Nota: O comando `db:push` já executa o `db:seed` para dados essenciais, mas o `db:seed:samples` é necessário para os dados de teste E2E.*

### 3. Executar Testes de Integração e E2E (Vitest)

Este comando roda todos os testes de lógica de negócio, serviços e server actions localizados na pasta `tests/`.

```bash
npm run test
```

Para rodar um arquivo de teste específico:
```bash
npx vitest run tests/bidding-e2e.test.ts
```

### 4. Executar Testes de Interface do Usuário (Playwright)

Este comando inicia o Playwright para executar os testes de UI localizados na pasta `tests/ui/`. Ele simulará a interação do usuário diretamente no navegador.

```bash
npm run test:ui
```

Para ver os resultados dos testes de UI, você pode abrir o relatório gerado pelo Playwright:
```bash
npx playwright show-report
```

---

Seguir esta ordem garante que cada conjunto de testes execute em um ambiente previsível e corretamente configurado.
