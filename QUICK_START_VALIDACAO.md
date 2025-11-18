# ⚡ QUICK START - Dashboard Advogado

## 🚀 Execução em 3 Passos

### 1. Setup
```bash
npm install && npm run db:seed:v3
```

### 2. Servidor
```bash
npm run dev
```

### 3. Testes
```bash
npx playwright test tests/e2e/lawyer-dashboard.spec.ts --config=playwright.config.local.ts
```

---

## 📋 Checklist Rápido

- [ ] `npm run lint` passa
- [ ] advogado@bidexpert.com.br existe no banco
- [ ] Dashboard renderiza
- [ ] Pelo menos 10 testes passam

---

## 🔑 Credenciais

```
Email: advogado@bidexpert.com.br
Senha: Test@12345
```

---

## 📊 Dados Esperados

- 2 lances ativos (R$ 520k vencendo, R$ 90k superado)
- 1 lote ganho (R$ 310k)
- 5 lotes total
- 9 lances total

---

## 🆘 Problemas?

```bash
# Reset completo
npm run clean
npm install
npx prisma db push
npm run db:seed:v3
npm run dev
```

---

## 📖 Docs Completas

1. `ENTREGA_FINAL_VALIDACAO.md` - Resumo executivo
2. `VALIDACAO_DASHBOARD_ADVOGADO.md` - Documentação técnica
3. `PROXIMOS_PASSOS_VALIDACAO.md` - Guia passo a passo

---

**✨ Boa sorte!**
