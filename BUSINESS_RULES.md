# Documentação das Regras de Negócio

Este documento descreve as regras de negócio do sistema de leilões, com base na análise do código-fonte, tipos de dados, configurações do Firestore e inferências de funcionalidades.

## 1. Regras Gerais do Sistema

- **Acesso a Dados:** As regras de acesso aos dados são definidas principalmente no arquivo `firestore.rules`. Em ambiente de desenvolvimento, as regras podem estar mais permissivas. Em produção, o acesso é granular e baseado em autenticação e permissões do usuário.
- **Permissões Chave:**
    - `manage_all`: Concede acesso total a todas as funcionalidades e dados. Tipicamente atribuída a administradores do sistema.
    - Permissões específicas de módulo (ex: `auctions:create`, `lots:update`, `users:manage_roles`, `place_bids`, `documents:verify`).
- **Tipos de Dados:** O sistema utiliza uma série de tipos de dados definidos em `src/types/index.ts` para modelar suas entidades, como `Auction`, `Lot`, `User`, `Role`, `Bid`, `MediaItem`, `AuctioneerProfileInfo`, `SellerProfileInfo`, etc.
- **Timestamping:** As entidades geralmente possuem campos `createdAt` e `updatedAt` para rastrear quando foram criadas ou modificadas. São usados `ServerTimestamp` e `ClientTimestamp` dependendo do contexto.
- **Identificadores Públicos:** Algumas entidades como `Auction`, `Lot`, `Auctioneer`, `Seller` possuem um `publicId` além do `id` interno, provavelmente para uso em URLs ou comunicação externa. As máscaras para esses IDs públicos podem ser configuradas em `PlatformSettings`.
- **Adapters de Banco de Dados:** O sistema é projetado para suportar diferentes adaptadores de banco de dados (ex: Firestore, MySQL, Postgres), com uma interface `IDatabaseAdapter` definida em `src/types/index.ts`.

## 2. Usuários e Autenticação

- **Autenticação:**
    - O sistema possui uma função de autenticação (`authenticateUserSql` em `src/app/auth/actions.ts`) que verifica email e senha.
    - **Importante:** A implementação atual no protótipo compara senhas em texto plano, o que é inseguro e deve ser substituído por hashing de senhas (ex: bcrypt) em produção.
- **Dados do Usuário (`UserProfileData`):**
    - Informações básicas: `uid`, `email`, `fullName`, `password` (para criação/autenticação, não armazenado em texto plano em produção).
    - Detalhes Pessoais: `cpf`, `rgNumber`, `rgIssuer`, `rgIssueDate`, `rgState`, `dateOfBirth`, `cellPhone`, `homePhone`, `gender`, `profession`, `nationality`, `maritalStatus`, `propertyRegime`, `spouseName`, `spouseCpf`.
    - Endereço: `zipCode`, `street`, `number`, `complement`, `neighborhood`, `city`, `state`.
    - Preferências: `optInMarketing`.
    - Status: `status` (genérico), `habilitationStatus` (para participação em leilões).
    - Associação: `roleId`, `roleName`, `permissions`.
    - Contas: `accountType` ('PHYSICAL', 'LEGAL', 'DIRECT_SALE_CONSIGNOR').
    - Dados PJ: `razaoSocial`, `cnpj`, `inscricaoEstadual`, `websiteComitente`.
    - Outros: `avatarUrl`, `dataAiHint`, `activeBids`, `auctionsWon`, `itemsSold`, `sellerProfileId`.
- **Criação de Usuário:**
    - Novos usuários podem ser criados através de um formulário (`UserFormValues`) que coleta informações pessoais e de contato.
    - Ao criar um usuário, um papel (`roleId`) padrão de 'USER' é geralmente atribuído, a menos que especificado de outra forma por um administrador.
    - A função `ensureUserRole` no adapter de banco de dados é responsável por criar ou atualizar um usuário, garantindo que ele tenha um papel.

## 3. Papéis e Permissões

- **Modelo de Papéis (`Role`):**
    - Cada papel tem um `id`, `name` (ex: 'ADMINISTRATOR', 'AUCTION_ANALYST', 'USER', 'CONSIGNOR', 'AUCTIONEER'), `description` e uma lista de `permissions` (strings).
    - Papéis e suas permissões são gerenciados pela administração do sistema (requer `manage_all`).
    - A criação de novos papéis é restrita a usuários com a permissão `manage_all`.
- **Permissões (`permissions.ts`):**
    - São strings que definem capacidades específicas no sistema (ex: `auctions:create`, `lots:delete`, `users:edit`, `media:upload`, `place_bids`, `documents:verify`).
    - A permissão `manage_all` confere todas as outras permissões.
    - Funções helper (`hasPermission`, `hasAnyPermission`, `hasAllPermissions`) são usadas para verificar as permissões do usuário logado.
- **Atribuição de Papéis:**
    - Usuários têm um `roleId` e `roleName` em seu perfil, que determina suas permissões.
    - A atualização do papel de um usuário (`updateUserRole`) é uma ação administrativa.
- **Regras no Firestore:**
    - `firestore.rules` utiliza `get(/databases/$(database)/documents/users/$(request.auth.uid)).data.permissions.hasAny([...])` ou `...includes()` para verificar as permissões do usuário autenticado antes de permitir operações de leitura ou escrita em coleções específicas.

## 4. Habilitação de Usuários

- **Status de Habilitação (`UserHabilitationStatus`):**
    - `PENDING_DOCUMENTS`: Estado inicial após o cadastro, ou se algum documento essencial foi rejeitado e precisa ser reenviado. O usuário não pode dar lances.
    - `PENDING_ANALYSIS`: Todos os documentos marcados como obrigatórios (`DocumentType.isRequired`) foram enviados (`UserDocument.status === 'SUBMITTED'`). Aguardando verificação por um analista/administrador. O usuário ainda não pode dar lances.
    - `HABILITADO`: Todos os documentos obrigatórios foram aprovados (`UserDocument.status === 'APPROVED'`). O usuário recebe a permissão `place_bids` (ou uma verificação similar é feita) e pode participar ativamente dos leilões.
    - `REJECTED_DOCUMENTS`: Um ou mais documentos obrigatórios foram rejeitados (`UserDocument.status === 'REJECTED'`). O usuário é notificado e precisa reenviar os documentos corrigidos. O status pode voltar para `PENDING_DOCUMENTS` ou permanecer `REJECTED_DOCUMENTS` até a ação do usuário. Não pode dar lances.
    - `BLOCKED`: Acesso do usuário bloqueado por um administrador por razões diversas (fraude, violação de termos, etc.). Não pode realizar nenhuma ação na plataforma.
- **Documentos de Usuário (`UserDocument`):**
    - Usuários precisam enviar documentos para verificação e habilitação.
    - Cada documento tem `documentTypeId` (vinculado a `DocumentType`), `fileUrl` (após upload), `status` (`NOT_SENT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `PENDING_ANALYSIS`), `uploadDate`, `analysisDate`, `analystId` (quem analisou), `rejectionReason` (se rejeitado).
    - `DocumentType` define os tipos de documentos (ex: RG, CPF, Comprovante de Endereço), se são `isRequired`, formatos permitidos (`allowedFormats`), e ordem de exibição (`displayOrder`).
- **Fluxo Detalhado de Aprovação:**
    1.  **Cadastro:** Usuário se cadastra. `UserHabilitationStatus` é `PENDING_DOCUMENTS`.
    2.  **Envio de Documentos:** Usuário acessa sua área de perfil/documentos e faz upload dos arquivos para cada `DocumentType` exigido. Para cada documento enviado, `UserDocument.status` muda para `SUBMITTED`.
    3.  **Mudança para Análise:** Uma vez que todos os `UserDocument` obrigatórios tenham `status === 'SUBMITTED'`, o `UserHabilitationStatus` do usuário automaticamente (ou por uma ação do sistema) transita para `PENDING_ANALYSIS`.
    4.  **Análise Administrativa:** Um administrador ou usuário com permissão `documents:verify` (ou similar) revisa os documentos:
        - Se um documento é aprovado: `UserDocument.status` -> `APPROVED`. `UserDocument.analystId` e `UserDocument.analysisDate` são preenchidos.
        - Se um documento é rejeitado: `UserDocument.status` -> `REJECTED`. `UserDocument.analystId`, `UserDocument.analysisDate` e `UserDocument.rejectionReason` são preenchidos.
    5.  **Decisão de Habilitação:**
        - Se **todos** os `UserDocument` obrigatórios (`DocumentType.isRequired === true`) forem `APPROVED`, o `UserHabilitationStatus` do usuário muda para `HABILITADO`. O usuário ganha a capacidade de dar lances.
        - Se **qualquer** `UserDocument` obrigatório for `REJECTED`, o `UserHabilitationStatus` do usuário muda (ou permanece) para `REJECTED_DOCUMENTS`. O usuário deve ser notificado para corrigir as pendências.
- **Permissão para Lances:** A capacidade de dar lances está intrinsecamente ligada ao `UserHabilitationStatus === 'HABILITADO'`. A permissão `place_bids` pode ser adicionada ao array de `permissions` do usuário dinamicamente ou verificada em conjunto com o status de habilitação.

## 5. Leilões

- **Entidade Leilão (`Auction`):**
    - Identificação: `id`, `publicId`.
    - Detalhes: `title`, `fullTitle`, `description`, `imageUrl`, `dataAiHint` (para IA).
    - Status (`AuctionStatus`): `EM_BREVE`, `ABERTO_PARA_LANCES`, `ENCERRADO`, `FINALIZADO`, `ABERTO` (sinônimo de ABERTO_PARA_LANCES), `CANCELADO`, `SUSPENSO`.
    - Tipo (`auctionType`): `JUDICIAL`, `EXTRAJUDICIAL`, `PARTICULAR`.
    - Associações: `category` (nome), `categoryId` (ID), `auctioneer` (nome), `auctioneerId` (ID), `seller` (nome comitente), `sellerId` (ID comitente).
    - Datas: `auctionDate` (início), `endDate` (fim previsto), `auctionStages` (para múltiplas praças/fases, cada com `name` e `endDate`).
    - Localização: `city`, `state`.
    - Documentos: `documentsUrl` (link para edital, etc.).
    - Métricas: `totalLots`, `visits`, `initialOffer`, `currentBid`, `bidsCount`.
    - Outros: `sellingBranch`, `vehicleLocation`.
- **Criação e Atualização:** Realizadas por administradores ou usuários com permissões específicas (`auctions:create`, `auctions:manage_own`, `auctions:manage_assigned`). Nomes de categoria, leiloeiro e comitente são resolvidos para IDs.
- **Tipos de Leilão:** Judicial, Extrajudicial, Particular.
- **Status do Leilão:** Controlam a visibilidade e a capacidade de dar lances.
- **Praças (`AuctionStage`):** Permitem fases múltiplas em leilões, comum em judiciais.

## 6. Lotes

- **Entidade Lote (`Lot`):**
    - Identificação: `id`, `publicId`, `number`.
    - Associações: `auctionId`, `categoryId`, `sellerId`, etc.
    - Descrição: `title`, `description`, `imageUrl`, `galleryImageUrls`, `mediaItemIds`.
    - Status (`LotStatus`): `ABERTO_PARA_LANCES`, `EM_BREVE`, `ENCERRADO`, `VENDIDO`, `NAO_VENDIDO`.
    - Precificação: `price` (valor atual), `initialPrice`, `secondInitialPrice`.
    - Datas: `endDate`, `auctionDate`, `secondAuctionDate`.
- **Cadastro e Atualização:** Realizados por administradores ou usuários com permissões (`lots:create`, `lots:manage_own`). Nomes/publicIds são resolvidos para IDs.
- **Precificação:** Define os valores mínimos e o valor corrente do lote.
- **Status do Lote:** Controlam a visibilidade e a capacidade de dar lances em um lote específico.

## 7. Lances

- **Entidade Lance (`BidInfo`, `UserBid`):**
    - `id`, `lotId`, `auctionId`, `bidderId`, `bidderDisplay`, `amount`, `timestamp`.
- **Processo de Lance (`placeBidOnLot`):**
    1.  Usuário logado, `UserHabilitationStatus === 'HABILITADO'`.
    2.  Leilão e lote com status `ABERTO_PARA_LANCES`.
    3.  Valor do lance (`bidAmount`) > `Lot.price` + incremento mínimo.
    4.  Registro do `BidInfo`, atualização do `Lot.price`, `Lot.bidsCount`, e status dos `UserBid`.
- **Incrementos de Lance:**
    - A UI pode sugerir incrementos, mas a lógica de backend para definir e validar o valor exato do incremento (fixo ou percentual, configurável por leilão ou categoria) não foi explicitamente vista nos arquivos de `actions` lidos. Esta é uma regra de negócio crucial que precisa ser implementada e validada no backend para garantir a integridade dos lances.
- **Validações:** Habilitação, status do leilão/lote, valor do lance.
- **Lance Automático (Auto Bid / Lance Máximo):**
    - A interface do usuário (UI) apresenta componentes para "Lance Máximo", sugerindo a funcionalidade de lance automático.
    - No entanto, a lógica de backend para processar esses lances automáticos (armazenar o valor máximo do usuário de forma segura e sigilosa, e automaticamente cobrir outros lances até esse limite, respeitando os incrementos) não foi encontrada explicitamente nos `actions` ou `types` analisados até o momento.
    - **Regra Inferida/Necessária:**
        1.  Usuário habilitado informa um "Valor Máximo" para um lote. Esse valor é armazenado confidencialmente.
        2.  Quando outro usuário dá um lance, o sistema verifica se há lances máximos ativos para aquele lote.
        3.  Se o lance máximo do usuário A for maior que o lance do usuário B, o sistema automaticamente registra um lance para o usuário A, superando o lance de B pelo incremento mínimo necessário.
        4.  Isso continua até que o lance máximo do usuário A seja atingido, ou o lote encerre.
        5.  Se dois usuários definem lances máximos, a prioridade pode ser dada ao primeiro que definiu ou ao de maior valor, dependendo da regra de desempate.
    - Esta funcionalidade requer uma implementação cuidadosa no backend.
- **Status do Lance do Usuário (`UserBidStatus`):** `GANHANDO`, `PERDENDO`, `SUPERADO`, `ARREMATADO`, `NAO_ARREMATADO`.

## 8. Funcionalidades de IA

- **Assistência na Precificação (`predictOpeningValue`):** Sugere valor inicial de lote.
- **Assistência em Anúncios (`suggestListingDetails`):** Sugere melhorias em títulos, descrições, etc.
- **Hints para Imagens (`dataAiHint`):** Sugere uso de IA para análise/descrição de imagens.

## 9. Comitentes (Sellers) e Leiloeiros (Auctioneers)

- **Perfis de Comitente (`SellerProfileInfo`):** Entidade vendedora.
- **Perfis de Leiloeiro (`AuctioneerProfileInfo`):** Entidade que conduz o leilão.
- Ambos possuem CRUDs gerenciados por administradores e permissões específicas.

## 10. Vendas Diretas (`DirectSaleOffer`)

Esta funcionalidade permite a venda de itens fora do formato tradicional de leilão.

- **Entidade (`DirectSaleOffer`):**
    - Campos principais: `id`, `title`, `description`, `imageUrl`, `galleryImageUrls`, `offerType`, `price` (para compra imediata), `minimumOfferPrice` (para propostas), `category`, `locationCity`, `locationState`, `sellerName`, `sellerId`, `status`, `expiresAt`.
- **Tipos de Oferta (`DirectSaleOfferType`):**
    - `BUY_NOW`: O item é listado com um preço fixo. O primeiro usuário que concordar em pagar esse preço adquire o item.
    - `ACCEPTS_PROPOSALS`: O item é listado, e os usuários interessados podem enviar propostas de valor. O vendedor pode definir um `minimumOfferPrice` (valor mínimo aceitável para proposta), que pode ou não ser visível aos proponentes.
- **Status da Oferta (`DirectSaleOfferStatus`):**
    - `ACTIVE`: A oferta está ativa e visível. Usuários podem comprar (se `BUY_NOW`) ou enviar propostas (se `ACCEPTS_PROPOSALS`).
    - `SOLD`: O item foi vendido (seja por compra imediata ou aceitação de uma proposta).
    - `EXPIRED`: A oferta tinha um prazo (`expiresAt`) que foi atingido e não foi vendida.
    - `PENDING_APPROVAL`: Algumas ofertas podem necessitar de aprovação de um administrador antes de se tornarem `ACTIVE` (regra não explícita, mas possível).
- **Interações do Usuário:**
    - **Compra Imediata (para `BUY_NOW`):**
        1. Usuário visualiza a oferta.
        2. Se interessado, clica em "Comprar Agora".
        3. O sistema deve verificar a disponibilidade do item e o status da oferta.
        4. Se tudo OK, a oferta muda seu status para `SOLD`.
        5. O usuário é direcionado para o processo de pagamento (ver Seção 11).
    - **Envio de Propostas (para `ACCEPTS_PROPOSALS`):**
        1. Usuário visualiza a oferta.
        2. Usuário submete um valor de proposta.
        3. O sistema valida se a proposta é igual ou superior ao `minimumOfferPrice`, se este estiver definido e for mandatório.
        4. A proposta é enviada ao vendedor (ou administrador da plataforma).
        5. O vendedor pode aceitar, rejeitar ou fazer uma contraproposta (lógica de contraproposta não detalhada nos tipos).
        6. Se uma proposta é aceita, o status da oferta muda para `SOLD`. O proponente vencedor é notificado e direcionado para o pagamento.
- **Criação e Gerenciamento:** Provavelmente requer permissões específicas para vendedores (`sellers:manage_direct_sales` ou similar) ou administradores.

## 11. Pagamentos Pós-Arremate e Pós-Venda Direta

Após um usuário arrematar um lote em um leilão ou ter uma compra/proposta aceita em uma Venda Direta, inicia-se o fluxo de pagamento.

- **Registro da Conquista (`UserWin`):**
    - Quando um lote é arrematado, uma entrada `UserWin` é criada, associando o `Lot` ao usuário vencedor.
    - Contém `winningBidAmount`, `winDate` e, crucialmente, `paymentStatus`.
    - Para Vendas Diretas, um registro similar ou o próprio `DirectSaleOffer` atualizado para `SOLD` pode disparar o processo.
- **Status de Pagamento (`PaymentStatus`):**
    - `PENDENTE`: Estado inicial. O pagamento é esperado.
    - `PROCESSANDO`: O pagamento foi iniciado pelo usuário, e o sistema está aguardando a confirmação do gateway de pagamento.
    - `PAGO`: O pagamento foi confirmado com sucesso. O `invoiceUrl` pode ser preenchido.
    - `FALHOU`: A tentativa de pagamento falhou. O usuário pode precisar tentar novamente ou usar outro método.
    - `REEMBOLSADO`: O pagamento foi devolvido ao usuário (casos de cancelamento pós-pagamento, disputas, etc.).
- **Fluxo Inferido:**
    1.  **Notificação:** Usuário é notificado do arremate/compra e instruído a proceder com o pagamento.
    2.  **Seleção de Método:** Usuário escolhe um método de pagamento (cartão de crédito, boleto, PIX, etc. - não especificado, depende da integração).
    3.  **Integração com Gateway:** O sistema redireciona o usuário para um gateway de pagamento ou processa os dados do cartão através de uma API de um provedor de serviços de pagamento (PSP). **Esta integração é externa ao código-base principal analisado e é uma dependência crítica.**
    4.  **Atualização de Status:** O gateway de pagamento notifica o sistema (via webhooks ou callbacks) sobre o sucesso ou falha da transação.
    5.  O `PaymentStatus` no `UserWin` (ou registro equivalente para Venda Direta) é atualizado.
    6.  **Liberação/Envio:** Após `PaymentStatus === 'PAGO'`, o vendedor/comitente é notificado para liberar o item/lote para o comprador. Detalhes de logística (entrega, retirada) não estão no escopo desta análise.
- **Taxas e Comissões:**
    - O sistema provavelmente calcula taxas do leiloeiro, comissões da plataforma e outros custos. A lógica para esses cálculos e como são apresentados ao comprador/vendedor não foi detalhada nos arquivos, mas é uma parte essencial do fluxo financeiro.
- **Comprovantes e Notas (`invoiceUrl`):**
    - Após o pagamento, um link para a nota fiscal ou comprovante pode ser disponibilizado.

## 12. Outras Funcionalidades

- **Mídia (`MediaItem`):** Gerenciamento de uploads de arquivos.
- **Configurações da Plataforma (`PlatformSettings`):** Configurações globais.
- **Categorias de Lote (`LotCategory`), Estados (`StateInfo`), Cidades (`CityInfo`):** Entidades de apoio.
```
