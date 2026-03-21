Funcionalidade: Secao paralela de lotes ativos na home
  Como visitante da homepage
  Eu quero ver uma segunda vitrine com lotes ativos nao repetidos
  Para descobrir mais oportunidades alem dos lotes em destaque

  Cenario: Exibir a secao Mais Lotes Ativos quando houver itens restantes
    Dado que existem mais de 8 lotes com status ABERTO_PARA_LANCES
    Quando eu acesso a homepage publica
    Entao devo ver a secao "Mais Lotes Ativos"
    E a secao deve conter no maximo 8 cards

  Cenario: Nao repetir lotes entre as duas secoes de lotes
    Dado que a homepage exibe a secao de lotes em destaque
    E a homepage exibe a secao "Mais Lotes Ativos"
    Quando eu comparo os links dos cards das duas secoes
    Entao nao deve haver o mesmo lote nas duas secoes

  Cenario: Ocultar a secao paralela quando nao houver lotes ativos adicionais
    Dado que todos os lotes ativos ja estao na primeira secao de lotes
    Quando eu acesso a homepage publica
    Entao a secao "Mais Lotes Ativos" nao deve ser exibida
