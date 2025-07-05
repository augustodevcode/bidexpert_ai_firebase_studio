# Documentação das Regras de Negócio e Dicionário de Dados

Este documento descreve as regras de negócio funcionais do sistema de leilões e fornece um dicionário de dados detalhado para suas principais entidades. Ele é baseado na análise do código-fonte, incluindo `src/types/index.ts`, `actions.ts`, `firestore.adapter.ts` e `firestore.rules`.

## 1. Regras Gerais do Sistema

- **Acesso a Dados:** As regras de acesso aos dados são definidas no arquivo `firestore.rules` (ou equivalentes no adaptador de banco de dados em uso). Em produção, o acesso é granular, baseado em autenticação e permissões do usuário.
- **Permissões Chave:**
    - `manage_all`: Concede acesso total a todas as funcionalidades e dados. Tipicamente atribuída a administradores do sistema.
    - Permissões específicas de módulo (ex: `auctions:create`, `lots:update`, `users:manage_roles`, `place_bids`, `documents:verify`).
- **Timestamping:** Entidades geralmente possuem campos `createdAt` e `updatedAt` (tipo `AnyTimestamp`) para rastrear datas de criação e modificação.
- **Identificadores Públicos:** Algumas entidades como `Auction`, `Lot`, `AuctioneerProfileInfo`, `SellerProfileInfo` possuem um `publicId` (string) além do `id` interno, para uso em URLs ou comunicação externa. Máscaras para esses IDs podem ser configuradas em `PlatformSettings`.
- **Adapters de Banco de Dados:** O sistema é projetado com uma interface `IDatabaseAdapter` (definida em `src/types/index.ts`), permitindo flexibilidade na escolha do SGBD (ex: Firestore, MySQL, Postgres).

## 2. Usuários e Autenticação

### Regras Funcionais:
- **Autenticação:** Realizada via email e senha. A função `authenticateUserSql` (exemplo em `src/app/auth/actions.ts`) lida com a verificação. Em produção, senhas devem ser armazenadas com hash seguro (ex: bcrypt).
- **Criação de Usuário:** Novos usuários são criados via formulário (`UserFormValues`) e geralmente recebem um papel padrão (ex: 'USER'). A função `ensureUserRole` no adapter trata da criação/atualização e atribuição de papel.
- **Tipos de Conta:** Usuários podem ser `PHYSICAL` (Pessoa Física) ou `LEGAL` (Pessoa Jurídica), ou `DIRECT_SALE_CONSIGNOR`.

### Entidade Principal: `UserProfileData`

#### Dicionário de Dados: `UserProfileData`

| Nome do Campo        | Tipo de Dado                                  | Descrição                                                                 | Observações                                                                                                                                    |
|----------------------|-----------------------------------------------|---------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| `uid`                | `string`                                      | Identificador único do usuário (geralmente do provedor de autenticação).    | Obrigatório, Chave Primária.                                                                                                                     |
| `email`              | `string`                                      | Endereço de e-mail do usuário.                                            | Obrigatório, Usado para login. Deve ser único.                                                                                                   |
| `fullName`           | `string`                                      | Nome completo do usuário.                                                 | Obrigatório.                                                                                                                                   |
| `password`           | `string` (opcional)                           | Senha do usuário (usado para criação/atualização, não armazenado em texto). | Opcional no tipo (não é retornado). Em produção, um hash da senha é armazenado.                                                              |
| `roleId`             | `string` (opcional)                           | ID do papel (`Role`) atribuído ao usuário.                                | Opcional. Define as permissões do usuário.                                                                                                       |
| `roleName`           | `string` (opcional)                           | Nome do papel atribuído ao usuário.                                       | Opcional. Denormalizado para facilitar o acesso.                                                                                               |
| `permissions`        | `string[]` (opcional)                         | Lista de strings de permissão concedidas diretamente ou via papel.        | Opcional. Denormalizado para performance.                                                                                                      |
| `habilitationStatus` | `UserHabilitationStatus` (opcional)           | Status da habilitação do usuário para participar de leilões.              | Opcional. Valores: `PENDING_DOCUMENTS`, `PENDING_ANALYSIS`, `HABILITADO`, `REJECTED_DOCUMENTS`, `BLOCKED`.                                       |
| `cpf`                | `string` (opcional)                           | Cadastro de Pessoa Física (CPF) do usuário.                               | Opcional. Requerido para Pessoas Físicas. Formato: "000.000.000-00".                                                                            |
| `rgNumber`           | `string` (opcional)                           | Número do RG (Registro Geral) do usuário.                                 | Opcional.                                                                                                                                      |
| `rgIssuer`           | `string` (opcional)                           | Órgão emissor do RG.                                                      | Opcional.                                                                                                                                      |
| `rgIssueDate`        | `AnyTimestamp` (opcional)                     | Data de emissão do RG.                                                    | Opcional.                                                                                                                                      |
| `rgState`            | `string` (opcional)                           | Estado (UF) de emissão do RG.                                             | Opcional.                                                                                                                                      |
| `dateOfBirth`        | `AnyTimestamp` (opcional)                     | Data de nascimento do usuário.                                            | Opcional.                                                                                                                                      |
| `cellPhone`          | `string` (opcional)                           | Número do telefone celular.                                               | Opcional.                                                                                                                                      |
| `homePhone`          | `string` (opcional)                           | Número do telefone residencial.                                           | Opcional.                                                                                                                                      |
| `gender`             | `string` (opcional)                           | Gênero do usuário.                                                        | Opcional. (Ex: 'Masculino', 'Feminino', 'Outro').                                                                                              |
| `profession`         | `string` (opcional)                           | Profissão do usuário.                                                     | Opcional.                                                                                                                                      |
| `nationality`        | `string` (opcional)                           | Nacionalidade do usuário.                                                 | Opcional.                                                                                                                                      |
| `maritalStatus`      | `string` (opcional)                           | Estado civil do usuário.                                                  | Opcional. (Ex: 'Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)').                                                                     |
| `propertyRegime`     | `string` (opcional)                           | Regime de bens do casamento.                                              | Opcional. Relevante se `maritalStatus` for 'Casado(a)'. (Ex: 'Comunhão Parcial', 'Comunhão Total', 'Separação Total').                            |
| `spouseName`         | `string` (opcional)                           | Nome do cônjuge.                                                          | Opcional. Relevante se casado(a).                                                                                                              |
| `spouseCpf`          | `string` (opcional)                           | CPF do cônjuge.                                                           | Opcional. Relevante se casado(a).                                                                                                              |
| `zipCode`            | `string` (opcional)                           | CEP do endereço do usuário.                                               | Opcional. Formato: "00000-000".                                                                                                                |
| `street`             | `string` (opcional)                           | Logradouro do endereço.                                                   | Opcional.                                                                                                                                      |
| `number`             | `string` (opcional)                           | Número do endereço.                                                       | Opcional.                                                                                                                                      |
| `complement`         | `string` (opcional)                           | Complemento do endereço.                                                  | Opcional.                                                                                                                                      |
| `neighborhood`       | `string` (opcional)                           | Bairro do endereço.                                                       | Opcional.                                                                                                                                      |
| `city`               | `string` (opcional)                           | Cidade do endereço.                                                       | Opcional.                                                                                                                                      |
| `state`              | `string` (opcional)                           | Estado (UF) do endereço.                                                  | Opcional. Sigla de 2 letras.                                                                                                                   |
| `status`             | `string` (opcional)                           | Status genérico da conta do usuário (ex: 'ATIVO', 'INATIVO', 'SUSPENSO'). | Opcional.                                                                                                                                      |
| `optInMarketing`     | `boolean` (opcional)                          | Indica se o usuário aceita receber comunicações de marketing.             | Opcional. Default: `false`.                                                                                                                    |
| `createdAt`          | `AnyTimestamp` (opcional)                     | Data e hora de criação do perfil do usuário.                              | Opcional. Preenchido automaticamente.                                                                                                          |
| `updatedAt`          | `AnyTimestamp` (opcional)                     | Data e hora da última atualização do perfil do usuário.                     | Opcional. Preenchido automaticamente.                                                                                                          |
| `avatarUrl`          | `string` (opcional)                           | URL da imagem de avatar do usuário.                                       | Opcional.                                                                                                                                      |
| `dataAiHint`         | `string` (opcional)                           | Campo para armazenar dicas ou dados para processamento por IA (ex: perfil). | Opcional.                                                                                                                                      |
| `activeBids`         | `number` (opcional)                           | Número de lances ativos do usuário.                                       | Opcional. Calculado ou atualizado por gatilhos.                                                                                                |
| `auctionsWon`        | `number` (opcional)                           | Número de leilões/lotes arrematados pelo usuário.                         | Opcional. Calculado ou atualizado por gatilhos.                                                                                                |
| `itemsSold`          | `number` (opcional)                           | Número de itens vendidos pelo usuário (se for um vendedor/comitente).     | Opcional.                                                                                                                                      |
| `sellerProfileId`    | `string` (opcional)                           | ID do perfil de vendedor (`SellerProfileInfo`) associado a este usuário.  | Opcional. Link se o usuário também é um vendedor.                                                                                              |
| `accountType`        | `'PHYSICAL' \| 'LEGAL' \| 'DIRECT_SALE_CONSIGNOR'` (opcional) | Tipo de conta do usuário.                                                 | Opcional. Define se é pessoa física, jurídica ou um comitente de venda direta.                                                                |
| `razaoSocial`        | `string` (opcional)                           | Razão Social da empresa (se `accountType` for 'LEGAL').                   | Opcional.                                                                                                                                      |
| `cnpj`               | `string` (opcional)                           | CNPJ da empresa (se `accountType` for 'LEGAL').                           | Opcional. Formato: "00.000.000/0000-00".                                                                                                       |
| `inscricaoEstadual`  | `string` (opcional)                           | Inscrição Estadual da empresa (se `accountType` for 'LEGAL').             | Opcional.                                                                                                                                      |
| `websiteComitente`   | `string` (opcional)                           | Website do comitente (se aplicável).                                      | Opcional.                                                                                                                                      |

**Status de Habilitação (`UserHabilitationStatus` - Enum):**
`PENDING_DOCUMENTS`, `PENDING_ANALYSIS`, `HABILITADO`, `REJECTED_DOCUMENTS`, `BLOCKED`.

**Tipos de Conta (`accountType` - Enum):**
`PHYSICAL`, `LEGAL`, `DIRECT_SALE_CONSIGNOR`.

## 3. Papéis e Permissões

### Regras Funcionais:
- **Modelo de Papéis (`Role`):** Cada papel define um conjunto de permissões. Usuários herdam permissões de seu papel.
- **Permissões (`permissions.ts`):** Strings que concedem acesso a funcionalidades específicas (ex: `auctions:create`). A permissão `manage_all` concede acesso total.
- **Atribuição:** Administradores gerenciam papéis e suas atribuições a usuários.

### Entidade Principal: `Role`

#### Dicionário de Dados: `Role`

| Nome do Campo     | Tipo de Dado   | Descrição                                                        | Observações                                                                                                |
|-------------------|----------------|------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| `id`              | `string`       | Identificador único do papel.                                    | Obrigatório, Chave Primária.                                                                               |
| `name`            | `string`       | Nome do papel (ex: 'ADMINISTRATOR', 'USER', 'CONSIGNOR').        | Obrigatório, Único.                                                                                        |
| `name_normalized` | `string` (opcional) | Nome do papel normalizado (ex: para busca ou uso interno).       | Opcional. Ex: lowercase, sem espaços.                                                                      |
| `description`     | `string` (opcional) | Descrição das responsabilidades ou do propósito do papel.        | Opcional.                                                                                                  |
| `permissions`     | `string[]`     | Lista de strings de permissão associadas a este papel.           | Obrigatório. Define o que usuários com este papel podem fazer.                                             |
| `createdAt`       | `AnyTimestamp` | Data e hora de criação do papel.                                  | Obrigatório. Preenchido automaticamente.                                                                   |
| `updatedAt`       | `AnyTimestamp` | Data e hora da última atualização do papel.                        | Obrigatório. Preenchido automaticamente.                                                                   |

## 4. Habilitação de Usuários

### Regras Funcionais:
- **Processo:** Para participar de leilões, usuários precisam ser habilitados. Isso envolve o envio de documentos (`UserDocument`) que são analisados por administradores. O `UserHabilitationStatus` reflete o estágio desse processo.
- **Documentos Necessários:** Definidos pela entidade `DocumentType`, que especifica quais documentos são obrigatórios.

### Entidade Principal: `UserDocument`

#### Dicionário de Dados: `UserDocument`

| Nome do Campo      | Tipo de Dado         | Descrição                                                              | Observações                                                                                                                               |
|--------------------|----------------------|------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| `id`               | `string`             | Identificador único do documento do usuário.                           | Obrigatório, Chave Primária.                                                                                                              |
| `documentTypeId`   | `string`             | ID do tipo de documento (`DocumentType`) que este registro representa. | Obrigatório. Relação com `DocumentType.id`.                                                                                                 |
| `userId`           | `string`             | ID do usuário (`UserProfileData.uid`) a quem este documento pertence.  | Obrigatório. Relação com `UserProfileData.uid`.                                                                                             |
| `fileUrl`          | `string` (opcional)  | URL onde o arquivo do documento enviado está armazenado.               | Opcional. Preenchido após o upload bem-sucedido.                                                                                          |
| `status`           | `UserDocumentStatus` | Status atual do documento no processo de verificação.                  | Obrigatório. Valores: `NOT_SENT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `PENDING_ANALYSIS`.                                                 |
| `uploadDate`       | `AnyTimestamp` (opcional) | Data e hora do upload do documento.                                  | Opcional. Preenchido quando o `fileUrl` é definido.                                                                                         |
| `analysisDate`     | `AnyTimestamp` (opcional) | Data e hora da análise do documento.                                 | Opcional. Preenchido quando o status muda para `APPROVED` ou `REJECTED`.                                                                  |
| `analystId`        | `string` (opcional)  | ID do administrador/analista que revisou o documento.                  | Opcional. Relação com `UserProfileData.uid`.                                                                                              |
| `rejectionReason`  | `string` (opcional)  | Motivo da rejeição do documento, se `status` for `REJECTED`.         | Opcional.                                                                                                                                 |
| `documentType`     | `DocumentType`       | Objeto aninhado contendo os detalhes do tipo de documento.             | Obrigatório. Geralmente populado via join ou na lógica da aplicação, denormalizando dados de `DocumentType` para fácil acesso.             |

**Status do Documento (`UserDocumentStatus` - Enum):**
`NOT_SENT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `PENDING_ANALYSIS`.

### Entidade Relacionada: `DocumentType`

#### Dicionário de Dados: `DocumentType`

| Nome do Campo    | Tipo de Dado    | Descrição                                                              | Observações                                                                                                |
|------------------|-----------------|------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| `id`             | `string`        | Identificador único do tipo de documento.                              | Obrigatório, Chave Primária.                                                                               |
| `name`           | `string`        | Nome do tipo de documento (ex: "RG", "CPF", "Comprovante de Endereço"). | Obrigatório.                                                                                               |
| `description`    | `string` (opcional) | Descrição ou instruções adicionais sobre o tipo de documento.        | Opcional.                                                                                                  |
| `isRequired`     | `boolean`       | Indica se este tipo de documento é obrigatório para habilitação.         | Obrigatório.                                                                                               |
| `allowedFormats` | `string[]` (opcional) | Lista de formatos de arquivo permitidos (ex: ["pdf", "jpg", "png"]). | Opcional. Se não definido, pode aceitar qualquer formato ou ter um padrão no sistema.                        |
| `displayOrder`   | `number` (opcional) | Ordem em que este tipo de documento deve ser exibido na interface.     | Opcional. Usado para organizar a lista de documentos para o usuário.                                       |

## 5. Leilões

### Regras Funcionais:
- **Criação e Gerenciamento:** Leilões são criados e gerenciados por administradores ou usuários com permissões (`auctions:create`, `auctions:manage_own`).
- **Status:** O `AuctionStatus` controla a visibilidade e a capacidade de dar lances.
- **Tipos:** `JUDICIAL`, `EXTRAJUDICIAL`, `PARTICULAR`.
- **Praças (`AuctionStage`):** Leilões podem ter múltiplas fases, cada com datas e condições próprias.

### Entidade Principal: `Auction`

#### Dicionário de Dados: `Auction`

| Nome do Campo         | Tipo de Dado                                     | Descrição                                                                 | Observações                                                                                                                                                              |
|-----------------------|--------------------------------------------------|---------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `id`                  | `string`                                         | Identificador único do leilão.                                            | Obrigatório, Chave Primária.                                                                                                                                             |
| `publicId`            | `string`                                         | Identificador público do leilão (para URLs, etc.).                        | Obrigatório, Único. Gerado com base em `PlatformSettings.platformPublicIdMasks.auctions`.                                                                              |
| `title`               | `string`                                         | Título principal do leilão.                                               | Obrigatório.                                                                                                                                                             |
| `fullTitle`           | `string` (opcional)                              | Título completo ou mais descritivo do leilão.                             | Opcional.                                                                                                                                                              |
| `description`         | `string` (opcional)                              | Descrição detalhada do leilão.                                            | Opcional. Pode conter HTML ou Markdown.                                                                                                                                  |
| `status`              | `AuctionStatus`                                  | Status atual do leilão.                                                   | Obrigatório. Valores: `EM_BREVE`, `ABERTO_PARA_LANCES`, `ENCERRADO`, `FINALIZADO`, `ABERTO` (sinônimo de ABERTO_PARA_LANCES), `CANCELADO`, `SUSPENSO`.                     |
| `auctionType`         | `'JUDICIAL' \| 'EXTRAJUDICIAL' \| 'PARTICULAR'` (opcional) | Tipo do leilão.                                                         | Opcional.                                                                                                                                                              |
| `category`            | `string`                                         | Nome da categoria principal do leilão.                                    | Obrigatório. Denormalizado de `LotCategory.name`.                                                                                                                          |
| `categoryId`          | `string` (opcional)                              | ID da categoria (`LotCategory.id`) principal do leilão.                   | Opcional. Relação com `LotCategory.id`.                                                                                                                                  |
| `auctioneer`          | `string`                                         | Nome do leiloeiro responsável.                                            | Obrigatório. Denormalizado de `AuctioneerProfileInfo.name`.                                                                                                              |
| `auctioneerId`        | `string` (opcional)                              | ID do leiloeiro (`AuctioneerProfileInfo.id`).                             | Opcional. Relação com `AuctioneerProfileInfo.id`.                                                                                                                        |
| `seller`              | `string` (opcional)                              | Nome do comitente/vendedor principal.                                     | Opcional. Denormalizado de `SellerProfileInfo.name`.                                                                                                                     |
| `sellerId`            | `string` (opcional)                              | ID do comitente/vendedor (`SellerProfileInfo.id`).                        | Opcional. Relação com `SellerProfileInfo.id`.                                                                                                                            |
| `auctionDate`         | `AnyTimestamp`                                   | Data e hora de início do leilão (ou da primeira praça).                   | Obrigatório.                                                                                                                                                             |
| `endDate`             | `AnyTimestamp` (opcional)                        | Data e hora de término prevista para o leilão (ou da última praça).       | Opcional.                                                                                                                                                              |
| `auctionStages`       | `AuctionStage[]` (opcional)                      | Lista de estágios/praças do leilão, se houver múltiplas.                  | Opcional.                                                                                                                                                              |
| `city`                | `string` (opcional)                              | Cidade onde os bens do leilão estão predominantemente localizados.          | Opcional.                                                                                                                                                              |
| `state`               | `string` (opcional)                              | Estado (UF) onde os bens do leilão estão predominantemente localizados.   | Opcional.                                                                                                                                                              |
| `imageUrl`            | `string` (opcional)                              | URL da imagem principal de capa do leilão.                                | Opcional.                                                                                                                                                              |
| `dataAiHint`          | `string` (opcional)                              | Campo para dicas ou dados para IA relacionados ao leilão.                 | Opcional.                                                                                                                                                              |
| `documentsUrl`        | `string` (opcional)                              | URL para documentos importantes do leilão (ex: edital completo).          | Opcional.                                                                                                                                                              |
| `totalLots`           | `number` (opcional)                              | Número total de lotes neste leilão.                                       | Opcional. Pode ser calculado dinamicamente.                                                                                                                              |
| `visits`              | `number` (opcional)                              | Número de visualizações da página do leilão.                              | Opcional.                                                                                                                                                              |
| `lots`                | `Lot[]` (opcional)                               | Lista de lotes do leilão (geralmente não armazenado diretamente no objeto Auction no DB, mas populado sob demanda). | Opcional.                                                                                                                                                              |
| `initialOffer`        | `number` (opcional)                              | Menor valor inicial entre todos os lotes do leilão.                       | Opcional. Informativo.                                                                                                                                                   |
| `isFavorite`          | `boolean` (opcional)                             | Indica se o leilão foi marcado como favorito pelo usuário logado.         | Opcional. Específico do contexto do usuário.                                                                                                                             |
| `currentBid`          | `number` (opcional)                              | O valor do lance mais alto atual em todo o leilão (pode não ser aplicável). | Opcional.                                                                                                                                                              |
| `bidsCount`           | `number` (opcional)                              | Número total de lances em todos os lotes do leilão.                       | Opcional. Calculado.                                                                                                                                                     |
| `sellingBranch`       | `string` (opcional)                              | Filial ou local específico de venda (relevante para alguns comitentes).   | Opcional.                                                                                                                                                              |
| `vehicleLocation`     | `string` (opcional)                              | Localização dos veículos (se for um leilão de veículos).                  | Opcional.                                                                                                                                                              |
| `createdAt`           | `AnyTimestamp`                                   | Data e hora de criação do registro do leilão.                             | Obrigatório. Preenchido automaticamente.                                                                                                                                 |
| `updatedAt`           | `AnyTimestamp`                                   | Data e hora da última atualização do registro do leilão.                  | Obrigatório. Preenchido automaticamente.                                                                                                                                 |
| `auctioneerLogoUrl`   | `string` (opcional)                              | URL do logo do leiloeiro.                                                 | Opcional. Denormalizado para exibição.                                                                                                                                   |
| `auctioneerName`      | `string` (opcional)                              | Nome do leiloeiro (duplica `auctioneer` mas pode ser usado em contextos onde o objeto principal não está completo). | Opcional.                                                                                                                                                              |

**Status do Leilão (`AuctionStatus` - Enum):**
`EM_BREVE`, `ABERTO_PARA_LANCES`, `ENCERRADO`, `FINALIZADO`, `ABERTO`, `CANCELADO`, `SUSPENSO`.

**Tipos de Leilão (`auctionType` - Enum):**
`JUDICIAL`, `EXTRAJUDICIAL`, `PARTICULAR`.

### Entidade Relacionada: `AuctionStage`

#### Dicionário de Dados: `AuctionStage`

| Nome do Campo | Tipo de Dado   | Descrição                                           | Observações                                                              |
|---------------|----------------|-----------------------------------------------------|--------------------------------------------------------------------------|
| `name`        | `string`       | Nome do estágio/praça (ex: "1ª Praça", "2ª Praça"). | Obrigatório.                                                             |
| `endDate`     | `AnyTimestamp` | Data e hora de término deste estágio/praça.         | Obrigatório.                                                             |
| `statusText`  | `string` (opcional) | Texto descritivo do status do estágio.              | Opcional. Ex: "Aguardando Início", "Em Andamento", "Encerrada".         |

## 6. Lotes

### Regras Funcionais:
- **Cadastro e Gerenciamento:** Lotes são criados associados a um leilão, por administradores ou usuários com permissão.
- **Status:** `LotStatus` controla a visibilidade e capacidade de dar lances no lote.
- **Precificação:** `initialPrice` (valor inicial), `secondInitialPrice` (para 2ª praça), e `price` (valor atual do lance mais alto).

### Entidade Principal: `Lot`

#### Dicionário de Dados: `Lot`
| Nome do Campo             | Tipo de Dado         | Descrição                                                                    | Observações                                                                                                                                                            |
|---------------------------|----------------------|------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `id`                      | `string`             | Identificador único do lote.                                                 | Obrigatório, Chave Primária.                                                                                                                                           |
| `publicId`                | `string`             | Identificador público do lote.                                               | Obrigatório, Único. Gerado com base em `PlatformSettings.platformPublicIdMasks.lots`.                                                                                |
| `auctionId`               | `string`             | ID do leilão (`Auction.id`) ao qual este lote pertence.                      | Obrigatório. Relação com `Auction.id`.                                                                                                                                 |
| `title`                   | `string`             | Título descritivo do lote.                                                   | Obrigatório.                                                                                                                                                           |
| `number`                  | `string` (opcional)  | Número do lote dentro do leilão.                                             | Opcional. Pode ser sequencial ou alfanumérico.                                                                                                                         |
| `imageUrl`                | `string`             | URL da imagem principal do lote.                                             | Obrigatório (ou um placeholder padrão).                                                                                                                                |
| `dataAiHint`              | `string` (opcional)  | Campo para dicas ou dados para IA relacionados ao lote.                      | Opcional.                                                                                                                                                            |
| `galleryImageUrls`        | `string[]` (opcional)| Lista de URLs de imagens adicionais para a galeria do lote.                  | Opcional.                                                                                                                                                            |
| `mediaItemIds`            | `string[]` (opcional)| Lista de IDs de `MediaItem` associados a este lote.                          | Opcional. Relação com `MediaItem.id`.                                                                                                                                |
| `status`                  | `LotStatus`          | Status atual do lote.                                                        | Obrigatório. Valores: `ABERTO_PARA_LANCES`, `EM_BREVE`, `ENCERRADO`, `VENDIDO`, `NAO_VENDIDO`.                                                                       |
| `stateId`                 | `string` (opcional)  | ID do estado (`StateInfo.id`) onde o lote está localizado.                   | Opcional. Relação com `StateInfo.id`.                                                                                                                                  |
| `cityId`                  | `string` (opcional)  | ID da cidade (`CityInfo.id`) onde o lote está localizado.                    | Opcional. Relação com `CityInfo.id`.                                                                                                                                   |
| `cityName`                | `string` (opcional)  | Nome da cidade (denormalizado).                                              | Opcional.                                                                                                                                                            |
| `stateUf`                 | `string` (opcional)  | UF do estado (denormalizado).                                                | Opcional.                                                                                                                                                            |
| `type`                    | `string`             | Nome da categoria do lote.                                                   | Obrigatório. Denormalizado de `LotCategory.name`.                                                                                                                      |
| `categoryId`              | `string` (opcional)  | ID da categoria (`LotCategory.id`) do lote.                                  | Opcional. Relação com `LotCategory.id`.                                                                                                                                |
| `views`                   | `number` (opcional)  | Número de visualizações da página do lote.                                   | Opcional.                                                                                                                                                            |
| `auctionName`             | `string` (opcional)  | Nome do leilão (denormalizado).                                              | Opcional.                                                                                                                                                            |
| `price`                   | `number`             | Preço atual do lote (geralmente o valor do lance mais alto).                 | Obrigatório. Atualizado dinamicamente durante o leilão.                                                                                                                |
| `initialPrice`            | `number` (opcional)  | Valor inicial de lance para o lote (1ª praça).                               | Opcional. Se não definido, pode usar um valor padrão ou ser 0.                                                                                                       |
| `auctionDate`             | `AnyTimestamp` (opcional) | Data do leilão a que o lote pertence (informativo).                        | Opcional. Pode ser a data de início do leilão ou da praça específica.                                                                                                |
| `secondAuctionDate`       | `AnyTimestamp` (opcional) | Data de início da segunda praça/fase para este lote, se aplicável.         | Opcional.                                                                                                                                                            |
| `secondInitialPrice`      | `number` (opcional)  | Valor inicial de lance para a segunda praça/fase, se aplicável.              | Opcional.                                                                                                                                                            |
| `endDate`                 | `AnyTimestamp`       | Data e hora de encerramento para lances neste lote.                          | Obrigatório.                                                                                                                                                           |
| `bidsCount`               | `number` (opcional)  | Número total de lances recebidos por este lote.                              | Opcional. Calculado.                                                                                                                                                   |
| `isFavorite`              | `boolean` (opcional) | Indica se o lote foi marcado como favorito pelo usuário logado.              | Opcional. Específico do contexto do usuário.                                                                                                                           |
| `isFeatured`              | `boolean` (opcional) | Indica se o lote está em destaque.                                           | Opcional. Definido por administradores.                                                                                                                                |
| `description`             | `string` (opcional)  | Descrição detalhada do lote.                                                 | Opcional. Pode conter HTML ou Markdown.                                                                                                                                |
| `year`                    | `number` (opcional)  | Ano do item (ex: veículo, equipamento).                                      | Opcional.                                                                                                                                                            |
| `make`                    | `string` (opcional)  | Fabricante/Marca do item.                                                    | Opcional.                                                                                                                                                            |
| `model`                   | `string` (opcional)  | Modelo do item.                                                              | Opcional.                                                                                                                                                            |
| `series`                  | `string` (opcional)  | Série do item.                                                               | Opcional.                                                                                                                                                            |
| `stockNumber`             | `string` (opcional)  | Número de estoque interno.                                                   | Opcional.                                                                                                                                                            |
| `sellingBranch`           | `string` (opcional)  | Filial de venda.                                                             | Opcional.                                                                                                                                                            |
| `vin`                     | `string` (opcional)  | Número de Identificação do Veículo (Chassi).                                 | Opcional. Para veículos.                                                                                                                                               |
| `vinStatus`               | `string` (opcional)  | Status do VIN (ex: "Limpo", "Salvado").                                      | Opcional.                                                                                                                                                            |
| `lossType`                | `string` (opcional)  | Tipo de perda/sinistro (para veículos de seguradora).                        | Opcional.                                                                                                                                                            |
| `primaryDamage`           | `string` (opcional)  | Dano principal (para veículos de seguradora).                                | Opcional.                                                                                                                                                            |
| `titleInfo`               | `string` (opcional)  | Informações sobre o título/documento do veículo.                             | Opcional.                                                                                                                                                            |
| `titleBrand`              | `string` (opcional)  | "Marca" no título (ex: "Recuperado de Roubo").                               | Opcional.                                                                                                                                                            |
| `startCode`               | `string` (opcional)  | Código de partida do motor (ex: "Liga e Anda", "Não Liga").                  | Opcional.                                                                                                                                                            |
| `hasKey`                  | `boolean` (opcional) | Indica se o veículo possui chave.                                            | Opcional.                                                                                                                                                            |
| `odometer`                | `string` (opcional)  | Leitura do hodômetro.                                                        | Opcional. Pode incluir unidade (km/milhas) ou status (real/não real).                                                                                                |
| `airbagsStatus`           | `string` (opcional)  | Status dos airbags (ex: "Intactos", "Deflagrados").                          | Opcional.                                                                                                                                                            |
| `bodyStyle`               | `string` (opcional)  | Estilo da carroceria (ex: "Sedan", "SUV", "Hatchback").                      | Opcional.                                                                                                                                                            |
| `engineDetails`           | `string` (opcional)  | Detalhes do motor (ex: "2.0L 4-Cilindros Turbo").                            | Opcional.                                                                                                                                                            |
| `transmissionType`        | `string` (opcional)  | Tipo de transmissão (ex: "Automática", "Manual").                            | Opcional.                                                                                                                                                            |
| `driveLineType`           | `string` (opcional)  | Tipo de tração (ex: "FWD", "RWD", "AWD").                                    | Opcional.                                                                                                                                                            |
| `fuelType`                | `string` (opcional)  | Tipo de combustível (ex: "Gasolina", "Diesel", "Flex").                      | Opcional.                                                                                                                                                            |
| `cylinders`               | `string` (opcional)  | Número de cilindros do motor.                                                | Opcional.                                                                                                                                                            |
| `restraintSystem`         | `string` (opcional)  | Sistema de retenção (cintos de segurança, etc.).                             | Opcional.                                                                                                                                                            |
| `exteriorInteriorColor`   | `string` (opcional)  | Cor externa / Cor interna.                                                   | Opcional. Ex: "Preto/Cinza".                                                                                                                                         |
| `options`                 | `string` (opcional)  | Lista de opcionais do veículo.                                               | Opcional.                                                                                                                                                            |
| `manufacturedIn`          | `string` (opcional)  | País de fabricação.                                                          | Opcional.                                                                                                                                                            |
| `vehicleClass`            | `string` (opcional)  | Classe do veículo.                                                           | Opcional.                                                                                                                                                            |
| `lotSpecificAuctionDate`  | `AnyTimestamp` (opcional) | Data específica de início de leilão para este lote (se diferente do leilão). | Opcional.                                                                                                                                                            |
| `vehicleLocationInBranch` | `string` (opcional)  | Localização do veículo dentro da filial.                                     | Opcional.                                                                                                                                                            |
| `laneRunNumber`           | `string` (opcional)  | Número da fila/ordem de passagem no leilão físico (se aplicável).            | Opcional.                                                                                                                                                            |
| `aisleStall`              | `string` (opcional)  | Corredor/Vaga onde o veículo está.                                           | Opcional.                                                                                                                                                            |
| `actualCashValue`         | `string` (opcional)  | Valor de mercado do veículo antes do dano (para salvados).                 | Opcional.                                                                                                                                                            |
| `estimatedRepairCost`     | `string` (opcional)  | Custo estimado de reparo (para salvados).                                    | Opcional.                                                                                                                                                            |
| `sellerName`              | `string` (opcional)  | Nome do vendedor/comitente do lote (denormalizado).                          | Opcional. Relação com `SellerProfileInfo.name`.                                                                                                                      |
| `sellerId`                | `string` (opcional)  | ID do vendedor/comitente do lote.                                            | Opcional. Relação com `SellerProfileInfo.id`.                                                                                                                      |
| `auctioneerName`          | `string` (opcional)  | Nome do leiloeiro do leilão deste lote (denormalizado).                      | Opcional. Relação com `AuctioneerProfileInfo.name`.                                                                                                                  |
| `auctioneerId`            | `string` (opcional)  | ID do leiloeiro do leilão deste lote.                                        | Opcional. Relação com `AuctioneerProfileInfo.id`.                                                                                                                  |
| `condition`               | `string` (opcional)  | Condição geral do lote (ex: "Novo", "Usado", "No estado").                   | Opcional.                                                                                                                                                            |
| `createdAt`               | `AnyTimestamp` (opcional) | Data e hora de criação do registro do lote.                                | Opcional. Preenchido automaticamente.                                                                                                                                |
| `updatedAt`               | `AnyTimestamp` (opcional) | Data e hora da última atualização do registro do lote.                       | Opcional. Preenchido automaticamente.                                                                                                                                |

**Status do Lote (`LotStatus` - Enum):**
`ABERTO_PARA_LANCES`, `EM_BREVE`, `ENCERRADO`, `VENDIDO`, `NAO_VENDIDO`.

## 7. Lances

### Regras Funcionais:
- **Processo:** Usuários habilitados (`UserHabilitationStatus = HABILITADO`) podem dar lances em lotes com status `ABERTO_PARA_LANCES`.
- **Validações de Lance:**
    - O usuário deve estar autenticado e habilitado.
    - O leilão e o lote devem estar abertos para lances.
    - O valor do lance (`amount`) deve ser superior ao lance atual do lote (`Lot.price`).
    - O valor do lance deve respeitar um incremento mínimo sobre o lance atual.

### 7.1. Incrementos de Lance
- O sistema deve definir regras claras para o incremento mínimo de lance. Este incremento pode ser:
    - **Global:** Um valor padrão ou percentual aplicado a todos os lotes.
    - **Por Categoria:** Categorias específicas de lotes podem ter regras de incremento próprias.
    - **Por Faixa de Valor:** O incremento pode variar de acordo com o valor atual do lance no lote (ex: lances até R$100 têm incremento de R$10, lances de R$100,01 a R$500 têm incremento de R$20, etc.).
    - **Específico do Leilão/Lote:** Em casos raros, um leilão ou lote individual pode ter uma regra de incremento customizada.
- A configuração destes incrementos deve ser gerenciável por administradores do sistema (potencialmente em `PlatformSettings` ou em uma seção dedicada de configuração de leilões).
- O sistema deve sempre exibir claramente para o licitante qual o próximo lance mínimo aceitável.

### 7.2. Lance Automático (Proxy Bidding / Lance Máximo)
- **Funcionalidade:** Permite que um licitante insira o valor máximo que está disposto a pagar por um lote. Este valor máximo é mantido em sigilo pelo sistema.
- **Operação:**
    - Quando um lance máximo é registrado, o sistema automaticamente fará lances em nome do licitante, apenas o suficiente para cobrir o lance anterior de outro concorrente, respeitando o incremento mínimo configurado para o lote.
    - Os lances automáticos só são acionados quando outro licitante faz um lance no mesmo lote.
    - Se dois licitantes registrarem lances máximos, o sistema fará lances incrementais entre eles até que o lance máximo de um deles seja atingido.
    - Em caso de lances máximos idênticos, o licitante que registrou seu valor máximo primeiro terá a prioridade (ou seja, seu lance será considerado o vigente pelo valor idêntico).
    - Se um lance manual de outro licitante superar o lance máximo de um usuário que utiliza o proxy bidding, este último deixa de ser o licitante ganhador, a menos que aumente seu lance máximo.
- **Interface:** O usuário deve ser informado se seu lance máximo foi superado e se ele ainda está ganhando o lote.
- **Observação:** A efetiva implementação desta funcionalidade no backend (ações e lógica de servidor) não foi completamente confirmada durante a análise inicial do código (`actions.ts`), embora a interface do usuário possa sugerir sua existência. Uma validação completa da lógica de servidor é necessária.

### 7.3. Registro de Lances
- Cada lance válido (manual ou automático) é registrado na entidade `BidInfo`.
- O campo `Lot.price` é atualizado com o valor do novo lance mais alto.
- O campo `Lot.bidsCount` é incrementado.
- O usuário que efetuou o lance é notificado da aceitação do seu lance.
- Outros usuários interessados no lote (ex: que já deram lances ou marcaram como favorito) podem ser notificados sobre o novo lance.

### Entidade Principal: `BidInfo` (Registro de Lance)

#### Dicionário de Dados: `BidInfo`

| Nome do Campo   | Tipo de Dado   | Descrição                                                            | Observações                                                                                                  |
|-----------------|----------------|----------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| `id`            | `string`       | Identificador único do lance.                                        | Obrigatório, Chave Primária.                                                                                 |
| `lotId`         | `string`       | ID do lote (`Lot.id`) ao qual este lance se refere.                  | Obrigatório. Relação com `Lot.id`.                                                                           |
| `auctionId`     | `string`       | ID do leilão (`Auction.id`) ao qual este lance pertence.             | Obrigatório. Relação com `Auction.id`.                                                                       |
| `bidderId`      | `string`       | ID do usuário (`UserProfileData.uid`) que fez o lance.               | Obrigatório. Relação com `UserProfileData.uid`.                                                                |
| `bidderDisplay` | `string`       | Nome de exibição do licitante (pode ser o nome completo ou um apelido). | Obrigatório. Para exibição no histórico de lances.                                                           |
| `amount`        | `number`       | Valor do lance.                                                      | Obrigatório. Deve ser positivo.                                                                              |
| `timestamp`     | `AnyTimestamp` | Data e hora em que o lance foi registrado.                             | Obrigatório. Preenchido automaticamente.                                                                     |

### Entidade Relacionada: `UserBid` (Visão do Usuário sobre seus Lances)

#### Dicionário de Dados: `UserBid`

| Nome do Campo     | Tipo de Dado    | Descrição                                                                 | Observações                                                                                                             |
|-------------------|-----------------|---------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| `id`              | `string`        | Identificador único do registro de lance do usuário.                        | Obrigatório, Chave Primária (pode ser o mesmo que `BidInfo.id` ou um ID específico para esta visão).                   |
| `lotId`           | `string`        | ID do lote.                                                               | Obrigatório.                                                                                                          |
| `auctionId`       | `string`        | ID do leilão.                                                             | Obrigatório.                                                                                                          |
| `lotTitle`        | `string`        | Título do lote (denormalizado).                                           | Obrigatório. Para exibição na lista de lances do usuário.                                                               |
| `lotImageUrl`     | `string`        | URL da imagem principal do lote (denormalizado).                          | Obrigatório.                                                                                                          |
| `lotImageAiHint`  | `string` (opcional) | Hint de IA para a imagem do lote.                                       | Opcional.                                                                                                               |
| `userBidAmount`   | `number`        | O valor do lance mais alto deste usuário para este lote.                    | Obrigatório.                                                                                                          |
| `currentLotPrice` | `number`        | O preço atual do lote (lance mais alto de qualquer usuário).                | Obrigatório. Para o usuário comparar com seu lance.                                                                     |
| `bidStatus`       | `UserBidStatus` | Status do lance do usuário em relação ao lote.                            | Obrigatório. Valores: `GANHANDO`, `PERDENDO`, `SUPERADO_POR_OUTRO`, `SUPERADO_PELO_PROPRIO_MAXIMO`, `ARREMATADO`, `NAO_ARREMATADO`. |
| `bidDate`         | `AnyTimestamp`  | Data e hora do último lance deste usuário neste lote.                       | Obrigatório.                                                                                                          |
| `lotEndDate`      | `AnyTimestamp`  | Data e hora de encerramento do lote (denormalizado).                        | Obrigatório. Para o usuário saber o prazo.                                                                              |

**Status do Lance do Usuário (`UserBidStatus` - Enum):**
`GANHANDO` (Seu lance é o maior no momento),
`PERDENDO` (Outro licitante tem um lance maior),
`SUPERADO_POR_OUTRO` (Seu lance foi coberto por outro licitante),
`SUPERADO_PELO_PROPRIO_MAXIMO` (Seu lance máximo cobriu um lance de outro, e seu lance máximo ainda é o maior, mas o valor exibido do lote aumentou),
`ARREMATADO` (Você venceu o lote),
`NAO_ARREMATADO` (O lote encerrou e você não venceu).

## 8. Pós-Arremate e Pagamentos

### Regras Funcionais:
- **Arremate:** Quando um lote é encerrado, o usuário com o maior lance é o vencedor. Um registro `UserWin` é criado.
- **Pagamento:** O arrematante deve proceder com o pagamento. O `PaymentStatus` em `UserWin` rastreia esse processo.
- **Integração Externa:** O processamento real do pagamento (gateway, etc.) é uma integração externa.

### Entidade Principal: `UserWin`

#### Dicionário de Dados: `UserWin`

| Nome do Campo       | Tipo de Dado    | Descrição                                                              | Observações                                                                                                   |
|---------------------|-----------------|------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| `id`                | `string`        | Identificador único do registro de arremate.                           | Obrigatório, Chave Primária.                                                                                  |
| `lot`               | `Lot`           | Objeto completo ou parcial do lote (`Lot`) arrematado.                 | Obrigatório. Contém os detalhes do item vencido.                                                              |
| `winningBidAmount`  | `number`        | Valor do lance vencedor.                                               | Obrigatório.                                                                                                  |
| `winDate`           | `AnyTimestamp`  | Data e hora em que o lote foi arrematado.                              | Obrigatório.                                                                                                  |
| `paymentStatus`     | `PaymentStatus` | Status do pagamento do lote arrematado.                                | Obrigatório. Valores: `PENDENTE`, `PROCESSANDO`, `PAGO`, `FALHOU`, `REEMBOLSADO`.                               |
| `invoiceUrl`        | `string` (opcional) | URL para a fatura ou comprovante de pagamento.                         | Opcional. Preenchido após o pagamento ser confirmado.                                                         |

**Status de Pagamento (`PaymentStatus` - Enum):**
`PENDENTE`, `PROCESSANDO`, `PAGO`, `FALHOU`, `REEMBOLSADO`.

## 9. Comitentes (Vendedores)

### Regras Funcionais:
- **Perfil:** Comitentes (`SellerProfileInfo`) são as entidades que disponibilizam itens para leilão. Podem ser usuários da plataforma com `accountType` apropriado ou entidades cadastradas por administradores.
- **Gerenciamento:** CRUD de perfis de comitentes é geralmente uma função administrativa.

### Entidade Principal: `SellerProfileInfo`

#### Dicionário de Dados: `SellerProfileInfo`
| Nome do Campo             | Tipo de Dado   | Descrição                                                                  | Observações                                                                                                                                                                 |
|---------------------------|----------------|----------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `id`                      | `string`       | Identificador único do perfil do comitente/vendedor.                       | Obrigatório, Chave Primária.                                                                                                                                                |
| `publicId`                | `string`       | Identificador público do comitente.                                        | Obrigatório, Único. Gerado com base em `PlatformSettings.platformPublicIdMasks.sellers`.                                                                                  |
| `name`                    | `string`       | Nome do comitente (pode ser nome fantasia para PJ ou nome da pessoa física). | Obrigatório.                                                                                                                                                                |
| `slug`                    | `string`       | Slug para URLs amigáveis do perfil do comitente.                             | Obrigatório, Único. Gerado a partir do nome.                                                                                                                                |
| `contactName`             | `string` (opcional) | Nome do contato principal do comitente (se PJ).                            | Opcional.                                                                                                                                                                 |
| `email`                   | `string` (opcional) | E-mail de contato do comitente.                                            | Opcional.                                                                                                                                                                 |
| `phone`                   | `string` (opcional) | Telefone de contato do comitente.                                          | Opcional.                                                                                                                                                                 |
| `address`                 | `string` (opcional) | Endereço completo do comitente.                                            | Opcional.                                                                                                                                                                 |
| `city`                    | `string` (opcional) | Cidade do comitente.                                                       | Opcional.                                                                                                                                                                 |
| `state`                   | `string` (opcional) | Estado (UF) do comitente.                                                  | Opcional.                                                                                                                                                                 |
| `zipCode`                 | `string` (opcional) | CEP do comitente.                                                          | Opcional.                                                                                                                                                                 |
| `website`                 | `string` (opcional) | Website do comitente.                                                      | Opcional.                                                                                                                                                                 |
| `logoUrl`                 | `string` (opcional) | URL do logo do comitente.                                                  | Opcional.                                                                                                                                                                 |
| `dataAiHintLogo`          | `string` (opcional) | Hint de IA para o logo do comitente.                                       | Opcional.                                                                                                                                                                 |
| `description`             | `string` (opcional) | Descrição sobre o comitente.                                               | Opcional.                                                                                                                                                                 |
| `memberSince`             | `AnyTimestamp` (opcional) | Data desde quando o comitente é membro/parceiro da plataforma.             | Opcional.                                                                                                                                                                 |
| `rating`                  | `number` (opcional) | Avaliação média do comitente (0-5 estrelas, por exemplo).                  | Opcional. Pode ser calculado com base no feedback de compradores.                                                                                                           |
| `activeLotsCount`         | `number` (opcional) | Número de lotes ativos atualmente em leilão por este comitente.              | Opcional. Calculado.                                                                                                                                                        |
| `totalSalesValue`         | `number` (opcional) | Valor total das vendas realizadas por este comitente na plataforma.          | Opcional. Calculado.                                                                                                                                                        |
| `auctionsFacilitatedCount`| `number` (opcional) | Número de leilões que este comitente participou/organizou.                 | Opcional.                                                                                                                                                                 |
| `userId`                  | `string` (opcional) | ID do usuário (`UserProfileData.uid`) associado a este perfil de comitente.  | Opcional. Se o comitente for um usuário registrado na plataforma.                                                                                                           |
| `createdAt`               | `AnyTimestamp` | Data de criação do perfil do comitente.                                     | Obrigatório. Preenchido automaticamente.                                                                                                                                    |
| `updatedAt`               | `AnyTimestamp` | Data da última atualização do perfil do comitente.                             | Obrigatório. Preenchido automaticamente.                                                                                                                                    |
| `cnpj`                    | `string` (opcional) | CNPJ do comitente (se for Pessoa Jurídica).                                | Opcional. Pode estar no `UserProfileData` associado se `accountType` for `LEGAL`.                                                                                         |
| `razaoSocial`             | `string` (opcional) | Razão Social do comitente (se for Pessoa Jurídica).                        | Opcional. Pode estar no `UserProfileData` associado.                                                                                                                      |
| `inscricaoEstadual`       | `string` (opcional) | Inscrição Estadual do comitente (se for Pessoa Jurídica).                  | Opcional. Pode estar no `UserProfileData` associado.                                                                                                                      |

## 10. Leiloeiros

### Regras Funcionais:
- **Perfil:** Leiloeiros (`AuctioneerProfileInfo`) são as entidades responsáveis por conduzir os leilões. Devem ser registrados na Junta Comercial.
- **Associação:** Um leiloeiro é associado a cada `Auction`.

### Entidade Principal: `AuctioneerProfileInfo`

#### Dicionário de Dados: `AuctioneerProfileInfo`
| Nome do Campo            | Tipo de Dado   | Descrição                                                              | Observações                                                                                                                                                              |
|--------------------------|----------------|------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `id`                     | `string`       | Identificador único do perfil do leiloeiro.                            | Obrigatório, Chave Primária.                                                                                                                                             |
| `publicId`               | `string`       | Identificador público do leiloeiro.                                    | Obrigatório, Único. Gerado com base em `PlatformSettings.platformPublicIdMasks.auctioneers`.                                                                           |
| `name`                   | `string`       | Nome do leiloeiro (pessoa física ou nome fantasia da empresa).           | Obrigatório.                                                                                                                                                             |
| `slug`                   | `string`       | Slug para URLs amigáveis do perfil do leiloeiro.                         | Obrigatório, Único. Gerado a partir do nome.                                                                                                                             |
| `registrationNumber`     | `string` (opcional) | Número de registro do leiloeiro na Junta Comercial.                    | Opcional, mas importante para leiloeiros oficiais.                                                                                                                       |
| `contactName`            | `string` (opcional) | Nome do contato principal do leiloeiro.                                | Opcional.                                                                                                                                                              |
| `email`                  | `string` (opcional) | E-mail de contato do leiloeiro.                                        | Opcional.                                                                                                                                                              |
| `phone`                  | `string` (opcional) | Telefone de contato do leiloeiro.                                      | Opcional.                                                                                                                                                              |
| `address`                | `string` (opcional) | Endereço completo do leiloeiro.                                        | Opcional.                                                                                                                                                              |
| `city`                   | `string` (opcional) | Cidade do leiloeiro.                                                   | Opcional.                                                                                                                                                              |
| `state`                  | `string` (opcional) | Estado (UF) do leiloeiro.                                              | Opcional.                                                                                                                                                              |
| `zipCode`                | `string` (opcional) | CEP do leiloeiro.                                                      | Opcional.                                                                                                                                                              |
| `website`                | `string` (opcional) | Website do leiloeiro.                                                  | Opcional.                                                                                                                                                              |
| `logoUrl`                | `string` (opcional) | URL do logo do leiloeiro.                                              | Opcional.                                                                                                                                                              |
| `dataAiHintLogo`         | `string` (opcional) | Hint de IA para o logo do leiloeiro.                                   | Opcional.                                                                                                                                                              |
| `description`            | `string` (opcional) | Descrição sobre o leiloeiro ou sua empresa.                            | Opcional.                                                                                                                                                              |
| `memberSince`            | `AnyTimestamp` (opcional) | Data desde quando o leiloeiro atua na plataforma.                        | Opcional.                                                                                                                                                              |
| `rating`                 | `number` (opcional) | Avaliação média do leiloeiro.                                          | Opcional.                                                                                                                                                              |
| `auctionsConductedCount` | `number` (opcional) | Número de leilões conduzidos por este leiloeiro na plataforma.         | Opcional. Calculado.                                                                                                                                                     |
| `totalValueSold`         | `number` (opcional) | Valor total vendido em leilões conduzidos por este leiloeiro.          | Opcional. Calculado.                                                                                                                                                     |
| `userId`                 | `string` (opcional) | ID do usuário (`UserProfileData.uid`) associado a este perfil de leiloeiro. | Opcional. Se o leiloeiro for um usuário registrado na plataforma.                                                                                                      |
| `createdAt`              | `AnyTimestamp` | Data de criação do perfil do leiloeiro.                                | Obrigatório. Preenchido automaticamente.                                                                                                                                 |
| `updatedAt`              | `AnyTimestamp` | Data da última atualização do perfil do leiloeiro.                       | Obrigatório. Preenchido automaticamente.                                                                                                                                 |

## 11. Vendas Diretas

### Regras Funcionais:
- **Modelo:** Permite a venda de itens fora do formato de leilão tradicional.
- **Tipos de Oferta (`DirectSaleOfferType`):** `BUY_NOW` (preço fixo) ou `ACCEPTS_PROPOSALS` (vendedor recebe propostas).
- **Status (`DirectSaleOfferStatus`):** Controla a visibilidade e estado da oferta (`ACTIVE`, `SOLD`, `EXPIRED`, `PENDING_APPROVAL`).

### Entidade Principal: `DirectSaleOffer`

#### Dicionário de Dados: `DirectSaleOffer`

| Nome do Campo          | Tipo de Dado            | Descrição                                                                          | Observações                                                                                                                              |
|------------------------|-------------------------|------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| `id`                   | `string`                | Identificador único da oferta de venda direta.                                     | Obrigatório, Chave Primária.                                                                                                             |
| `title`                | `string`                | Título da oferta.                                                                  | Obrigatório.                                                                                                                             |
| `description`          | `string`                | Descrição detalhada do item ofertado.                                              | Obrigatório.                                                                                                                             |
| `imageUrl`             | `string`                | URL da imagem principal do item.                                                   | Obrigatório.                                                                                                                             |
| `dataAiHint`           | `string` (opcional)     | Hint de IA para a imagem principal.                                                | Opcional.                                                                                                                                |
| `galleryImageUrls`     | `string[]` (opcional)   | Lista de URLs de imagens adicionais.                                               | Opcional.                                                                                                                                |
| `offerType`            | `DirectSaleOfferType`   | Tipo da oferta (compra imediata ou aceita propostas).                              | Obrigatório. Valores: `BUY_NOW`, `ACCEPTS_PROPOSALS`.                                                                                    |
| `price`                | `number` (opcional)     | Preço para compra imediata (se `offerType` for `BUY_NOW`).                         | Opcional. Obrigatório se `offerType` for `BUY_NOW`.                                                                                        |
| `minimumOfferPrice`    | `number` (opcional)     | Preço mínimo aceitável para propostas (se `offerType` for `ACCEPTS_PROPOSALS`).    | Opcional.                                                                                                                                |
| `category`             | `string`                | Nome da categoria do item.                                                         | Obrigatório. Pode ser relacionado a `LotCategory.name` ou um sistema de categorias próprio para vendas diretas.                          |
| `locationCity`         | `string` (opcional)     | Cidade onde o item está localizado.                                                | Opcional.                                                                                                                                |
| `locationState`        | `string` (opcional)     | Estado (UF) onde o item está localizado.                                           | Opcional.                                                                                                                                |
| `sellerName`           | `string`                | Nome do vendedor.                                                                  | Obrigatório. Denormalizado de `SellerProfileInfo.name` ou `UserProfileData.fullName`.                                                    |
| `sellerId`             | `string` (opcional)     | ID do vendedor (`SellerProfileInfo.id` ou `UserProfileData.uid`).                  | Opcional.                                                                                                                                |
| `sellerLogoUrl`        | `string` (opcional)     | URL do logo do vendedor.                                                           | Opcional.                                                                                                                                |
| `dataAiHintSellerLogo` | `string` (opcional)     | Hint de IA para o logo do vendedor.                                                | Opcional.                                                                                                                                |
| `status`               | `DirectSaleOfferStatus` | Status atual da oferta.                                                            | Obrigatório. Valores: `ACTIVE`, `SOLD`, `EXPIRED`, `PENDING_APPROVAL`.                                                                   |
| `itemsIncluded`        | `string[]` (opcional)   | Lista de itens incluídos na oferta (ex: acessórios).                               | Opcional.                                                                                                                                |
| `tags`                 | `string[]` (opcional)   | Lista de tags ou palavras-chave para a oferta.                                     | Opcional.                                                                                                                                |
| `views`                | `number` (opcional)     | Número de visualizações da oferta.                                                 | Opcional.                                                                                                                                |
| `proposalsCount`       | `number` (opcional)     | Número de propostas recebidas (se `offerType` for `ACCEPTS_PROPOSALS`).            | Opcional.                                                                                                                                |
| `createdAt`            | `AnyTimestamp`          | Data de criação da oferta.                                                         | Obrigatório. Preenchido automaticamente.                                                                                                 |
| `updatedAt`            | `AnyTimestamp`          | Data da última atualização da oferta.                                              | Obrigatório. Preenchido automaticamente.                                                                                                 |
| `expiresAt`            | `AnyTimestamp` (opcional) | Data e hora em que a oferta expira (se aplicável).                                 | Opcional. Se não definida, a oferta pode não expirar automaticamente.                                                                      |

**Tipos de Oferta de Venda Direta (`DirectSaleOfferType` - Enum):**
`BUY_NOW`, `ACCEPTS_PROPOSALS`.

**Status da Oferta de Venda Direta (`DirectSaleOfferStatus` - Enum):**
`ACTIVE`, `SOLD`, `EXPIRED`, `PENDING_APPROVAL`.

## 12. Mídia (Uploads)

### Regras Funcionais:
- **Gerenciamento:** Upload e armazenamento de arquivos de mídia (imagens, documentos) associados a lotes, leilões, perfis, etc.
- **Metadados:** `MediaItem` armazena informações sobre cada arquivo.

### Entidade Principal: `MediaItem`

#### Dicionário de Dados: `MediaItem`

| Nome do Campo    | Tipo de Dado                             | Descrição                                                                     | Observações                                                                                                   |
|------------------|------------------------------------------|-------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| `id`             | `string`                                 | Identificador único do item de mídia.                                        | Obrigatório, Chave Primária.                                                                                  |
| `fileName`       | `string`                                 | Nome original do arquivo enviado.                                             | Obrigatório.                                                                                                  |
| `uploadedAt`     | `AnyTimestamp`                           | Data e hora do upload.                                                        | Obrigatório. Preenchido automaticamente.                                                                      |
| `uploadedBy`     | `string` (opcional)                      | ID do usuário (`UserProfileData.uid`) que fez o upload.                       | Opcional.                                                                                                     |
| `title`          | `string` (opcional)                      | Título para o item de mídia (pode ser usado como legenda ou título SEO).     | Opcional.                                                                                                     |
| `altText`        | `string` (opcional)                      | Texto alternativo para a imagem (para acessibilidade e SEO).                  | Opcional.                                                                                                     |
| `caption`        | `string` (opcional)                      | Legenda para o item de mídia.                                                  | Opcional.                                                                                                     |
| `description`    | `string` (opcional)                      | Descrição mais detalhada do item de mídia.                                   | Opcional.                                                                                                     |
| `mimeType`       | `string`                                 | Tipo MIME do arquivo (ex: "image/jpeg", "application/pdf").                   | Obrigatório.                                                                                                  |
| `sizeBytes`      | `number`                                 | Tamanho do arquivo em bytes.                                                  | Obrigatório.                                                                                                  |
| `dimensions`     | `{ width: number; height: number }` (opcional) | Dimensões da imagem (largura e altura em pixels).                             | Opcional. Aplicável apenas para imagens.                                                                      |
| `urlOriginal`    | `string`                                 | URL para acessar o arquivo original.                                          | Obrigatório. Pode ser um caminho relativo ou absoluto dependendo da configuração de armazenamento.            |
| `urlThumbnail`   | `string`                                 | URL para uma miniatura gerada do arquivo (se imagem).                         | Obrigatório (para imagens).                                                                                   |
| `urlMedium`      | `string`                                 | URL para uma versão de tamanho médio gerada do arquivo (se imagem).           | Obrigatório (para imagens).                                                                                   |
| `urlLarge`       | `string`                                 | URL para uma versão de tamanho grande gerada do arquivo (se imagem).          | Obrigatório (para imagens).                                                                                   |
| `linkedLotIds`   | `string[]` (opcional)                    | Lista de IDs de lotes (`Lot.id`) aos quais este item de mídia está vinculado. | Opcional.                                                                                                     |
| `dataAiHint`     | `string` (opcional)                      | Hint de IA para o conteúdo da mídia (ex: para análise de imagem).            | Opcional.                                                                                                     |

## 13. Funcionalidades de IA

Além dos campos `dataAiHint` presentes em diversas entidades (como `UserProfileData`, `Auction`, `Lot`, `SellerProfileInfo`, `AuctioneerProfileInfo`, `DirectSaleOffer`, `MediaItem`), que servem como entrada para processamentos de Inteligência Artificial, o sistema pode empregar IA para diversas finalidades:

- **Assistência na Criação de Leilões e Lotes:**
    - **Sugestão de Descrições:** Com base em títulos, categorias, e `dataAiHint` de itens, a IA pode gerar ou sugerir descrições detalhadas para leilões e lotes, otimizando o tempo de cadastro e melhorando a qualidade das informações.
    - **Categorização Automática:** A IA pode sugerir a categoria (`LotCategory`) mais apropriada para um lote com base em sua descrição ou imagem.
    - **Precificação Inteligente:** Analisando dados históricos de leilões, características do item (extraídas de `dataAiHint` ou descrições) e condições de mercado, a IA pode sugerir valores iniciais (`initialPrice`, `secondInitialPrice`) e até mesmo estimar o valor de arremate.
    - **Otimização de Títulos:** Sugerir títulos mais atrativos e com palavras-chave relevantes para melhorar a encontrabilidade dos lotes.
    - **Análise de Imagens:** Os campos `dataAiHint` associados a imagens (`imageUrl`, `logoUrl`, `galleryImageUrls`) podem ser usados para analisar o conteúdo das imagens, extrair características (ex: cor predominante, objetos presentes, estado de conservação aparente em veículos) que podem enriquecer a descrição do lote ou auxiliar em buscas.
- **Recomendação Personalizada:**
    - Sugerir leilões e lotes relevantes para usuários com base em seu histórico de navegação, lances, favoritos e `dataAiHint` do perfil.
- **Detecção de Fraudes:**
    - Analisar padrões de lances e comportamento de usuários para identificar atividades suspeitas.
- **Suporte ao Cliente:**
    - Chatbots com IA para responder perguntas frequentes e auxiliar usuários.

A implementação específica e profundidade dessas funcionalidades de IA dependem da integração com modelos de IA e do desenvolvimento de fluxos específicos no sistema (ex: os fluxos em `src/ai/flows/`).

## 14. Configurações e Dados Geográficos

### Entidades: `LotCategory`, `StateInfo`, `CityInfo`, `PlatformSettings`

#### Dicionário de Dados: `LotCategory` (Categoria de Lote)
| Nome do Campo | Tipo de Dado   | Descrição                                         | Observações                                                                  |
|---------------|----------------|---------------------------------------------------|------------------------------------------------------------------------------|
| `id`          | `string`       | Identificador único da categoria.                 | Obrigatório, Chave Primária.                                                 |
| `name`        | `string`       | Nome da categoria (ex: "Veículos", "Imóveis").    | Obrigatório, Único.                                                          |
| `slug`        | `string`       | Slug para URLs amigáveis da categoria.            | Obrigatório, Único. Gerado a partir do nome.                                 |
| `description` | `string` (opcional) | Descrição da categoria.                           | Opcional.                                                                    |
| `itemCount`   | `number` (opcional) | Número de lotes ou itens nesta categoria.         | Opcional. Pode ser calculado dinamicamente.                                  |
| `createdAt`   | `AnyTimestamp` | Data de criação da categoria.                     | Obrigatório. Preenchido automaticamente.                                     |
| `updatedAt`   | `AnyTimestamp` | Data da última atualização da categoria.          | Obrigatório. Preenchido automaticamente.                                     |

#### Dicionário de Dados: `StateInfo` (Estado/UF)
| Nome do Campo | Tipo de Dado   | Descrição                                     | Observações                                                               |
|---------------|----------------|-----------------------------------------------|---------------------------------------------------------------------------|
| `id`          | `string`       | Identificador único do estado.                | Obrigatório, Chave Primária (pode ser a sigla UF ou um ID numérico).        |
| `name`        | `string`       | Nome do estado (ex: "São Paulo").             | Obrigatório.                                                              |
| `uf`          | `string`       | Sigla da Unidade Federativa (ex: "SP").       | Obrigatório, Único. 2 letras maiúsculas.                                  |
| `slug`        | `string`       | Slug para URLs amigáveis do estado.           | Obrigatório, Único. Gerado a partir do nome ou UF.                        |
| `cityCount`   | `number` (opcional) | Número de cidades neste estado.               | Opcional. Pode ser calculado.                                             |
| `createdAt`   | `AnyTimestamp` | Data de criação do registro do estado.        | Obrigatório. Preenchido automaticamente (se gerenciado internamente).       |
| `updatedAt`   | `AnyTimestamp` | Data da última atualização do registro.       | Obrigatório. Preenchido automaticamente.                                  |

#### Dicionário de Dados: `CityInfo` (Cidade)
| Nome do Campo | Tipo de Dado   | Descrição                                         | Observações                                                               |
|---------------|----------------|---------------------------------------------------|---------------------------------------------------------------------------|
| `id`          | `string`       | Identificador único da cidade.                    | Obrigatório, Chave Primária.                                              |
| `name`        | `string`       | Nome da cidade.                                   | Obrigatório.                                                              |
| `slug`        | `string`       | Slug para URLs amigáveis da cidade.               | Obrigatório, Único. Gerado a partir do nome.                              |
| `stateId`     | `string`       | ID do estado (`StateInfo.id`) ao qual a cidade pertence. | Obrigatório. Relação com `StateInfo.id`.                                |
| `stateUf`     | `string`       | Sigla UF do estado (denormalizado).               | Obrigatório. Relação com `StateInfo.uf`.                                  |
| `ibgeCode`    | `string` (opcional) | Código IBGE do município.                       | Opcional.                                                                 |
| `lotCount`    | `number` (opcional) | Número de lotes localizados nesta cidade.         | Opcional. Pode ser calculado.                                             |
| `createdAt`   | `AnyTimestamp` | Data de criação do registro da cidade.          | Obrigatório. Preenchido automaticamente (se gerenciado internamente).       |
| `updatedAt`   | `AnyTimestamp` | Data da última atualização do registro.         | Obrigatório. Preenchido automaticamente.                                  |

#### Dicionário de Dados: `PlatformSettings` (Configurações da Plataforma)
| Nome do Campo           | Tipo de Dado                                                          | Descrição                                                                        | Observações                                                                                                    |
|-------------------------|-----------------------------------------------------------------------|----------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------|
| `id`                    | `'global'`                                                            | Identificador fixo para o documento de configurações globais.                    | Obrigatório. Sempre 'global'.                                                                                  |
| `galleryImageBasePath`  | `string`                                                              | Caminho base para URLs de imagens da galeria (se não forem absolutas).           | Obrigatório. Ex: "/uploads/gallery/".                                                                          |
| `themes`                | `Theme[]` (opcional)                                                  | Lista de temas disponíveis para a plataforma.                                    | Opcional. `Theme` interface: `{ name: string; colors: { [colorVariable: string]: string; } }`.                |
| `platformPublicIdMasks` | `{ auctions?: string; lots?: string; auctioneers?: string; sellers?: string; }` (opcional) | Máscaras ou padrões para a geração de IDs públicos para as entidades.        | Opcional. Ex: `auctions: "AUC-{seq:6}"` indica um prefixo e uma sequência de 6 dígitos para IDs de leilão. |
| `updatedAt`             | `AnyTimestamp`                                                        | Data da última atualização das configurações.                                    | Obrigatório. Preenchido automaticamente.                                                                       |

**Interface Auxiliar `Theme` (dentro de `PlatformSettings`)**
| Nome do Campo | Tipo de Dado   | Descrição                                                              |
|---------------|----------------|------------------------------------------------------------------------|
| `name`        | `string`       | Nome do tema (ex: "Padrão Claro", "Contraste Escuro").                 |
| `colors`      | `ThemeColors`  | Objeto contendo variáveis de cor CSS e seus valores HSL/HEX.           |
|               |                | `ThemeColors` é `{[colorVariable: string]: string;}` ex: `{'--primary': 'hsl(25, 95%, 53%)'}` |

Este documento será a referência central para o entendimento das regras de negócio e da estrutura de dados da plataforma de leilões.
```
