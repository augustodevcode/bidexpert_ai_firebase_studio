---
description: Guardrails para wizard e backoffice de leilões, cobrindo processo judicial, comitente, selectors, CEP/mapa, documentos, mídia, histórico e loteamento.
applyTo: "src/app/admin/**"
---

# Admin Auction Governance

Use estas regras ao alterar qualquer fluxo administrativo ligado a leilões, wizard, ativos, lotes ou edição do leilão.

## Contratos compartilhados

- Antes de corrigir um modal de processo, categoria, comitente ou leiloeiro, valide primeiro os contratos de `EntitySelector` e `DataTable`.
- Não crie comportamento diferente por tela se a causa raiz estiver em componente compartilhado.
- Se o fluxo depender de mídia, confirme o shape real retornado pela biblioteca (`urlOriginal`, `urlThumbnail` ou equivalente documentado) antes de ligar preview e persistência.

## Wizard judicial

- Processo judicial e comitente formam uma cadeia única: seleção no Step 2, exibição no Step 3, review e persistência final DEVEM refletir o mesmo vínculo.
- Se o processo não resolver comitente, a solução correta é etapa condicional por Vara, não seguir com vínculo ausente silenciosamente.
- Testes e seletores DEVEM localizar processo/comitente por identidade determinística, nunca pelo primeiro item visível.

## Endereço, locale e máscaras

- CEP/cidade precisam de matching normalizado; não usar comparação rígida de texto como única regra.
- Atualização do mapa deve considerar o número do imóvel quando ele for preenchido ou perder foco.
- Telefone, WhatsApp, moeda e data/hora em pt-BR devem normalizar o valor antes da persistência.

## Documentos, histórico e lotes

- Documentos do leilão devem usar modelo relacional genérico; não reintroduzir URLs fixas paralelas como nova fonte de verdade.
- Edição do leilão deve buscar lotes por filtro explícito de `auctionId`.
- Histórico do leilão só está íntegro quando a mutation persiste logs e o endpoint consegue ler `changes` e `oldValues/newValues`.
- Numeração visível de lotes deve sair de regra centralizada, nunca de contagem local frágil no componente.

## Governança

- Quando a correção for transversal ao admin de leilões, atualize `context/REGRAS_NEGOCIO_CONSOLIDADO.md` e a skill correspondente na mesma rodada.
- Se a mudança também afetar consumers públicos, registre o impacto no spec/OpenSpec antes da promoção.