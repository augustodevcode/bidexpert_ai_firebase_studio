<#
.SYNOPSIS
    Remove um Git Worktree e opcionalmente deleta a branch associada.

.DESCRIPTION
    Cleanup seguro de worktrees:
    1. Para processos Node rodando no diretório do worktree
    2. Remove o worktree via git worktree remove
    3. Opcionalmente deleta a branch local
    4. Opcionalmente deleta a branch remota

.PARAMETER Dir
    Nome do diretório do worktree (ex: bidexpert-feat-auction-filter).
    Se não especificado, lista os worktrees ativos para escolha interativa.

.PARAMETER DeleteBranch
    Se presente, deleta a branch local associada ao worktree após remoção.

.PARAMETER DeleteRemote
    Se presente, deleta também a branch remota (origin).

.PARAMETER Force
    Se presente, força a remoção mesmo com alterações não commitadas.

.EXAMPLE
    .\scripts\remove-worktree.ps1
    # Lista worktrees e permite escolher qual remover

.EXAMPLE
    .\scripts\remove-worktree.ps1 -Dir bidexpert-feat-auction-filter -DeleteBranch
    # Remove worktree e branch local

.EXAMPLE
    .\scripts\remove-worktree.ps1 -Dir bidexpert-feat-auction-filter -DeleteBranch -DeleteRemote
    # Remove worktree, branch local e remota
#>

[CmdletBinding()]
param(
    [Parameter()]
    [string]$Dir,

    [Parameter()]
    [switch]$DeleteBranch,

    [Parameter()]
    [switch]$DeleteRemote,

    [Parameter()]
    [switch]$Force
)

$ErrorActionPreference = "Stop"

function Write-Step { param([string]$Msg) Write-Host "`n▸ $Msg" -ForegroundColor Cyan }
function Write-Ok   { param([string]$Msg) Write-Host "  ✅ $Msg" -ForegroundColor Green }
function Write-Warn { param([string]$Msg) Write-Host "  ⚠️  $Msg" -ForegroundColor Yellow }
function Write-Err  { param([string]$Msg) Write-Host "  ❌ $Msg" -ForegroundColor Red }

# ── Listar worktrees se Dir não especificado ──
if (-not $Dir) {
    Write-Host "`nWorktrees ativos:" -ForegroundColor Cyan
    $worktrees = git worktree list 2>$null
    Write-Host ($worktrees | Out-String)

    $parentDir = Split-Path $PWD -Parent
    $candidates = $worktrees | Where-Object { $_ -match [regex]::Escape($parentDir) -and $_ -notmatch [regex]::Escape($PWD) } | ForEach-Object {
        ($_ -split "\s+")[0] | Split-Path -Leaf
    }

    if (-not $candidates -or $candidates.Count -eq 0) {
        Write-Warn "Nenhum worktree auxiliar encontrado."
        exit 0
    }

    Write-Host "Worktrees removíveis:" -ForegroundColor Yellow
    $i = 1
    $candidates | ForEach-Object {
        Write-Host "  [$i] $_" -ForegroundColor White
        $i++
    }

    $choice = Read-Host "Escolha o número do worktree para remover (0 para cancelar)"
    if ($choice -eq "0" -or -not $choice) { exit 0 }

    $idx = [int]$choice - 1
    if ($idx -lt 0 -or $idx -ge $candidates.Count) {
        Write-Err "Opção inválida"
        exit 1
    }
    $Dir = $candidates[$idx]
}

$dirPath = Join-Path (Split-Path $PWD -Parent) $Dir

if (-not (Test-Path $dirPath)) {
    Write-Err "Diretório não encontrado: $dirPath"
    exit 1
}

# ── Detectar branch do worktree ──
$branchName = $null
$worktreeInfo = git worktree list --porcelain 2>$null
$foundWorktree = $false
foreach ($line in $worktreeInfo) {
    if ($line -match "worktree\s+$([regex]::Escape($dirPath))") {
        $foundWorktree = $true
    }
    if ($foundWorktree -and $line -match "^branch\s+refs/heads/(.+)") {
        $branchName = $Matches[1]
        break
    }
    if ($foundWorktree -and $line -eq "") {
        break
    }
}

Write-Step "Removendo worktree: $dirPath"
if ($branchName) { Write-Host "  Branch associada: $branchName" -ForegroundColor DarkCyan }

# ── Parar processos Node no diretório ──
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    try { $_.MainModule.FileName -like "*$Dir*" } catch { $false }
}
if ($nodeProcesses) {
    Write-Warn "Parando processos Node no worktree..."
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
}

# ── Remover worktree ──
if ($Force) {
    git worktree remove $dirPath --force
} else {
    git worktree remove $dirPath
}

if ($LASTEXITCODE -ne 0) {
    Write-Err "Falha ao remover worktree. Use -Force para forçar."
    exit 1
}
Write-Ok "Worktree removido"

# ── Limpar referências de worktree ──
git worktree prune 2>$null

# ── Deletar branch local ──
if ($DeleteBranch -and $branchName) {
    Write-Step "Deletando branch local: $branchName"
    git branch -d $branchName 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "Branch não merged. Usando -D para forçar..."
        git branch -D $branchName
    }
    Write-Ok "Branch local deletada"
}

# ── Deletar branch remota ──
if ($DeleteRemote -and $branchName) {
    Write-Step "Deletando branch remota: origin/$branchName"
    git push origin --delete $branchName 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Branch remota deletada"
    } else {
        Write-Warn "Branch remota não encontrada ou já deletada"
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  🧹 Cleanup concluído!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
