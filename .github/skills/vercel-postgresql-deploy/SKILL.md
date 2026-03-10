# 🚫 CAUSAS-RAIZ CRÍTICAS (ANTI-REINCIDÊNCIA)
## 1. Serialização BigInt/Decimal em Next.js
Nunca passe objetos Prisma diretamente para componentes client-side. Sempre converta BigInt para string e Decimal para Number antes de renderizar.

## 2. Compatibilidade Prisma MySQL ↔ PostgreSQL
Valide queries Prisma em ambos schemas. Nunca use filtros/campos não presentes no Postgres. Relações são PascalCase e case-sensitive.

## 3. Isolamento de Ambientes e Branches
Sempre use Git Worktree com porta dedicada e branch isolada. Nunca testar ou alterar diretamente em main/demo-stable sem PR aprovado.

## 4. Proteção de Deploy e PR
Todo PR deve incluir prints Playwright, link de relatório, e cenário validado. Nunca mergear sem aprovação explícita.

## 5. Seed de Dados e Testes Automatizados
Sempre usar credenciais canônicas do seed, verificar seed antes de testes, garantir cobertura total de tabelas e colunas.

## 6. Diagnóstico Avançado e Observabilidade
Sempre monitorar logs do browser e servidor, usar tags de telemetria Playwright, nunca corrigir testes sem analisar causa-raiz.

## 7. Regras de Negócio Consolidadas
Sempre consultar REGRAS_NEGOCIO_CONSOLIDADO.md antes de alterar lógica de negócio. Regras do arquivo têm precedência.
---
name: vercel-postgresql-deploy
description: Regras críticas de deploy Vercel com PostgreSQL e Prisma para evitar falhas de build, middleware e compatibilidade de queries.
---

# 🚀 Skill: Vercel + PostgreSQL Deploy & Compatibility

## 📸 Evidência Obrigatória para PR (Playwright)
- Todo PR deve incluir print(s)/screenshot(s) de sucesso dos testes Playwright.
- Deve incluir link do relatório de execução (Playwright/Vitest UI) e cenário validado.
- PR sem evidência visual não deve ser aprovado nem mergeado.

## Descrição

Esta skill documenta todas as regras, armadilhas e soluções aprendidas ao fazer deploy do BidExpert no Vercel com PostgreSQL (Prisma Postgres). Seguir estas regras evita os erros recorrentes que bloqueiam o site em produção.

## Quando Usar Esta Skill

- Ao fazer deploy para Vercel (qualquer ambiente)
- Ao escrever queries Prisma que serão executadas no Vercel
- Ao configurar `vercel.json`, build commands ou middleware
- Ao escrever raw SQL (`$executeRaw`, `$queryRaw`)
- Ao modificar o middleware de roteamento multi-tenant
- Ao adicionar novas rotas de API
- Ao alterar o Prisma schema

## ⚠️ REGRA CRÍTICA: Prisma Relation Names (PascalCase)

**O PostgreSQL schema usa PascalCase para TODAS as relações Prisma.** 
Consulte `PRISMA_RELATION_NAMING.md` neste diretório para a tabela completa de mapeamentos.

**Exemplos:**
- `include: { Lot: true }` (NÃO `lot: true`)
- `_count: { select: { Bid: true } }` (NÃO `bids: true`)
- `connect: { Tenant: { connect: { id } } }` (NÃO `tenant:`)

**Validação obrigatória antes do deploy:**
```powershell
cp prisma/schema.postgresql.prisma prisma/schema.prisma; npx prisma generate; npm run build
```

## Regras de Deploy Vercel (OBRIGATÓRIAS)

### 1. NUNCA usar `prisma db push` no Build Command

**Problema:** O Vercel executa o build em containers efêmeros sem acesso ao banco de dados. `prisma db push` tenta conectar ao banco durante o build e falha com:

```
Error: P1001 Can't reach database server at db.prisma.io:5432
```

**Regra:** O `buildCommand` no `vercel.json` deve APENAS:
1. Copiar o schema PostgreSQL
2. Gerar o Prisma Client
3. Executar o build Next.js

```json
{
  "buildCommand": "cp prisma/schema.postgresql.prisma prisma/schema.prisma && npx prisma generate && npm run build"
}
```

**NUNCA inclua no build command:**
- `prisma db push`
- `prisma migrate deploy`
- `prisma db seed`
- Qualquer comando que conecte ao banco de dados

**Migrações e seed** devem ser executados separadamente:
- Via scripts locais com acesso direto ao banco
- Via GitHub Actions com secrets configurados
- Via Vercel Serverless Functions (seed API routes)

### 2. Deploy APENAS via GitHub CI/CD

```powershell
# ✅ CORRETO - Deploy via git push
git push origin <feature-branch>
# abrir PR para demo-stable; promoção para main apenas via PR aprovado

# ❌ INCORRETO - NUNCA usar deploy direto pelo Vercel MCP
# (exceto para executar seed via API routes)
```

### 3. Schema PostgreSQL Separado

O projeto mantém dois schemas Prisma:
- `prisma/schema.prisma` — MySQL (desenvolvimento local)
- `prisma/schema.postgresql.prisma` — PostgreSQL (Vercel)

**No build do Vercel**, o schema PostgreSQL é copiado:
```bash
cp prisma/schema.postgresql.prisma prisma/schema.prisma
```

**Ao modificar o schema Prisma:**
1. Altere AMBOS os arquivos
2. Valide com `npx prisma validate` para cada um
3. Mantenha sincronizados (mesmos models, campos, relações)

## Regras de Compatibilidade PostgreSQL (OBRIGATÓRIAS)

### 4. Raw SQL: SEMPRE Quotar Nomes de Colunas

**Problema:** PostgreSQL converte identificadores não-quotados para lowercase. Se a tabela/coluna foi criada com camelCase pelo Prisma, o nome real é camelCase, mas SQL sem aspas procura em lowercase.

```sql
-- ❌ INCORRETO - PostgreSQL interpreta como "errormessage" (não existe)
INSERT INTO itsm_query_logs (query, duration, success, errorMessage, timestamp)

-- ✅ CORRETO - Aspas duplas preservam o case exato
INSERT INTO itsm_query_logs ("query", "duration", "success", "errorMessage", "timestamp")
```

**Regra:** Em TODA raw query (`$executeRaw`, `$queryRaw`, `$queryRawUnsafe`), SEMPRE use aspas duplas em nomes de colunas e tabelas que contenham letras maiúsculas.

**Exceção:** Nomes totalmente em lowercase não precisam de aspas, mas é recomendado usar sempre por consistência.

### 5. Prisma Filters: Não Misturar RelationFilter com WhereInput

**Problema:** Prisma 5.x usa tipos XOR para filtros de relação. Misturar `isNot: null` (RelationFilter) com `some: {}` (ListRelationFilter/WhereInput) no mesmo objeto causa erro de tipo.

```typescript
// ❌ INCORRETO - Mistura RelationFilter com WhereInput no mesmo where
where: {
  Auction: {
    isNot: null,      // RelationFilter
    AuctionStage: {   // AuctionWhereInput - CONFLITO COM isNot
      some: {}
    }
  }
}

// ✅ CORRETO - Usar apenas WhereInput ou verificar relação via campo escalar
where: {
  Auction: {
    AuctionStage: { some: {} }  // Implicitamente garante que Auction exists
  }
}
```

**Para verificar que uma relação NOT NULL existe, use o campo escalar:**
```typescript
// ✅ CORRETO - Verificar via FK escalar
where: {
  categoryId: { not: null },  // Garante que categoria existe
  cityId: { not: null },      // Garante que cidade existe
}

// ❌ INCORRETO - Usar isNot em relação
where: {
  LotCategory: { isNot: null },
  City: { isNot: null },
}
```

### 6. Campos Required no Prisma: Sempre Incluir `updatedAt`

**Problema:** O schema Prisma define `updatedAt DateTime @updatedAt` como campo obrigatório em muitos models. Se o código chama `create()` sem incluir `updatedAt`, falha com erro de campo obrigatório.

```typescript
// ❌ INCORRETO - Falta updatedAt
await prisma.tenant.create({
  data: {
    name: 'New Tenant',
    subdomain: 'new'
  }
});

// ✅ CORRETO - Incluir updatedAt explicitamente
await prisma.tenant.create({
  data: {
    name: 'New Tenant',
    subdomain: 'new',
    updatedAt: new Date()
  }
});
```

**Regra:** Ao fazer `create()` em qualquer model que tenha `@updatedAt`, SEMPRE inclua `updatedAt: new Date()`.

### 7. Nomes de Relação no Prisma: Usar EXATAMENTE o Nome do Schema

**Problema:** Os nomes das relações no Prisma são case-sensitive e devem corresponder EXATAMENTE ao nome definido no schema. Usar o nome errado causa erro.

```typescript
// ❌ INCORRETO - Nome de relação errado
include: {
  auctionStages: true,    // Nome camelCase inventado
  lotCategories: true,    // Nome pluralizado inventado
}

// ✅ CORRETO - Nome exato do schema Prisma
include: {
  AuctionStage: true,     // Exatamente como definido no schema
  LotCategory: true,      // Exatamente como definido no schema
}
```

**Regra:** Sempre consulte o schema Prisma (`prisma/schema.prisma`) para confirmar o nome exato das relações antes de usá-las em `include`, `select`, ou `where`.

## Regras de Middleware Multi-Tenant no Vercel

### 8. LANDLORD_DOMAINS: Match Dinâmico para URLs Vercel

**Problema:** O Vercel gera URLs únicas por deployment (`xxx-yyy.vercel.app`). Uma lista estática de domínios não consegue cobrir todas as variações.

```typescript
// ✅ CORRETO - Match dinâmico para qualquer *.vercel.app
const isVercelApp = hostWithoutPort.endsWith('.vercel.app');
const isLandlord = LANDLORD_DOMAINS.includes(hostWithoutPort) || isVercelApp;
```

**Regra:** Qualquer host terminando em `.vercel.app` deve ser tratado como domínio do landlord, a menos que tenha subdomain explicitamente resolvido.

### 9. CRM Redirect: DESABILITAR para Domínios Vercel

**Problema:** O middleware redireciona `/` para `crm.<domain>` para o landlord. Mas `crm.xxx.vercel.app` não existe no DNS do Vercel, causando ERR_NAME_NOT_RESOLVED.

```typescript
// ✅ CORRETO - Não redirecionar para CRM em domínios Vercel
if (isLandlordDomain) {
  const isVercelDomain = hostWithoutPort.endsWith('.vercel.app');
  if (!isVercelDomain) {
    // Só redireciona para CRM em domínios próprios (bidexpert.com.br)
    return NextResponse.redirect(new URL(`https://crm.${hostWithoutPort}${pathname}`, request.url));
  }
}
```

**Regra:** NUNCA redirecionar para subdomínios (`crm.`, `admin.`, etc.) quando o host é um domínio `.vercel.app`.

### 10. API Routes: Usar `export const dynamic = 'force-dynamic'`

**Problema:** Next.js 14 tenta gerar API routes estaticamente. Routes que usam headers, cookies, ou banco de dados falham no build com `DYNAMIC_SERVER_USAGE`.

```typescript
// ✅ OBRIGATÓRIO em toda API route que acessa banco ou headers
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // ...
}
```

**Regra:** Toda API route (`src/app/api/**/*.ts`) que acessa banco de dados, headers, cookies ou qualquer recurso dinâmico DEVE ter `export const dynamic = 'force-dynamic'`.

## Checklist Pré-Deploy

Antes de fazer push para `main` (deploy):

- [ ] `vercel.json` NÃO contém `prisma db push` ou `migrate deploy` no buildCommand
- [ ] Ambos os schemas Prisma (`schema.prisma` e `schema.postgresql.prisma`) estão sincronizados
- [ ] Toda raw SQL usa aspas duplas em nomes de colunas camelCase
- [ ] Nenhum filtro Prisma mistura `isNot: null` com outros filtros no mesmo nível
- [ ] Todo `create()` inclui `updatedAt: new Date()` em models com `@updatedAt`
- [ ] Nomes de relação correspondem EXATAMENTE ao schema Prisma
- [ ] Middleware trata URLs `.vercel.app` dinamicamente
- [ ] CRM redirect está desabilitado para `.vercel.app`
- [ ] API routes dinâmicas têm `export const dynamic = 'force-dynamic'`
- [ ] Build local passa: `npx prisma generate && npm run build`

## Troubleshooting

### Erro: P1001 Can't reach database server at build time
**Causa:** `prisma db push` ou `prisma migrate deploy` no build command  
**Fix:** Remover do `vercel.json` → buildCommand

### Erro: "column errorMessage does not exist" no PostgreSQL
**Causa:** Raw SQL sem aspas duplas no nome da coluna  
**Fix:** Usar `"errorMessage"` em todas as raw queries

### Erro: "An error occurred in the Server Components render"
**Causa:** Query Prisma inválida (filtros incompatíveis, relação inexistente, campo faltando)  
**Fix:** Verificar regras 5, 6 e 7 acima → Corrigir queries

### Erro: ERR_NAME_NOT_RESOLVED em crm.xxx.vercel.app
**Causa:** Middleware redirecionando para subdomínio CRM em URL Vercel  
**Fix:** Desabilitar CRM redirect para `.vercel.app` (regra 9)

### Erro: DYNAMIC_SERVER_USAGE durante build
**Causa:** API route usando features dinâmicas sem export  
**Fix:** Adicionar `export const dynamic = 'force-dynamic'`

### Erro: "Property xxx does not exist on type YYY"
**Causa:** Nome da relação Prisma incorreto (case-sensitive)  
**Fix:** Verificar nome exato no schema (`prisma/schema.prisma`)

## Histórico de Fixes (Referência)

| # | Commit | Descrição |
|---|--------|-----------|
| 1 | `218b61de` | Quotar colunas camelCase em raw SQL PostgreSQL |
| 2 | `218b61de` | `force-dynamic` em 4 API routes |
| 3 | `f0bc9c6d` | Skip CRM redirect para `.vercel.app` |
| 4 | `f0bc9c6d` | Match dinâmico `*.vercel.app` como landlord |
| 5 | `f687c8de` | Fix Prisma filters (XOR, updatedAt, nomes de relação) |
| 6 | `700b679f` | Remover `prisma db push` do build command |

## Referências

- [vercel.json](../../../vercel.json) — Configuração do deploy
- [middleware.ts](../../../src/middleware.ts) — Middleware multi-tenant
- [prisma.ts](../../../src/lib/prisma.ts) — Instância Prisma com ITSM logging
- [multi-environment SKILL](../multi-environment/SKILL.md) — Isolamento de ambientes
