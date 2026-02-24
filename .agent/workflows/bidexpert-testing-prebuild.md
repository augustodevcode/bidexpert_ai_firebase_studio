---
description: Mandatory pre-build workflow for testing and CI/CD.
---

# 🚀 Testing & Build Protocol

Este workflow garante que os testes E2E não falhem por causa da compilação lazy do Next.js.

## 🛑 REGRA CRÍTICA: Pre-Build vs Lazy Compilation
- **NÃO** use `npm run dev` para testes E2E.
- O timeout de compilação em dev mode (20-30s) estoura o timeout de teste (2.4s).

## 🛠️ Procedimento de Teste

### 1. Preparação (Obrigatório)
// turbo
```powershell
npm run build
npm start
```
*Aguarde o servidor iniciar em modo produção.*

### 2. Execução de Testes (Playwright)
```powershell
npx playwright test
```
*Ou para um teste específico:*
```powershell
npx playwright test tests/e2e/seu-teste.spec.ts --headed
```

### 3. Automação (Script Recomendado)
// turbo
```powershell
node .vscode/run-e2e-tests.js
```
Este script orquestra todo o fluxo: Build -> Start Server -> Run Tests -> Clean up.

## 🧪 Vitest UI & Relatórios
- Abra o relatório de testes: `npx playwright show-report`.
- Use o Vitest UI para testes unitários conforme documentação técnica.

## 🔍 Diagnóstico (Playwright Logs)
Sempre capture logs do console e erros de rede:
- `page.on('console')`
- `page.on('pageerror')`
- Cruzes logs do navegador com logs do servidor.
