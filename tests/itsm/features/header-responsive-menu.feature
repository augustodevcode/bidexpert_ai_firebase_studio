Funcionalidade: Responsividade do menu publico
  Como pessoa visitante da plataforma
  Quero que o header se adapte a larguras intermediarias e desktop amplo
  Para navegar sem quebra visual nem itens sobrepostos

  Cenario: Colapsar a navegacao para menu mobile antes do breakpoint xl
    Dado que a pessoa acessa a listagem publica de lotes
    Quando a largura da viewport estiver em 1100 pixels
    Entao o botao de menu mobile deve ficar visivel
    E a barra inferior de navegacao desktop deve permanecer oculta
    E a pessoa deve conseguir abrir o drawer com os links principais

  Cenario: Restaurar a navegacao desktop em largura ampla
    Dado que a pessoa acessa a listagem publica de lotes
    Quando a largura da viewport estiver em 1440 pixels
    Entao a busca desktop deve ficar visivel
    E a barra inferior de navegacao desktop deve aparecer completa
    E o botao de menu mobile deve permanecer oculto