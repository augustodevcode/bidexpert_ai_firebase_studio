# Histórico de Contexto - Gemini CLI

Este arquivo rastreia as interações e o contexto para as sessões do Gemini CLI.

## Container Tools - Instruções para Gemini

O Gemini CLI tem acesso completo às ferramentas de container do VSCode para gerenciar ambientes.

## Protocolo Anti-Erros Reais para Gemini CLI

Antes de qualquer correção automatizada:

1. Confirmar que o servidor em execução pertence ao worktree/ambiente correto.
2. Validar `DATABASE_URL`, `SESSION_SECRET`, `AUTH_SECRET` e `NEXTAUTH_SECRET` no `.env.local` do worktree.
3. Fazer probe em `/auth/login` e `/api/public/tenants`.
4. Se houver `ERR_CONNECTION_REFUSED` em várias rotas seguidas, classificar como servidor morto, porta errada ou OOM.
5. Se a aplicação usar `Dev: Auto-login`, validar visualmente esse estado antes de alterar login.
6. Se várias actions falharem com `input`/`ctx` `undefined`, inspecionar `src/lib/admin-plus/safe-action.ts` primeiro.
7. Confirmar campos reais do schema Prisma antes de mudar `select`/`include`.
8. Validar em ordem: browser interno → Playwright focado → lote maior.

### Configuração do Docker
O projeto utiliza Docker Compose para gerenciar serviços. Arquivos de configuração:
- `docker-compose.dev.yml` - Ambiente de desenvolvimento
- `docker-compose.hml.yml` - Ambiente de homologação  
- `docker-compose.demo.yml` - Ambiente de demonstração
- `docker-compose.prod.yml` - Ambiente de produção

### Serviços Disponíveis
| Serviço | Container | Porta | Descrição |
|---------|-----------|-------|-----------|
| MySQL | `bidexpert-mysql-dev` | 3306 | Banco de dados principal |
| SMTP4Dev | `bidexpert-smtp4dev` | 2525/8025 | Servidor de email para testes |

### Comandos Essenciais

#### Iniciar Ambiente de Desenvolvimento
```bash
docker compose -f docker-compose.dev.yml up -d
```

#### Verificar Status dos Containers
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

#### Ver Logs em Tempo Real
```bash
docker logs -f bidexpert-mysql-dev
```

#### Acessar Shell do Container MySQL
```bash
docker exec -it bidexpert-mysql-dev mysql -u root -p
```

#### Parar Ambiente
```bash
docker compose -f docker-compose.dev.yml down
```

### Fluxo de Trabalho Recomendado para Gemini

1. **Antes de testes E2E:**
   ```bash
   # Verificar se MySQL está rodando
   docker ps | Select-String "mysql"
   
   # Se não estiver, iniciar
   docker compose -f docker-compose.dev.yml up -d mysql
   ```

2. **Para testes de email:**
   ```bash
   # Iniciar SMTP4Dev
   docker compose -f docker-compose.dev.yml up -d smtp4dev
   
   # Acessar interface web: http://localhost:8025
   ```

3. **Troubleshooting:**
   ```bash
   # Verificar logs de erro
   docker logs bidexpert-mysql-dev --tail 50
   
   # Reiniciar container com problemas
   docker restart bidexpert-mysql-dev
   ```

### Variáveis de Ambiente por Ambiente
| Ambiente | DATABASE_URL Pattern |
|----------|---------------------|
| DEV | `mysql://root:password@localhost:3306/bidexpert_dev` |
| HML | `mysql://root:password@localhost:3306/bidexpert_hml` |
| DEMO | `mysql://root:M!nh@S3nha2025@localhost:3306/bidexpert_demo` |

### Regras Importantes
- ⚠️ Sempre verificar containers antes de executar operações de banco
- ⚠️ Usar o slug correto na URL para multi-tenancy (ex: `dev.localhost:9005`)
- ⚠️ Não expor credenciais de produção em logs ou chat

## Regra adicional: Máscaras Monetárias e Locale

- Toda exibição de valor monetário deve usar utilitário central de formatação.
- Nunca concatenar moeda manualmente em cálculos (`"R$ " + valor`).
- Sempre normalizar entradas monetárias com função de parsing antes de calcular totais/comissões.
- Padrão default: `pt-BR` / `BRL`; permitir troca visual para `USD` e `EUR` quando houver seletor global.
