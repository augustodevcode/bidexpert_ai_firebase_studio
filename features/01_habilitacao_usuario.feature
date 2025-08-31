# language: pt
Funcionalidade: Habilitação de Arrematante para a Plataforma (KYC)
  Como um Arrematante
  Eu quero submeter meus documentos e ter meu cadastro aprovado
  Para que eu possa participar dos leilões

  Contexto:
    Dado que eu sou um novo usuário cadastrado no sistema com o email "arrematante@teste.com"
    E meu status de habilitação é "PENDING_DOCUMENTS"

  @happy-path @kyc @lgpd
  Cenário: Submissão e aprovação de documentos com sucesso
    Dado que estou na minha página de "dashboard/documents"
    Quando eu faço o upload do meu "RG" com o arquivo "rg_valido.pdf"
    And eu faço o upload do meu "Comprovante de Residência" com o arquivo "residencia_valida.pdf"
    And um Administrador analisa e aprova meus documentos
    Então meu status de habilitação deve mudar para "HABILITADO"
    And eu devo receber uma notificação de "Habilitação Aprovada"

  @edge-case @kyc
  Cenário: Tentativa de dar lance sem estar habilitado
    Dado que o leilão "Leilão de Carros" está "ABERTO_PARA_LANCES"
    Quando eu tento dar um lance de "R$ 50.000" no lote "Carro XYZ"
    Então eu devo ver uma mensagem de erro informando "Você precisa completar sua habilitação para dar lances"
    And o sistema não deve registrar meu lance

  @failure-case @kyc
  Cenário: Submissão de documentos rejeitados pelo Administrador
    Dado que estou na minha página de "dashboard/documents"
    Quando eu faço o upload do meu "RG" com o arquivo "rg_ilegivel.pdf"
    And um Administrador analisa e rejeita meus documentos com o motivo "Documento de identidade ilegível"
    Então meu status de habilitação deve mudar para "REJECTED_DOCUMENTS"
    And eu devo receber uma notificação informando o motivo da rejeição
    And eu devo ter a opção de submeter os documentos novamente

  @security @auth
  Cenário: Outro usuário não pode ver meus documentos
    Dado que o usuário "curioso@teste.com" está logado
    Quando ele tenta acessar a minha página de documentos em "/dashboard/documents"
    Então o sistema deve retornar um erro de "Acesso Negado" (403)
    And o usuário "curioso@teste.com" não deve conseguir visualizar meus documentos ou status de habilitação
