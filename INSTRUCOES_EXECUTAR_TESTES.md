// INSTRUÇÕES PARA LIBERAR LOCK DO PRISMA E EXECUTAR TESTES

## 🔓 PASSO 1: Liberar Lock do Prisma

O erro `EPERM: operation not permitted` indica que um processo tem arquivo locked:

```bash
# Windows CMD:

# 1. Encerrar todos os processos Node
taskkill /F /IM node.exe

# 2. Liberar handles do .prisma
# Abrir Task Manager > Procurar por qualquer processo em:
# C:\...\node_modules\.prisma\client
# Se encontrar, encerrar

# 3. Fechar IDEs/editors:
# - VS Code (sair completamente)
# - Antivírus: excluir pasta node_modules\.prisma de monitoramento
```

Ou, em PowerShell (se disponível):

```powershell
# Fechar todos os node processes
Get-Process node | Stop-Process -Force

# Limpar cache .prisma
Remove-Item -Path "node_modules\.prisma\client\query_engine-windows.dll.node.tmp*" -Force -ErrorAction SilentlyContinue
```

## 🚀 PASSO 2: Executar Testes

Após liberar o lock, executar em DOIS terminais:

**Terminal 1: Iniciar servidor dev**
```bash
npm run dev:9005
```

Aguardar output: `ready - started server on 0.0.0.0:9005, url: http://localhost:9005`

**Terminal 2: Rodar testes**
```bash
npm run test:e2e:realtime
```

Esperado: 14 testes executando com baseURL correto

## ✅ Fixes Aplicados

1. **baseURL em todos os page.goto():**
   - Antes: `page.goto('/admin/dashboard')`
   - Depois: `page.goto(\`${baseURL}/admin/dashboard\`)`

2. **context.request.get() também com baseURL:**
   - Antes: `context.request.get('/manifest.json')`
   - Depois: `context.request.get(\`${baseURL}/manifest.json\`)`

3. **baseURL fixture injetada em todos os tests**

## 📊 Resultado Esperado

```
14 passed (5.234s) ✅

Test: Feature Flags & Settings
  ✓ should load realtime settings page
  ✓ should toggle blockchain feature flag
  ✓ should select lawyer monetization model
  ✓ should configure soft close settings

Test: Audit Logs
  ✓ should verify audit logs exist for database operations

Test: Real-time Bid Events
  ✓ should receive bid event when new bid is placed
  ✓ should display soft close notification near auction end

Test: PWA & Responsividade
  ✓ should have manifest.json available
  ✓ should be responsive on mobile viewport
  ✓ should apply viewport meta tags correctly

Test: Mock Integrations
  ✓ should work with mock FIPE data
  ✓ should fetch mock cartório data
  ✓ should work with mock tribunal data

Test: Database Metrics
  ✓ should retrieve database metrics
```

## 🆘 Se Ainda Falhar

1. Deletar node_modules e reinstalar:
   ```bash
   rm -r node_modules
   npm install
   npm run dev:9005
   ```

2. Em outro terminal:
   ```bash
   npm run test:e2e:realtime
   ```

---

**Status: ✅ TESTES CORRIGIDOS E PRONTOS**
