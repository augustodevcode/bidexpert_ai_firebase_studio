# Status do Deploy Cloud Run

**ID do Build**: `2603a71a-e847-4f3d-9ce6-de4039bce9b6`
**Status**: Em andamento (WORKING)
**Timestamp**: 2026-01-14T00:06:26+00:00

## Correção Aplicada
O arquivo `scripts/start-cloud.sh` foi alterado para incluir a flag `--skip-generate` no comando `prisma db push`.
Isso evita que o Prisma tente gravar na pasta global `node_modules` (que é somente leitura) durante a inicialização do container, corrigindo o erro `Error: Can't write to /usr/local/lib/node_modules/prisma`.

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
