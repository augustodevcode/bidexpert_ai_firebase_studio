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
-   `context/AI_PROJECT_RULES.md`: **[MANDATORY]** Regras críticas para assistentes de IA.
-   `context/GEMINI.md`: Diretrizes específicas para Gemini AI.
-   `context/instructions.md`: Instruções de workflow para IA.

## ⚠️ CRITICAL: AI Project Rules

**TODOS os assistentes de IA devem ler e seguir** `context/AI_PROJECT_RULES.md` antes de fazer qualquer mudança no código.

### Regras Obrigatórias
1. **Multi-tenant Security**: Todas as queries devem filtrar por `tenantId`
2. **Lazy Compilation vs Pre-Build**: E2E tests DEVEM usar `npm run build && npm start`, NUNCA `npm run dev`
3. **File Headers**: Todos os arquivos `.ts/.tsx` devem ter docblock explicando propósito
4. **Non-Regression**: Deleções requerem autorização explícita do usuário
5. **Design System**: Use apenas semantic tokens, nenhum hardcoded color
6. **Testing**: Pré-build obrigatório antes de executar E2E tests
7. **Prisma**: Acesso única através de `getDatabaseAdapter()`
8. **Environment**: `.env` NUNCA pode ser deletado

[📖 Ler regras completas aqui](./context/AI_PROJECT_RULES.md)

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

## 🌐 Ambientes de Deploy (Links para Teste)

| Ambiente | URL | Banco | Branch | Uso |
|----------|-----|-------|--------|-----|
| **DEMO / Produção** | [bidexpertaifirebasestudio.vercel.app](https://bidexpertaifirebasestudio.vercel.app/) | PostgreSQL (Vercel) | `main` | Demonstração e testes públicos |
| **DEV (local)** | `http://dev.localhost:9006` | MySQL `bidexpert_dev` | feature branch | Desenvolvimento e agentes AI |

> **Credenciais de teste no DEMO:**
> - Admin: `admin@bidexpert.com.br` / `Admin@123`
> - Comprador: `comprador@bidexpert.com.br` / `Test@12345`
> - Leiloeiro: `carlos.silva@construtoraabc.com.br` / `Test@12345`

## Funcionalidades da Plataforma

Para um entendimento detalhado de todas as funcionalidades, regras de negócio e o progresso atual do projeto, é essencial ler os arquivos de documentação na pasta `/home/user/studio/context`. Eles servem como a fonte da verdade para o que a plataforma faz e como ela deve se comportar.

## Como Executar os Testes

Para garantir a qualidade e a estabilidade do código, siga a ordem de execução abaixo.

### 1. Preparar o Banco de Dados

Este comando irá garantir que o schema do seu banco de dados está atualizado com a versão mais recente definida em `prisma/schema.prisma`.

```bash
npm run db:push
```

> Nota: A partir desta branch, o fluxo de desenvolvimento **usa MySQL local por padrão** (não usamos mais Locaweb para desenvolvimento local). Ajuste sua `.env` para apontar `DATABASE_URL` para `localhost` (ex.: `mysql://root:password@localhost:3306/bidexpert_dev`) e então rode `npm run db:seed:dev`.


### 2. Popular com Dados de Amostra

- Para preencher o banco para *demos completas* (RECOMENDADO):
```bash
npm run db:seed:ultimate
```

- Para dados de amostra mais leves usados em E2E:
```bash
npm run db:seed:samples
```

*Nota:* `db:push` executa seeds essenciais; use `db:seed:ultimate` para um dataset completo de demonstração.

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

## 🔧 Troubleshooting

### Erro: MissingSecret NextAuth

Se você ver erros como `[auth][error] MissingSecret: Please define a 'secret'`:

1. **Verificar variáveis de ambiente**:
```bash
npm run auth:verify
```

2. **Gerar um novo secret**:
```bash
npm run auth:generate-secret
```

3. **Adicionar ao .env**: Copie o secret gerado e adicione ao arquivo `.env`:
```env
AUTH_SECRET="seu_secret_gerado_aqui"
NEXTAUTH_SECRET="seu_secret_gerado_aqui"
```

4. **Reiniciar o servidor**: As variáveis de ambiente só são carregadas na inicialização:
```bash
# Pare o servidor (Ctrl+C)
npm run dev
```

📖 [Documentação completa da correção](./docs/NEXTAUTH_FIX.md)

### Outros Problemas Comuns

- **Erro de conexão com banco de dados**: Verifique se a variável `DATABASE_URL` está correta no `.env`
- **Prisma Client desatualizado**: Execute `npx prisma generate`
- **Porta 9002 em uso**: Use uma porta alternativa como `npm run dev:9003`
- **Timeouts em testes E2E**: Use `npm run build && npm start` em vez de `npm run dev`
