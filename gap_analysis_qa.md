# Análise de Gaps de QA e Melhorias

Este documento registra as lacunas encontradas na suíte de testes e as melhorias implementadas. Cada item é formatado como um prompt para referência futura.

## Análise do Arquivo: `tests/bidding-e2e.test.ts`

### Gap 1: Teste não-idempotente na criação de dados base
- **Problema:** O teste falhava em execuções repetidas devido a uma falha de "Unique constraint" ao tentar criar um registro de `State` que já existia de uma execução anterior.
- **Prompt de Melhoria:** "Refatorar a criação de dados de setup nos testes. Substituir chamadas diretas de `prisma.create()` por `prisma.upsert()` para entidades que devem ser únicas (como `State`). A cláusula `where` deve usar o campo de restrição única (ex: `uf`), a `update` pode ser vazia, e a `create` deve conter os dados completos. Isso torna o teste resiliente e independente de dados pré-existentes."

### Gap 2: Lógica de serviço não lida com dados aninhados na criação
- **Problema:** O teste falhava ao tentar criar um leilão passando um array `auctionStages`, pois o `AuctionService` tentava passar esse argumento diretamente para o `prisma.auction.create()`, que não o reconhece.
- **Prompt de Melhoria:** "Refatorar o método `createAuction` no `AuctionService`. O método deve ser capaz de receber um array `auctionStages` no objeto de dados. A lógica deve ser implementada dentro de uma transação (`prisma.$transaction`) onde primeiro se cria o registro `Auction` principal e, em seguida, utiliza-se o ID do leilão recém-criado para executar um `createMany` para os registros `AuctionStage`, garantindo a atomicidade da operação e a correta criação de entidades relacionadas."

### Gap 3: Ordem de exclusão incorreta no Teardown
- **Problema:** O teste falhava na etapa de limpeza (`afterAll`) com um erro de violação de chave estrangeira, tentando deletar uma entidade (`State`) antes de suas dependentes (`JudicialDistrict`).
- **Prompt de Melhoria:** "Revisar e corrigir a ordem das operações de exclusão na função `cleanup` dos testes E2E. Garantir que as entidades sejam removidas na ordem inversa de suas dependências. Entidades dependentes (filhas) devem ser excluídas antes das entidades das quais dependem (pais) para evitar erros de violação de restrição de chave estrangeeira."

---

## Análise do Arquivo: `tests/wizard-e2e.test.ts`

### Gap 4: Ausência de Teste de Autorização
- **Problema:** O teste de criação de leilão via wizard (`createAuctionFromWizard`) não valida se o usuário que executa a ação possui as permissões necessárias. Isso representa uma falha de segurança, pois um usuário comum poderia, teoricamente, criar um leilão.
- **Prompt de Melhoria:** "Adicionar um novo caso de teste ao arquivo `tests/wizard-e2e.test.ts`. Este teste deve: 1. Criar um usuário com um papel de baixos privilégios (ex: 'BIDDER'). 2. Simular uma chamada à server action `createAuctionFromWizard` usando a sessão deste usuário. 3. Afirmar que o resultado da ação é `{ success: false }` e que a mensagem de erro indica 'Acesso negado' ou 'Não autorizado'. Isso garante que a camada de ações do servidor está protegendo adequadamente os endpoints críticos."