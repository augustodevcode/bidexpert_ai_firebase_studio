<#
.SYNOPSIS
    Bootstrap de ambiente containerizado isolado por desenvolvedor - BidExpert
.DESCRIPTION
    Cria e inicializa um container Docker isolado para um dev, com base própria,
    portas dedicadas e Playwright pré-instalado para testes obrigatórios.
.PARAMETER DevId
    Identificador único do desenvolvedor (ex: augusto, maria, joao)
.PARAMETER DevNumber
    Número sequencial do dev para cálculo de portas (1-99)
.PARAMETER Branch
    Branch a ser usada no container (default: main)
.PARAMETER Action
    Ação: up, down, status, test, logs (default: up)
.EXAMPLE
    .\scripts\ci-cd\dev-container-bootstrap.ps1 -DevId augusto -DevNumber 1 -Action up
    .\scripts\ci-cd\dev-container-bootstrap.ps1 -DevId augusto -DevNumber 1 -Action test
    .\scripts\ci-cd\dev-container-bootstrap.ps1 -DevId augusto -DevNumber 1 -Action status
    .\scripts\ci-cd\dev-container-bootstrap.ps1 -DevId augusto -DevNumber 1 -Action down
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$DevId,
    
    [Parameter(Mandatory=$true)]
    [ValidateRange(1, 99)]
    [int]$DevNumber,

    [string]$Branch = "main",
    
    [ValidateSet("up", "down", "status", "test", "logs", "seed", "migrate")]
    [string]$Action = "up"
)

$ErrorActionPreference = "Stop"

# ============================================================
# Cálculo de portas baseado no DevNumber
# ============================================================
$AppPort  = 9100 + $DevNumber   # App: 9101, 9102, ...
$DbPort   = 3400 + $DevNumber   # MySQL: 3401, 3402, ...
$MailPort  = 8200 + $DevNumber   # SMTP4Dev: 8201, 8202, ...
$SmtpPort  = 2600 + $DevNumber   # SMTP: 2601, 2602, ...

$ProjectName = "bidexpert-$DevId"
$ComposeFile = "docker-compose.dev-isolated.yml"
$EnvFile = ".env.dev.$DevId"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " BidExpert - Container Isolado: $DevId (Dev #$DevNumber)" -ForegroundColor Cyan
Write-Host " Action: $Action" -ForegroundColor Cyan
Write-Host " App: http://localhost:$AppPort | DB: localhost:$DbPort" -ForegroundColor Cyan
Write-Host " Mail: http://localhost:$MailPort | Branch: $Branch" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# Criar env file se não existir
if (-not (Test-Path $EnvFile)) {
    Write-Host "[INFO] Criando $EnvFile..." -ForegroundColor Yellow
    @"
DEV_ID=$DevId
APP_PORT=$AppPort
DB_PORT=$DbPort
MAIL_PORT=$MailPort
SMTP_PORT=$SmtpPort
MYSQL_ROOT_PASSWORD=DevPassword2026
MYSQL_DATABASE=bidexpert_$DevId
NODE_ENV=development
TENANT_SLUG=dev
GIT_BRANCH=$Branch
"@ | Out-File -FilePath $EnvFile -Encoding utf8
}

switch ($Action) {
    "up" {
        Write-Host "`n[1/4] Verificando conflitos de porta..." -ForegroundColor Yellow
        $portConflict = netstat -ano | Select-String ":$AppPort\s" | Select-Object -First 1
        if ($portConflict) {
            Write-Host "[WARN] Porta $AppPort já em uso! Verifique:" -ForegroundColor Red
            Write-Host $portConflict -ForegroundColor Red
            Write-Host "Use um DevNumber diferente ou pare o processo conflitante." -ForegroundColor Red
            exit 1
        }

        Write-Host "[2/4] Construindo containers..." -ForegroundColor Yellow
        docker compose -f $ComposeFile --env-file $EnvFile -p $ProjectName build --no-cache 2>&1

        Write-Host "[3/4] Subindo stack isolada..." -ForegroundColor Yellow
        docker compose -f $ComposeFile --env-file $EnvFile -p $ProjectName up -d 2>&1

        Write-Host "[4/4] Aguardando health check..." -ForegroundColor Yellow
        $maxRetries = 30
        $retry = 0
        do {
            Start-Sleep -Seconds 5
            $retry++
            $health = docker compose -f $ComposeFile --env-file $EnvFile -p $ProjectName ps --format json 2>&1 | 
                ConvertFrom-Json -ErrorAction SilentlyContinue
            $allHealthy = ($health | Where-Object { $_.State -eq "running" }).Count -ge 2
            Write-Host "  Tentativa $retry/$maxRetries - Containers rodando: $(($health | Where-Object { $_.State -eq 'running' }).Count)" -ForegroundColor Gray
        } while (-not $allHealthy -and $retry -lt $maxRetries)

        if ($allHealthy) {
            Write-Host "`n[OK] Stack pronta!" -ForegroundColor Green
            Write-Host "  App:    http://localhost:$AppPort" -ForegroundColor Green
            Write-Host "  DB:     localhost:$DbPort" -ForegroundColor Green
            Write-Host "  Mail:   http://localhost:$MailPort" -ForegroundColor Green
            
            # Registrar na fila de coordenação
            $timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
            Write-Host "`n[INFO] Registre sua feature em .coordination/queue.yaml" -ForegroundColor Yellow
        } else {
            Write-Host "`n[ERRO] Timeout aguardando containers. Verifique logs:" -ForegroundColor Red
            Write-Host "  docker compose -f $ComposeFile -p $ProjectName logs" -ForegroundColor Red
            exit 1
        }
    }

    "down" {
        Write-Host "Parando stack $ProjectName..." -ForegroundColor Yellow
        docker compose -f $ComposeFile --env-file $EnvFile -p $ProjectName down 2>&1
        Write-Host "[OK] Stack parada." -ForegroundColor Green
    }

    "status" {
        Write-Host "Status da stack $ProjectName:" -ForegroundColor Yellow
        docker compose -f $ComposeFile --env-file $EnvFile -p $ProjectName ps 2>&1
        Write-Host ""
        Write-Host "Portas ativas:" -ForegroundColor Yellow
        netstat -ano | Select-String ":($AppPort|$DbPort|$MailPort)\s"
    }

    "test" {
        Write-Host "`n[TEST] Executando Playwright smoke no container $ProjectName..." -ForegroundColor Yellow
        
        # Rodar testes dentro do container
        docker compose -f $ComposeFile --env-file $EnvFile -p $ProjectName exec app `
            npx playwright test tests/e2e/smoke-test.spec.ts `
            --config=playwright.smoke.config.ts `
            --reporter=list,html 2>&1

        $testExitCode = $LASTEXITCODE

        # Copiar relatório para host
        $reportDir = ".coordination/reports/$DevId"
        if (-not (Test-Path $reportDir)) {
            New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
        }

        $containerId = docker compose -f $ComposeFile --env-file $EnvFile -p $ProjectName ps -q app 2>&1
        if ($containerId) {
            docker cp "${containerId}:/app/playwright-report" "$reportDir/playwright-report-$(Get-Date -Format 'yyyyMMdd-HHmmss')" 2>&1
            docker cp "${containerId}:/app/test-results" "$reportDir/test-results-$(Get-Date -Format 'yyyyMMdd-HHmmss')" 2>&1
        }

        if ($testExitCode -eq 0) {
            Write-Host "`n[OK] Testes passaram! Relatório em $reportDir" -ForegroundColor Green
        } else {
            Write-Host "`n[FAIL] Testes falharam (exit code: $testExitCode). Relatório em $reportDir" -ForegroundColor Red
            exit $testExitCode
        }
    }

    "logs" {
        docker compose -f $ComposeFile --env-file $EnvFile -p $ProjectName logs -f --tail=100 2>&1
    }

    "seed" {
        Write-Host "Executando seed no container $ProjectName..." -ForegroundColor Yellow
        docker compose -f $ComposeFile --env-file $EnvFile -p $ProjectName exec app `
            npx tsx scripts/seed-master-data.ts 2>&1
    }

    "migrate" {
        Write-Host "Executando migration no container $ProjectName..." -ForegroundColor Yellow
        docker compose -f $ComposeFile --env-file $EnvFile -p $ProjectName exec app `
            npx prisma db push 2>&1
    }
}
