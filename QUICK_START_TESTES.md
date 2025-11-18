# 🚀 QUICK START - EXECUTE OS TESTES AGORA

## 📦 Terminal 1 - Iniciar Aplicação

```bash
npm install
npm run dev
```

Aguarde:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

## 🌱 Terminal 2 - Preparar Dados

```bash
# Compilar e executar seed
npx tsx seed-data-extended-v3.ts
```

Você verá:
```
✨ SEED CONCLUÍDO COM SUCESSO!
📊 RESUMO:
   • Tenants: 3
   • Usuários: 5
   • Leilões: 4
```

## 🎬 Terminal 3 - Instalar Playwright & Executar Testes

```bash
# Instalar browsers (primeira vez)
npx playwright install

# Executar todos os testes com UI (visualizar ao vivo)
npx playwright test tests/e2e/complete-implementation-test.spec.ts --ui
```

Ou sem UI:
```bash
# Modo headless (rápido)
npx playwright test tests/e2e/complete-implementation-test.spec.ts
```

## 📊 Visualizar Relatório

```bash
npx playwright show-report
```

---

## ✨ CREDENCIAIS DE TESTE

| Email | Senha | Roles |
|-------|-------|-------|
| test.leiloeiro@bidexpert.com | Test@12345 | LEILOEIRO, COMPRADOR, ADMIN |
| test.comprador@bidexpert.com | Test@12345 | COMPRADOR |
| admin@bidexpert.com | Test@12345 | ADMIN, SUPER_ADMIN |

---

## ✅ CHECKLIST DE EXECUÇÃO

- [ ] Terminal 1: npm run dev rodando
- [ ] Terminal 2: Seed executado com sucesso
- [ ] Terminal 3: Playwright instalado
- [ ] [ ] Testes executados
- [ ] Relatório visualizado

---

## 🔥 TROUBLESHOOTING RÁPIDO

**"Chromium not found"**
```bash
npx playwright install chromium
```

**"Connection refused"**
```bash
# Verificar se npm run dev está rodando
# Porta 3000 está disponível?
```

**"Database error"**
```bash
# Recriar banco
npx prisma migrate reset --force
npx tsx seed-data-extended-v3.ts
```

---

## 📈 PRÓXIMAS ETAPAS

✅ Após testes passando:
1. Implementar os 5 GAPs principais
2. Adicionar mais testes
3. Deploy em staging

---

**Estimado:** 5-10 minutos
