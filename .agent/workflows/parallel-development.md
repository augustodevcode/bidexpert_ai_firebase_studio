---
description: Workflow obrigatório para desenvolvimento paralelo — isolamento via Git Worktree com porta dedicada por branch
priority: HIGHEST
---

# 🌲 WORKFLOW OBRIGATÓRIO: Isolamento com Git Worktree

> **REGRA CRÍTICA DE MÁXIMA PRIORIDADE:** Este workflow DEVE ser seguido por TODOS os agentes AI (Copilot, Gemini, etc.) e desenvolvedores humanos **ANTES** de iniciar qualquer implementação, alteração ou correção no projeto.

---

## Por que Git Worktree?

O `git worktree` é o mecanismo de isolamento **primário** do BidExpert. Ele permite que múltiplos desenvolvedores (ou agentes AI) trabalhem em **branches diferentes simultaneamente**, cada um em seu próprio diretório, **sem clonar o repositório várias vezes** e sem `git stash`.

```
repositório (.git compartilhado)
│
├── /bidexpert_ai_firebase_studio/          ← raiz do projeto
│   ├── src/                                ← código principal
│   ├── worktrees/                          ← worktrees isolados (gitignored)
│   │   ├── bidexpert-feat-minha-feature/   ← worktree agente AI #1  porta 9006
│   │   ├── bidexpert-fix-bug-urgente/      ← worktree agente AI #2  porta 9007
│   │   └── bidexpert-hotfix-prod/          ← worktree hotfix        porta 9008
│   └── ...
```

**Vantagens sobre clones ou docker sandbox:**
- ✅ Worktrees dentro do workspace — AI agents (Copilot) acessam tudo como projeto único
- ✅ Troca de contexto por `cd` — sem `git stash` ou `git checkout`
- ✅ Histórico e `git fetch` 100% compartilhados entre worktrees
- ✅ Setup em segundos (sem docker build)
- ✅ Builds `.next` e `node_modules` independentes por worktree

---

## 📋 Checklist Obrigatório — INÍCIO de Cada Task

### Passo 0 — Verificar o que já está em execução

```powershell
# Listar worktrees ativos
git worktree list

# Ver portas em uso → escolher uma livre
netstat -ano | Select-String ":900[5-9]|:901" | Select-Object -First 10
```

**Tabela de Portas (reserva por desenvolvedor/agente):**

| Porta | Uso | Quem |
|-------|-----|------|
| 9005  | DEMO — repositório principal | Usuário humano |
| 9006  | DEV worktree #1 | Agente AI #1 / Dev humano A |
| 9007  | DEV worktree #2 | Agente AI #2 / Dev humano B |
| 9008  | Hotfix / revisão de PR | Ad-hoc |
| 9009+ | Extras paralelos | Ad-hoc |

> **REGRA:** Cada worktree DEVE usar porta diferente. Nunca suba dois servidores Next.js na mesma porta.

---

### 🛠️ Scripts Helper Disponíveis

O projeto inclui 4 scripts de automação para worktrees:

| Script | Plataforma | Worktree em | Destaque |
|--------|-----------|-------------|----------|
| `scripts/create-worktree.ps1` | PowerShell | `worktrees/bidexpert-tipo-desc/` (dentro do workspace) | **RECOMENDADO** — auto-detect porta, `.env.local`, npm install, `--Start` |
| `scripts/remove-worktree.ps1` | PowerShell | Limpeza interativa | Remove worktree + branch local/remota |
| `.vscode/setup-worktree.js` | Node.js (cross-platform) | `worktrees/branch/` (dentro do workspace) | Funciona em Linux/Mac/Windows |
| `scripts/worktree-setup.ps1` | PowerShell | `worktrees/branch/` (dentro do workspace) | Equivalente PS do setup-worktree.js |

**Exemplo rápido (RECOMENDADO):**
```powershell
# Criar + porta auto + npm install
.\scripts\create-worktree.ps1 -Descricao auction-filter -Start

# Limpar após merge
.\scripts\remove-worktree.ps1 -Dir bidexpert-feat-auction-filter -DeleteBranch
```

**Alternativa cross-platform:**
```bash
node .vscode/setup-worktree.js add feat/minha-feature 9007
node .vscode/setup-worktree.js remove feat/minha-feature
```

---

### Passo 1 — Criar Branch + Worktree (substitui `git checkout -b`)

```powershell
# Na raiz do projeto principal
$timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$tipo      = "feat"             # feat | fix | hotfix | chore | test | docs
$descricao = "minha-feature"    # ex: auction-filter, login-bug, seed-update
$porta     = 9006               # Porta livre conforme tabela acima

$branch  = "$tipo/$descricao-$timestamp"
$dir     = "worktrees\bidexpert-$tipo-$descricao"

# 1. Atualizar base
git fetch origin demo-stable
git checkout demo-stable
git pull origin demo-stable

# 2. Criar worktree com nova branch a partir de demo-stable (DENTRO do workspace)
git worktree add $dir -b $branch origin/demo-stable

Write-Host "✅ Worktree criado em: $dir" -ForegroundColor Green
Write-Host "   Branch: $branch | Porta: $porta" -ForegroundColor Cyan
```

---

### Passo 2 — Configurar Ambiente no Worktree

```powershell
# Entrar no worktree
Set-Location $dir

# Configurar porta no .env.local
$envContent = Get-Content .env.local -Raw -ErrorAction SilentlyContinue
if (-not $envContent) { $envContent = Get-Content .env.example -Raw }

$envContent = $envContent -replace "PORT=\d+", "PORT=$porta"
if ($envContent -notmatch "PORT=") { $envContent += "`nPORT=$porta" }
Set-Content .env.local $envContent

# Instalar dependências (node_modules é local a cada worktree)
npm install

Write-Host "✅ Ambiente configurado — PORT=$porta" -ForegroundColor Green
```

---

### Passo 3 — Iniciar Servidor

```powershell
# Dentro do diretório do worktree
$env:PORT = $porta
npm run dev
# ➡ Disponível em http://dev.localhost:<porta>
```

> **Nota:** Para testes E2E, use `npm run build && $env:PORT=$porta ; npm start` (sem lazy compilation).

---

### Passo 4 — Desenvolvimento com Commits Atômicos

```powershell
git add <arquivos-alterados>
git commit -m "<tipo>(<escopo>): <descrição>"

# Push direto da branch do worktree
git push -u origin HEAD
```

> Um `git fetch` neste worktree é imediatamente reconhecido pelos outros worktrees — **sem sincronização manual**.

---

### Passo 5 — Exemplos de Cenários Reais

#### Cenário A — Hotfix Urgente sem Interromper Feature

```powershell
# Sem sair do worktree da feature (porta 9006), em outro terminal:
git worktree add worktrees\bidexpert-hotfix -b hotfix/payment-20260301 origin/main
Set-Location worktrees\bidexpert-hotfix
$env:PORT = 9008; npm install; npm run dev
# Corrigir, commitar, push → PR para main
# Voltar: cd ..\..  (feature intacta, porta 9006 funcionando)
```

#### Cenário B — Revisão de PR de Colega

```powershell
git fetch origin
git worktree add worktrees\bidexpert-pr296 origin/fix/contact-email-log-schema
Set-Location worktrees\bidexpert-pr296
$env:PORT = 9009; npm install; npm run dev
# Testar em http://dev.localhost:9009
git worktree remove worktrees\bidexpert-pr296  # limpar após revisão
```

#### Cenário C — Dois Agentes AI em Paralelo

```
Agente Copilot → worktree worktrees/bidexpert-feat-super-opp    porta 9006
Agente Gemini  → worktree worktrees/bidexpert-fix-currency       porta 9007
Ambos dentro do mesmo workspace VS Code → Copilot pode acessar ambos
```

---

## 🔄 Checklist Final — ÚLTIMO TODO do Chat

1. ✅ Todos os testes passaram
2. ✅ Push de todos os commits
3. ✅ Gate Pré-PR executado (ver abaixo)
4. ✅ **PERGUNTAR AO USUÁRIO:** "Deseja que eu crie o Pull Request para demo-stable?"
5. ⏳ Aguardar autorização explícita antes de qualquer merge

### Gate Pré-PR (OBRIGATÓRIO)

```powershell
npm ci                # Sincronizar lockfile
npm run typecheck     # Verificar tipos
npm run build         # Build completo sem erros
npx playwright test   # Testes E2E com evidências
```

Bloqueios:
- PR não abre se algum item acima falhar
- Se `package.json` foi alterado, `package-lock.json` deve estar no mesmo commit
- Sem evidências visuais (prints Playwright) → não pedir aprovação/merge

### Checkpoint de Qualidade Monetária

- Nenhum ponto de UI usa `R$` hardcoded em cálculo dinâmico
- Todos os totais usam `toMonetaryNumber` antes de operações aritméticas
- Formatação default BR (`pt-BR`, `BRL`) correta e sem resíduos de ponto flutuante

### Limpeza Após Merge

```powershell
Set-Location "e:\SmartDataCorp\BidExpert\BidExpertVsCode\bidexpert_ai_firebase_studio"
git worktree remove $dir      # Limpa pasta + referência interna
git branch -d $branch         # Deleta branch local
Write-Host "✅ Worktree removido." -ForegroundColor Green
```

### Mensagem Padrão para Solicitar Autorização

```markdown
---
## ✅ Implementação Concluída!

**Worktree:** `<dir>` | **Branch:** `<branch>` | **Porta:** `<porta>`
**Commits:** <quantidade> commits | **Testes:** ✅ Todos passaram

### Alterações Realizadas:
- [Lista de alterações]

**Deseja que eu crie o Pull Request para demo-stable?** (sim/não)
---
```

---

## ⚠️ Regras de Proteção

- 🚫 **NUNCA** fazer push direto na `main`
- 🚫 **NUNCA** fazer merge sem autorização explícita
- 🚫 **NUNCA** resolver conflitos automaticamente sem revisão
- 🚫 **NUNCA** verificar a mesma branch em dois worktrees simultâneos
- 🚫 **NUNCA** compartilhar `.env.local` entre worktrees

---

## 📦 Quando Usar Docker (Alternativa)

Use Docker **apenas** quando precisar de banco de dados completamente isolado:

```powershell
docker compose -f docker-compose.dev-isolated.yml up -d --build
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Para o restante do desenvolvimento, **Git Worktree é preferido** por ser mais rápido e leve.

---

## 📊 Monitoramento e Referência Rápida

```powershell
git worktree list                            # Ver todos os worktrees
git branch -a | Select-String "feat/|fix/"  # Branches ativas
git log --oneline --graph --all -20          # Histórico visual
git worktree prune                           # Limpar refs obsoletas
```

**Skill detalhada:** `.github/skills/git-worktree-isolation/SKILL.md`
