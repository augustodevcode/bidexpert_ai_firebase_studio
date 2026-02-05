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

## 🚀 Inicialização da Aplicação (OBRIGATÓRIO)

**REGRA:** Para iniciar a aplicação BidExpert, SEMPRE utilize a task do VSCode:
- **Task Padrão:** `BidExpert App - Porta 9005 (Full Logging)`
- **Comando Alternativo:** `node .vscode/start-9005.js`
- **❌ NUNCA use:** `npm run dev` diretamente (não garante logging completo)
- **Acesso:** Após iniciar, sempre abra `http://demo.localhost:9005` no Simple Browser

## Estratégia de Observabilidade (Logs do Browser + Servidor)
Os agentes devem sempre buscar a visão completa do problema:
1. **Logs do Browser**: Execute scripts Playwright (como `tests/e2e/console-error-detection.spec.ts`) para ver erros de console (`TypeError`, `404`, `500 network`) que não aparecem no terminal do servidor.
2. **Logs do Servidor**: Verifique o output do `next dev` ou `start`.
3. **Triangulação**: Um erro de "Failed to fetch" no browser geralmente tem uma stack trace correspondente no servidor. Use ambos para corrigir com precisão.

## Estratégia de Inicialização Robusta (Powershell)

**PROBLEMA:** O comando `next dev` padrão pode falhar na ligação de portas ou resolução de `localhost` em ambientes Windows/Powershell, ou ignorar variáveis de ambiente.

**SOLUÇÃO (OBRIGATÓRIA):** Ao iniciar a aplicação para testes ou desenvolvimento, utilize SEMPRE esta sequência de comandos no PowerShell:

```powershell
# 1. Parar processos Node anteriores para liberar a porta (evita erro EADDRINUSE)
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# 2. Definir variáveis de ambiente explicitamente na sessão
$env:PORT=9005
$env:DATABASE_URL="mysql://root:M%21nh%40S3nha2025@localhost:3306/bidexpert_demo" # Ou bidexpert_dev conforme necessidade
$env:NODE_ENV="development"

# 3. Gerar cliente Prisma (garante schema sincronizado)
npx prisma generate

# 4. Iniciar servidor customizado (monitorando logs no terminal)
# Nota: Usa ts-node com server.ts para garantir leitura correta de env e binding
npx ts-node --project tsconfig.server.json src/server.ts
```

**Monitoramento:**
- Após iniciar, verifique se a mensagem "Ready in..." aparece.
- Se houver erro de conexão, testar com: `Test-NetConnection -ComputerName 127.0.0.1 -Port 9005`
- Sempre abra o **Simple Browser** (`http://demo.localhost:9005`) para validar visualmente.

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