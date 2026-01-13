# Catálogo de Skills — BidExpert Platform

**Versão:** 2.2  
**Data:** 2026-01-13  
**Status:** P0 + P1 + Personas Completo ✅

---

## Resumo Executivo

| Skill | Trilha | Prioridade | Status | Comando |
|-------|--------|------------|--------|---------|
| DEV-01 Build Gate | DEV | P0 | ✅ | `npm run build && npm run typecheck` |
| DEV-02 Tenant Isolation | DEV | P0 | ✅ | `npm run skill:tenant-isolation` |
| DEV-03 Schema Lint | DEV | P0 | ✅ | `npm run skill:schema-lint` |
| DEV-04 Security Headers | DEV | P0 | ✅ | `npm run skill:security-headers` |
| DEV-06 Visual Regression | DEV | P0 | 📋 | `npm run test:visual` |
| OPS-01 Prebuild E2E | OPS | P0 | ✅ | `npm run test:e2e:smoke` |
| OPS-02 DB Metrics | OPS | P0 | ✅ | `npm run skill:db-metrics` |
| OPS-03 Audit Trail | OPS | P0 | ✅ | `npm run skill:audit-report` |
| STR-01 Jornada Negociador | STR | P1 | ✅ | `npm run test:e2e:negociador` |
| STR-02 Risk Matrix | STR | P1 | ✅ | `npm run skill:risk-matrix` |
| STR-03 Conversion Funnel | STR | P1 | ✅ | `npm run skill:funnel` |
| **STR-04 Jornada Leiloeiro** | STR | P1 | ✅ | `npm run test:e2e:leiloeiro` |
| **STR-05 Jornada Comitente** | STR | P1 | ✅ | `npm run test:e2e:comitente` |
| **STR-06 Jornada Advogado** | STR | P1 | ✅ | `npm run test:e2e:advogado` |
| **STR-07 Jornada Administrador** | STR | P1 | ✅ | `npm run test:e2e:admin` |
| **STR-08 Jornada Agente** | STR | P1 | ✅ | `npm run test:e2e:agente` |
| **ALL PERSONAS** | STR | - | ✅ | `npm run test:e2e:all-personas` |

---

## Visão Geral

Este catálogo define "Skills" como rotinas acionáveis que aceleram desenvolvimento, garantem estabilidade e validam valor de produto. Cada skill tem:

- **Inputs**: parâmetros de entrada
- **Execução**: comandos/passos
- **Outputs**: artefatos gerados (JSON, Markdown, HTML)
- **KPI**: métrica de sucesso
- **Guardrails**: restrições obrigatórias

---

## Trilhas

| Trilha | Foco | Público |
|--------|------|---------|
| **DEV** | Engenharia, qualidade, segurança de código | Desenvolvedores |
| **OPS** | Execução, confiabilidade, compliance técnico | DevOps, QA |
| **STR** | Produto, risco, conversão, governança | PO, Negócio |

---

## P0 — Estabilidade e Performance (Fundação)

### DEV-01: Build/Typecheck Gate ✅

**Objetivo:** Bloquear regressões de build/TS antes de qualquer release/teste.

| Campo | Valor |
|-------|-------|
| **Prioridade** | P0 |
| **Status** | ✅ Implementado e Validado |
| **Âncoras** | `package.json`, `next.config.mjs`, `tsconfig.json` |
| **Comandos** | `npm run typecheck`, `npm run build`, `npm run lint` |
| **Inputs** | Branch/commit alvo, `.env` local |
| **Outputs** | JSON (resumo), MD (falhas por arquivo), HTML (se disponível) |
| **KPI** | 0 erros TS/ESLint e build OK |
| **CI/Local** | Ambos |

```bash
# Execução local
npm run typecheck && npm run build && npm run lint
```

---

### DEV-02: Multi-tenant Isolation Validator ✅

**Objetivo:** Detectar acesso cruzado entre tenants e ausência de filtro `tenantId`.

| Campo | Valor |
|-------|-------|
| **Prioridade** | P0 |
| **Status** | ✅ Implementado |
| **Script** | `npm run skill:tenant-isolation` |
| **Âncoras** | `scripts/validate-tenant-isolation.ts`, `src/**/*.ts` |
| **Inputs** | Código fonte TypeScript |
| **Outputs** | `test-results/tenant-isolation.json`, `test-results/tenant-isolation.md` |
| **KPI** | 0 violações críticas |
| **CI/Local** | Ambos |

**Verificações:**
- Queries Prisma em modelos tenant-scoped sem filtro tenantId
- TenantId hardcoded em código (exceto seeds)
- Padrões perigosos (findMany sem where)

---

### DEV-03: Prisma Schema Linter ✅

**Objetivo:** Garantir consistência do schema: índices, relações, convenções.

| Campo | Valor |
|-------|-------|
| **Prioridade** | P0 |
| **Status** | ✅ Implementado |
| **Script** | `npm run skill:schema-lint` |
| **Âncoras** | `scripts/lint-prisma-schema.ts`, `prisma/schema.prisma` |
| **Inputs** | Schema Prisma |
| **Outputs** | `test-results/schema-lint.json`, `test-results/schema-lint.md` |
| **KPI** | 0 issues críticos |
| **CI/Local** | Ambos |

**Verificações:**
- Modelos tenant-scoped sem tenantId
- Campos sem índice necessário
- Relações sem onDelete
- Convenções de nomenclatura

---

### DEV-04: Security Headers Checker ✅

**Objetivo:** Validar headers de segurança HTTP na aplicação.

| Campo | Valor |
|-------|-------|
| **Prioridade** | P0 |
| **Status** | ✅ Implementado |
| **Script** | `npm run skill:security-headers` |
| **Âncoras** | `scripts/check-security-headers.ts`, `next.config.mjs`, `src/middleware.ts` |
| **Inputs** | Configurações Next.js e Middleware |
| **Outputs** | `test-results/security-headers.json`, `test-results/security-headers.md` |
| **KPI** | Score ≥ 70/100 (grade C ou melhor) |
| **CI/Local** | Ambos |

**Headers Verificados:**
- X-Frame-Options (critical)
- X-Content-Type-Options (critical)
- Strict-Transport-Security (critical)
- Referrer-Policy (warning)
- Content-Security-Policy (warning)

---

### OPS-01: Prebuild E2E Orchestrator ✅

**Objetivo:** Padronizar execução E2E sem "lazy compilation" do dev server.

| Campo | Valor |
|-------|-------|
| **Prioridade** | P0 |
| **Status** | ✅ Implementado e Validado (5/5 smoke tests passando) |
| **Âncoras** | `playwright.config.local.ts`, `playwright.smoke.config.ts`, `package.json`, `.github/workflows/` |
| **Comandos** | `npm run build && npm run start:9002`, `npm run test:e2e:smoke`, `npm run test:e2e` |
| **Inputs** | `PORT` (default 9002), `BASE_URL`, `CI` mode, `PLAYWRIGHT_SKIP_WEBSERVER` |
| **Outputs** | HTML Playwright, `test-results/results.json`, `test-results/smoke-results.json` |
| **KPI** | 0 timeouts por compilação; flakiness ≤ 1% |
| **CI/Local** | Ambos (CI: `reuseExistingServer=false`) |

**Fluxo:**
```bash
1. npm run build              # Pré-compila tudo
2. npm run start:9002         # Sobe server em produção
3. npm run test:e2e:smoke     # Smoke tests (sem auth, valida server)
4. npm run test:e2e           # Full E2E (com auth, DB required)
5. Coleta artifacts           # HTML + JSON
```

**Smoke Tests Disponíveis:**
- `server responds with 200 on homepage`
- `login page renders without errors`
- `static pages load correctly (faq, terms, privacy)`
- `search page loads without crashing`
- `API health endpoint works`

---

### OPS-02: DB Metrics Snapshot ✅

**Objetivo:** Ter um "painel mínimo" de saúde de banco (volume, índices, hot tables).

| Campo | Valor |
|-------|-------|
| **Prioridade** | P0 |
| **Status** | ✅ Implementado |
| **Script** | `npm run skill:db-metrics` |
| **Âncoras** | `scripts/db-metrics-snapshot.ts` |
| **Inputs** | `DATABASE_URL` |
| **Outputs** | `test-results/db-metrics.json`, `test-results/db-metrics.md` |
| **KPI** | Métricas geradas em < 30s; alertas acionáveis |
| **CI/Local** | Local (diagnóstico); CI (validação) |

**Métricas Coletadas:**
- Contagem de registros por tabela
- Tamanho de tabelas (data + índices)
- Métricas por tenant (lotes, leilões, lances, usuários)
- Alertas de tabelas grandes (>1M registros)

---

### OPS-03: Audit Trail Reporter ✅

**Objetivo:** Gerar relatórios de trilha de auditoria para compliance e governança.

| Campo | Valor |
|-------|-------|
| **Prioridade** | P0 |
| **Status** | ✅ Implementado |
| **Script** | `npm run skill:audit-report` |
| **Âncoras** | `scripts/audit-trail-report.ts` |
| **Inputs** | `DATABASE_URL`, `AUDIT_DAYS` (default 7), `AUDIT_TENANT`, `AUDIT_USER` |
| **Outputs** | `test-results/audit-report.json`, `test-results/audit-report.md`, `test-results/audit-report.csv` |
| **KPI** | Relatório gerado; padrões suspeitos detectados |
| **CI/Local** | Local (análise); CI (validação) |

**Detecções de Padrões Suspeitos:**
- Alta frequência de ações (>100/hora por usuário)
- Ações em horários incomuns (00h-06h)
- Bulk deletes (>10 exclusões por usuário)

---

### DEV-06: Visual Regression (Vitest Browser)

**Objetivo:** Detectar regressões visuais em componentes críticos.

| Campo | Valor |
|-------|-------|
| **Prioridade** | P0 |
| **Âncoras** | `vitest.config.ts`, `tests/visual/`, `VITEST_UI_README.md` |
| **Comandos** | `npm run test:visual`, `npm run test:visual:update` |
| **Inputs** | Baseline de screenshots, viewport(s), rotas/páginas |
| **Outputs** | HTML (Vitest UI/relatórios), artifacts de screenshot |
| **KPI** | 0 diffs inesperados; diffs aprovados versionados |
| **CI/Local** | Ambos |

---

## P1 — Jornada Arrematante/Negociador

### STR-01: Jornada Negociador ✅

**Objetivo:** Validar funcionalidades críticas para conversão do arrematante power user.

| Campo | Valor |
|-------|-------|
| **Prioridade** | P1 |
| **Status** | ✅ Implementado |
| **Script** | `npm run test:e2e:negociador` |
| **Âncoras** | `tests/e2e/str-01-jornada-negociador.spec.ts` |
| **Inputs** | `baseURL`, usuário arrematante autenticado |
| **Outputs** | HTML Playwright, métricas de tempo |
| **KPI** | 100% da jornada funcional; tempo de carregamento < 5s |
| **CI/Local** | Ambos |

**Etapas da Jornada:**
1. Descoberta de Lotes (busca, filtros)
2. Detalhes do Lote (informações essenciais)
3. Interação (favoritos)
4. Lance (formulário, conversão)
5. Histórico e Acompanhamento
6. Notificações

---

### STR-02: Vertical Risk Matrix ✅

**Objetivo:** Analisar riscos por vertical de leilão (Judicial, Veículos, Imóveis, etc.)

| Campo | Valor |
|-------|-------|
| **Prioridade** | P1 |
| **Status** | ✅ Implementado |
| **Script** | `npm run skill:risk-matrix` |
| **Âncoras** | `scripts/vertical-risk-matrix.ts` |
| **Inputs** | `DATABASE_URL`, `RISK_DAYS` (default 90) |
| **Outputs** | `test-results/risk-matrix.json`, `test-results/risk-matrix.md` |
| **KPI** | Score de risco calculado por vertical; recomendações geradas |
| **CI/Local** | Local (análise estratégica) |

**Métricas por Vertical:**
- Taxa de conversão (lotsSold / totalLots)
- Ticket médio
- Lotes sem lance (engajamento)
- Tempo médio até arrematação
- Score de risco (0-100)

---

### STR-03: Conversion Funnel Analyzer ✅

**Objetivo:** Analisar funil de conversão do usuário arrematante.

| Campo | Valor |
|-------|-------|
| **Prioridade** | P1 |
| **Status** | ✅ Implementado |
| **Script** | `npm run skill:funnel` |
| **Âncoras** | `scripts/conversion-funnel-analyzer.ts` |
| **Inputs** | `DATABASE_URL`, `FUNNEL_DAYS` (default 90), `FUNNEL_MONTHS` (default 6) |
| **Outputs** | `test-results/conversion-funnel.json`, `test-results/conversion-funnel.md` |
| **KPI** | Gargalos identificados; recomendações acionáveis |
| **CI/Local** | Local (análise estratégica) |

**Etapas do Funil:**
1. Visitante → Cadastro
2. Cadastro → Habilitação
3. Habilitação → Primeiro Lance
4. Primeiro Lance → Arrematação
5. Arrematação → Pagamento
6. Pagamento → Recorrência

**Análises:**
- Cohort analysis (por mês de cadastro)
- Identificação de bottlenecks
- Estimativa de receita perdida
- Recomendações com impacto esperado

---

### DEV-05: Auction Lifecycle E2E
| **Outputs** | HTML Playwright, JSON (KPIs: tempo de navegação, falhas por etapa) |
| **KPI** | Fluxo crítico passa sem timeouts e sem resets de conexão |
| **CI/Local** | Ambos |

---

### DEV-05: Realtime Bids & Latency Harness

**Objetivo:** Validar concorrência, ordenação de lances e estabilidade de realtime.

| Campo | Valor |
|-------|-------|
| **Prioridade** | P1 |
| **Âncoras** | `tests/e2e/realtime-features.spec.ts`, `src/components/lots/` |
| **Comandos** | `npm run test:e2e:realtime`, `npm run db:metrics` |
| **Inputs** | 2+ usuários concorrentes, lote com janela de bidding |
| **Outputs** | JSON (latência p50/p95, reorder rate), HTML Playwright |
| **KPI** | 0 inconsistência de "lance vencedor"; latência dentro do alvo |
| **CI/Local** | Ambos |

---

### OPS-03: Audit Trail Test Suite Runner

**Objetivo:** Garantir rastreabilidade (quem fez o quê/quando) e permissões de auditoria.

| Campo | Valor |
|-------|-------|
| **Prioridade** | P1 |
| **Âncoras** | `AUDITORIA_LEILOES.md`, `src/components/audit/`, `tests/e2e/` |
| **Comandos** | `npm run test:e2e` (subset auditoria) |
| **Inputs** | Usuário admin vs usuário comum, ações auditáveis (CRUD) |
| **Outputs** | HTML Playwright, JSON (eventos esperados vs encontrados) |
| **KPI** | 100% eventos críticos logados; 0 bypass por permissão |
| **CI/Local** | Ambos |

---

## P2 — Escala, Risco e Compliance por Vertical

### STR-01: Vertical Risk Profiler

**Objetivo:** Para cada vertical, produzir checklist de risco e requisitos.

| Campo | Valor |
|-------|-------|
| **Prioridade** | P2 |
| **Âncoras** | `REGRAS_NEGOCIO_CONSOLIDADO.md`, `prisma/schema.prisma` |
| **Inputs** | Vertical + modalidade (judicial/extrajudicial) + canal |
| **Outputs** | MD (checklist executivo), JSON (regras operacionais) |
| **KPI** | 100% itens "must-have" cobertos; redução de retrabalho/contestação |
| **CI/Local** | Local (geração); CI (validação) |

---

### STR-02: Trust & Conversion Gap Scanner

**Objetivo:** Detectar "gaps" que derrubam conversão (fotos, docs, taxas, navegação).

| Campo | Valor |
|-------|-------|
| **Prioridade** | P2 |
| **Âncoras** | `RELATORIO_FINAL_MELHORIAS.md`, `src/app/(public)/` |
| **Inputs** | Lista de páginas críticas (home/listagem/detalhe) |
| **Outputs** | HTML (relatório com prints), MD (priorização ICE/RICE) |
| **KPI** | CTR e conversão do lote sobem; regressões detectadas antes de produção |
| **CI/Local** | CI (validação); Local (auditoria manual) |

---

### STR-03: Anti-fraude/Anti-conluio Playbook

**Objetivo:** Definir sinais e auditorias mínimas (padrões de bid, multi-account, collusion).

| Campo | Valor |
|-------|-------|
| **Prioridade** | P2 |
| **Âncoras** | `AUDITORIA_LEILOES.md`, `src/services/`, `tests/e2e/` |
| **Inputs** | Regras (limites), janelas, entidades (user/lot/auction) |
| **Outputs** | JSON (detecções), MD (ações recomendadas) |
| **KPI** | Queda em chargebacks/contestação; investigações reproduzíveis |
| **CI/Local** | Local (análise); CI (alertas) |

---

## Personas como "Modo de Avaliação"

| Persona | Descrição | Skills-chave |
|---------|-----------|--------------|
| **Leiloeiro/Admin** | Operador do tenant; cria/publica leilões | DEV-01, DEV-03, OPS-02, **STR-04** |
| **Arrematante/Negociador** | Comprador; habilita-se, dá lances, arremata | DEV-04, STR-02, STR-03, **STR-01** |
| **Comitente/Seller** | Consigna bens; acompanha vendas | OPS-02, STR-02, **STR-05** |
| **Advogado** | Compliance/jurídico; diligência, processos | OPS-03, STR-01, **STR-06** |
| **Administrador** | Super admin; gestão multi-tenant | DEV-01, DEV-02, OPS-03, **STR-07** |
| **Agente de Leilões** | Analista/preposto; operação diária | OPS-01, OPS-03, **STR-08** |

---

## STR-04: Jornada Leiloeiro E2E ✅

**Objetivo:** Validar fluxo crítico do leiloeiro: dashboard → gestão leilões → lotes → habilitações → relatórios.

| Campo | Valor |
|-------|-------|
| **Prioridade** | P1 |
| **Status** | ✅ Implementado |
| **Script** | `npm run test:e2e:leiloeiro` |
| **Arquivo** | `tests/e2e/str-04-jornada-leiloeiro.spec.ts` |
| **Inputs** | Usuário admin/leiloeiro autenticado |
| **Outputs** | Relatório Playwright HTML |
| **KPI** | 100% dos fluxos críticos funcionando |
| **CI/Local** | Ambos |

**Fluxos Validados:**
1. ✅ Acesso ao painel administrativo
2. ✅ Menu de navegação do leiloeiro
3. ✅ Gestão de leilões (listar, criar)
4. ✅ Gestão de lotes (listar, filtrar)
5. ✅ Gestão de habilitações (pendentes, aprovar/reprovar)
6. ✅ Monitoramento em tempo real
7. ✅ Relatórios e métricas
8. ✅ Performance (< 5s painel admin, < 3s listas)

```bash
npm run test:e2e:leiloeiro
```

---

## STR-05: Jornada Comitente E2E ✅

**Objetivo:** Validar fluxo do comitente (vendedor/consignante): cadastro de bens → acompanhamento → financeiro.

| Campo | Valor |
|-------|-------|
| **Prioridade** | P1 |
| **Status** | ✅ Implementado |
| **Script** | `npm run test:e2e:comitente` |
| **Arquivo** | `tests/e2e/str-05-jornada-comitente.spec.ts` |
| **Role** | SELLER |

**Fluxos Validados:**
1. ✅ Painel do comitente
2. ✅ Cadastro de bens/ativos
3. ✅ Acompanhamento de lotes
4. ✅ Histórico de vendas/arrematações
5. ✅ Painel financeiro (comissões, repasses)
6. ✅ Gestão de documentos

---

## STR-06: Jornada Advogado E2E ✅

**Objetivo:** Validar fluxo do advogado: busca jurídica → análise de processos → diligência.

| Campo | Valor |
|-------|-------|
| **Prioridade** | P1 |
| **Status** | ✅ Implementado |
| **Script** | `npm run test:e2e:advogado` |
| **Arquivo** | `tests/e2e/str-06-jornada-advogado.spec.ts` |
| **Role** | BIDDER (com acesso jurídico) |

**Fluxos Validados:**
1. ✅ Acesso a leilões judiciais
2. ✅ Busca avançada de processos
3. ✅ Consulta de partes do processo
4. ✅ Análise de editais e documentação
5. ✅ Análise de riscos jurídicos (ônus, gravames)
6. ✅ Acompanhamento de prazos
7. ✅ Exportação/impressão para diligência

---

## STR-07: Jornada Administrador E2E ✅

**Objetivo:** Validar fluxo do super admin: gestão de tenants → usuários → configurações → auditoria.

| Campo | Valor |
|-------|-------|
| **Prioridade** | P1 |
| **Status** | ✅ Implementado |
| **Script** | `npm run test:e2e:admin` |
| **Arquivo** | `tests/e2e/str-07-jornada-administrador.spec.ts` |
| **Role** | ADMIN |

**Fluxos Validados:**
1. ✅ Painel master com métricas globais
2. ✅ Gestão de tenants (CRUD, configurações)
3. ✅ Gestão de usuários (filtros por tenant/role)
4. ✅ Gestão de permissões/roles
5. ✅ Configurações globais do sistema
6. ✅ Logs e monitoramento
7. ✅ Trilha de auditoria
8. ✅ Relatórios gerenciais

---

## STR-08: Jornada Agente de Leilões E2E ✅

**Objetivo:** Validar fluxo do agente/analista: habilitações → lotes → suporte ao vivo → documentação.

| Campo | Valor |
|-------|-------|
| **Prioridade** | P1 |
| **Status** | ✅ Implementado |
| **Script** | `npm run test:e2e:agente` |
| **Arquivo** | `tests/e2e/str-08-jornada-agente.spec.ts` |
| **Role** | AUCTION_ANALYST |

**Fluxos Validados:**
1. ✅ Painel operacional com tarefas pendentes
2. ✅ Análise de habilitações (aprovar/reprovar)
3. ✅ Revisão e edição de lotes
4. ✅ Suporte ao leilão ao vivo
5. ✅ Atendimento via tickets/ITSM
6. ✅ Documentação pós-leilão (autos, entregas)

---

## Executar Todos os Skills de Personas

```bash
# Rodar todas as jornadas de uma vez
npm run test:e2e:all-personas
```

---

## Matriz de Riscos por Vertical

| Vertical | Regulatório | Antifraude | Latência | Contestação | Skills Mitigadoras |
|----------|-------------|------------|----------|-------------|-------------------|
| Judicial | Altíssimo | Médio | Médio | Altíssimo | STR-01, OPS-03, DEV-02, DEV-03 |
| Imóveis | Alto | Médio | Médio | Alto | STR-02, DEV-03, OPS-03, STR-01 |
| Veículos | Médio/Alto | Alto | Médio | Médio | STR-03, DEV-05, OPS-03, DEV-03 |
| Sucata | Médio | Médio | Alto | Médio | DEV-04, DEV-03, OPS-02 |
| Eletrônicos | Médio | Alto | Alto | Médio | STR-03, DEV-06, OPS-02 |
| Commodities/B2B | Alto | Médio | Alto | Alto | OPS-02, DEV-01, STR-04, OPS-03 |
| Arte/Colecionáveis | Alto | Alto | Baixo | Altíssimo | STR-01, STR-03, OPS-03, DEV-02 |

---

## Estratégia de Outputs por Situação

| Situação | Formato Preferido | Exemplo |
|----------|-------------------|---------|
| Validação automatizada (CI) | JSON | `test-results/results.json` |
| Decisão/checklist humano | Markdown | `RELEASE_CHECKLIST.md` |
| Evidência visual/compartilhável | HTML | `playwright-report/index.html` |
| Métricas de banco | JSON + MD | `db-metrics.json`, `DB_HEALTH.md` |

---

## Definition of Done — P0

- [ ] Build OK (`npm run build` sem erros)
- [ ] Typecheck OK (`npm run typecheck` sem erros)
- [ ] Lint OK (`npm run lint` sem warnings)
- [ ] Seed reproduzível (`npm run db:seed:v3` cria dataset mínimo)
- [ ] E2E sem flakiness (≤ 1% em 5 execuções CI)
- [ ] Tempo de pipeline ≤ 15 min
- [ ] Artifacts sempre gerados (HTML + JSON + plaintext)
- [ ] Zero violações multi-tenant

---

## Changelog

| Data | Versão | Mudança |
|------|--------|---------|
| 2026-01-12 | 2.2 | Adicionado STR-05/06/07/08 (todas as personas) |
