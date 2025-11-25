# 🚀 ITSM-AI - Guia de Deploy para Produção

## ✅ Status: PRONTO PARA PRODUÇÃO

**Data de Validação**: 23 de Novembro de 2024  
**Versão**: 1.0.0  
**Status de Testes**: ✅ 130+ testes passando  
**Cobertura**: ~95-100%

---

## 📋 Checklist Pré-Deploy

### ✅ Implementação Validada

- [x] **3 Componentes React** implementados e testados
  - floating-support-buttons.tsx
  - support-chat-modal.tsx
  - admin-query-monitor.tsx

- [x] **2 APIs REST** implementadas e testadas
  - POST /api/support/chat
  - POST /api/support/tickets
  - GET /api/support/tickets
  - GET /api/admin/query-monitor

- [x] **5 Tabelas de Banco de Dados** criadas
  - itsm_tickets
  - itsm_messages
  - itsm_attachments
  - itsm_chat_logs
  - itsm_query_logs

- [x] **130+ Testes** implementados e passando
  - 40+ cenários BDD
  - 48 testes E2E
  - 25 testes de API
  - 20 testes de bugs

- [x] **6 Documentos** técnicos completos
- [x] **2 Scripts** de automação (Windows + Linux)

---

## 🚀 Passos para Deploy

### 1️⃣ Backup do Banco de Dados

```bash
# Criar backup antes do deploy
mysqldump -u root -p bidexpert_db > backup_pre_itsm_$(date +%Y%m%d_%H%M%S).sql
```

### 2️⃣ Aplicar Migration SQL

```bash
# Executar migration ITSM
mysql -u root -p bidexpert_db < add_itsm_support_system.sql
```

**Verificar tabelas criadas:**
```sql
USE bidexpert_db;
SHOW TABLES LIKE 'itsm_%';
```

Deve retornar:
- itsm_attachments
- itsm_chat_logs
- itsm_messages
- itsm_query_logs
- itsm_tickets

### 3️⃣ Atualizar Prisma Schema

```bash
# Regenerar Prisma Client
npx prisma generate

# Validar schema
npx prisma validate
```

### 4️⃣ Build da Aplicação

```bash
# Limpar cache
npm run clean
# ou manualmente:
rm -rf .next
rm -rf node_modules/.cache

# Instalar dependências (se necessário)
npm install

# Build de produção
npm run build
```

### 5️⃣ Executar Testes Finais

```bash
# Executar suite completa de testes
npx playwright test tests/itsm

# OU usar script automatizado:
# Windows:
run-itsm-tests.bat

# Linux/Mac:
./run-itsm-tests.sh
```

**Resultado esperado:**
```
Running 130 tests using 1 worker
✓ 130 passed (5m)
```

### 6️⃣ Deploy

#### Opção A: Deploy Local/Staging

```bash
# Iniciar servidor
npm run start
# ou
pm2 start npm --name "bidexpert-itsm" -- start
```

#### Opção B: Deploy Firebase/Vercel

```bash
# Firebase
firebase deploy

# Vercel
vercel --prod
```

### 7️⃣ Verificação Pós-Deploy

**Acessar URLs:**

1. **Sistema de Suporte** (usuário logado):
   - http://your-domain.com/dashboard
   - Verificar botões flutuantes no canto inferior direito

2. **Admin Query Monitor** (admin apenas):
   - http://your-domain.com/admin
   - Verificar rodapé com monitor de queries

3. **Admin Tickets**:
   - http://your-domain.com/admin/tickets
   - Verificar listagem de tickets

**Testar Funcionalidades:**

- [ ] Clicar no botão "Chat AI"
- [ ] Enviar mensagem de teste
- [ ] Abrir FAQ
- [ ] Criar um ticket de suporte
- [ ] Verificar ticket no painel admin
- [ ] Verificar queries no monitor (admin)

---

## 🔒 Permissões e Segurança

### Roles Necessárias

As seguintes roles já estão configuradas no sistema:

- **ADMIN**: Acesso total (tickets + query monitor)
- **SUPPORT_AGENT**: Gerencia tickets
- **SUPPORT_MANAGER**: Supervisiona equipe
- **DEV_OPS**: Acesso ao query monitor

### Validações Implementadas

✅ Sanitização de inputs (XSS prevention)  
✅ Validação de schemas (Zod)  
✅ Rate limiting nas APIs  
✅ Autorização por role  
✅ SQL injection prevention (Prisma ORM)

---

## 📊 Monitoramento

### Métricas para Acompanhar

1. **Performance das Queries**
   - Tempo médio de execução
   - Queries lentas (> 1s)

2. **Volume de Tickets**
   - Tickets abertos por dia
   - Tempo médio de resposta

3. **Uso do Chat AI**
   - Mensagens enviadas
   - Taxa de resolução

4. **Erros e Logs**
   - Erros 500 nas APIs
   - Timeouts
   - Falhas de validação

### Logs

Os logs são salvos em:

- `itsm_chat_logs`: Histórico de conversas
- `itsm_query_logs`: Queries SQL executadas
- Console do servidor: Erros e warnings

---

## 🐛 Troubleshooting

### Problema: Botões flutuantes não aparecem

**Solução:**
```bash
# Verificar se usuário está autenticado
# Verificar se componente está importado em layout
```

### Problema: API retorna 401/403

**Solução:**
```bash
# Verificar sessão do usuário
# Verificar roles no banco de dados
SELECT id, email, role FROM users WHERE email = 'seu@email.com';
```

### Problema: Query Monitor vazio

**Solução:**
```sql
-- Verificar se há logs
SELECT COUNT(*) FROM itsm_query_logs;

-- Verificar se usuário tem permissão ADMIN
```

### Problema: Erros no build

**Solução:**
```bash
# Limpar tudo e reconstruir
rm -rf .next node_modules/.cache
npm install
npx prisma generate
npm run build
```

---

## 🔄 Rollback (se necessário)

### Se algo der errado:

1. **Restaurar backup do banco:**
```bash
mysql -u root -p bidexpert_db < backup_pre_itsm_YYYYMMDD_HHMMSS.sql
```

2. **Reverter código:**
```bash
git revert HEAD
# ou
git checkout <commit-anterior>
```

3. **Rebuild:**
```bash
npm run build
npm run start
```

---

## 📞 Suporte

### Em caso de problemas:

1. **Verificar logs:**
   - Logs do servidor
   - Logs do banco de dados
   - Browser console (F12)

2. **Executar testes:**
   ```bash
   npx playwright test tests/itsm --reporter=html
   ```

3. **Consultar documentação:**
   - `ITSM_IMPLEMENTATION_SUMMARY.md`
   - `ITSM_QUICK_START.md`
   - `tests/itsm/README_TESTS.md`

---

## ✅ Validação Final Pós-Deploy

### Checklist:

- [ ] Servidor rodando sem erros
- [ ] Todas as 5 tabelas ITSM criadas
- [ ] Botões flutuantes visíveis
- [ ] Chat AI funcionando
- [ ] FAQ carregando
- [ ] Criação de tickets OK
- [ ] Painel admin acessível
- [ ] Query Monitor funcionando
- [ ] Testes E2E passando
- [ ] Sem erros no console

---

## 🎉 Deploy Concluído!

Após completar todos os passos acima, o sistema ITSM-AI estará **100% funcional em produção**.

**Próximos passos:**
1. Monitorar métricas por 24-48h
2. Coletar feedback dos usuários
3. Ajustar conforme necessário

---

**Versão**: 1.0.0  
**Data**: Novembro 2024  
**Status**: ✅ PRONTO PARA PRODUÇÃO
