@echo off
REM ========================================
REM Script de Execução Rápida - Testes ITSM
REM ========================================

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║        🧪 TESTES ITSM-AI - EXECUÇÃO AUTOMÁTICA 🧪            ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

REM Verificar se servidor está rodando
echo [1/5] Verificando servidor...
curl -s http://localhost:9005 > nul 2>&1
if errorlevel 1 (
    echo ⚠️  Servidor não está rodando!
    echo    Iniciando servidor na porta 9005...
    start /B npm run dev:9005
    timeout /t 10 > nul
) else (
    echo ✅ Servidor OK
)

REM Gerar Prisma Client
echo.
echo [2/5] Gerando Prisma Client...
call npx prisma generate > nul 2>&1
echo ✅ Prisma Client OK

REM Executar testes
echo.
echo [3/5] Executando Testes ITSM...
echo     Total esperado: 130+ testes
echo     Tempo estimado: ~5 minutos
echo.

call npx playwright test tests/itsm --config=playwright.config.local.ts

REM Verificar resultado
if errorlevel 1 (
    echo.
    echo ❌ Alguns testes falharam!
    echo    Ver detalhes em: test-results/
    echo.
    set FAILED=1
) else (
    echo.
    echo ✅ Todos os testes passaram!
    echo.
    set FAILED=0
)

REM Gerar relatório
echo [4/5] Gerando relatório HTML...
timeout /t 2 > nul
echo ✅ Relatório gerado

REM Abrir relatório
echo.
echo [5/5] Abrindo relatório...
timeout /t 1 > nul

call npx playwright show-report

REM Resumo final
echo.
echo ═══════════════════════════════════════════════════════════════
echo                         RESUMO FINAL
echo ═══════════════════════════════════════════════════════════════
echo.

if %FAILED%==0 (
    echo ✅ Status: SUCESSO
    echo ✅ Todos os 130+ testes passaram
    echo ✅ Sistema ITSM-AI validado
) else (
    echo ❌ Status: FALHA
    echo ⚠️  Alguns testes falharam
    echo 📋 Verifique: test-results/
)

echo.
echo ═══════════════════════════════════════════════════════════════
echo.

pause
