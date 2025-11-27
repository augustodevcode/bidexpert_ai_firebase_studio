#!/bin/bash
# Script de automação: Seed + Testes 5 Gaps
# ==========================================
# Executa: db:push → seed:v3 → testes playwright

set -e  # Exit on error

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}     🎯 AUTOMAÇÃO: SEED + TESTES 5 GAPS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

# 1. Verificar se servidor está rodando
echo -e "${YELLOW}[1/5] Verificando servidor em :9005...${NC}"
if ! nc -z localhost 9005 2>/dev/null; then
  echo -e "${RED}❌ Servidor não está rodando em :9005${NC}"
  echo -e "${YELLOW}    Inicie com: npm run dev:9005${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Servidor rodando${NC}\n"

# 2. Push do schema
echo -e "${YELLOW}[2/5] Aplicando schema Prisma...${NC}"
npm run db:push
echo -e "${GREEN}✅ Schema aplicado${NC}\n"

# 3. Gerar Prisma Client
echo -e "${YELLOW}[3/5] Gerando Prisma Client...${NC}"
npx prisma generate
echo -e "${GREEN}✅ Prisma Client gerado${NC}\n"

# 4. Seed de dados
echo -e "${YELLOW}[4/5] Fazendo seed de dados simulados...${NC}"
npm run db:seed:v3
echo -e "${GREEN}✅ Seed concluído${NC}\n"

# 5. Testes
echo -e "${YELLOW}[5/5] Executando testes Playwright...${NC}"
PLAYWRIGHT_TEST_BASE_URL=http://localhost:9005 npm run test:e2e tests/e2e/5-gaps-complete.spec.ts

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ AUTOMAÇÃO COMPLETADA COM SUCESSO!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}📊 Ver relatório:${NC}"
echo -e "   npx playwright show-report\n"
