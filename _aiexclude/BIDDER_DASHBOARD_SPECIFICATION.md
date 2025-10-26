# 🎯 BIDDER DASHBOARD - ESPECIFICAÇÃO COMPLETA

## 📋 Visão Geral
Sistema completo de painel para arrematantes (bidders) com funcionalidades de gestão de compras, pagamentos, documentos e acompanhamento de arremates. Inclui também funcionalidade para administradores visualizarem o painel como se fossem um arrematante específico.

## 🏗️ Arquitetura Geral

### Componentes Principais
```
📁 src/app/dashboard/
├── 📁 bidder/                    # Dashboard do Arrematante
│   ├── 📄 page.tsx              # Página principal do dashboard
│   ├── 📁 components/           # Componentes específicos
│   ├── 📁 won-lots/            # Lotes arrematados
│   ├── 📁 notifications/       # Sistema de notificações
│   ├── 📁 documents/           # Submissão de documentos
│   ├── 📁 payments/            # Gestão de pagamentos
│   └── 📁 history/             # Histórico de participações
├── 📁 admin/
│   └── 📁 bidder-impersonation/ # Visualização como arrematante
└── 📁 api/
    └── 📁 bidder/              # APIs para dados do bidder
```

## 🗄️ Modelos de Dados

### 1. **BidderProfile** (Perfil do Arrematante)
```typescript
model BidderProfile {
  id                    String   @id @default(cuid())
  userId               String   @unique
  user                 User     @relation(fields: [userId], references: [id])

  // Informações Pessoais
  fullName             String?
  cpf                  String?  @unique
  phone                String?
  dateOfBirth          DateTime?

  // Endereço
  address              String?
  city                 String?
  state                String?
  zipCode              String?

  // Documentos
  documentStatus       DocumentStatus @default(PENDING)
  submittedDocuments   Json?    // Array de documentos submetidos

  // Configurações
  emailNotifications   Boolean  @default(true)
  smsNotifications     Boolean  @default(false)

  // Status
  isActive             Boolean  @default(true)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  // Relacionamentos
  wonLots              WonLot[]
  notifications        BidderNotification[]
  paymentMethods       PaymentMethod[]
  participationHistory ParticipationHistory[]

  @@map("bidder_profiles")
}
```

### 2. **WonLot** (Lotes Arrematados)
```typescript
model WonLot {
  id              String   @id @default(cuid())
  bidderId        String
  bidder          BidderProfile @relation(fields: [bidderId], references: [id])

  // Informações do Lote
  lotId           String
  auctionId       String
  title           String
  finalBid        Decimal  @db.Decimal(10,2)
  wonAt           DateTime @default(now())

  // Status do Arremate
  status          WonLotStatus @default(WON)
  paymentStatus   PaymentStatus @default(PENDING)

  // Pagamento
  totalAmount     Decimal @db.Decimal(10,2) // Valor final + taxas
  paidAmount      Decimal @db.Decimal(10,2) @default(0)
  dueDate         DateTime?

  // Entrega
  deliveryStatus  DeliveryStatus @default(PENDING)
  trackingCode    String?

  // Documentos
  invoiceUrl      String?
  receiptUrl      String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("won_lots")
}
```

### 3. **BidderNotification** (Notificações do Arrematante)
```typescript
model BidderNotification {
  id          String   @id @default(cuid())
  bidderId    String
  bidder      BidderProfile @relation(fields: [bidderId], references: [id])

  type        NotificationType
  title       String
  message     String
  data        Json?    // Dados adicionais

  isRead      Boolean  @default(false)
  readAt      DateTime?

  createdAt   DateTime @default(now())

  @@map("bidder_notifications")
}
```

### 4. **PaymentMethod** (Métodos de Pagamento)
```typescript
model PaymentMethod {
  id              String   @id @default(cuid())
  bidderId        String
  bidder          BidderProfile @relation(fields: [bidderId], references: [id])

  type            PaymentType // CREDIT_CARD, DEBIT_CARD, PIX, BOLETO
  isDefault       Boolean  @default(false)

  // Para Cartão de Crédito
  cardLast4       String?
  cardBrand       String? // VISA, MASTERCARD, etc
  cardToken       String? // Token seguro do gateway

  // Para PIX
  pixKey          String?
  pixKeyType      String? // CPF, EMAIL, PHONE, RANDOM

  // Status
  isActive        Boolean  @default(true)
  expiresAt       DateTime?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("payment_methods")
}
```

### 5. **ParticipationHistory** (Histórico de Participações)
```typescript
model ParticipationHistory {
  id            String   @id @default(cuid())
  bidderId      String
  bidder        BidderProfile @relation(fields: [bidderId], references: [id])

  // Informações da Participação
  lotId         String
  auctionId     String
  title         String
  auctionName   String

  // Valores
  maxBid        Decimal? @db.Decimal(10,2)
  finalBid      Decimal? @db.Decimal(10,2)
  result        ParticipationResult // WON, LOST, WITHDRAWN

  // Detalhes
  participatedAt DateTime @default(now())
  bidCount      Int      @default(0)

  createdAt     DateTime @default(now())

  @@map("participation_history")
}
```

## 🎨 Interface do Usuário - Arrematante

### 1. **Dashboard Principal** (`/dashboard`)
```
┌─────────────────────────────────────────────────────────┐
│ 🏠 Dashboard do Arrematante                            │
├─────────────────────────────────────────────────────────┤
│ 📊 Resumo Rápido                                       │
│ • Lotes Arrematados: 5                                 │
│ • Valor Total: R$ 12.500,00                            │
│ • Pagamentos Pendentes: 2                              │
│ • Documentos Pendentes: 1                              │
├─────────────────────────────────────────────────────────┤
│ 📋 Menu de Navegação                                   │
│ • 🏆 Meus Arremates                                     │
│ • 💳 Pagamentos                                        │
│ • 📄 Documentos                                        │
│ • 🔔 Notificações                                      │
│ • 📜 Histórico                                         │
│ • 👤 Perfil                                            │
└─────────────────────────────────────────────────────────┘
```

### 2. **Lotes Arrematados** (`/dashboard/won-lots`)
```typescript
interface WonLotCard {
  lotImage: string;
  title: string;
  auctionName: string;
  wonDate: DateTime;
  finalBid: Decimal;
  status: WonLotStatus;
  paymentStatus: PaymentStatus;
  actions: ['Ver Detalhes', 'Pagar', 'Emitir Boleto', 'Acompanhar']
}
```

### 3. **Sistema de Pagamentos** (`/dashboard/payments`)
```typescript
interface PaymentSection {
  methods: PaymentMethod[];
  pendingPayments: WonLot[];
  paymentHistory: PaymentHistory[];
  options: ['Cadastrar Cartão', 'Ver Boletos', 'Histórico'];
}
```

### 4. **Submissão de Documentos** (`/dashboard/documents`)
```typescript
interface DocumentSection {
  status: DocumentStatus;
  requiredDocuments: DocumentType[];
  submittedDocuments: SubmittedDocument[];
  actions: ['Enviar Documento', 'Ver Status', 'Baixar Modelo'];
}
```

### 5. **Notificações** (`/dashboard/notifications`)
```typescript
interface NotificationCenter {
  unreadCount: number;
  notifications: BidderNotification[];
  filters: ['Todas', 'Não Lidas', 'Arremates', 'Pagamentos'];
  actions: ['Marcar como Lida', 'Excluir', 'Configurações'];
}
```

## 🎨 Interface do Usuário - Administrador

### **Visualização como Arrematante** (`/admin/bidder-impersonation`)
```typescript
interface AdminImpersonation {
  selectedBidder: BidderProfile | null;
  bidderList: BidderProfile[];
  currentView: 'admin' | 'bidder';
  features: [
    'Ver Dashboard como Bidder',
    'Gerenciar Dados do Bidder',
    'Visualizar Histórico Completo',
    'Acompanhar Status em Tempo Real'
  ];
}
```

## 🔧 APIs e Server Actions

### **Bidder Dashboard APIs**
```typescript
// Dashboard Overview
GET /api/bidder/dashboard/overview

// Won Lots
GET /api/bidder/won-lots
POST /api/bidder/won-lots/{id}/pay
GET /api/bidder/won-lots/{id}/invoice

// Payment Methods
GET /api/bidder/payment-methods
POST /api/bidder/payment-methods
PUT /api/bidder/payment-methods/{id}
DELETE /api/bidder/payment-methods/{id}

// Notifications
GET /api/bidder/notifications
PUT /api/bidder/notifications/{id}/read
DELETE /api/bidder/notifications/{id}

// Documents
GET /api/bidder/documents
POST /api/bidder/documents
GET /api/bidder/documents/{id}/download

// History
GET /api/bidder/participation-history
```

## 🔔 Sistema de Notificações

### **Tipos de Notificação**
```typescript
enum NotificationType {
  AUCTION_WON = 'AUCTION_WON',
  PAYMENT_DUE = 'PAYMENT_DUE',
  PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',
  DOCUMENT_APPROVED = 'DOCUMENT_APPROVED',
  DOCUMENT_REJECTED = 'DOCUMENT_REJECTED',
  DELIVERY_UPDATE = 'DELIVERY_UPDATE',
  AUCTION_ENDING = 'AUCTION_ENDING',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE'
}
```

## 📄 Sistema de Documentos

### **Tipos de Documento**
```typescript
enum DocumentType {
  CPF = 'CPF',
  RG = 'RG',
  PROOF_OF_ADDRESS = 'PROOF_OF_ADDRESS',
  PROOF_OF_INCOME = 'PROOF_OF_INCOME',
  SELF_DECLARATION = 'SELF_DECLARATION'
}

enum DocumentStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}
```

## 💳 Sistema de Pagamentos

### **Métodos de Pagamento**
```typescript
enum PaymentType {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  BOLETO = 'BOLETO',
  BANK_TRANSFER = 'BANK_TRANSFER'
}
```

---

*Especificação criada em 26/10/2025 - Versão 1.0*
