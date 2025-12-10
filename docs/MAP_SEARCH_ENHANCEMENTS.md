# Documentação da Busca por Mapa (Map Search)

## Visão Geral
A funcionalidade de busca por mapa foi aprimorada para oferecer uma experiência mais rica e intuitiva, inspirada em plataformas líderes de mercado como Trivago. As melhorias incluem marcadores personalizados, filtros avançados e uma interface de usuário refinada.

## Novas Funcionalidades

### 1. Marcadores Personalizados no Mapa
- **Ícones por Categoria:** Os marcadores agora exibem ícones específicos para cada categoria de lote ou oferta (Veículos, Imóveis, Equipamentos, etc.), facilitando a identificação visual rápida.
- **Preço no Marcador:** O valor do lance atual ou preço de venda é exibido diretamente no marcador, permitindo que o usuário avalie oportunidades sem precisar clicar.
- **Estilização:** Marcadores com design moderno, utilizando as cores do sistema e sombras para destaque.

### 2. Filtros Avançados
Uma nova barra de filtros foi adicionada acima do mapa, permitindo refinar a busca por:
- **Localização:** Busca por cidade ou estado.
- **Categoria:** Dropdown para filtrar por categorias específicas (Veículos, Imóveis, etc.).
- **Faixa de Preço:** Campos para definir valor mínimo e máximo.
- **Limpar Filtros:** Botão para resetar rapidamente todos os critérios.

### 3. Melhorias de UI/UX
- **Terminologia:** O termo técnico "Dataset" foi substituído por "Tipo de Oferta" para melhor compreensão do usuário.
- **Lista de Resultados:** A densidade da lista lateral foi ajustada para exibir mais informações sobre cada item, melhorando a legibilidade.
- **Design System:** Fontes, cores e espaçamentos foram alinhados com o design system global da aplicação.

## Implementação Técnica

### Componentes
- `src/app/map-search/_client.tsx`: Gerencia o estado dos filtros e a lógica de filtragem combinada (busca textual + filtros avançados).
- `src/components/map-search-component.tsx`: Responsável pela renderização do mapa e dos marcadores personalizados usando `L.divIcon` e `react-dom/server`.
- `src/components/map-search-sidebar.tsx`: Exibe a lista de resultados e o seletor de tipo de oferta.

### Estilos
- `src/app/globals.css`: Adicionadas classes CSS `.custom-map-marker`, `.marker-icon-wrapper` e `.marker-price-tag` para estilização dos marcadores Leaflet.

### Lógica de Filtragem
A filtragem ocorre no cliente (`_client.tsx`) para garantir interatividade instantânea. A função `advancedFilteredItems` combina:
1. Busca textual (termo)
2. Filtro de localização (cidade/estado)
3. Filtro de categoria
4. Filtro de faixa de preço
5. Filtro de viewport (itens visíveis no mapa)

## Testes
Recomenda-se validar:
1. A renderização correta dos ícones para diferentes categorias.
2. A formatação de preços nos marcadores.
3. O funcionamento combinado dos filtros (ex: Veículos em SP até R$ 50.000).
4. A responsividade da barra de filtros em dispositivos móveis.
