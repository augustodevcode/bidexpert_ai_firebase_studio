# API Specification: Analytics & Billing Endpoints

**Data Plane**: BidExpert (`leiloes.bidexpert.com.br`)  
**Control Plane**: BidExpertCRM  
**Version**: 1.0  
**Date**: 2026-01-15  

---

## Authentication

Todas as APIs requerem autenticação via **API Key** no header:

```
Authorization: Bearer <ADMIN_API_KEY>
```

---

## 1. API de Consolidado Financeiro (ROI)

Cruza dados de faturas pagas pelo tenant com dados de vendas realizadas, calculando o ROI (Return on Investment) por período.

### Endpoint

```
GET /api/v1/admin/analytics/roi
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `tenantId` | bigint | ✅ Yes | - | ID do tenant |
| `startDate` | ISO datetime | No | 12 meses atrás | Data inicial do período |
| `endDate` | ISO datetime | No | Hoje | Data final do período |
| `granularity` | enum | No | `month` | `month` ou `year` |

### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "2",
      "name": "Leiloeiro ABC"
    },
    "period": {
      "startDate": "2025-02-01T00:00:00.000Z",
      "endDate": "2026-01-15T23:59:59.999Z",
      "granularity": "month"
    },
    "summary": {
      "totalCost": 7188.00,
      "totalRevenue": 350000.00,
      "roiMultiplier": 48.69,
      "netProfit": 342812.00
    },
    "history": [
      { "period": "2025-02", "cost": 599.00, "revenue": 25000.00 },
      { "period": "2025-03", "cost": 599.00, "revenue": 32000.00 },
      { "period": "2025-04", "cost": 599.00, "revenue": 28500.00 },
      { "period": "2025-05", "cost": 599.00, "revenue": 31000.00 },
      { "period": "2025-06", "cost": 599.00, "revenue": 35000.00 },
      { "period": "2025-07", "cost": 599.00, "revenue": 29000.00 },
      { "period": "2025-08", "cost": 599.00, "revenue": 33500.00 },
      { "period": "2025-09", "cost": 599.00, "revenue": 27000.00 },
      { "period": "2025-10", "cost": 599.00, "revenue": 38000.00 },
      { "period": "2025-11", "cost": 599.00, "revenue": 42000.00 },
      { "period": "2025-12", "cost": 599.00, "revenue": 29000.00 },
      { "period": "2026-01", "cost": 599.00, "revenue": 0 }
    ]
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `summary.totalCost` | number | Soma de todas as faturas pagas no período |
| `summary.totalRevenue` | number | Soma de todas as vendas arrematadas no período |
| `summary.roiMultiplier` | number | `totalRevenue / totalCost` (multiplicador de ROI) |
| `summary.netProfit` | number | `totalRevenue - totalCost` |
| `history[].period` | string | Período no formato `YYYY-MM` ou `YYYY` |
| `history[].cost` | number | Custo (faturas pagas) no período |
| `history[].revenue` | number | Receita (vendas) no período |

---

## 2. API de Vendas Detalhadas (Sales)

Retorna o volume bruto de vendas (GMV - Gross Merchandise Value) e dados de comissões do leiloeiro.

### Endpoint

```
GET /api/v1/admin/analytics/sales
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `tenantId` | bigint | ✅ Yes | - | ID do tenant |
| `startDate` | ISO datetime | No | 12 meses atrás | Data inicial do período |
| `endDate` | ISO datetime | No | Hoje | Data final do período |
| `page` | number | No | 1 | Página atual |
| `limit` | number | No | 50 | Itens por página (max: 100) |

### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "2",
      "name": "Leiloeiro ABC",
      "commissionRate": 5.00
    },
    "period": {
      "startDate": "2025-02-01T00:00:00.000Z",
      "endDate": "2026-01-15T23:59:59.999Z"
    },
    "summary": {
      "gmv": 350000.00,
      "totalSales": 45,
      "avgSaleValue": 7777.78,
      "totalCommission": 17500.00,
      "completedAuctions": 12,
      "achievedRevenue": 350000.00
    },
    "sales": [
      {
        "id": "1",
        "lotId": "101",
        "lotPublicId": "LOT-2025-0001",
        "lotTitle": "Veículo Honda Civic 2020",
        "auctionId": "50",
        "auctionPublicId": "AUC-2025-0050",
        "auctionTitle": "Leilão Veículos Janeiro 2025",
        "winnerId": "500",
        "winnerName": "João Silva",
        "winnerEmail": "joao@email.com",
        "saleAmount": 85000.00,
        "commission": 4250.00,
        "paymentStatus": "PAGO",
        "saleDate": "2025-01-10T15:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 45,
      "totalPages": 1
    }
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `summary.gmv` | number | Gross Merchandise Value - Volume bruto de vendas |
| `summary.totalSales` | number | Total de vendas (arrematações) |
| `summary.avgSaleValue` | number | Valor médio por venda |
| `summary.totalCommission` | number | Total de comissões (`gmv * commissionRate`) |
| `summary.completedAuctions` | number | Leilões concluídos no período |
| `sales[].paymentStatus` | enum | `PENDENTE`, `PAGO`, `CANCELADO` |

---

## 3. API de Histórico de Faturas (Invoices)

Lista faturas do tenant com status (Paga, Pendente, Atrasada), permitindo auditoria dos custos.

### Endpoints

```
GET  /api/v1/admin/billing/invoices       # Listar faturas
POST /api/v1/admin/billing/invoices       # Criar nova fatura
GET  /api/v1/admin/billing/invoices/:id   # Detalhes de uma fatura
PATCH /api/v1/admin/billing/invoices/:id  # Atualizar fatura
DELETE /api/v1/admin/billing/invoices/:id # Cancelar fatura
```

### GET - Listar Faturas

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `tenantId` | bigint | ✅ Yes | - | ID do tenant |
| `status` | enum | No | - | `PENDING`, `PAID`, `OVERDUE`, `CANCELLED`, `REFUNDED` |
| `startDate` | ISO datetime | No | - | Filtrar por data de emissão (início) |
| `endDate` | ISO datetime | No | - | Filtrar por data de emissão (fim) |
| `page` | number | No | 1 | Página atual |
| `limit` | number | No | 20 | Itens por página (max: 100) |

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "2",
      "name": "Leiloeiro ABC"
    },
    "summary": {
      "totalInvoices": 12,
      "byStatus": {
        "PAID": { "count": 10, "total": 5990.00 },
        "PENDING": { "count": 1, "total": 599.00 },
        "OVERDUE": { "count": 1, "total": 599.00 }
      },
      "totalPaid": 5990.00,
      "totalPending": 599.00,
      "totalOverdue": 599.00
    },
    "invoices": [
      {
        "id": "1",
        "invoiceNumber": "INV-2026-0001",
        "externalId": "stripe_inv_abc123",
        "amount": 599.00,
        "currency": "BRL",
        "periodStart": "2026-01-01T00:00:00.000Z",
        "periodEnd": "2026-01-31T23:59:59.999Z",
        "issueDate": "2026-01-01T00:00:00.000Z",
        "dueDate": "2026-01-10T23:59:59.999Z",
        "paidAt": null,
        "status": "PENDING",
        "description": "Mensalidade Plano Professional - Janeiro 2026",
        "lineItems": [
          {
            "description": "Plano Professional",
            "quantity": 1,
            "unitPrice": 599.00,
            "total": 599.00
          }
        ],
        "paymentMethod": null,
        "paymentReference": null,
        "invoiceUrl": "https://billing.bidexpert.com.br/invoices/INV-2026-0001",
        "receiptUrl": null,
        "isOverdue": false,
        "daysOverdue": 0
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 12,
      "totalPages": 1
    }
  }
}
```

### POST - Criar Fatura

#### Request Body

```json
{
  "tenantId": 2,
  "invoiceNumber": "INV-2026-0002",
  "externalId": "stripe_inv_xyz789",
  "amount": 599.00,
  "currency": "BRL",
  "periodStart": "2026-02-01T00:00:00.000Z",
  "periodEnd": "2026-02-28T23:59:59.999Z",
  "dueDate": "2026-02-10T23:59:59.999Z",
  "description": "Mensalidade Plano Professional - Fevereiro 2026",
  "lineItems": [
    {
      "description": "Plano Professional",
      "quantity": 1,
      "unitPrice": 599.00,
      "total": 599.00
    }
  ],
  "invoiceUrl": "https://billing.bidexpert.com.br/invoices/INV-2026-0002",
  "metadata": {
    "stripe_customer_id": "cus_abc123"
  }
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "2",
    "invoiceNumber": "INV-2026-0002",
    "externalId": "stripe_inv_xyz789",
    "amount": 599.00,
    "currency": "BRL",
    "periodStart": "2026-02-01T00:00:00.000Z",
    "periodEnd": "2026-02-28T23:59:59.999Z",
    "issueDate": "2026-01-15T20:00:00.000Z",
    "dueDate": "2026-02-10T23:59:59.999Z",
    "status": "PENDING",
    "message": "Fatura criada com sucesso"
  }
}
```

### PATCH - Atualizar Fatura (Marcar como Paga)

#### Request Body

```json
{
  "status": "PAID",
  "paidAt": "2026-01-15T14:30:00.000Z",
  "paymentMethod": "credit_card",
  "paymentReference": "ch_abc123xyz",
  "receiptUrl": "https://billing.bidexpert.com.br/receipts/REC-2026-0001"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "1",
    "invoiceNumber": "INV-2026-0001",
    "amount": 599.00,
    "status": "PAID",
    "paidAt": "2026-01-15T14:30:00.000Z",
    "paymentMethod": "credit_card",
    "paymentReference": "ch_abc123xyz",
    "updatedAt": "2026-01-15T14:30:00.000Z",
    "message": "Fatura atualizada com sucesso"
  }
}
```

### DELETE - Cancelar Fatura

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "1",
    "invoiceNumber": "INV-2026-0001",
    "status": "CANCELLED",
    "message": "Fatura cancelada com sucesso"
  }
}
```

---

## Error Responses

### 400 Bad Request - Validation Error

```json
{
  "error": "Validation Error",
  "message": "Parâmetros inválidos",
  "details": [
    {
      "path": ["tenantId"],
      "message": "Required"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid API key"
}
```

### 404 Not Found

```json
{
  "error": "Not Found",
  "message": "Tenant não encontrado"
}
```

### 409 Conflict

```json
{
  "error": "Conflict",
  "message": "Número de fatura já existe"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal Server Error",
  "message": "Erro ao processar análise de ROI"
}
```

---

## Invoice Status Workflow

```
PENDING  ──────────► PAID
    │                   │
    │                   │
    ▼                   ▼
OVERDUE             REFUNDED
    │
    │
    ▼
CANCELLED
```

| Status | Description |
|--------|-------------|
| `PENDING` | Aguardando pagamento |
| `PAID` | Fatura paga |
| `OVERDUE` | Vencida (atualizado automaticamente quando `dueDate < now`) |
| `CANCELLED` | Cancelada |
| `REFUNDED` | Reembolsada |

---

## Data Model: TenantInvoice

```prisma
model TenantInvoice {
  id               BigInt        @id @default(autoincrement())
  tenantId         BigInt
  invoiceNumber    String        @unique
  externalId       String?       @unique
  amount           Decimal       @db.Decimal(15, 2)
  currency         String        @default("BRL")
  periodStart      DateTime
  periodEnd        DateTime
  issueDate        DateTime      @default(now())
  dueDate          DateTime
  paidAt           DateTime?
  status           InvoiceStatus @default(PENDING)
  description      String?
  lineItems        Json?
  paymentMethod    String?
  paymentReference String?
  invoiceUrl       String?
  receiptUrl       String?
  metadata         Json?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  tenant           Tenant        @relation(...)
}

enum InvoiceStatus {
  PENDING
  PAID
  OVERDUE
  CANCELLED
  REFUNDED
}
```

---

## CORS Support

Todas as APIs suportam CORS para chamadas cross-origin do BidExpertCRM:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
```

---

## Example Usage (JavaScript/TypeScript)

```typescript
const BIDEXPERT_API_URL = 'https://leiloes.bidexpert.com.br';
const ADMIN_API_KEY = 'your-api-key-here';

// Fetch ROI data
const fetchROI = async (tenantId: number) => {
  const response = await fetch(
    `${BIDEXPERT_API_URL}/api/v1/admin/analytics/roi?tenantId=${tenantId}`,
    {
      headers: {
        'Authorization': `Bearer ${ADMIN_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.json();
};

// Fetch sales data
const fetchSales = async (tenantId: number, page = 1) => {
  const response = await fetch(
    `${BIDEXPERT_API_URL}/api/v1/admin/analytics/sales?tenantId=${tenantId}&page=${page}`,
    {
      headers: {
        'Authorization': `Bearer ${ADMIN_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.json();
};

// Create invoice
const createInvoice = async (invoiceData: InvoiceCreateInput) => {
  const response = await fetch(
    `${BIDEXPERT_API_URL}/api/v1/admin/billing/invoices`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    }
  );
  return response.json();
};

// Mark invoice as paid
const markInvoicePaid = async (invoiceId: string, paymentData: PaymentInput) => {
  const response = await fetch(
    `${BIDEXPERT_API_URL}/api/v1/admin/billing/invoices/${invoiceId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${ADMIN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'PAID',
        ...paymentData,
      }),
    }
  );
  return response.json();
};
```

---

## Production URL

```
Base URL: https://leiloes.bidexpert.com.br
```

**Note**: O deploy está pendente devido a problema de billing no GCP. APIs estão prontas e testadas localmente.
