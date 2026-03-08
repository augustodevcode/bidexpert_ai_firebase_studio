#!/bin/bash
# ============================================================
# docker-entrypoint-dev.sh - Entrypoint para containers de dev
# ============================================================
# Garante dependências (xauth, xvfb), gera Prisma client,
# e inicia o Next.js dev server.
# ============================================================

set -e

echo "[entrypoint] DEV_ID=${DEV_ID:-unknown}"
echo "[entrypoint] Verificando dependências..."

# Garantir xauth/xvfb instalados (caso cache de build não tenha pego)
if ! command -v xauth &> /dev/null; then
  echo "[entrypoint] Instalando xauth..."
  apt-get update -qq && apt-get install -y -qq xauth > /dev/null 2>&1
fi

if ! command -v Xvfb &> /dev/null; then
  echo "[entrypoint] Instalando xvfb..."
  apt-get update -qq && apt-get install -y -qq xvfb > /dev/null 2>&1
fi

# Garantir que o schema.prisma usa MySQL (containers de dev usam MySQL)
# O volume mount pode ter o schema PostgreSQL do deploy Vercel
if grep -q 'provider = "postgresql"' prisma/schema.prisma 2>/dev/null; then
  echo "[entrypoint] Corrigindo provider para MySQL (container usa MySQL)..."
  sed -i 's/provider = "postgresql"/provider = "mysql"/' prisma/schema.prisma
  # Também corrige o header/comentário se existir
  sed -i 's/POSTGRESQL VERSION/MYSQL VERSION (Auto-fixed by entrypoint)/' prisma/schema.prisma
fi

# Regenerar Prisma client (volume mount pode ter schema diferente)
echo "[entrypoint] Gerando Prisma client..."
npx prisma generate 2>/dev/null || echo "[entrypoint] WARN: Prisma generate falhou (pode ser esperado)"

# Verificar se as tabelas existem, senão rodar db push
echo "[entrypoint] Verificando tabelas no banco..."
TABLE_CHECK=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema='${MYSQL_DATABASE:-bidexpert_dev}'" 2>/dev/null | grep -o '[0-9]*' | head -1 || echo "0")
if [ "$TABLE_CHECK" = "0" ] || [ -z "$TABLE_CHECK" ]; then
  echo "[entrypoint] Nenhuma tabela encontrada. Executando prisma db push..."
  npx prisma db push --accept-data-loss 2>/dev/null || echo "[entrypoint] WARN: db push falhou"
fi

# Instalar Playwright browsers se ausente
if ! npx playwright --version > /dev/null 2>&1; then
  echo "[entrypoint] Instalando Playwright..."
  npx playwright install chromium --with-deps
fi

echo "[entrypoint] Iniciando Next.js dev server na porta ${PORT:-3000}..."
exec npm run dev -- --hostname 0.0.0.0
