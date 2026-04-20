# language: pt
Funcionalidade: Página de Lotes V2 - Exibição por Categoria de Leilão
  Como visitante da plataforma BidExpert
  Eu quero visualizar lotes agrupados por tipo de leilão (Judicial, Extrajudicial, Venda Direta, Tomada de Preços)
  Para identificar rapidamente oportunidades em cada modalidade

  Contexto:
    Dado que existem leilões ativos nos tipos JUDICIAL, EXTRAJUDICIAL, VENDA_DIRETA e TOMADA_DE_PRECOS
    E cada leilão possui lotes com status visível (ABERTO_PARA_LANCES, EM_PREGAO, EM_BREVE ou AGUARDANDO)

  Cenário: Renderizar página com seções por categoria
    Quando eu acesso a página "/lots"
    Então devo ver o título principal "Lotes em Leilão"
    E devo ver a seção "Judicial" com pelo menos 1 card
    E devo ver a seção "Extrajudicial" com pelo menos 1 card
    E devo ver a seção "Venda Direta" com pelo menos 1 card
    E devo ver a seção "Tomada de Preços" com pelo menos 1 card

  Cenário: Cards exibem informações essenciais do lote
    Quando eu acesso a página "/lots"
    Então cada card de lote deve conter título, preço e localização
    E cada card deve possuir atributo data-ai-id para testabilidade

  Cenário: Card universal preserva regras essenciais ao adotar o visual de /lots
    Quando a plataforma renderiza um lote em qualquer grid usando o componente universal
    Então o card deve manter o pricing correto por praça ou por lance atual
    E o card deve preservar badges mentais, favoritos, share e CTA de pregão online quando aplicáveis
    E o card deve permitir preview e edição inline apenas nos contextos autorizados

  Cenário: Card de lote mantém slots visuais uniformes na grade pública
    Dado que existem cards de lote com títulos curtos, títulos longos e metadados opcionais ausentes
    Quando a grade pública de lotes é renderizada
    Então o slot do título principal deve ocupar a mesma altura visual em todos os cards
    E o slot reservado para metadados opcionais deve permanecer estável mesmo sem conteúdo
    E o bloco de ações deve continuar alinhado na mesma base visual da grade

  Cenário: Estado vazio quando categoria não possui lotes
    Dado que a categoria PARTICULAR não possui lotes com status visível
    Quando eu acesso a página "/lots"
    Então categorias sem lotes não devem renderizar seção vazia
