<#
.SYNOPSIS
    Launcher detached para o Data Reconciliation Auditor.
    Executa o audit script como processo background desconectado do terminal.

.DESCRIPTION
    Este script cria um processo Node.js completamente desvinculado do terminal
    que o lançou, usando WScript.Shell COM Object para rodar sem janela visível.
    Ideal para execução via cron ou Task Scheduler.

.PARAMETER Mode
    Modo de execução: 'once' (padrão) ou 'daemon' (loop com intervalo).

.PARAMETER IntervalMinutes
    Intervalo entre execuções no modo daemon. Padrão: 45 minutos.

.PARAMETER BaseUrl
    URL base da aplicação. Padrão: http://demo.localhost:9005

.PARAMETER TenantSlug
    Slug do tenant para auditoria. Padrão: demo

.PARAMETER Verbose
    Ativa modo verbose com logs detalhados.

.EXAMPLE
    .\run-reconciliation-detached.ps1
    .\run-reconciliation-detached.ps1 -Mode daemon -IntervalMinutes 30
    .\run-reconciliation-detached.ps1 -BaseUrl "http://dev.localhost:9006" -TenantSlug dev

.NOTES
    Parte do Data Reconciliation Auditor Agent do BidExpert.
    Logs são salvos em reports/reconciliation/audit-daemon.log
#>

param(
    [ValidateSet('once', 'daemon')]
    [string]$Mode = 'once',

    [int]$IntervalMinutes = 45,

    [string]$BaseUrl = 'http://demo.localhost:9005',

    [string]$TenantSlug = 'demo',

    [switch]$Verbose,

    [int]$MaxAuctions = 5
)

# ─── Configuração ───
$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not (Test-Path $ProjectRoot)) {
    $ProjectRoot = Get-Location
}

$ScriptPath = Join-Path $ProjectRoot 'scripts' 'reconciliation' 'background-audit.mjs'
$ReportsDir = Join-Path $ProjectRoot 'reports' 'reconciliation'
$LogFile = Join-Path $ReportsDir 'audit-daemon.log'
$PidFile = Join-Path $ReportsDir 'audit-daemon.pid'

# ─── Funções Auxiliares ───
function Write-AuditLog {
    param([string]$Message, [string]$Level = 'INFO')
    $timestamp = Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.fffZ'
    $line = "[$timestamp] [$Level] $Message"
    Write-Host $line
    if (Test-Path (Split-Path $LogFile -Parent)) {
        Add-Content -Path $LogFile -Value $line -Encoding UTF8
    }
}

function Test-AppRunning {
    param([string]$Url)
    try {
        $response = Invoke-WebRequest -Uri "$Url" -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Get-FreePort {
    $ports = @(9005, 9006, 9007, 9008)
    foreach ($port in $ports) {
        $inUse = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if (-not $inUse) { return $port }
    }
    return $null
}

# ─── Garantir diretórios ───
if (-not (Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
    Write-AuditLog "Diretório criado: $ReportsDir"
}

# ─── Verificar pré-requisitos ───
Write-AuditLog "=== Data Reconciliation Launcher ===" 'INFO'
Write-AuditLog "Modo: $Mode" 'INFO'
Write-AuditLog "ProjectRoot: $ProjectRoot" 'INFO'
Write-AuditLog "BaseUrl: $BaseUrl" 'INFO'
Write-AuditLog "TenantSlug: $TenantSlug" 'INFO'

if (-not (Test-Path $ScriptPath)) {
    Write-AuditLog "ERRO: Script de auditoria não encontrado: $ScriptPath" 'ERROR'
    exit 1
}

# ─── Variáveis de Ambiente ───
$env:RECONCILIATION_BASE_URL = $BaseUrl
$env:RECONCILIATION_TENANT = $TenantSlug
$env:RECONCILIATION_MAX_AUCTIONS = $MaxAuctions
$env:RECONCILIATION_VERBOSE = if ($Verbose) { 'true' } else { 'false' }

# ─── Execução ───
if ($Mode -eq 'once') {
    Write-AuditLog "Executando auditoria única..."

    try {
        $process = Start-Process -FilePath 'node' `
            -ArgumentList $ScriptPath `
            -WorkingDirectory $ProjectRoot `
            -NoNewWindow `
            -PassThru `
            -RedirectStandardOutput (Join-Path $ReportsDir 'audit-stdout.log') `
            -RedirectStandardError (Join-Path $ReportsDir 'audit-stderr.log')

        $process.WaitForExit(120000)  # Timeout de 2 minutos

        if ($process.ExitCode -eq 0) {
            Write-AuditLog "Auditoria concluída com sucesso." 'INFO'
        } else {
            Write-AuditLog "Auditoria encerrou com código: $($process.ExitCode)" 'WARN'
        }
    } catch {
        Write-AuditLog "Erro ao executar auditoria: $_" 'ERROR'
    }
}
elseif ($Mode -eq 'daemon') {
    Write-AuditLog "Iniciando modo daemon (intervalo: ${IntervalMinutes}min)..."

    # Salvar PID para controle
    $currentPid = $PID
    Set-Content -Path $PidFile -Value $currentPid
    Write-AuditLog "PID do daemon: $currentPid (salvo em $PidFile)"

    # Loop infinito com intervalo
    $iteration = 0
    while ($true) {
        $iteration++
        Write-AuditLog "--- Iteração #$iteration ---"

        # Verificar se a aplicação está acessível antes de auditar
        if (Test-AppRunning -Url $BaseUrl) {
            Write-AuditLog "App acessível em $BaseUrl. Iniciando auditoria..."

            try {
                $process = Start-Process -FilePath 'node' `
                    -ArgumentList $ScriptPath `
                    -WorkingDirectory $ProjectRoot `
                    -NoNewWindow `
                    -PassThru `
                    -RedirectStandardOutput (Join-Path $ReportsDir "audit-stdout-$iteration.log") `
                    -RedirectStandardError (Join-Path $ReportsDir "audit-stderr-$iteration.log")

                $process.WaitForExit(300000)  # Timeout 5 minutos

                Write-AuditLog "Auditoria #$iteration concluída (código: $($process.ExitCode))"
            } catch {
                Write-AuditLog "Erro na iteração #${iteration}: $_" 'ERROR'
            }
        } else {
            Write-AuditLog "App não acessível em $BaseUrl. Pulando esta iteração." 'WARN'
        }

        Write-AuditLog "Próxima execução em ${IntervalMinutes} minutos..."
        Start-Sleep -Seconds ($IntervalMinutes * 60)
    }
}

Write-AuditLog "=== Launcher finalizado ==="
