# Referência de API (Server Actions)

Este documento descreve as principais Server Actions disponíveis no projeto BidExpert. Como usamos o padrão de Server Actions do Next.js, estas não são rotas de API REST tradicionais, mas sim funções assíncronas que são exportadas de arquivos com a diretiva `'use server';` e podem ser chamadas diretamente de componentes do cliente.

A arquitetura segue o padrão `Controller -> Service -> Repository`. As funções listadas abaixo são os `Controllers` (as `actions`).

---

## 1. Leilões (`src/app/admin/auctions/actions.ts`)

Estas ações gerenciam os leilões da plataforma.

- **`getAuctions(isPublicCall?: boolean): Promise<Auction[]>`**
  - **Descrição:** Retorna uma lista de todos os leilões, respeitando o contexto do tenant.
  - **Parâmetros:** `isPublicCall` (opcional, boolean) - Se `true`, busca dados do tenant Landlord (ID '1').

- **`getAuction(id: string, isPublicCall?: boolean): Promise<Auction | null>`**
  - **Descrição:** Retorna um leilão específico pelo seu ID ou publicId.
  - **Parâmetros:** `id` (string), `isPublicCall` (opcional, boolean).

- **`createAuction(data: Partial<AuctionFormData>): Promise<{...}>`**
  - **Descrição:** Cria um novo leilão.
  - **Parâmetros:** `data` (objeto).

- **`updateAuction(id: string, data: Partial<AuctionFormData>): Promise<{...}>`**
  - **Descrição:** Atualiza os dados de um leilão existente.
  - **Parâmetros:** `id` (string), `data` (objeto).

- **`deleteAuction(id: string): Promise<{...}>`**
  - **Descrição:** Exclui um leilão. A lógica de serviço impede a exclusão se o leilão tiver lotes associados.
  - **Parâmetros:** `id` (string).

- **`getAuctionsBySellerSlug(slug: string): Promise<Auction[]>`**
  - **Descrição:** Busca leilões de um comitente específico pelo slug ou ID (chamada pública, tenant Landlord).
  - **Parâmetros:** `slug` (string).

- **`getAuctionsByAuctioneerSlug(slug: string): Promise<Auction[]>`**
  - **Descrição:** Busca leilões de um leiloeiro específico pelo slug ou ID (chamada pública, tenant Landlord).
  - **Parâmetros:** `slug` (string).

---

## 2. Lotes (`src/app/admin/lots/actions.ts`)

Gerenciam os lotes individuais dentro dos leilões.

- **`getLots(auctionId?: string, isPublicCall?: boolean): Promise<Lot[]>`**
  - **Descrição:** Retorna uma lista de lotes, opcionalmente filtrados por `auctionId`.
  - **Parâmetros:** `auctionId` (opcional, string), `isPublicCall` (opcional, boolean).

- **`getLot(id: string, isPublicCall?: boolean): Promise<Lot | null>`**
  - **Descrição:** Retorna um lote específico pelo seu ID ou publicId.
  - **Parâmetros:** `id` (string), `isPublicCall` (opcional, boolean).

- **`createLot(data: Partial<LotFormData>): Promise<{...}>`**
  - **Descrição:** Cria um novo lote.
  - **Parâmetros:** `data` (objeto).

- **`updateLot(id: string, data: Partial<LotFormData>): Promise<{...}>`**
  - **Descrição:** Atualiza um lote existente.
  - **Parâmetros:** `id` (string), `data` (objeto).

- **`deleteLot(id: string, auctionId?: string): Promise<{...}>`**
  - **Descrição:** Exclui um lote.
  - **Parâmetros:** `id` (string), `auctionId` (opcional, string).

---

## 3. Comitentes (`src/app/admin/sellers/actions.ts`)

Gerenciam os perfis dos comitentes/vendedores. Todas as chamadas são intermediadas pela `SellerService`.

- **`getSellers(isPublicCall?: boolean): Promise<SellerProfileInfo[]>`**
- **`getSeller(id: string): Promise<SellerProfileInfo | null>`**
- **`createSeller(data: SellerFormData): Promise<{...}>`**
- **`updateSeller(id: string, data: Partial<SellerFormData>): Promise<{...}>`**
- **`deleteSeller(id: string): Promise<{...}>`**
- **`getSellerBySlug(slug: string): Promise<SellerProfileInfo | null>`**

---

## 4. Leiloeiros (`src/app/admin/auctioneers/actions.ts`)

Gerenciam os perfis dos leiloeiros.

- **`getAuctioneers(isPublicCall?: boolean): Promise<AuctioneerProfileInfo[]>`**
- **`getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null>`**
- **`createAuctioneer(data: AuctioneerFormData): Promise<{...}>`**
- **`updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{...}>`**
- **`deleteAuctioneer(id: string): Promise<{...}>`**
- **`getAuctioneerBySlug(slug: string): Promise<AuctioneerProfileInfo | null>`**

---

## 5. Entidades Judiciais

Ações para gerenciar Tribunais, Comarcas e Varas.

- **`getCourts()`**, **`createCourt()`**, etc. em `src/app/admin/courts/actions.ts`
- **`getJudicialDistricts()`**, **`createJudicialDistrict()`**, etc. em `src/app/admin/judicial-districts/actions.ts`
- **`getJudicialBranches()`**, **`createJudicialBranch()`**, etc. em `src/app/admin/judicial-branches/actions.ts`
- **`getJudicialProcesses()`**, **`createJudicialProcessAction()`**, etc. em `src/app/admin/judicial-processes/actions.ts`

---

## 6. Usuários e Perfis

- **`getUsersWithRoles()`**, **`createUser()`**, `updateUserRoles()` em `src/app/admin/users/actions.ts`
- **`getRoles()`**, **`createRole()`**, `updateRole()` em `src/app/admin/roles/actions.ts`

---

## 7. Autenticação (`src/app/auth/actions.ts`)

- **`login(formData: FormData): Promise<{...}>`**
  - **Descrição:** Autentica um usuário e cria uma sessão.
- **`logout(): Promise<void>`**
  - **Descrição:** Encerra a sessão do usuário.
- **`getCurrentUser(): Promise<UserProfileWithPermissions | null>`**
  - **Descrição:** Retorna os dados do usuário logado.

---

## 8. Outras Ações

- **Bens (`/bens/actions.ts`):** `getBens`, `getBem`, `createBem`, etc.
- **Categorias (`/categories/actions.ts`):** `getLotCategories`, `updateLotCategory`, etc.
- **Subcategorias (`/subcategories/actions.ts`):** `getSubcategoriesByParentIdAction`, `createSubcategoryAction`, etc.
- **Configurações (`/settings/actions.ts`):** `getPlatformSettings`, `updatePlatformSettings`.
