# Documentação da Esteira CI/CD — BidExpert

Esta documentação descreve o funcionamento da esteira de Integração e Entrega Contínua (CI/CD) implementada para os ambientes de Desenvolvimento, Homologação e Produção.

## Estrutura de Branches
- **`development`**: Ambiente de testes e integração. Gatilho para CI (Testes Unitários, E2E, Lint).
- **`homolog`**: Ambiente de pré-produção (Locaweb - Rocky Linux 8). Gatilho para Deploy Automático.
- **`main`**: Ambiente de produção (Firebase App Hosting). Gatilho para Deploy com Aprovação Manual.

## Ambientes e Configuração

### 1. Desenvolvimento (DEV)
- **Workflow**: `.github/workflows/p0-ci.yml`
- **Banco**: `bidexpert_dev` (mysql.dbaas.com.br)
- **Ações**: 
  - Build Check & Typecheck (soft gate com `npm run typecheck:soft` para não quebrar por débito técnico conhecido).
  - Testes Unitários (Vitest).
  - Testes E2E (Playwright).

### 2. Homologação (HML)
- **Workflow**: `.github/workflows/deploy-hml.yml`
- **Servidor**: Locaweb (FTP/SSH)
- **Banco**: `bidexpert_hml` (mysql.dbaas.com.br)
- **Ações**:
  - Migração de Banco (`prisma migrate deploy`).
  - Execução de Seeds (`prisma db seed`).
  - Backup automático da pasta `public_html` via SSH.
  - Deploy via FTP (Standalone mode).

### 3. Produção (PRD)
- **Workflow**: `.github/workflows/deploy-prd.yml`
- **Servidor**: Firebase App Hosting (GCP Cloud Run)
- **Banco**: `bidexpert_prd` (mysql.dbaas.com.br)
- **Ações**:
  - **Portão de Aprovação**: Requer aprovação manual no GitHub Actions (aba "Environments").
  - Migração de Banco (`prisma migrate deploy`).
  - Execução de Seeds (`prisma db seed`).
  - Deploy via Firebase App Hosting.

## Segredos Necessários (GitHub Secrets)
Para que a esteira funcione, adicione os seguintes segredos em seu repositório GitHub em `Settings > Secrets and variables > Actions`:

| Secret | Descrição |
| --- | --- |
| `DATABASE_URL_DEV` | URL de conexão mysql://... para a base de dev |
| `DATABASE_URL_HML` | URL de conexão mysql://... para a base de homolog |
| `DATABASE_URL_PRD` | URL de conexão mysql://... para a base de produção |
| `HOST` | `ftp.bidexpert.com.br` |
| `USER` | `bidexpert3` |
| `PASS` | `DNB6W3-PcfcZbH@` |
| `AUTH_SECRET` | Secret para NextAuth/Auth.js |

## Aprovação Manual
Para o ambiente de Produção, foi configurado um "Environment" chamado **Production**. 
1. Vá em `Settings > Environments`.
2. Clique em `Production`.
3. Ative a opção **Required reviewers** e adicione seu usuário.
4. Agora, toda vez que houver um merge na `main`, o GitHub enviará uma notificação para o seu App/E-mail solicitando a autorização.

## Estratégia de Rollback
- **HML**: No servidor FTP, as pastas são renomeadas com timestamp (`public_html_backup_YYYYMMDD_HHMMSS`). Para voltar, basta renomear a pasta desejada para `public_html` via FTP ou SSH.
- **PRD**: O Firebase App Hosting permite o rollback direto pelo console do Firebase selecionando uma build anterior estável.

> **Nota de prevenção:** enquanto o typecheck do pipeline roda em modo _soft_ para evitar bloqueios por débitos legados, antes de releases críticos deve-se executar manualmente `npm run typecheck` (strict) e corrigir os apontamentos.

---
*Gerado automaticamente pelo Assistente BidExpert.*
