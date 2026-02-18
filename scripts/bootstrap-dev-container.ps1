# ============================================================
# bootstrap-dev-container.ps1 - Script de bootstrap para novo dev
# ============================================================
# USO: .\scripts\bootstrap-dev-container.ps1 -DevId "augusto" -AppPort 9102 -DbPort 3402 -MailPort 8202
# ============================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$DevId,
    
    [int]$AppPort = 9101,
    [int]$DbPort = 3401,
    [int]$MailPort = 8201,
    [int]$SmtpPort = 2601
)

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " BidExpert - Dev Container Bootstrap" -ForegroundColor Cyan
Write-Host " Dev: $DevId" -ForegroundColor Green
Write-Host " App Port: $AppPort" -ForegroundColor Green
Write-Host " DB Port: $DbPort" -ForegroundColor Green
Write-Host " Mail Port: $MailPort" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan

# 1. Verificar portas disponíveis
Write-Host "`n[1/7] Verificando portas..." -ForegroundColor Yellow
$ports = @($AppPort, $DbPort, $MailPort, $SmtpPort)
foreach ($port in $ports) {
    $inUse = netstat -ano | Select-String ":$port " | Select-String "LISTENING"
    if ($inUse) {
        Write-Host "  ERRO: Porta $port já em uso!" -ForegroundColor Red
        Write-Host "  Escolha outra porta ou encerre o processo." -ForegroundColor Red
        exit 1
    }
    Write-Host "  Porta $port disponível" -ForegroundColor Green
}

# 2. Criar branch
Write-Host "`n[2/7] Criando branch de trabalho..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$branchName = "dev/$DevId-$timestamp"
git fetch origin main 2>$null
git checkout main 2>$null
git pull origin main 2>$null
git checkout -b $branchName
Write-Host "  Branch: $branchName" -ForegroundColor Green

# 3. Criar env file
Write-Host "`n[3/7] Criando arquivo de ambiente (.env.dev.$DevId)..." -ForegroundColor Yellow
$envContent = @"
DEV_ID=$DevId
APP_PORT=$AppPort
DB_PORT=$DbPort
MAIL_PORT=$MailPort
SMTP_PORT=$SmtpPort
MYSQL_ROOT_PASSWORD=DevPassword2026
MYSQL_DATABASE=bidexpert_dev
"@
$envContent | Out-File -FilePath ".env.dev.$DevId" -Encoding utf8 -Force
Write-Host "  Arquivo .env.dev.$DevId criado" -ForegroundColor Green

# 4. Criar flag de coordenação
Write-Host "`n[4/7] Registrando na fila de coordenação..." -ForegroundColor Yellow
$flagDir = ".coordination/flags"
if (!(Test-Path $flagDir)) { New-Item -ItemType Directory -Path $flagDir -Force | Out-Null }
$flagContent = @"
branch: $branchName
dev_id: $DevId
status: in_progress
started_at: $(Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
port: $AppPort
areas: []
playwright_evidence: null
"@
$flagContent | Out-File -FilePath "$flagDir/$branchName.yaml".Replace("/", "-") -Encoding utf8 -Force
Write-Host "  Flag criado em $flagDir/" -ForegroundColor Green

# 5. Iniciar containers
Write-Host "`n[5/7] Iniciando containers Docker..." -ForegroundColor Yellow
$env:DEV_ID = $DevId
$env:APP_PORT = $AppPort
$env:DB_PORT = $DbPort
$env:MAIL_PORT = $MailPort
$env:SMTP_PORT = $SmtpPort

docker compose -f docker-compose.dev-isolated.yml -p "bidexpert-$DevId" up -d --build 2>&1 | Out-Null
Write-Host "  Containers iniciados com projeto 'bidexpert-$DevId'" -ForegroundColor Green

# 6. Aguardar app ficar pronta + seed automatico
Write-Host "`n[6/7] Aguardando app ficar pronta e executando seed..." -ForegroundColor Yellow
$maxRetries = 30
$retry = 0
while ($retry -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "http://demo.localhost:$AppPort/api/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -lt 500) {
            Write-Host "  App respondendo na porta $AppPort (status: $($response.StatusCode))" -ForegroundColor Green
            break
        }
    } catch {}
    $retry++
    Write-Host "  Tentativa $retry/$maxRetries..." -ForegroundColor Gray
    Start-Sleep 10
}

if ($retry -eq $maxRetries) {
    Write-Host "  AVISO: App ainda não responde. Verifique logs com:" -ForegroundColor Yellow
    Write-Host "  docker logs bidexpert-$DevId-app-1 --tail 20" -ForegroundColor White
} else {
    # Rodar seed se tabelas estiverem vazias
    Write-Host "  Verificando se seed é necessário..." -ForegroundColor Gray
    docker exec "bidexpert-$DevId-app-1" npx tsx scripts/ultimate-master-seed.ts 2>&1 | Select-Object -Last 5
    Write-Host "  Seed executado" -ForegroundColor Green
}

# 7. Resumo
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host " Bootstrap COMPLETO!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " Branch:    $branchName" -ForegroundColor White
Write-Host " App:       http://demo.localhost:$AppPort" -ForegroundColor White
Write-Host " DB:        localhost:$DbPort" -ForegroundColor White
Write-Host " Mail UI:   http://localhost:$MailPort" -ForegroundColor White
Write-Host ""
Write-Host " Comandos uteis:" -ForegroundColor Yellow
Write-Host "   docker logs bidexpert-$DevId-app-1 -f" -ForegroundColor Gray
Write-Host "   docker exec bidexpert-$DevId-app-1 bash scripts/run-tests-in-container.sh smoke" -ForegroundColor Gray
Write-Host "   docker compose -f docker-compose.dev-isolated.yml -p bidexpert-$DevId down" -ForegroundColor Gray
Write-Host ""
