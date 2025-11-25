# language: pt
Funcionalidade: Sistema ITSM-AI - Suporte ao Usuário
  Como um usuário da plataforma BidExpert
  Eu quero ter acesso a um sistema de suporte completo
  Para que eu possa resolver minhas dúvidas e reportar problemas

  Contexto:
    Dado que o sistema ITSM-AI está configurado
    E o banco de dados possui as tabelas ITSM

  Cenário: Visualizar botões flutuantes de suporte em página pública
    Dado que estou em uma página pública da plataforma
    Quando a página carregar completamente
    Então devo ver o botão flutuante de suporte no canto inferior direito
    E o botão deve ter o gradiente azul para roxo
    E deve estar visível e clicável

  Cenário: Expandir menu de opções de suporte
    Dado que estou em uma página pública
    E o botão flutuante de suporte está visível
    Quando eu clicar no botão principal
    Então devo ver 3 botões expandidos
    E devo ver o botão "FAQ" em azul
    E devo ver o botão "Chat AI" em roxo
    E devo ver o botão "Reportar Issue" em laranja
    E todos os botões devem estar animados

  Cenário: Acessar FAQ
    Dado que o menu de suporte está expandido
    Quando eu clicar no botão "FAQ"
    Então devo ver o modal de FAQ aberto
    E devo ver o título "Perguntas Frequentes"
    E devo ver pelo menos 4 perguntas frequentes
    E cada pergunta deve ter uma resposta

  Cenário: Usar Chat AI com pergunta sobre lances
    Dado que o menu de suporte está expandido
    Quando eu clicar no botão "Chat AI"
    Então devo ver o modal de chat aberto
    E devo ver a mensagem de boas-vindas da IA
    Quando eu digitar "Como faço para dar um lance?"
    E eu enviar a mensagem
    Então devo ver minha mensagem na cor azul
    E devo ver o indicador "digitando..."
    E devo receber uma resposta da IA em até 3 segundos
    E a resposta deve conter informações sobre lances

  Cenário: Criar ticket de suporte com categoria técnica
    Dado que o menu de suporte está expandido
    Quando eu clicar no botão "Reportar Issue"
    Então devo ver o formulário de criação de ticket
    Quando eu preencher o título com "Erro ao fazer login"
    E eu selecionar a categoria "TECNICO"
    E eu selecionar a prioridade "ALTA"
    E eu preencher a descrição com "Não consigo acessar minha conta após resetar a senha"
    E eu clicar em "Criar Ticket"
    Então devo ver a mensagem de sucesso
    E devo ver o ícone de check verde
    E o ticket deve ser criado no banco de dados
    E deve capturar os dados técnicos do navegador

  Cenário: Validar campos obrigatórios no formulário de ticket
    Dado que estou no formulário de criação de ticket
    Quando eu clicar em "Criar Ticket" sem preencher os campos
    Então devo ver um alerta pedindo para preencher os campos obrigatórios
    E o ticket não deve ser criado

  Esquema do Cenário: Chat AI responde diferentes tipos de perguntas
    Dado que estou no chat AI
    Quando eu perguntar "<pergunta>"
    Então a resposta deve conter "<palavra_chave>"
    
    Exemplos:
      | pergunta                        | palavra_chave |
      | Como me habilitar no leilão?   | documentos    |
      | Quais formas de pagamento?     | PIX           |
      | Preciso de quais documentos?   | RG            |
      | Como dar um lance?             | Lance         |
