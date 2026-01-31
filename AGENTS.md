# Diretrizes Globais para Agentes

> **🚀 PRIORIDADE MÁXIMA:** Antes de qualquer implementação, siga o **Workflow de Desenvolvimento Paralelo** em `.agent/workflows/parallel-development.md`

Todos os agentes e modelos que operam neste workspace DEVEM seguir obrigatoriamente as instruções contidas no arquivo mestre:
`E:\SmartDataCorp\BidExpert\BidExpertVsCode\bidexpert_ai_firebase_studio\.github\copilot-instructions.md`

## 🔀 Workflow de Branches (OBRIGATÓRIO)

**REGRA CRÍTICA:** Todo agente AI DEVE:
1. Criar branch própria antes de qualquer alteração: `git checkout -b <tipo>/<descricao>-<timestamp>`
2. Usar porta dedicada (9005, 9006, 9007...) para não conflitar com outros devs
3. NO FINAL do chat, solicitar autorização do usuário para merge na main

📖 **Workflow completo:** `.agent/workflows/parallel-development.md`

## Regras Específicas
- Sempre ao terminar qualquer implementação, correção ou criação de scripts, tabelas, campos, alterações, execute um teste e2e para validar o que foi feito e documente.

## Container Tools - Ambientes Multi-Tenant

As AIs (Copilot, Gemini, etc.) têm acesso às ferramentas de container para gerenciar diferentes ambientes.

### Extensões Habilitadas
- **Docker Extension Pack** (`ms-azuretools.vscode-docker`): Gerenciamento de containers Docker
- **Remote Containers** (`ms-vscode-remote.remote-containers`): Desenvolvimento em containers

### Ambientes Disponíveis
| Ambiente | Slug | Descrição | Comando |
|----------|------|-----------|---------|
| **DEV** | `dev` | Desenvolvimento local | `docker compose -f docker-compose.dev.yml up -d` |
| **HML** | `hml` | Homologação/Testes | `docker compose -f docker-compose.hml.yml up -d` |
| **DEMO** | `demo` | Demonstração com Master Data | `docker compose -f docker-compose.demo.yml up -d` |
| **PROD** | `prod` | Produção | `docker compose -f docker-compose.prod.yml up -d` |

### Comandos Úteis para AIs
```powershell
# Listar containers em execução
docker ps

# Ver logs de um container
docker logs <container-name>

# Verificar saúde dos serviços
docker compose -f docker-compose.dev.yml ps

# Parar todos os containers de um ambiente
docker compose -f docker-compose.dev.yml down

# Reconstruir containers
docker compose -f docker-compose.dev.yml up -d --build
```

### Regras para AIs ao Usar Containers
1. **Sempre verificar** se os containers necessários estão rodando antes de executar testes
2. **Usar o ambiente correto** conforme o contexto do teste (dev, hml, demo)
3. **Não modificar** containers em produção sem autorização explícita
4. **Documentar** qualquer alteração em configurações de containers

## Report Builder Architect (GrapesJS + Puppeteer + Handlebars)
Para tarefas relacionadas a criação de templates de relatórios, editais, laudos e cartas de arrematação, siga as diretrizes em:
`E:\SmartDataCorp\BidExpert\BidExpertVsCode\bidexpert_ai_firebase_studio\.github\skills\report-builder\SKILL.md`

Este agente lida com:
- Implementação de designer visual drag-and-drop com GrapesJS
- Conversão de schemas Zod para blocos GrapesJS
- Renderização de PDF com Puppeteer + CSS Paged Media
- Templating com Handlebars (variáveis, loops, condicionais)
- Contextos de dados: Leilão, Lote, Arrematante, Processo Judicial, Nota de Arrematação
- Sanitização XSS com DOMPurify

### Arquivos Principais
- `src/lib/report-builder/schemas/auction-context.schema.ts` - Schemas Zod
- `src/lib/report-builder/utils/zod-to-grapesjs.ts` - Conversão para blocos
- `src/components/BidReportBuilder/GrapesJSDesigner/index.tsx` - Editor visual
- `src/app/api/reports/render/route.ts` - API de renderização PDF
- `tests/e2e/report-builder-grapesjs.spec.ts` - Testes E2E

## Observability & Audit Architect (360º) - New Skill
For tasks related to Logs, Traces, Metrics, and Business Audit Compliance, follow the guidelines in:
`E:\SmartDataCorp\BidExpert\BidExpertVsCode\bidexpert_ai_firebase_studio\.github\skills\observability-audit\SKILL.md`

This agent handles:
- Implementation of OpenTelemetry.
- Prisma Audit Extensions.
- Structural Logging and Diffing.

## Conflitos de regras
 - Sempre que houver conflito de instruções, peça para o usuário clarificar antes de proceguir.