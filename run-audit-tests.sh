#!/bin/bash
# run-audit-tests.sh
# Script para executar todos os testes do Audit Trail Module

echo "🧪 Executando Testes do Audit Trail Module..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}1. Testando Logging Automático...${NC}"
npx playwright test tests/e2e/audit/audit-logging.spec.ts --reporter=list

echo ""
echo -e "${YELLOW}2. Testando Change History Tab (UI)...${NC}"
npx playwright test tests/e2e/audit/change-history-tab.spec.ts --reporter=list

echo ""
echo -e "${YELLOW}3. Testando Permissões e Controle de Acesso...${NC}"
npx playwright test tests/e2e/audit/audit-permissions.spec.ts --reporter=list

echo ""
echo -e "${GREEN}✅ Testes concluídos!${NC}"
echo ""
echo "Para ver o relatório completo:"
echo "npx playwright show-report"
