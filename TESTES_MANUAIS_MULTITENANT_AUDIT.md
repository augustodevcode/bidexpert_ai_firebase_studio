# GUIA DE TESTES MANUAIS - MULTI-TENANT E AUDIT TRAIL

**Data:** 26/11/2025  
**Objetivo:** Validar isolamento multi-tenant e audit trail em todos os CRUDs  
**Formato:** BDD/TDD - Testes executáveis manualmente no browser

---

## 📋 PRÉ-REQUISITOS

### Dados Necessários
- ✅ Servidor rodando em `http://localhost:9005`
- ✅ Seed executado com dados dos dois tenants
- ✅ Usuários de teste disponíveis:
  - **admin@bidexpert.com** / Test@12345 (Tenant 1)
  - **user@tenant-b.com** / Test@12345 (Tenant 2)

### Ferramentas
- Browser (Chrome, Edge, Firefox)
- Acesso ao banco de dados (DBeaver, TablePlus, ou similar)
- Console do navegador (F12)

---

## 🧪 CENÁRIO 1: ISOLAMENTO DE LEILÕES

### TC-MT-AUCTION-01: Usuário do Tenant A não vê leilões do Tenant B

**Dado que:**
- Existe um leilão criado no Tenant B
- Estou logado como admin do Tenant A

**Quando:**
- Acesso a página `/admin/auctions`

**Então:**
- NÃO devo ver o leilão do Tenant B na lista

**Passos:**
1. **[TENANT B]** Login como `user@tenant-b.com` / `Test@12345`
2. Navegar para `/admin/auctions`
3. Clicar em "Novo Leilão"
4. Preencher:
   - Título: `TESTE-MT-B Leilão Exclusivo Tenant B`
   - Status: `ABERTO`
5. Salvar
6. **[LOGOUT]** Fazer logout
7. **[TENANT A]** Login como `admin@bidexpert.com` / `Test@12345`
8. Navegar para `/admin/auctions`
9. **[VERIFICAR]** Procurar por `TESTE-MT-B` na lista
10. **[ESPERADO]** NÃO deve aparecer

**Verificação no Banco:**
```sql
-- Verificar que o leilão existe no Tenant B
SELECT id, title, tenantId FROM auction 
WHERE title LIKE '%TESTE-MT-B%';

-- Deve retornar tenantId = 2
```

---

## 🧪 CENÁRIO 2: AUDIT LOG - CRIAÇÃO DE LEILÃO

### TC-AUDIT-AUCTION-01: Criação de leilão gera audit log

**Dado que:**
- Estou logado como admin do Tenant A

**Quando:**
- Crio um novo leilão

**Então:**
- Um registro de audit log deve ser criado
- Com ação = CREATE
- Com userId do admin
- Com tenantId correto

**Passos:**
1. Login como `admin@bidexpert.com` / `Test@12345`
2. Navegar para `/admin/auctions`
3. Clicar em "Novo Leilão"
4. Preencher:
   - Título: `TESTE-AUDIT Leilão para Auditoria`
   - Descrição: `Teste de audit trail`
   - Status: `RASCUNHO`
5. Salvar
6. Anotar o ID do leilão criado (visível na URL)

**Verificação no Banco:**
```sql
-- Substituir {AUCTION_ID} pelo ID anotado
SELECT 
  al.id,
  al.action,
  al.entityType,
  al.entityId,
  al.tenantId,
  al.userId,
  u.email as user_email,
  al.timestamp
FROM audit_logs al
INNER JOIN User u ON al.userId = u.id
WHERE al.entityType = 'Auction' 
  AND al.entityId = {AUCTION_ID}
  AND al.action = 'CREATE'
ORDER BY al.timestamp DESC;
```

**Esperado:**
- 1 registro com action = 'CREATE'
- userId = ID do admin@bidexpert.com
- tenantId = 1

---

## 🧪 CENÁRIO 3: AUDIT LOG - ATUALIZAÇÃO COM CAMPO CHANGES

### TC-AUDIT-AUCTION-02: Atualização registra campo alterado

**Dado que:**
- Existe um leilão criado

**Quando:**
- Edito o título do leilão

**Então:**
- Um audit log de UPDATE deve ser criado
- O campo "changes" deve conter before/after do título

**Passos:**
1. Login como `admin@bidexpert.com`
2. Navegar para `/admin/auctions`
3. Clicar em um leilão existente para editar
4. Anotar o título atual
5. Alterar o título para: `{TÍTULO ORIGINAL} - EDITADO`
6. Salvar
7. Aguardar 2 segundos (para log assíncrono)

**Verificação no Banco:**
```sql
-- Substituir {AUCTION_ID}
SELECT 
  al.id,
  al.action,
  al.changes,
  al.timestamp,
  u.email
FROM audit_logs al
INNER JOIN User u ON al.userId = u.id
WHERE al.entityType = 'Auction' 
  AND al.entityId = {AUCTION_ID}
  AND al.action = 'UPDATE'
ORDER BY al.timestamp DESC
LIMIT 1;
```

**Esperado:**
- Campo `changes` (JSON) contém:
```json
{
  "title": {
    "old": "Título Original",
    "new": "Título Original - EDITADO"
  }
}
```

---

## 🧪 CENÁRIO 4: ISOLAMENTO DE LOTES

### TC-MT-LOT-01: Lotes de tenants diferentes não são visíveis

**Dado que:**
- Existe um lote no Tenant B

**Quando:**
- Acesso como Tenant A

**Então:**
- Não vejo o lote nas listagens
- Não consigo acessar via URL direta

**Passos:**
1. **[TENANT B]** Login como `user@tenant-b.com`
2. Criar leilão no Tenant B
3. Criar lote com título: `TESTE-MT-B Lote Secreto`
4. Anotar o ID do lote
5. **[LOGOUT]**
6. **[TENANT A]** Login como `admin@bidexpert.com`
7. Navegar para `/admin/lots`
8. **[VERIFICAR]** `TESTE-MT-B Lote Secreto` NÃO aparece
9. Tentar acessar diretamente: `/admin/lots/{ID_LOTE_B}`
10. **[ESPERADO]** Erro 403/404 ou redirecionamento

**Verificação via API:**
1. Abrir console do navegador (F12)
2. Executar:
```javascript
fetch('/api/lots')
  .then(r => r.json())
  .then(data => {
    const lots = data.lots || data;
    const found = lots.find(l => l.title.includes('TESTE-MT-B'));
    console.log('Lote do Tenant B encontrado?', found ? 'SIM ❌' : 'NÃO ✅');
  });
```

---

## 🧪 CENÁRIO 5: AUDIT LOG - DELETE

### TC-AUDIT-LOT-01: Deleção de lote é auditada

**Dado que:**
- Existe um lote criado

**Quando:**
- Deleto o lote

**Então:**
- Audit log com action = DELETE deve ser criado

**Passos:**
1. Login como `admin@bidexpert.com`
2. Criar um lote temporário: `TESTE-DELETE Lote Temporário`
3. Anotar o ID do lote
4. Deletar o lote
5. Confirmar deleção

**Verificação no Banco:**
```sql
-- Substituir {LOT_ID}
SELECT 
  al.id,
  al.action,
  al.entityType,
  al.entityId,
  al.timestamp,
  u.email
FROM audit_logs al
INNER JOIN User u ON al.userId = u.id
WHERE al.entityType = 'Lot' 
  AND al.entityId = {LOT_ID}
  AND al.action = 'DELETE'
ORDER BY al.timestamp DESC;
```

**Esperado:**
- 1 registro com action = 'DELETE'

---

## 🧪 CENÁRIO 6: ISOLAMENTO DE ATIVOS

### TC-MT-ASSET-01: Ativos respeitam isolamento de tenant

**Passos:**
1. **[TENANT B]** Login como `user@tenant-b.com`
2. Criar ativo: `TESTE-MT-B Ativo Exclusivo`
3. **[LOGOUT]**
4. **[TENANT A]** Login como `admin@bidexpert.com`
5. Navegar para `/admin/assets`
6. **[VERIFICAR]** `TESTE-MT-B Ativo Exclusivo` NÃO aparece

---

## 🧪 CENÁRIO 7: AUDIT LOG - MUDANÇA DE STATUS

### TC-AUDIT-ASSET-01: Mudança de status de ativo é auditada

**Passos:**
1. Login como `admin@bidexpert.com`
2. Criar ativo com status `CADASTRO`
3. Anotar ID do ativo
4. Editar e mudar status para `DISPONIVEL`
5. Salvar

**Verificação no Banco:**
```sql
SELECT 
  al.action,
  al.changes,
  al.timestamp
FROM audit_logs al
WHERE al.entityType = 'Asset' 
  AND al.entityId = {ASSET_ID}
  AND al.action = 'UPDATE'
ORDER BY al.timestamp DESC
LIMIT 1;
```

**Esperado:**
- Campo `changes` contém mudança de status

---

## 🧪 CENÁRIO 8: ISOLAMENTO DE COMITENTES

### TC-MT-SELLER-01: Comitentes são isolados por tenant

**Passos:**
1. **[TENANT B]** Login como `user@tenant-b.com`
2. Criar comitente: `TESTE-MT-B Comitente Exclusivo`
3. **[LOGOUT]**
4. **[TENANT A]** Login como `admin@bidexpert.com`
5. Navegar para `/admin/sellers`
6. **[VERIFICAR]** Comitente do Tenant B NÃO aparece

---

## 🧪 CENÁRIO 9: AUDIT LOG - CRIAÇÃO DE COMITENTE

### TC-AUDIT-SELLER-01: Criação de comitente é auditada

**Passos:**
1. Login como `admin@bidexpert.com`
2. Criar comitente: `TESTE-AUDIT Comitente`
3. Anotar ID

**Verificação no Banco:**
```sql
SELECT * FROM audit_logs 
WHERE entityType = 'Seller' 
  AND entityId = {SELLER_ID}
  AND action = 'CREATE';
```

---

## 🧪 CENÁRIO 10: ISOLAMENTO DE LEILOEIROS

### TC-MT-AUCTIONEER-01: Leiloeiros respeitam isolamento

**Passos:**
1. **[TENANT B]** Criar leiloeiro: `TESTE-MT-B Leiloeiro Exclusivo`
2. **[TENANT A]** Login e verificar que não aparece

---

## 🧪 CENÁRIO 11: TENTATIVA DE ACESSO CRUZADO

### TC-CROSS-01: Acesso direto a recurso de outro tenant falha

**Passos:**
1. **[TENANT B]** Criar leilão e anotar ID
2. **[LOGOUT]**
3. **[TENANT A]** Login
4. Tentar acessar: `/admin/auctions/{ID_LEILAO_B}`
5. **[ESPERADO]** Erro ou redirecionamento

---

## 🧪 CENÁRIO 12: VISUALIZAÇÃO DO HISTÓRICO NA UI

### TC-UI-HISTORY-01: Change History Tab mostra alterações

**Passos:**
1. Login como `admin@bidexpert.com`
2. Criar leilão
3. Editar leilão (mudar título e descrição)
4. Clicar na aba "Change History" (Histórico de Alterações)
5. **[VERIFICAR]**:
   - Aparece log de CREATE
   - Aparece log de UPDATE
   - Mostra nome do usuário (admin@bidexpert.com)
   - Mostra data/hora
   - Mostra campos alterados

---

## 📊 TABELA DE VALIDAÇÃO

| ID | Cenário | Multi-Tenant | Audit Trail | Status |
|----|---------|--------------|-------------|---------|
| 01 | Leilões isolados | ✅ | - | ⏳ Pendente |
| 02 | Audit CREATE Auction | - | ✅ | ⏳ Pendente |
| 03 | Audit UPDATE c/ changes | - | ✅ | ⏳ Pendente |
| 04 | Lotes isolados | ✅ | - | ⏳ Pendente |
| 05 | Audit DELETE Lot | - | ✅ | ⏳ Pendente |
| 06 | Ativos isolados | ✅ | - | ⏳ Pendente |
| 07 | Audit UPDATE Asset | - | ✅ | ⏳ Pendente |
| 08 | Comitentes isolados | ✅ | - | ⏳ Pendente |
| 09 | Audit CREATE Seller | - | ✅ | ⏳ Pendente |
| 10 | Leiloeiros isolados | ✅ | - | ⏳ Pendente |
| 11 | Acesso cruzado bloqueado | ✅ | - | ⏳ Pendente |
| 12 | UI Change History | - | ✅ | ⏳ Pendente |

---

## 🎯 CHECKLIST DE EXECUÇÃO

Marque com [x] conforme executa:

### Preparação
- [ ] Servidor rodando (`npm start`)
- [ ] Seed executado
- [ ] Banco de dados acessível
- [ ] Browser aberto

### Multi-Tenant
- [ ] TC-MT-AUCTION-01 ✅
- [ ] TC-MT-LOT-01 ✅
- [ ] TC-MT-ASSET-01 ✅
- [ ] TC-MT-SELLER-01 ✅
- [ ] TC-MT-AUCTIONEER-01 ✅
- [ ] TC-CROSS-01 ✅

### Audit Trail
- [ ] TC-AUDIT-AUCTION-01 ✅
- [ ] TC-AUDIT-AUCTION-02 ✅
- [ ] TC-AUDIT-LOT-01 ✅
- [ ] TC-AUDIT-ASSET-01 ✅
- [ ] TC-AUDIT-SELLER-01 ✅
- [ ] TC-UI-HISTORY-01 ✅

---

## 📝 TEMPLATE DE REGISTRO DE BUGS

Se encontrar algum problema, registre assim:

**ID do Bug:** BUG-MT-XXX  
**Cenário:** TC-XXX  
**Descrição:** [O que aconteceu]  
**Esperado:** [O que deveria acontecer]  
**Steps to Reproduce:**  
1. [Passo 1]
2. [Passo 2]

**Screenshots:** [Anexar]  
**Console Logs:** [Copiar]  
**Query SQL:** [Se aplicável]  

---

## ✅ CRITÉRIOS DE ACEITAÇÃO

Para considerar o sistema APROVADO em Multi-Tenant + Audit Trail:

1. ✅ **100% dos testes de Multi-Tenant** devem passar
2. ✅ **100% dos testes de Audit Trail** devem passar
3. ✅ **0 bugs críticos** encontrados
4. ✅ **Change History UI** funcionando corretamente

---

**Criado por:** AI BidExpert  
**Versão:** 1.0  
**Data:** 26/11/2025
