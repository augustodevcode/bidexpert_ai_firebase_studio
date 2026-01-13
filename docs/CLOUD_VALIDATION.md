# Validação e Testes em Nuvem (Cloud Run)

Este documento descreve como validar a aplicação BidExpert após o deploy no Google Cloud Run.

## Pré-requisitos

1.  A aplicação deve estar deployada e acessível via URL pública (ex: `https://bidexpert-app-12345-uc.a.run.app`).
2.  A variável `RUN_MIGRATION=true` deve ter sido processada na inicialização do container (ver logs do Cloud Run).

## Testes Manuais Rápidos

1.  **Acesso Básico:** Abra a URL no navegador. A home page deve carregar.
2.  **Login:** Use as credenciais de admin (ex: `admin@lordland.com` / `admin123` - verificar `seed-data-extended-v3.ts` se a senha foi alterada).
3.  **Realtime (Socket.io/Redis):**
    *   Abra o Console do Desenvolvedor (F12).
    *   Filre por "WS" ou "WebSocket".
    *   Verifique se há conexão bem sucedida com o endpoint de socket.
    *   Faça um lance em um leilão e verifique se atualiza sem refresh.

## Testes Automatizados (E2E) com Playwright

Você pode executar a suíte de testes E2E localmente, mas apontando para o ambiente de nuvem.

### Comando

```bash
# Windows (PowerShell)
$env:BASE_URL="https://SUA-URL-DO-CLOUD-RUN.app"
npm run test:e2e:cloud

# Linux/Mac
BASE_URL="https://SUA-URL-DO-CLOUD-RUN.app" npm run test:e2e:cloud
```

### O que acontece?
*   `PLAYWRIGHT_SKIP_WEBSERVER=1`: Ignora a etapa de subir o servidor local.
*   `BASE_URL=...`: Sobrescreve a URL base dos testes para apontar para a nuvem.
*   Os testes de login, lances e navegação serão executados contra a infraestrutura real (Cloud Run + AlloyDB + Redis).

## Troubleshooting

### Build Falhando no Cloud Build
*   Verifique se o `schema.prisma` está com `provider = "postgresql"`.
*   Verifique logs de memória. O Cloud Build default pode não ter memória suficiente para `next build`. Solução: Aumentar o machine type no `cloudbuild.yaml` (ex: `E2_HIGHCPU_8`).

### Erro de Conexão com Banco (Runtime)
*   Verifique se o Serverless VPC Access Connector (`bidexpert-connector`) está configurado no serviço Cloud Run.
*   Confirme se o IP do AlloyDB (`10.114.0.2`) está correto nas variáveis de ambiente.

### Erro de WebSocket
*   O Redis deve estar acessível via VPC Peering.
*   Verifique logs do container por `ERROR` relacionados a `ioredis` ou `socket.io-redis-adapter`.
