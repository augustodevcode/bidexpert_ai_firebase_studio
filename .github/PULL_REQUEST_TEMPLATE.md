---
name: Feature / Fix PR
about: Pull Request para feature ou correção implementada em container isolado
title: "[TYPE] Breve descrição"
labels: ""
assignees: ""
---

## Descrição
<!-- Descreva o que foi implementado/corrigido -->


## Tipo de Mudança
- [ ] Feature nova
- [ ] Correção de bug
- [ ] Refatoração
- [ ] Documentação
- [ ] Infra/DevOps

## Container de Desenvolvimento
- **DEV_ID:** <!-- ex: dev1, augusto -->
- **Branch:** <!-- ex: feat/auction-filter-20260216-1430 -->
- **Porta:** <!-- ex: 9101 -->
- **Base Branch:** `main`

## Changelog Técnico
<!-- Liste TODOS os arquivos alterados e o que mudou -->
| Arquivo | Mudança |
|---------|---------|
| `src/...` | Descrição |

## Evidência Obrigatória de Testes Playwright

> **GATE:** Este PR NÃO pode ser mergeado sem evidência de testes Playwright executados no container do dev.

### Resultado dos Testes
- [ ] Smoke tests: **PASS** / FAIL
- [ ] E2E tests impactados: **PASS** / FAIL
- [ ] Regressão seletiva: **PASS** / FAIL / N/A

### Evidência
<!-- Cole o JSON de evidência gerado pelo script run-tests-in-container.sh -->
```json
{
  "devId": "",
  "timestamp": "",
  "testFilter": "",
  "exitCode": 0,
  "status": "passed"
}
```

### Artefatos
- [ ] `test-results/evidence-<DEV_ID>-<TIMESTAMP>.json` anexo
- [ ] Screenshots de falha (se houver)
- [ ] Trace files de falha (se houver)

## Checklist de Qualidade
- [ ] Código segue design system (semantic tokens, sem `text-white` etc.)
- [ ] `data-ai-id` adicionado em novos elementos HTML
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Schema Prisma atualizado em AMBOS os schemas (MySQL + PostgreSQL)
- [ ] Testes unitários adicionados/atualizados
- [ ] Documentação atualizada (BDD/TDD)
- [ ] Sem segredos/tokens no código

## Áreas Impactadas
<!-- Marque as áreas que este PR impacta para detecção de conflitos -->
- [ ] Auth / Login
- [ ] Leilões / Auctions
- [ ] Lotes / Search
- [ ] Admin / Backoffice
- [ ] Schema Prisma
- [ ] Middleware / Multi-tenant
- [ ] API Routes
- [ ] UI Components
- [ ] Infra / Docker / CI

## Screenshots
<!-- Adicione screenshots da funcionalidade -->

