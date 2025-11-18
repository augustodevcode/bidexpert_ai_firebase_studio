# BidReportBuilder

Componente de construção de relatórios personalizado para o BidExpert.

## Descrição

O `BidReportBuilder` é uma ferramenta self-service de criação de relatórios que permite aos usuários (administradores, analistas de leilão, leiloeiros e consignatários) criar, personalizar e exportar relatórios de forma intuitiva.

## Estrutura

- `index.js` - Componente principal
- `tour.js` - Configuração do tour guiado para novos usuários
- `styles/` - Estilos CSS do componente
- `api/` - Chamadas de API para gerenciamento de relatórios
- `__tests__/` - Testes unitários do componente

## Uso

```jsx
import BidReportBuilder from '@/components/BidReportBuilder';

function ReportPage() {
  return <BidReportBuilder />;
}
```

## Funcionalidades

- **Tour Guiado**: Ajuda novos usuários a entenderem como usar o construtor
- **Design Intuitivo**: Interface drag-and-drop para criação de relatórios
- **Painel de Propriedades**: Edição fácil de propriedades dos elementos
- **Visualização em Tempo Real**: Preview do relatório durante a criação

## Tour Guiado

O tour possui os seguintes passos:

1. **Toolbar**: Barra de ferramentas para adicionar elementos ao relatório
2. **Design Surface**: Área de arrastar e soltar elementos
3. **Properties Panel**: Painel para editar propriedades dos elementos selecionados

Para mais detalhes, consulte `_Aiexclude/BidReportBuilder_Specification.md`.