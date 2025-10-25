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
-   `.windsurf/rules`: Regras e diretrizes para o agente de IA do Windsurf.
-   `.windsurf/global_rules.md`: Regras globais aplicáveis a todos os projetos.

## Regras de Desenvolvimento com Windsurf

O projeto utiliza o sistema de regras do Windsurf para manter consistência no código e automatizar revisões.

### Regras Configuradas

#### Regras do Workspace (`.windsurf/rules/`)
- **`bidexpert-coding-standards.md`**: Padrões específicos do projeto BidExpert incluindo:
  - Diretrizes React/Next.js e gerenciamento de estado
  - Padrões de UI/UX com Tailwind CSS
  - Configurações de teste com Playwright
  - Diretrizes específicas do domínio de leilões

#### Regras Globais (`.windsurf/global_rules.md`)
- Diretrizes gerais de desenvolvimento aplicáveis a todos os projetos
- Padrões de segurança e performance
- Boas práticas de documentação e acessibilidade

### Como Funciona
O agente Cascade do Windsurf automaticamente:
- Aplica essas regras ao sugerir código
- Usa como contexto para refatorações
- Considera as diretrizes durante explicações de código
- Encontra regras relevantes baseado no arquivo sendo editado

### Adicionando Novas Regras
1. Para regras específicas do projeto: adicione arquivos `.md` em `.windsurf/rules/`
2. Para regras globais: edite `.windsurf/global_rules.md`
3. As regras são automaticamente descobertas pelo Windsurf

Para mais informações sobre como configurar regras no Windsurf, consulte: https://docs.windsurf.com/windsurf/cascade/memories

## Regras de Desenvolvimento com Windsurf

O projeto BidExpert utiliza um sistema completo de regras do Windsurf para garantir consistência, qualidade e evolução contínua do código.

### 📁 Estrutura de Regras Configuradas

#### Regras Globais (`.windsurf/global_rules.md`)
- Diretrizes de desenvolvimento aplicáveis a todos os projetos
- Padrões de segurança, performance e documentação
- Boas práticas de Git, testes e deployment

#### Regras Específicas do Projeto (`.windsurf/rules/`)
- **`bidexpert-coding-standards.md`** - Padrões de código React/Next.js, TypeScript, Prisma
- **`bidexpert-multitenant-rules.md`** - Arquitetura multi-tenant e isolamento de dados (segurança crítica)
- **`bidexpert-auction-rules.md`** - Sistema de leilões, lotes, countdown e bidding
- **`bidexpert-design-system.md`** - Design system ShadCN/UI, Tailwind, responsividade
- **`bidexpert-testing-rules.md`** - Estratégia de testes Playwright, timeouts estendidos
- **`bidexpert-performance-rules.md`** - Otimização, caching, bundle analysis
- **`bidexpert-development-workflow.md`** - Git workflow, database, deployment

### 🎯 Como o Cascade (Agente IA) Usa as Regras

O agente de IA do Windsurf automaticamente:
- **Aplica padrões específicos** baseados no arquivo sendo editado
- **Mantém consistência** com a arquitetura multi-tenant
- **Sugere código otimizado** seguindo as diretrizes de performance
- **Gera testes adequados** respeitando timeouts e data-ai-id
- **Refatora código** mantendo padrões estabelecidos

### 💡 Exemplo de Regra em Ação

```typescript
// Ao editar um componente de leilão, o Cascade aplicará:
// ✅ UniversalCard ao invés de AuctionCard direto
// ✅ data-ai-id para todos os elementos
// ✅ Multi-tenant isolation em queries
// ✅ Design system (ShadCN/UI + Tailwind)
// ✅ Countdown baseado em AuctionStages
```

### 🔧 Adicionando Novas Regras

1. **Para funcionalidades específicas:** Crie `.windsurf/rules/nome-funcionalidade.md`
2. **Para regras globais:** Edite `.windsurf/global_rules.md`
3. **Regras são detectadas automaticamente** pelo Windsurf

### 📚 Documentação das Regras

Consulte `.windsurf/rules/README.md` para:
- Como cada categoria de regras funciona
- Exemplos de implementação
- Melhores práticas para criação de regras
- Troubleshooting e solução de problemas

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
