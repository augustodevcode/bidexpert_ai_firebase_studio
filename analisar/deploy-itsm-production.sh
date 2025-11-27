#!/bin/bash

# ==========================================
# ITSM-AI - Script de Deploy para Produção
# ==========================================

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║         🚀 ITSM-AI - DEPLOY PARA PRODUÇÃO 🚀                     ║"
echo "║                                                                  ║"
echo "║         ATENÇÃO: Este script fará deploy em produção!           ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Confirmar deploy
read -p "Deseja continuar com o deploy? (s/N): " CONFIRM
if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
    echo "Deploy cancelado."
    exit 0
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "INICIANDO PROCESSO DE DEPLOY"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# ============================
# ETAPA 1: Validação Pré-Deploy
# ============================
echo "[1/8] Validando estrutura de arquivos..."

ERROR=0

if [ ! -f "src/components/support/floating-support-buttons.tsx" ]; then
    echo "❌ Componente floating-support-buttons.tsx não encontrado"
    ERROR=1
fi

if [ ! -f "src/components/support/support-chat-modal.tsx" ]; then
    echo "❌ Componente support-chat-modal.tsx não encontrado"
    ERROR=1
fi

if [ ! -f "src/components/support/admin-query-monitor.tsx" ]; then
    echo "❌ Componente admin-query-monitor.tsx não encontrado"
    ERROR=1
fi

if [ ! -f "add_itsm_support_system.sql" ]; then
    echo "❌ Migration SQL não encontrada"
    ERROR=1
fi

if [ $ERROR -eq 1 ]; then
    echo ""
    echo "❌ Validação falhou! Arquivos essenciais não encontrados."
    echo "   Abortando deploy..."
    exit 1
fi

echo "✅ Validação OK - Todos os arquivos presentes"
echo ""

# ============================
# ETAPA 2: Backup do Banco
# ============================
echo "[2/8] Criando backup do banco de dados..."

BACKUP_FILE="backup_pre_itsm_$(date +%Y%m%d_%H%M%S).sql"

# Configurar credenciais (ajuste conforme necessário)
DB_USER="root"
DB_NAME="bidexpert_db"

echo "Backup será salvo em: $BACKUP_FILE"
echo ""
echo "⚠️  IMPORTANTE: Configure as credenciais do banco antes de continuar!"
echo "   Edite este script e ajuste DB_USER e DB_NAME."
echo ""
read -p "Pular backup? (s/N): " SKIP_BACKUP
if [ "$SKIP_BACKUP" != "s" ] && [ "$SKIP_BACKUP" != "S" ]; then
    # mysqldump -u $DB_USER -p $DB_NAME > $BACKUP_FILE
    echo "ℹ️  Backup manual necessário - comando comentado no script"
fi
echo ""

# ============================
# ETAPA 3: Migration SQL
# ============================
echo "[3/8] Aplicando migration SQL..."

echo ""
echo "⚠️  Execute manualmente:"
echo "   mysql -u $DB_USER -p $DB_NAME < add_itsm_support_system.sql"
echo ""
read -p "Migration executada? (s/N): " SQL_DONE
if [ "$SQL_DONE" != "s" ] && [ "$SQL_DONE" != "S" ]; then
    echo "❌ Deploy abortado - Execute a migration antes de continuar"
    exit 1
fi
echo "✅ Migration aplicada"
echo ""

# ============================
# ETAPA 4: Prisma Generate
# ============================
echo "[4/8] Gerando Prisma Client..."

npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Erro ao gerar Prisma Client"
    exit 1
fi
echo "✅ Prisma Client gerado"
echo ""

# ============================
# ETAPA 5: Executar Testes
# ============================
echo "[5/8] Executando testes..."

read -p "Executar testes antes do deploy? (S/n): " RUN_TESTS
if [ "$RUN_TESTS" != "n" ] && [ "$RUN_TESTS" != "N" ]; then
    echo "Executando suite de testes..."
    npx playwright test tests/itsm --reporter=list
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ Alguns testes falharam!"
        read -p "Continuar mesmo assim? (s/N): " CONTINUE
        if [ "$CONTINUE" != "s" ] && [ "$CONTINUE" != "S" ]; then
            echo "Deploy abortado"
            exit 1
        fi
    else
        echo "✅ Todos os testes passaram!"
    fi
else
    echo "⚠️  Testes pulados"
fi
echo ""

# ============================
# ETAPA 6: Limpar Cache
# ============================
echo "[6/8] Limpando cache..."

if [ -d ".next" ]; then
    rm -rf .next
    echo "✅ Cache .next removido"
fi

if [ -d "node_modules/.cache" ]; then
    rm -rf node_modules/.cache
    echo "✅ Cache node_modules removido"
fi
echo ""

# ============================
# ETAPA 7: Build de Produção
# ============================
echo "[7/8] Building aplicação..."

npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build falhou!"
    exit 1
fi
echo "✅ Build concluído"
echo ""

# ============================
# ETAPA 8: Deploy Final
# ============================
echo "[8/8] Deploy final..."

echo ""
echo "Escolha o método de deploy:"
echo "  1. npm start (local)"
echo "  2. PM2 (servidor)"
echo "  3. Firebase"
echo "  4. Vercel"
echo "  5. Manual"
echo ""
read -p "Método (1-5): " DEPLOY_METHOD

case $DEPLOY_METHOD in
    1)
        echo "Iniciando com npm start..."
        npm run start
        ;;
    2)
        echo "Iniciando com PM2..."
        pm2 stop bidexpert-itsm 2>/dev/null
        pm2 start npm --name "bidexpert-itsm" -- start
        pm2 save
        ;;
    3)
        echo "Deploy no Firebase..."
        firebase deploy
        ;;
    4)
        echo "Deploy no Vercel..."
        vercel --prod
        ;;
    5)
        echo "Deploy manual selecionado"
        ;;
    *)
        echo "Opção inválida"
        exit 1
        ;;
esac

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "                     DEPLOY CONCLUÍDO!"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "✅ ITSM-AI Sistema de Suporte"
echo "✅ Versão: 1.0.0"
echo "✅ Status: EM PRODUÇÃO"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "   1. Acessar aplicação e verificar botões flutuantes"
echo "   2. Testar criação de ticket"
echo "   3. Verificar painel admin"
echo "   4. Monitorar logs por 24-48h"
echo ""
echo "📚 Documentação:"
echo "   - ITSM_PRODUCTION_DEPLOYMENT.md"
echo "   - ITSM_QUICK_START.md"
echo "   - LEIA-ME-ITSM.md"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""
