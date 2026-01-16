# Arquitetura Multi-Tenant White-Label - Guia de Configuração

## Base URL de Produção
```
https://leiloes.bidexpert.com.br
```

## Visão Geral

O BidExpert implementa uma arquitetura **Data Plane / Control Plane** para SaaS multi-tenant:

```
┌─────────────────────┐      APIs Admin         ┌─────────────────────┐
│   BidExpertCRM      │ ────────────────────▶   │     BidExpert       │
│   (Control Plane)   │                         │    (Data Plane)     │
│                     │ ◀────────────────────   │                     │
│  - Gestão comercial │     Webhooks/Eventos    │  - Leilões          │
│  - Billing          │                         │  - Usuários         │
│  - Suporte          │                         │  - Transações       │
└─────────────────────┘                         └─────────────────────┘
```

## Estratégias de Resolução de Tenant

### 1. Subdomínio (SUBDOMAIN)
```
https://empresa1.bidexpert.com.br
https://empresa2.bidexpert.com.br
```
- **Vantagens**: SEO separado, fácil identificação
- **Requisitos**: DNS wildcard `*.bidexpert.com.br` + certificado wildcard

### 2. Path-Based (PATH)
```
https://bidexpert.com.br/app/empresa1
https://bidexpert.com.br/app/empresa2
```
- **Vantagens**: Um certificado SSL, deploy simples
- **Requisitos**: Configuração de rotas no Next.js

### 3. Domínio Customizado (CUSTOM_DOMAIN)
```
https://leiloes.empresa1.com.br
https://portal.empresa2.com.br
```
- **Vantagens**: Marca própria do cliente
- **Requisitos**: Verificação de DNS, proxy reverso, certificados individuais

## Variáveis de Ambiente

```env
# Obrigatórias
SESSION_SECRET=sua-chave-secreta-de-32-caracteres-minimo
ADMIN_API_KEY=chave-api-admin-para-crm-integracao

# Domínio Base
NEXT_PUBLIC_APP_DOMAIN=bidexpert.com.br
LANDLORD_URL=https://bidexpert.com.br

# Opcional: Cookie Domain (para cross-subdomain)
COOKIE_DOMAIN=.bidexpert.com.br

# Banco de Dados
DATABASE_URL=mysql://user:password@host:3306/database
```

## Configuração de SSL/Proxy

### Opção A: Nginx como Proxy Reverso

```nginx
# /etc/nginx/sites-available/bidexpert

# Wildcard para subdomínios
server {
    listen 443 ssl http2;
    server_name *.bidexpert.com.br bidexpert.com.br;
    
    # Certificado wildcard
    ssl_certificate /etc/letsencrypt/live/bidexpert.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bidexpert.com.br/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Domínios customizados (cada cliente)
server {
    listen 443 ssl http2;
    server_name leiloes.clienteexemplo.com.br;
    
    # Certificado individual ou Let's Encrypt automático
    ssl_certificate /etc/letsencrypt/live/leiloes.clienteexemplo.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/leiloes.clienteexemplo.com.br/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
    }
}
```

### Opção B: Caddy (Recomendado para SSL Automático)

```caddyfile
# Caddyfile

# Wildcard para subdomínios (requer DNS challenge)
*.bidexpert.com.br, bidexpert.com.br {
    tls {
        dns cloudflare {env.CF_API_TOKEN}
    }
    reverse_proxy localhost:3000 {
        header_up X-Forwarded-Host {host}
    }
}

# Domínio customizado com SSL automático
leiloes.clienteexemplo.com.br {
    reverse_proxy localhost:3000 {
        header_up X-Forwarded-Host {host}
    }
}
```

### Opção C: Cloudflare + Workers

```javascript
// cloudflare-worker.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.host;
    
    // Redireciona para o origin
    const newRequest = new Request(`https://origin.bidexpert.com.br${url.pathname}${url.search}`, {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers),
        'X-Forwarded-Host': host,
        'X-Original-Host': host,
      },
      body: request.body,
    });
    
    return fetch(newRequest);
  }
}
```

## APIs Administrativas

### Autenticação
Todas as APIs admin requerem header:
```
Authorization: Bearer {ADMIN_API_KEY}
```

### Provisionar Novo Tenant
```bash
POST /api/v1/admin/tenant/provision
Content-Type: application/json
Authorization: Bearer {ADMIN_API_KEY}

{
  "name": "Empresa Exemplo",
  "subdomain": "empresa-exemplo",
  "resolutionStrategy": "SUBDOMAIN",  # SUBDOMAIN | PATH | CUSTOM_DOMAIN
  "customDomain": "leiloes.empresa.com.br",  # Se CUSTOM_DOMAIN
  "planId": "professional",
  "status": "TRIAL",  # PENDING | TRIAL | ACTIVE | SUSPENDED | CANCELLED | EXPIRED
  "maxUsers": 50,
  "maxStorageBytes": 1073741824,  # 1GB
  "maxAuctions": 100,
  "externalId": "crm-123456",
  "webhookUrl": "https://crm.bidexpert.com.br/webhook/tenant",
  "metadata": {
    "contractId": "CNT-2024-001",
    "salesRep": "joao.silva"
  },
  "adminUser": {
    "email": "admin@empresa.com.br",
    "fullName": "Admin da Empresa",
    "password": "SenhaSegura123!",
    "cpf": "12345678901",
    "phone": "11999999999"
  },
  "branding": {
    "siteTitle": "Portal de Leilões",
    "siteTagline": "Os melhores leilões",
    "logoUrl": "https://cdn.exemplo.com/logo.png",
    "faviconUrl": "https://cdn.exemplo.com/favicon.ico",
    "primaryColorHsl": "220 90% 45%",
    "secondaryColorHsl": "180 60% 50%"
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "123",
      "name": "Empresa Exemplo",
      "subdomain": "empresa-exemplo",
      "status": "TRIAL",
      "apiKey": "tnt_abc123...",
      "customDomainVerifyToken": "verify_xyz..."
    },
    "adminUser": {
      "id": "456",
      "email": "admin@empresa.com.br",
      "tempPassword": false
    },
    "accessUrl": "https://empresa-exemplo.bidexpert.com.br",
    "setupUrl": "https://empresa-exemplo.bidexpert.com.br/setup",
    "status": "ready"
  }
}
```

### Atualizar Configurações
```bash
PATCH /api/v1/admin/tenant/settings
Content-Type: application/json
Authorization: Bearer {ADMIN_API_KEY}

{
  "tenantId": "123",
  "name": "Novo Nome",
  "status": "ACTIVE",
  "maxUsers": 100,
  "branding": {
    "primaryColorHsl": "200 85% 50%"
  },
  "features": {
    "enableBlockchain": true,
    "enableRealtime": true
  }
}
```

### Obter Configurações
```bash
GET /api/v1/admin/tenant/settings?tenantId=123
Authorization: Bearer {ADMIN_API_KEY}
```

---

## API Reference Completa para BidExpertCRM

### Sumário de Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/v1/admin/tenant/provision` | Provisionar novo tenant |
| PATCH | `/api/v1/admin/tenant/settings` | Atualizar configurações |
| GET | `/api/v1/admin/tenant/settings?tenantId={id}` | Obter configurações |
| GET | `/api/v1/admin/tenants` | Listar todos os tenants |
| POST | `/api/v1/admin/tenant/{id}/suspend` | Suspender tenant |
| POST | `/api/v1/admin/tenant/{id}/reactivate` | Reativar tenant |
| GET | `/api/v1/admin/stats` | Dashboard de métricas |
| GET | `/api/v1/admin/tenant/{id}/users` | Listar usuários do tenant |
| POST | `/api/v1/admin/tenant/{id}/reset-password` | Resetar senha de usuário |
| GET | `/api/v1/admin/tenant/{id}/audit-logs` | Logs de auditoria |
| GET | `/api/v1/admin/tenant/{id}/invoices` | Listar faturas |
| POST | `/api/v1/admin/tenant/{id}/invoices` | Criar fatura |

---

### 1. Listar Todos os Tenants

**Endpoint:** `GET /api/v1/admin/tenants`

Lista todos os tenants da plataforma para a tabela principal do CRM.

**Query Parameters:**
| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `page` | number | 1 | Página atual |
| `limit` | number | 20 | Itens por página (max: 100) |
| `search` | string | - | Busca por nome, subdomínio ou domínio |
| `status` | enum | - | Filtro: PENDING, TRIAL, ACTIVE, SUSPENDED, CANCELLED, EXPIRED |
| `resolutionStrategy` | enum | - | Filtro: SUBDOMAIN, PATH, CUSTOM_DOMAIN |
| `sortBy` | enum | createdAt | Campo: name, createdAt, status, usersCount |
| `sortOrder` | enum | desc | Ordenação: asc, desc |

**Exemplo:**
```bash
GET /api/v1/admin/tenants?page=1&limit=10&status=ACTIVE&sortBy=name
Authorization: Bearer {ADMIN_API_KEY}
```

**Resposta (200 OK):**
```json
{
  "success": true,
  "data": {
    "tenants": [
      {
        "id": "123",
        "name": "Empresa Exemplo",
        "subdomain": "empresa-exemplo",
        "customDomain": null,
        "status": "ACTIVE",
        "resolutionStrategy": "SUBDOMAIN",
        "maxUsers": 50,
        "createdAt": "2024-01-15T10:30:00Z",
        "trialEndsAt": null,
        "usersCount": 12,
        "auctionsCount": 45,
        "lotsCount": 230
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5
    }
  }
}
```

---

### 2. Suspender Tenant

**Endpoint:** `POST /api/v1/admin/tenant/{id}/suspend`

Suspende um tenant por inadimplência ou violação de termos.

**Payload:**
```json
{
  "reason": "Pagamento em atraso há 30 dias",
  "notifyAdmin": true,
  "suspendedUntil": "2024-03-01T00:00:00Z"  // opcional: suspensão temporária
}
```

**Resposta (200 OK):**
```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "123",
      "name": "Empresa Exemplo",
      "status": "SUSPENDED",
      "suspendedAt": "2024-02-15T14:30:00Z",
      "suspendedReason": "Pagamento em atraso há 30 dias",
      "suspendedUntil": "2024-03-01T00:00:00Z"
    },
    "notificationSent": true,
    "adminEmail": "admin@empresa.com.br"
  }
}
```

**Erros:**
- `404`: Tenant não encontrado
- `403`: Não é permitido suspender o tenant principal (landlord)
- `409`: Tenant já está suspenso

---

### 3. Reativar Tenant

**Endpoint:** `POST /api/v1/admin/tenant/{id}/reactivate`

Reativa um tenant suspenso, cancelado ou expirado.

**Payload:**
```json
{
  "reason": "Pagamento regularizado - Fatura #12345",
  "notifyAdmin": true,
  "newStatus": "ACTIVE",        // ACTIVE ou TRIAL
  "extendTrialDays": 15         // opcional: estender trial
}
```

**Resposta (200 OK):**
```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "123",
      "name": "Empresa Exemplo",
      "status": "ACTIVE",
      "reactivatedAt": "2024-02-20T10:00:00Z",
      "previousStatus": "SUSPENDED"
    },
    "notificationSent": true
  }
}
```

---

### 4. Dashboard de Métricas

**Endpoint:** `GET /api/v1/admin/stats`

Retorna KPIs agregados para o dashboard principal do CRM.

**Resposta (200 OK):**
```json
{
  "success": true,
  "data": {
    "tenants": {
      "total": 150,
      "active": 120,
      "trial": 15,
      "suspended": 8,
      "cancelled": 5,
      "expired": 2,
      "newThisMonth": 12,
      "newLastMonth": 8,
      "growthPercent": 50.0
    },
    "auctions": {
      "total": 2500,
      "active": 180,
      "scheduled": 45,
      "completed": 2200,
      "cancelled": 75,
      "totalThisMonth": 120,
      "totalLastMonth": 95
    },
    "lots": {
      "total": 15000,
      "sold": 12500,
      "conversionRate": 83.33
    },
    "users": {
      "total": 8500,
      "admins": 320,
      "bidders": 7800,
      "averagePerTenant": 56.67
    },
    "financial": {
      "totalVolume": 25000000.00,
      "volumeThisMonth": 2500000.00,
      "volumeLastMonth": 2100000.00,
      "currency": "BRL"
    },
    "topTenants": [
      {
        "id": "45",
        "name": "Casa de Leilões Premium",
        "totalVolume": 5000000.00,
        "lotsCount": 1200,
        "conversionRate": 92.5
      }
    ],
    "generatedAt": "2024-02-20T15:30:00Z"
  }
}
```

---

### 5. Listar Usuários do Tenant

**Endpoint:** `GET /api/v1/admin/tenant/{id}/users`

Lista usuários de um tenant específico para suporte.

**Query Parameters:**
| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `page` | number | 1 | Página atual |
| `limit` | number | 20 | Itens por página |
| `role` | string | - | Filtrar por role (ADMIN, BIDDER, etc.) |
| `search` | string | - | Busca por nome, email ou CPF |

**Exemplo:**
```bash
GET /api/v1/admin/tenant/123/users?role=ADMIN&search=joao
Authorization: Bearer {ADMIN_API_KEY}
```

**Resposta (200 OK):**
```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "123",
      "name": "Empresa Exemplo"
    },
    "users": [
      {
        "id": "456",
        "email": "joao@empresa.com.br",
        "fullName": "João Silva",
        "cpf": "123.456.789-00",
        "phone": "(11) 99999-9999",
        "roles": ["ADMIN", "BIDDER"],
        "isActive": true,
        "lastLogin": "2024-02-19T18:30:00Z",
        "createdAt": "2024-01-10T09:00:00Z"
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

---

### 6. Resetar Senha de Usuário

**Endpoint:** `POST /api/v1/admin/tenant/{id}/reset-password`

Reseta a senha de um usuário para suporte de acesso.

**Payload:**
```json
{
  "userId": "456",
  "newPassword": "NovaSenha@123",    // opcional
  "generateRandom": true,             // gera senha aleatória
  "sendEmail": true                   // envia por email
}
```

**Resposta (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "456",
      "email": "joao@empresa.com.br",
      "fullName": "João Silva"
    },
    "temporaryPassword": "Abc@12345678",  // se generateRandom=true
    "emailSent": true,
    "passwordExpires": "2024-02-21T10:30:00Z"
  }
}
```

**Erros:**
- `404`: Usuário não encontrado
- `403`: Usuário não pertence ao tenant

---

### 7. Logs de Auditoria

**Endpoint:** `GET /api/v1/admin/tenant/{id}/audit-logs`

Retorna logs de auditoria para compliance e investigação.

**Query Parameters:**
| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `page` | number | 1 | Página atual |
| `limit` | number | 50 | Itens por página |
| `entityType` | string | - | Filtro: USER, AUCTION, LOT, BID, PAYMENT |
| `action` | enum | - | Filtro: CREATE, UPDATE, DELETE |
| `userId` | string | - | Filtrar por usuário específico |
| `startDate` | datetime | - | Data inicial |
| `endDate` | datetime | - | Data final |

**Exemplo:**
```bash
GET /api/v1/admin/tenant/123/audit-logs?entityType=AUCTION&action=DELETE&startDate=2024-02-01T00:00:00Z
Authorization: Bearer {ADMIN_API_KEY}
```

**Resposta (200 OK):**
```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "123",
      "name": "Empresa Exemplo"
    },
    "logs": [
      {
        "id": "789",
        "entityType": "AUCTION",
        "entityId": "555",
        "action": "DELETE",
        "userId": "456",
        "userName": "João Silva",
        "userEmail": "joao@empresa.com.br",
        "changes": {
          "status": { "from": "ACTIVE", "to": "CANCELLED" }
        },
        "ipAddress": "189.100.50.25",
        "userAgent": "Mozilla/5.0...",
        "createdAt": "2024-02-15T14:30:00Z"
      }
    ],
    "stats": {
      "CREATE": 150,
      "UPDATE": 320,
      "DELETE": 25
    },
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 495,
      "totalPages": 10
    }
  }
}
```

---

### 8. Faturas do Tenant

#### Listar Faturas
**Endpoint:** `GET /api/v1/admin/tenant/{id}/invoices`

**Query Parameters:**
| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `page` | number | 1 | Página atual |
| `limit` | number | 20 | Itens por página |
| `status` | enum | - | Filtro: PENDING, PAID, OVERDUE, CANCELLED |
| `startDate` | datetime | - | Data inicial |
| `endDate` | datetime | - | Data final |

**Resposta (200 OK):**
```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "123",
      "name": "Empresa Exemplo",
      "planId": "2",
      "status": "ACTIVE"
    },
    "summary": {
      "totalPaid": 15000.00,
      "totalPending": 500.00,
      "totalOverdue": 0.00,
      "currency": "BRL"
    },
    "invoices": [
      {
        "id": "inv_001",
        "amount": 500.00,
        "currency": "BRL",
        "description": "Mensalidade - Fevereiro 2024",
        "status": "PENDING",
        "dueDate": "2024-02-28T23:59:59Z",
        "paidAt": null,
        "externalId": "stripe_inv_xyz",
        "items": [
          { "description": "Plano Pro", "quantity": 1, "unitPrice": 500.00 }
        ],
        "createdAt": "2024-02-01T00:00:00Z"
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

#### Criar Fatura
**Endpoint:** `POST /api/v1/admin/tenant/{id}/invoices`

**Payload:**
```json
{
  "amount": 500.00,
  "currency": "BRL",
  "description": "Mensalidade - Março 2024",
  "dueDate": "2024-03-31T23:59:59Z",
  "externalId": "stripe_inv_abc",
  "items": [
    { "description": "Plano Pro", "quantity": 1, "unitPrice": 500.00 }
  ]
}
```

**Resposta (201 Created):**
```json
{
  "success": true,
  "data": {
    "invoice": {
      "id": "inv_002",
      "tenantId": "123",
      "amount": 500.00,
      "status": "PENDING",
      "dueDate": "2024-03-31T23:59:59Z",
      "createdAt": "2024-02-20T10:00:00Z"
    }
  }
}
```

---

## Verificação de Domínio Customizado

1. O CRM provisiona tenant com `CUSTOM_DOMAIN`
2. BidExpert retorna `customDomainVerifyToken`
3. Cliente adiciona registro TXT no DNS:
   ```
   _bidexpert-verify.leiloes.empresa.com.br  TXT  "verify_xyz..."
   ```
4. Configura CNAME apontando para proxy:
   ```
   leiloes.empresa.com.br  CNAME  proxy.bidexpert.com.br
   ```
5. Após verificação DNS, BidExpert marca `customDomainVerified: true`

## Branding Dinâmico

O sistema injeta CSS customizado baseado nas configurações do tenant:

```css
/* Gerado automaticamente por theme-injector.ts */
:root {
  --primary: 220 90% 45%;
  --secondary: 180 60% 50%;
  --accent: 30 90% 55%;
  /* ... outras variáveis */
}
```

### Cores Disponíveis
- `primaryColorHsl`: Cor principal da marca
- `secondaryColorHsl`: Cor secundária
- `accentColorHsl`: Cor de destaque
- `destructiveColorHsl`: Cor para ações destrutivas
- `mutedColorHsl`: Cor para elementos discretos
- `backgroundColorHsl`: Cor de fundo
- `foregroundColorHsl`: Cor do texto
- `cardColorHsl`: Cor de cards
- `popoverColorHsl`: Cor de popovers
- `borderColorHsl`: Cor de bordas

## Estrutura de Pastas

```
src/
├── app/
│   ├── _tenants/           # Rotas path-based
│   │   └── [slug]/
│   │       ├── layout.tsx  # Tema + validação
│   │       └── page.tsx    # Redirect para dashboard
│   ├── admin/
│   │   └── platform-tenants/  # Painel do landlord
│   │       ├── page.tsx
│   │       └── actions.ts
│   └── api/
│       └── v1/
│           └── admin/
│               ├── stats/route.ts           # Métricas agregadas
│               ├── tenants/route.ts         # Listar todos tenants
│               └── tenant/
│                   ├── provision/route.ts   # Criar tenant
│                   ├── settings/route.ts    # Config do tenant
│                   └── [id]/
│                       ├── suspend/route.ts      # Suspender
│                       ├── reactivate/route.ts   # Reativar
│                       ├── users/route.ts        # Usuários do tenant
│                       ├── reset-password/route.ts # Reset senha
│                       ├── audit-logs/route.ts   # Auditoria
│                       └── invoices/route.ts     # Faturas
├── components/
│   └── tenant-theme-provider.tsx
├── lib/
│   ├── auth/
│   │   └── admin-api-guard.ts
│   └── theme-injector.ts
└── server/
    └── lib/
        ├── session.ts      # Cookies cross-subdomain
        ├── password.ts     # Hash bcrypt
        └── tenant-context.ts
```

## Segurança

### Cookies Cross-Subdomain
- Em produção, cookies são definidos com `domain: ".bidexpert.com.br"`
- Permite que usuários naveguem entre subdomínios sem re-autenticar
- `sameSite: 'lax'` protege contra CSRF básico

### Isolamento de Dados
- Toda query inclui filtro `tenantId`
- Middleware injeta `x-tenant-id` em cada request
- `AsyncLocalStorage` propaga contexto sem passar manualmente

### API Keys
- `ADMIN_API_KEY`: Para CRM → BidExpert (Control Plane)
- `tenant.apiKey`: Para integrações do tenant (futuro)

## Testes

```bash
# Testes das APIs admin
npx playwright test tests/e2e/tenant-admin-api.spec.ts

# Testes do painel administrativo
npx playwright test tests/e2e/tenant-admin-panel.spec.ts

# Todos os testes E2E
npx playwright test
```

## Troubleshooting

### Cookie não compartilhado entre subdomínios
- Verifique se `COOKIE_DOMAIN` está definido como `.bidexpert.com.br` (com ponto)
- Verifique se está em HTTPS (cookies secure)

### Tenant não resolvido
- Verifique os headers `x-tenant-*` no request
- Verifique se o proxy está passando `X-Forwarded-Host`
- Limpe cache do tenant: `invalidateTenantCache(subdomain)`

### Domínio customizado não funciona
- Verifique se CNAME aponta para o proxy correto
- Verifique se o registro TXT de verificação está correto
- Aguarde propagação DNS (até 48h)

## Roadmap

- [x] Dashboard de métricas por tenant (`GET /api/v1/admin/stats`)
- [x] API de billing integrada (`GET/POST /api/v1/admin/tenant/{id}/invoices`)
- [x] Gestão de usuários por tenant (`GET /api/v1/admin/tenant/{id}/users`)
- [x] Reset de senha para suporte (`POST /api/v1/admin/tenant/{id}/reset-password`)
- [x] Logs de auditoria (`GET /api/v1/admin/tenant/{id}/audit-logs`)
- [x] Suspender/Reativar tenants (`POST /api/v1/admin/tenant/{id}/suspend|reactivate`)
- [ ] Webhooks para eventos (user.created, auction.finished)
- [ ] Backup/restore por tenant
- [ ] Migração de dados entre tenants
- [ ] Integração com gateway de pagamento (Stripe, PagSeguro)
