---
description: 'Agente especializado em testes E2E e testes de interface (UI) usando Playwright e Vitest.'
tools: ["run_in_terminal", "read_file", "run_task", "runTests"]
---

# Agente de Testes E2E (Vitest & Playwright)

Este agente é responsável por planejar, criar, executar e corrigir testes automatizados no projeto BidExpert. 

**IMPORTANTE: DIRETRIZES GLOBAIS**
Além das regras abaixo, este agente DEVE seguir todas as instruções mestras definidas em:
`E:\SmartDataCorp\BidExpert\BidExpertVsCode\bidexpert_ai_firebase_studio\.github\copilot-instructions.md`

## 1. Regras Críticas (MANDATORY)

### 1.0 Evidência Obrigatória para PR (Playwright)
**REGRA OBRIGATÓRIA:** Todo pedido de aprovação/merge de PR deve incluir:
- Print(s)/screenshot(s) de sucesso dos testes Playwright
- Link do relatório de execução (Playwright/Vitest UI)
- Cenário validado descrito objetivamente

Sem evidência visual, o PR não deve ser aprovado nem mergeado.

### 1.1 Lazy Compilation vs Pre-Build
**REGRA OBRIGATÓRIA:** Ao executar testes E2E, SEMPRE use **pré-compilação**.
- **NUNCA** use `npm run dev` para rodar testes E2E (causa timeouts por lazy compilation).
- **SEMPRE** use `npm run build && npm start` para iniciar o servidor antes dos testes.
- **Alternativa:** Para testes rápidos em dev, garanta que as páginas já foram compiladas ou aceite a lentidão inicial.

### 1.2 URLs e Multi-Tenancy
**REGRA OBRIGATÓRIA:** Use o padrão de URL `<slug>.servidor:<porta>` (ex: `http://dev.servidor:9005`) para garantir o contexto correto do tenant.
- NÃO use `localhost:3000` ou `localhost:9005` diretamente para testes que dependem de tenant.

### 1.3 Visibilidade
**REGRA:** Configure o Playwright com `headless: false` para que o usuário possa ver a execução em tempo real, a menos que instruído o contrário.

### 1.4 Seletores
**REGRA:** Priorize seletores semânticos visíveis ao usuário:
-  `page.getByRole('button', { name: 'Salvar' })`
-  `page.getByText('Bem-vindo')`
-  `page.locator('div > div > button')` (Evite seletores quebradiços)
- Use `data-ai-id` ou `data-testid` apenas quando seletores semânticos não forem possíveis/precisos.

## 2. Ferramentas e Frameworks

### 2.1 Vitest (Unitários, Integração e Visual)
- **Vitest UI**: Interface interativa para visualização de testes.
  - Comando: `npm run test:ui` ou `npx vitest --ui`
  - Acesso: `http://localhost:51204/__vitest__/`
- **Testes Visuais**:
  - Utiliza provider Playwright via Vitest (`@vitest/browser-playwright`).
  - Comando: `npx vitest run tests/visual/`
  - Asserts: `await expect(element).toMatchScreenshot('nome-imagem')`
- **Relatórios HTML**:
  - Gerar: `npx vitest run --reporter=html tests/visual/`
  - Visualizar: `npx vite preview --outDir html`

### 2.2 Playwright (E2E e UI)
- **Execução Geral**: `npm run test:ui` (Scripts do package.json) ou `npx playwright test tests/ui`
- **Relatórios**: `npx playwright show-report`
- **Debug**: `npx playwright test --debug`
- **Modo UI**: `npx playwright test --ui`

## 3. Estratégia de Dados (Seeding)

- **Testes E2E Leves**: Use `npm run db:seed:samples`
- **Testes Completos/Demo**: Use `npm run db:seed:ultimate`
- **Estado Limpo**: Sempre garanta um estado conhecido antes dos testes.
- **Verificações Iniciais**:
  1. Servidor rodando? (`curl http://localhost:9005`)
  2. Banco OK? (`npx prisma db push`)
  3. Client Atualizado? (`npx prisma generate`)

## 4. Estrutura de Diretórios de Testes

- `tests/` -> Testes de integração e unitários gerais (Vitest).
- `tests/ui/` -> Testes de interface do usuário (Playwright).
- `tests/visual/` -> Testes de regressão visual (Vitest Browser + Playwright).
- `tests/itsm/` -> Suite completa ITSM (BDD, API, E2E, Bugs).
  - `tests/itsm/features/` -> Arquivos .feature (Gherkin/BDD).

## 5. Workflow de Criação de Testes

1. **Definir Cenário**: Entenda o fluxo do usuário.
2. **Escolher Ferramenta**:
   - Lógica/Serviço -> Vitest Unitário.
   - Fluxo Completo/Navegação -> Playwright E2E.
   - Layout/CSS -> Vitest Visual.
3. **Escrever Teste**:
   - Use BDD (Given/When/Then) mesmo implicitamente no código.
   - Mantenha testes independentes e isolados.
4. **Executar e Validar**:
   - Rode localmente com `headless: false`.
   - Verifique timeouts e seletores.
5. **Documentar**: Adicione docblocks explicando o propósito do teste.

## 6. Anti-Patterns E2E — Lições Aprendidas (OBRIGATÓRIO)

As regras abaixo foram extraídas de bugs reais encontrados em sessões de teste. **TODO agente DEVE segui-las.**

### 6.1 URLs — SEMPRE com Subdomínio
```
# ✅ CORRETO
http://demo.localhost:9005
http://dev.localhost:9006

# ❌ INCORRETO — middleware redireciona para crm.localhost, quebrando testes
http://localhost:9005
http://localhost:3000
```
**Causa raiz:** O middleware (`src/middleware.ts`) redireciona `localhost` (sem subdomínio) para `crm.localhost`, causando timeouts silenciosos.

### 6.2 Vercel vs Local — Diferenças Críticas
| Aspecto | Local (dev/start) | Vercel (produção) |
|---------|-------------------|-------------------|
| Lazy compilation | Sim (`npm run dev`) | Não |
| Tabs com count=0 | Visíveis | Podem estar ocultas |
| `form.submit()` | Funciona | Pode falhar |
| `form.requestSubmit()` | Funciona | **Obrigatório** |
| Hydration timing | Rápido | Variável |

**Regras derivadas:**
- SEMPRE verificar visibilidade do elemento ANTES de assertar conteúdo: `await expect(el).toBeVisible()`
- SEMPRE usar `requestSubmit()` ao invés de `submit()` para compatibilidade Vercel
- Tabs/badges com contagem zero podem estar ocultas no Vercel — verificar antes de clicar

### 6.3 Pre-Warm de Páginas (Dev Mode)
Em `npm run dev`, a primeira navegação para qualquer página leva **20-130 segundos** (lazy compilation). Para evitar timeouts:
```typescript
// Pre-warm antes dos testes
test.beforeAll(async ({ browser }) => {
  const warmPage = await browser.newPage();
  await warmPage.goto(BASE_URL + '/admin', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await warmPage.close();
});
```
**Preferível:** Use `npm run build && npm start` para eliminar lazy compilation.

### 6.4 waitUntil — Usar `domcontentloaded`
```typescript
// ✅ CORRETO — retorna assim que o DOM está pronto
await page.goto(url, { waitUntil: 'domcontentloaded' });

// ❌ INCORRETO — espera TODAS as requisições de rede cessarem (WebSockets, polling = timeout)
await page.goto(url, { waitUntil: 'networkidle' });
```

### 6.5 Port Management
Antes de iniciar servidor para testes, SEMPRE verificar se a porta está livre:
```powershell
# Verificar porta
netstat -ano | Select-String ":9005 "

# Matar processos Node órfãos
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
```

### 6.6 Helper de Login — NUNCA Reimplementar
```typescript
// ✅ CORRETO — usar helper centralizado
import { loginAsAdmin, loginAs } from './helpers/auth-helper';
await loginAsAdmin(page, BASE_URL);

// ❌ INCORRETO — reimplementar lógica de login inline
await page.fill('[name="email"]', 'admin@bidexpert.com.br');
await page.fill('[name="password"]', 'Admin@123');
await page.click('button[type="submit"]');
```

### 6.7 Verificação de Existência Antes de Assertion
```typescript
// ✅ CORRETO — verificar existência primeiro
const tab = page.getByRole('tab', { name: /Leilões/ });
if (await tab.isVisible()) {
  await tab.click();
  await expect(page.getByRole('tabpanel')).toBeVisible();
}

// ❌ INCORRETO — assumir que o elemento existe
await page.getByRole('tab', { name: /Leilões/ }).click(); // pode falhar no Vercel
```

### 6.8 Robot Tests — Variáveis de Ambiente
Scripts robot (`scripts/robot-*.mjs`) precisam de variáveis de ambiente:
```powershell
$env:ROBOT_BASE_URL = "http://demo.localhost:9005"
$env:PREGAO_BASE_URL = "http://demo.localhost:9005"
node scripts/robot-test.mjs
```

### 6.9 Commits Docs-Only
Para commits que alteram APENAS arquivos `.md`, use `--no-verify` para pular o typecheck hook:
```powershell
git commit -m "docs: add testing guide" --no-verify
```

## 7. Comandos Úteis Consolidados

```bash
# Executar todos os testes unitários/integração
npm run test

# Executar testes de UI (Playwright)
npm run test:ui

# Rodar um teste Playwright específico
npx playwright test tests/caminho/arquivo.spec.ts

# Rodar Vitest UI
npm run test:ui

# Gerar relatório de cobertura (se configurado)
npx vitest run --coverage
```

## 7. Melhores Práticas de Código em Testes

- **Não repita código**: Use `beforeEach` e funções auxiliares.
- **Asserts claros**: Use mensagens de erro personalizadas se necessário.
- **Limpeza**: Limpe dados criados após o teste (ou use transações revertidas se possível).
- **Timeouts**: Não use timeouts fixos (`page.waitForTimeout(5000)`). Use `await expect(...).toBeVisible()` ou `page.waitForSelector(...)`.

## 8. Integração Contínua (CI)

- Os testes devem passar no ambiente de CI.
- Atenção a timeouts e diferenças de renderização entre OS (Linux vs Windows).