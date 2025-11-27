@echo off
REM Script de automação para Windows: Seed + Testes 5 Gaps
REM ========================================================

setlocal enabledelayedexpansion

title BidExpert - 5 Gaps Testing Pipeline

color 0A
cls

echo ═══════════════════════════════════════════════════════════
echo      🎯 AUTOMAÇÃO: SEED + TESTES 5 GAPS
echo ═══════════════════════════════════════════════════════════
echo.

REM 1. Verificar se servidor está rodando
echo [1/5] Verificando servidor em :9005...
netstat -ano | findstr :9005 >nul
if errorlevel 1 (
  color 0C
  echo ❌ Servidor não está rodando em :9005
  echo.
  echo Inicie com: npm run dev:9005
  echo.
  pause
  exit /b 1
)
color 0A
echo ✅ Servidor rodando
echo.

REM 2. Push do schema
echo [2/5] Aplicando schema Prisma...
call npm run db:push
if errorlevel 1 (
  color 0C
  echo ❌ Erro ao aplicar schema
  pause
  exit /b 1
)
color 0A
echo ✅ Schema aplicado
echo.

REM 3. Gerar Prisma Client
echo [3/5] Gerando Prisma Client...
call npx prisma generate
if errorlevel 1 (
  color 0C
  echo ❌ Erro ao gerar Prisma Client
  pause
  exit /b 1
)
color 0A
echo ✅ Prisma Client gerado
echo.

REM 4. Seed de dados
echo [4/5] Fazendo seed de dados simulados...
call npm run db:seed:v3
if errorlevel 1 (
  color 0C
  echo ❌ Erro ao fazer seed
  pause
  exit /b 1
)
color 0A
echo ✅ Seed concluído
echo.

REM 5. Testes
echo [5/5] Executando testes Playwright...
set PLAYWRIGHT_TEST_BASE_URL=http://localhost:9005
call npm run test:e2e tests/e2e/5-gaps-complete.spec.ts

if errorlevel 1 (
  color 0C
  echo.
  echo ❌ Alguns testes falharam
  echo.
  goto show_report
)

color 0A
cls
echo ═══════════════════════════════════════════════════════════
echo ✅ AUTOMAÇÃO COMPLETADA COM SUCESSO!
echo ═══════════════════════════════════════════════════════════
echo.

:show_report
echo 📊 Ver relatório:
echo    npx playwright show-report
echo.
pause
