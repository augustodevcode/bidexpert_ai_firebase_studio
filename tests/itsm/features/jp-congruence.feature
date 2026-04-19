# language: pt
Funcionalidade: RN-030 - Congruência Processo Judicial → Ativos → Lote → Leilão

  Contexto:
    Dado que existe um Processo Judicial "JP-001"
    E existe um Leilão vinculado ao "JP-001"
    E existe um Lote no Leilão

  Cenário: Vincular ativo do mesmo JP ao lote
    Dado que existe um Ativo vinculado ao "JP-001"
    Quando o usuário vincula o Ativo ao Lote
    Então o vínculo é criado com sucesso

  Cenário: Bloquear ativo de JP diferente
    Dado que existe um Ativo vinculado ao "JP-002"
    Quando o usuário tenta vincular o Ativo ao Lote
    Então o sistema retorna erro "CONGRUENCE_JP_MISMATCH"

  Cenário: Bloquear ativo sem JP em leilão judicial
    Dado que existe um Ativo sem Processo Judicial
    Quando o usuário tenta vincular o Ativo ao Lote
    Então o sistema retorna erro "CONGRUENCE_JP_NULL_ASSET"

  Cenário: Bloquear ativo já vinculado a outro lote ativo
    Dado que existe um Ativo vinculado ao "JP-001"
    E o Ativo já está vinculado a outro Lote com status "ABERTO_PARA_LANCES"
    Quando o usuário tenta vincular o Ativo ao Lote
    Então o sistema retorna erro "ASSET_ALREADY_IN_ACTIVE_LOT"

  Cenário: Permitir ativo de lote encerrado ser reusado
    Dado que existe um Ativo vinculado ao "JP-001"
    E o Ativo estava vinculado a um Lote com status "ENCERRADO"
    Quando o usuário vincula o Ativo ao novo Lote
    Então o vínculo é criado com sucesso

  Cenário: Publicação de leilão com JP incongruente falha
    Dado que o Lote contém um Ativo vinculado ao "JP-002"
    Quando o administrador tenta publicar o Leilão
    Então a validação de integridade falha com mensagem de JP incongruente
