# Guia Completo: Correção do Ambiente e Execução de Testes Playwright

## STATUS ATUAL
- Prisma client precisa ser gerado
- Banco de dados precisa de seed com dados de teste
- Aplicação não inicia por falta de inicialização do Prisma
- 0 testes executando

## SOLUÇÃO: 5 PASSOS CRÍTICOS

### PASSO 1: Gerar Prisma Client
```bash
cd E:\SmartDataCorp\BidExpert\BidExpertVsCode\bidexpert_ai_firebase_studio
npx prisma generate
```
**Resultado esperado:** Arquivo `.next/generated` e `node_modules/@prisma/client` atualizados

### PASSO 2: Verificar/Aplicar Migrações MySQL
```bash
npx prisma migrate dev --name init
# ou se já existir:
npx prisma db push
```
**Resultado esperado:** Schema MySQL sincronizado com schema.prisma

### PASSO 3: Popular Banco com Dados de Teste Estendidos
```bash
npx ts-node --transpile-only prisma/seed-data-extended-v3.ts
```
**Resultado esperado:** 
- 1 Tenant (id: 1, name: "BidExpert Tenant")
- 5+ Categorias (Lotes)
- 10+ Leilões em vários estágios
- 30+ Lotes
- 50+ Lances simulados
- 20+ Usuários com diferentes perfis

### PASSO 4: Limpar Cache do Prisma
```bash
rmdir /s /q node_modules\.prisma
npm install
```
**Resultado esperado:** Novo client Prisma gerado, sem lock file

### PASSO 5: Executar Testes Playwright
```bash
# Terminal 1: Iniciar dev server
npm run dev

# Terminal 2: Rodar testes
npm run test:e2e:realtime
```

## ARQUIVOS CRÍTICOS ALTERADOS

### 1. `/src/lib/prisma.ts`
- ✅ Singleton pattern correto
- ✅ Caching global implementado
- ✅ Sem modificações necessárias

### 2. `/src/repositories/category.repository.ts`
- ✅ Import correto do prisma
- ✅ Métodos do LotCategory funcionando
- ✅ Sem modificações necessárias

### 3. `/src/services/platform-settings.service.ts`
- ✅ ensureTenantExists() implementado
- ✅ getSettings() com fallback para tenant padrão
- ✅ Sem modificações necessárias

## DIAGRAMA DO FLUXO DE INICIALIZAÇÃO

```
┌─ npm run dev ─────────────────────┐
│                                   │
│ ├─ Next.js inicia servidor       │
│ ├─ Prisma client carregado       │
│ ├─ RootLayout inicia             │
│ │   ├─ getLayoutData()           │
│ │   │   ├─ getPlatformSettings() │
│ │   │   │   └─ ensureTenantExists(1)
│ │   │   │       ├─ Busca tenant   │
│ │   │   │       └─ Se não existe, │
│ │   │   │           cria padrão   │
│ │   │   └─ getSettings(1) retorna │
│ │   │       PlatformSettings      │
│ │   └─ getLotCategories()         │
│ │       └─ CategoryRepository     │
│ │           .findAll()            │
│ └─ Página carrega                │
│                                   │
└─ Playwright browser testa        ─┘
```

## SINAIS DE SUCESSO

### ✅ Prisma Gerado
- Arquivo: `node_modules/@prisma/client/index.d.ts`
- Contém: type LotCategory, type Tenant, etc

### ✅ Banco Sincronizado
- MySQL tem tabelas: `User`, `Tenant`, `LotCategory`, `Lot`, `Auction`, etc
- Dados de seed presentes

### ✅ Servidor Inicia
```
npm run dev
# Sem erros "Cannot read properties of undefined"
# Logs mostram: "✓ Ready in 1.23s"
```

### ✅ Admin Dashboard Carrega
```
http://localhost:3000/admin/dashboard
# 200 OK (não 500 error)
# Página renderiza com dados reais
```

### ✅ Testes Passam
```
npm run test:e2e:realtime
# Total: 14 scenarios
# Passed: 14 (ou com falhas conhecidas documentadas)
# Failed: 0 (idealmente)
```

## TROUBLESHOOTING

### "Cannot read properties of undefined (reading 'lotCategory')"
**Causa:** Prisma client não gerado
**Solução:** `npx prisma generate`

### "Erro ao verificar/criar tenant"
**Causa:** Usuário não tem direitos MySQL ou BD offline
**Solução:** 
```bash
# Verificar conexão:
npx prisma db push --skip-generate
```

### "Timeout waiting 120000ms from config.webServer"
**Causa:** Dev server não levanta em tempo (120s)
**Solução:**
```bash
# Rodar servidor manual em outro terminal:
npm run dev:9005
# Esperar "Ready in Xs"
# Depois rodar testes
```

### "No tests found"
**Causa:** Arquivo de teste não encontrado
**Solução:**
```bash
# Verificar arquivo existe:
ls tests/e2e/realtime-features.spec.ts
# Se não existe, criar a partir do template
```

## CHECKLIST PRÉ-TESTE

- [ ] `npx prisma generate` executado sem erros
- [ ] `npx ts-node prisma/seed-data-extended-v3.ts` completou
- [ ] `npm run dev` inicia sem erros de Prisma
- [ ] `curl http://localhost:3000/admin/dashboard` retorna 200
- [ ] `.env` tem DATABASE_URL válida
- [ ] `node_modules/@prisma/client` existe
- [ ] `playwright.config.local.ts` tem baseURL correto
- [ ] `tests/e2e/realtime-features.spec.ts` existe

## PRÓXIMOS PASSOS APÓS TESTES

1. **Se todos os testes passam:**
   - Documentar baseline
   - Commitar seed script
   - Adicionar ao CI/CD

2. **Se alguns falham:**
   - Coletar logs detalhados
   - Comparar com SNAPSHOT esperado
   - Corrigir fixtures ou testes

3. **Se nenhum executa:**
   - Voltar ao passo 1
   - Verificar cada dependência
   - Validar URLs e portas

## TEMPO ESTIMADO
- Passo 1-2: 2 minutos
- Passo 3: 30 segundos
- Passo 4: 1 minuto
- Passo 5: 5-10 minutos

**TOTAL: ~10-15 minutos**

---

**Autor:** GitHub Copilot CLI
**Data:** 2025-11-14
**Status:** Pronto para execução manual
