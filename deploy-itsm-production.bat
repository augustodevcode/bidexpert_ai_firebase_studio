@echo off
REM ==========================================
REM ITSM-AI - Script de Deploy para Produção
REM ==========================================

echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                                                                  ║
echo ║         🚀 ITSM-AI - DEPLOY PARA PRODUÇÃO 🚀                     ║
echo ║                                                                  ║
echo ║         ATENÇÃO: Este script fará deploy em produção!           ║
echo ║                                                                  ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.

REM Confirmar deploy
set /p CONFIRM="Deseja continuar com o deploy? (s/N): "
if /i not "%CONFIRM%"=="s" (
    echo Deploy cancelado.
    pause
    exit /b 0
)

echo.
echo ═══════════════════════════════════════════════════════════════════
echo INICIANDO PROCESSO DE DEPLOY
echo ═══════════════════════════════════════════════════════════════════
echo.

REM ============================
REM ETAPA 1: Validação Pré-Deploy
REM ============================
echo [1/8] Validando estrutura de arquivos...

set ERROR=0

if not exist "src\components\support\floating-support-buttons.tsx" (
    echo ❌ Componente floating-support-buttons.tsx não encontrado
    set ERROR=1
)

if not exist "src\components\support\support-chat-modal.tsx" (
    echo ❌ Componente support-chat-modal.tsx não encontrado
    set ERROR=1
)

if not exist "src\components\support\admin-query-monitor.tsx" (
    echo ❌ Componente admin-query-monitor.tsx não encontrado
    set ERROR=1
)

if not exist "add_itsm_support_system.sql" (
    echo ❌ Migration SQL não encontrada
    set ERROR=1
)

if %ERROR%==1 (
    echo.
    echo ❌ Validação falhou! Arquivos essenciais não encontrados.
    echo    Abortando deploy...
    pause
    exit /b 1
)

echo ✅ Validação OK - Todos os arquivos presentes
echo.

REM ============================
REM ETAPA 2: Backup do Banco
REM ============================
echo [2/8] Criando backup do banco de dados...

set BACKUP_FILE=backup_pre_itsm_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
set BACKUP_FILE=%BACKUP_FILE: =0%

REM Configurar credenciais (ajuste conforme necessário)
set DB_USER=root
set DB_NAME=bidexpert_db

echo Backup será salvo em: %BACKUP_FILE%
echo.
echo ⚠️  IMPORTANTE: Configure as credenciais do banco antes de continuar!
echo    Edite este script e ajuste DB_USER e DB_NAME.
echo.
set /p SKIP_BACKUP="Pular backup? (s/N): "
if /i not "%SKIP_BACKUP%"=="s" (
    REM mysqldump -u %DB_USER% -p %DB_NAME% > %BACKUP_FILE%
    echo ℹ️  Backup manual necessário - comando comentado no script
)
echo.

REM ============================
REM ETAPA 3: Migration SQL
REM ============================
echo [3/8] Aplicando migration SQL...

echo.
echo ⚠️  Execute manualmente:
echo    mysql -u %DB_USER% -p %DB_NAME% ^< add_itsm_support_system.sql
echo.
set /p SQL_DONE="Migration executada? (s/N): "
if /i not "%SQL_DONE%"=="s" (
    echo ❌ Deploy abortado - Execute a migration antes de continuar
    pause
    exit /b 1
)
echo ✅ Migration aplicada
echo.

REM ============================
REM ETAPA 4: Prisma Generate
REM ============================
echo [4/8] Gerando Prisma Client...

call npx prisma generate
if errorlevel 1 (
    echo ❌ Erro ao gerar Prisma Client
    pause
    exit /b 1
)
echo ✅ Prisma Client gerado
echo.

REM ============================
REM ETAPA 5: Executar Testes
REM ============================
echo [5/8] Executando testes...

set /p RUN_TESTS="Executar testes antes do deploy? (S/n): "
if /i not "%RUN_TESTS%"=="n" (
    echo Executando suite de testes...
    call npx playwright test tests/itsm --reporter=list
    if errorlevel 1 (
        echo.
        echo ❌ Alguns testes falharam!
        set /p CONTINUE="Continuar mesmo assim? (s/N): "
        if /i not "%CONTINUE%"=="s" (
            echo Deploy abortado
            pause
            exit /b 1
        )
    ) else (
        echo ✅ Todos os testes passaram!
    )
) else (
    echo ⚠️  Testes pulados
)
echo.

REM ============================
REM ETAPA 6: Limpar Cache
REM ============================
echo [6/8] Limpando cache...

if exist ".next" (
    rmdir /s /q ".next"
    echo ✅ Cache .next removido
)

if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
    echo ✅ Cache node_modules removido
)
echo.

REM ============================
REM ETAPA 7: Build de Produção
REM ============================
echo [7/8] Building aplicação...

call npm run build
if errorlevel 1 (
    echo ❌ Build falhou!
    pause
    exit /b 1
)
echo ✅ Build concluído
echo.

REM ============================
REM ETAPA 8: Deploy Final
REM ============================
echo [8/8] Deploy final...

echo.
echo Escolha o método de deploy:
echo   1. npm start (local)
echo   2. PM2 (servidor)
echo   3. Firebase
echo   4. Vercel
echo   5. Manual
echo.
set /p DEPLOY_METHOD="Método (1-5): "

if "%DEPLOY_METHOD%"=="1" (
    echo Iniciando com npm start...
    npm run start
)

if "%DEPLOY_METHOD%"=="2" (
    echo Iniciando com PM2...
    pm2 stop bidexpert-itsm 2>nul
    pm2 start npm --name "bidexpert-itsm" -- start
    pm2 save
)

if "%DEPLOY_METHOD%"=="3" (
    echo Deploy no Firebase...
    firebase deploy
)

if "%DEPLOY_METHOD%"=="4" (
    echo Deploy no Vercel...
    vercel --prod
)

if "%DEPLOY_METHOD%"=="5" (
    echo Deploy manual selecionado
)

echo.
echo ═══════════════════════════════════════════════════════════════════
echo                      DEPLOY CONCLUÍDO!
echo ═══════════════════════════════════════════════════════════════════
echo.
echo ✅ ITSM-AI Sistema de Suporte
echo ✅ Versão: 1.0.0
echo ✅ Status: EM PRODUÇÃO
echo.
echo 📋 PRÓXIMOS PASSOS:
echo    1. Acessar aplicação e verificar botões flutuantes
echo    2. Testar criação de ticket
echo    3. Verificar painel admin
echo    4. Monitorar logs por 24-48h
echo.
echo 📚 Documentação:
echo    - ITSM_PRODUCTION_DEPLOYMENT.md
echo    - ITSM_QUICK_START.md
echo    - LEIA-ME-ITSM.md
echo.
echo ═══════════════════════════════════════════════════════════════════
echo.

pause
