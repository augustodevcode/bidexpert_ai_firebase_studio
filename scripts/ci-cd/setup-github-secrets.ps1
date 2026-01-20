<#
.SYNOPSIS
    Configura Secrets e Variáveis do GitHub Actions para a Esteira CI/CD do BidExpert.
    
.DESCRIPTION
    Este script lê o arquivo .env local (se existir) e utiliza a GitHub CLI (gh) ou chamadas REST
    para configurar os segredos necessários para os ambientes de DEV, HML e PRD.
    
    Requer um Personal Access Token (PAT) com escopo 'repo' se a 'gh' CLI não estiver autenticada.

.PARAMETER Token
    Token de acesso pessoal do GitHub (opcional se já autenticado via gh).

.EXAMPLE
    .\setup-github-secrets.ps1 -Token "ghp_..."
#>

param (
    [string]$Token
)

# Configurações do Repositório
$RepoOwner = "augustodevcode"
$RepoName = "bidexpert_ai_firebase_studio"
$ApiUrl = "https://api.github.com/repos/$RepoOwner/$RepoName"

# Lista de Segredos Necessários
$RequiredSecrets = @(
    "DATABASE_URL_DEV",
    "DATABASE_URL_HML",
    "DATABASE_URL_DEMO",
    "DATABASE_URL_PRD",
    "HOST",
    "USER",
    "PASS",
    "AUTH_SECRET",
    "NEXTAUTH_SECRET",
    "SESSION_SECRET"
)

# Função para ler arquivo .env
function Get-EnvVariable {
    param([string]$Name)
    if (Test-Path "..\..\.env") {
        $val = Select-String -Path "..\..\.env" -Pattern "^$Name=(.*)$"
        if ($val) {
            return $val.Matches.Groups[1].Value.Trim()
        }
    }
    return $null
}

Write-Host ">>> Iniciando Configuração de Secrets CI/CD BidExpert <<<" -ForegroundColor Cyan

# Verificação de Token
if (-not $Token) {
    $EnvToken = Get-EnvVariable "GIT_ACCESS_TOKEN"
    if ($EnvToken) {
        $Token = $EnvToken
        Write-Host "[INFO] Token encontrado no arquivo .env" -ForegroundColor Green
    } else {
        Write-Host "[ERRO] Token não fornecido e não encontrado no .env (GIT_ACCESS_TOKEN)" -ForegroundColor Red
        exit 1
    }
}

$Headers = @{
    "Authorization" = "token $Token"
    "Accept"        = "application/vnd.github.v3+json"
}

# Teste de Conexão
try {
    $repoTest = Invoke-RestMethod -Uri $ApiUrl -Headers $Headers -Method Get
    Write-Host "[SUCESSO] Conectado ao repositório: $($repoTest.full_name)" -ForegroundColor Green
} catch {
    Write-Host "[ERRO] Falha ao conectar no GitHub. Verifique o Token." -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

# Processamento de Secrets (Simulado para Segurança - Requer lib sodium para criptografia real em script puro)
# Como criptografar secrets via PowerShell puro é complexo sem dependências externas,
# este script valida as configurações e alerta sobre o que falta.

Write-Host "`nVerificando variáveis locais..." -ForegroundColor Yellow

foreach ($Key in $RequiredSecrets) {
    if ($Key -match "DATABASE_URL_DEV") { $LocalVar = Get-EnvVariable "DATABASE_URL" } # Mapping DEV default
    elseif ($Key -match "PASS") { $LocalVar = Get-EnvVariable "FTP_PASS" }
    elseif ($Key -match "USER") { $LocalVar = Get-EnvVariable "FTP_USER" }
    elseif ($Key -match "HOST") { $LocalVar = Get-EnvVariable "FTP_HOST" }
    else { $LocalVar = Get-EnvVariable $Key }

    if ($LocalVar) {
        Write-Host " [OK] $Key encontrada no .env local." -ForegroundColor Green
    } else {
        Write-Host " [MISSING] $Key não encontrada no .env local." -ForegroundColor Red
    }
}

Write-Host "`n[ATENÇÃO] Devido às limitações de dependência de criptografia (libsodium) neste ambiente," -ForegroundColor Yellow
Write-Host "este script validou a presença das chaves. Para enviá-las automaticamente," -ForegroundColor Yellow
Write-Host "instale a CLI do GitHub (gh) ou preencha manualmente no painel Settings > Secrets." -ForegroundColor Yellow
Write-Host "`nPara instalar GH CLI: winget install GitHub.cli" -ForegroundColor Cyan
