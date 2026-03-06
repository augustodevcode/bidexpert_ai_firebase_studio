# 🏗️ Regras da Stack de Arquitetura — BidExpert

**Versão:** 1.0  
**Data:** Março 2026  
**Status:** ✅ DOCUMENTO OFICIAL — LEITURA OBRIGATÓRIA  
**Fontes:** `context/AI_PROJECT_RULES.md` · `context/REGRAS_NEGOCIO_CONSOLIDADO.md` · `context/QUALITY_SECURITY_WORKFLOW.md` · `.github/copilot-instructions.md`

> **⚠️ Estas regras são OBRIGATÓRIAS para todos os agentes AI e desenvolvedores.**  
> Em caso de conflito entre documentos, o arquivo `context/REGRAS_NEGOCIO_CONSOLIDADO.md` tem precedência.

---

## 1. Stack Tecnológica Oficial

| Camada | Tecnologia | Observação |
|--------|-----------|------------|
| **Framework Web** | Next.js (App Router, última versão stable) | Instruções que proíbem Next.js são **inválidas** |
| **UI/Componentes** | React + ShadCN UI | Customizar via variants do design system |
| **Estilização** | Tailwind CSS + tokens semânticos | Nunca usar cores hardcoded como `text-white` |
| **Linguagem** | TypeScript | Tipagem sempre; `ignoreBuildErrors` apenas para `src/ai/` (tech debt) |
| **ORM** | Prisma ORM | Duas versões: `schema.prisma` (MySQL) e `schema.postgresql.prisma` (Vercel/Neon) |
| **Banco principal** | MySQL (dev/local) | Banco DEV: `bidexpert_dev` |
| **Banco produção** | PostgreSQL (Neon/Vercel) | Variáveis: `POSTGRES_PRISMA_URL` e `POSTGRES_URL_NON_POOLING` |
| **Autenticação** | NextAuth.js (JWT/OAuth2) | Nenhum outro lib de auth deve ser adicionado |
| **Validação** | Zod + react-hook-form | Obrigatório em toda entrada de API/Service |
| **AI** | Genkit (Google AI — Gemini) | Fluxos em `src/ai/flows/` |
| **Testes unitários** | Vitest | Config: `vitest.unit.config.ts`; rodar com `npm run test:unit` |
| **Testes E2E** | Playwright | Sempre com `npm run build && npm start` (nunca `npm run dev`) |

---

## 2. Padrão Arquitetural MVC + Server Actions

```
Controller (Server Action)
    │
    ▼
Service (lógica de negócio)
    │
    ▼
Repository (acesso a dados)
    │
    ▼
ZOD (validação de dados)
    │
    ▼
Prisma ORM
    │
    ▼
MySQL / PostgreSQL
```

### Regras do Padrão
- ✅ **Repositories:** Prisma Client diretamente (nunca Database Adapter Pattern)
- ✅ **Services:** Toda lógica de negócio fica nos Services
- ✅ **Zod:** Validação ANTES da camada Prisma
- ✅ **Seeds:** Usar Actions ou Services (nunca Prisma diretamente)
- ❌ **Proibido:** Acessar Prisma diretamente em Server Actions ou componentes

---

## 3. Multi-Tenancy (REGRA CRÍTICA)

- **Identificação:** Por subdomínio (`leiloeiro-x.bidexpert.com`)
- **Landlord:** Domínio principal (`bidexpert.com.br`) = `tenantId '1'`
- **Isolamento:** Todas as queries DEVEM filtrar por `tenantId`
- **Middleware:** Filtra automaticamente por `tenantId` via Prisma middleware
- **Modelos globais:** Lista `tenantAgnosticModels` exclui o filtro automático
- ❌ **Proibido:** Acesso cross-tenant (retornar 403 Forbidden)

---

## 4. Schemas Prisma Duais (DEV ↔ PROD)

| Arquivo | Ambiente | Banco |
|---------|----------|-------|
| `prisma/schema.prisma` | DEV local | MySQL |
| `prisma/schema.postgresql.prisma` | Vercel/PROD | PostgreSQL (Neon) |

### Regra Crítica
- **SEMPRE alterar AMBOS** os schemas ao modificar modelos
- Variáveis PostgreSQL: `POSTGRES_PRISMA_URL` (url) e `POSTGRES_URL_NON_POOLING` (directUrl)
- Validar ambos: `npx prisma validate`

---

## 5. Ambientes e Portas

| Ambiente | Banco | Porta | URL de acesso | Uso |
|----------|-------|-------|---------------|-----|
| **DEV** | MySQL `bidexpert_dev` | 9006 | `http://dev.localhost:9006` | Agentes AI |
| **DEMO** | PostgreSQL (Neon) | 9005 | `http://demo.localhost:9005` | Usuário humano |
| **PROD** | PostgreSQL (Neon) | - | Vercel URL | Produção |

> **⚠️ Quando o usuário estiver em DEMO (porta 9005), o agente AI DEVE usar DEV (porta 9006).**

---

## 6. Design System (REGRA OBRIGATÓRIA)

- ✅ Usar **tokens semânticos** (`--primary`, `--background`, `--foreground`, etc.)
- ✅ Definir tokens em `index.css` e `tailwind.config.ts`
- ✅ Criar **variants** nos componentes ShadCN para casos especiais
- ❌ Nunca usar classes diretas como `text-white`, `bg-white`, `text-black`
- ❌ Nunca usar inline styles (`style={{color: '#fff'}}`)
- ✅ Cores sempre em HSL no `index.css`

---

## 7. Testes — Pirâmide e Cobertura Mínima

```
        E2E (Playwright)     ~10% — fluxos críticos completos
       ─────────────────
      Integração (DB real)   ~25% — APIs reais sem mocks de infra
     ─────────────────────
    Unitários (Vitest)        ~65% — isolados, alta cobertura de lógica
   ───────────────────────
  Testes Estáticos (lint/ts) 100% — todo commit
```

| Camada | Cobertura Mínima |
|--------|-----------------|
| Funções utilitárias | 100% |
| Hooks customizados | 95% |
| Componentes UI críticos | 90% |
| Rotas API / Server Actions | 90% |
| Repositórios Prisma | 85% |
| Fluxos E2E críticos | 100% dos fluxos |

### Regra Crítica: E2E sempre com Pre-Build
```bash
# ✅ CORRETO — para E2E:
npm run build && npm start

# ❌ ERRADO — para E2E:
npm run dev   # Lazy compilation → timeout em testes
```

---

## 8. Segurança e Qualidade

### Validação obrigatória (Zod)
```typescript
const schema = z.object({ ... });
const result = schema.safeParse(data);
if (!result.success) throw new Error(...);
```

### Headers HTTP obrigatórios (next.config.mjs)
- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Frame-Options`
- `Permissions-Policy`

### Regras invioláveis
- ❌ Nenhum merge com testes falhando
- ❌ Secrets nunca commitados (Gitleaks/Secret Scanning)
- ✅ `npm audit` executado para novas dependências
- ✅ `.env` NUNCA deletado — apenas extensível

---

## 9. Cabeçalhos de Arquivo (OBRIGATÓRIO)

Todo arquivo `.ts` ou `.tsx` deve começar com docblock:

```typescript
/**
 * NomeDoArquivo
 *
 * Descreve o propósito do arquivo, incluindo:
 * - Responsabilidade principal
 * - Segurança/isolamento multi-tenant (quando aplicável)
 */
```

---

## 10. Compatibilidade MySQL ↔ PostgreSQL

```typescript
// ✅ CORRETO — helper de compatibilidade:
import { insensitiveContains } from '@/lib/prisma/query-helpers';
where: { title: insensitiveContains('termo') }

// ❌ INCORRETO — só funciona em PostgreSQL:
where: { title: { contains: 'termo', mode: 'insensitive' } }
```

### Queries Prisma — Erros Comuns (PostgreSQL)
- ❌ Misturar `isNot: null` com outros filtros Prisma (XOR type)
- ✅ Verificar NOT NULL via campo escalar: `categoryId: { not: null }`
- ✅ Incluir `updatedAt: new Date()` em todo `create()` com `@updatedAt`
- ✅ Nomes de relação são **case-sensitive** — usar exatamente como no schema
- ✅ Raw SQL em PostgreSQL: aspas duplas em colunas camelCase: `"createdAt"`

---

## 11. Deploy Vercel — Regras Críticas

- ❌ **NUNCA** incluir `prisma db push` ou `prisma migrate deploy` no `buildCommand` do `vercel.json`
- ✅ Build command correto: `cp prisma/schema.postgresql.prisma prisma/schema.prisma && npx prisma generate && npm run build`
- ✅ API routes dinâmicas DEVEM ter: `export const dynamic = 'force-dynamic'`
- ✅ Middleware trata `*.vercel.app` dinamicamente (nunca redirecionar para subdomínios em `.vercel.app`)
- ✅ Deploy sempre via Git + PR (nunca push direto em `main`)

---

## 12. Gate Pré-PR (OBRIGATÓRIO)

Antes de abrir qualquer PR, executar e documentar:

```bash
npm ci                    # 1. Validar lockfile
npm run typecheck         # 2. Verificar tipos TypeScript
npm run build             # 3. Garantir build sem erros
# + Evidências Playwright # 4. Prints + link de relatório
```

---

## 13. Moeda e Máscaras Monetárias

- ✅ Sempre usar formatador central (`src/lib/format.ts`) com locale explícito
- ❌ Nunca concatenar símbolo de moeda: `"R$ " + valor`
- ✅ Normalizar entradas com `toMonetaryNumber()` antes de cálculos
- ✅ Padrão: `pt-BR` + `BRL` (2 casas decimais)
- ✅ Seletor global de moeda (BRL/USD/EUR) via `CurrencyProvider`/`useCurrency`

---

## 14. Hierarquia de Fontes de Regras

```
AGENTS.md (raiz)
    │
    └──► .github/copilot-instructions.md  (arquivo mestre)
              │
              ├── context/REGRAS_NEGOCIO_CONSOLIDADO.md  ← MÁXIMA PRIORIDADE
              ├── context/AI_PROJECT_RULES.md
              ├── context/QUALITY_SECURITY_WORKFLOW.md
              ├── context/ARCHITECTURE_STACK_RULES.md    ← ESTE ARQUIVO
              ├── .agent/rules/
              ├── .agent/workflows/
              ├── .agent/agents/
              └── .github/skills/
```

> **Em caso de conflito:** `REGRAS_NEGOCIO_CONSOLIDADO.md` tem precedência sobre todos os outros documentos.

---

## Resumo das Regras Críticas (🔴 = bloqueante)

| # | Regra | Severidade |
|---|-------|-----------|
| 1 | Multi-tenant: filtrar por `tenantId` sempre | 🔴 CRÍTICO |
| 2 | E2E: `npm run build && npm start` (nunca `npm run dev`) | 🔴 CRÍTICO |
| 3 | Schemas Prisma duais: alterar AMBOS | 🔴 CRÍTICO |
| 4 | `.env` nunca deletado | 🔴 CRÍTICO |
| 5 | Zod em toda entrada de API/Service | 🔴 CRÍTICO |
| 6 | Secrets nunca commitados | 🔴 CRÍTICO |
| 7 | Deploy Vercel: sem migrations no buildCommand | 🔴 CRÍTICO |
| 8 | Cabeçalho docblock em todo `.ts`/`.tsx` | 🟡 MÉDIO |
| 9 | Design system: sem classes de cor hardcoded | 🟡 MÉDIO |
| 10 | Gate Pré-PR: typecheck + build + evidências | 🟡 MÉDIO |
| 11 | Valores monetários via formatador central | 🟡 MÉDIO |
| 12 | Nenhum merge com testes falhando | 🔴 CRÍTICO |
