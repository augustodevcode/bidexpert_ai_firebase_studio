# BidExpert Gap Implementation Roadmap (2025)

> _Status atualizado em 13/11/2025_

Este documento consolida a análise do relatório de auditoria externa (`GAP_ANALYSIS.md`) com o estado atual da plataforma BidExpert. Ele traduz as lacunas identificadas em um plano tático dividido por portais/personas e por iniciativas de infraestrutura. As perguntas respondidas pelo time foram incorporadas nas premissas a seguir:

- Todos os perfis (arrematante PF/ PJ, investidores, comitentes, leiloeiros, equipe financeira, time jurídico) exigem recomendações inteligentes orientadas por IA.
- Devemos comparar cada módulo com benchmarks de mercado (Suporte Leilões, Lance Já, Zukerman, Sold, Atuall, etc.) e buscar paridade/superioridade.
- Nenhuma integração cartorária, bancária ou de pagamentos foi implementada até o momento; precisamos conectar APIs públicas ou privadas conforme disponibilidade.
- O ERP do leiloeiro, automações financeiras e relatórios gerenciais inexistem e devem ser desenvolvidos.
- Atualmente todas as execuções (due diligence, notificações, auditoria virtual) são manuais.
- Integrações com gateways (Stripe, Mercado Pago, bancos) são mandatórias.
- Mocks para testes end-to-end devem residir em `scripts/seed-data-extended-v3.ts` — ampliar seeds sempre que necessário para cobrir cenários avançados.
- Devemos adotar padrões de bigtechs (Google, Apple, Amazon) em arquitetura, observabilidade, playbooks de testes e automação.
- A plataforma deve suportar 1 a 50 usuários simultâneos atuando em perfis distintos sem vazamento de permissões.
- Todos os relatórios do Playwright precisam ser revisitados; não podemos aceitar falhas ou rotas sem conteúdo renderizado.
- Devemos orquestrar suítes paralelas simulando múltiplos arrematantes disputando lances, operadores cadastrando entidades, analistas emitindo relatórios e equipe financeira processando pagamentos — tudo sob observabilidade de recursos.

## Índice

1. [Portal do Arrematante](#portal-do-arrematante)
2. [Portal do Leiloeiro](#portal-do-leiloeiro)
3. [Portal do Advogado](#portal-do-advogado)
4. [Portal do Comitente](#portal-do-comitente)
5. [Portal Administrativo](#portal-administrativo)
6. [Arquitetura & Infraestrutura Técnica](#arquitetura--infraestrutura-técnica)
7. [Playwright Test Matrix & Dados](#playwright-test-matrix--dados)
8. [Próximos Passos Imediatos](#próximos-passos-imediatos)

---

## Portal do Arrematante

| Iniciativa | Situação Atual | Lacunas / Referências | Ações Propostas |
|------------|----------------|-----------------------|-----------------|
| Assistente IA Personalizado | Parcial — `src/ai/flows/*` cobre precificação, descrição e análise de lotes via Genkit, sem personalização por usuário | Não há persistência de preferências nem histórico individual. Recomendações inexistem no front. | 1. Criar serviço `RecommendationService` (Node/Prisma) com modelos colaborativos + content-based (TensorFlow/Scikit) <br>2. Persistir perfil de preferências em `user_profiles` (novo schema) <br>3. Expor API Graph/REST `/api/recommendations` consumida pelo portal do arrematante <br>4. UI React com cards personalizados e feedback explícito (like/dislike) <br>5. Playwright: cenários com 3 perfis distintos verificando recomendações distintas. |
| Calculadora de Viabilidade Avançada | Inexistente | Benchmarks: Zukerman Calculadora, Itaú simuladores | 1. Micro-serviço `viability-calculator` (Node, Fastify) integrando APIs FIPE, IBGE, BACEN <br>2. UI step-by-step com preview dos custos (Next.js) <br>3. Simulação financeira usando SDKs (CEF, Bradesco) ou fallback heurístico <br>4. Playwright: validação de inputs multi-step e comparação de ROI. |
| Due Diligence Automatizada | Inexistente | Precisamos de integrações com cartórios digitais, Receita, prefeituras | 1. Conector modular (`/integrations/diligence/*`) com adaptadores (cartório, tribunais, concessionárias) <br>2. Pipeline assíncrono (BullMQ / Redis) para consultas paralelas <br>3. UI com semáforo de risco e export PDF (usar `generate-document-flow` como base) <br>4. Auditoria completa em `DueDiligenceReport` (Prisma) <br>5. Playwright: fluxo que acompanha mudança de status realtime + download do PDF. |
| Lance Automático Inteligente | Inexistente | Mercado: AutoBid da Superbid, recurso do Freitas | 1. Engine de estratégias (`/services/bid-strategy.service.ts`) com modos agressivo/conservador <br>2. Scheduler em tempo real usando Redis Streams/Kafka <br>3. UI para configurar limite, delta e janela de atuação <br>4. Playwright: simular 3 bots disputando o mesmo lote vs usuário humano. |

## Portal do Leiloeiro

| Iniciativa | Situação Atual | Lacunas | Ações |
|------------|----------------|---------|-------|
| ERP Completo | Parcial — CRUDs básicos (leilões, lotes, sellers) mas sem módulos financeiros, CRM, controle de pátios | 1. Mapear entidades financeiras (contas a receber, notas) em Prisma <br>2. Criar módulo CRM (comitentes, arrematantes) com histórico e pipeline <br>3. Controle de pátios (inventário físico) com fotos e checklists <br>4. Wizard onboarding para novos processos judiciais <br>5. Playwright: fluxo end-to-end de criação de leilão completo com anexos e autorização financeira. |
| Business Intelligence | Inexistente | Sem dashboards nem analytics realtime | 1. Implementar camada Data Warehouse (BigQuery ou ClickHouse) alimentada via Debezium/Kafka <br>2. Criar dashboards Next.js + Tremor/Apache ECharts <br>3. Prever receita e conversão usando modelos Prophet/LSTM <br>4. Playwright: validação de filtros/segmentações e exportações. |
| Automação de Documentos | Parcial (fluxo `generate-document-flow.ts`) sem UI nem ICP-Brasil | 1. Criar UI de templates com editor (Monaco + handlebars) <br>2. Integrar assinaturas com RestPKI ou BirdID (ICP-Brasil) <br>3. Versionamento e auditoria em `document_templates` <br>4. Playwright: gerar edital e assinar digitalmente com mock HSM. |
| Auditório Virtual Completo | Incompleto (rota `/live-dashboard` 500) | Necessário player multi-stream, chat moderado, gravação | 1. Diagnosticar erro atual (500) — validar dependências WebRTC/SFU <br>2. Integrar com LiveKit ou AWS IVS para streaming 1080p/4K <br>3. Implementar chat moderado + slides automáticos (RevealJS) <br>4. Gravação + replicação para redes sociais (YouTube API) <br>5. Playwright: múltiplos espectadores e leiloeiro transmitindo (usar WebSockets mocks). |
| Marketing Automation | Inexistente | Sem campanhas e integrações | 1. Orquestrador (Node/Temporal.io) para campanhas multi-canal <br>2. Conectores (SendGrid, WhatsApp Cloud API, Meta Ads) <br>3. Editor drag & drop de landing pages (Builder.io API) <br>4. Playwright: agendamento/ disparo com verificação de logs (mock). |
| App White Label | Inexistente | | 1. Definir stack (React Native monorepo) <br>2. Criar pipeline CI/CD (EAS / Fastlane) <br>3. Módulo de customização (tema, assets, push) <br>4. Testes E2E mobile (Detox / Appium). |

## Portal do Advogado

| Iniciativa | Situação Atual | Lacunas | Ações |
|------------|----------------|---------|-------|
| Due Diligence Profissional | Inexistente | Mesma base do arrematante porém com foco jurídico profundado | 1. Diferenciar visões (jurídica x investidor) com relatórios específicos <br>2. Integrar sistemas CNJ, STJ, STF, Receita <br>3. Score legal (baixo/médio/alto) <br>4. UI com comparativos de jurisprudência <br>5. Playwright: simular advogado gerando relatório e anexando parecer. |

## Portal do Comitente

| Iniciativa | Situação Atual | Lacunas | Ações |
|------------|----------------|---------|-------|
| Dashboard de Performance | Inexistente | | 1. Widgets realtime (socket.io) com KPIs (visualizações, lances, receita) <br>2. Comparativo com leilões anteriores usando warehouse <br>3. IA para projeção de receita <br>4. Playwright: validar filtros multi-tenant e export CSV. |
| Gestão Financeira | Inexistente | | 1. Integração contábil (Conta Azul, Omie) <br>2. Conciliação bancária automática (Open Finance) <br>3. Notas fiscais (NFe, NFSe) <br>4. Alertas de inadimplência + dunning automático <br>5. Playwright: cenários multi-perfil (financeiro x comitente). |
| Gestão de Inventário | Parcial — CRUD de ativos/lotes sem controle avançado | 1. Workflow para status (cadastrado → vistoria → leilão → vendido) <br>2. Upload massivo com validação (XLSX) <br>3. Avaliação automática (IA) com comparativos | 4. Playwright: importação em lote + checagem de estados. |
| Marketplace de Leiloeiros | Inexistente | | 1. Directory com filtros, avaliações e taxas <br>2. Fluxo de proposta/contratação (assinatura digital) <br>3. Sistema de reviews pós-leilão <br>4. Playwright: matching entre comitente e leiloeiro. |
| Central de Notificações | Inexistente | | 1. Módulo `NotificationHub` (WebSocket + push) <br>2. Preferências por usuário (email, push, WhatsApp) <br>3. Template engine reaproveitando automação de marketing <br>4. Playwright: cenários com múltiplos eventos simultâneos. |
| Análise Preditiva | Inexistente | | 1. Modelos Prophet/LSTM para previsão de preço/deságio <br>2. Sugestões de melhoria (IA generativa para descrição/fotos) <br>3. UI com insights acionáveis <br>4. Playwright: validação de tooltips e recomendações contextualizadas. |

## Portal Administrativo

| Iniciativa | Situação Atual | Lacunas | Ações |
|------------|----------------|---------|-------|
| Gestão de Usuários/Permissões | Parcial — RBAC básico, mas sem hierarquias, 2FA, SSO | 1. Implementar RBAC multinível + ABAC (atributos) <br>2. Suporte a 2FA (TOTP, SMS) e SSO (Azure AD/OAuth2) <br>3. Auditoria completa (quem fez / quando / onde) com trilha blockchain (ver abaixo) <br>4. Playwright: cenários de acesso negado vs permitido. |
| Compliance e Auditoria | Inexistente | | 1. LGPD full (consentimento, portabilidade) <br>2. Logs imutáveis (Hyperledger Fabric) <br>3. KYC automatizado (Serpro, GBG) <br>4. Anti-fraude (IA) <br>5. Playwright: fluxos de consentimento, requisição de dados. |
| Gestão de Dados/Integrações | Parcial — seeds massivos, sem pipelines | 1. Import/export CSV/Excel com validações <br>2. APIs REST & Webhooks (Swagger) <br>3. Backups automáticos (GCS/S3) e redundância <br>4. Observabilidade de integrações (retry, DLQ) <br>5. Playwright: upload, download, monitoramento. |
| Configurações da Plataforma | Parcial — UI simples, mas sem customizações profundas | 1. Gestão avançada de taxas, templates, regras de negócio <br>2. Activação de integrações externas por tenant <br>3. UI de campos customizados por tipo de leilão <br>4. Playwright: cenários multi-tenant com alterações por perfil. |
| Monitoramento de Performance | Inexistente | | 1. Stack Observability (Prometheus + Grafana, OpenTelemetry) <br>2. Alertas (PagerDuty/Opsgenie) <br>3. Dashboard SLA/SLO <br>4. Scripts de carga (k6, Artillery) integrados à pipeline. |
| Suporte & Help Desk | Inexistente | | 1. Módulo de tickets (Zendesk-like) integrado ao portal <br>2. Knowledge base e FAQ dinâmico <br>3. Chat ao vivo (Twilio Conversations) <br>4. Playwright: abertura, atendimento e SLA tracking. |

## Arquitetura & Infraestrutura Técnica

| Iniciativa | Situação | Ações |
|------------|---------|-------|
| Blockchain Infrastructure | Inexistente | Implementar rede Hyperledger Fabric privada; registrar lances, habilitações e emissões de documentos <br> Criar serviço `ledger.service.ts` <br> Testes: simular commit/rollback, leitura pública de hash. |
| AI/ML Engine | Parcial — flows Genkit sem MLOps | Criar orquestração MLflow/Kubeflow; pipelines de treino/serving; modelos versionados; monitoramento de drift. |
| Real-time Processing | Parcial (Socket placeholders) | Adotar Kafka + Microservices (NestJS) para eventos; latência <100ms; controle de concorrência. |
| Security & Compliance | Parcial | Implementar OAuth2, RBAC/ABAC, criptografia AES-256 at rest, WAF/Shield, pentest recorrente. |
| Mobile Development | Inexistente | React Native/Flutter apps; offline-first; biometria; push; deep linking. |
| Observability & Monitoring | Parcial (logs manuais) | Integrar OpenTelemetry, Grafana, Jaeger; dashboards de recursos; alertas. |

## Playwright Test Matrix & Dados

1. **Infraestrutura de testes**
   - Atualizar `playwright.config.local.ts` (✅ feito: porta 9005, comando `npm run dev:9005`).
   - Implementar script `.vscode/start-server-for-tests.js` (já existe) para CI.
   - Ajustar storage state para suportar múltiplos perfis (admin, leiloeiro, comitente, arrematante, advogado, financeiro).
2. **Seeds avançados**
   - Expandir `scripts/seed-data-extended-v3.ts` com mocks de pagamentos (Stripe/Mercado Pago), due diligence, relatórios, integrações externas fictícias.
3. **Matriz de cenários**
   - Arrematantes simultâneos disputando (usando `page.context().newPage()` para múltiplas sessões).
   - Perfis administrativos realizando cadastros massivos enquanto analistas emitem relatórios.
   - Fluxos financeiros integrados (boletos/pix/cartão) com reconciliação.
   - Virtual Auditorium com 1 leiloeiro + 10 espectadores + chat.
4. **Relatórios**
   - Persistir `test-results/plaintext-report.txt` + HTML; subir para `playwright-report/`.
   - Automatizar coleta de métricas (tempo total, falhas por módulo) via script Node.

## Próximos Passos Imediatos

1. **Diagnosticar falhas atuais**
   - Rotas administrativas retornando `500`/`404` (ex.: `/admin/settings`, `/admin/reports/audit`, `/live-dashboard`).
   - Corrigir warnings `Decimal` (convertendo para string antes de enviar a componentes client).
   - Resolver toasts persistentes de Dev Auto-Login e garantir renderização do conteúdo base (múltiplos avisos nos testes).
2. **Estabilizar test suite**
   - Extrair utilitário para fechar toasts de auto-login.
   - Criar `playwright fixtures` por perfil; dividir fluxo `all-entities` em suítes menores com melhores asserts.
   - Reexecutar Playwright até zero falhas; gerar relatório consolidado.
3. **Arquitetar integrações prioritárias (Q1 2025)**
   - Requisitos técnicos + contratos API (FIPE, IBGE, Cartórios, bancos, gateways de pagamento).
   - Definir padrão de secrets/rotinas (Vault/Azure KeyVault).
4. **Desenhar novos módulos**
   - Diagramas de sequência + ER para ERP, Due Diligence, IA de recomendações.
   - Estimar esforço e squad allocation.
5. **Infraestrutura ML & Observabilidade**
   - Provisionar ambientes (GCP/AWS) para MLflow, Kafka, Prometheus/Grafana.
   - Padronizar logs (`pino`) e tracing (OpenTelemetry) com export para DataDog.
6. **Simulações de carga**
   - Definir scripts k6 para 50 usuários simultâneos distribuídos em perfis.
   - Capturar métricas de CPU/memória (já iniciado via PowerShell) automatizando a coleta.

---

> **Nota:** Este roadmap deve ser revisado semanalmente. Cada iniciativa receberá epics/tarefas no board do projeto com critérios de aceite, métricas de sucesso e planos de rollout (alpha → beta → GA). Priorizar entregas Q1 2025 conforme auditoria: Assistente IA, Calculadora de Viabilidade, Due Diligence, ERP do leiloeiro, Dashboard do Comitente, Blockchain + Compliance.
