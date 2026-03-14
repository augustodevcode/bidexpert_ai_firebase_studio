# 🚀 Fluxo de Deploy: GitHub CI/CD + Vercel + Prisma Postgres

> **Data de Criação:** 2026-02-05
> **Versão:** 1.0.0

## Visão Geral

Este documento descreve o fluxo correto de desenvolvimento e deploy para o BidExpert, garantindo testes locais com PostgreSQL antes do deploy para produção.

## Arquitetura de Ambientes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DESENVOLVIMENTO LOCAL                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  DEV (MySQL)                    │  DEV-POSTGRES (Prisma Cloud)              │
│  ├─ localhost:9005              │  ├─ Prisma Postgres MCP                   │
│  ├─ MySQL local Docker          │  ├─ Testes de compatibilidade             │
│  └─ Desenvolvimento diário      │  └─ Validação antes do deploy             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ git push
┌─────────────────────────────────────────────────────────────────────────────┐
│                            GITHUB CI/CD                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Push para main/demo-stable                                              │
│  2. GitHub Actions dispara workflow                                          │
│  3. Vercel Git Integration detecta push                                      │
│  4. Build automático no Vercel                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ deploy automático
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PRODUÇÃO (VERCEL)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ├─ bidexpertaifirebasestudio.vercel.app                                    │
│  ├─ bidexpert.com.br / www.bidexpert.com.br                                 │
│  ├─ PostgreSQL (Prisma Postgres Cloud)                                      │
│  └─ Build: prisma db push + Next.js build                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Fluxo de Trabalho Passo a Passo

## Gate de Aprovação de PR e Evidências (Obrigatório)

Antes de qualquer promoção para `demo-stable`/`main`:

1. A PR precisa ter review humano `APPROVED`.
2. PR sem aprovação deve manter label `pending-human-approval` e comentário automático de lembrete.
3. O CI deve comentar na PR os links do run e dos artifacts de evidência Playwright (`playwright-report` e `test-results`).
4. Sem aprovação + evidência publicada na PR, o deploy deve ser considerado bloqueado.

### 1. Desenvolvimento Local (MySQL)

```powershell
# Iniciar ambiente de dev local
node .vscode/start-9005.js

# Ou via task do VSCode:
# "Run BidExpert App (Port 9005 with Logging)"
```

### 2. Testar com PostgreSQL Localmente (Antes do Deploy)

```powershell
# 1. Login no Prisma (se necessário)
# Use o MCP: prisma-platform-login

# 2. Criar banco de dev PostgreSQL
# Use o MCP: prisma-postgres-create-database
#   - name: bidexpert-dev
#   - region: us-east-1
#   - workspaceId: <seu-workspace>

# 3. Copiar schema PostgreSQL
Copy-Item -Path "prisma/deploy/schema.postgresql.prisma" -Destination "prisma/schema.prisma" -Force

# 4. Gerar Prisma Client
$env:DATABASE_URL="<connection-string-do-prisma-postgres>"
npx prisma generate

# 5. Sincronizar schema
npx prisma db push

# 6. Rodar seed (se necessário)
npx prisma db seed

# 7. Testar aplicação
$env:DATABASE_URL="<connection-string>"
npm run dev
```

### 3. Deploy via GitHub CI/CD (MÉTODO CORRETO)

```powershell
# 1. Restaurar schema MySQL para desenvolvimento local
Copy-Item -Path "prisma/schema.mysql.temp.prisma" -Destination "prisma/schema.prisma" -Force
# (Ou simplesmente deixar o schema.prisma intacto no git - ele não deve ser commitado com alterações)

# 2. Commitar alterações
git add .
git commit -m "feat/fix: descrição das alterações"

# 3. Push para branch de feature (CI/CD valida automaticamente)
git push origin feat/minha-feature
# Depois abrir PR para `demo-stable`; promoção para `main` somente via PR aprovado

# 4. Vercel detecta o push e inicia o build automaticamente
# Acompanhar em: https://vercel.com/augustos-projects-d51a961f/bidexpert_ai_firebase_studio
```

### 4. Configuração do Build no Vercel

## Troca Automática de Schema MySQL → PostgreSQL (Automática)

> **Resposta curta: SIM.** Tanto o Vercel quanto o GitHub Actions trocam automaticamente o schema antes do build. Você nunca precisa fazer isso manualmente para deploy.

### Onde acontece a troca automática:

**1. `vercel.json` — buildCommand (Vercel executa diretamente)**
```json
{
  "buildCommand": "cp prisma/deploy/schema.postgresql.prisma prisma/schema.prisma && npx prisma generate && npm run build"
}
```
Este comando é executado pelo Vercel a cada deploy. O primeiro passo já é a cópia do schema PostgreSQL.

**2. GitHub Actions — Workflows de Deploy**

Cada workflow de deploy (HML, DEMO, PROD) tem o step `🔄 Copy PostgreSQL schema` executado ANTES de qualquer `prisma generate` ou build:

```yaml
- name: 🔄 Copy PostgreSQL schema
  run: cp prisma/deploy/schema.postgresql.prisma prisma/schema.prisma

- name: 🗄️ Generate Prisma Client
  run: npx prisma generate

- name: 🏗️ Build
  run: npm run build
```

### Por que `prisma/schema.prisma` fica com MySQL no git?

O `prisma/schema.prisma` no repositório usa `provider = "mysql"` porque:
- Desenvolvimento local usa MySQL via Docker
- A CI de PR (branch-protection.yml) valida o schema MySQL localmente
- O deploy SUBSTITUI o arquivo automaticamente antes de usar

```
Git repository          GitHub Actions / Vercel Build
─────────────           ─────────────────────────────
schema.prisma           schema.postgresql.prisma
(provider: mysql)  ──►  (cp) ──► schema.prisma       ──► prisma generate ──► npm build
                                  (provider: postgresql)
```

**Regra:** nunca commitar `prisma/schema.prisma` com `provider = "postgresql"`. O CI faz essa troca em memória durante o build.

---

O `vercel.json` contém o build command que:
1. Copia o schema PostgreSQL
2. Gera o Prisma Client
3. Sincroniza o banco (db push)
4. Faz o build do Next.js

```json
{
  "buildCommand": "cp prisma/deploy/schema.postgresql.prisma prisma/schema.prisma && npx prisma generate && npm run build"
}
```

## Credenciais e Variáveis de Ambiente

### Banco de Dev (Prisma Postgres MCP)

```
Project: bidexpert-dev
Workspace: Augusto's projects
Region: US East (N. Virginia)
Connection String: prisma+postgres://accelerate.prisma-data.net/?api_key=...
```

### Banco de Produção (Vercel)

Configurado nas Environment Variables do projeto Vercel:
- `DATABASE_URL`: URL do Prisma Postgres de produção

## Seed Remoto (Exceção)

O seed pode ser executado diretamente contra o banco de produção quando necessário:

```powershell
# ⚠️ ATENÇÃO: Isso afeta dados de produção!

# 1. Copiar schema PostgreSQL
Copy-Item -Path "prisma/deploy/schema.postgresql.prisma" -Destination "prisma/schema.prisma" -Force

# 2. Gerar Prisma Client
$env:DATABASE_URL="<url-do-postgres-producao>"
npx prisma generate

# 3. Executar seed
npx prisma db seed

# 4. IMPORTANTE: Restaurar schema MySQL após o seed
Copy-Item -Path "prisma/schema.mysql.temp.prisma" -Destination "prisma/schema.prisma" -Force
npx prisma generate
```

## Domínios Landlord (Multi-tenant)

O middleware resolve tenant baseado no domínio. Domínios configurados como Landlord (tenant ID 1):

```typescript
const LANDLORD_DOMAINS = [
  'bidexpert.com.br',
  'www.bidexpert.com.br',
  'localhost',
  'localhost:9005',
  'bidexpertaifirebasestudio.vercel.app',
  // ... outros
];
```

## Troubleshooting

### Erro 500 após deploy

1. Verificar logs de runtime no Vercel
2. Verificar se o seed foi executado
3. Verificar se os domínios estão em LANDLORD_DOMAINS

### Erro de Prisma "provider mismatch"

O schema local usa MySQL, mas o deploy usa PostgreSQL. Certifique-se de:
1. Não commitar alterações no `prisma/schema.prisma`
2. O build command copia `schema.postgresql.prisma` automaticamente

### Banco sem dados

Executar seed remotamente (ver seção "Seed Remoto").

## Bancos de Dados Disponíveis

| Ambiente | Tipo | Host | Uso |
|----------|------|------|-----|
| DEV Local | MySQL | localhost:3306 | Desenvolvimento diário |
| DEV Postgres | Prisma Postgres | db.prisma.io | Testes de compatibilidade |
| Produção | Prisma Postgres | db.prisma.io | Vercel Production |

## Referências

- [Prisma Postgres Documentation](https://www.prisma.io/docs/postgres)
- [Vercel Git Integration](https://vercel.com/docs/git)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
