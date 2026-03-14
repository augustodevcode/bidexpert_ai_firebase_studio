# Guia de Desenvolvimento com Containers Isolados - BidExpert

## Visão Geral

Cada desenvolvedor (humano ou agente AI) trabalha em seu próprio container Docker isolado, com:
- **Banco MySQL dedicado** (dados independentes)
- **Porta exclusiva** (sem conflito com outros devs)
- **Branch dedicada** (trabalho paralelo)
- **Playwright E2E** obrigatório antes de qualquer PR # Evidência JSON gerada automaticamente

## Arquitetura

```
┌──────────────────────────────────────────────────────────────┐
│                   Host (Windows 11)                          │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ bidexpert-dev1   │  │ bidexpert-dev2   │  │ bidexpert-ai │ │
│  │ ┌─────┐ ┌─────┐ │  │ ┌─────┐ ┌─────┐ │  │ ┌─────┐     │ │
│  │ │ App │ │MySQL│ │  │ │ App │ │MySQL│ │  │ │ App │ ... │ │
│  │ │:9101│ │:3401│ │  │ │:9102│ │:3402│ │  │ │:9103│     │ │
│  │ └─────┘ └─────┘ │  │ └─────┘ └─────┘ │  │ └─────┘     │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│                                                              │
│  Código-fonte compartilhado via volume mounts (./src, etc.)  │
└──────────────────────────────────────────────────────────────┘
```

## Quick Start (Novo Desenvolvedor)

### Opção 1: Script Automatizado (Recomendado)
```powershell
.\scripts\bootstrap-dev-container.ps1 -DevId "seu-nome" -AppPort 9102 -DbPort 3402 -MailPort 8202 -SmtpPort 2602
```

### Opção 2: Manual
```powershell
# 1. Criar branch
git checkout main; git pull origin main
git checkout -b feat/minha-feature-20260216-1400

# 2. Configurar variáveis
$env:DEV_ID="meu-id"
$env:APP_PORT=9102
$env:DB_PORT=3402
$env:MAIL_PORT=8202

# 3. Subir containers
docker compose -f docker-compose.dev-isolated.yml -p bidexpert-meu-id up -d --build

# 4. Aguardar app (30-60s para Next.js compilar)
Start-Sleep 40

# 5. Seed do banco (primeira vez)
docker exec bidexpert-meu-id-app-1 npx prisma db push --accept-data-loss
docker exec bidexpert-meu-id-app-1 npx tsx scripts/ultimate-master-seed.ts

# 6. Acessar
# http://demo.localhost:9102
```

## Portas Reservadas

| Dev ID   | App   | MySQL | Mail UI | SMTP |
|----------|-------|-------|---------|------|
| dev1     | 9101  | 3401  | 8201    | 2601 |
| dev2     | 9102  | 3402  | 8202    | 2602 |
| dev3     | 9103  | 3403  | 8203    | 2603 |
| ai-agent | 9104  | 3404  | 8204    | 2604 |

## Dual Schema Prisma

O projeto usa dois schemas Prisma:
- `prisma/schema.prisma` → **MySQL** (dev local / container)
- `prisma/deploy/schema.postgresql.prisma` → **PostgreSQL** (Vercel deploy)

> **IMPORTANTE:** O entrypoint do container (`docker-entrypoint-dev.sh`) corrige automaticamente o provider para MySQL, mesmo que o arquivo `schema.prisma` no host esteja com PostgreSQL.

## Executando Testes Playwright

```bash
# Dentro do container - Smoke Tests
docker exec bidexpert-dev1-app-1 bash scripts/run-tests-in-container.sh smoke

# Dentro do container - Todos E2E
docker exec bidexpert-dev1-app-1 bash scripts/run-tests-in-container.sh e2e
```

### Evidência JSON
Após cada execução, um arquivo JSON de evidência é gerado em:
```
/app/test-results/evidence-<dev-id>-<timestamp>.json
```

Formato:
```json
{
  "devId": "dev1",
  "timestamp": "20260216-170049",
  "testFilter": "smoke",
  "project": "dev-dev1-smoke",
  "exitCode": 0,
  "status": "passed",
  "config": "playwright.container.config.ts",
  "containerHostname": "f0279273876f"
}
```

## Workflow de PR

1. Desenvolva na sua branch
2. Execute os testes Playwright no container
3. Copie a evidência JSON para o corpo do PR
4. Abra o PR usando o template (`.github/PULL_REQUEST_TEMPLATE.md`)
5. CI/CD roda automaticamente (`.github/workflows/pr-gate.yml`)
6. Aguarde aprovação para merge

## Multi-Tenant no Container

O container usa `demo.localhost` como subdomínio para resolver o tenant `demo` (ID 1). Todas as URLs internas usam:
- `http://demo.localhost:3000` (dentro do container)
- `http://demo.localhost:<APP_PORT>` (fora do container, via host)

## Comandos Úteis

```powershell
# Ver logs do app
docker logs bidexpert-dev1-app-1 -f

# Acessar shell do container
docker exec -it bidexpert-dev1-app-1 bash

# Ver status de todos os containers
docker ps --filter "name=bidexpert" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Parar seus containers
docker compose -f docker-compose.dev-isolated.yml -p bidexpert-dev1 down

# Limpar volumes (reset do banco)
docker compose -f docker-compose.dev-isolated.yml -p bidexpert-dev1 down -v

# Reconstruir imagem (após mudanças no Dockerfile)
docker compose -f docker-compose.dev-isolated.yml -p bidexpert-dev1 up -d --build
```

## Troubleshooting

### App retorna 500 no homepage
- Verifique se o tenant `demo` existe no banco: `docker exec bidexpert-dev1-mysql-1 mysql -u root -pDevPassword2026 bidexpert_dev -e "SELECT * FROM Tenant;"`
- Se não existir, rode o seed: `docker exec bidexpert-dev1-app-1 npx tsx scripts/ultimate-master-seed.ts`

### Prisma diz "provider postgresql" mas banco é MySQL
- O entrypoint corrige automaticamente. Se persistir: `docker exec bidexpert-dev1-app-1 sed -i 's/provider = "postgresql"/provider = "mysql"/' prisma/schema.prisma && npx prisma generate`

### OOM (Out of Memory)
- Container tem 4GB de memória e 3GB de heap Node.js
- Se persistir, feche outros processos pesados no host

### Playwright não encontra Chromium
- `docker exec bidexpert-dev1-app-1 npx playwright install chromium --with-deps`
