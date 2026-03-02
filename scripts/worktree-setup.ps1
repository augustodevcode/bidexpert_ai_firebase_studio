<#
.SYNOPSIS
    Gerenciador de Git Worktrees para BidExpert (PowerShell).

.DESCRIPTION
    Permite que múltiplos desenvolvedores/agentes AI trabalhem em paralelo
    com branches e portas de desenvolvimento isoladas, usando git worktrees.

.PARAMETER Command
    Ação a executar: add | list | remove | prune

.PARAMETER Branch
    Nome da branch (usado em add e remove).

.PARAMETER Port
    Porta de desenvolvimento (opcional, usado em add).

.EXAMPLE
    .\scripts\worktree-setup.ps1 add feat/minha-feature-20260302 9007
    .\scripts\worktree-setup.ps1 list
    .\scripts\worktree-setup.ps1 remove feat/minha-feature-20260302
    .\scripts\worktree-setup.ps1 prune
#>

param(
    [Parameter(Position = 0)]
    [ValidateSet('add', 'list', 'remove', 'rm', 'prune', 'help', '')]
    [string]$Command = 'help',

    [Parameter(Position = 1)]
    [string]$Branch,

    [Parameter(Position = 2)]
    [int]$Port = 0
)

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$WorktreesDir = Join-Path $RepoRoot 'worktrees'

$PortLabels = @{
    9005 = 'DEV Principal'
    9006 = 'DEV Secundário (Agente AI #1)'
    9007 = 'DEV Terciário (Agente AI #2)'
    9008 = 'DEV Quaternário (Agente AI #3)'
    9009 = 'HML/Testes'
}

function Write-Header([string]$Title) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host " $Title" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Get-Worktrees {
    Write-Header "Git Worktrees Ativos"

    $output = git worktree list --porcelain 2>&1
    $entries = ($output -join "`n") -split "`n`n" | Where-Object { $_.Trim() }

    if (-not $entries) {
        Write-Host "Nenhum worktree adicional configurado."
        return
    }

    $i = 0
    foreach ($entry in $entries) {
        $wt = @{}
        $entry.Trim().Split("`n") | ForEach-Object {
            $parts = $_ -split ' ', 2
            if ($parts.Count -ge 2) { $wt[$parts[0]] = $parts[1] }
        }
        $i++
        $label = if ($i -eq 1) { " [principal]" } else { "" }
        Write-Host "$i. $($wt['worktree'])$label" -ForegroundColor Green
        Write-Host "   Branch : $($wt['branch'] ?? '(detached)')"
        Write-Host "   HEAD   : $($wt['HEAD'])"
        Write-Host ""
    }
}

function Add-Worktree([string]$Branch, [int]$Port) {
    if (-not $Branch) {
        Write-Host "❌ Informe o nome da branch. Ex: feat/minha-feature-20260302" -ForegroundColor Red
        exit 1
    }

    $SafeName = $Branch -replace '/', '-'
    $WorktreeDir = Join-Path $WorktreesDir $SafeName

    Write-Header "Criando Worktree: $Branch"

    # Criar diretório raiz se necessário
    if (-not (Test-Path $WorktreesDir)) {
        New-Item -ItemType Directory -Path $WorktreesDir -Force | Out-Null
        Write-Host "📁 Diretório criado: worktrees/" -ForegroundColor Yellow
    }

    if (Test-Path $WorktreeDir) {
        Write-Host "⚠️  Worktree já existe: worktrees/$SafeName" -ForegroundColor Yellow
        Write-Host "   Para removê-lo: .\scripts\worktree-setup.ps1 remove $Branch"
        exit 1
    }

    # Verificar branches existentes
    $LocalBranches = (git branch 2>&1) -replace '^\*?\s+', ''
    $RemoteBranches = (git branch -r 2>&1) -replace '^\s+origin/', ''

    if ($LocalBranches -contains $Branch) {
        Write-Host "ℹ️  Usando branch local existente: $Branch"
        git worktree add $WorktreeDir $Branch
    }
    elseif ($RemoteBranches -contains $Branch) {
        Write-Host "ℹ️  Fazendo checkout de branch remota: origin/$Branch"
        git worktree add $WorktreeDir -b $Branch "origin/$Branch"
    }
    else {
        Write-Host "ℹ️  Criando nova branch a partir de demo-stable: $Branch"
        try { git -c http.timeout=5 fetch origin demo-stable 2>&1 | Out-Null } catch {}
        try {
            git worktree add $WorktreeDir -b $Branch origin/demo-stable
        }
        catch {
            git worktree add $WorktreeDir -b $Branch
        }
    }

    Write-Host ""
    Write-Host "✅ Worktree criado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📂 Diretório  : worktrees/$SafeName"
    Write-Host "🌿 Branch     : $Branch"

    if ($Port -gt 0) {
        $PortLabel = if ($PortLabels.ContainsKey($Port)) { $PortLabels[$Port] } else { 'Personalizada' }
        Write-Host "🔌 Porta      : $Port ($PortLabel)"
        Write-Host ""
        Write-Host "Para iniciar o servidor nesse worktree:"
        Write-Host ""
        Write-Host "   cd worktrees/$SafeName"
        Write-Host "   npm install"
        Write-Host "   `$env:PORT = $Port"
        Write-Host "   npm run dev"
        Write-Host ""
        Write-Host "   Acesso: http://dev.localhost:$Port"
    }

    Write-Host ""
    Write-Host "Para abrir no VS Code:"
    Write-Host "   code worktrees/$SafeName"
    Write-Host ""
}

function Remove-Worktree([string]$Branch) {
    if (-not $Branch) {
        Write-Host "❌ Informe o nome da branch." -ForegroundColor Red
        exit 1
    }

    $SafeName = $Branch -replace '/', '-'
    $WorktreeDir = Join-Path $WorktreesDir $SafeName

    Write-Header "Removendo Worktree: $Branch"

    if (-not (Test-Path $WorktreeDir)) {
        Write-Host "⚠️  Worktree não encontrado: worktrees/$SafeName" -ForegroundColor Yellow
        Write-Host "   Execute: .\scripts\worktree-setup.ps1 list"
        exit 1
    }

    git worktree remove $WorktreeDir --force
    Write-Host "✅ Worktree removido: worktrees/$SafeName" -ForegroundColor Green
    Write-Host ""
}

function Invoke-Prune {
    Write-Header "Limpando Worktrees Obsoletos"
    git worktree prune
    Write-Host "✅ Prune concluído. Worktrees obsoletos removidos." -ForegroundColor Green
    Write-Host ""
}

function Show-Help {
    Write-Header "BidExpert — Gerenciador de Git Worktrees"
    Write-Host "Comandos disponíveis:"
    Write-Host ""
    Write-Host "  add <branch> [porta]   Cria um novo worktree para a branch"
    Write-Host "  list                   Lista todos os worktrees ativos"
    Write-Host "  remove <branch>        Remove um worktree existente"
    Write-Host "  prune                  Remove referências de worktrees obsoletos"
    Write-Host ""
    Write-Host "Exemplos:"
    Write-Host ""
    Write-Host "  .\scripts\worktree-setup.ps1 add feat/nova-feature-20260302 9007"
    Write-Host "  .\scripts\worktree-setup.ps1 list"
    Write-Host "  .\scripts\worktree-setup.ps1 remove feat/nova-feature-20260302"
    Write-Host "  .\scripts\worktree-setup.ps1 prune"
    Write-Host ""
    Write-Host "Portas reservadas:"
    foreach ($entry in $PortLabels.GetEnumerator() | Sort-Object Key) {
        Write-Host "  $($entry.Key)  $($entry.Value)"
    }
    Write-Host ""
}

# --- Entrypoint ---
switch ($Command) {
    'add'          { Add-Worktree -Branch $Branch -Port $Port }
    'list'         { Get-Worktrees }
    { $_ -in 'remove', 'rm' } { Remove-Worktree -Branch $Branch }
    'prune'        { Invoke-Prune }
    default        { Show-Help }
}
