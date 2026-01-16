# Status do Deploy Cloud Run

**ID do Build**: `(Falha no Upload)`
**Status**: Erro (BILLING_SUSPENDED)
**Timestamp**: 2026-01-15T09:10:00+00:00

## Erro Crítico
O deploy foi interrompido pelo Google Cloud.
**Motivo:** A conta de faturamento associada ao projeto `bidexpert-630df` está desativada ou com pendências ("state delinquent").

> `ERROR: (gcloud.builds.submit) 403 Could not upload file ... The billing account for the owning project is disabled in state delinquent.`

## Ação Necessária
1. Acesse o [Console de Faturamento do Google Cloud](https://console.cloud.google.com/billing).
2. Verifique o status da conta de pagamento.
3. Assim que regularizado, solicite um novo deploy.

## Correção Aplicada (Pendente)
Atualização da Admin API Key.
Correção do arquivo `.gcloudignore` para garantir inclusão do Dockerfile.

## Próximos Passos
Assim que o build terminar (Status: SUCCESS), execute o comando abaixo para atualizar o serviço Cloud Run:

```bash
gcloud run deploy bidexpert-app \
  --image gcr.io/bidexpert-630df/bidexpert-app \
  --region southamerica-east1 \
  --platform managed \
  --allow-unauthenticated \
  --project bidexpert-630df \
  --vpc-connector bidexpert-connector \
  --set-env-vars NODE_ENV=production,RUN_MIGRATION=true,DATABASE_URL=postgresql://postgres:xL6cqPhigY5cx!@10.114.0.2:5432/postgres,REDIS_URL=redis://10.63.200.123:6379
```

Para verificar o status do build:
```bash
gcloud builds describe 2603a71a-e847-4f3d-9ce6-de4039bce9b6 --format="value(status)"
```
