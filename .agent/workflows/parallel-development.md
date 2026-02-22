---
description: Workflow obrigatório para desenvolvimento paralelo com múltiplos agentes AI (Copilot/GitHub Chat)
priority: HIGHEST
---

# 🚀 WORKFLOW OBRIGATÓRIO: Desenvolvimento Paralelo com Branches

> **REGRA CRÍTICA:** Este workflow DEVE ser seguido por TODOS os agentes AI antes de iniciar qualquer implementação, alteração ou correção no projeto.

## Objetivo

Permitir que múltiplos desenvolvedores (humanos ou agentes AI como Copilot GitHub Chat) trabalhem em paralelo, cada um com:
- Sua própria **branch** dedicada
- Sua própria **porta de desenvolvimento** (9005, 9006, 9007, etc.)
- Seus próprios **testes isolados**

## 📋 Checklist Obrigatório (Início de Cada Task)

### 1. Criar Branch a partir da Main

```powershell
# Sincronizar com a main
git fetch origin main
git checkout main
git pull origin main

# Criar branch para a feature/fix
git checkout -b <tipo>/<descricao-curta>-<timestamp>
# Exemplos:
# git checkout -b feat/auction-list-filter-20260131
# git checkout -b fix/login-tenant-resolution-20260131
# git checkout -b chore/seed-update-20260131
```

**Nomenclatura de Branches:**
- `feat/` - Nova funcionalidade
- `fix/` - Correção de bug
- `chore/` - Manutenção, refatoração, seeds
- `docs/` - Documentação
- `test/` - Testes

### 2. Verificar Porta Disponível

```powershell
# Verificar portas em uso
netstat -ano | findstr "9005 9006 9007 9008 9009"

# Usar a primeira porta livre (9005, 9006, 9007...)
```

**Portas Reservadas por Ambiente:**
| Porta | Ambiente | Uso |
|-------|----------|-----|
| 9005  | DEV Principal | Desenvolvimento padrão |
| 9006  | DEV Secundário | Agente AI #2 |
| 9007  | DEV Terciário | Agente AI #3 |
| 9008  | DEV Quaternário | Agente AI #4 |
| 9009  | HML/Testes | Homologação |

### 3. Iniciar Servidor na Porta Dedicada

```powershell
# Definir porta e iniciar
$env:PORT=9006  # Ajustar conforme disponibilidade
npm run dev
```

### 4. Executar Desenvolvimento e Testes

Durante o desenvolvimento:
- Fazer commits frequentes e atômicos
- Rodar testes a cada alteração significativa
- Documentar mudanças no código

```powershell
# Commits atômicos
git add <arquivos-alterados>
git commit -m "<tipo>(<escopo>): <descrição>"
# Exemplo: git commit -m "feat(auction): add filter by status"

# Rodar testes
npm run test
npx playwright test --project=chromium
```

### 5. Push da Branch

```powershell
git push -u origin <nome-da-branch>
```

## 🔄 Checklist Final (Último TODO do Chat)

**ANTES de finalizar o chat, o agente DEVE:**

1. ✅ Garantir que todos os testes passaram
2. ✅ Documentar as alterações realizadas
3. ✅ Fazer push de todos os commits
4. ✅ **SOLICITAR AUTORIZAÇÃO DO USUÁRIO** para:
   - Criar Pull Request para a main
   - Fazer merge com outras PRs pendentes

### Mensagem Padrão para Solicitar Autorização

```markdown
---
## ✅ Implementação Concluída!

**Branch:** `<nome-da-branch>`
**Commits:** <quantidade> commits
**Testes:** ✅ Todos passaram

### Alterações Realizadas:
- [Lista de alterações]

### Próximos Passos (Requer Autorização):
1. [ ] Criar Pull Request para `main`
2. [ ] Revisar e resolver conflitos com outras PRs (se houver)
3. [ ] Fazer merge na `main`

**Deseja que eu prossiga com o merge na main?** (sim/não)
---
```

## ⚠️ Regras de Conflito

Se houver conflitos com outras branches:
1. **NÃO** fazer merge automático
2. Listar os arquivos em conflito
3. Aguardar decisão do usuário sobre como resolver

## 📊 Monitoramento de Branches Ativas

O agente pode verificar branches ativas:
```powershell
git branch -a | Select-String "feat/|fix/|chore/"
git log --oneline --graph --all -20
```

## 🔒 Proteções

- **Nunca** fazer push direto na `main`
- **Nunca** fazer merge sem autorização explícita
- **Sempre** rodar testes antes de solicitar merge
- **Sempre** documentar alterações no commit/PR

## 🔖 Semantic Release & Conventional Commits

> **REGRA OBRIGATÓRIA:** Todos os commits DEVEM seguir o padrão **Conventional Commits** para que o Semantic Release funcione corretamente.

### Formato do Commit

```
<tipo>(escopo opcional): descrição curta em inglês ou PT-BR
```

### Tipos e Efeito na Versão

| Tipo | Efeito | Exemplo |
|------|--------|---------|
| `feat` | minor (1.x.0) | `feat(auction): add discount filter` |
| `fix` | patch (1.0.x) | `fix(login): resolve tenant resolution` |
| `perf` | patch | `perf(search): optimize indexed query` |
| `refactor` | patch | `refactor(middleware): extract helper` |
| `revert` | patch | `revert: undo previous change` |
| `docs` | sem release | `docs(readme): update deploy guide` |
| `style` | sem release | `style: fix formatting` |
| `chore` | sem release | `chore(deps): update packages` |
| `test` | sem release | `test(e2e): add login scenarios` |
| `ci` | sem release | `ci(release): add migration job` |
| `BREAKING CHANGE` | major (x.0.0) | Footer com `BREAKING CHANGE: ...` |

### Enforcement Automático

- **commitlint** (`.husky/commit-msg`): Rejeita commits fora do padrão
- **pre-commit** (`.husky/pre-commit`): Roda typecheck antes de aceitar

### Canais de Release por Branch

| Branch | Canal | Versão Exemplo | Ambiente |
|--------|-------|----------------|----------|
| `main` | latest (produção) | `1.2.0` | PRD |
| `demo-stable` | demo (prerelease) | `1.3.0-demo.1` | DEMO |
| `hml` | alpha (prerelease) | `1.3.0-alpha.1` | HML |

### Fluxo de Feature → Release

```
1. git checkout -b feat/minha-feature (a partir de demo-stable)
2. Desenvolver + commits conventional (feat:, fix:, etc.)
3. git push origin feat/minha-feature
4. Criar PR → demo-stable (pipeline roda Quality Gate)
5. Merge PR → Semantic Release gera versão demo (ex: 1.3.0-demo.1)
6. Quando estável: PR demo-stable → main → Semantic Release gera versão produção (ex: 1.3.0)
```

### Pipeline Automático (`.github/workflows/release.yml`)

Ativado em push para `main`, `demo-stable` ou `hml`:

```
Quality Gate → Semantic Release → Inject Version (Vercel) → Migrate DB → Notify
```

### Variáveis de Versão no App

- `NEXT_PUBLIC_APP_VERSION`: Versão semântica
- `NEXT_PUBLIC_BUILD_ID`: Identificador do build
- `NEXT_PUBLIC_BUILD_ENV`: Ambiente (development/production)
- Exibidas no Footer via `AppVersionBadge` com link para `/changelog`
