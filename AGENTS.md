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

## 🔒 Isolamento de Ambientes DEV ↔ DEMO (OBRIGATÓRIO)

> **REGRA CRÍTICA:** Quando o USUÁRIO estiver usando o ambiente DEMO, os agentes AI DEVEM usar o ambiente DEV para não interferir nos testes do usuário.

### Mapeamento de Ambientes

| Ambiente | Infraestrutura | Database | Branch Base | Porta | Uso |
|----------|----------------|----------|-------------|-------|-----|
| **DEV** | Local (Docker) | MySQL `bidexpert_dev` | `demo-stable` | 9006 | Agentes AI |
| **DEMO** | Vercel + Prisma Postgres | PostgreSQL | `demo-stable` | 9005 | Usuário humano |
| **PROD** | Cloud Run / Vercel | PostgreSQL | `main` | - | Produção final |

### Workflow de Branches

```
main (produção - PROTEGIDO)
  │
  └── demo-stable (base estável para features)
        │
        ├── feat/auction-filter-20260131-1430
        ├── fix/login-bug-20260131-1500
        └── chore/update-deps-20260131-1530
```

**Regras de Branch:**
1. `main` = **PRODUÇÃO** → Nunca alterar diretamente, somente via PR aprovado
2. `demo-stable` = Base para todas as features → Sempre começar branches daqui
3. Feature branches → Sempre merge via PR para `demo-stable`
4. CI verde obrigatório antes de merge em `main`

### Detecção de Ambiente do Usuário

**Como identificar se o usuário está em DEMO:**
- URL contém `demo.localhost` ou domínio Vercel
- Logs mostram conexão PostgreSQL
- Porta 9005 ocupada

**Quando usuário está em DEMO → Agente AI faz:**
```powershell
# 1. Usar porta diferente (9006, 9007...)
$env:PORT=9006
$env:DATABASE_URL="mysql://root:M%21nh%40S3nha2025@localhost:3306/bidexpert_dev"

# 2. Iniciar em ambiente DEV
node .vscode/start-9006-dev.js
```

### Compatibilidade MySQL ↔ PostgreSQL

Ao escrever queries que usam comparação de strings case-insensitive:

```typescript
// ✅ CORRETO - Usar helper de compatibilidade
import { insensitiveContains } from '@/lib/prisma/query-helpers';

const results = await prisma.auction.findMany({
  where: {
    title: insensitiveContains('termo')  // Funciona em MySQL e PostgreSQL
  }
});

// ❌ INCORRETO - Hardcode de mode
const results = await prisma.auction.findMany({
  where: {
    title: { contains: 'termo', mode: 'insensitive' }  // Só funciona em PostgreSQL
  }
});
```

### Verificação Pré-Implementação

Antes de iniciar qualquer task, o agente DEVE:
1. Verificar se porta 9005 está em uso: `netstat -ano | findstr "9005"`
2. Se ocupada → Usuário em DEMO → Usar DEV na porta 9006
3. Criar branch a partir de `demo-stable`
4. Testar em DEV antes de propor merge

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

## Vercel + PostgreSQL Deploy Skill
Para tarefas relacionadas a deploy no Vercel, configuração de build, compatibilidade PostgreSQL, e middleware multi-tenant:
`E:\SmartDataCorp\BidExpert\BidExpertVsCode\bidexpert_ai_firebase_studio\.github\skills\vercel-postgresql-deploy\SKILL.md`

Este agente lida com:
- Configuração do `vercel.json` (build command, regions, headers)
- Compatibilidade MySQL ↔ PostgreSQL (raw SQL, Prisma filters)
- Middleware multi-tenant para domínios `.vercel.app`
- Schemas Prisma duais (`schema.prisma` vs `schema.postgresql.prisma`)
- API routes com `force-dynamic`

### Regras Críticas de Deploy (resumo)
1. **NUNCA** incluir `prisma db push` ou `prisma migrate deploy` no buildCommand do vercel.json
2. **SEMPRE** quotar nomes camelCase em raw SQL PostgreSQL: `"errorMessage"`
3. **NÃO** misturar `isNot: null` com outros filtros Prisma no mesmo nível (XOR type)
4. **SEMPRE** incluir `updatedAt: new Date()` em `create()` de models com `@updatedAt`
5. **SEMPRE** usar nomes de relação exatos do schema Prisma (case-sensitive)
6. **NUNCA** redirecionar para subdomínios CRM em URLs `.vercel.app`
7. **SEMPRE** adicionar `export const dynamic = 'force-dynamic'` em API routes dinâmicas
8. Deploy **SOMENTE** via `git push origin main` — NUNCA via Vercel MCP direto

## Conflitos de regras
 - Sempre que houver conflito de instruções, peça para o usuário clarificar antes de proceguir.