# Cenários de Teste - AssetFormV2 (Smart Form)

Este documento descreve os cenários de teste para validar a implementação do novo formulário de ativos (`AssetFormV2`), cobrindo validações, interações de UI, e fluxos de criação/edição.

## 1. Validação de Campos Obrigatórios

**Objetivo**: Garantir que o formulário não seja submetido sem os dados essenciais.

| ID | Cenário | Ação | Resultado Esperado |
|---|---|---|---|
| VAL-01 | Submissão Vazia | Clicar em "Salvar" sem preencher nenhum campo. | Mensagens de erro devem aparecer sob os campos: Título, Categoria, Comitente/Vendedor. O formulário não deve ser enviado. |
| VAL-02 | Título Curto | Preencher "Título" com menos de 5 caracteres. | Mensagem de erro: "O título do bem deve ter pelo menos 5 caracteres." |
| VAL-03 | Título Longo | Preencher "Título" com mais de 200 caracteres. | Mensagem de erro: "O título do bem não pode exceder 200 caracteres." |
| VAL-04 | Valor Negativo | Preencher "Valor de Avaliação" com número negativo. | Mensagem de erro: "O valor de avaliação deve ser positivo." |

## 2. Fluxos de Criação (Novo Ativo)

**Objetivo**: Validar a criação de ativos com diferentes níveis de complexidade.

| ID | Cenário | Ação | Resultado Esperado |
|---|---|---|---|
| CRE-01 | Criação Básica | Preencher apenas Título, Categoria, Comitente e Status. Clicar em "Salvar". | Sucesso. Toast de confirmação "Ativo criado com sucesso!". Redirecionamento ou fechamento do modal. |
| CRE-02 | Criação Completa (Geral) | Preencher todos os campos da aba "Informações Básicas", "Localização" e "Vínculos". Selecionar uma imagem principal. | Sucesso. Todos os dados devem ser persistidos corretamente. |
| CRE-03 | Criação com Veículo | Selecionar Categoria "Veículos". Preencher campos específicos (Placa, Marca, Modelo, Ano, Quilometragem, etc.). | Sucesso. Os campos específicos de veículo devem ser salvos no `lotInfo` ou colunas correspondentes. |
| CRE-04 | Criação com Imóvel | Selecionar Categoria "Imóveis". Preencher campos específicos (Área Total, Quartos, Banheiros, Matrícula, etc.). | Sucesso. Os campos específicos de imóvel devem ser salvos. |
| CRE-05 | Criação com Subcategoria | Selecionar uma Categoria, aguardar carregamento e selecionar uma Subcategoria. | Sucesso. O ID da subcategoria deve ser salvo corretamente. |

## 3. Fluxos de Edição (Editar Ativo)

**Objetivo**: Validar se os dados existentes são carregados e atualizados corretamente.

| ID | Cenário | Ação | Resultado Esperado |
|---|---|---|---|
| EDT-01 | Carregamento de Dados | Abrir um ativo existente para edição. | Todos os campos preenchidos anteriormente devem vir populados (Título, Descrição, Selects, Imagem). |
| EDT-02 | Alteração de Status | Mudar o status de "Em Cadastro" para "Disponível". Salvar. | Sucesso. O status deve ser atualizado na listagem. |
| EDT-03 | Remoção de Imagem | Clicar no botão de lixeira na imagem principal. Salvar. | Sucesso. O ativo deve ficar sem imagem principal (`imageUrl` e `imageMediaId` limpos). |
| EDT-04 | Troca de Categoria | Alterar a Categoria de um ativo existente. | Os campos específicos devem mudar para refletir a nova categoria. (Nota: Verificar se dados antigos específicos são limpos ou mantidos). |

## 4. Interações de UI e Componentes

**Objetivo**: Testar componentes interativos dentro do formulário.

| ID | Cenário | Ação | Resultado Esperado |
|---|---|---|---|
| INT-01 | Seleção de Mídia (Dialog) | Clicar em "Selecionar da Biblioteca". Escolher uma imagem no modal. | O modal de mídia deve fechar e a imagem selecionada deve aparecer no preview do formulário. |
| INT-02 | Busca de Comitente | Digitar no campo de busca do seletor de Comitente/Vendedor. | A lista deve filtrar os comitentes pelo nome digitado. |
| INT-03 | Busca de Processo | Digitar no campo de busca do seletor de Processo Judicial. | A lista deve filtrar os processos pelo número. |
| INT-04 | Endereço (Estados/Cidades) | Selecionar um Estado. | O campo de Cidade deve ser habilitado e listar apenas as cidades daquele estado. |
| INT-05 | Botão Cancelar | Clicar em "Cancelar" (topo ou rodapé). | O formulário deve fechar (se modal) ou voltar para a página anterior (se página completa) sem salvar alterações. |

## 5. Contextos de Uso

**Objetivo**: Garantir que o formulário funcione bem em diferentes locais da aplicação.

| ID | Cenário | Contexto | Resultado Esperado |
|---|---|---|---|
| CTX-01 | Página Nova (/admin/assets/new) | Acessar via URL ou botão "Novo". | Título da página deve ser "Novo Ativo". Layout deve ocupar a tela inteira (dentro do layout admin). |
| CTX-02 | Página Edição (/admin/assets/[id]/edit) | Acessar via URL ou botão "Editar". | Título deve ser "Editar Ativo". Dados devem vir carregados. |
| CTX-03 | Modal de Listagem (/admin/assets) | Clicar em "Novo Ativo" na listagem. | O formulário deve abrir dentro de um Modal (`CrudFormContainer`). Título deve ser ajustado. Botões de ação devem estar visíveis. |
| CTX-04 | Wizard (/admin/wizard) | Acessar o passo de cadastro de ativo no Wizard. | O formulário deve ser renderizado como parte do fluxo do Wizard. |

## 6. Campos Específicos (Detalhes)

### Veículos
*   **Campos Numéricos**: Ano, Ano Modelo, Quilometragem, Portas. (Validar input numérico).
*   **Campos Booleanos**: Possui Chave (Checkbox/Switch).
*   **Selects**: Tipo de Combustível, Câmbio, Carroceria.

### Imóveis
*   **Campos Numéricos**: Áreas (Total/Construída), Quartos, Suítes, Banheiros, Vagas.
*   **Campos Booleanos**: Ocupado.
*   **Textos**: Matrícula, IPTU.

## 7. Botões e Ações

| Botão | Localização | Comportamento Esperado |
|---|---|---|
| **Salvar** | Topo (Header) | Submete o formulário. Mostra estado de *loading* (spinner/desabilitado). |
| **Cancelar** | Topo (Header) | Chama a função `onCancel`. |
| **Salvar** | Rodapé (Footer) | Idem ao do topo. |
| **Cancelar** | Rodapé (Footer) | Idem ao do topo. |
| **Selecionar da Biblioteca** | Card de Imagem | Abre o `ChooseMediaDialog`. |
| **Remover Imagem** (Lixeira) | Preview da Imagem | Limpa o campo de imagem. |

---
**Observação**: Todos os testes devem ser verificados observando o feedback visual (Toasts) e a persistência real dos dados na listagem ou banco de dados.
