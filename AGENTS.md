# Diretrizes Globais para Agentes

> **🚀 PRIORIDADE MÁXIMA:** Antes de qualquer implementação, siga o **Workflow de Desenvolvimento Paralelo** em `.agent/workflows/parallel-development.md`

Todos os agentes e modelos que operam neste workspace DEVEM seguir obrigatoriamente as instruções contidas no arquivo mestre:
`.github/copilot-instructions.md`

## 🧠 Preflight de Memória Compartilhada (OBRIGATÓRIO)

Antes de iniciar ou retomar qualquer task, todo agente DEVE executar o preflight de memória definido no arquivo mestre.

Leitura mínima obrigatória dos últimos 30 dias:
- `/memories/repo/shared-memory-preflight.md`
- `/memories/repo/active-agent-sessions.md`
- `/memories/repo/recent-agent-changes.md`
- `/memories/repo/windows-worktree-notes.md`
- `.coordination/queue.yaml`
- `.coordination/ownership-map.yaml`

Se houver risco de conflito, handoff recente ou dúvida sobre atividade paralela, consultar também `.coordination/master-events.ndjson` e o histórico recente da branch/área antes de editar arquivos.

## Protocolo Anti-Erros Reais (OBRIGATÓRIO)

Estes guardrails foram adicionados após falhas reais em sweep/admin-plus e DEVEM ser seguidos por qualquer agente antes de assumir bug de aplicação:

1. Confirmar que o servidor ativo pertence ao worktree correto. Se logs/stacks apontarem para a raiz do workspace e não para o worktree isolado, reiniciar no worktree correto antes de editar código.
2. Validar o `.env.local` do worktree antes de login/E2E. `DATABASE_URL`, `SESSION_SECRET`, `AUTH_SECRET` e `NEXTAUTH_SECRET` são baseline obrigatória.
3. Usar o browser interno do VS Code para validar login e rota quando o fluxo depende de `Dev: Auto-login`, tenant auto-lock ou estado visual.
4. Tratar `ERR_CONNECTION_REFUSED` em série como problema de processo, porta ou memória. Não abrir múltiplas correções de rota enquanto o servidor estiver morto.
5. Se `next dev` cair em sweeps longos, reiniciar com `NODE_OPTIONS=--max-old-space-size=8192`.
6. Se erros de `input`/`ctx` `undefined` surgirem em várias server actions, corrigir `src/lib/admin-plus/safe-action.ts` antes de duplicar patches por página.
7. Antes de usar campos Prisma em `select`, confirmar o schema real. Não assumir `title` onde o model usa `name`.
8. Ordem mínima de validação: browser interno → teste Playwright com `--grep` → lote maior.
9. Antes de corrigir modal de processo/categoria/comitente/leiloeiro, validar primeiro os contratos compartilhados `EntitySelector` e `DataTable`; não criar divergência por tela.
10. Antes de corrigir preview de imagem ou upload administrativo, confirmar o shape real do item de mídia retornado pela biblioteca (`urlOriginal`, `urlThumbnail` ou equivalente documentado).
11. Antes de corrigir vazamento de lotes na edição do leilão, confirmar a assinatura do service de listagem e exigir filtro explícito por `auctionId`.
12. Em fluxo judicial, processo e comitente são dependência encadeada: Step 2, Step 3, review e publicação DEVEM refletir o mesmo vínculo, e ausência de comitente resolvido exige etapa condicional por Vara.
13. CEP/cidade/mapa e máscaras pt-BR DEVEM ser tratados como contratos reutilizáveis do admin; geocoding sem número ou matching textual rígido de cidade é considerado bug estrutural.
14. Se a correção revelar padrão recorrente do admin de leilões, atualizar regras consolidadas e skills do workspace na mesma rodada.

## 🔀 Workflow de Branches (OBRIGATÓRIO)

**REGRA CRÍTICA:** Todo agente AI DEVE:
1. Criar **Git Worktree dedicado** antes de qualquer alteração: `git worktree add worktrees\bidexpert-<tipo>-<descricao> -b <tipo>/<descricao>-<timestamp> origin/demo-stable`
2. Usar porta dedicada (9005, 9006, 9007...) para não conflitar com outros devs
3. NO FINAL do chat, reportar o que foi executado e as evidências; não exigir autorização do usuário para abrir PR ou fazer merge quando o gate local estiver verde

📖 **Workflow completo:** `.agent/workflows/parallel-development.md`

## Regras Específicas
- Sempre ao terminar qualquer implementação, correção ou criação de scripts, tabelas, campos, alterações, execute um teste e2e para validar o que foi feito e documente.
- REGRA DE BLOQUEIO (SEMPRE): nenhum agente pode encerrar task ou abrir PR sem cobertura de testes em **Vitest + Playwright + BDD** para o que foi alterado.
- Alterou functions/actions/services/regras de negócio: criar ou atualizar testes Vitest (unit/integration).
- Alterou telas/fluxos renderizados: criar ou atualizar testes Playwright (E2E/visual, preferindo provider Playwright do Vitest UI).
- Registrar cenários BDD (Given/When/Then) em arquivo `.feature` e manter rastreabilidade com os testes automatizados da entrega.

## ✅ Gate Pré-PR (OBRIGATÓRIO)

Antes de subir para PR, o desenvolvedor/agente DEVE executar localmente:
1. `npm ci` (validar lockfile sincronizado)
2. `npm run typecheck`
3. `npm run build`
4. Testes da entrega (unitário/e2e) com evidências Playwright (prints + link de relatório)

Regras:
- Se `package.json` mudar, `package-lock.json` deve ser commitado junto.
- É proibido abrir PR sem o checklist acima concluído e documentado.
- É proibido solicitar merge sem evidências visuais de sucesso dos testes.

## 🔔 Alerta de Aprovação + Evidência Playwright (OBRIGATÓRIO)

- Toda PR sem review `APPROVED` deve receber alerta automático com label `pending-human-approval`.
- O agente deve considerar bloqueado o merge/deploy enquanto existir alerta de aprovação pendente.
- Toda execução de CI em PR deve publicar comentário automático com links do run e artifact Playwright (`playwright-report`/`test-results`).
- Evidências visuais devem ser consultáveis por link na própria PR (sem depender de arquivos locais).

## 🌲 Isolamento Primário: Git Worktree (OBRIGATÓRIO)

**REGRA CRÍTICA:** NENHUM modelo AI (Copilot, Gemini, etc.) deve fazer qualquer alteração em arquivos de código antes de criar um **Git Worktree dedicado** com porta própria. Este mecanismo garante isolamento de branch, contexto de build e porta de servidor — sem Docker obrigatório.

> O Git Worktree é superior ao clone múltiplo e ao Docker sandbox para a maioria dos casos de desenvolvimento: setup em segundos, histórico compartilhado, sem duplicação de disco.

```powershell
# 1. Ver worktrees ativos e portas em uso
git worktree list
netstat -ano | Select-String ":900[5-9]|:901" | Select-Object -First 10

# 2. Criar worktree com nova branch a partir de demo-stable
$porta = 9006   # Pegar porta livre conforme tabela
$branch = "feat/minha-feature-$(Get-Date -Format 'yyyyMMdd-HHmm')"
git worktree add worktrees\bidexpert-feat-minha-feature -b $branch origin/demo-stable

# 3. Configurar e iniciar dentro do worktree (dentro do workspace VS Code)
Set-Location worktrees\bidexpert-feat-minha-feature
$env:PORT = $porta ; npm install ; npm run dev
# Acesso: http://dev.localhost:$porta
```

**Tabela de Portas por Worktree:**

| Porta | Worktree | Quem |
|-------|----------|------|
| 9005  | Principal / DEMO | Usuário humano |
| 9006  | DEV worktree #1 | Agente AI #1 |
| 9007  | DEV worktree #2 | Agente AI #2 |
| 9008  | Hotfix / PR review | Ad-hoc |

> 📖 **Skill detalhada:** `.github/skills/git-worktree-isolation/SKILL.md`

**Docker Sandbox** — use apenas quando precisar de banco de dados completamente isolado:
```powershell
docker compose -f docker-compose.dev-isolated.yml up -d --build
```

## 🔒 Isolamento de Ambientes DEV ↔ DEMO (OBRIGATÓRIO)

> **REGRA CRÍTICA:** Quando o USUÁRIO estiver usando o ambiente DEMO, os agentes AI DEVEM usar o ambiente DEV para não interferir nos testes do usuário.

### Mapeamento de Ambientes

| Ambiente | Infraestrutura | Database | Branch Base | Porta | Uso |
|----------|----------------|----------|-------------|-------|-----|
| **DEV** | Local (Docker) | MySQL `bidexpert_dev` | `demo-stable` | 9006 | Agentes AI |
| **DEMO** | Vercel + Prisma Postgres | PostgreSQL | `demo-stable` | 9005 | Usuário humano |
| **MAIN** | Cloud Run / Vercel | PostgreSQL | `main` | - | Linha principal pré-lançamento |

### Workflow de Branches

```
main (linha estável pré-lançamento)
  │
  └── demo-stable (base de integração pré-lançamento)
        │
        ├── feat/auction-filter-20260131-1430
        ├── fix/login-bug-20260131-1500
        └── chore/update-deps-20260131-1530
```

**Regras de Branch:**
1. `main` e `demo-stable` = **DESENVOLVIMENTO PRÉ-LANÇAMENTO** → alterações automatizadas são permitidas após validação local completa
2. `demo-stable` = Base preferencial para novas features e worktrees
3. Feature branches e PRs continuam preferenciais para trabalho isolado ou concorrente
4. CI verde permanece obrigatório antes de propagar mudanças mais amplas

### Detecção de Ambiente do Usuário

**Como identificar se o usuário está em DEMO:**
- URL contém `demo.localhost` ou domínio Vercel
- Logs mostram conexão PostgreSQL
- Porta 9005 ocupada

**Quando usuário está em DEMO → Agente AI faz (Git Worktree):**
```powershell
# 1. Criar worktree próprio na porta DEV (sem conflitar com DEMO do usuário)
$porta = 9006  # ou próxima porta livre
$branch = "feat/task-$(Get-Date -Format 'yyyyMMdd-HHmm')"
git worktree add worktrees\bidexpert-dev -b $branch origin/demo-stable
Set-Location worktrees\bidexpert-dev
$env:PORT = $porta ; npm install ; npm run dev
# Agente trabalha em http://dev.localhost:9006, sem tocar em 9005
```

### Compatibilidade MySQL ↔ PostgreSQL

Ao escrever queries que usam comparação de strings case-insensitive:

```typescript
// ✅ CORRETO - Usar helper de compatibilidade
import { insensitiveContains } from '@/lib/prisma/query-helpers';

const results = await prisma.auction.findMany({
  where: {
    title: insensitiveContains('termo')  // Funciona em MySQL e PostgreSQL
  }
});

// ❌ INCORRETO - Hardcode de mode
const results = await prisma.auction.findMany({
  where: {
    title: { contains: 'termo', mode: 'insensitive' }  // Só funciona em PostgreSQL
  }
});
```

### Verificação Pré-Implementação

Antes de iniciar qualquer task, o agente DEVE:
1. Verificar se porta 9005 está em uso: `netstat -ano | findstr "9005"`
2. Se ocupada → Usuário em DEMO → Usar DEV na porta 9006
3. Criar branch a partir de `demo-stable`
4. Testar em DEV antes de propor merge

### Checklist Operacional de Runtime

Antes de concluir que uma rota ou teste está quebrado, o agente DEVE validar:
- processo Node escutando na porta esperada;
- host correto (`demo.localhost:<porta>` ou `dev.localhost:<porta>`);
- probes `GET /auth/login` e `GET /api/public/tenants` com sucesso;
- se o erro é da aplicação ou apenas resultado de queda por OOM/servidor errado.

## Autenticação E2E: Helper Centralizado e Seed Gate

### Helper Centralizado
**ARQUIVO:** `tests/e2e/helpers/auth-helper.ts`

Todo novo teste E2E DEVE importar o helper centralizado:
```typescript
import { loginAsAdmin, loginAs, CREDENTIALS, ensureSeedExecuted } from './helpers/auth-helper';
```

### Credenciais Canônicas
| Perfil | Email | Senha |
|--------|-------|-------|
| Admin | `admin@bidexpert.com.br` | `Admin@123` |
| Leiloeiro | `carlos.silva@construtoraabc.com.br` | `Test@12345` |
| Comprador | `comprador@bidexpert.com.br` | `Test@12345` |
| Advogado | `advogado@bidexpert.com.br` | `Test@12345` |
| Analista | `analista@lordland.com` | `password123` |

**REGRA:** senha `senha@123` é INCORRETA. Nunca usar.

### Tenant Auto-Lock vs Manual
- **Com subdomínio** (`demo.localhost:9005`): tenant selector fica bloqueado (auto-locked)
- **Com path-based routing** (`/app/demo/...`): tenant selector fica bloqueado
- **Sem subdomínio** (`localhost:9005` ou Vercel `*.vercel.app`): selector **livre** — usuário escolhe o tenant
- **`NEXT_PUBLIC_DEFAULT_TENANT` definido + sem subdomínio**: selector **livre** mas pré-selecionado (usuário pode mudar)
- **Em testes E2E:** SEMPRE usar URL com subdomínio

### Seed Gate
`global-setup.ts` chama `ensureSeedExecuted(baseUrl)` automaticamente. Se o banco estiver vazio, executa `npm run db:seed`.

## 🧪 Anti-Patterns E2E — Lições Aprendidas (OBRIGATÓRIO)

Regras extraídas de bugs reais em sessões de debugging E2E. Todo agente DEVE seguir:

### URLs e Subdomínios
- **SEMPRE** `demo.localhost:PORT`, **NUNCA** `localhost:PORT` — middleware redireciona bare localhost para `crm.localhost`

### Worktree Setup
- **SEMPRE** copiar `.env` E `.env.local` da raiz — Git Worktree NÃO copia
- **SEMPRE** executar `npx prisma generate` após `npm install` — senão `PrismaClientInitializationError`

### Navigation e Waiting
- Usar `waitUntil: 'domcontentloaded'`, **NUNCA** `'networkidle'` — WebSockets causam hang
- Em dev mode, pré-aquecer páginas no `beforeAll` (lazy compilation 20-130s)
- Preferir `npm run build && npm start` para E2E estável

### Vercel vs Local
- Tabs/badges count=0 podem estar ocultas no Vercel — verificar `.isVisible()` antes
- Usar `requestSubmit()`, não `submit()` — Vercel compat
- Verificar existência do elemento antes de assertar: `await expect(el).toBeVisible()`

### Login
- Usar `loginAsAdmin()` do helper centralizado — NUNCA reimplementar inline
- Credenciais canônicas: `admin@bidexpert.com.br / Admin@123` — `senha@123` é INCORRETA

### Port Management
- Verificar porta livre antes de iniciar: `netstat -ano | findstr ":9005"`
- Matar Node órfãos: `Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue`

### Commits Docs-Only
- Usar `--no-verify` para commits que alteram apenas `.md` (skip typecheck hook)

**Referência completa:** `context/REGRAS_NEGOCIO_CONSOLIDADO.md` seção RN-GUIA-001 a 010

## Estratégia de Observabilidade (Logs do Browser + Servidor)
Os agentes devem sempre buscar a visão completa do problema:
1. **Logs do Browser**: Execute scripts Playwright (como `tests/e2e/console-error-detection.spec.ts`) para ver erros de console (`TypeError`, `404`, `500 network`) que não aparecem no terminal do servidor.
2. **Logs do Servidor**: Verifique o output do `next dev` ou `start`.
3. **Triangulação**: Um erro de "Failed to fetch" no browser geralmente tem uma stack trace correspondente no servidor. Use ambos para corrigir com precisão.

## 🌲 Estratégia de Inicialização Robusta (Git Worktree + Porta Dedicada)

**PROBLEMA:** Métodos antigos usando `next dev` na branch principal criam conflitos de porta entre Agente AI e Usuário trabalhando simultaneamente. Docker resolve o banco mas é lento para setup.

**SOLUÇÃO PRIMÁRIA (Git Worktree):** A primeira ação ANTES DE MUDAR QUALQUER ARQUIVO deve ser criar um Worktree dedicado com porta própria.

```powershell
# 1. Ver worktrees ativos e portas em uso
git worktree list
netstat -ano | Select-String ":900[5-9]|:901" | Select-Object -First 10

# 2. Criar worktree com nova branch a partir de demo-stable
$porta = 9006   # Porta livre conforme tabela
$branch = "feat/task-$(Get-Date -Format 'yyyyMMdd-HHmm')"
git worktree add worktrees\bidexpert-worktree-dev -b $branch origin/demo-stable

# 3. Configurar e iniciar dentro do worktree (dentro do workspace VS Code)
Set-Location worktrees\bidexpert-worktree-dev
$env:PORT = $porta ; npm install ; npm run dev
# Acesso: http://dev.localhost:$porta
```

**Monitoramento:**
- Sempre abra o **Simple Browser** com `http://dev.localhost:<porta>` para validar visualmente.
- Veja logs do servidor Next.js no terminal do worktree.

**Docker Sandbox** (alternativa quando banco de dados isolado é necessário):
```powershell
docker compose -f docker-compose.dev-isolated.yml down
docker compose -f docker-compose.dev-isolated.yml up -d --build
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

## Container Tools - Ambientes Multi-Tenant

As AIs (Copilot, Gemini, etc.) têm acesso às ferramentas de container para gerenciar diferentes ambientes.

### Extensões Habilitadas
- **Docker Extension Pack** (`ms-azuretools.vscode-docker`): Gerenciamento de containers Docker
- **Remote Containers** (`ms-vscode-remote.remote-containers`): Desenvolvimento em containers

### Ambientes Disponíveis
| Ambiente | Slug | Descrição | Comando |
|----------|------|-----------|---------|
| **DEV** | `dev` | Desenvolvimento local | `docker compose -f docker-compose.dev.yml up -d` |
| **HML** | `hml` | Homologação/Testes | `docker compose -f docker-compose.hml.yml up -d` |
| **DEMO** | `demo` | Demonstração com Master Data | `docker compose -f docker-compose.demo.yml up -d` |
| **PROD** | `prod` | Produção | `docker compose -f docker-compose.prod.yml up -d` |

### Comandos Úteis para AIs
```powershell
# Listar containers em execução
docker ps

# Ver logs de um container
docker logs <container-name>

# Verificar saúde dos serviços
docker compose -f docker-compose.dev.yml ps

# Parar todos os containers de um ambiente
docker compose -f docker-compose.dev.yml down

# Reconstruir containers
docker compose -f docker-compose.dev.yml up -d --build
```

### Regras para AIs ao Usar Containers
1. **Sempre verificar** se os containers necessários estão rodando antes de executar testes
2. **Usar o ambiente correto** conforme o contexto do teste (dev, hml, demo)
3. **Não modificar** containers em produção sem autorização explícita
4. **Documentar** qualquer alteração em configurações de containers

## 🕵️ Auction Sniper & QA Architect (CRITICAL AGENT)

**Invoque este agent para tarefas de auditoria, segurança financeira e QA de leilões.**

Para tarefas relacionadas a análise crítica de plataforma de leilão (bidding, search, segurança, ROI):
`.agent/agents/auction-sniper-qa.agent.md`

### Como Invocar
```powershell
# Method 1: Direct mention em chat
🕵️ Auction Sniper & QA: [sua pergunta]. Protocolo: [Blocos X,Y]. Tom: Crítico.

# Method 2: SubAgent (recomendado para tasks complexas)
runSubagent {
  "agentName": "auction-sniper-qa",
  "prompt": "Auditar [descrição]. Valide protocolo blocos [X,Y,Z]"
}
```

### Documentação
- **Main**: `.agent/agents/auction-sniper-qa.agent.md` (115+ atribuições)
- **Quick Ref**: `.agent/agents/auction-sniper-qa.quick-reference.md`
- **Usage Guide**: `.agent/agents/auction-sniper-qa.USAGE.md`

### Responsabilidades
- ✅ Audit de lógica de bidding (race conditions, segurança)
- ✅ Validação de UI/UX (conversão, gatilhos mentais)
- ✅ Search/filters (deságio, geolocalização, persistência)
- ✅ Performance (< 500ms latency, WebSocket sync)
- ✅ Segurança (audit trail, CSRF, timestamp sync)
- ✅ BDD Testing (Gherkin scenarios, E2E)
- ✅ ROI accuracy (cálculos sem arredondamentos)

### Tone (Crítico)
- 🚫 Nunca: "Parece correto", aproximações, achômetro
- ✅ Sempre: Stack trace, prova de sincronização, testes
- 🎯 Obcecado por: Consistência visual, integridade de dados, compliance

**Quando invocar**: Qualquer mudança em auctions, bidding, search, carteira, ou segurança financeira.

---

## 🛠️ Admin Architect & System Auditor (150+ Audit Attributes)

**Persona**: Lead System Architect & Admin Auditor Master  
**Scope**: 150+ audit attributes across 24 thematic blocks (inventory, UI/UX, bidding, compliance, performance, users, finance, monitoring, BI, marketing, security, content, post-sale, DevOps, AI, DR, optimization, productivity, legal, governance)  
**Invocation**: Auto-activation on keywords (backoffice, admin, lotes, compliance, security, performance, infra)

### How to Invoke
1. **Auto (Recommended)**: Mention backoffice/admin/compliance/security topics → auto-activates
2. **Manual**: Type `🛠️ Admin Architect: [request]`
3. **SubAgent**: Automatically invoked by other agents when context matches

### When to Use
✅ Code changes to backoffice or bidding engine  
✅ Infrastructure/performance issues  
✅ Compliance/audit requirements  
✅ Security concerns  
✅ Admin UI changes  
✅ Financial calculations  
✅ Data migrations  

### Documentation
- **Main Protocol**: `.agent/agents/admin-architect-qa.agent.md` (150+ attributes, 24 blocks)
- **Quick Reference**: `.agent/agents/admin-architect-qa.quick-reference.md` (15-min checklist)
- **Usage Guide**: `.agent/agents/admin-architect-qa.USAGE.md` (5 real examples)
- **Auto-Activation**: `.agent/agents/admin-architect-qa.AUTO-ACTIVATE.md` (keyword detection)
- **Setup Guide**: `.agent/agents/admin-architect-qa.SETUP-GUIDE.md` (5-minute setup)
- **Examples**: `.agent/agents/admin-architect-qa.EXAMPLES.md` (5 scenarios)
- **README**: `.agent/agents/README-admin-architect-qa.md` (overview)

### Key Features
✅ 150+ attribute validation across 24 blocks  
✅ Priority-based responses (P0 crítico → P3 baixo)  
✅ Proof required (logs, metrics, stack trace)  
✅ BDD Gherkin scenarios for testing  
✅ Prioritized action items  
✅ Success criteria & monitoring setup  

---

## Report Builder Architect (GrapesJS + Puppeteer + Handlebars)
Para tarefas relacionadas a criação de templates de relatórios, editais, laudos e cartas de arrematação, siga as diretrizes em:
`.github/skills/report-builder/SKILL.md`

Este agente lida com:
- Implementação de designer visual drag-and-drop com GrapesJS
- Conversão de schemas Zod para blocos GrapesJS
- Renderização de PDF com Puppeteer + CSS Paged Media
- Templating com Handlebars (variáveis, loops, condicionais)
- Contextos de dados: Leilão, Lote, Arrematante, Processo Judicial, Nota de Arrematação
- Sanitização XSS com DOMPurify

### Arquivos Principais
- `src/lib/report-builder/schemas/auction-context.schema.ts` - Schemas Zod
- `src/lib/report-builder/utils/zod-to-grapesjs.ts` - Conversão para blocos
- `src/components/BidReportBuilder/GrapesJSDesigner/index.tsx` - Editor visual
- `src/app/api/reports/render/route.ts` - API de renderização PDF
- `tests/e2e/report-builder-grapesjs.spec.ts` - Testes E2E

## Observability & Audit Architect (360º) - New Skill
For tasks related to Logs, Traces, Metrics, and Business Audit Compliance, follow the guidelines in:
`.github/skills/observability-audit/SKILL.md`

This agent handles:
- Implementation of OpenTelemetry.
- Prisma Audit Extensions.
- Structural Logging and Diffing.

## Vercel + PostgreSQL Deploy Skill
Para tarefas relacionadas a deploy no Vercel, configuração de build, compatibilidade PostgreSQL, e middleware multi-tenant:
`.github/skills/vercel-postgresql-deploy/SKILL.md`

Este agente lida com:
- Configuração do `vercel.json` (build command, regions, headers)
- Compatibilidade MySQL ↔ PostgreSQL (raw SQL, Prisma filters)
- Middleware multi-tenant para domínios `.vercel.app`
- Schemas Prisma duais (`schema.prisma` vs `schema.postgresql.prisma`)
- API routes com `force-dynamic`

### Regras Críticas de Deploy (resumo)
1. **NUNCA** incluir `prisma db push` ou `prisma migrate deploy` no buildCommand do vercel.json
2. **SEMPRE** quotar nomes camelCase em raw SQL PostgreSQL: `"errorMessage"`
3. **NÃO** misturar `isNot: null` com outros filtros Prisma no mesmo nível (XOR type)
4. **SEMPRE** incluir `updatedAt: new Date()` em `create()` de models com `@updatedAt`
5. **SEMPRE** usar nomes de relação exatos do schema Prisma (case-sensitive)
6. **NUNCA** redirecionar para subdomínios CRM em URLs `.vercel.app`
7. **SEMPRE** adicionar `export const dynamic = 'force-dynamic'` em API routes dinâmicas
8. Deploy via Git com PR: `git push origin <feature-branch>` → PR para `demo-stable`; promoção para `main` somente via PR aprovado (nunca push direto em `main`)

## 🛡️ Framework de Qualidade & Segurança (OBRIGATÓRIO)

Todos os agentes DEVEM seguir o **Guia de Qualidade & Segurança de Código** localizado em `context/QUALITY_SECURITY_WORKFLOW.md`.

### Princípios Fundamentais
1. **Shift Left**: Detectar erros no estágio mais inicial possível.
2. **Validação Rigorosa**: Toda entrada externa via API ou Service DEVE usar schemas **Zod**.
3. **Pirâmide de Testes**:
   - Unitários (Vitest) > 65%
   - Integração (Banco Real) > 25%
   - E2E (Playwright) > 10%
4. **Segurança**: Bloqueio de secrets via Gitleaks e headers CSP obrigatórios.

### Workflow por Task
- Antes de codar: Validar schemas e contratos.
- Durante: Implementar TDD/BDD.
- Depois: Rodar `npm run typecheck`, `npm run lint` e testes unitários.
- Smoke Test: Executar `npx playwright test --config=playwright.report.config.ts` para validar navegação em Vercel.

## Conflitos de regras
 - Sempre que houver conflito de instruções, peça para o usuário clarificar antes de proceguir.

## 💱 Política Global de Moeda e Máscaras (OBRIGATÓRIO)

- Toda exibição monetária DEVE usar formatador central (`src/lib/format.ts`) e evitar `R$` hardcoded.
- Toda operação matemática monetária DEVE normalizar entrada com `toMonetaryNumber()` antes de somar/subtrair/multiplicar.
- Padrão default do produto: `pt-BR` + `BRL` com 2 casas decimais.
- O seletor global de moeda (BRL/USD/EUR) deve ser respeitado em componentes client-side via `CurrencyProvider`/`useCurrency`.
- Em revisões, tratar como bug crítico qualquer evidência de concatenação de string em total monetário.
