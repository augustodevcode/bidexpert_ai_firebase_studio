# Melhoria no CRUD de Processos Judiciais

## Contexto
Melhoria na visualização e edição de processos judiciais para permitir a gestão dos vínculos com Leilões, Lotes e Ativos.

## Funcionalidades Implementadas

### Grid de Processos (Listagem)
- **Nova Coluna**: "Leilões Vinculados"
- **Comportamento**: Exibe os leilões associados ao processo, indicando o título, se é judicial/extrajudicial e o status (Aberto/Fechado).

### Detalhes/Edição do Processo
- **Novos Grids (Master-Detail)**: Ao visualizar um processo, são exibidos cards com grids detalhando:
    1. **Lotes Vinculados**: Lista os lotes associados, com link para edição.
    2. **Ativos Vinculados**: Lista os ativos associados, com link para edição.
    3. **Leilões Vinculados**: Lista os leilões associados, com status e tipo.

## Cenários de Teste (BDD)

### Cenário 1: Visualização de Leilões na Listagem
**Dado** que existem processos cadastrados com leilões vinculados
**Quando** eu acesso a lista de processos judiciais (/admin/judicial-processes)
**Então** devo ver a coluna "Leilões Vinculados"
**E** devo ver os títulos dos leilões e seus status correspondentes

### Cenário 2: Visualização de Vínculos no Detalhe
**Dado** que eu acesso a tela de edição de um processo judicial
**Quando** eu rolo a página até o final
**Então** devo ver a seção de "Lotes Vinculados" com a lista de lotes
**E** devo ver a seção de "Ativos Vinculados" com a lista de ativos
**E** devo ver a seção de "Leilões Vinculados" com a lista de leilões

## Alterações Técnicas
- **Schema**: Atualização dos types `JudicialProcess` para incluir `auctions`, `lots`, `assets`.
- **Repository**: Atualização do `judicial-process.repository.ts` para incluir as relações de `Auction`, `Lot` e `Asset` nas queries `findAll` e `findById`.
- **Service**: Atualização do `judicial-process.service.ts` para mapear os novos dados.
- **Frontend**:
    - `columns.tsx`: Adição da coluna de leilões.
    - `judicial-process-form.tsx`: Adição dos grids de relacionamentos.
