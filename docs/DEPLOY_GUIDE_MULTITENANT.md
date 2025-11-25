# Guia de Deploy - Implementação Multi-Tenant tenantId

## ⚠️ IMPORTANTE - LEIA ANTES DE EXECUTAR

Esta implementação adiciona o campo `tenantId` em múltiplas tabelas do banco de dados.
É uma mudança estrutural crítica que requer planejamento e execução cuidadosa.

## Pré-requisitos

1. ✅ Backup completo do banco de dados
2. ✅ Ambiente de staging/homologação para testes
3. ✅ Janela de manutenção agendada (recomendado 2-4 horas)
4. ✅ Acesso ao servidor de banco de dados
5. ✅ Permissões para executar migrations
6. ✅ Node.js 18+ e npm instalados

## Passo 1: Backup do Banco de Dados

### MySQL
```bash
# Backup completo
mysqldump -u root -p bidexpert_db > backup_antes_multitenant_$(date +%Y%m%d_%H%M%S).sql

# Verificar backup
ls -lh backup_*.sql
```

### Backup de arquivos do projeto
```bash
# Criar backup do diretório do projeto
tar -czf bidexpert_backup_$(date +%Y%m%d_%H%M%S).tar.gz .
```

## Passo 2: Preparação do Ambiente

### 2.1 Atualizar dependências
```bash
npm install
```

### 2.2 Validar schema Prisma
```bash
npx prisma validate
```

### 2.3 Gerar client Prisma atualizado
```bash
npx prisma generate
```

## Passo 3: Criar e Aplicar Migration

### 3.1 Criar migration
```bash
# Criar migration com nome descritivo
npx prisma migrate dev --name add_tenantid_multitenant --create-only

# Revisar o SQL gerado
# O arquivo estará em prisma/migrations/XXXXXXXXX_add_tenantid_multitenant/migration.sql
```

### 3.2 Revisar migration gerada
Verifique se a migration inclui:
- [x] Adição de coluna `tenantId` em todas as tabelas necessárias
- [x] Criação de foreign keys para Tenant
- [x] Criação de índices em `tenantId`
- [x] Comandos SQL estão corretos

### 3.3 Aplicar migration (STAGING primeiro!)
```bash
# Em staging/homologação
DATABASE_URL="mysql://user:pass@staging-host:3306/bidexpert_staging" npx prisma migrate deploy

# Verificar se aplicou corretamente
DATABASE_URL="mysql://user:pass@staging-host:3306/bidexpert_staging" npx prisma db pull
```

## Passo 4: Migração de Dados

### 4.1 Executar script de migração de dados
```bash
# Em staging primeiro!
DATABASE_URL="mysql://user:pass@staging-host:3306/bidexpert_staging" npx tsx scripts/migrate-tenantid-data.ts

# Verificar logs
# O script deve exibir:
# - Número de registros atualizados por tabela
# - Erros encontrados (se houver)
# - Resumo final
```

### 4.2 Validar integridade dos dados
```bash
# Criar script de validação
npx tsx scripts/validate-tenantid-integrity.ts
```

## Passo 5: Testes em Staging

### 5.1 Testes manuais
- [ ] Login em diferentes tenants
- [ ] Criar leilão e verificar tenantId
- [ ] Criar lote e verificar herança de tenantId
- [ ] Fazer lance e verificar isolamento
- [ ] Buscar leilões/lotes e verificar filtro
- [ ] Tentar acessar recurso de outro tenant (deve falhar)

### 5.2 Executar testes automatizados
```bash
# Testes unitários
npm run test:unit

# Testes E2E
npm run test:e2e:multitenant
```

### 5.3 Verificar performance
```bash
# Executar queries de teste
# Verificar uso de índices
# Comparar tempos antes/depois
```

## Passo 6: Deploy em Produção

### 6.1 Comunicação
- [ ] Notificar usuários sobre manutenção
- [ ] Definir janela de manutenção
- [ ] Preparar mensagem de status

### 6.2 Colocar sistema em manutenção
```bash
# Ativar modo manutenção
npm run maintenance:on

# OU criar arquivo de manutenção
touch public/maintenance.flag
```

### 6.3 Aplicar migration em produção
```bash
# Aplicar migration
DATABASE_URL="mysql://user:pass@prod-host:3306/bidexpert_prod" npx prisma migrate deploy

# Executar migração de dados
DATABASE_URL="mysql://user:pass@prod-host:3306/bidexpert_prod" npx tsx scripts/migrate-tenantid-data.ts

# Validar integridade
DATABASE_URL="mysql://user:pass@prod-host:3306/bidexpert_prod" npx tsx scripts/validate-tenantid-integrity.ts
```

### 6.4 Restart da aplicação
```bash
# PM2
pm2 restart bidexpert

# Docker
docker-compose restart app

# Systemd
systemctl restart bidexpert
```

### 6.5 Remover modo manutenção
```bash
npm run maintenance:off

# OU
rm public/maintenance.flag
```

## Passo 7: Validação Pós-Deploy

### 7.1 Smoke tests
- [ ] Aplicação está online
- [ ] Login funciona
- [ ] Leilões aparecem corretamente
- [ ] Lotes aparecem corretamente
- [ ] Lances funcionam
- [ ] Isolamento multi-tenant funciona

### 7.2 Monitoramento
```bash
# Verificar logs
tail -f logs/application.log

# Verificar erros
grep -i "error" logs/application.log | tail -20

# Monitorar performance do banco
# Use ferramentas apropriadas para MySQL
```

### 7.3 Verificar métricas
- [ ] Tempo de resposta das APIs
- [ ] Uso de CPU/Memória
- [ ] Conexões de banco de dados
- [ ] Taxa de erros

## Passo 8: Rollback (se necessário)

### 8.1 Rollback rápido (aplicação)
```bash
# Reverter para versão anterior do código
git checkout <commit-anterior>

# Restart
pm2 restart bidexpert
```

### 8.2 Rollback completo (banco + aplicação)
```bash
# Restaurar backup do banco
mysql -u root -p bidexpert_prod < backup_antes_multitenant_XXXXXXXXX.sql

# Reverter migrations
npx prisma migrate resolve --rolled-back XXXXXXXXX_add_tenantid_multitenant

# Reverter código
git checkout <commit-anterior>

# Restart
pm2 restart bidexpert
```

## Passo 9: Documentação e Comunicação

### 9.1 Atualizar documentação
- [ ] README.md
- [ ] CHANGELOG.md
- [ ] Documentação de API
- [ ] Guias de usuário (se necessário)

### 9.2 Comunicar sucesso
- [ ] Notificar stakeholders
- [ ] Atualizar status page
- [ ] Registrar no log de mudanças

## Checklist Final

### Pré-Deploy
- [ ] Backup completo realizado
- [ ] Migration testada em staging
- [ ] Dados migrados com sucesso em staging
- [ ] Testes passando em staging
- [ ] Performance validada em staging
- [ ] Janela de manutenção agendada
- [ ] Comunicação enviada aos usuários

### Deploy
- [ ] Sistema em modo manutenção
- [ ] Migration aplicada com sucesso
- [ ] Dados migrados com sucesso
- [ ] Validação de integridade passou
- [ ] Aplicação reiniciada
- [ ] Modo manutenção desativado

### Pós-Deploy
- [ ] Smoke tests passaram
- [ ] Monitoramento ativo
- [ ] Sem erros críticos nos logs
- [ ] Performance normal
- [ ] Usuários conseguem acessar
- [ ] Isolamento multi-tenant funcionando
- [ ] Documentação atualizada

## Contatos de Emergência

- **DBA:** [contato-dba]
- **DevOps:** [contato-devops]
- **Tech Lead:** [contato-techlead]

## Estimativas de Tempo

- Backup: 15-30 min
- Aplicação de migration: 5-15 min
- Migração de dados: 10-60 min (depende do volume)
- Validação: 15-30 min
- Testes: 30-60 min
- **TOTAL: 2-4 horas**

## Notas Adicionais

1. **Performance**: As migrations adicionam índices em `tenantId` para manter a performance.

2. **Dados órfãos**: O script de migração popula `tenantId` baseado em relacionamentos. Dados sem relacionamento podem precisar de tratamento manual.

3. **Categorias globais**: LotCategory e Subcategory suportam tanto categorias globais (tenantId=null) quanto específicas de tenant.

4. **ITSM e logs**: Alguns módulos (ITSM, logs) têm tenantId nullable para suportar contexto global.

5. **Backward compatibility**: Não há backward compatibility. Após o deploy, o código antigo não funcionará.

## Monitoramento Contínuo

Após o deploy, monitore:
- Taxa de erro em APIs
- Tempo de resposta de queries
- Uso de índices (EXPLAIN queries)
- Logs de acesso cross-tenant (audit log)
- Reclamações de usuários

## Suporte

Em caso de problemas:
1. Consulte os logs
2. Verifique o status do banco de dados
3. Revise a documentação de troubleshooting
4. Contate a equipe de desenvolvimento
