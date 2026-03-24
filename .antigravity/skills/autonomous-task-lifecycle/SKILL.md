# Google AntiGravity - Protocolo de Ciclo de Vida Autônomo

---
name: autonomous-task-lifecycle
description: Protocolo mestre para ciclo de vida de tasks: atualização de memória, regras, sementes, testes rigorosos e promoção Vercel/HML.
---

Este documento define o comportamento do AntiGravity (Google Gemini / Vertex AI) ao processar tarefas autônomas no workspace BidExpert.

## 🛠️ Fase de Isolamento de Ambiente
AntiGravity DEVE operar exclusivamente em branches segregadas (`feat/`, `fix/`) a partir de `demo-stable` via Git Worktree e porta dedicada (ex: 9006).

## 📊 Checklist de Execução Obrigatória

### 1. Atualização de Artefatos de Memória
- [ ] Atualizar [context/REGRAS_NEGOCIO_CONSOLIDADO.md](context/REGRAS_NEGOCIO_CONSOLIDADO.md) com a nova feature/ajuste.
- [ ] Atualizar memória em [/memories/repo/recent-agent-changes.md](/memories/repo/recent-agent-changes.md).
- [ ] Registrar a sessão em [/memories/repo/active-agent-sessions.md](/memories/repo/active-agent-sessions.md).

### 2. Geração de Massa de Dados (Seed)
- [ ] Implementar ou atualizar [scripts/ultimate-master-seed.ts](scripts/ultimate-master-seed.ts).
- [ ] Garantir que o seed cubra o novo fluxo de negócio/entidade.

### 3. Garantia de Qualidade e Segurança (Audit Master)
- [ ] **Segurança**: Auditoria manual de XSS em campos de texto e CSRF em Server Actions.
- [ ] **Clean Code**: Refatorar funções longas e garantir tipagem Zod em todos os inputs.
- [ ] **Unit Tests**: Criar/atualizar testes em `tests/unit/**` usando Vitest ou Jest.
- [ ] **E2E Tests**: Executar Playwright via terminal ou Vitest UI e gravar evidências visuais (screenshots).
- [ ] **Integridade Visual**: Testar no **Simple Browser** e monitorar console do navegador.

### 4. Ciclo de Promoção de Código
- [ ] Push da branch para o origin.
- [ ] Monitorar deploy no Vercel (`vercel inspect / ls`).
- [ ] **Reteste de Ambiente**: Acessar o ambiente de homologação (`*.vercel.app` ou `hml.localhost`) e provar o funcionamento.

## 📝 Resumo Executivo (Finalização)
O AntiGravity deve encerrar o chat obrigatoriamente com o bloco:

> **Resumo Executivo da Task**
> - **Mudanças**: [Lista]
> - **Testes Unitários**: [Status Vitest]
> - **Testes E2E/UI**: [Status Playwright]
> - **Status HML/Demo**: [Deploy Vercel]
> - **Vulnerabilidades**: [Audit Trail]
> - **Branch/PR**: [Link/Ref]

---
**Invocação Automática**: Este protocolo é ativado por keywords no chat relacionadas a "finalização", "promoção", "regras consolidadas" ou "resumo executivo".
