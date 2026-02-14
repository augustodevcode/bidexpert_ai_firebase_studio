# 🚀 SETUP RÁPIDO - Prisma Cloud DEMO Database

## Status Atual
✅ **SQL Dividido**: 3 arquivos na pasta `prisma_chunks/`  
✅ **Seed Pronto**: `scripts/ultimate-master-seed.ts` com 35 usuários de habilitação  
❌ **Schema Vazio**: Database online mas sem tabelas  

---

## 🎯 OPÇÃO 1: Vercel Deploy (AUTOMÁTICO - Recomendado)

### Vantagens
- ✅ Zero esforço manual
- ✅ Migrations rastreadas
- ✅ Rollback disponível
- ✅ Configuração permanente

### Passos

**1. Adicionar DATABASE_URL no Vercel**

```
Acesse: https://vercel.com/seu-projeto/settings/environment-variables

Variável: DATABASE_URL
Valor: postgres://1c998e66b185887460c8cb2dad77d45b51014931de4c10119b55274e0ae50e80:sk_geaZx-C8-_2lvXCV7HJoh@db.prisma.io:5432/postgres?sslmode=require
Ambiente: Production + Preview + Development
```

**2. Deploy**

```powershell
git add .
git commit -m "docs: update database setup"
git push origin demo-stable
```

**3. Verificar Build Log**

Procure por:
```
✔ Generated Prisma Client
✔ Running prisma migrate deploy
✔ Applied X migrations
```

**4. Validar no Console**

https://console.prisma.io/cml8s7faa039r2afnzcyvi4ea/cml8s8xcs0361ytfoaaxl6qer/cml8s8xcs0362ytfo9x0u8sz0/studio

Deve aparecer ~100 tabelas no sidebar esquerdo.

---

## 🎯 OPÇÃO 2: Console Manual (3 Chunks SQL)

### Quando Usar
- Sem acesso ao Vercel
- Quer controle total
- Teste rápido

### Passos

**1. Acessar Console SQL**

https://console.prisma.io/cml8s7faa039r2afnzcyvi4ea/cml8s8xcs0361ytfoaaxl6qer/cml8s8xcs0362ytfo9x0u8sz0/studio

Clique no ícone **"Query"** (SQL) no topo.

**2. Aplicar Chunk 1**

```powershell
# Abra o arquivo
code prisma_chunks\chunk_1_of_3.sql
```

- Copie TODO o conteúdo (Ctrl+A → Ctrl+C)
- Cole no console SQL (Ctrl+V)
- Clique **"Run"** ou Ctrl+Enter
- ✅ Aguarde "Query successful"

**3. Aplicar Chunk 2**

```powershell
code prisma_chunks\chunk_2_of_3.sql
```

- Repita: Copiar → Colar → Run → Aguardar sucesso

**4. Aplicar Chunk 3**

```powershell
code prisma_chunks\chunk_3_of_3.sql
```

- Repita: Copiar → Colar → Run → Aguardar sucesso

**5. Validar Schema**

Execute no console SQL:

```sql
SELECT COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

**Esperado**: ~100 tabelas

---

## 🌱 Executar SEED (Após Schema Aplicado)

### Pré-requisitos
✅ Schema aplicado (Opção 1 ou 2 acima)  
✅ Tabelas visíveis no Prisma Studio  

### Comando

```powershell
# 1. Garantir cliente PostgreSQL ativo
Copy-Item prisma/schema.postgresql.prisma prisma/schema.prisma -Force
npx prisma generate --no-engine

# 2. Executar seed via Accelerate
$env:DATABASE_URL='prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19nZWFaeC1DOC1fMmx2WENWN0hKb2giLCJhcGlfa2V5IjoiMDFLR05QWFYwUjU2UENSSkVDU1BNNU1HWEMiLCJ0ZW5hbnRfaWQiOiIxYzk5OGU2NmIxODU4ODc0NjBjOGNiMmRhZDc3ZDQ1YjUxMDE0OTMxZGU0YzEwMTE5YjU1Mjc0ZTBhZTUwZTgwIiwiaW50ZXJuYWxfc2VjcmV0IjoiOGRlMjQyMjEtMThjZi00OTlkLWIxM2MtOTYzYWU2MjViNGEzIn0.tcTocI9T13FSrSAST5J-PbCummT_ZepeRssridVpoeE'

npx tsx scripts/ultimate-master-seed.ts
```

### Output Esperado

```
🔍 Detectando tipo de banco...
✅ Detected: PostgreSQL
📋 DATABASE_URL: prisma+postgres://accelerate.prisma-data.net/...

👥 SEED HABILITAÇÕES - Grid de Documentos e Status
✅ 35 usuários com diferentes status de habilitação criados:
   - 5 com PENDING_DOCUMENTS (aguardando documentos)
   - 4 com PENDING_DOCUMENTS (aguardando reenvio após rejeição)
   - 8 com PENDING_ANALYSIS (em análise)
   - 4 com REJECTED_DOCUMENTS (documentos rejeitados)
   - 2 com BLOCKED (bloqueados)
   - 6 com HABILITADO (prontos para dar lances)
   - 3 com HABILITADO (deram lances - cenários de problema)
   - 3 Pessoas Jurídicas (status variados)

✅ SEED COMPLETO!
```

---

## ✅ Verificar Resultado

### Console Prisma Studio

https://console.prisma.io/.../studio

1. Clique em **"User"** no sidebar
2. Filtrar por emails contendo:
   - `@email.com` (pessoas físicas)
   - `@empresa.com.br` (pessoas jurídicas)
3. Verificar campos `habilitationStatus`

### Script de Verificação

```powershell
# Ver contagem por status
npx tsx scripts/check-habilitations.ts
```

**Output esperado**:
```
PENDING_DOCUMENTS: 9 usuários
PENDING_ANALYSIS: 8 usuários
REJECTED_DOCUMENTS: 4 usuários
BLOCKED: 2 usuários
HABILITADO: 9 usuários
```

### UI da Aplicação DEMO

Acesse: `https://seu-app.vercel.app/admin/habilitacoes`

Deve exibir grid com:
- Coluna **"Pendentes"**: 9 cards
- Coluna **"Em Análise"**: 8 cards
- Coluna **"Rejeitados"**: 4 cards (com motivos)
- Coluna **"Aprovados"**: 9 cards

---

## 🐛 Troubleshooting

### Erro: "Table UserDocument does not exist"
**Causa**: Schema não foi aplicado  
**Solução**: Executar Opção 1 ou 2 acima

### Erro: P6008 "Can't reach database"
**Causa**: Usando DATABASE_URL direta em vez de Accelerate  
**Solução**: Usar URL do Accelerate no seed: `prisma+postgres://accelerate.prisma-data.net/...`

### Erro: "Model userOnTenant not found"
**Causa**: Prisma Client MySQL ativo em vez de PostgreSQL  
**Solução**:
```powershell
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Copy-Item prisma/schema.postgresql.prisma prisma/schema.prisma -Force
Remove-Item node_modules\.prisma -Recurse -Force
npx prisma generate --no-engine
```

### Chunks SQL falhando no console
**Causa**: Chunk cortou statement SQL no meio  
**Solução**: Usar chunking por linhas (já implementado no script) ou Opção 1 (Vercel)

---

## 📞 Suporte

**Documentação Detalhada**: `SETUP_PRISMA_CLOUD_DEMO.md`  
**Logs de Build**: Vercel Dashboard → Deployment → Build Logs  
**Console Prisma**: https://console.prisma.io/  
**Verificação Local**: `npx tsx scripts/test-prisma-cloud.ts`  

---

## 🎉 Próximos Passos (Após Seed)

1. ✅ Testar UI de habilitações no DEMO
2. ✅ Validar drag-and-drop de status
3. ✅ Testar upload de documentos
4. ✅ Verificar notificações de rejeição
5. ✅ Revisar logs de aprovação
