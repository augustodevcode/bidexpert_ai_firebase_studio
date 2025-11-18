@echo off
setlocal enabledelayedexpansion

REM Mudando para o diretório do projeto
cd /d "E:\SmartDataCorp\BidExpert\BidExpertVsCode\bidexpert_ai_firebase_studio"

echo.
echo ========================================
echo PASSO 1: Gerando Prisma Client
echo ========================================
call npx prisma generate

if %ERRORLEVEL% NEQ 0 (
    echo Erro ao gerar Prisma Client
    pause
    exit /b 1
)

echo.
echo ========================================
echo PASSO 2: Rodando seed-data-extended-v3
echo ========================================
call npx ts-node prisma/seed-data-extended-v3.ts

if %ERRORLEVEL% NEQ 0 (
    echo Erro ao rodar seed, tentando npm run seed
    call npm run seed
)

echo.
echo ========================================
echo PASSO 3: Limpando node_modules .prisma
echo ========================================
rmdir /s /q "node_modules\.prisma" 2>nul
del /q "node_modules\.prisma\*.*" 2>nul

echo.
echo ========================================
echo PASSO 4: Executando testes Playwright
echo ========================================
call npm run test:e2e:realtime

echo.
echo ========================================
echo TESTES CONCLUÍDOS
echo ========================================
pause
