# 📌 AI RULES - QUICK PIN

**Status:** ✅ ENFORCED | **Updated:** 11/11/2025

---

## 🔴 2 REGRAS CRÍTICAS

### 1️⃣ Multi-Tenant Security
```
✅ Filter TODOS os queries por tenantId
❌ Não fazer cross-tenant access sem 403 Forbidden
📖 Ver: AUDITORIA_MULTITENANT_EXECUTADA.md
```

### 2️⃣ Lazy Compilation vs Pre-Build
```
❌ NEVER: npm run dev (para testes E2E)
✅ ALWAYS: npm run build && npm start (para testes)
✅ OR: node .vscode/run-e2e-tests.js (automático)

Dev Mode (npm run dev):        20-30s/página, testes falham ❌
Production (pre-build):         <100ms/página, testes passam ✅
```

---

## 6️⃣ OUTRAS REGRAS IMPORTANTES

| Regra | Requisito |
|-------|-----------|
| **File Headers** | Docblock em todo `.ts/.tsx` |
| **Design System** | Use semantic tokens APENAS |
| **Testing** | Pre-build antes de E2E |
| **Prisma** | Acesso via `getDatabaseAdapter()` |
| **Non-Regression** | Deleção = autorização explícita |
| **Environment** | `.env` NUNCA deletar |

---

## 📖 LER ANTES DE CODIFICAR

1. `context/AI_PROJECT_RULES.md` (OBRIGATÓRIO)
2. `context/GEMINI.md`
3. `context/instructions.md`

---

## ✅ CHECKLIST RÁPIDO

```
[ ] Regras lidas?
[ ] Multi-tenant OK? (todas queries com tenantId)
[ ] Será E2E test? (use pre-build, não dev mode)
[ ] Arquivo novo? (adicione docblock)
[ ] Estilos? (use design system tokens)
[ ] Prisma? (via getDatabaseAdapter)
[ ] Deletando? (peça autorização)
[ ] .env? (NÃO deletar)
```

---

**📌 PIN THIS IN CHAT FOR EVERY SESSION**
