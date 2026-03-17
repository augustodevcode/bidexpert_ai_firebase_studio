Funcionalidade: Timeline contextual de praças
  Como visitante ou operador administrativo
  Eu quero ver a praça com estado visual coerente com a superfície atual
  Para entender rapidamente se a praça está agendada, aberta, encerrada ou com resultado do lote

  Cenário: Exibir timeline de leilão sem valores monetários
    Dado que existe um leilão com praças cadastradas
    Quando eu acesso a página pública de detalhes do leilão
    Então devo ver ícones e badges contextuais nas praças
    E não devo ver valores monetários dentro da timeline do leilão

  Cenário: Exibir timeline detalhada do lote com preço por praça
    Dado que existe um lote com preços por praça configurados
    Quando eu acesso a página pública de detalhes do lote
    Então devo ver ícones e badges contextuais nas praças do lote
    E devo ver os valores monetários por praça na timeline detalhada

  Cenário: Preservar a versão compacta em cards e listitems
    Dado que existem cards e listitems reutilizando a timeline compacta
    Quando a página pública do leilão renderiza os lotes
    Então os cards e listitems não exibem ícones contextuais de praça