---
name: admin-auction-wizard-integrity
description: Use when implementing or fixing admin auction wizard flows, judicial process selection, seller/comitente propagation, category or auctioneer selectors, lotting, review, publish actions, or the route to the auction control center.
---

# Skill: Admin Auction Wizard Integrity

## Objetivo
Evitar regressões estruturais no wizard e no cadastro administrativo de leilões, especialmente quando o problema parece local na tela, mas a causa real está em contratos compartilhados.

## Use esta skill quando

- O pedido mencionar wizard de leilões, processo judicial, comitente, leiloeiro, categoria, loteamento, review final ou publicação.
- Houver bugs de propagação entre Step 2, Step 3, review e publicação.
- Houver necessidade de abrir a Central do Leilão após publicação.
- Um modal de seleção parecer pobre, truncado, sem scroll ou com informação insuficiente.

## Guardrails

1. **Selectors primeiro, telas depois**
   - Antes de patch em uma tela específica, inspecione `src/components/ui/entity-selector.tsx` e `src/components/ui/data-table.tsx`.
   - Se o problema for comum a processo/categoria/comitente/leiloeiro, corrija a API compartilhada.

2. **Processo judicial e comitente são cadeia única**
   - Em fluxo judicial, o processo selecionado DEVE propagar `judicialProcessId` e o comitente resolvido até o formulário do leilão, review e persistência.
   - Se o processo não resolver comitente, a correção correta é etapa condicional a partir da Vara.

3. **Seleção determinística**
   - Testes e automações DEVEM selecionar processo/comitente/leiloeiro/categoria por identidade exata (nome, número, `data-ai-id`), nunca pela primeira linha visível.

4. **Review e publish**
   - O review final deve refletir exatamente o estado persistido.
   - Se houver CTA secundário, a rota correta da Central do Leilão é `/admin/auctions/{publicId ou id}/auction-control-center`.

5. **Loteamento**
   - O loteamento deve operar sobre a sessão corrente e sobre regra centralizada de numeração visível.
   - Não confiar em contagem local de arrays como fonte única de numeração.

## Arquivos-chave

- `src/components/ui/entity-selector.tsx`
- `src/components/ui/data-table.tsx`
- `src/components/admin/wizard/steps/step-2-judicial-setup.tsx`
- `src/components/admin/wizard/steps/step-3-auction-details.tsx`
- `src/components/admin/wizard/steps/step-4-lotting.tsx`
- `src/components/admin/wizard/steps/step-5-review.tsx`
- `src/components/admin/wizard/wizard-context.tsx`
- `src/components/admin/wizard/wizard-review-sections.ts`
- `src/app/admin/wizard/actions.ts`
- `src/app/admin/wizard/page.tsx`

## Checklist mínimo

- [ ] O root cause está em tela específica ou no selector compartilhado?
- [ ] `judicialProcessId` e `sellerId` chegam ao estado final do wizard?
- [ ] Existe etapa condicional quando o processo não resolve comitente?
- [ ] O review final bate com o payload persistido?
- [ ] O CTA de publicação/controle usa a rota correta?

## Testes recomendados

- Unit para helpers de propagação e numeração.
- E2E para seleção de processo, etapa condicional de comitente, review e CTA da Central do Leilão.
- BDD cobrindo Step 2 → Step 3 → review → publish.