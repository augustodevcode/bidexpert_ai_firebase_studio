# Scripts/ci-cd/apply-secrets.ps1

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

function Get-EnvVar {
    param($Name)
    $P1 = ".env"
    $P2 = "$PSScriptRoot\..\..\.env"
    
    if (Test-Path $P1) { 
        $path = $P1 
        Write-Host "Lendo .env de: $P1"
    }
    elseif (Test-Path $P2) { 
        $path = $P2 
        Write-Host "Lendo .env de: $P2"
    }
    else {
        return $null
    }

    $val = Select-String -Path $path -Pattern "^$Name=(.*)$"
    if ($val) { 
        $raw = $val.Matches.Groups[1].Value.Trim()
        # Remove aspas se existirem
        return $raw -replace '^"','' -replace '"$','' -replace "^'",'' -replace "'$",""
    }
    return $null
}

Write-Host ">>> Configurando Secrets do GitHub <<<"

# 1. Autenticação
$Token = Get-EnvVar "GIT_ACCESS_TOKEN"
if (-not $Token) {
    # Fallback para o token informado no chat caso .env falhe
    # $Token = "TOKEN_REMOVIDO_POR_SEGURANCA" 
    Write-Host "Token não encontrado no .env. Configure GIT_ACCESS_TOKEN." -ForegroundColor Red
    exit 1
}

if ($Token) {
    echo $Token | gh auth login --with-token
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Autenticado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "Falha na autenticação." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Token não encontrado." -ForegroundColor Red
    exit 1
}

# 2. Definição de Secrets
$Secrets = @{
    "DATABASE_URL_PRD" = "mysql://bidexpert_prd:M2n9WszB69WTz!@bidexpert_prd.mysql.dbaas.com.br:3306/bidexpert_prd"
    "DATABASE_URL_HML" = "mysql://bidexpert_hml:TzuHYcSa7KsMt!@bidexpert_hml.mysql.dbaas.com.br:3306/bidexpert_hml"
    "DATABASE_URL_DEV" = "mysql://bidexpert_dev:TzuHYcSa7KsMt!@bidexpert_dev.mysql.dbaas.com.br:3306/bidexpert_dev"
    "HOST"             = "ftp.bidexpert.com.br"
    "USER"             = "bidexpert3"
    "PASS"             = "DNB6W3-PcfcZbH@"
}

# 3. Aplicação
foreach ($key in $Secrets.Keys) {
    Write-Host "Configurando $key..."
    echo $Secrets[$key] | gh secret set $key --app actions
}

Write-Host ">>> Configuração Finalizada! <<<" -ForegroundColor Cyan
