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

### 2. Iniciar Sandbox Dev em Container (OBRIGATÓRIO)

**REGRA ABSOLUTA:** Nenhum agente deve modificar arquivos antes de inicializar um ambiente isolado.

```powershell
# Parar containers anteriores
docker compose -f docker-compose.dev-isolated.yml down

# Iniciar container isolado (Sandbox)
docker compose -f docker-compose.dev-isolated.yml up -d --build

# Confirmar
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

**Portas Reservadas por Ambiente (Ajustar no YML se necessário):**
| Porta | Ambiente | Uso |
|-------|----------|-----|
| 9005  | DEMO Principal | Usuário humano |
| 9006  | DEV Secundário | Agente AI #1 Sandbox |
| 9007  | DEV Terciário | Agente AI #2 Sandbox |

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

## 🔒 Proteções

- **Nunca** fazer push direto na `main`
- **Nunca** fazer merge sem autorização explícita
- **Sempre** rodar testes antes de solicitar merge
- **Sempre** documentar alterações no commit/PR
