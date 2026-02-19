#!/bin/bash

# Script para configurar Log Drain no Vercel
# Requer: vercel CLI instalado e autenticado

PROJECT_ID="bidexpert_ai_firebase_studio"
DRAIN_URL="https://your-domain.vercel.app/api/log-drain"
SECRET="your-log-drain-secret-here"

echo "🔧 Configurando Vercel Log Drain..."

# Criar Log Drain
vercel env add LOG_DRAIN_SECRET production <<< "$SECRET"

# Adicionar drain endpoint
curl -X POST "https://api.vercel.com/v1/integrations/log-drains" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"GitHub Issues Error Logger\",
    \"type\": \"json\",
    \"url\": \"$DRAIN_URL\",
    \"secret\": \"$SECRET\",
    \"projectId\": \"$PROJECT_ID\",
    \"sources\": [\"lambda\", \"edge\", \"build\", \"static\"],
    \"sampling\": {
      \"rate\": 1.0
    }
  }"

echo "✅ Log Drain configurado!"
echo "URL: $DRAIN_URL"
