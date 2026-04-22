---
name: auction-document-governance
description: Use when migrating or fixing auction documents, replacing fixed document URLs, wiring media-library uploads, backfilling legacy fields, or updating public consumers and due-diligence links for auction documents.
---

# Skill: Auction Document Governance

## Objetivo
Impedir o retorno de modelos paralelos e inconsistentes de documentos do leilão, garantindo uma única fonte de verdade relacional e consumo coerente nas superfícies administrativas e públicas.

## Use esta skill quando

- O pedido mencionar edital, certidão, matrícula, laudo, documentos do leilão, upload de documentos ou biblioteca de mídia.
- Houver migração de `documentsUrl`, `evaluationReportUrl` ou `auctionCertificateUrl`.
- Consumidores públicos precisarem mostrar links de documentos ou due diligence.

## Guardrails

1. **Modelo único de documentos**
   - Documentos do leilão devem usar coleção relacional com título customizado e vínculo à mídia.
   - Não reintroduza novos campos de URL fixa como fonte paralela de verdade.

2. **Schema duplo obrigatório**
   - Toda alteração de model deve ser aplicada em `prisma/schema.prisma` e `prisma-deploy/schema.postgresql.prisma`.

3. **Backfill antes de desligar legado**
   - Se campos legados existirem, migre-os para a nova coleção antes de remover os consumidores antigos.
   - A remoção deve ser atômica do ponto de vista do produto: admin e público não podem divergir na mesma rodada.

4. **Mídia e download**
   - O documento deve referenciar o item de mídia já existente; não duplicar armazenamento sem necessidade.
   - Links públicos e administrativos devem apontar para o download real do documento, não para texto cru de URL.

5. **Due diligence e páginas públicas**
   - Atualize todos os consumidores que dependem hoje de `documentsUrl`, incluindo painéis de due diligence e detalhes públicos do leilão/lote.

## Arquivos-chave

- `prisma/schema.prisma`
- `prisma-deploy/schema.postgresql.prisma`
- `src/app/admin/auctions/auction-form.tsx`
- `src/components/admin/wizard/wizard-review-sections.ts`
- `src/services/auction.service.ts`
- `src/components/auction/auction-info-panel.tsx`
- `src/app/auctions/[auctionId]/auction-details-client.tsx`
- `src/app/auctions/[auctionId]/auction-details-client-v2.tsx`
- `src/app/auctions/[auctionId]/lots/[lotId]/lot-detail-client.tsx`
- `src/lib/lots/due-diligence.ts`

## Checklist mínimo

- [ ] Existe apenas uma fonte de verdade para documentos do leilão?
- [ ] Os dois schemas Prisma foram alterados?
- [ ] O backfill foi definido antes da limpeza do legado?
- [ ] Admin, review do wizard e páginas públicas usam a mesma coleção de documentos?
- [ ] Nenhum novo campo de URL fixa foi criado como atalho?

## Testes recomendados

- Unit/integration para backfill e listagem de documentos.
- E2E de upload múltiplo no admin.
- BDD de exibição pública e download de documentos.