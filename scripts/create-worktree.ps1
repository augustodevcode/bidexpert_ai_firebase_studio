<#
.SYNOPSIS
    Cria um Git Worktree isolado com branch dedicada e porta exclusiva para desenvolvimento paralelo.

.DESCRIPTION
    Automatiza o workflow de isolamento de desenvolvimento via Git Worktree:
    1. Atualiza a base demo-stable
    2. Cria branch + worktree DENTRO do workspace (worktrees/<nome>/)
    3. Configura porta no .env.local
    4. Executa npm install
    5. Opcionalmente inicia o servidor dev

    Cada worktree é criado dentro do diretório do projeto:
      worktrees/bidexpert-<tipo>-<descricao>/

    Isso garante que o VS Code trate o worktree como parte do workspace,
    permitindo que AI agents (Copilot, etc.) acessem seus arquivos.

    Portas reservadas:
      9005 = Humano/DEMO (principal)
      9006 = Agente AI #1 / Dev A
      9007 = Agente AI #2 / Dev B
      9008 = Hotfix / PR review
      9009+ = Extras

.PARAMETER Tipo
    Tipo da branch: feat, fix, hotfix, chore, docs, test. Padrão: feat

.PARAMETER Descricao
    Descrição curta da task (ex: auction-filter, login-bug). Obrigatório.

.PARAMETER Porta
    Porta de desenvolvimento. Se não informada, auto-detecta a próxima livre (9006-9015).

.PARAMETER Start
    Se presente, inicia o servidor dev (npm run dev) automaticamente após setup.

.PARAMETER NpmInstall
    Se $false, pula o npm install. Padrão: $true.

.EXAMPLE
    .\scripts\create-worktree.ps1 -Descricao auction-filter
    # Cria feat/auction-filter-20260301-1430 na porta auto-detectada

.EXAMPLE
    .\scripts\create-worktree.ps1 -Tipo fix -Descricao login-bug -Porta 9007 -Start
    # Cria fix/login-bug-20260301-1430 na porta 9007 e inicia o servidor

.EXAMPLE
    .\scripts\create-worktree.ps1 -Tipo hotfix -Descricao prod-urgente -Porta 9008
    # Cria hotfix/prod-urgente-20260301-1430 na porta 9008
#>

[CmdletBinding()]
param(
    [Parameter()]
    [ValidateSet("feat", "fix", "hotfix", "chore", "docs", "test")]
    [string]$Tipo = "feat",

    [Parameter(Mandatory = $true, HelpMessage = "Descrição curta da task (ex: auction-filter)")]
    [ValidatePattern("^[a-z0-9][a-z0-9-]*$")]
    [string]$Descricao,

    [Parameter()]
    [ValidateRange(9005, 9099)]
    [int]$Porta = 0,

    [Parameter()]
    [switch]$Start,

    [Parameter()]
    [bool]$NpmInstall = $true
)

$ErrorActionPreference = "Stop"

# ── Cores helpers ──
function Write-Step { param([string]$Msg) Write-Host "`n▸ $Msg" -ForegroundColor Cyan }
function Write-Ok   { param([string]$Msg) Write-Host "  ✅ $Msg" -ForegroundColor Green }
function Write-Warn { param([string]$Msg) Write-Host "  ⚠️  $Msg" -ForegroundColor Yellow }
function Write-Err  { param([string]$Msg) Write-Host "  ❌ $Msg" -ForegroundColor Red }

# ── Validação: estamos na raiz do repositório? ──
if (-not (Test-Path ".git")) {
    Write-Err "Execute este script na raiz do repositório (onde está o .git)"
    exit 1
}

# ── Auto-detectar porta livre ──
function Find-FreePort {
    $usedPorts = @()
    $netstat = netstat -ano 2>$null | Select-String ":90[0-9][0-9]\s" | ForEach-Object {
        if ($_ -match ":(\d+)\s") { [int]$Matches[1] }
    }
    $usedPorts = $netstat | Sort-Object -Unique

    for ($p = 9006; $p -le 9015; $p++) {
        if ($p -notin $usedPorts) { return $p }
    }
    Write-Err "Nenhuma porta livre entre 9006-9015. Especifique com -Porta."
    exit 1
}

if ($Porta -eq 0) {
    $Porta = Find-FreePort
    Write-Warn "Porta auto-detectada: $Porta"
}

# ── Verificar se a porta já está em uso ──
$portInUse = netstat -ano 2>$null | Select-String ":$Porta\s"
if ($portInUse) {
    Write-Err "Porta $Porta já está em uso! Escolha outra porta ou encerre o processo."
    Write-Host ($portInUse | Out-String) -ForegroundColor DarkGray
    exit 1
}

# ── Gerar nomes ──
$timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$branch    = "$Tipo/$Descricao-$timestamp"
$dirName   = "bidexpert-$Tipo-$Descricao"
$worktreesRoot = Join-Path $PWD "worktrees"
$dirPath   = Join-Path $worktreesRoot $dirName

# ── Verificar se worktree/dir já existe ──
if (Test-Path $dirPath) {
    Write-Err "Diretório já existe: $dirPath"
    Write-Host "  Use outro nome ou remova com: git worktree remove $dirPath" -ForegroundColor DarkGray
    exit 1
}

# ── Criar diretório worktrees/ se não existir ──
if (-not (Test-Path $worktreesRoot)) {
    New-Item -ItemType Directory -Path $worktreesRoot -Force | Out-Null
    Write-Ok "Diretório worktrees/ criado"
}

$existingWorktrees = git worktree list --porcelain 2>$null | Select-String "worktree $([regex]::Escape($dirPath))"
if ($existingWorktrees) {
    Write-Err "Worktree já registrado para: $dirPath"
    exit 1
}

# ── Step 1: Atualizar base ──
Write-Step "Atualizando demo-stable..."
git fetch origin demo-stable 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Warn "git fetch falhou — continuando com referência local"
}
Write-Ok "Base atualizada"

# ── Step 2: Criar worktree ──
Write-Step "Criando worktree: $dirPath"
Write-Host "  Branch: $branch" -ForegroundColor DarkCyan
Write-Host "  Base:   origin/demo-stable" -ForegroundColor DarkCyan

git worktree add $dirPath -b $branch origin/demo-stable
if ($LASTEXITCODE -ne 0) {
    Write-Err "Falha ao criar worktree"
    exit 1
}
Write-Ok "Worktree criado"

# ── Step 3: Configurar porta no .env.local ──
Write-Step "Configurando porta $Porta no .env.local..."
$envLocalPath = Join-Path $dirPath ".env.local"

if (Test-Path $envLocalPath) {
    $envContent = Get-Content $envLocalPath -Raw
} elseif (Test-Path (Join-Path $dirPath ".env.example")) {
    $envContent = Get-Content (Join-Path $dirPath ".env.example") -Raw
    Write-Warn "Usando .env.example como base"
} elseif (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    Write-Warn "Copiando .env.local do repositório principal"
} else {
    $envContent = ""
    Write-Warn "Nenhum .env encontrado — criando novo"
}

# Substituir ou adicionar PORT
if ($envContent -match "PORT=\d+") {
    $envContent = $envContent -replace "PORT=\d+", "PORT=$Porta"
} else {
    $envContent = $envContent.TrimEnd() + "`nPORT=$Porta`n"
}

Set-Content -Path $envLocalPath -Value $envContent -Encoding UTF8
Write-Ok "Porta $Porta configurada em .env.local"

# ── Step 4: npm install ──
if ($NpmInstall) {
    Write-Step "Executando npm install no worktree..."
    Push-Location $dirPath
    try {
        npm install 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Warn "npm install teve warnings (verifique manualmente)"
        } else {
            Write-Ok "npm install concluído"
        }
    } finally {
        Pop-Location
    }
} else {
    Write-Warn "npm install pulado (-NpmInstall `$false)"
}

# ── Resumo ──
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  🌲 Worktree pronto para uso!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  Diretório:  $dirPath" -ForegroundColor White
Write-Host "  Relativo:   worktrees\$dirName" -ForegroundColor White
Write-Host "  Branch:     $branch" -ForegroundColor White
Write-Host "  Porta:      $Porta" -ForegroundColor White
Write-Host "  URL Local:  http://dev.localhost:$Porta" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Próximos passos:" -ForegroundColor Yellow
Write-Host "    cd worktrees\$dirName" -ForegroundColor DarkGray
Write-Host "    `$env:PORT=$Porta ; npm run dev" -ForegroundColor DarkGray
Write-Host ""

# ── Step 5: Auto-start (opcional) ──
if ($Start) {
    Write-Step "Iniciando servidor dev na porta $Porta..."
    Set-Location $dirPath
    $env:PORT = $Porta
    npm run dev
}
