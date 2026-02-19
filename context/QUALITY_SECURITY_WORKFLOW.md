# Guia Completo de Qualidade & Segurança de Código (BidExpert)
### Stack: React · Next.js · Prisma · Zod · Node.js · Docker
### Versão 1.0 — 2025/2026

> **Premissa:** Este documento define o framework obrigatório de qualidade para **qualquer alteração de código**, independente do tamanho. Uma vírgula alterada passa pela mesma esteira que uma feature completa. A aplicação opera em contexto crítico que envolve ativos financeiros e dados sensíveis — tolerância a falhas é zero.

---

## 1. Filosofia e Princípios

### 1.1 Abordagem "Shift Left"
Erros devem ser detectados o mais cedo possível no ciclo de desenvolvimento. Um bug encontrado localmente custa centavos para corrigir. Cada ferramenta desta esteira existe para eliminar categorias inteiras de falhas antes que cheguem ao próximo estágio.

### 1.2 Pirâmide de Testes
```
             ▲
            /E2E\         ~10% — lentos, custosos, cobrem fluxos completos
           /─────\
          / Integ. \      ~25% — banco real, APIs reais, sem mocks de infra
         /──────────\
        /  Unitários  \   ~65% — rápidos, isolados, alta cobertura de lógica
       /──────────────\
      / Testes Estáticos\  100% — tipagem, lint, análise de segurança (todo commit)
     /──────────────────\
```

### 1.3 Regras Invioláveis
- **Nenhum merge** é permitido com testes falhando.
- **Todo código** crítico exige cobertura mínima de 90% (unitário + integração).
- **Toda entrada externa** DEVE ser validada com Zod no service layer.
- **Secrets** nunca devem ser commitados (Gitleaks/Secret Scanning).
- **Headers de Segurança** (CSP, HSTS) são obrigatórios no `next.config.mjs`.

---

## 2. Cobertura Mínima Exigida

| Camada | Cobertura Mínima | Ferramenta |
|---|---|---|
| Funções utilitárias | 100% | Vitest |
| Hooks customizados | 95% | Vitest + RTL |
| Componentes de UI críticos | 90% | Vitest + RTL |
| Rotas de API / Server Actions | 90% | Vitest + Supertest |
| Repositórios Prisma | 85% | Vitest + DB real |
| Fluxos E2E críticos | 100% dos fluxos | Playwright |

---

## 3. Esteira de Desenvolvimento (Workflow)

### 3.1 Local (Pre-commit/Pre-push)
1. `npm run lint` e `npm run typecheck`
2. `npm run test` (unitários e integração)
3. `npx gitleaks detect` (segurança de secrets)

### 3.2 CI/CD (GitHub Actions)
- **Static Analysis**: Lint, Typecheck, Format.
- **Security Scan**: GitLeaks, npm audit (high/critical), Semgrep (SAST).
- **Testing**: Unit tests (coverage > 90%), Integration tests (Docker DB).
- **E2E**: Playwright smoke tests em ambiente Vercel.

---

## 4. Segurança Mandatória

### 4.1 Validação Zod (Exemplo)
```typescript
const schema = z.object({ ... });
const result = schema.safeParse(data);
if (!result.success) throw new Error(...);
```

### 4.2 Headers HTTP
O `next.config.mjs` deve conter `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, etc.

---

## 5. Checklist de Alteração de Código (Prontuário de PR)

- [ ] Propósito claro e descrito.
- [ ] TypeScript sem erros (`tsc --noEmit`).
- [ ] Zod validation em todas as entradas de API/Service.
- [ ] Testes unitários/integração adicionados para a lógica nova.
- [ ] Teste E2E/Smoke executado se afetar navegação.
- [ ] Nenhum dado sensível em logs ou código.
- [ ] `npm audit` executado para novas dependências.
