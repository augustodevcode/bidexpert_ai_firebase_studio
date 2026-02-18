# 🐳 Gemini AI - Diretrizes de Projeto BidExpert

> **REGRA CRÍTICA DE MÁXIMA PRIORIDADE:** Este documento DEVE ser seguido por TODOS os agentes Gemini ANTES de iniciar qualquer implementação, alteração ou correção no projeto. **SEM EXCEÇÕES.**

## Arquivo Mestre de Instruções
Todas as regras detalhadas estão em:
`E:\SmartDataCorp\BidExpert\BidExpertVsCode\bidexpert_ai_firebase_studio\.github\copilot-instructions.md`

---

## 🐳 Container Sandbox - Workflow Obrigatório (MÁXIMA PRIORIDADE)

**Automatic activation for ANY implementation/correction/feature request.**

Whenever you detect ANY mention of:
- Implementar, criar, corrigir, fix, feature, alterar, modificar, refatorar
- Desenvolver, codificar, adicionar, remover, atualizar, upgrade
- Bug, erro, issue, problema, falha, crash
- Deploy, migration, seed, schema, database, banco
- Teste, test, E2E, validar, verificar

**AUTOMATICALLY follow this Container Sandbox workflow:**

### 1. Abrir Container Sandbox (ONE-COMMAND)
```powershell
# Bootstrap completo: branch + container + seed + orchestration
.\scripts\bootstrap-dev-container.ps1 -DevId dev1 -BranchType feat -BranchName minha-feature
```

O script faz automaticamente:
1. Cria branch a partir de `demo-stable`: `feat/minha-feature-<timestamp>`
2. Verifica portas disponíveis (9101, 9102, 9103...)
3. Gera `.env.dev<N>` com configurações isoladas
4. Sobe containers: `docker compose -f docker-compose.dev-isolated.yml --profile dev<N> up -d`
5. Aguarda MySQL healthcheck + Next.js ready
6. Executa seed de dados de teste
7. Registra na fila de orquestração (`.coordination/queue.yaml`)

### 2. Desenvolver DENTRO do Container
Hot-reload automático via volume mount:
- Código fonte: `./src` → `/app/src`
- Testes: `./tests` → `/app/tests`
- Prisma: `./prisma` → `/app/prisma`
- Scripts: `./scripts` → `/app/scripts`

**Toda alteração local reflete automaticamente no container.**

### 3. Testar Exaustivamente com Auto-Fix Loop
```powershell
# Executar testes DENTRO do container com evidências
docker exec bidexpert-dev1-app-1 bash /app/scripts/run-tests-in-container.sh dev1

# Loop auto-fix obrigatório:
# 1. Rodar testes → verificar falhas
# 2. Corrigir código → rodar novamente
# 3. Repetir ATÉ 100% dos testes passarem
# 4. Evidência JSON gerada em: test-results/evidence-dev1-*.json
```

### 4. Registrar na Orquestração
Manter `.coordination/queue.yaml` atualizado com:
- Status: `developing` → `testing` → `ready-for-review`
- Branch name e Dev ID
- Lista de arquivos alterados
- Resultado dos testes (pass/fail count)

### 5. Submeter PR com Evidência
1. ✅ Garantir TODOS os testes passaram (evidência JSON válida)
2. ✅ Fazer push de todos os commits na branch
3. ✅ Submeter evidência JSON junto com o PR
4. ✅ **PERGUNTAR AO USUÁRIO:** "Deseja que eu crie o Pull Request e faça merge na demo-stable?"
5. ⏳ Aguardar autorização explícita antes de qualquer merge

### 6. Cleanup do Container
```powershell
# Após merge aprovado
docker compose -f docker-compose.dev-isolated.yml --profile dev1 down -v
Remove-Item .coordination/dev1.flag -ErrorAction SilentlyContinue
```

### Proteções Absolutas
- 🚫 **NUNCA** fazer push direto na `main` ou `demo-stable`
- 🚫 **NUNCA** fazer merge sem autorização explícita do usuário
- 🚫 **NUNCA** resolver conflitos automaticamente sem revisão
- 🚫 **NUNCA** desenvolver fora do container sandbox (exceto edição de docs)
- 🚫 **NUNCA** usar `npm run dev` bare-metal quando container estiver disponível

📖 **Workflow completo:** `.agent/workflows/parallel-development.md`
📖 **Guia do Container:** `docs/CONTAINER-DEV-GUIDE.md`

---

## 🔒 Isolamento de Ambientes DEV ↔ DEMO

| Ambiente | Infraestrutura | Database | Branch Base | Porta | Uso |
|----------|----------------|----------|-------------|-------|-----|
| **DEV (Container)** | Docker Isolado | MySQL `bidexpert_dev` | `demo-stable` | 9101+ | Agentes AI (PREFERENCIAL) |
| **DEV (Fallback)** | Local bare-metal | MySQL `bidexpert_dev` | `demo-stable` | 9006 | Agentes AI (sem Docker) |
| **DEMO** | Vercel + Prisma Postgres | PostgreSQL | `demo-stable` | 9005 | Usuário humano |
| **PROD** | Cloud Run / Vercel | PostgreSQL | `main` | - | Produção final |

### Workflow de Branches
```
main (produção - PROTEGIDO)
  │
  └── demo-stable (base estável para features)
        │
        ├── feat/auction-filter-20260131-1430
        ├── fix/login-bug-20260131-1500
        └── chore/update-deps-20260131-1530
```

---

## 🕵️ Auction Sniper & QA Auto-Activation

Whenever auction/bidding/ROI/security topics are detected, automatically apply the Auction Sniper QA protocol.
- **Main**: `.agent/agents/auction-sniper-qa.agent.md`
- **Quick Ref**: `.agent/agents/auction-sniper-qa.quick-reference.md`

## 🛠️ Admin Architect & System Auditor Auto-Activation

Whenever admin/backoffice/compliance topics are detected, automatically apply the Admin Architect protocol.
- **Main**: `.agent/agents/admin-architect-qa.agent.md`
- **Quick Ref**: `.agent/agents/admin-architect-qa.quick-reference.md`

---

## Regras Gerais
- **Stack:** Next.js, React, TypeScript, Zod, Prisma, ShadCN UI, Tailwind CSS, Genkit (MVC + Server Actions)
- **Schemas Prisma Duais:** `prisma/schema.prisma` (MySQL) + `prisma/schema.postgresql.prisma` (PostgreSQL). Alterar AMBOS ao mudar schema.
- **Testes:** Sempre rodar dentro do container. Evidência JSON obrigatória.
- **Documentação:** Todo arquivo `.ts`/`.tsx` deve começar com docblock explicando propósito.
- **SEO:** Semantic HTML, meta tags, JSON-LD, lazy loading para imagens.
- **Multi-Tenant:** Isolamento de dados por tenant. URLs com subdomain slug obrigatório.
