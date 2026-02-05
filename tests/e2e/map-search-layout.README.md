# Testes E2E - Modal de Busca no Mapa

## 📋 Pré-requisitos

Antes de executar os testes, certifique-se de que:

1. **Servidor está rodando na porta 9005:**
   ```powershell
   # Terminal 1 - Iniciar servidor
   npm run dev:9005
   ```

2. **Banco de dados está acessível:**
   ```powershell
   # Verificar conexão
   $env:DATABASE_URL="mysql://root:M%21nh%40S3nha2025@localhost:3306/bidexpert_demo"
   npx tsx scripts/verify-full-seed-status.ts
   ```

## 🧪 Executar Testes

### Executar todos os testes do modal:
```powershell
# Terminal 2 - Executar testes
npx playwright test tests/e2e/map-search-layout.spec.ts --headed
```

### Executar teste específico:
```powershell
# Apenas monitoramento de console
npx playwright test tests/e2e/map-search-layout.spec.ts -g "without console errors"

# Apenas verificação de erros de rede
npx playwright test tests/e2e/map-search-layout.spec.ts -g "network errors"
```

### Modo debug (com inspetor Playwright):
```powershell
npx playwright test tests/e2e/map-search-layout.spec.ts --debug
```

## 🔍 Estratégia de Observabilidade

Os testes implementam **triangulação de erros** conforme especificado em `AGENTS.md`:

### 1. Monitoramento de Console (Browser)
- ✅ Captura erros JavaScript (`TypeError`, `ReferenceError`)
- ✅ Detecta falhas de `fetch` (`Failed to fetch`)
- ✅ Registra `pageerror` events
- ✅ Filtra erros críticos vs warnings de libs externas

### 2. Monitoramento de Rede (HTTP)
- ✅ Detecta respostas 4xx (client errors)
- ✅ Detecta respostas 5xx (server errors)
- ✅ Reporta URLs e status codes

### 3. Triangulação
```
Browser Console Error (Client) 
    ↓
Network Error (4xx/5xx)
    ↓
Server Logs (Node/Next.js)
    ↓
Solução Precisa
```

## 📊 Cobertura de Testes

| Teste | Valida | Observabilidade |
|-------|--------|-----------------|
| `modal opens on page load` | Dialog visível, Header presente | Console errors |
| `70/30 grid layout` | Grid com proporção correta | Console errors |
| `renders list items with map density` | Densidade "map" aplicada | Console errors + logs |
| `closes modal when close button` | Modal fecha sem erros | Console errors |
| `detects network errors` | Sem erros HTTP 500+ | Network monitoring |

## 🐛 Diagnóstico de Falhas

### Erro: `ERR_CONNECTION_REFUSED`
**Causa:** Servidor não está rodando na porta 9005.
**Solução:** Executar `npm run dev:9005` antes dos testes.

### Erro: `Console errors detected`
**Causa:** Erros JavaScript na aplicação.
**Solução:** 
1. Verificar logs detalhados no output do teste
2. Abrir DevTools no Simple Browser
3. Executar teste em modo `--debug`

### Erro: `Network errors detected (500+)`
**Causa:** Erros no servidor backend.
**Solução:**
1. Verificar logs do servidor (`npm run dev:9005`)
2. Checar conexão com banco de dados
3. Validar seed de dados

## 📝 Exemplo de Output Esperado

```
✅ modal opens on page load and shows header with title (without console errors)
✅ modal has 70/30 grid layout with map and sidebar (without console errors)
✅ renders list items with map density (without console errors)
✅ closes modal when close button is clicked (without console errors)
✅ detects and reports network errors (4xx/5xx)

5 passed (12.3s)
```

## 🔗 Referências

- **Estratégia de Observabilidade:** `.github/copilot-instructions.md` (seção 4.1)
- **Workflow de Testes:** `AGENTS.md`
- **Configuração Playwright:** `playwright.config.ts`
