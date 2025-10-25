# Refactoring de Chaves Primárias para BigInt

Este arquivo documenta o processo de refatoração das chaves primárias (PKs) de todas as tabelas do banco de dados de `String` com `cuid()` para `BigInt` com `autoincrement()`.

## Plano de Ação

1.  **Modificar o Schema Prisma:**
    *   [x] Alterar o tipo de todos os campos `id` para `BigInt @id @default(autoincrement())`.
    *   [x] Alterar o tipo de todos os campos de chave estrangeira (FK) para `BigInt`.

2.  **Atualizar o Código-Fonte:**
    *   [ ] Percorrer todo o projeto e atualizar todas as funções e tipos que manipulam os campos de ID para usar `number` ou `bigint` em vez de `string`.
    *   [ ] Prestar atenção especial a `services`, `repositories`, `actions` e componentes de UI que usam IDs em rotas ou como props.

3.  **Compilação e Testes:**
    *   [ ] Compilar o projeto e corrigir todos os erros de tipo.
    *   [ ] Executar os testes de integração e E2E para garantir que a aplicação continua funcionando corretamente.

## Log de Progresso

*   **[DATA]** - Iniciando a refatoração. Arquivo de controle criado.
