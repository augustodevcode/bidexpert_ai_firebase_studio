# Guia de Migração GCP - BidExpert

Este documento detalha o processo de migração da aplicação BidExpert para a Google Cloud Platform (GCP), utilizando Cloud Run, AlloyDB (PostgreSQL) e Memorystore (Redis).

## Arquitetura

*   **Compute:** Cloud Run (Serverless Container)
*   **Database:** AlloyDB for PostgreSQL (Private IP: 10.114.0.2)
*   **Cache/Realtime:** Memorystore for Redis (Private IP: 10.63.200.123)
*   **Network:** Serverless VPC Access Connector (`bidexpert-connector`) para comunicação entre Cloud Run e VPC.

## Estratégia de Deploy e Migração

A migração de esquema e carga de dados (seed) é automatizada no processo de inicialização do container, controlada por variáveis de ambiente.

### 1. Configuração do Dockerfile

O `Dockerfile` foi ajustado para:
*   Copiar os scripts de automação (`scripts/`) e o schema Prisma (`prisma/`).
*   Instalar `prisma` e `tsx` globalmente na imagem de produção para permitir execução de scripts de manutenção.
*   Utilizar um script de entrada personalizado `scripts/start-cloud.sh`.

### 2. Script de Inicialização (`start-cloud.sh`)

O script `scripts/start-cloud.sh` é executado ao iniciar o container. Ele verifica a variável de ambiente `RUN_MIGRATION`.

*   **Se `RUN_MIGRATION=true`**:
    1.  Executa `npx prisma db push --accept-data-loss` para alinhar o schema do banco com o código.
    2.  Executa o seed de dados (`scripts/seed-data-extended-v3.ts` ou fallback).
*   **Sempre**:
    1.  Inicia a aplicação (`node server.js`).

### 3. Cloud Build (`cloudbuild.yaml`)

O pipeline de build define a variável `RUN_MIGRATION=true` para garantir que o deploy atualize o banco de dados.

**Variáveis de Ambiente Críticas:**
*   `DATABASE_URL`: `postgresql://postgres:xL6cqPhigY5cx!@10.114.0.2:5432/postgres`
*   `REDIS_URL`: `redis://10.63.200.123:6379`
*   `RUN_MIGRATION`: `true` (Define se deve rodar migration/seed)

## Como Validar

1.  **Monitorar Logs:** Acompanhe os logs do Cloud Run. Você deve ver mensagens como "Running Prisma DB Push..." e a saída do script de seed.
2.  **Verificar Aplicação:**
    *   Acesse a URL pública do serviço Cloud Run.
    *   Tente realizar login com um usuário de teste (ex: `admin@lordland.com` ou criado pelo seed).
    *   Verifique se os leilões e lotes aparecem na listagem (dados do seed).
    *   Teste a funcionalidade de lances (Socket.io) observando se não há erros de conexão no console do navegador (o Redis deve estar acessível).

## Próximos Passos (Pós-Migração)

Após confirmar que o ambiente está estável e com dados:
1.  **Remover `RUN_MIGRATION=true`**: Atualize o `cloudbuild.yaml` ou as variáveis de ambiente do serviço Cloud Run para remover ou definir como `false` a variável `RUN_MIGRATION`. Isso evita que migrations e seeds rodem desnecessariamente a cada novo deploy ou reinício de instância.
2.  **Configurar Secrets:** Migrar as credenciais de banco e redis (atualmente no `cloudbuild.yaml`) para o Secret Manager.

