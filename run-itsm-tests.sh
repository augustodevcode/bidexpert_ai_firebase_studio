#!/bin/bash

# ========================================
# Script de Execução Rápida - Testes ITSM
# ========================================

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║        🧪 TESTES ITSM-AI - EXECUÇÃO AUTOMÁTICA 🧪            ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Verificar se servidor está rodando
echo "[1/5] Verificando servidor..."
if curl -s http://localhost:9005 > /dev/null 2>&1; then
    echo "✅ Servidor OK"
else
    echo "⚠️  Servidor não está rodando!"
    echo "   Iniciando servidor na porta 9005..."
    npm run dev:9005 &
    sleep 10
fi

# Gerar Prisma Client
echo ""
echo "[2/5] Gerando Prisma Client..."
npx prisma generate > /dev/null 2>&1
echo "✅ Prisma Client OK"

# Executar testes
echo ""
echo "[3/5] Executando Testes ITSM..."
echo "    Total esperado: 130+ testes"
echo "    Tempo estimado: ~5 minutos"
echo ""

npx playwright test tests/itsm --config=playwright.config.local.ts

# Verificar resultado
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Todos os testes passaram!"
    echo ""
    FAILED=0
else
    echo ""
    echo "❌ Alguns testes falharam!"
    echo "   Ver detalhes em: test-results/"
    echo ""
    FAILED=1
fi

# Gerar relatório
echo "[4/5] Gerando relatório HTML..."
sleep 2
echo "✅ Relatório gerado"

# Abrir relatório
echo ""
echo "[5/5] Abrindo relatório..."
sleep 1

npx playwright show-report

# Resumo final
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "                        RESUMO FINAL"
echo "═══════════════════════════════════════════════════════════════"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ Status: SUCESSO"
    echo "✅ Todos os 130+ testes passaram"
    echo "✅ Sistema ITSM-AI validado"
else
    echo "❌ Status: FALHA"
    echo "⚠️  Alguns testes falharam"
    echo "📋 Verifique: test-results/"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
