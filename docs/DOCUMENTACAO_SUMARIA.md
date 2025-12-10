# Documentação Consolidada do BidExpert (dez 2025)

Este arquivo substitui os antigos.md em `docs/` por um resumo validado diretamente contra o código-fonte e os testes. Cada seção lista as implementações atuais e os pontos de verificação automatizados que ainda estão em vigor.

## 1. Multi-tenant e segurança de contexto
- `src/lib/actions/auth.ts` garante um `tenant` padrão (`Bid Expert`) e resolve o tenant atual em ordem: sessão do usuário, cabeçalho `x-tenant-id` e só então o padrão.
- `getTenantIdFromRequest` é usado por todas as ações `src/app/admin/auctions-v2/actions.ts`, que passa o tenant para consultas Prisma (por exemplo, `getAuctionsV2`, `getAuctionLotsV2`, `create/update/deleteAuctionV2`).
- `src/lib/tenant-context.ts` já prepara um `AsyncLocalStorage` para propagar o tenant quando necessário.

## 2. Experiência Lote V2 (BDD atual)
- O `LotDetailPage` (`src/app/auctions/[auctionId]/lots/[lotId]/page.tsx`) reúne dados de leilão, lote, categorias, vendedores e leiloeiros antes de renderizar o cliente `lot-detail-client.tsx`.
- O cliente (`src/app/auctions/[auctionId]/lots/[lotId]/lot-detail-client.tsx`) entrega galeria/carrossel com `Carousel`, badges de mental trigger, painel de lances responsivo, abas (descrição, especificações, perguntas, avaliações), documentos e mapa (`Lazy` via `LotMapDisplay`). O painel de lances reutiliza `BiddingPanel`, há favoritos, indicadores de urgência, `LotPreviewModal`, `LotCountdown` e histórico de etapas (`BidExpertAuctionStagesTimeline`).
- A modal preview (`src/components/lot-preview-modal.tsx`) e o seletor de mapa (`LotMapDisplay`) reforçam os requisitos de galerias, downloads e geolocalização descritos no BDD antigo.
- O teste Playwright `tests/e2e/lot-detail-v2.spec.ts` valida os pilares: carrossel, documentos e mapa ao abrir `/auctions/*/lots/*`.

## 3. Painel do advogado + impersonação
- `src/services/admin-impersonation.service.ts` expõe `isAdmin`, `getImpersonatableLawyers` e `canImpersonate`, usa Prisma para listar advogados e contar processos ativos.
- A validação e os badges são cobertos pela suite `tests/e2e/admin/lawyer-impersonation.spec.ts` (login como admin, seletor visível, indicadores de modo admin, retorno ao próprio painel e restrição para advogados não-admin).

## 4. Cadastro e referência rápida de ativos
- O formulário `src/app/admin/assets/asset-form-v2.tsx` é um CRUD com `CrudFormLayout`, `CrudFormActions` e `useCrudForm`; carrega categorias, processos e vendedores, abre `ChooseMediaDialog`, exibe `AddressGroup` e usa `AssetSpecificFields` para campos dependentes da categoria.
- O schema `src/app/admin/assets/asset-form-schema.ts` reúne campos de base e era combinado (`vehicleFieldsSchema`, `propertyFieldsSchema`, `machineryFieldsSchema` etc.) para cobrir veículos, imóveis, máquinas, móveis, joias, arte, embarcações, commodities, metais preciosos e produtos florestais.
- `src/app/admin/assets/asset-field-config.ts` mapeia slugs para grupos de campos e define labels, tipos e placeholders reutilizáveis; o componente `AssetSpecificFields` (`asset-specific-fields.tsx`) renderiza os campos dinamicamente com `Select`, `Input`, `Textarea` e `Checkbox` com validação automatizada.

## 5. Logging, validação e observabilidade de CRUDs
- `src/lib/user-action-logger.ts` cria o singleton acessível via `window.__userActionLogger`, registra categorias (`navigation`, `form`, `selection`, `crud`, `validation`, `interaction`, `error`) e adiciona atributos `data-last-action` para testes Playwright.
- `src/lib/form-validator.ts` valida dados contra schemas Zod (erro, contagem de campos, campos obrigatórios e sumário formatado).
- `src/hooks/use-form-validation-check.ts` une o form (`useCrudForm`) com a validação (Zod + RHF) e registra `logValidation`. A `useEnhancedCrudForm` (`src/hooks/use-enhanced-crud-form.ts`) expõe esse resultado junto com o CRUD normal.
- Helpers (`src/lib/form-logging-helpers.ts`) oferecem `withLogging`, `loggedSelectChange`, `loggedInputChange`, `loggedSwitchChange`, `loggedButtonClick`, `addFormFieldLogging`, `logSectionChange` e `logTabChange` para instrumentar campos e tabs.
- `src/components/common/logged-entity-selector.tsx` envolve o `EntitySelector` com logs (`logSelection`).
- O teste `tests/e2e/logging-validation.spec.ts` cobre: existência do logger, atributos `data-last-action`, exportação, filtros por módulo, limpeza, botão de validação, logs de campo, seleções, navegação, ações CRUD e limite de 500 entradas.

## 6. Regressão visual e estratégia de testes
- `vitest.config.ts` habilita o provider Playwright (`@vitest/browser-playwright`), `toMatchScreenshot` via `pixelmatch`, viewport 1280x720 e comandos customizados em `tests/visual/commands.ts`.
- `tests/visual/README.md` descreve como rodar `npm run test:ui`, `npx vitest run tests/visual/`, gerar relatório HTML e atualizar referências visuais (`npx vitest --update tests/visual/`).
- `tests/visual/homepage-visual-regression.spec.ts` valida o ambiente browser do Vitest (`page`, `server`) e demonstra captura de screenshots, redimensionamento de viewport e interação com evento de clique.
- As capturas de referência ficam em `tests/visual/__screenshots__/`.

## 7. Playwright/e2e e comandos recomendados
- `playwright.config.local.ts` inicia `npm run dev`, usa storage state `tests/e2e/.auth/admin.json`, controla trace/screenshot/video `retain-on-failure` e executa um único worker para minimizar concorrência.
- Principais suites: `tests/e2e/lot-detail-v2.spec.ts`, `tests/e2e/admin/lawyer-impersonation.spec.ts`, `tests/e2e/logging-validation.spec.ts`, além das pastas `tests/e2e/qa`, `tests/e2e/multitenant`, `tests/e2e/audit` e outras que cobrem integrações críticas.

## 8. Comandos essenciais
```
npm run typecheck
npm run test:visual
npm run test:ui
npx vitest run tests/visual/
npx playwright test
npm run dev
```
- Antes de Playwright/E2E em ambientes controlados siga o fluxo `npm run build && npm start` para evitar lazy compilation, conforme `.github/copilot-instructions.md`.

## 9. Próximos passos para manter o sumário atualizado
1. Atualizar esta página sempre que houver novo serviço ou suite de teste; referenciar o arquivo diretamente.
2. Garantir que novas features (ex.: novos painéis administrativos) publiquem testes E2E e sejam incluídas aqui.
3. Manter a pasta `docs/` com este sumário único para evitar divergências.

*Documento validado contra os módulos citados (dez/2025).*