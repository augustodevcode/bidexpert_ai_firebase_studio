<#
.SYNOPSIS
    Script para processar fila de issues AI-Fix no GitHub.

.DESCRIPTION
    Este script permite gerenciar manualmente a fila de issues marcadas com 'ai-fix',
    verificando tentativas anteriores e acionando o processamento apropriado.
    
    Funcionalidades:
    - Listar todas as issues com label 'ai-fix'
    - Processar uma issue específica
    - Verificar limite de tentativas (padrão: 3)
    - Adicionar comentários e labels apropriadas
    - Suporte para modo DryRun (simulação)

.PARAMETER IssueNumber
    Número da issue a ser processada. Se não fornecido, lista todas as issues ai-fix.

.PARAMETER DryRun
    Modo de simulação. Não faz alterações reais, apenas mostra o que seria feito.

.PARAMETER MaxAttempts
    Número máximo de tentativas permitidas. Padrão: 3.

.EXAMPLE
    .\process-ai-fix-queue.ps1
    Lista todas as issues com label 'ai-fix'

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
    Requer GitHub CLI (gh) instalado e autenticado.
    Versão: 1.0.0
    Autor: AI-ITSM Queue System
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

# Definição de cores para output
$Colors = @{
    Success = 'Green'
    Warning = 'Yellow'
    Error = 'Red'
    Info = 'Cyan'
    Header = 'Magenta'
}

# Função para verificar se GitHub CLI está instalado
function Test-GitHubCLI {
    [CmdletBinding()]
    param()
    
    Write-Host "`n🔍 Verificando instalação do GitHub CLI..." -ForegroundColor $Colors.Info
    
    try {
        $ghVersion = gh --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ GitHub CLI instalado: $($ghVersion[0])" -ForegroundColor $Colors.Success
            return $true
        }
    }
    catch {
        Write-Host "❌ GitHub CLI não encontrado!" -ForegroundColor $Colors.Error
        Write-Host "`nPor favor, instale o GitHub CLI:" -ForegroundColor $Colors.Warning
        Write-Host "  - Windows: winget install --id GitHub.cli" -ForegroundColor $Colors.Info
        Write-Host "  - macOS: brew install gh" -ForegroundColor $Colors.Info
        Write-Host "  - Linux: https://github.com/cli/cli/blob/trunk/docs/install_linux.md" -ForegroundColor $Colors.Info
        Write-Host "`nApós instalar, execute: gh auth login" -ForegroundColor $Colors.Info
        return $false
    }
}

# Função para obter a fila de issues AI-Fix
function Get-AIFixQueue {
    [CmdletBinding()]
    param()
    
    Write-Host "`n📋 Obtendo fila de issues AI-Fix..." -ForegroundColor $Colors.Header
    
    try {
        $issuesJson = gh issue list --label "ai-fix" --json number,title,labels,createdAt,author,url --state open 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Erro ao obter issues: $issuesJson" -ForegroundColor $Colors.Error
            return $null
        }
        
        $issues = $issuesJson | ConvertFrom-Json
        
        if ($issues.Count -eq 0) {
            Write-Host "`n✨ Nenhuma issue com label 'ai-fix' encontrada!" -ForegroundColor $Colors.Success
            Write-Host "A fila está vazia. 🎉" -ForegroundColor $Colors.Info
            return @()
        }
        
        Write-Host "`n✅ Encontradas $($issues.Count) issue(s) na fila" -ForegroundColor $Colors.Success
        Write-Host "`n" + ("=" * 100) -ForegroundColor $Colors.Header
        Write-Host ("{0,-8} {1,-50} {2,-20} {3,-20}" -f "Número", "Título", "Autor", "Criada em") -ForegroundColor $Colors.Header
        Write-Host ("=" * 100) -ForegroundColor $Colors.Header
        
        foreach ($issue in $issues) {
            $createdAt = [DateTime]::Parse($issue.createdAt).ToString("yyyy-MM-dd HH:mm")
            $title = if ($issue.title.Length -gt 47) { $issue.title.Substring(0, 47) + "..." } else { $issue.title }
            
            Write-Host ("{0,-8} {1,-50} {2,-20} {3,-20}" -f 
                "#$($issue.number)", 
                $title, 
                $issue.author.login, 
                $createdAt
            ) -ForegroundColor $Colors.Info
            
            # Mostrar labels
            $labelNames = ($issue.labels | ForEach-Object { $_.name }) -join ", "
            Write-Host ("         Labels: $labelNames") -ForegroundColor $Colors.Warning
            Write-Host ""
        }
        
        Write-Host ("=" * 100) -ForegroundColor $Colors.Header
        
        return $issues
    }
    catch {
        Write-Host "❌ Erro ao processar issues: $_" -ForegroundColor $Colors.Error
        return $null
    }
}

# Função para obter o número de tentativas de uma issue
function Get-IssueAttempts {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [int]$IssueNum
    )
    
    Write-Host "`n🔍 Verificando tentativas anteriores da issue #$IssueNum..." -ForegroundColor $Colors.Info
    
    try {
        $commentsJson = gh issue view $IssueNum --json comments 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Erro ao obter comentários: $commentsJson" -ForegroundColor $Colors.Error
            return -1
        }
        
        $data = $commentsJson | ConvertFrom-Json
        $comments = $data.comments
        
        # Contar comentários que contêm a string de ativação do AI Agent
        $attempts = 0
        foreach ($comment in $comments) {
            if ($comment.body -match "🤖 \*\*AI Agent ativado") {
                $attempts++
            }
        }
        
        Write-Host "✅ Tentativas encontradas: $attempts" -ForegroundColor $Colors.Success
        return $attempts
    }
    catch {
        Write-Host "❌ Erro ao processar comentários: $_" -ForegroundColor $Colors.Error
        return -1
    }
}

# Função para processar uma issue AI-Fix
function Process-AIFixIssue {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [int]$IssueNum,
        
        [Parameter(Mandatory=$false)]
        [switch]$DryRun,
        
        [Parameter(Mandatory=$false)]
        [int]$MaxAttempts = 3
    )
    
    Write-Host "`n" + ("=" * 100) -ForegroundColor $Colors.Header
    Write-Host "🤖 Processando Issue #$IssueNum" -ForegroundColor $Colors.Header
    Write-Host ("=" * 100) -ForegroundColor $Colors.Header
    
    if ($DryRun) {
        Write-Host "`n⚠️  MODO DRY RUN - Nenhuma alteração será feita" -ForegroundColor $Colors.Warning
    }
    
    # Obter informações da issue
    Write-Host "`n📄 Obtendo detalhes da issue..." -ForegroundColor $Colors.Info
    $issueJson = gh issue view $IssueNum --json number,title,labels,state,url 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro: Issue #$IssueNum não encontrada ou inacessível" -ForegroundColor $Colors.Error
        return $false
    }
    
    $issue = $issueJson | ConvertFrom-Json
    
    Write-Host "✅ Issue encontrada:" -ForegroundColor $Colors.Success
    Write-Host "   Título: $($issue.title)" -ForegroundColor $Colors.Info
    Write-Host "   Estado: $($issue.state)" -ForegroundColor $Colors.Info
    Write-Host "   URL: $($issue.url)" -ForegroundColor $Colors.Info
    
    # Verificar se tem label ai-fix
    $hasAIFixLabel = $issue.labels | Where-Object { $_.name -eq "ai-fix" }
    
    if (-not $hasAIFixLabel) {
        Write-Host "`n⚠️  Issue não tem label 'ai-fix'. Nada a processar." -ForegroundColor $Colors.Warning
        return $false
    }
    
    # Obter tentativas anteriores
    $attempts = Get-IssueAttempts -IssueNum $IssueNum
    
    if ($attempts -lt 0) {
        Write-Host "❌ Falha ao verificar tentativas. Abortando." -ForegroundColor $Colors.Error
        return $false
    }
    
    Write-Host "`n📊 Status das Tentativas:" -ForegroundColor $Colors.Header
    Write-Host "   Tentativas realizadas: $attempts" -ForegroundColor $Colors.Info
    Write-Host "   Máximo permitido: $MaxAttempts" -ForegroundColor $Colors.Info
    Write-Host "   Tentativas restantes: $($MaxAttempts - $attempts)" -ForegroundColor $Colors.Info
    
    # Decidir ação baseada em tentativas
    if ($attempts -ge $MaxAttempts) {
        Write-Host "`n🚨 Limite de tentativas atingido! Escalando para revisão humana..." -ForegroundColor $Colors.Warning
        
        if (-not $DryRun) {
            # Remover label ai-fix
            Write-Host "`n🏷️  Removendo label 'ai-fix'..." -ForegroundColor $Colors.Info
            gh issue edit $IssueNum --remove-label "ai-fix" 2>&1 | Out-Null
            
            # Adicionar labels de escalação
            Write-Host "🏷️  Adicionando labels 'escalated' e 'needs-human-review'..." -ForegroundColor $Colors.Info
            gh issue edit $IssueNum --add-label "escalated,needs-human-review" 2>&1 | Out-Null
            
            # Adicionar comentário
            Write-Host "💬 Adicionando comentário de escalação..." -ForegroundColor $Colors.Info
            $escalationComment = @"
## 🚨 Escalação para Revisão Humana (via Script Manual)

O AI Agent tentou corrigir este problema **$MaxAttempts vezes** sem sucesso.

### 📊 Histórico de Tentativas

- **Total de tentativas**: $attempts/$MaxAttempts
- **Status**: Todas as tentativas falharam
- **Ação**: Escalado para time de desenvolvimento
- **Processado por**: Script PowerShell manual

### 👥 Próximos Passos

Este caso requer atenção humana. Um desenvolvedor experiente precisa:

1. Revisar o histórico de tentativas do AI Agent
2. Analisar os logs e contexto fornecidos
3. Identificar a causa raiz do problema
4. Implementar uma correção manual

### 🏷️ Labels Atualizadas

- ❌ Removida: ``ai-fix`` (processamento automático encerrado)
- ✅ Adicionada: ``escalated`` (escalado para humanos)
- ✅ Adicionada: ``needs-human-review`` (requer revisão manual)

---

*Escalação realizada via script manual de gerenciamento.*
"@
            
            $escalationComment | gh issue comment $IssueNum --body-file - 2>&1 | Out-Null
            
            Write-Host "`n✅ Issue escalada com sucesso!" -ForegroundColor $Colors.Success
        }
        else {
            Write-Host "`n[DRY RUN] Removeria label 'ai-fix'" -ForegroundColor $Colors.Warning
            Write-Host "[DRY RUN] Adicionaria labels 'escalated' e 'needs-human-review'" -ForegroundColor $Colors.Warning
            Write-Host "[DRY RUN] Adicionaria comentário de escalação" -ForegroundColor $Colors.Warning
        }
        
        return $true
    }
    else {
        $currentAttempt = $attempts + 1
        $remainingAttempts = $MaxAttempts - $currentAttempt
        
        Write-Host "`n🚀 Acionando AI Agent (Tentativa $currentAttempt/$MaxAttempts)..." -ForegroundColor $Colors.Success
        
        if (-not $DryRun) {
            # Adicionar label in-progress
            Write-Host "`n🏷️  Adicionando label 'in-progress'..." -ForegroundColor $Colors.Info
            gh issue edit $IssueNum --add-label "in-progress" 2>&1 | Out-Null
            
            # Adicionar comentário de ativação
            Write-Host "💬 Adicionando comentário de ativação..." -ForegroundColor $Colors.Info
            $activationComment = @"
## 🤖 **AI Agent ativado** (Tentativa $currentAttempt/$MaxAttempts) - Via Script Manual

O AI Agent foi acionado manualmente via script PowerShell para analisar e corrigir este problema.

### 📊 Status da Tentativa

- **Tentativa atual**: $currentAttempt de $MaxAttempts
- **Tentativas restantes**: $remainingAttempts
- **Issue**: [#$IssueNum]($($issue.url))
- **Processado por**: Script PowerShell manual

### 🔧 Próximos Passos do AI Agent

1. ✅ Análise de logs e identificação do erro
2. 🔄 Busca por soluções conhecidas em documentação
3. 💡 Geração de correção apropriada
4. 🧪 Validação da correção (se possível)
5. 📝 Criação de Pull Request com a correção

---

*O AI Agent pode levar alguns minutos para processar. Acompanhe o progresso aqui.*

$(if ($remainingAttempts -eq 0) { "`n⚠️ **Esta é a última tentativa automática. Se falhar, será escalado para revisão humana.**" } else { "" })
"@
            
            $activationComment | gh issue comment $IssueNum --body-file - 2>&1 | Out-Null
            
            Write-Host "`n✅ AI Agent acionado com sucesso!" -ForegroundColor $Colors.Success
            
            if ($remainingAttempts -eq 0) {
                Write-Host "⚠️  Esta foi a última tentativa automática!" -ForegroundColor $Colors.Warning
            }
        }
        else {
            Write-Host "`n[DRY RUN] Adicionaria label 'in-progress'" -ForegroundColor $Colors.Warning
            Write-Host "[DRY RUN] Adicionaria comentário de ativação (Tentativa $currentAttempt/$MaxAttempts)" -ForegroundColor $Colors.Warning
        }
        
        return $true
    }
}

# ============================================
# MAIN SCRIPT
# ============================================

Write-Host "`n" + ("=" * 100) -ForegroundColor $Colors.Header
Write-Host "🤖 AI-ITSM Queue Processor - PowerShell Script" -ForegroundColor $Colors.Header
Write-Host ("=" * 100) -ForegroundColor $Colors.Header

# Verificar GitHub CLI
if (-not (Test-GitHubCLI)) {
    exit 1
}

# Decidir ação baseada em parâmetros
if ($IssueNumber) {
    # Processar issue específica
    $result = Process-AIFixIssue -IssueNum $IssueNumber -DryRun:$DryRun -MaxAttempts $MaxAttempts
    
    if ($result) {
        Write-Host "`n✅ Processamento concluído com sucesso!" -ForegroundColor $Colors.Success
        exit 0
    }
    else {
        Write-Host "`n❌ Processamento falhou ou foi cancelado." -ForegroundColor $Colors.Error
        exit 1
    }
}
else {
    # Listar fila
    $issues = Get-AIFixQueue
    
    if ($null -eq $issues) {
        Write-Host "`n❌ Falha ao obter fila de issues." -ForegroundColor $Colors.Error
        exit 1
    }
    
    if ($issues.Count -gt 0) {
        Write-Host "`n💡 Para processar uma issue específica, execute:" -ForegroundColor $Colors.Info
        Write-Host "   .\process-ai-fix-queue.ps1 -IssueNumber <numero>" -ForegroundColor $Colors.Success
        Write-Host "`n💡 Para simular o processamento (DryRun):" -ForegroundColor $Colors.Info
        Write-Host "   .\process-ai-fix-queue.ps1 -IssueNumber <numero> -DryRun" -ForegroundColor $Colors.Success
    }
    
    exit 0
}
