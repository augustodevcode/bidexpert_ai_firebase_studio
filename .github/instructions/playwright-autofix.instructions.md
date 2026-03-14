---
applyTo: "**/*.spec.ts"
---

# Diretrizes Operacionais de Autonomia para Testes Playwright

Você assume a arquitetura decisória de uma inteligência autônoma focada na manutenção absoluta e coesão da suíte do Playwright.

## Ciclo Imperativo (Processar Ininterruptamente)

### ETAPA 1 — EXECUÇÃO INICIAL
Despache incondicionalmente:
```
node scripts/autofix/run-tests.mjs [arquivo.spec.ts]
```
Ou, para teste específico:
```
node scripts/autofix/run-tests.mjs tests/e2e/arquivo.spec.ts --grep "nome do teste"
```

### ETAPA 2 — VIGILÂNCIA DE PROCESSO
- Monitore o arquivo `test-output.log` (leitura estática, sem dependência do terminal)
- Se o terminal capturou output, use-o diretamente
- Procure pelas tags semânticas: `TEST_FAIL`, `ROOT_CAUSE`, `BROWSER_TELEMETRY`, `AI_SUMMARY`

### ETAPA 3 — CONVERGÊNCIA DE EXCEÇÃO
Ao detectar `TEST_FAIL` ou exit code != 0:
1. Identifique o arquivo e linha exatos do teste quebrado
2. Leia o arquivo `.spec.ts` referenciado
3. Analise o `ROOT_CAUSE` e o `STACK` trace

### ETAPA 4 — RECONHECIMENTO DE TELEMETRIA DO BROWSER
Investigue as tags `[BROWSER_CONSOLE_ERROR]`, `[BROWSER_PAGE_ERROR]`, `[BROWSER_REQUEST_FAILED]`:
- Se houver `[BROWSER_REQUEST_FAILED]` com status 500+, o problema é no backend, não no seletor
- Se houver `[BROWSER_PAGE_ERROR]` com TypeError/ReferenceError, o componente React tem bug
- Se houver `[BROWSER_CONSOLE_ERROR]` com "hydration", é mismatch SSR/CSR
- Se não houver telemetria extra, o problema é puramente no seletor ou timing do teste

Quando disponível, use `browser_console_messages` do MCP Playwright para obter logs diretamente.

### ETAPA 4.1 — DIAGNÓSTICO DE INFRAESTRUTURA ANTES DE EDITAR CÓDIGO
Antes de corrigir seletor, componente ou server action, classifique a falha:
- Se `page.goto` retornar `net::ERR_CONNECTION_REFUSED` em 2 ou mais rotas seguidas, trate como processo morto, OOM ou porta errada.
- Se o stack/log apontar para a raiz do workspace enquanto a task usa worktree, o servidor está errado.
- Se `/_next/static/*` responder `404` ou MIME `text/html`, o runtime ativo está inconsistente para browser automation.
- Se o login ficar preso em `/auth/login`, verifique `Dev: Auto-login`, tenant/subdomínio e probes em `/auth/login` e `/api/public/tenants` antes de alterar a tela.

**Ação obrigatória:** reinicie o servidor correto e reexecute o PRIMEIRO teste que falhou antes de modificar código.

### ETAPA 5 — SÍNTESE DE CORREÇÃO
Munido com a causa discriminada:
- **Seletor inexistente**: Atualize o seletor usando `getByRole()`, `getByText()` ou `data-ai-id`
- **Timeout de elemento**: Adicione `waitForSelector` ou `waitForResponse` adequado; NUNCA use `waitForTimeout`
- **Erro de rede/API**: Não corrija o teste, reporte que o backend precisa de fix
- **Flakiness de timing**: Use `toBeVisible()` com `expect.poll()` quando necessário
- **Server action com `input`/`ctx` undefined em múltiplas telas**: inspecione o wrapper compartilhado (`safe-action`) antes de criar patches duplicados
- Edite silenciosamente e sem aprovação humana

### ETAPA 6 — AFERIÇÃO CÍCLICA
Re-execute APENAS o teste corrigido:
```
node scripts/autofix/run-tests.mjs tests/e2e/arquivo.spec.ts --grep "nome exato do teste"
```
Repita ETAPAs 2-6 até convergir para 0 falhas.

### ETAPA 7 — POST MORTEM FINAL
Ao atingir 0 falhas, publique registro tabular:

| Teste | Causa Raiz | Origem | Correção Aplicada |
|-------|-----------|--------|-------------------|
| ... | ... | Browser/Seletor/API | ... |

## Regras Adicionais

### Seletores — Prioridade
1. `getByRole()` com nome acessível
2. `getByText()` para conteúdo visível
3. `locator('[data-ai-id="..."]')` para elementos com tag AI
4. `locator('css=...')` como último recurso

### Anti-patterns Proibidos
- NUNCA inserir `page.waitForTimeout(N)` como fix de timing
- NUNCA ignorar `[BROWSER_REQUEST_FAILED]` — sempre correlacionar com a falha
- NUNCA aumentar timeout como correção permanente
- NUNCA modificar o componente React para satisfazer o teste (modifique o teste)

### Telemetria Obrigatória
Se o fixture `browser-telemetry.fixture.ts` estiver disponível, use-o:
```typescript
import { test, expect } from '../fixtures/browser-telemetry.fixture';
```
Em vez de:
```typescript
import { test, expect } from '@playwright/test';
```

### Limites de Iteração
- Máximo 5 iterações de correção por teste individual
- Se após 5 tentativas o teste não passar, reporte ao humano com evidências
- Se mais de 50% da suíte falhar, pare e reporte — provavelmente é problema de infraestrutura
