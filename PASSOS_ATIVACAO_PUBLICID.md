# 🚀 Passos para Ativar PublicId com Máscaras

## ⚡ Ações Necessárias

### 1️⃣ Parar o Servidor de Desenvolvimento

**Por quê?** O Prisma Client precisa ser regenerado e o arquivo DLL está bloqueado pelo servidor em execução.

```bash
# Pressione Ctrl+C no terminal do servidor dev
# OU
# Se estiver usando PM2:
pm2 stop all
```

### 2️⃣ Gerar Cliente Prisma

```bash
cd e:\SmartDataCorp\BidExpert\BidExpertVsCode\bidexpert_ai_firebase_studio
npx prisma generate
```

**Esperado**: Mensagem de sucesso "Generated Prisma Client"

### 3️⃣ Criar Migração

```bash
# Tentar criar migração (pode falhar devido a restrição do shadow DB)
npx prisma migrate dev --name add_counter_state_for_public_id_masks
```

**Se falhar com erro de shadow DB**:
```bash
# Alternativa: Criar migração manualmente
mkdir -p prisma\migrations\20241121_add_counter_state
```

Criar arquivo `migration.sql`:
```sql
-- CreateTable
CREATE TABLE `CounterState` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenantId` BIGINT NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `currentValue` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CounterState_tenantId_idx`(`tenantId`),
    UNIQUE INDEX `CounterState_tenantId_entityType_key`(`tenantId`, `entityType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Depois execute:
```bash
# Aplicar migração manualmente
npx prisma db push
```

### 4️⃣ Executar Seed

```bash
npm run seed
```

**O que vai acontecer**:
- ✅ Criará `PlatformSettings` para o tenant
- ✅ Criará `IdMasks` com máscaras padrão
- ✅ Inicializará `CounterState` para todas as entidades

**Esperado**: Mensagens de sucesso no console

### 5️⃣ Verificar no Banco

```bash
# Abrir Prisma Studio
npx prisma studio
```

Verificar:
1. **IdMasks**: Deve ter 1 registro com todas as máscaras
2. **CounterState**: Deve ter 8 registros (um para cada entityType)
3. **PlatformSettings**: Deve ter configurações do tenant

### 6️⃣ Iniciar Servidor

```bash
npm run dev
```

### 7️⃣ Testar Funcionalidade

#### Teste 1: Criar Leilão
1. Acesse: http://localhost:3000/admin/auctions
2. Clique em "Novo Leilão"
3. Preencha os dados
4. Salve
5. **Verifique**: O publicId deve ser `AUC-2024-0001`

#### Teste 2: Criar Lote
1. Acesse: http://localhost:3000/admin/lots
2. Clique em "Novo Lote"
3. Preencha os dados
4. Salve
5. **Verifique**: O publicId deve ser `LOTE-2411-00001`

#### Teste 3: Verificar Logs
No console do servidor, procure por:
```
[PublicIdGenerator] Gerado publicId: AUC-2024-0001 para auction
[PublicIdGenerator] Gerado publicId: LOTE-2411-00001 para lot
```

## ✅ Checklist de Validação

- [ ] Servidor parado
- [ ] Prisma client gerado com sucesso
- [ ] Migração criada (CounterState existe no DB)
- [ ] Seed executado sem erros
- [ ] Tabela IdMasks contém máscaras padrão
- [ ] Tabela CounterState contém 8 registros
- [ ] Servidor iniciado sem erros
- [ ] Leilão criado com publicId no formato correto
- [ ] Lote criado com publicId no formato correto
- [ ] Logs de geração aparecem no console

## 🔧 Troubleshooting

### Erro: "CounterState does not exist"

**Causa**: Migração não foi executada

**Solução**:
```bash
npx prisma db push
npx prisma generate
```

### Erro: "EPERM: operation not permitted"

**Causa**: Servidor ainda rodando ou DLL bloqueada

**Solução**:
```bash
# Windows
taskkill /F /IM node.exe
# Aguardar 5 segundos
npx prisma generate
```

### Erro: "Cannot read property 'platformPublicIdMasks'"

**Causa**: Seed não foi executado

**Solução**:
```bash
npm run seed
```

### PublicId ainda é UUID

**Causa 1**: Máscaras não estão no banco

**Verificação**:
```sql
SELECT * FROM IdMasks;
```

**Se vazio, execute**:
```bash
npm run seed
```

**Causa 2**: Cache do Prisma desatualizado

**Solução**:
```bash
npx prisma generate
# Reiniciar servidor
```

## 📊 Verificação SQL

### Verificar Máscaras
```sql
SELECT 
  im.auctionCodeMask,
  im.lotCodeMask,
  im.sellerCodeMask,
  im.auctioneerCodeMask
FROM IdMasks im
JOIN PlatformSettings ps ON ps.id = im.platformSettingsId
WHERE ps.tenantId = 1;
```

**Esperado**:
```
AUC-{YYYY}-{####}
LOTE-{YY}{MM}-{#####}
COM-{YYYY}-{###}
LEILOE-{YYYY}-{###}
```

### Verificar Contadores
```sql
SELECT entityType, currentValue 
FROM CounterState 
WHERE tenantId = 1
ORDER BY entityType;
```

**Esperado**: 8 linhas (auction, lot, asset, auctioneer, seller, user, category, subcategory)

### Verificar Último PublicId Gerado
```sql
-- Leilões
SELECT id, publicId, title, createdAt 
FROM Auction 
WHERE tenantId = 1 
ORDER BY id DESC 
LIMIT 5;

-- Lotes
SELECT id, publicId, title, createdAt 
FROM Lot 
WHERE tenantId = 1 
ORDER BY id DESC 
LIMIT 5;
```

## 🎯 Próximos Passos

Após validação bem-sucedida:

1. ✅ Commit das alterações
```bash
git add .
git commit -m "feat: Implementa sistema de publicId com máscaras configuráveis"
git push
```

2. ✅ Testar em ambiente de staging (se houver)

3. ✅ Preparar para produção seguindo o guia completo em:
   `/IMPLEMENTACAO_PUBLICID_COMPLETA.md`

## 📚 Documentação

- **Implementação Completa**: `/IMPLEMENTACAO_PUBLICID_COMPLETA.md`
- **Guia Rápido**: `/context/QUICK_REFERENCE_PUBLIC_ID_MASKS.md`
- **Detalhes Técnicos**: `/context/IMPLEMENTACAO_PUBLIC_ID_MASKS.md`

## ✨ Resumo

Depois de executar todos os passos acima:

✅ Sistema de máscaras estará **100% funcional**  
✅ Novos leilões terão codes como `AUC-2024-0001`  
✅ Novos lotes terão codes como `LOTE-2411-00001`  
✅ Sistema funcionará automaticamente para todas as entidades  
✅ Fallback para UUID caso máscaras não estejam configuradas  

**Tempo estimado**: 10-15 minutos

---

**Última atualização**: 21 de Novembro de 2024
