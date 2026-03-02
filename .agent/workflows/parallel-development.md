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

### 1. Criar Branch a partir da demo-stable

```powershell
# Sincronizar com a demo-stable
git fetch origin demo-stable
git checkout demo-stable
git pull origin demo-stable

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
node .vscode/start-9006-dev.js
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
   - Criar Pull Request para `demo-stable`
   - Fazer merge com outras PRs pendentes

### Gate Pré-PR (OBRIGATÓRIO)

Antes de abrir PR, executar e registrar obrigatoriamente:
1. `npm ci` (sincronia entre `package.json` e `package-lock.json`)
2. `npm run typecheck`
3. `npm run build`
4. Testes da entrega + evidência Playwright (prints e link do relatório)

Bloqueios:
- Não abrir PR se algum item falhar.
- Se `package.json` for alterado, `package-lock.json` atualizado no mesmo commit é obrigatório.
- Não pedir aprovação/merge sem evidências visuais de testes passando.

### Checkpoint Adicional de Qualidade Monetária (OBRIGATÓRIO)

Antes do push final, validar:
- Nenhum ponto de UI usa `R$` hardcoded para cálculo/exibição dinâmica.
- Todos os totais/comissões usam normalização numérica prévia (`toMonetaryNumber`).
- Formatação default BR (`pt-BR`, `BRL`) está correta e sem resíduos de ponto flutuante.
- Seletor global de moeda (BRL/USD/EUR) altera a exibição nos componentes client-side críticos.

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
1. [ ] Criar Pull Request para `demo-stable`
2. [ ] Revisar e resolver conflitos com outras PRs (se houver)
3. [ ] Fazer merge em `demo-stable`

**Deseja que eu prossiga com a criação do PR para demo-stable?** (sim/não)
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

## 🌲 Git Worktrees — Desenvolvimento Paralelo em Diretórios Isolados

Git worktrees permitem ter múltiplas branches abertas simultaneamente em diretórios separados, sem necessidade de `git stash` ou troca de branch.

### Quando Usar Worktrees

- Quando dois ou mais agentes AI precisam trabalhar em paralelo na **mesma máquina**.
- Quando o desenvolvedor quer manter o diretório principal limpo enquanto testa outra feature.
- Como alternativa ao `git stash` quando a troca de contexto é frequente.

### Configuração Inicial

O repositório inclui scripts de gerenciamento de worktrees:

| Script | Plataforma | Uso |
|--------|-----------|-----|
| `.vscode/setup-worktree.js` | Node.js (cross-platform) | `node .vscode/setup-worktree.js <comando>` |
| `scripts/worktree-setup.ps1` | PowerShell (Windows) | `.\scripts\worktree-setup.ps1 <comando>` |

Os worktrees são criados dentro de `worktrees/` (excluído do git via `.gitignore`).

### Comandos Disponíveis

```powershell
# Criar worktree para nova branch (a partir de demo-stable)
node .vscode/setup-worktree.js add feat/minha-feature-20260302 9007
# ou no PowerShell
.\scripts\worktree-setup.ps1 add feat/minha-feature-20260302 9007

# Listar worktrees ativos
node .vscode/setup-worktree.js list

# Remover worktree
node .vscode/setup-worktree.js remove feat/minha-feature-20260302

# Limpar referências obsoletas
node .vscode/setup-worktree.js prune
```

### Fluxo Recomendado com Worktrees

```powershell
# 1. Criar worktree + branch na porta dedicada
node .vscode/setup-worktree.js add feat/minha-feature-20260302 9007

# 2. Entrar no diretório do worktree
cd worktrees/feat-minha-feature-20260302

# 3. Instalar dependências (se necessário)
npm install

# 4. Iniciar servidor na porta dedicada
$env:PORT = 9007
npm run dev

# 5. Desenvolver, testar, commitar normalmente
git add .
git commit -m "feat: minha feature"
git push -u origin feat/minha-feature-20260302

# 6. Voltar ao diretório principal (branch original inalterada)
cd ../..

# 7. Ao finalizar, remover o worktree
node .vscode/setup-worktree.js remove feat/minha-feature-20260302
```

### Regras de Worktrees

- Cada worktree possui sua **própria branch** e **estado de trabalho independente**.
- O `.env` e `node_modules` **não são compartilhados** entre worktrees — instale dependências em cada um separadamente.
- **Nunca** use a mesma branch em dois worktrees ao mesmo tempo (git não permite).
- Worktrees criados dentro de `worktrees/` são **ignorados pelo git** (`.gitignore`).
- Ao terminar, sempre execute `remove` ou `prune` para evitar referências obsoletas.

## 🔒 Proteções

- **Nunca** fazer push direto na `main`
- **Nunca** fazer merge sem autorização explícita
- **Sempre** rodar testes antes de solicitar merge
- **Sempre** documentar alterações no commit/PR
