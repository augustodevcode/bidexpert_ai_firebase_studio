# 🚨 Monitoramento de Erros - BidExpert AI

## 📋 Visão Geral

Este projeto possui **duas** soluções de monitoramento de erros que criam issues automaticamente no GitHub:

1. **Sentry** (Principal - Recomendada)
2. **Vercel Log Drains** (Alternativa/Complementar)

## 🎯 Configuração

### 1. Sentry (Recomendado)

#### Passo 1: Criar Projeto no Sentry

1. Acesse: https://sentry.io/signup/
2. Crie organização (ou use existente)
3. Crie novo projeto:
   - Platform: Next.js
   - Nome: `bidexpert-ai-firebase-studio`

#### Passo 2: Configurar Variáveis de Ambiente no Vercel

```bash
# No Vercel Dashboard → Settings → Environment Variables
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/yyy
SENTRY_DSN=https://xxx@sentry.io/yyy
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=bidexpert-ai-firebase-studio
SENTRY_AUTH_TOKEN=your-auth-token
```

#### Passo 3: Integração GitHub

```bash
npm run setup:sentry
```

Siga as instruções no terminal para conectar Sentry ao GitHub.

#### Passo 4: Configuração Manual no Sentry

1. Acesse https://sentry.io/settings/[your-org]/integrations/github/
2. Clique em "Install" ou "Configure"
3. Autorize acesso ao repositório `augustodevcode/bidexpert_ai_firebase_studio`
4. Configure Alert Rules:
   - Acesse: https://sentry.io/organizations/[your-org]/alerts/rules/
   - Clique em "Create Alert Rule"
   - Configure:
     * **When**: "An event is seen"
     * **Filter**: `level:error OR level:fatal`
     * **Then perform these actions**: "Create a new issue in GitHub"
     * **Repository**: augustodevcode/bidexpert_ai_firebase_studio
     * **Labels**: `["bug", "sentry", "production-error"]`
     * **Assignee**: augustodevcode (opcional)
5. Configure Rate Limiting:
   - Em "Alert Rule Details", configure:
     * **Action interval**: 24 hours (mesmo erro só cria 1 issue por dia)
     * **Issue Grouping**: By fingerprint (agrupa erros similares)

### 2. Vercel Log Drains

#### Passo 1: Gerar Secret

```bash
openssl rand -base64 32
```

#### Passo 2: Configurar no Vercel

```bash
# Adicionar variáveis
vercel env add LOG_DRAIN_SECRET production
vercel env add GITHUB_TOKEN production

# Configurar drain
npm run setup:log-drain
```

#### Passo 3: Configuração Manual no Vercel

1. Acesse https://vercel.com/dashboard → Seu Projeto → Settings → Log Drains
2. Clique em "Add Log Drain"
3. Configure:
   - **Name**: GitHub Issues Error Logger
   - **Drain URL**: https://your-domain.vercel.app/api/log-drain
   - **Secret**: Cole o secret gerado no Passo 1
   - **Sources**: Selecione `lambda`, `edge`, `build`, `static`
   - **Sampling Rate**: 1.0 (100%)
4. Clique em "Add Log Drain"

## 🔍 Como Funciona

### Sentry

- ✅ Captura erros automaticamente (client + server + edge)
- ✅ Cria issues no GitHub para cada erro único
- ✅ Agrupa erros similares
- ✅ Inclui stack traces, breadcrumbs, contexto
- ✅ Session replay para reproduzir o erro
- ✅ Performance monitoring (opcional)

**Fluxo:**
1. Erro ocorre na aplicação (client ou server)
2. Sentry captura e processa
3. Verifica se já existe issue para esse erro
4. Se não existe, cria nova issue no GitHub automaticamente
5. Se existe, adiciona comentário com nova ocorrência

### Log Drains

- ✅ Recebe logs do Vercel em tempo real
- ✅ Filtra apenas erros (ignora warnings/info)
- ✅ Cria issues no GitHub
- ✅ Deduplicação (1 issue por erro a cada 24h)
- ✅ Funciona para erros de build, lambda e edge

**Fluxo:**
1. Erro ocorre no Vercel (lambda, edge, build)
2. Vercel envia log para a API `/api/log-drain`
3. API filtra apenas erros
4. Gera fingerprint do erro para deduplicação
5. Verifica cache (se erro já foi reportado nas últimas 24h)
6. Se novo, cria issue no GitHub

## 📊 Issues Criadas

Ambos os sistemas criam issues com:

- **Labels**: `bug`, `production-error`, `automated`, `sentry` ou `vercel`
- **Título**: `[Production Error] Mensagem do erro`
- **Corpo**: 
  - Stack trace completo
  - Timestamp do erro
  - Contexto (deployment, path, status code)
  - Links para Sentry (se aplicável)
- **Deduplicação**: Mesmo erro não cria múltiplas issues

### Exemplo de Issue Criada pelo Sentry:

```markdown
## 🔴 Error: Cannot read property 'id' of undefined

**Environment:** production
**Release:** v1.2.3
**URL:** https://bidexpert.vercel.app/auction/123
**User:** anonymous

### Stack Trace:
```
TypeError: Cannot read property 'id' of undefined
  at AuctionPage (app/auction/[id]/page.tsx:45:20)
  at ...
```

### Breadcrumbs:
1. User navigated to /auction/123
2. Fetched auction data
3. Render failed

**Sentry Issue:** https://sentry.io/issues/1234567890
**Session Replay:** https://sentry.io/replays/abcd1234
```

### Exemplo de Issue Criada pelo Log Drain:

```markdown
## 🔴 Erro de Produção Detectado

**Timestamp:** 2024-02-19T01:30:00.000Z
**Source:** lambda
**Type:** lambda-error
**Deployment:** dpl_abc123xyz
**Path:** /api/auctions/create

### Stack Trace / Message:
```
Error: Database connection failed
  at PrismaClient.connect (/var/task/.next/server/chunks/123.js:456)
  ...
```

### Log ID:
`log_xyz789abc`

---
**Criado automaticamente via Vercel Log Drains**
```

## 🛠️ Manutenção

### Limpar Cache de Erros (Log Drains)

O cache é limpo automaticamente a cada 24h. Para limpar manualmente:

```typescript
// Não há endpoint público, mas o cache é gerenciado internamente
// Reiniciar o deployment limpa o cache
vercel --prod
```

### Desabilitar Temporariamente

#### Sentry:
```bash
# Remover DSN do Vercel
vercel env rm NEXT_PUBLIC_SENTRY_DSN production
vercel env rm SENTRY_DSN production

# Rebuild
vercel --prod
```

#### Log Drains:
1. Acesse: https://vercel.com/dashboard → Settings → Log Drains
2. Clique em "Remove" ao lado do drain configurado

### Ajustar Rate Limiting

#### Sentry:
- Acesse https://sentry.io/organizations/[your-org]/alerts/rules/
- Edite a regra existente
- Altere "Action interval" para o tempo desejado (ex: 12h, 48h)

#### Log Drains:
- Edite o arquivo `src/app/api/log-drain/route.ts`
- Altere a constante `CACHE_DURATION`:
```typescript
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 horas
```
- Faça deploy da alteração

## 📈 Monitoramento

### Dashboards

- **Sentry Dashboard**: https://sentry.io/organizations/[your-org]/issues/
  - Visualize todos os erros
  - Filtre por ambiente, release, usuário
  - Veja tendências e performance
  
- **GitHub Issues**: https://github.com/augustodevcode/bidexpert_ai_firebase_studio/issues?q=label:production-error
  - Visualize issues criadas automaticamente
  - Filtre por labels: `sentry`, `vercel`, `bug`
  - Feche issues resolvidas

### Métricas Importantes

#### Sentry:
- **Error Rate**: Erros por minuto/hora/dia
- **Affected Users**: Usuários impactados
- **Release Health**: Comparação entre releases
- **Performance**: Tempo de resposta, throughput

#### Log Drains:
- **Issues Created**: Quantidade de issues criadas
- **Unique Errors**: Erros únicos detectados
- **Cache Hit Rate**: Eficiência da deduplicação

## 🔧 Troubleshooting

### Sentry não está capturando erros

1. Verifique se `NEXT_PUBLIC_SENTRY_DSN` está configurado no Vercel
2. Verifique se o build incluiu os arquivos de configuração Sentry:
   ```bash
   ls -la .next/server/sentry*
   ```
3. Verifique os logs do Vercel para erros de inicialização do Sentry
4. Teste localmente:
   ```bash
   # Adicione no .env.local
   NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/yyy
   npm run build && npm start
   ```

### Log Drains não está criando issues

1. Verifique se `LOG_DRAIN_SECRET` está configurado no Vercel
2. Verifique se `GITHUB_TOKEN` tem permissões de `repo`
3. Teste o endpoint manualmente:
   ```bash
   curl -X POST https://your-domain.vercel.app/api/log-drain \
     -H "Authorization: Bearer YOUR_SECRET" \
     -H "Content-Type: application/json" \
     -d '[{"id":"test","message":"Test error","timestamp":1234567890,"source":"lambda","type":"lambda-error"}]'
   ```
4. Verifique os logs do Vercel Function:
   ```bash
   vercel logs api/log-drain
   ```

### Issues duplicadas sendo criadas

#### Sentry:
- Verifique a configuração de "Issue Grouping" na Alert Rule
- Ajuste o "Action interval" para um período maior

#### Log Drains:
- Verifique se o cache está funcionando
- Aumente `CACHE_DURATION` se necessário
- Verifique se há múltiplas instâncias do Log Drain configuradas

### Muitas issues sendo criadas (falsos positivos)

#### Sentry:
- Adicione filtros na Alert Rule:
  ```
  level:error AND NOT message:"ResizeObserver loop"
  ```
- Configure "beforeSend" em `sentry.client.config.ts` para ignorar erros específicos

#### Log Drains:
- Edite o filtro em `src/app/api/log-drain/route.ts`:
  ```typescript
  const errorLogs = logs.filter(log => 
    log.type === "lambda-error" || 
    log.type === "edge-error" ||
    // Adicione mais condições aqui
    (log.message && log.message.includes("critical"))
  );
  ```

## 📚 Recursos Adicionais

### Sentry
- [Documentação Oficial](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [GitHub Integration](https://docs.sentry.io/product/integrations/source-code-mgmt/github/)
- [Alert Rules](https://docs.sentry.io/product/alerts/alert-types/)

### Vercel
- [Log Drains Documentation](https://vercel.com/docs/observability/log-drains)
- [Vercel API](https://vercel.com/docs/rest-api)

### GitHub
- [Octokit REST API](https://octokit.github.io/rest.js/)
- [Issues API](https://docs.github.com/en/rest/issues)

## 🚀 Next Steps

1. **Configure Slack/Discord Integration**: Receba notificações em tempo real
2. **Add PagerDuty**: Para alertas críticos on-call
3. **Custom Error Boundaries**: Capture erros React com contexto adicional
4. **Source Maps Upload**: Configure upload automático para Sentry
5. **User Feedback**: Adicione widget de feedback do Sentry

## 📝 Notas Importantes

- **Performance**: Sentry tem overhead mínimo (< 1% CPU)
- **Custo**: Plano gratuito Sentry: 5k erros/mês
- **Rate Limiting**: GitHub API tem limite de 5000 requests/hora
- **Privacy**: Sentry mascara dados sensíveis automaticamente
- **Compliance**: Ambas as soluções são GDPR compliant

---

**Última Atualização**: 2024-02-19
**Versão**: 1.0.0
**Mantido por**: Equipe BidExpert
