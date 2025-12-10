# Cenários de Teste (TDD) - Mapas e Geolocalização

## 1. Utilidades de Provedor/GPS (Unitários)
- **Dado** um conjunto de `PlatformSettings.mapSettings` diferentes
  - **Quando** `normalizeMapProvider` é chamado
  - **Então** deve retornar `openstreetmap`, `openmap`, `google` ou `staticImage` conforme o valor informado e usar `openstreetmap` como fallback.
- **Dado** um objeto de endereço com apenas cidade/UF
  - **Quando** `buildGeocodeQuery` é executado
  - **Então** deve produzir a string `"Cidade, UF, Brasil"`.
- **Dado** que `geocodeLocation` já resolveu um endereço específico
  - **Quando** é invocado novamente com o mesmo query
  - **Então** deve servir o resultado do cache sem disparar nova chamada HTTP (mockando `fetch`).
- **Dado** que a primeira tentativa de `geocodeLocation` com `mapAddress` retorna vazio
  - **Quando** a função é executada
  - **Então** ela deve tentar novas queries (CEP → cidade/UF) até obter coordenadas ou esgotar as opções.

## 2. MapSearchComponent (Visual + Browser)
- **Fluxo:** renderizar o componente com itens sem coordenadas, mockando `geocodeLocation` para retornar pontos fixos.
- **Expectativas:**
  - Exibe o aviso `"Resolvendo endereços…"` durante o `Promise` pendente.
  - Renderiza `Marker` para cada item assim que a promise se resolve.
  - Usa o tile provider correto ao alterar `mapSettings` (validado via snapshot visual).
  - Emite `onItemsInViewChange` com os IDs calculados por `filterIdsWithinBounds` após `fitBoundsSignal` ser incrementado.
  - Quando `fitBoundsSignal` muda, chama `map.fitBounds` e atualiza `onBoundsChange` apenas uma vez por ciclo.

## 3. E2E - `/map-search`
- **Cenário:** visitar `/map-search` com seed padrão.
- **Passos:**
  1. Esperar a renderização da caixa de busca e do container Leaflet.
  2. Confirmar que pelo menos um marcador existe após a mensagem de carregamento sumir.
  3. Mover o mapa e validar que o filtro de bounds dispara (checando contagem de cards na coluna lateral).
  4. Alternar as abas `data-ai-id="map-dataset-toggle-direct_sale"` e `map-dataset-toggle-tomada_de_precos` garantindo que os cards renderizados sejam `BidExpertListItem` com o tipo correto, verificando especificamente que a aba de tomada de preços exibe o selo "Tomada de Preços" proveniente de `AuctionListItem` sem warnings de console.
  5. Acionar o botão `data-ai-id="map-reset-filter"` e validar, via screenshot/regressão visual, que a contagem `map-search-count` volta a refletir o total global.

## 4. Visual Regression - Detalhe do Lote
- **Cenário:** renderizar `LotMapDisplay` em modo estático com provider `staticImage` e outro com `openmap` (mockando `geocodeLocation`).
- **Expectativas:**
  - Screenshot "lot-map-static" mostrando a imagem fallback e botão "Ampliar Mapa" oculto.
  - Screenshot "lot-map-openmap" exibindo o tile customizado e botão de ampliar visível.

## 5. Cache Inteligente e Layout Estendido da Busca por Mapa
- **Unitário (`map-search-cache.spec.ts`):**
  - Persistir e recuperar vetores de `lots`, `auctions`, `directSales` em `sessionStorage`, respeitando o TTL de 5 minutos.
  - Expirar automaticamente cada `payload` após o TTL e retornar `null` na leitura.
  - `describeRelativeTimestamp` deve produzir "Atualizado agora", "Atualizado há X min" e "Atualizado há X horas" conforme o delta de tempo mockado via `vi.setSystemTime`.
- **Visual (`map-search-sidebar.visual.spec.tsx`):**
  - Validar o novo painel lateral translúcido, selo de cache e layout compacto (screenshot `map-search-sidebar-lots.png` e `map-search-sidebar-direct.png`).
- **E2E (`map-search-layout.spec.ts`):**
  - Garantir que o botão "Tela cheia" abra o diálogo com o mapa ocupando 90% da viewport e que "Fechar tela cheia" retorne ao modo normal sem erros de console.
  - Assegurar que o primeiro `data-ai-id="map-search-list-item"` contenha `data-density="compact"`, evitando estourar a altura do cartão.
  - Validar que o botão "Recentrar mapa" dispara um novo filtro (monitorar `data-ai-id="map-search-count"`) e que mover o mapa e voltar mantém o cabeçalho sobreposto (header com `z-header`).
