<#
.SYNOPSIS
    Processa a fila de issues com label 'ai-fix' para correção automática via AI Agent.

.DESCRIPTION
    Este script gerencia a fila AI-ITSM de issues marcadas para correção automática.
    Permite listar, processar e monitorar issues com o label 'ai-fix', respeitando
    o limite de 3 tentativas antes de escalar para revisão humana.

.PARAMETER IssueNumber
    Número específico da issue para processar. Se não fornecido, lista todas as issues na fila.

.PARAMETER DryRun
    Modo de simulação. Exibe o que seria feito sem fazer alterações reais.

.PARAMETER MaxAttempts
    Número máximo de tentativas antes de escalar. Padrão: 3

.EXAMPLE
    .\process-ai-fix-queue.ps1
    Lista todas as issues na fila ai-fix

.EXAMPLE
    .\process-ai-fix-queue.ps1 -IssueNumber 123
    Processa a issue #123

.EXAMPLE
    .\process-ai-fix-queue.ps1 -IssueNumber 123 -DryRun
    Simula o processamento da issue #123 sem fazer alterações

.EXAMPLE
    .\process-ai-fix-queue.ps1 -IssueNumber 123 -MaxAttempts 5
    Processa a issue #123 com limite de 5 tentativas

.NOTES
    Requisitos: GitHub CLI (gh) instalado e autenticado
    Autor: AI-ITSM Queue System
    Versão: 1.0.0
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [int]$IssueNumber,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun,
    
    [Parameter(Mandatory=$false)]
    [int]$MaxAttempts = 3
)

# Configuração de cores
$Colors = @{
    Success = 'Green'
    Warning = 'Yellow'
    Error = 'Red'
    Info = 'Cyan'
    Header = 'Magenta'
}

#region Funções

function Test-GitHubCLI {
    <#
    .SYNOPSIS
        Verifica se o GitHub CLI está instalado e autenticado
    #>
    try {
        $ghVersion = gh --version 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ GitHub CLI não está instalado." -ForegroundColor $Colors.Error
            Write-Host "   Instale em: https://cli.github.com/" -ForegroundColor $Colors.Info
            return $false
        }
        
        $authStatus = gh auth status 2>&1
        if ($authStatus -match "not logged in") {
            Write-Host "❌ GitHub CLI não está autenticado." -ForegroundColor $Colors.Error
            Write-Host "   Execute: gh auth login" -ForegroundColor $Colors.Info
            return $false
        }
        
        Write-Host "✅ GitHub CLI configurado corretamente" -ForegroundColor $Colors.Success
        return $true
    }
    catch {
        Write-Host "❌ Erro ao verificar GitHub CLI: $_" -ForegroundColor $Colors.Error
        return $false
    }
}

function Get-AIFixQueue {
    <#
    .SYNOPSIS
        Lista todas as issues com label 'ai-fix'
    #>
    try {
        Write-Host "`n📋 Buscando issues na fila AI-Fix..." -ForegroundColor $Colors.Info
        
        $issuesJson = gh issue list --label "ai-fix" --json number,title,labels,createdAt,author,state --limit 100
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Erro ao buscar issues" -ForegroundColor $Colors.Error
            return $null
        }
        
        $issues = $issuesJson | ConvertFrom-Json
        
        if ($issues.Count -eq 0) {
            Write-Host "✅ Fila vazia - nenhuma issue com label 'ai-fix' encontrada" -ForegroundColor $Colors.Success
            return @()
        }
        
        Write-Host "✅ Encontradas $($issues.Count) issue(s) na fila" -ForegroundColor $Colors.Success
        return $issues
    }
    catch {
        Write-Host "❌ Erro ao listar issues: $_" -ForegroundColor $Colors.Error
        return $null
    }
}

function Get-IssueAttempts {
    <#
    .SYNOPSIS
        Conta o número de tentativas anteriores em uma issue
    #>
    param(
        [Parameter(Mandatory=$true)]
        [int]$IssueNum
    )
    
    try {
        $commentsJson = gh issue view $IssueNum --json comments
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Erro ao buscar comentários da issue #$IssueNum" -ForegroundColor $Colors.Error
            return -1
        }
        
        $data = $commentsJson | ConvertFrom-Json
        $attempts = ($data.comments | Where-Object { $_.body -match '🤖 \*\*AI Agent ativado' }).Count
        
        return $attempts
    }
    catch {
        Write-Host "❌ Erro ao contar tentativas: $_" -ForegroundColor $Colors.Error
        return -1
    }
}

function Process-AIFixIssue {
    <#
    .SYNOPSIS
        Processa uma issue específica da fila AI-Fix
    #>
    param(
        [Parameter(Mandatory=$true)]
        [int]$IssueNum,
        
        [Parameter(Mandatory=$false)]
        [bool]$DryRunMode = $false,
        
        [Parameter(Mandatory=$false)]
        [int]$MaxAttempts = 3
    )
    
    Write-Host "`n" + ("=" * 60) -ForegroundColor $Colors.Header
    Write-Host "🔧 Processando Issue #$IssueNum" -ForegroundColor $Colors.Header
    Write-Host ("=" * 60) -ForegroundColor $Colors.Header
    
    # Get issue details
    try {
        $issueJson = gh issue view $IssueNum --json number,title,labels,state,body
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Issue #$IssueNum não encontrada" -ForegroundColor $Colors.Error
            return
        }
        
        $issue = $issueJson | ConvertFrom-Json
        
        Write-Host "`n📌 Título: $($issue.title)" -ForegroundColor $Colors.Info
        Write-Host "📊 Estado: $($issue.state)" -ForegroundColor $Colors.Info
        Write-Host "🏷️  Labels: $($issue.labels.name -join ', ')" -ForegroundColor $Colors.Info
    }
    catch {
        Write-Host "❌ Erro ao buscar detalhes da issue: $_" -ForegroundColor $Colors.Error
        return
    }
    
    # Check if issue has ai-fix label
    if ($issue.labels.name -notcontains "ai-fix") {
        Write-Host "⚠️  Issue não possui label 'ai-fix'" -ForegroundColor $Colors.Warning
        return
    }
    
    # Count attempts
    $attempts = Get-IssueAttempts -IssueNum $IssueNum
    
    if ($attempts -lt 0) {
        Write-Host "❌ Não foi possível contar tentativas" -ForegroundColor $Colors.Error
        return
    }
    
    Write-Host "`n📊 Tentativas anteriores: $attempts/$MaxAttempts" -ForegroundColor $Colors.Info
    
    # Check if limit reached
    if ($attempts -ge $MaxAttempts) {
        Write-Host "`n⚠️  Limite de tentativas atingido!" -ForegroundColor $Colors.Warning
        Write-Host "   Esta issue será escalada para revisão humana." -ForegroundColor $Colors.Warning
        
        if ($DryRunMode) {
            Write-Host "`n[DRY RUN] Ações que seriam executadas:" -ForegroundColor $Colors.Warning
            Write-Host "  1. Remover label 'ai-fix'" -ForegroundColor $Colors.Info
            Write-Host "  2. Adicionar labels 'escalated' e 'needs-human-review'" -ForegroundColor $Colors.Info
            Write-Host "  3. Adicionar comentário de escalação" -ForegroundColor $Colors.Info
        }
        else {
            Write-Host "`n🚀 Executando escalação..." -ForegroundColor $Colors.Info
            
            # Remove ai-fix label
            Write-Host "  • Removendo label 'ai-fix'..." -ForegroundColor $Colors.Info
            gh issue edit $IssueNum --remove-label "ai-fix" 2>$null
            
            # Add escalation labels
            Write-Host "  • Adicionando labels de escalação..." -ForegroundColor $Colors.Info
            gh issue edit $IssueNum --add-label "escalated,needs-human-review"
            
            # Add escalation comment
            Write-Host "  • Adicionando comentário de escalação..." -ForegroundColor $Colors.Info
            $escalationComment = @"
## 🚨 Escalação Manual para Revisão Humana

O AI Agent tentou corrigir este problema **$attempts vezes** sem sucesso.

### 📊 Status
- ✅ Tentativas automáticas: $attempts/$MaxAttempts
- ⚠️ Resultado: Todas as tentativas falharam
- 🎯 Próxima ação: Revisão humana necessária

### 🏷️ Labels Atualizadas
- ❌ Removido: ``ai-fix`` (limite de tentativas atingido)
- ✅ Adicionado: ``escalated`` (escalado para revisão)
- ✅ Adicionado: ``needs-human-review`` (requer atenção humana)

---

_Issue escalada manualmente via script PowerShell._
"@
            $escalationComment | gh issue comment $IssueNum --body-file -
            
            Write-Host "`n✅ Issue escalada com sucesso!" -ForegroundColor $Colors.Success
        }
    }
    else {
        $nextAttempt = $attempts + 1
        Write-Host "`n✅ Issue pode ser processada (tentativa $nextAttempt/$MaxAttempts)" -ForegroundColor $Colors.Success
        
        if ($DryRunMode) {
            Write-Host "`n[DRY RUN] Ações que seriam executadas:" -ForegroundColor $Colors.Warning
            Write-Host "  1. Adicionar label 'in-progress'" -ForegroundColor $Colors.Info
            Write-Host "  2. Adicionar comentário de ativação do AI Agent" -ForegroundColor $Colors.Info
            Write-Host "  3. Registrar tentativa $nextAttempt/$MaxAttempts" -ForegroundColor $Colors.Info
        }
        else {
            Write-Host "`n🚀 Acionando AI Agent..." -ForegroundColor $Colors.Info
            
            # Add in-progress label
            Write-Host "  • Adicionando label 'in-progress'..." -ForegroundColor $Colors.Info
            gh issue edit $IssueNum --add-label "in-progress"
            
            # Add activation comment
            Write-Host "  • Adicionando comentário de ativação..." -ForegroundColor $Colors.Info
            $activationComment = @"
## 🤖 **AI Agent ativado** (Tentativa $nextAttempt/$MaxAttempts) - Manual

O AI Agent foi acionado manualmente via script PowerShell.

### 📋 Informações da Issue
- **Título:** $($issue.title)
- **Tentativa:** $nextAttempt de $MaxAttempts
- **Modo:** Processamento manual

### 🔍 Próximos Passos
1. ✅ Análise dos logs e contexto
2. 🔧 Desenvolvimento da estratégia de correção
3. 💻 Implementação das mudanças
4. 🧪 Validação com testes
5. 📝 Criação de Pull Request (se bem-sucedido)

---

_Acionado manualmente via script PowerShell._
"@
            $activationComment | gh issue comment $IssueNum --body-file -
            
            Write-Host "`n✅ AI Agent acionado com sucesso!" -ForegroundColor $Colors.Success
            Write-Host "   Acompanhe o progresso nos comentários da issue." -ForegroundColor $Colors.Info
        }
    }
}

function Show-QueueList {
    <#
    .SYNOPSIS
        Exibe a lista formatada de issues na fila
    #>
    param(
        [Parameter(Mandatory=$true)]
        $Issues
    )
    
    Write-Host "`n" + ("=" * 80) -ForegroundColor $Colors.Header
    Write-Host "📋 FILA AI-FIX - Issues Pendentes" -ForegroundColor $Colors.Header
    Write-Host ("=" * 80) -ForegroundColor $Colors.Header
    
    foreach ($issue in $Issues) {
        $attempts = Get-IssueAttempts -IssueNum $issue.number
        $statusColor = if ($attempts -ge $MaxAttempts) { $Colors.Error } elseif ($attempts -gt 0) { $Colors.Warning } else { $Colors.Success }
        
        Write-Host "`n#$($issue.number)" -ForegroundColor $Colors.Header -NoNewline
        Write-Host " - $($issue.title)" -ForegroundColor $Colors.Info
        Write-Host "  📅 Criado: $(([DateTime]$issue.createdAt).ToString('yyyy-MM-dd HH:mm'))" -ForegroundColor Gray
        Write-Host "  👤 Autor: $($issue.author.login)" -ForegroundColor Gray
        Write-Host "  🏷️  Labels: $($issue.labels.name -join ', ')" -ForegroundColor Gray
        Write-Host "  📊 Tentativas: $attempts/$MaxAttempts" -ForegroundColor $statusColor
        
        if ($attempts -ge $MaxAttempts) {
            Write-Host "  ⚠️  ATENÇÃO: Limite atingido - pronta para escalação!" -ForegroundColor $Colors.Error
        }
    }
    
    Write-Host "`n" + ("=" * 80) -ForegroundColor $Colors.Header
    Write-Host "Total: $($Issues.Count) issue(s) na fila" -ForegroundColor $Colors.Info
    Write-Host ("=" * 80) -ForegroundColor $Colors.Header
}

#endregion

#region Main Script

Write-Host "`n🤖 AI-ITSM Queue Processor" -ForegroundColor $Colors.Header
Write-Host "========================================" -ForegroundColor $Colors.Header

# Check GitHub CLI
if (-not (Test-GitHubCLI)) {
    exit 1
}

# Display mode
if ($DryRun) {
    Write-Host "`n⚠️  MODO DRY RUN - Nenhuma alteração será feita" -ForegroundColor $Colors.Warning
}

# Process based on parameters
if ($IssueNumber) {
    # Process specific issue
    Process-AIFixIssue -IssueNum $IssueNumber -DryRunMode $DryRun -MaxAttempts $MaxAttempts
}
else {
    # List all issues in queue
    $issues = Get-AIFixQueue
    
    if ($null -eq $issues) {
        Write-Host "`n❌ Erro ao buscar fila" -ForegroundColor $Colors.Error
        exit 1
    }
    
    if ($issues.Count -eq 0) {
        Write-Host "`n✅ Fila vazia!" -ForegroundColor $Colors.Success
        exit 0
    }
    
    Show-QueueList -Issues $issues
    
    Write-Host "`n💡 Dica: Para processar uma issue específica, use:" -ForegroundColor $Colors.Info
    Write-Host "   .\process-ai-fix-queue.ps1 -IssueNumber <número>" -ForegroundColor Gray
}

Write-Host "`n✅ Concluído!" -ForegroundColor $Colors.Success

#endregion
