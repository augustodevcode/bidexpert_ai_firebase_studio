# ============================================================================
# Script para dividir prisma_demo_schema.sql em chunks de 40KB
# para aplicar manualmente no Prisma Console
# ============================================================================

Write-Host "📄 Dividindo SQL em chunks...`n" -ForegroundColor Cyan

$sqlFile = "prisma_demo_schema.sql"
$chunkSizeKB = 40  # Tamanho seguro para console SQL
$chunkSizeBytes = $chunkSizeKB * 1024

if (!(Test-Path $sqlFile)) {
    Write-Host "❌ Arquivo não encontrado: $sqlFile" -ForegroundColor Red
    Write-Host "   Execute primeiro: npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.postgresql.prisma --script > prisma_demo_schema.sql`n" -ForegroundColor Yellow
    exit 1
}

$content = Get-Content $sqlFile -Raw
$totalSize = $content.Length
$chunks = [math]::Ceiling($totalSize / $chunkSizeBytes)

Write-Host "📊 Tamanho total: $([math]::Round($totalSize / 1KB, 2)) KB" -ForegroundColor White
Write-Host "🔢 Chunks necessários: $chunks (${chunkSizeKB}KB cada)`n" -ForegroundColor White

# Criar pasta para chunks
$chunksDir = "prisma_chunks"
if (Test-Path $chunksDir) {
    Remove-Item $chunksDir -Recurse -Force
}
New-Item -ItemType Directory -Path $chunksDir | Out-Null

# Dividir por linhas (melhor que por bytes para não quebrar statements)
$lines = Get-Content $sqlFile
$linesPerChunk = [math]::Ceiling($lines.Count / $chunks)

for ($i = 0; $i -lt $chunks; $i++) {
    $start = $i * $linesPerChunk
    $end = [math]::Min(($start + $linesPerChunk - 1), ($lines.Count - 1))
    $chunkLines = $lines[$start..$end]
    $chunkFile = "$chunksDir\chunk_$($i+1)_of_$chunks.sql"
    
    $chunkLines | Out-File $chunkFile -Encoding UTF8
    
    $chunkSize = (Get-Item $chunkFile).Length / 1KB
    Write-Host "✅ Criado: chunk_$($i+1)_of_$chunks.sql ($([math]::Round($chunkSize, 2)) KB)" -ForegroundColor Green
}

Write-Host "`n📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "   1. Acesse: https://console.prisma.io/.../studio" -ForegroundColor White
Write-Host "   2. Clique em 'Query' (ícone SQL no topo)" -ForegroundColor White
Write-Host "   3. Aplique cada chunk EM ORDEM:" -ForegroundColor White

for ($i = 1; $i -le $chunks; $i++) {
    Write-Host "      - Abra: $chunksDir\chunk_${i}_of_${chunks}.sql" -ForegroundColor Yellow
    Write-Host "        Cole no console SQL e execute" -ForegroundColor Yellow
}

Write-Host "`n💡 Dica: Use Ctrl+A → Ctrl+C para copiar todo o arquivo" -ForegroundColor Magenta
Write-Host "         Cole no console com Ctrl+V e clique 'Run'`n" -ForegroundColor Magenta

# Criar arquivo README no diretório de chunks
$readme = @"
# Aplicar Schema no Prisma Cloud - Chunks SQL

## Ordem de Aplicação (IMPORTANTE!)

Execute os arquivos NA ORDEM NUMÉRICA no console SQL do Prisma Cloud:

"@

for ($i = 1; $i -le $chunks; $i++) {
    $readme += "`n$i. chunk_${i}_of_${chunks}.sql"
}

$readme += @"


## Como Aplicar

1. Acesse: https://console.prisma.io/cml8s7faa039r2afnzcyvi4ea/cml8s8xcs0361ytfoaaxl6qer/cml8s8xcs0362ytfo9x0u8sz0/studio

2. Clique no ícone "Query" (SQL) no topo da página

3. Para cada chunk:
   - Abra o arquivo .sql
   - Copie TODO o conteúdo (Ctrl+A → Ctrl+C)
   - Cole no console SQL (Ctrl+V)
   - Clique em "Run" ou pressione Ctrl+Enter
   - Aguarde confirmação de sucesso
   - Próximo chunk

## Validação

Após aplicar todos os chunks, execute no console SQL:

```sql
SELECT COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Resultado esperado: ~100 tabelas
"@

$readme | Out-File "$chunksDir\README.md" -Encoding UTF8

Write-Host "✅ Arquivo de instruções criado: $chunksDir\README.md`n" -ForegroundColor Green
