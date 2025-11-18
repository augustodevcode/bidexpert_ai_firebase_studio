#!/bin/bash
# validate-implementation.sh - Script para validar todas as implementações

echo ""
echo "========================================"
echo "BidExpert - Validação Completa"
echo "========================================"
echo ""

# 1. Validar estrutura de arquivos
echo "[1/6] Validando estrutura de arquivos..."
files=(
  "src/services/realtime-bids.service.ts"
  "src/app/admin/settings/realtime-config.tsx"
  "tests/e2e/realtime-features.spec.ts"
  "public/manifest.json"
  "scripts/db-metrics.ts"
  "scripts/mock-integrations.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ $file encontrado"
  else
    echo "  ✗ $file NOT FOUND"
  fi
done

# 2. Validar prisma schema
echo ""
echo "[2/6] Validando Prisma schema..."
npx prisma validate
if [ $? -eq 0 ]; then
  echo "  ✓ Schema válido"
else
  echo "  ✗ Erros no schema"
  exit 1
fi

# 3. Gerar Prisma client
echo ""
echo "[3/6] Gerando Prisma client..."
npx prisma generate
if [ $? -eq 0 ]; then
  echo "  ✓ Prisma client gerado"
else
  echo "  ✗ Erro ao gerar Prisma client"
  exit 1
fi

# 4. Build do projeto
echo ""
echo "[4/6] Buildando projeto (isso pode levar alguns minutos)..."
npm run build
if [ $? -eq 0 ]; then
  echo "  ✓ Build bem-sucedido"
else
  echo "  ✗ Erro durante o build"
  exit 1
fi

# 5. Mensagem sobre DB metrics
echo ""
echo "[5/6] Testando scripts auxiliares..."
echo "  • Para testar DB metrics, execute: npm run db:metrics"
echo "  • Para testar mocks de integração, execute: npm run poc:mocks"

# 6. Mensagem sobre Playwright
echo ""
echo "[6/6] Próximo: Executar testes Playwright"
echo ""
echo "========================================"
echo "Para rodar os testes E2E:"
echo "========================================"
echo ""
echo "  1. Em um terminal, inicie o servidor:"
echo "     npm run dev:9005"
echo ""
echo "  2. Em outro terminal, rode os testes:"
echo "     npm run test:e2e:realtime"
echo ""
echo "  Ou para UI interativo:"
echo "     npm run test:e2e:ui"
echo ""
echo "========================================"
echo ""
