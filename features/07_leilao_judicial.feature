# language: pt
Funcionalidade: Criação e Gestão de Leilão Judicial
  Como um Administrador ou Analista de Leilão
  Eu quero criar um leilão originado de um processo judicial
  Para atender às determinações legais e leiloar os bens penhorados

  Contexto:
    Dado que eu sou um "Administrador" logado no sistema
    And existe um Processo Judicial cadastrado com o número "0012345-67.2024.8.26.0001"
    And este processo tem um "Bem" associado: "Apartamento no centro da cidade", com status "DISPONIVEL"
    And o "Comitente/Vendedor" associado ao processo é a "1ª Vara Cível de São Paulo"

  @happy-path @judicial @auctions
  Cenário: Associar um processo judicial a um novo leilão
    Quando eu crio um novo leilão com a modalidade "JUDICIAL"
    And no formulário, eu pesquiso e seleciono o processo "0012345-67.2024.8.26.0001"
    And eu configuro as datas para o primeiro e segundo pregão
    And eu crio um lote dentro deste leilão e associo o bem "Apartamento no centro da cidade" a ele
    And eu publico o leilão
    Then o leilão deve ser criado com sucesso, vinculado ao processo judicial
    And o status do bem "Apartamento no centro da cidade" deve mudar para "LOTEADO"
    And a página do leilão e do lote deve exibir publicamente as informações do processo, como número e vara

  @edge-case @judicial
  Cenário: Tentar lotear um bem que já está em outro leilão
    Dado que o bem "Apartamento no centro da cidade" já está associado a um lote em um leilão ativo
    And seu status é "LOTEADO"
    Quando eu tento criar um novo lote em um segundo leilão e associar o mesmo bem "Apartamento no centro da cidade"
    Then o sistema deve me impedir de associar o bem
    And eu devo receber uma mensagem de erro "Este bem já está loteado em outro leilão"

  @failure-case @judicial @auctions
  Cenário: Tentar criar um leilão judicial sem selecionar um processo
    Quando eu crio um novo leilão com a modalidade "JUDICIAL"
    And eu tento salvar o formulário do leilão sem associar um `judicialProcessId`
    Then o sistema deve exibir um erro de validação no formulário
    And a mensagem deve ser "Para leilões judiciais, é obrigatório associar um processo"
    And o leilão não deve ser criado

  @a11y @transparency
  Cenário: Informações do processo devem ser públicas na página do leilão
    Dado que o leilão judicial "Leilão do Apartamento" está "ABERTO_PARA_LANCES"
    Quando um "Convidado" acessa a página do lote "Apartamento no centro da cidade"
    Then ele deve conseguir ver uma seção com os "Dados do Processo"
    And essa seção deve conter o "Número do Processo", "Tribunal", "Vara" e "Comarca" de forma clara e acessível
