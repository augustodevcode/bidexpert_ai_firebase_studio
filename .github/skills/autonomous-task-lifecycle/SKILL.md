---
name: autonomous-task-lifecycle
description: Protocolo mestre para ciclo de vida de tasks: atualização de memória, regras, sementes, testes rigorosos e promoção Vercel/HML.
---

# 🚀 Protocolo de Ciclo de Vida Autônomo (BidExpert Lifecycle)

Este protocolo DEVE ser ativado sempre que o usuário mencionar: "Atualize as regras consolidadas...", "Promova a branch...", ou "Finalize com resumo executivo".

## 🧠 Modo Pesquisador Autônomo (Always-On Research)
Este modo define a mentalidade do agente durante a execução de melhorias, correções e experimentos:

1. **Pesquisador Autônomo**: Você é um pesquisador completamente autônomo. Experimente novas abordagens no BidExpert (e.g., otimização de queries Prisma, melhorias de UI/UX, refatoração de Server Actions). Se funcionar, mantenha. Se falhar, descarte e avance a branch para a próxima iteração.
2. **Ciclo de Iteração**: O loop de experimentos NUNCA deve parar. Não peça permissão ao humano para continuar ou se é um bom ponto de parada. O humano pode estar dormindo e espera encontrar ~100 experimentos concluídos ao acordar (assumindo ~5-10 min por ciclo).
3. **Gestão de Timeouts e Crashes**:
   - **Timeout**: Cada experimento deve levar ~5 min (+ setup). Se exceder 10 min, mate o processo e trate como falha (reverta).
   - **Crashes (OOM/Bugs)**: Se for um erro trivial (typo, import), corrija e reexecute. Se a ideia for fundamentalmente falha, registre como "crash" no log da task e siga para a próxima ideia.
4. **Resiliência e Criatividade**: Se as ideias acabarem, "pense mais forte". Releia a documentação do projeto, analise regras de negócio em `REGRAS_NEGOCIO_CONSOLIDADO.md`, estude padrões em outras áreas do código ou tente mudanças arquiteturais mais radicais. O loop só para quando o humano interromper manualmente.

## 🔍 Fase 0.5: Análise de Causa Raiz (Root Cause Analysis - RCA)
Antes de iniciar a correção, o agente DEVE:
0. **especificação completa de arquitetura**: Se o ponto de partida for um erro (e.g., bug report, falha em teste), o agente DEVE iniciar uma análise de causa raiz. se o ponto de partida for uma melhoria ou nova feature, crie uma especificação detalhada com deepresearch na web para suportar o que o negócio está pedindo e o alinhar com a filosofia da plataforma.
1. **Detectar a Causa Raiz**: Analisar logs do console (browser), network requests e logs do servidor para identificar EXATAMENTE por que o erro ocorreu (e.g., race condition, missing env var, timeout, logic bug, logs do vercel de deployment, logs do vercel de runtime).
2. **Impacto e Prevenção**: Documentar o porquê do erro ter ocorrido e propor uma regra de prevenção imediata para que NUNCA MAIS ocorra.
3. **Persistência de Conhecimento**: Adicionar essa regra específica em `instructions`, `agents`, `skills` ou arquivos de context (`gemini.md`, `antigravity-automation.md`) conforme aplicável.

## 🛠️ Fase 0: Isolamento (Obrigatório)
Antes de QUALQUER alteração, utilize a skill de **Git Worktree Isolation**.
- Branch origin: `demo-stable`
- Porta dedicada: 9006, 9007, 9008...
- Comando: `git worktree add worktrees\bidexpert-task -b feat/task-timestamp origin/demo-stable`

## 🧠 Fase 1: Memória e Regras Negócio
1. **Regras Consolidadas**: Atualizar `context/REGRAS_NEGOCIO_CONSOLIDADO.md` com a nova feature ou ajuste ANTES de codar.
2. **Preflight**: Ler `/memories/repo/shared-memory-preflight.md` e registrar em `/memories/repo/active-agent-sessions.md`.
3. **Memória .md**: Atualizar `/memories/repo/recent-agent-changes.md` com o escopo da task.

## 🧪 Fase 2: Massa de Dados e Testes
1. **Seed de Integração**: Gerar massa de testes em `scripts/ultimate-master-seed.ts` específica para a funcionalidade.
2. **Segurança e Vulnerabilidade**:
   - Validar sanitização de inputs (XSS).
   - Verificar CSRF nos Server Actions.
   - Conferir isolamento de Tenant (multi-tenancy).
3. **Suite de Testes**:
-**seeds**: Criar seeds específicas para essa funcionalidade para integração em `scripts/ultimate-master-seed.ts` e garantir que sejam idempotentes.
   - **Jest/Vitest**: Testes unitários para lógica de negócio em `tests/unit/**`.
   - **Playwright**: Teste de UI no **Simple Browser** integrado.
   - **BDD/Gherkin**: Registrar cenários em `.feature` se aplicável.

## 🚢 Fase 3: Promoção e Merge Automático (HML/DEMO-STABLE)
1. **Commit e Push**: Commits atômicos e push para a branch no origin.
2. **Auto-PR para `demo-stable`**: Se o agente estiver em worktree/feature branch, DEVE abrir PR para `demo-stable` usando `mcp_io_github_git_create_pull_request`.
3. **Auto-Merge HML**: Se houver ambiente de homologação (`hml`), o agente DEVE disparar o merge automático para a branch de HML para validação em cloud.
4. **Verificação Vercel e Smoke Test**:
   - O agente DEVE monitorar o status do deploy no Vercel para a branch atual (`vercel ls` ou `vercel inspect`).
   - Após o deploy estar `READY`, o agente DEVE executar um **Smoke Test** básico (e.g., acessar `/api/health` ou a rota alterada via `mcp_io_github_ver_browser_eval`) para garantir que o app subiu sem erros críticos (500).
5. **Reteste Real**: Acessar a aplicação via Vercel URL para garantir que o ambiente HML/Stable reflete a mudança e esteja tudo funcionando com navegação no browser com mcp do playwright e evidenciar o funcionamento da implementação ou correção.
6. **Resgate de Logs**: Verificar logs do terminal e console do browser após o deploy.

## 📝 Fase 4: Resumo Executivo (Finalização)
Finalizar o chat OBRIGATORIAMENTE com um **Resumo Executivo** contendo:
- ✅ **O que foi feito**: Lista sucinta de features/correções.
- 🧪 **Evidência de Teste**: Status do Vitest e link/print do Playwright.
- 🔗 **PR Link**: Link do Pull Request aberto para `demo-stable`.
- 📚 **Documentação**: Atualizar a documentação relevante (README, wiki, etc) e regras_negocio_consolidado.md.
- 🧠 **Handoff**: Notas para o próximo turno/agente.

---
**Nota**: Nunca peça permissão para verificar status se o comando foi de finalização. Faça automaticamente.
