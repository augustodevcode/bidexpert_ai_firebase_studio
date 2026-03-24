Funcionalidade: Seed canônico do tenant Leilões e Cia
  Como pessoa que valida a plataforma
  Quero um tenant público path-based para o slug leiloesecia
  Para testar a rota principal sem wildcard DNS

  Cenário: disponibilizar o evento Mercedes-Benz 915E Blinfort no slug leiloesecia
    Dado que o seed master foi executado
    Quando eu acesso a rota /leiloesecia/auctions
    Então devo encontrar o tenant Leilões e Cia
    E devo visualizar o evento Mercedes-Benz 915E Blinfort com lance inicial de R$ 60.000,00