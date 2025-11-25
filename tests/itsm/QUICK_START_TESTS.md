# ⚡ Guia Rápido - Executar Testes ITSM

## 🚀 Início Rápido (3 minutos)

### 1. Preparar Ambiente

```bash
# Certifique-se que o servidor está rodando
npm run dev:9005
```

### 2. Executar Todos os Testes

```bash
# Executar suite completa
npx playwright test tests/itsm
```

### 3. Ver Relatório

```bash
# Abrir relatório HTML
npx playwright show-report
```

---

## 📋 Comandos Úteis

### Executar Testes Específicos

```bash
# Sistema de Suporte (botões, chat, tickets)
npx playwright test tests/itsm/itsm-support-system.spec.ts

# Admin Tickets (painel de gerenciamento)
npx playwright test tests/itsm/itsm-admin-tickets.spec.ts

# Query Monitor (monitor de queries SQL)
npx playwright test tests/itsm/itsm-query-monitor.spec.ts

# Detecção de Bugs (17 testes de bugs)
npx playwright test tests/itsm/itsm-bug-detection.spec.ts

# API Tests (testes de endpoints)
npx playwright test tests/itsm/itsm-api.spec.ts
```

### Modos de Execução

```bash
# Modo UI (interativo)
npx playwright test tests/itsm --ui

# Modo Debug (passo a passo)
npx playwright test tests/itsm --debug

# Modo Headed (ver navegador)
npx playwright test tests/itsm --headed

# Modo Específico (1 teste)
npx playwright test tests/itsm -g "deve exibir botões flutuantes"
```

### Opções Avançadas

```bash
# Com screenshots sempre
npx playwright test tests/itsm --screenshot=on

# Com vídeos sempre
npx playwright test tests/itsm --video=on

# Com traces (debug detalhado)
npx playwright test tests/itsm --trace=on

# Executar em paralelo
npx playwright test tests/itsm --workers=4

# Com retry (tentar novamente se falhar)
npx playwright test tests/itsm --retries=2
```

---

## ✅ Verificação Rápida

### Antes de Executar

```bash
# 1. Servidor rodando?
curl http://localhost:9005

# 2. Banco de dados OK?
npx prisma db push

# 3. Prisma Client atualizado?
npx prisma generate
```

### Após Executar

**✅ Sucesso**:
```
Running 130 tests using 1 worker
130 passed (5m)
```

**❌ Falhas**:
- Ver screenshots em `test-results/`
- Ver vídeos em `test-results/`
- Ver traces com `npx playwright show-trace`

---

## 🐛 Troubleshooting Rápido

### Erro: "Cannot find module"
```bash
npm install
npx playwright install
```

### Erro: "Timeout waiting for element"
```bash
# Aumentar timeout
npx playwright test tests/itsm --timeout=180000
```

### Erro: "Connection refused"
```bash
# Verificar se servidor está rodando
npm run dev:9005
```

### Erro: "Database connection failed"
```bash
# Verificar .env
cat .env | grep DATABASE_URL

# Testar conexão
npx prisma db push
```

---

## 📊 Estatísticas Esperadas

| Métrica | Valor |
|---------|-------|
| **Total de Testes** | 130+ |
| **Tempo de Execução** | ~5 min |
| **Taxa de Sucesso** | 100% |
| **Testes E2E** | 50+ |
| **Testes de API** | 20+ |
| **Testes de Bugs** | 20+ |

---

## 🎯 Checklist Rápido

- [ ] Servidor em `http://localhost:9005`
- [ ] Banco de dados configurado
- [ ] Migration ITSM executada
- [ ] Variáveis de ambiente OK
- [ ] Executar: `npx playwright test tests/itsm`
- [ ] Ver relatório: `npx playwright show-report`
- [ ] Verificar: 130+ testes ✅

---

## 📞 Ajuda

**Documentação Completa**: `README_TESTS.md`  
**Features BDD**: `features/*.feature`  
**Exemplos de Código**: Arquivos `.spec.ts`

---

**Tempo Total**: ~8 minutos (setup + execução + relatório)  
**Dificuldade**: ⭐ Fácil  
**Requer**: Node.js + npm + Playwright

✅ **TESTES PRONTOS PARA EXECUTAR!**
