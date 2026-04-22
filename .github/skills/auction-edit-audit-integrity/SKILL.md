---
name: auction-edit-audit-integrity
description: Use when fixing auction edit pages, change-history tabs, audit persistence, lot leakage across auctions, getLots filters, or control-center related admin integrity issues.
---

# Skill: Auction Edit Audit Integrity

## Objetivo
Impedir regressões na tela de edição do leilão e na trilha de auditoria, especialmente quando a UI parece quebrada mas a causa real está no contrato do service ou na persistência do log.

## Use esta skill quando

- O pedido mencionar edição do leilão, histórico de alterações, aba de mudanças, auditoria, vazamento de lotes, `getLots`, Central do Leilão ou limpeza da tela de edição.
- Houver divergência entre mudança executada e histórico exibido.

## Guardrails

1. **Filtro de lotes**
   - Antes de culpar o banco, confirme a assinatura do service de listagem.
   - A edição do leilão deve listar lotes por filtro explícito de `auctionId`.

2. **Auditoria persistida e lida**
   - O histórico só é confiável quando a mutation persiste o log e o endpoint consegue ler tanto `changes` quanto `oldValues/newValues`.
   - Se a aplicação usa múltiplos caminhos de auditoria, normalize a leitura antes de duplicar a escrita.

3. **Root cause compartilhado**
   - Se a ausência de histórico aparecer em várias entidades, inspecione primeiro a infraestrutura compartilhada de auditoria (`audit-context`, extension, endpoint) antes da tela.

4. **Tela de edição enxuta**
   - Se uma seção administrativa foi explicitamente considerada ruído operacional, remova-a da superfície certa em vez de apenas escondê-la via CSS.

## Skills relacionadas

- `.github/skills/observability-audit/SKILL.md`

## Arquivos-chave

- `src/app/admin/auctions/[auctionId]/edit/page.tsx`
- `src/services/lot.service.ts`
- `src/services/auction.service.ts`
- `src/components/audit/change-history-tab.tsx`
- `src/app/api/audit/[entityType]/[entityId]/route.ts`
- `src/lib/audit-context.ts`

## Checklist mínimo

- [ ] A tela chama o service de lotes com filtro estruturado por `auctionId`?
- [ ] O log é persistido em create/update relevantes?
- [ ] O endpoint de leitura normaliza `changes` e `oldValues/newValues`?
- [ ] O histórico exibido corresponde à entidade certa?
- [ ] A tela não carrega seções administrativas já descartadas pelo negócio?

## Testes recomendados

- Unit/integration para persistência e leitura de audit log.
- E2E para edição do leilão mostrando apenas lotes próprios e histórico funcional.
- BDD de integridade da tela de edição do leilão.