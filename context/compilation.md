# BidExpert – Context Compilation

Este arquivo consolida, de forma enxuta, o contexto essencial espalhado pelos principais `.md` da raiz (pré-lançamento, planos, gaps, seeds, QA e guias de teste). Use este documento como "porta de entrada" quando estiver trabalhando com o projeto via IA ou revisão rápida.

---

## 1. Visão Geral da Plataforma

- **Produto:** BidExpert – plataforma de leilões online multi-tenant (múltiplos leiloeiros isolados por `tenantId`).
- **Público-alvo:** leiloeiros oficiais, comitentes (bancos, seguradoras, varas, empresas), arrematantes e administradores da plataforma.
- **Objetivos principais:**
  - Eficiência na operação de leilões (cadastro, publicação, lances, pós-venda).
  - Isolamento de dados por tenant com segurança forte.
  - Experiência rica para arrematantes (busca, filtros, cards de lotes, PWA/mobile).
  - Auditoria e relatórios para operação e stakeholders.

(Origem: `DOCUMENTACAO_COMPLETA.md`, `SUMARIO_EXECUTIVO.md`)

---

## 2. Arquitetura & Módulos Principais

- **Multi-tenant & Admin:**
  - Tenants isolados por `tenantId` em sessão e nas queries Prisma.
  - Perfis de acesso (roles): admin plataforma, leiloeiro, comitente, arrematante, advogado etc.
  - Admin gerencia entidades: leilões, lotes, usuários, comitentes, configurações de plataforma.

- **Gestão de Leilões e Lotes:**
  - Criação de leilões com múltiplas modalidades (judicial, extrajudicial, etc.).
  - Suporte a múltiplas praças (etapas) com datas e lances iniciais distintos.
  - Cadastro de ativos e agrupamento em lotes.

- **Usuários & Habilitação:**
  - Cadastro PF/PJ, upload de documentos e workflow de aprovação.
  - Somente usuários habilitados podem dar lances.

- **Lances, Arremate e Pós-venda:**
  - Lances manuais e automáticos (lance máximo).
  - Validação de incremento mínimo, status de leilão e habilitação do usuário.
  - Pós-venda com pagamento (à vista/parcelado) e geração de documentos.

- **Relatórios & Auditoria:**
  - Dashboards de KPIs para admins/comitentes.
  - Logs de auditoria e histórico de ações.

(Origem: `DOCUMENTACAO_COMPLETA.md`, `GAP_ANALYSIS*.md`)

---

## 3. Gaps, Fase 1 e Status

### 3.1. Gaps Mapeados

- **GAP 1 – Multi-tenant & Segurança:**
  - Acesso cross-tenant precisava de validação consistente de `tenantId` em serviços e rotas.
- **GAP 2 – Lances Automáticos:**
  - Configurações parametrizadas e execução em tempo real ainda em evolução.
- **GAP 3 – Analytics em Tempo Real:**
  - Métricas e gráficos em tempo real via WebSocket.
- **GAP 4 – Auditoria + Soft Delete:**
  - Registro granular de ações, soft delete e restauração.
- **GAP 5 – Cards de Lotes:**
  - Cards com informações completas do leilão (praças, status, timeline) e seletores de teste estáveis.

(Origem: `GAP_ANALYSIS.md`, `GAP_ANALYSIS_UPDATED.md`)

### 3.2. Fase 1 – Correções de Segurança

- **Serviços corrigidos:**
  - `LotService.findLotById`: passou a validar `tenantId` e ownership.
  - `InstallmentPaymentService.updatePaymentStatus`: valida `tenantId` via relações e impede pagamentos de outro tenant.
  - `BidderService` ganhou métodos seguros para atualizar/deletar meios de pagamento.
- **Rotas de API:**
  - `/api/bidder/payment-methods/[id]` agora valida sessão, ownership e existência (401/403/404).
- **Resultado:**
  - 3 vulnerabilidades críticas/ médias corrigidas com 0 regressões reportadas.

(Origem: `FASE1-FIXES-IMPLEMENTED.md`, `FASE1-CONCLUSAO.md`, `RESUMO-FINAL-COMPLETO.md`)

---

## 4. Plano de Execução & Próximos Passos

- **Curto prazo (próximos 7 dias):**
  - Auditoria completa multi-tenant (rotas, serviços, server actions).
  - Criação/estabilização de testes E2E para fluxos críticos.
  - Avanço na implementação de `data-testid`/data-AI-ID em forms, botões, modais e cards.

- **2 semanas (Plano macro):**
  - Semana 1: foco em validações, E2E base, auditoria, cobertura de CRUD.
  - Semana 2: responsividade, PWA e polimento de UX.

(Origem: `ACOES_PROXIMOS_7_DIAS.md`, `PLANO_EXECUCAO_2_SEMANAS.md`, `PROXIMOS-PASSOS*.md`)

---

## 5. Seletores de Teste & Naming (data-testid / data-AI-ID)

- **Objetivo:** garantir que Playwright encontre elementos de forma estável, com nomes autoexplicativos.
- **Padrões principais:**
  - Seções de filtro: `filter-{tipo}-{identificador}` (ex.: `filter-modality-section`).
  - Cards e listas: nomes contextuais como `auction-card`, `lot-card`, `auction-card-stages`, `praças-leilao`, `status-leilao`.
  - Ações importantes: `login-link`, `bid-button`, `soft-close-toggle`, etc.
- **Status aproximado de implementação:**
  - `AuctionCard`, `LotCard`, `BidExpertFilter`: alta cobertura de seletores.
  - Forms, botões genéricos e modais: ainda em expansão.

(Origem: `DATA_AI_ID_STATUS.md`, `DATA_AI_ID_BIDEXPERTFILTER_COMPLETE.md`, `GUIA_CLASSNAMES_PLAYWRIGHT.md`)

---

## 6. Seed & Massa de Dados para Testes

- **Seed principal:** `seed-data-extended-v3.ts`.
  - Limpa o banco com segurança (desabilitando/reabilitando FKs quando necessário).
  - Cria tenants, usuários com múltiplos roles (leiloeiro, comitente, advogado etc.).
  - Popula leilões, lotes, bids, e dados determinísticos para o dashboard do advogado.
- **Arquivos de apoio:**
  - `SEED_EXECUTION_SUMMARY.md`, `SEED_COMPLETION_REPORT.md`, `SEED_DATA_README.md`, `Seed.md`.
  - Explicam fluxo de seed, comandos e garantias (idempotência, isolamento por tenant).

(Origem: arquivos de seed na raiz)

---

## 7. QA, Testes & Relatórios

- **Testes automatizados:**
  - Playwright E2E para flows multi-tenant, pagamentos, cards, dashboard do advogado, 5 gaps, etc.
  - Vitest/Unit tests para serviços e validações.
- **Documentos-chave:**
  - `QA-REPORT-PHASE1-FINAL.md`: relatório completo de QA da fase 1.
  - `RELATORIO_TESTES_PLAYWRIGHT.md`, `PLAYWRIGHT-EXECUTION-REPORT.md`: visão de execuções E2E.
  - `RESUMO_EXECUCAO_5GAPS_TESTES.md`, `README_TESTES_5GAPS.md`, `START_TESTING_5GAPS.md`: guias de execução e cobertura dos 5 gaps.

(Origem: relatórios e guias de teste na raiz)

---

## 8. Guias Rápidos Importantes

- **Onboarding / Começar pelo começo:**
  - `START_HERE.md`: primeiro contato com o projeto.
  - `LEIA-ME-PRIMEIRO.md`: visão geral de navegação na doc.
  - `INDICE_DOCUMENTACAO.md`: índice completo apontando para cada documento raiz.

- **Execução de testes:**
  - `INSTRUCOES_EXECUTAR_TESTES.md`, `INSTRUCOES_TESTES_PLAYWRIGHT_5GAPS.md`, `INSTRUÇÕES_TESTES_PLAYWRIGHT.md`.
  - `QUICK_START_TESTES.md`, `QUICK_START_VALIDACAO.md`.

- **Checklist & Produção:**
  - `CHECKLIST-PRODUCAO.md`, `SETUP_CHECKLIST.md`.
  - `PROBLEMA-E-SOLUCAO-FINAL.md`, `SOLUCAO-LAZY-COMPILATION.md`.

---

## 9. Como Usar Este Compilation

- Use este arquivo como mapa para decidir **qual documento detalhado abrir em seguida**:
  - Quer visão de negócio? → `SUMARIO_EXECUTIVO.md`, `ANALISE_FINAL_PRONTA_PRODUCAO.md`.
  - Quer detalhes técnicos de requisitos? → `DOCUMENTACAO_COMPLETA.md`.
  - Quer plano de ataque/execução? → `ACOES_PROXIMOS_7_DIAS.md`, `PLANO_EXECUCAO_2_SEMANAS.md`.
  - Quer detalhes de gaps e testes? → `GAP_ANALYSIS_UPDATED.md`, `README_TESTES_5GAPS.md`.
  - Quer seed e massa de dados? → docs de seed + `seed-data-extended-v3.ts`.

- Redundâncias e seções repetidas (como trechos inteiros de summaries em vários arquivos) foram consolidadas aqui em bullets curtos, evitando o copy/paste de blocos idênticos.

---

_Fim da compilação. Atualize este arquivo quando novos blocos grandes de documentação forem gerados na raiz._
