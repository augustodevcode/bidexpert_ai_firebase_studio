<# 
.SYNOPSIS
    Prepara o ambiente local para deploy Vercel DEMO
    
.DESCRIPTION
    Este script prepara o ambiente local para fazer deploy no Vercel DEMO:
    1. Verifica pré-requisitos (Vercel CLI, Node.js)
    2. Copia schema PostgreSQL
    3. Gera Prisma Client
    4. Faz build local
    5. Executa deploy para Vercel
    
.EXAMPLE
    .\scripts\prepare-vercel-demo.ps1
    
.EXAMPLE
    .\scripts\prepare-vercel-demo.ps1 -SkipBuild
    
.NOTES
    Autor: BidExpert Team
    Data: 2025-01-31
#>

param(
    [switch]$SkipBuild,
    [switch]$Preview,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  BidExpert - Preparação Deploy Vercel DEMO" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ==============================================================================
# 1. Verificar pré-requisitos
# ==============================================================================
Write-Host "[1/6] Verificando pré-requisitos..." -ForegroundColor Yellow

# Node.js
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "❌ Node.js não encontrado. Instale em https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "  ✅ Node.js: $nodeVersion" -ForegroundColor Green

# Vercel CLI
$vercelVersion = vercel --version 2>$null
if (-not $vercelVersion) {
    Write-Host "  ⚠️ Vercel CLI não encontrado. Instalando..." -ForegroundColor Yellow
    npm install -g vercel@latest
    $vercelVersion = vercel --version
}
Write-Host "  ✅ Vercel CLI: $vercelVersion" -ForegroundColor Green

# Verificar se está logado no Vercel
$vercelWhoami = vercel whoami 2>$null
if (-not $vercelWhoami) {
    Write-Host "  ⚠️ Não logado no Vercel. Executando login..." -ForegroundColor Yellow
    vercel login
}
Write-Host "  ✅ Vercel User: $vercelWhoami" -ForegroundColor Green

# ==============================================================================
# 2. Verificar arquivos necessários
# ==============================================================================
Write-Host ""
Write-Host "[2/6] Verificando arquivos necessários..." -ForegroundColor Yellow

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

# Schema PostgreSQL
$postgresSchema = "prisma\schema.postgresql.prisma"
if (-not (Test-Path $postgresSchema)) {
    Write-Host "❌ Arquivo $postgresSchema não encontrado!" -ForegroundColor Red
    exit 1
}
Write-Host "  ✅ Schema PostgreSQL encontrado" -ForegroundColor Green

# vercel.json
if (-not (Test-Path "vercel.json")) {
    Write-Host "❌ Arquivo vercel.json não encontrado!" -ForegroundColor Red
    exit 1
}
Write-Host "  ✅ vercel.json encontrado" -ForegroundColor Green

# ==============================================================================
# 3. Copiar schema PostgreSQL
# ==============================================================================
Write-Host ""
Write-Host "[3/6] Preparando schema PostgreSQL..." -ForegroundColor Yellow

Copy-Item $postgresSchema "prisma\schema.prisma" -Force
Write-Host "  ✅ Schema copiado para prisma\schema.prisma" -ForegroundColor Green

# ==============================================================================
# 4. Gerar Prisma Client
# ==============================================================================
Write-Host ""
Write-Host "[4/6] Gerando Prisma Client..." -ForegroundColor Yellow

npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao gerar Prisma Client" -ForegroundColor Red
    exit 1
}
Write-Host "  ✅ Prisma Client gerado" -ForegroundColor Green

# ==============================================================================
# 5. Build local (opcional)
# ==============================================================================
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "[5/6] Executando build local..." -ForegroundColor Yellow
    
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro no build" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✅ Build concluído" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[5/6] Build pulado (--SkipBuild)" -ForegroundColor Yellow
}

# ==============================================================================
# 6. Deploy para Vercel
# ==============================================================================
Write-Host ""
Write-Host "[6/6] Deploy para Vercel..." -ForegroundColor Yellow

if ($DryRun) {
    Write-Host "  ⚠️ Modo DryRun - deploy não executado" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Comando que seria executado:" -ForegroundColor Cyan
    if ($Preview) {
        Write-Host "  vercel deploy" -ForegroundColor White
    } else {
        Write-Host "  vercel deploy --prod" -ForegroundColor White
    }
} else {
    if ($Preview) {
        Write-Host "  Executando deploy PREVIEW..." -ForegroundColor Cyan
        $deployUrl = vercel deploy
    } else {
        Write-Host "  Executando deploy PRODUCTION..." -ForegroundColor Cyan
        $deployUrl = vercel deploy --prod
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro no deploy" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  ✅ Deploy concluído com sucesso!" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  URL: $deployUrl" -ForegroundColor Cyan
    Write-Host ""
}

# ==============================================================================
# Restaurar schema MySQL (para desenvolvimento local)
# ==============================================================================
Write-Host ""
Write-Host "Restaurando schema MySQL para desenvolvimento local..." -ForegroundColor Yellow

# Verificar se existe backup do schema MySQL
$mysqlSchemaBackup = "prisma\schema.mysql.prisma"
if (Test-Path $mysqlSchemaBackup) {
    Copy-Item $mysqlSchemaBackup "prisma\schema.prisma" -Force
    npx prisma generate 2>$null
    Write-Host "  ✅ Schema MySQL restaurado" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ Backup MySQL não encontrado. Execute 'git checkout prisma/schema.prisma' manualmente." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Concluído!" -ForegroundColor Green
