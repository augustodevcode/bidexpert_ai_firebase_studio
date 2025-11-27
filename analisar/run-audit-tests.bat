@echo off
REM run-audit-tests.bat
REM Script para executar todos os testes do Audit Trail Module (Windows)

echo.
echo 🧪 Executando Testes do Audit Trail Module...
echo.

echo 1. Testando Logging Automático...
call npx playwright test tests/e2e/audit/audit-logging.spec.ts --reporter=list

echo.
echo 2. Testando Change History Tab (UI)...
call npx playwright test tests/e2e/audit/change-history-tab.spec.ts --reporter=list

echo.
echo 3. Testando Permissões e Controle de Acesso...
call npx playwright test tests/e2e/audit/audit-permissions.spec.ts --reporter=list

echo.
echo ✅ Testes concluídos!
echo.
echo Para ver o relatório completo:
echo npx playwright show-report

pause
