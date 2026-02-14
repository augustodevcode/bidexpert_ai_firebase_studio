Write-Host ""
Write-Host "APLICAR SCHEMA NO PRISMA CLOUD - 3 CHUNKS" -ForegroundColor Cyan
Write-Host ""

$chunks = @(
    "prisma_chunks\chunk_1_of_3.sql",
    "prisma_chunks\chunk_2_of_3.sql",
    "prisma_chunks\chunk_3_of_3.sql"
)

Write-Host "INSTRUCOES:" -ForegroundColor Yellow
Write-Host "  1. Uma aba do navegador sera aberta no Console Prisma" -ForegroundColor White
Write-Host "  2. Para cada chunk, o conteudo sera copiado automaticamente" -ForegroundColor White
Write-Host "  3. Cole no console SQL (Ctrl+V) e clique Run" -ForegroundColor White
Write-Host ""

$consoleUrl = "https://console.prisma.io/cml8s7faa039r2afnzcyvi4ea/cml8s8xcs0361ytfoaaxl6qer/cml8s8xcs0362ytfo9x0u8sz0/studio"
Write-Host "Abrindo Console Prisma..." -ForegroundColor Cyan
Start-Process $consoleUrl
Start-Sleep -Seconds 3

for ($i = 0; $i -lt $chunks.Length; $i++) {
    $chunkFile = $chunks[$i]
    $chunkNum = $i + 1
    
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "CHUNK $chunkNum de 3: $chunkFile" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    
    if (!(Test-Path $chunkFile)) {
        Write-Host "Arquivo nao encontrado: $chunkFile" -ForegroundColor Red
        Write-Host ""
        continue
    }
    
    $content = Get-Content $chunkFile -Raw
    $lines = ($content -split "`n").Count
    $sizeKB = [math]::Round((Get-Item $chunkFile).Length / 1KB, 2)
    
    Write-Host "Tamanho: $sizeKB KB | Linhas: $lines" -ForegroundColor White
    
    $content | Set-Clipboard
    Write-Host "Copiado para CLIPBOARD!" -ForegroundColor Green
    
    code $chunkFile
    
    Write-Host ""
    Write-Host "ACOES NO CONSOLE PRISMA:" -ForegroundColor Yellow
    Write-Host "  1. Clique no icone Query (SQL) no topo" -ForegroundColor White
    Write-Host "  2. Cole o conteudo (Ctrl+V)" -ForegroundColor White
    Write-Host "  3. Clique Run ou pressione Ctrl+Enter" -ForegroundColor White
    Write-Host "  4. Aguarde Query successful" -ForegroundColor White
    
    if ($chunkNum -lt $chunks.Length) {
        Write-Host ""
        Write-Host "Pressione ENTER apos executar este chunk..." -ForegroundColor Magenta
        Read-Host
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "TODOS OS CHUNKS PROCESSADOS!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

Write-Host "VALIDACAO:" -ForegroundColor Cyan
Write-Host "  Execute no Console SQL:" -ForegroundColor White
Write-Host "  SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" -ForegroundColor Yellow
Write-Host ""

Write-Host "PROXIMO PASSO - EXECUTAR SEED:" -ForegroundColor Cyan
Write-Host "  Set DATABASE_URL e execute:" -ForegroundColor White
Write-Host "  npx tsx scripts/ultimate-master-seed.ts" -ForegroundColor Yellow
Write-Host ""
