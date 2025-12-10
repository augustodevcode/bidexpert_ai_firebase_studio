# Documentação da Página de CRUD de Leilão V1

## Visão Geral

Este documento descreve a arquitetura e regras de negócio da página de CRUD de leilões original (V1), localizada em `src/app/admin/auctions/`.

## Estrutura de Arquivos

```
src/app/admin/auctions/
├── page.tsx                    # Página principal de listagem
├── actions.ts                  # Server Actions (CRUD)
├── actions-with-audit.ts       # Actions com auditoria
├── auction-form.tsx            # Formulário principal
├── auction-form-schema.ts      # Schema Zod de validação
├── columns.tsx                 # Colunas da DataTable
├── new/
│   └── page.tsx                # Página de criação
└── [auctionId]/
    ├── page.tsx                # Página de detalhes
    ├── edit/
    │   └── page.tsx            # Página de edição
    └── auction-control-center/
        └── page.tsx            # Central de controle
```

## Regras de Negócio

### 1. Status do Leilão

Os leilões possuem os seguintes status:
- `RASCUNHO` - Leilão em fase inicial, não visível publicamente
- `EM_PREPARACAO` - Leilão sendo preparado, não visível publicamente
- `EM_BREVE` - Leilão agendado, visível publicamente
- `ABERTO` - Leilão aberto para visitação
- `ABERTO_PARA_LANCES` - Leilão aceitando lances
- `ENCERRADO` - Leilão encerrado
- `FINALIZADO` - Leilão finalizado (pós-venda concluída)
- `CANCELADO` - Leilão cancelado
- `SUSPENSO` - Leilão suspenso temporariamente

### 2. Tipos de Leilão

- `JUDICIAL` - Leilão judicial (bens de processos)
- `EXTRAJUDICIAL` - Leilão extrajudicial
- `PARTICULAR` - Leilão particular
- `TOMADA_DE_PRECOS` - Tomada de preços

### 3. Métodos de Leilão

- `STANDARD` - Leilão padrão (maior lance vence)
- `DUTCH` - Leilão holandês (preço decresce até aceitação)
- `SILENT` - Leilão silencioso (lances não visíveis)

### 4. Participação

- `ONLINE` - Apenas online
- `PRESENCIAL` - Apenas presencial
- `HIBRIDO` - Online e presencial

### 5. Praças/Etapas (AuctionStages)

Todo leilão deve ter pelo menos uma praça. Cada praça contém:
- `name` - Nome da praça (ex: "1ª Praça", "2ª Praça")
- `startDate` - Data de início
- `endDate` - Data de encerramento
- `initialPrice` - Preço inicial (opcional)

Regra: A data de início de uma etapa não pode ser anterior à data de término da etapa anterior.

### 6. Campos Obrigatórios

- `title` - Título (5-200 caracteres)
- `auctioneerId` - ID do leiloeiro
- `sellerId` - ID do comitente/vendedor
- `categoryId` - ID da categoria
- `auctionType` - Modalidade
- `participation` - Tipo de participação
- `auctionMethod` - Método do leilão
- `auctionStages` - Pelo menos uma praça

### 7. Campos do Leilão Holandês

Quando `auctionMethod === 'DUTCH'`:
- `decrementAmount` - Valor do decremento (obrigatório)
- `decrementIntervalSeconds` - Intervalo do decremento (obrigatório)
- `floorPrice` - Preço mínimo (obrigatório)

### 8. Opções Avançadas

- `automaticBiddingEnabled` - Habilitar lances automáticos
- `allowInstallmentBids` - Permitir lances parcelados
- `silentBiddingEnabled` - Lances silenciosos
- `allowMultipleBidsPerUser` - Múltiplos lances por usuário
- `softCloseEnabled` - Soft close (extensão automática)
- `softCloseMinutes` - Minutos de extensão (1-30)
- `isFeaturedOnMarketplace` - Destaque no marketplace

### 9. Endereço

- `street`, `number`, `complement`, `neighborhood`
- `cityId`, `stateId`, `zipCode`
- `latitude`, `longitude`

### 10. Mídia

- `imageUrl` - URL da imagem
- `imageMediaId` - ID da mídia ou 'INHERIT' para herdar do lote em destaque
- `documentsUrl` - URL dos documentos
- `evaluationReportUrl` - URL do laudo de avaliação
- `auctionCertificateUrl` - URL do edital

### 11. Relacionamentos

- `auctioneer` - Leiloeiro responsável
- `seller` - Comitente/Vendedor
- `category` - Categoria principal
- `judicialProcess` - Processo judicial (opcional)
- `lots` - Lotes do leilão
- `stages` - Praças/Etapas

### 12. Multi-Tenant

Todos os leilões são isolados por `tenantId`. O tenant é obtido automaticamente da sessão do usuário via `getTenantIdFromRequest()`.

## Schema Zod de Validação

O schema completo está em `auction-form-schema.ts` e inclui:
- Validação de URLs opcionais
- Validação de datas das praças (ordem cronológica)
- Validação condicional para leilão holandês
- Valores padrão para campos booleanos

## Server Actions

### Principais Actions (actions.ts)

```typescript
// Buscar leilões
getAuctions(isPublicCall: boolean, limit?: number): Promise<Auction[]>
getAuction(id: string, isPublicCall: boolean): Promise<Auction | null>

// CRUD
createAuction(data: Partial<AuctionFormData>): Promise<{success, message, auctionId?}>
updateAuction(id: string, data: Partial<AuctionFormData>): Promise<{success, message}>
deleteAuction(id: string): Promise<{success, message}>

// Helpers
updateAuctionTitle(id: string, newTitle: string)
updateAuctionImage(auctionId: string, mediaItemId: string, imageUrl: string)
updateAuctionFeaturedStatus(id: string, newStatus: boolean)

// Consultas especializadas
getAuctionsBySellerSlug(sellerSlugOrPublicId: string)
getAuctionsByAuctioneerSlug(auctioneerSlug: string)
getAuctionsByIds(ids: string[])
getAuctionPreparationData(auctionIdentifier: string)
```

## Service Layer

O `AuctionService` (`src/services/auction.service.ts`) é responsável por:
- Mapear dados do Prisma para tipos da aplicação
- Aplicar regras de negócio
- Gerar `publicId` e `slug` automaticamente
- Gerenciar transações para criação/atualização de leilões com praças

## Problemas Conhecidos na V1

1. **Formulário extenso** - O formulário tem 750+ linhas, dificultando manutenção
2. **Complexidade** - A função `renderSectionContent` tem muitos parâmetros
3. **Acoplamento** - Lógica de UI misturada com lógica de dados
4. **Falta de feedback** - Não há indicação clara de salvamento
5. **Auditoria limitada** - Histórico de alterações apenas no modo de edição

## Componentes Utilizados

- `EntitySelector` - Seletor de entidades com busca
- `AddressGroup` - Grupo de campos de endereço
- `AuctionStagesForm` - Formulário de praças
- `ChooseMediaDialog` - Diálogo de seleção de mídia
- `ChangeHistoryTab` - Tab de histórico de alterações

## Fluxo de Criação

1. Usuário acessa `/admin/auctions/new`
2. Sistema carrega dependências (leiloeiros, comitentes, estados, etc.)
3. Usuário preenche o formulário
4. Validação via Zod acontece em tempo real
5. Ao submeter, `createAuction` é chamada
6. Leilão e praças são criados em transação
7. Usuário é redirecionado para edição

## Fluxo de Edição

1. Usuário acessa `/admin/auctions/[id]/edit`
2. Sistema carrega leilão existente e dependências
3. Formulário é preenchido com dados existentes
4. Validação em tempo real
5. Ao submeter, `updateAuction` é chamada
6. Praças antigas são deletadas e recriadas

## Recomendações para V2

1. Separar formulário em componentes menores
2. Usar React Query para cache de dependências
3. Implementar auto-save
4. Adicionar grids de lotes e analytics
5. Melhorar feedback visual de operações
6. Implementar validação mais robusta
7. Adicionar testes unitários e E2E
