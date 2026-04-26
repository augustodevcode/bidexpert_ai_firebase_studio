# language: pt
Funcionalidade: Leilões SuperGrid administrativo
  Como administrador do BidExpert
  Eu quero operar a grade avançada de leilões com filtros, persistência e exportação
  Para analisar, agrupar e auditar leilões com segurança por tenant e usuário

  Cenário: Usar filtros avançados localizados e salvos por usuário
    Dado que estou autenticado como administrador no tenant demo
    Quando abro o Leilões SuperGrid e adiciono uma regra no filtro avançado
    Então os campos, operadores e conectores devem aparecer em português
    E devo conseguir salvar, recuperar e excluir um filtro nomeado sem erro de API

  Cenário: Validar ergonomia operacional da grade
    Dado que existem leilões com status, cidade, comitente, leiloeiro e praças cadastradas
    Quando uso busca rápida, oculto colunas, redimensiono cabeçalhos e agrupo por status
    Então a grade deve filtrar por título, enum e lookup relacional
    E deve persistir preferências visuais em cookie
    E deve exibir linhas agrupadas com contagem e recuo consistente

  Cenário: Auditar edição e exportações
    Dado que a grade está carregada com registros de leilão
    Quando abro uma célula editável por duplo clique e aciono os downloads CSV, Excel e PDF
    Então o editor inline deve ser exibido
    E os três arquivos devem ser gerados pelo menu de exportação
