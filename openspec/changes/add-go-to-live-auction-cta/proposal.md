# Change: Add CTA "Ir para pregão online"

## Why
Usuários precisam acessar rapidamente o pregão ao vivo durante a janela ativa do leilão, com regras claras de elegibilidade e consistência em todas as superfícies (cards, listas, detalhes, modais e admin).

## What Changes
- Adiciona CTA reutilizável "Ir para pregão online" com ícone de status online, tooltip e badge piscando lentamente.
- Aplica regra temporal unificada da janela de pregão (status aberto + dentro do intervalo de datas).
- Restringe exibição para usuário logado e habilitado no leilão.
- Integra CTA em cards/list items, detalhes e modais de leilão/lote, incluindo listagens administrativas.
- Adiciona testes unitários da regra temporal e teste E2E de visibilidade para usuário não autenticado.

## Impact
- Affected specs: online-auction-live-cta
- Affected code: `src/lib/ui-helpers.ts`, `src/components/auction/*`, `src/components/cards/*`, `src/app/auctions/*`, `src/components/admin/auction-preparation/tabs/*`, `tests/unit/ui-helpers.test.ts`, `tests/e2e/*`
