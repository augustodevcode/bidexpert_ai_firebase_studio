@echo off
echo ========================================
echo VALIDACAO COMPLETA - DASHBOARD ADVOGADO
echo ========================================
echo.

echo [1/5] Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias
    exit /b 1
)
echo.

echo [2/5] Executando linter...
call npm run lint
if %errorlevel% neq 0 (
    echo AVISO: Lint falhou, mas continuando...
)
echo.

echo [3/5] Gerando Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERRO: Falha ao gerar Prisma Client
    exit /b 1
)
echo.

echo [4/5] Executando seed de dados v3...
call npm run db:seed:v3
if %errorlevel% neq 0 (
    echo ERRO: Falha ao executar seed
    exit /b 1
)
echo.

echo [5/5] Executando testes Playwright para Dashboard Advogado...
call npx playwright test tests/e2e/lawyer-dashboard.spec.ts --config=playwright.config.local.ts
if %errorlevel% neq 0 (
    echo ERRO: Testes falharam
    exit /b 1
)
echo.

echo ========================================
echo VALIDACAO CONCLUIDA COM SUCESSO!
echo ========================================
echo.
echo Para visualizar o relatorio HTML:
echo npx playwright show-report
echo.
