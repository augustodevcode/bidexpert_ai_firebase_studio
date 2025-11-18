# 🎯 GUIA DE EXECUÇÃO - TESTES PLAYWRIGHT COMPLETOS

## 📋 PRÉ-REQUISITOS

- Node.js 18+
- npm ou yarn
- Banco de dados local (MySQL/PostgreSQL) configurado
- Firebase emulator (opcional)

## 🚀 PASSO 1: PREPARAR DADOS DE TESTE

### 1.1 Executar seed-data-extended-v3.ts

Este script popula o banco com dados simulados de todos os cenários implementados:

```bash
# Compile TypeScript se necessário
npm run build

# Execute o seed com dados estendidos
npx tsx prisma/scripts/seed-data-extended-v3.ts
```

**O que este seed cria:**
- ✅ 3 tenants diferentes (isolamento de dados)
- ✅ 5 usuários com múltiplos roles (leiloeiro + comprador)
- ✅ 10 leilões em diversos estados (planejado, ativo, encerrado)
- ✅ 50+ lotes com dados estendidos
- ✅ 200+ lances de teste
- ✅ Histórico de auditoria completo
- ✅ Configurações parametrizáveis

### 1.2 Validar dados inseridos

```bash
# Conectar ao banco e verificar
npm run db:studio

# Ou via query:
npx prisma db execute --stdin < scripts/validate-seed.sql
```

## 🎬 PASSO 2: CONFIGURAR AMBIENTE

### 2.1 Criar arquivo .env.test

```bash
# Copiar template
cp .env.example .env.test

# Editar com seus valores
# PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
# DATABASE_URL=mysql://user:password@localhost:3306/bidexpert_test
# FIREBASE_PROJECT_ID=bidexpert-630df
# JWT_SECRET=seu-secret-de-teste
```

### 2.2 Variáveis obrigatórias

```env
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
DATABASE_URL=mysql://test:test@localhost:3306/bidexpert_test
NODE_ENV=test
LOG_LEVEL=debug
```

## ✅ PASSO 3: INSTALAR DEPENDÊNCIAS

```bash
# Instalar dependências do Playwright
npm install

# Instalar browsers do Playwright (IMPORTANTE!)
npx playwright install

# Verificar instalação
npx playwright --version
```

## 🔧 PASSO 4: INICIAR APLICAÇÃO

### 4.1 Em um terminal, inicie o servidor:

```bash
# Desenvolvimento
npm run dev

# Ou produção
npm run build && npm run start
```

Aguarde até ver:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### 4.2 Em outro terminal, verifique se está acessível:

```bash
curl http://localhost:3000
```

## 🧪 PASSO 5: EXECUTAR TESTES

### 5.1 Executar todos os testes

```bash
# Com interface visual (recomendado para primeiro teste)
npx playwright test tests/e2e/complete-implementation-test.spec.ts --ui

# Sem interface (CI/CD)
npx playwright test tests/e2e/complete-implementation-test.spec.ts
```

### 5.2 Executar grupo específico

```bash
# Apenas autenticação
npx playwright test -g "Autenticação & Autorização"

# Apenas gestão de leilões
npx playwright test -g "Gestão de Leilões"

# Apenas lances
npx playwright test -g "Gestão de Lances"
```

### 5.3 Executar em modo debug

```bash
# Com debugger interativo
npx playwright test tests/e2e/complete-implementation-test.spec.ts --debug

# Com trace (para debugging avançado)
npx playwright test tests/e2e/complete-implementation-test.spec.ts --trace on
```

### 5.4 Executar em headless mode (sem interface)

```bash
npx playwright test tests/e2e/complete-implementation-test.spec.ts --headed=false
```

## 📊 VISUALIZAR RESULTADOS

### 6.1 Após execução, visualizar relatório HTML

```bash
# Abrir relatório em navegador
npx playwright show-report
```

### 6.2 Visualizar traces

```bash
# Se habilitou trace
npx playwright show-trace test-results/complete-implementation-test.spec.ts-Autenticação\ &\ Autorização\ Multi-Tenant-deve\ permitir\ login\ de\ leiloeiro/trace.zip
```

### 6.3 Screenshots de falhas

Automaticamente salvos em `test-results/` quando teste falha.

## 🎯 TESTES COBERTURA

| Módulo | Testes | Status |
|--------|--------|--------|
| Autenticação | 3 | ✅ |
| Gestão de Leilões | 4 | ✅ |
| Gestão de Lances | 3 | ✅ |
| Histórico & Auditoria | 2 | ✅ |
| Tempo Real | 2 | ✅ |
| Segurança | 3 | ✅ |
| Performance | 3 | ✅ |
| APIs Externas | 1 | ✅ |
| Admin | 2 | ✅ |
| Relatórios | 2 | ✅ |
| ERP | 1 | ✅ |
| Performance (Stress) | 1 | ✅ |
| Error Handling | 2 | ✅ |

**Total: 30+ testes E2E completos**

## 🔍 TROUBLESHOOTING

### Problema: "Chromium not found"
```bash
# Solução:
npx playwright install chromium
```

### Problema: "Timeout esperando navegação"
```bash
# Aumentar timeout no arquivo:
test.setTimeout(60000); // 60 segundos
```

### Problema: "Failed to connect to localhost:3000"
```bash
# Verificar:
1. npm run dev está rodando?
2. Porta 3000 está livre?
3. Firewall está bloqueando?
```

### Problema: "Database connection error"
```bash
# Verificar:
1. MySQL está rodando?
2. Credenciais em .env.test estão corretas?
3. Banco 'bidexpert_test' existe?

# Recriar banco:
npx prisma migrate reset --force
npx tsx prisma/scripts/seed-data-extended-v3.ts
```

### Problema: Testes ficam lentos
```bash
# Aumentar limite de workers:
npx playwright test --workers=4

# Ou diminuir (para sistema com poucos recursos):
npx playwright test --workers=1
```

## 📈 PRÓXIMAS ETAPAS

Após testes passando com sucesso:

1. ✅ **Implementar os 5 GAPs principais:**
   - [ ] Lances Automáticos (com botão de ativação)
   - [ ] Marketing & Banners
   - [ ] Analytics completo
   - [ ] APIs Google (imagens, busca)
   - [ ] Suporte ERP

2. ✅ **Parametrização por Admin:**
   - [ ] Painel de controle de funcionalidades
   - [ ] Configurações por tenant
   - [ ] Permissões granulares

3. ✅ **Testes de carga:**
   - [ ] 1000+ usuários simultâneos
   - [ ] 10000+ lances por segundo

4. ✅ **CI/CD integration:**
   - [ ] GitHub Actions
   - [ ] Deploy automático

## 📞 SUPORTE

Para problemas:
1. Verificar logs: `logs/` folder
2. Verificar teste-results: `test-results/` folder
3. Executar com `--debug` para trace completo

## ✨ DICAS DE PERFORMANCE

```bash
# Rodar apenas testes críticos
npx playwright test -g "Autenticação|Lances"

# Rodar com paralelização máxima
npx playwright test --workers=8

# Gerar relatório JSON para CI/CD
npx playwright test --reporter=json --reporter=list
```

---

**Última atualização:** 2025-11-14
**Versão de Testes:** 1.0.0
**Status:** ✅ Pronto para execução
