````skill
---
name: git-worktree-isolation
description: Isolamento de desenvolvimento via Git Worktree — múltiplas branches verificadas simultaneamente em diretórios separados, sem clonar o repositório. Cada worktree usa uma porta própria e contexto de build independente.
priority: HIGHEST
---

# 🌲 Skill: Isolamento de Desenvolvimento com Git Worktree

## O que é Git Worktree?

O `git worktree` permite ter **múltiplos diretórios de trabalho** ligados a um único repositório `.git`.  
Diferente de clonar o repositório duas vezes, o worktree:

- **Compartilha** todo o histórico e objetos `.git` (economiza disco)
- **Isola** completamente os arquivos de trabalho de cada branch em pastas separadas
- **Sincroniza** automaticamente: um `git fetch` em qualquer worktree é visto por todos
- **Elimina** a necessidade de `git stash` ou commits temporários para trocar de contexto

```
repositório principal (.git)
├── /bidexpert_ai_firebase_studio   ← worktree principal (demo-stable / main)
├── /bidexpert-feat-auction-filter  ← worktree #1 (feat/auction-filter-...)  porta 9006
├── /bidexpert-fix-login-bug        ← worktree #2 (fix/login-bug-...)         porta 9007
└── /bidexpert-hotfix-prod          ← worktree #3 (hotfix/prod-...)           porta 9008
```

---

## 📋 Quando Usar Esta Skill

- **Antes de iniciar qualquer task** (feature, fix, hotfix, revisão de PR)
- Quando múltiplos agentes AI ou desenvolvedores trabalham em paralelo
- Quando precisa revisar uma PR localmente sem parar a feature atual
- Quando precisa fazer um hotfix de produção urgente sem interromper a feature em andamento

## Guardrails Operacionais

### Confirmar identidade do runtime
- Se o servidor ativo estiver rodando fora do worktree esperado, todo diagnóstico posterior fica inválido.
- Em execuções em background, preferir `npm --prefix "<worktree>" ...` para evitar `cwd` incorreto.
- Se o stack trace apontar para a raiz do workspace em vez do worktree, reinicie o servidor correto antes de editar qualquer arquivo.

### Baseline de `.env.local`
Antes de login, browser interno ou Playwright no worktree:
- `DATABASE_URL`
- `SESSION_SECRET`
- `AUTH_SECRET`
- `NEXTAUTH_SECRET`

Após subir o servidor, validar:
- `GET /auth/login`
- `GET /api/public/tenants`

### Classificar falhas corretamente
- `ERR_CONNECTION_REFUSED` em múltiplas rotas seguidas normalmente significa servidor morto, porta errada ou OOM, não vários bugs simultâneos.
- Em sweeps longos com `next dev`, usar `NODE_OPTIONS=--max-old-space-size=8192` quando houver histórico de estouro de heap.
- Se `/_next/static/*` responder `404` ou HTML, o runtime ativo está incorreto para browser automation.

### Server Actions e Prisma
- Se diferentes rotas acusarem `input`/`ctx` `undefined`, inspecione primeiro `src/lib/admin-plus/safe-action.ts`.
- Em listagens, aceite `input` ausente com defaults.
- Antes de usar `select`, confirme o nome real do campo no schema Prisma.

---

## 🚀 Workflow Obrigatório: Git Worktree

### Passo 0 — Verificar Worktrees e Portas em Uso

```powershell
# Listar worktrees ativos
git worktree list

# Verificar portas em uso (identificar qual porta está disponível)
netstat -ano | Select-String ":900[5-9] |:901[0-9] " | Select-Object -First 10
```

**Tabela de Portas Reservadas:**

| Porta | Assignado a | Branch Tipo |
|-------|-------------|-------------|
| 9005  | Usuário humano (DEMO/Vercel local) | `demo-stable` |
| 9006  | Agente AI #1 / Dev principal | `feat/*` ou `fix/*` |
| 9007  | Agente AI #2 / Dev secundário | `feat/*` ou `fix/*` |
| 9008  | Hotfix / Revisão de PR | `hotfix/*` ou `review/*` |
| 9009+ | Uso ad-hoc / testes paralelos | qualquer |

> **REGRA CRÍTICA:** Cada worktree DEVE usar uma porta diferente. Nunca suba dois servidores na mesma porta.

---

### Passo 1 — Criar Branch + Worktree

```powershell
# Na raiz do repositório principal
# Formato do diretório: worktrees/bidexpert-<tipo>-<descricao>
# Formato da branch: <tipo>/<descricao>-<timestamp>

$timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$tipo      = "feat"          # feat | fix | hotfix | chore | test | docs
$descricao = "auction-filter"
$porta     = 9006            # Escolher porta livre (ver tabela acima)

$branch = "$tipo/$descricao-$timestamp"
$dir    = "worktrees/bidexpert-$tipo-$descricao"

# 1. Garantir que demo-stable está atualizada
git fetch origin demo-stable
git checkout demo-stable
git pull origin demo-stable

# 2. Criar worktree com nova branch a partir de demo-stable
git worktree add $dir -b $branch origin/demo-stable

Write-Host "✅ Worktree criado em: $dir" -ForegroundColor Green
Write-Host "   Branch: $branch" -ForegroundColor Cyan
Write-Host "   Porta: $porta" -ForegroundColor Cyan
```

---

### Passo 2 — Configurar .env Local no Worktree

Cada worktree precisa de um `.env.local` próprio com a porta correta:

```powershell
# Entrar no diretório do worktree
Set-Location $dir

# Copiar .env.local base e ajustar a porta
Copy-Item .env.local .env.local.bak -ErrorAction SilentlyContinue
$envContent = Get-Content .env.local -Raw -ErrorAction SilentlyContinue
if (-not $envContent) {
    $envContent = Get-Content .env.example -Raw
}

# Substituir/adicionar PORT
$envContent = $envContent -replace "PORT=\d+", "PORT=$porta"
if ($envContent -notmatch "PORT=") {
    $envContent += "`nPORT=$porta"
}
Set-Content .env.local $envContent

Write-Host "✅ .env.local configurado com PORT=$porta" -ForegroundColor Green
```

---

### Passo 3 — Instalar Dependências e Iniciar Servidor

```powershell
# Ainda dentro do diretório do worktree
npm install

# Iniciar servidor na porta correta
$env:PORT = $porta
npm run dev
```

O servidor estará disponível em `http://dev.localhost:$porta`.

---

### Passo 4 — Desenvolvimento Normal

Dentro do worktree, use Git normalmente:

```powershell
git add <arquivos>
git commit -m "feat(auction): add filter by category"
git push -u origin HEAD
```

> Um `git fetch` feito aqui já é visível nos outros worktrees — sem necessidade de `git pull` extra.

---

### Passo 5 — Limpeza e Remoção do Worktree

Após o merge da PR:

```powershell
# Voltar ao repositório principal
Set-Location "e:\SmartDataCorp\BidExpert\BidExpertVsCode\bidexpert_ai_firebase_studio"

# Remover worktree (limpa o diretório e a referência interna)
git worktree remove $dir

# Deletar a branch local se não for mais necessária
git branch -d $branch

Write-Host "✅ Worktree removido com sucesso." -ForegroundColor Green
```

---

## 🔄 Cenários de Uso

### Cenário A — Feature + Hotfix Simultâneos

```
SITUAÇÃO: Estou desenvolvendo feat/auction-filter-20260301 (porta 9006)
          quando surge um hotfix urgente em produção.

SOLUÇÃO:
# Sem interromper a feature, crio um segundo worktree para o hotfix
git worktree add worktrees/bidexpert-hotfix-prod -b hotfix/critical-payment-20260301 origin/main
cd worktrees/bidexpert-hotfix-prod
$env:PORT = 9008
npm install ; npm run dev

# Corrijo o bug, faço o PR para main, depois volto para a feature
cd worktrees/bidexpert-feat-auction-filter
# trabalho continua normalmente na porta 9006
```

### Cenário B — Code Review de PR de Colega

```powershell
# Criar worktree temporário para revisar a PR do colega
git fetch origin
git worktree add worktrees/bidexpert-review-pr296 origin/fix/contact-email-log

cd worktrees/bidexpert-review-pr296
$env:PORT = 9009
npm install ; npm run dev
# Testar a PR em http://dev.localhost:9009

# Após revisão, remover
cd ..
git worktree remove bidexpert-review-pr296
```

### Cenário C — Múltiplos Agentes AI em Paralelo

```
Agente #1 (Copilot):
  Worktree: worktrees/bidexpert-feat-super-opportunities (porta 9006)
  Branch:   feat/super-opportunities-20260301-1000

Agente #2 (Gemini):
  Worktree: worktrees/bidexpert-fix-currency-format (porta 9007)
  Branch:   fix/currency-format-20260301-1100

Ambos compartilham o mesmo .git — commits de um são visíveis ao outro
via git fetch, sem conflitos de porta ou diretório.
```

---

## 🆚 Git Worktree vs Docker Isolado

| Critério | Git Worktree | Docker Sandbox |
|----------|-------------|----------------|
| Isolamento de branch | ✅ Nativo e automático | ⚠️ Requer checkout manual |
| Porta separada | ✅ Por worktree | ✅ Por container |
| Banco de dados isolado | ⚠️ Compartilha (MySQL local) | ✅ Container próprio |
| Velocidade de setup | ✅ Segundos | ⚠️ Minutos (docker build) |
| Economia de disco | ✅ Sem duplicar .git | ⚠️ Layer de imagem |
| Hotfix de emergência | ✅ Ideal | ⚠️ Mais lento |
| CI/CD parity (prod) | ⚠️ Ambiente local | ✅ Mais próximo de prod |

**Recomendação BidExpert:**
- Use **Git Worktree** para desenvolvimento local / features / hotfixes
- Use **Docker Sandbox** quando precisar de banco isolado ou simular prod

---

## ⚠️ Limitações e Cuidados

1. **Uma branch por worktree**: A mesma branch NÃO pode ser verificada em dois worktrees ao mesmo tempo.
2. **node_modules**: Cada worktree requer seu próprio `node_modules` (run `npm install` em cada um).
3. **`.env.local`**: Nunca compartilhar `.env.local` entre worktrees — cada um deve ter sua porta definida.
4. **Git hooks**: Hooks em `.git/hooks` se aplicam a todos os worktrees (isso é esperado).
5. **`next build`**: O diretório `.next` é local a cada worktree, então builds são independentes.

---

## 📌 Comandos Rápidos de Referência

```powershell
# Listar todos os worktrees
git worktree list

# Criar worktree (branch existente)
git worktree add <caminho> <branch>

# Criar worktree (nova branch a partir de outra)
git worktree add <caminho> -b <nova-branch> <base>

# Mover worktree para outro caminho
git worktree move <caminho-antigo> <caminho-novo>

# Remover worktree (limpa diretório + referência)
git worktree remove <caminho>

# Remover referências obsoletas (diretório já apagado manualmente)
git worktree prune

# Exibir detalhes de cada worktree
git worktree list --porcelain
```

---

## ✅ Checklist Rápido por Task

```
[ ] git worktree list → identificar porta livre
[ ] git worktree add worktrees/bidexpert-<tipo>-<desc> -b <branch> origin/demo-stable
[ ] cd worktrees/bidexpert-<tipo>-<desc>
[ ] .env.local → PORT=<porta-livre>
[ ] npm install
[ ] npm run dev  (em background ou terminal separado)
[ ] Desenvolverei na porta http://dev.localhost:<porta>
[ ] git commit atômico a cada mudança significativa
[ ] npm run typecheck && npm run build  (Gate Pré-PR)
[ ] git push -u origin HEAD
[ ] Solicitar PR para demo-stable
[ ] git worktree remove <caminho>  (após merge)
```
````
