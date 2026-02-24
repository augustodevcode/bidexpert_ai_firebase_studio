# Skill: Semantic Release & CI/CD Pipeline

> **REGRA OBRIGATÓRIA:** Todo agente AI (Copilot, Gemini, Claude, OpenSpec) DEVE seguir este padrão de versionamento e esteira de desenvolvimento.

## Visão Geral

O projeto BidExpert usa **Semantic Release** multi-canal para versionamento automático, geração de changelog, tagging e deploy integrado com Vercel.

```
[Commit Conventional] → [Push] → [Quality Gate] → [Semantic Release] → [Inject Version] → [Migrate DB] → [Notify]
```

## 1. Conventional Commits (OBRIGATÓRIO)

### Formato

```
<tipo>(escopo opcional): descrição curta

corpo opcional (múltiplas linhas)

BREAKING CHANGE: descrição (se aplicável)
```

### Tipos e Efeito na Versão

| Tipo | Descrição | Release | Exemplo |
|------|-----------|---------|---------|
| `feat` | Nova funcionalidade | **minor** (1.x.0) | `feat(auction): add discount filter` |
| `fix` | Correção de bug | **patch** (1.0.x) | `fix(login): resolve tenant resolution` |
| `perf` | Melhoria de performance | **patch** | `perf(search): optimize indexed query` |
| `revert` | Reversão de commit | **patch** | `revert: undo previous change` |
| `refactor` | Refatoração sem mudança de comportamento | **patch** | `refactor(middleware): extract helper` |
| `docs` | Documentação | sem release | `docs(readme): update deploy guide` |
| `style` | Formatação, espaçamento | sem release | `style: fix linting warnings` |
| `chore` | Manutenção geral | sem release | `chore(deps): update packages` |
| `test` | Testes | sem release | `test(e2e): add login scenarios` |
| `ci` | Mudanças em CI/CD | sem release | `ci(release): add migration job` |
| `build` | Mudanças no build system | sem release | `build: update webpack config` |
| `BREAKING CHANGE` | Quebra de compatibilidade | **major** (x.0.0) | Footer com `BREAKING CHANGE: ...` |

### Enforcement

- **commitlint** (`.husky/commit-msg`): Rejeita commits fora do padrão automaticamente
- **pre-commit** (`.husky/pre-commit`): Roda typecheck antes de aceitar o commit

### Exemplos Corretos

```bash
# Feature nova
feat(auction): add super opportunities carousel

# Fix com escopo
fix(search): correct discount calculation for FIDC lots

# Performance
perf(api): add database index for lot queries

# Breaking change
feat(auth)!: migrate to NextAuth v5

BREAKING CHANGE: session format changed from JWT to database sessions

# Sem release (documentação)
docs(cicd): add semantic release pipeline documentation

# Manutenção
chore(deps): bump prisma from 5.22 to 5.23
```

## 2. Canais de Release

O `.releaserc.json` define 3 canais:

| Branch | Canal | Tipo | Versão Exemplo | Ambiente | URL Vercel |
|--------|-------|------|----------------|----------|------------|
| `main` | `latest` | Produção | `1.2.0` | PRD | `bidexpertaifirebasestudio.vercel.app` |
| `demo-stable` | `demo` | Prerelease | `1.3.0-demo.1` | DEMO | `demo-bidexpertaifirebasestudio.vercel.app` |
| `hml` | `alpha` | Prerelease | `1.3.0-alpha.1` | HML | `hml-bidexpertaifirebasestudio.vercel.app` |

### Fluxo de Promoção

```
Feature Branch (sem release)
  → PR para demo-stable → Semantic Release gera versão demo (1.3.0-demo.1)
    → PR para main → Semantic Release gera versão produção (1.3.0)
```

## 3. Pipeline de Release (`.github/workflows/release.yml`)

Ativado automaticamente via push em `main`, `demo-stable` ou `hml`.

### Job 1: Quality Gate

```
- Checkout (full history para semantic-release)
- npm ci
- Copy PostgreSQL schema
- prisma generate
- Lint (continue-on-error)
- Typecheck (continue-on-error)
- Build validation
```

### Job 2: Semantic Release

```
- Analisa commits desde última versão
- Gera versão SemVer baseado nos tipos de commit
- Atualiza CHANGELOG.md
- Cria Git Tag (v1.2.0)
- Cria GitHub Release com notas automáticas
- Commit automático: "chore(release): 1.2.0 [skip ci]"
```

### Job 3: Inject Version into Vercel

```
- Instala Vercel CLI
- Remove NEXT_PUBLIC_APP_VERSION existente
- Define nova versão como env var
- Faz redeploy (production ou preview conforme branch)
```

### Job 4: Database Migration

```
- Somente para main e demo-stable
- Copy PostgreSQL schema
- prisma generate
- prisma migrate deploy
- prisma migrate status (verificação)
```

### Job 5: Notification

```
- Relatório final com versão, canal, branch, URLs
- Status de cada job anterior
```

## 4. Configuração (`.releaserc.json`)

Plugins configurados:

| Plugin | Responsabilidade |
|--------|-----------------|
| `@semantic-release/commit-analyzer` | Analisa commits, determina tipo de release |
| `@semantic-release/release-notes-generator` | Gera notas de release em PT-BR |
| `@semantic-release/changelog` | Atualiza `CHANGELOG.md` |
| `@semantic-release/git` | Commit automático de CHANGELOG e package.json |
| `@semantic-release/github` | Cria GitHub Release, comenta em issues |

### Seções do Changelog (PT-BR)

| Tipo | Seção | Visibilidade |
|------|-------|-------------|
| `feat` | Funcionalidades | Visível |
| `fix` | Correções | Visível |
| `perf` | Performance | Visível |
| `revert` | Reversões | Visível |
| `refactor` | Refatorações | Visível |
| `docs` | Documentação | Oculta |
| `style` | Estilo | Oculta |
| `chore` | Manutenção | Oculta |
| `test` | Testes | Oculta |
| `ci` | CI/CD | Oculta |

## 5. Variáveis de Versão

O `next.config.mjs` injeta automaticamente:

| Variável | Fonte | Descrição |
|----------|-------|-----------|
| `NEXT_PUBLIC_APP_VERSION` | Vercel env + Semantic Release | Versão semântica (ex: `1.2.0`) |
| `NEXT_PUBLIC_BUILD_ID` | `crypto.randomUUID()` | Identificador único do build |
| `NEXT_PUBLIC_BUILD_ENV` | `process.env.NODE_ENV` | Ambiente (development/production) |

### Exibição no App

- **Componente**: `src/components/layout/app-version-badge.tsx`
- **Localização**: Footer do site
- **Comportamento**: Clicável, leva para `/changelog`
- **Informações**: Versão, canal (latest/demo/alpha), build ID, ambiente (PRD/PREVIEW/DEV)

### Página de Changelog

- **Rota**: `/changelog`
- **Componente SSR**: `src/app/changelog/page.tsx`
- **Renderização**: Lê `CHANGELOG.md` do filesystem, converte MD → HTML styled
- **SEO**: Metadata com título "Changelog - BidExpert"

## 6. Secrets Necessários no GitHub

| Secret | Uso | Obrigatório |
|--------|-----|------------|
| `GITHUB_TOKEN` | Semantic release (tags, releases, comments) | Automático |
| `VERCEL_TOKEN` | Deploy + injeção de versão no Vercel | Sim |
| `VERCEL_ORG_ID` | Identificação da organização Vercel | Sim |
| `VERCEL_PROJECT_ID` | Identificação do projeto Vercel | Sim |
| `PROD_DATABASE_URL_DIRECT` | Migração DB produção (main) | Sim |
| `DEMO_DATABASE_URL_DIRECT` | Migração DB demonstração (demo-stable) | Sim |

### Variáveis de Ambiente Vercel

| Variável | Environment | Valor |
|----------|------------|-------|
| `NEXT_PUBLIC_APP_VERSION` | Production + Preview | Atualizada automaticamente pelo CI/CD |
| `NEXT_PUBLIC_BUILD_ID` | Todas | Gerado no build |
| `NEXT_PUBLIC_BUILD_ENV` | Todas | `NODE_ENV` |

## 7. Fluxo Diário do Desenvolvedor

```bash
# 1. Criar branch a partir de demo-stable
git checkout demo-stable && git pull
git checkout -b feat/minha-feature-$(date +%Y%m%d)

# 2. Desenvolver com commits conventional
git add .
git commit -m "feat(module): add new feature"

# 3. Push para origin
git push origin feat/minha-feature-20260201

# 4. Criar PR para demo-stable
# → CI Quality Gate roda automaticamente
# → Após merge: Semantic Release gera versão demo

# 5. Quando estável: criar PR demo-stable → main
# → Semantic Release gera versão produção
```

## 8. Regras Críticas

1. **NUNCA** incluir `prisma db push` / `prisma migrate deploy` no `buildCommand` do Vercel
2. **SEMPRE** usar Conventional Commits — commits fora do padrão são rejeitados
3. **Deploy SOMENTE via `git push`** — NUNCA deploy direto via CLI Vercel em produção
4. **Alterar AMBOS schemas Prisma** ao modificar modelos (`schema.prisma` + `schema.postgresql.prisma`)
5. **NUNCA** insira tokens ou senhas no chat; use `.env`
6. O commit automático do semantic-release usa `[skip ci]` para evitar loop
7. Full history (`fetch-depth: 0`) é obrigatório para o semantic-release analisar commits

## 9. Troubleshooting

### Commit rejeitado pelo commitlint

```bash
# Verificar formato
echo "feat(scope): description" | npx commitlint --verbose

# Formatos inválidos comuns:
# ❌ "Added new feature" → Falta tipo
# ❌ "feat: " → Descrição vazia
# ❌ "FEAT(scope): description" → Tipo deve ser lowercase
```

### Semantic Release não gera nova versão

- Verificar se commits incluem `feat:`, `fix:`, `perf:` ou `BREAKING CHANGE`
- Commits `docs:`, `chore:`, `test:`, `ci:` NÃO geram release
- Verificar se branch está configurada no `.releaserc.json`

### Pipeline falha no Quality Gate

```bash
# Reproduzir localmente
cp prisma/schema.postgresql.prisma prisma/schema.prisma
npx prisma generate
npm run lint
npm run typecheck
npm run build
```

### Versão não aparece no Footer

- Verificar se `NEXT_PUBLIC_APP_VERSION` está definida no Vercel
- Verificar se o job `inject-version` executou com sucesso
- Verificar se houve redeploy após injeção

## 10. Arquivos-Chave

| Arquivo | Propósito |
|---------|-----------|
| `.releaserc.json` | Configuração multi-canal do Semantic Release |
| `.github/workflows/release.yml` | Pipeline de 5 jobs |
| `commitlint.config.js` | Regras de conventional commits |
| `.husky/commit-msg` | Hook de validação de commits |
| `.husky/pre-commit` | Hook de typecheck antes de commit |
| `CHANGELOG.md` | Changelog automático (gerado pelo semantic-release) |
| `next.config.mjs` | Injeção de variáveis de versão no build |
| `src/components/layout/app-version-badge.tsx` | Badge de versão no Footer |
| `src/app/changelog/page.tsx` | Página de changelog SSR |
| `src/app/changelog/changelog-content.tsx` | Renderizador de markdown para HTML |
| `docs/CICD_SECRETS_CHECKLIST.md` | Documentação de secrets necessários |

## Referências

- [AGENTS.md](../../../AGENTS.md) — Diretrizes globais para agentes
- [copilot-instructions.md](../../copilot-instructions.md) — Instruções para Copilot
- [GEMINI.md](../../../context/GEMINI.md) — Instruções para Gemini
- [CLAUDE.md](../../../.claude/CLAUDE.md) — Instruções para Claude
- [multi-environment SKILL](../multi-environment/SKILL.md) — Isolamento de ambientes
- [vercel-postgresql-deploy SKILL](../vercel-postgresql-deploy/SKILL.md) — Regras de deploy Vercel
- [parallel-development workflow](../../../.agent/workflows/parallel-development.md) — Workflow de branches
