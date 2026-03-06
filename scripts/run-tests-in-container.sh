#!/bin/bash
# ============================================================
# run-tests-in-container.sh - Executa Playwright dentro do container
# ============================================================
# USO: docker exec <container> bash /app/scripts/run-tests-in-container.sh [test-filter]
# EXEMPLO: docker exec bidexpert-dev1-app-1 bash /app/scripts/run-tests-in-container.sh smoke
# ============================================================

set -e

DEV_ID="${DEV_ID:-unknown}"
TEST_FILTER="${1:-smoke}"
CONFIG="playwright.container.config.ts"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "============================================"
echo " BidExpert - Playwright Test Runner"
echo " DEV: ${DEV_ID}"
echo " Filter: ${TEST_FILTER}"
echo " Config: ${CONFIG}"
echo " Timestamp: ${TIMESTAMP}"
echo "============================================"

# Determinar test file/project baseado no filtro
case "$TEST_FILTER" in
  smoke)
    TEST_MATCH="tests/e2e/smoke-test.spec.ts"
    PROJECT="dev-${DEV_ID}-smoke"
    ;;
  e2e)
    TEST_MATCH=""
    PROJECT="dev-${DEV_ID}-e2e"
    ;;
  *)
    TEST_MATCH="$TEST_FILTER"
    PROJECT="dev-${DEV_ID}-smoke"
    ;;
esac

# Garantir xauth disponível
if ! command -v xauth &> /dev/null; then
  echo "[runner] Instalando xauth..."
  apt-get update -qq && apt-get install -y -qq xauth > /dev/null 2>&1
fi

# Pre-warm: Fazer curl na app para triggerar lazy compilation
echo "[runner] Pre-warming Next.js compilação..."
curl -s -o /dev/null http://localhost:3000/ || true
curl -s -o /dev/null http://localhost:3000/auth/login || true
curl -s -o /dev/null http://localhost:3000/search || true
sleep 2

# Executar testes (desabilitar set -e para capturar exit code)
echo "[runner] Executando testes..."
set +e
if [ -n "$TEST_MATCH" ]; then
  xvfb-run --auto-servernum npx playwright test "$TEST_MATCH" \
    --config="$CONFIG" \
    --project="$PROJECT" \
    --reporter=list
else
  xvfb-run --auto-servernum npx playwright test \
    --config="$CONFIG" \
    --project="$PROJECT" \
    --reporter=list
fi

EXIT_CODE=$?
set -e

# Gerar evidência
echo ""
echo "============================================"
echo " Resultado: $([ $EXIT_CODE -eq 0 ] && echo 'PASSED ✓' || echo 'FAILED ✗')"
echo " Dev: ${DEV_ID}"
echo " Timestamp: ${TIMESTAMP}"
echo " Exit Code: ${EXIT_CODE}"
echo "============================================"

# Salvar evidência JSON
cat > "/app/test-results/evidence-${DEV_ID}-${TIMESTAMP}.json" <<EOF
{
  "devId": "${DEV_ID}",
  "timestamp": "${TIMESTAMP}",
  "testFilter": "${TEST_FILTER}",
  "project": "${PROJECT}",
  "exitCode": ${EXIT_CODE},
  "status": "$([ $EXIT_CODE -eq 0 ] && echo 'passed' || echo 'failed')",
  "config": "${CONFIG}",
  "containerHostname": "$(hostname)"
}
EOF

echo "[runner] Evidência salva em: /app/test-results/evidence-${DEV_ID}-${TIMESTAMP}.json"

exit $EXIT_CODE
