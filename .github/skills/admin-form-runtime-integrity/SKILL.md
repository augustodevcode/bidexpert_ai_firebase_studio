---
name: admin-form-runtime-integrity
description: Use when fixing admin form runtime issues around CEP, city matching, map pin updates, pt-BR masks, datetime handling, media preview contracts, vehicle make and model master data, monetary normalization, or default auction online URLs.
---

# Skill: Admin Form Runtime Integrity

## Objetivo
Fechar as causas-raiz de bugs de formulário administrativo que costumam parecer pequenos detalhes visuais, mas na prática são contratos reutilizáveis de CEP, mapa, locale, máscara, mídia e master data.

## Use esta skill quando

- O pedido mencionar CEP, cidade, mapa, pin, endereço, telefone, WhatsApp, máscara monetária, data/hora pt-BR, imagem principal, biblioteca de mídia, marca/modelo de veículo ou URL online padrão.
- Houver divergência entre valor exibido e valor persistido.
- O preview de mídia não reaparecer após a seleção.

## Guardrails

1. **CEP/cidade/mapa**
   - Compare cidade/UF com normalização, não apenas igualdade textual rígida.
   - Regeocode ao preencher ou sair do campo número usando rua + número + cidade + UF.

2. **Máscaras e locale**
   - Máscaras são camada de entrada/apresentação; a persistência deve usar valor normalizado.
   - Data/hora administrativa deve ter comportamento consistente em pt-BR, sem depender da formatação nativa divergente do browser como regra de negócio.

3. **Mídia**
   - Antes de ligar preview, confirme o contrato real de retorno da biblioteca de mídia.
   - Não assuma propriedade `url` se o tipo real expõe `urlOriginal` e `urlThumbnail`.

4. **Master data de veículos**
   - Marca e modelo devem reaproveitar o cadastro mestre existente.
   - Modelo dependente de marca deve respeitar a seleção pai.

5. **URLs e defaults**
   - A URL online padrão do leilão deve ser derivada do domínio atual quando o campo estiver vazio.
   - Preserve override manual explícito do usuário.

## Skills relacionadas

- `.github/skills/address-component/SKILL.md`
- `.github/skills/media-library/SKILL.md`

## Arquivos-chave

- `src/components/address/AddressComponent.tsx`
- `src/components/address/AddressMapPicker.tsx`
- `src/lib/actions/cep.ts`
- `src/app/admin/auctions/auction-form.tsx`
- `src/app/admin/auctions/auction-form-schema.ts`
- `src/components/auction/auction-stages-form.tsx`
- `src/app/admin/assets/asset-form-v2.tsx`
- `src/app/admin/assets/asset-form-schema.ts`
- `src/app/admin/assets/asset-field-config.ts`
- `src/components/admin/media/choose-media-dialog.tsx`
- `src/app/admin/vehicle-makes/actions.ts`
- `src/app/admin/vehicle-models/actions.ts`

## Checklist mínimo

- [ ] Cidade é resolvida com matching normalizado?
- [ ] O pin do mapa reage ao número do imóvel?
- [ ] Máscaras pt-BR são normalizadas antes de salvar?
- [ ] Preview de mídia usa o campo real retornado pela biblioteca?
- [ ] Marca/modelo usam master data em vez de texto livre?
- [ ] URL padrão do leilão só preenche quando o campo estiver vazio?

## Testes recomendados

- Unit para normalização de moeda/telefone/data.
- E2E para CEP + número + mapa, imagem principal e marca/modelo.
- BDD de consistência entre apresentação mascarada e persistência.