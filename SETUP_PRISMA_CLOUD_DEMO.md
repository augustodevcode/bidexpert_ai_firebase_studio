# 🚀 Aplicar Schema no Prisma Cloud DEMO

## Contexto
- Banco: Prisma Cloud PostgreSQL (online, mas vazio)
- Schema: ~200KB (2893 linhas SQL)
- Console: https://console.prisma.io/cml8s7faa039r2afnzcyvi4ea/cml8s8xcs0361ytfoaaxl6qer/cml8s8xcs0362ytfo9x0u8sz0/studio

---

## ✅ MÉTODO 1: Via Vercel Environment Variable (Mais Fácil)

### 1. Configurar DATABASE_URL no Vercel
```bash
# Em: https://vercel.com/seu-projeto/settings/environment-variables

# Adicionar variável:
DATABASE_URL = postgres://1c998e66b185887460c8cb2dad77d45b51014931de4c10119b55274e0ae50e80:sk_geaZx-C8-_2lvXCV7HJoh@db.prisma.io:5432/postgres?sslmode=require
```

### 2. Fazer Deploy do Branch `demo-stable`
```powershell
git push origin demo-stable
```

### 3. Migrations Aplicadas Automaticamente
O Vercel executará `prisma migrate deploy` no build → Schema criado ✅

---

## 🔧 MÉTODO 2: Via Prisma Console SQL (Manual)

### 1. Dividir o SQL em Chunks Menores
```powershell
# No PowerShell local:
cd E:\SmartDataCorp\BidExpert\BidExpertVsCode\bidexpert_ai_firebase_studio

# Dividir em arquivos de 50KB
$content = Get-Content prisma_demo_schema.sql -Raw
$chunkSize = 50000
$chunks = [math]::Ceiling($content.Length / $chunkSize)

for ($i = 0; $i -lt $chunks; $i++) {
    $start = $i * $chunkSize
    $chunk = $content.Substring($start, [math]::Min($chunkSize, $content.Length - $start))
    $chunk | Out-File "prisma_chunk_$($i+1).sql" -Encoding UTF8
}

Write-Host "✅ $chunks arquivos criados: prisma_chunk_*.sql"
```

### 2. Aplicar Cada Chunk no Console
1. Abra: https://console.prisma.io/.../studio
2. Clique em "Query" (ícone SQL)
3. Cole conteúdo de `prisma_chunk_1.sql`
4. Execute
5. Repita para `prisma_chunk_2.sql`, etc.

---

## 🐳 MÉTODO 3: Via Conexão SSH Tunnel (Avançado)

### Pré-requisito
PostgreSQL client instalado (`psql`)

### Passos
```powershell
# 1. Criar arquivo .pgpass com senha
$pgpassContent = @"
db.prisma.io:5432:postgres:1c998e66b185887460c8cb2dad77d45b51014931de4c10119b55274e0ae50e80:sk_geaZx-C8-_2lvXCV7HJoh
"@
$pgpassContent | Out-File "$env:APPDATA\postgresql\pgpass.conf" -Encoding ASCII

# 2. Aplicar schema via psql
psql -h db.prisma.io -p 5432 `
  -U 1c998e66b185887460c8cb2dad77d45b51014931de4c10119b55274e0ae50e80 `
  -d postgres `
  -f prisma_demo_schema.sql
```

---

## 📝 EXECUTAR SEED APÓS SCHEMA CRIADO

Quando o schema estiver aplicado:

```powershell
# Regenerar Prisma Client PostgreSQL (se necessário)
Copy-Item prisma/schema.postgresql.prisma prisma/schema.prisma -Force
npx prisma generate --no-engine

# Executar seed via Accelerate
$env:DATABASE_URL='prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19nZWFaeC1DOC1fMmx2WENWN0hKb2giLCJhcGlfa2V5IjoiMDFLR05QWFYwUjU2UENSSkVDU1BNNU1HWEMiLCJ0ZW5hbnRfaWQiOiIxYzk5OGU2NmIxODU4ODc0NjBjOGNiMmRhZDc3ZDQ1YjUxMDE0OTMxZGU0YzEwMTE5YjU1Mjc0ZTBhZTUwZTgwIiwiaW50ZXJuYWxfc2VjcmV0IjoiOGRlMjQyMjEtMThjZi00OTlkLWIxM2MtOTYzYWU2MjViNGEzIn0.tcTocI9T13FSrSAST5J-PbCummT_ZepeRssridVpoeE'

npx tsx scripts/ultimate-master-seed.ts
```

---

## ⚡ RECOMENDAÇÃO

**MÉTODO 1** (Vercel Deploy) é o mais fácil e automático.  
Se não funcionar, usar **MÉTODO 2** (chunks manuais).
