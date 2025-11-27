# 🧪 BIDDER DASHBOARD - CENÁRIOS DE TESTE

## 📋 Visão Geral dos Testes
Conjunto completo de cenários de teste para validar todas as funcionalidades do painel do arrematante, incluindo testes unitários, de integração e E2E.

## 🏗️ Estrutura dos Testes

```
📁 tests/
├── 📁 ui/
│   ├── 📁 bidder-dashboard/           # Testes E2E do Dashboard
│   ├── 📁 admin-impersonation/        # Testes de Visualização Admin
│   └── 📁 payment-flows/             # Testes de Fluxos de Pagamento
├── 📁 integration/
│   ├── 📁 bidder-apis/              # Testes de APIs
│   ├── 📁 notification-system/      # Testes de Notificações
│   └── 📁 document-workflow/         # Testes de Documentos
└── 📁 unit/
    ├── 📁 bidder-models/             # Testes de Modelos
    ├── 📁 payment-services/          # Testes de Serviços
    └── 📁 validation-rules/          # Testes de Validação
```

## 🧪 Testes Unitários

### **1. Modelos de Dados**

#### **BidderProfile Model**
```typescript
// tests/unit/bidder-models/bidder-profile.test.ts
describe('BidderProfile', () => {
  test('should create valid bidder profile', () => {
    const profile = new BidderProfile({
      userId: 'user-123',
      fullName: 'João Silva',
      cpf: '123.456.789-00',
      emailNotifications: true
    });

    expect(profile.isValid()).toBe(true);
    expect(profile.documentStatus).toBe(DocumentStatus.PENDING);
  });

  test('should validate CPF format', () => {
    const profile = new BidderProfile({
      cpf: 'invalid-cpf'
    });

    expect(profile.isValid()).toBe(false);
    expect(profile.getErrors()).toContain('CPF inválido');
  });

  test('should set default notification preferences', () => {
    const profile = new BidderProfile({});

    expect(profile.emailNotifications).toBe(true);
    expect(profile.smsNotifications).toBe(false);
  });
});
```

#### **WonLot Model**
```typescript
// tests/unit/bidder-models/won-lot.test.ts
describe('WonLot', () => {
  test('should calculate total amount correctly', () => {
    const wonLot = new WonLot({
      finalBid: 1000,
      fees: 50,
      taxes: 100
    });

    expect(wonLot.totalAmount).toBe(1150);
  });

  test('should transition payment status correctly', () => {
    const wonLot = new WonLot({});

    wonLot.markAsPaid(1150);
    expect(wonLot.paymentStatus).toBe(PaymentStatus.COMPLETED);

    wonLot.markAsOverdue();
    expect(wonLot.paymentStatus).toBe(PaymentStatus.OVERDUE);
  });

  test('should validate required fields', () => {
    const wonLot = new WonLot({});

    expect(wonLot.isValid()).toBe(false);
    expect(wonLot.getErrors()).toContain('lotId é obrigatório');
  });
});
```

### **2. Serviços e Validações**

#### **Payment Service**
```typescript
// tests/unit/payment-services/payment-processor.test.ts
describe('PaymentProcessor', () => {
  test('should process credit card payment', async () => {
    const processor = new PaymentProcessor();
    const payment = {
      method: PaymentType.CREDIT_CARD,
      amount: 1000,
      cardToken: 'token-123'
    };

    const result = await processor.process(payment);

    expect(result.success).toBe(true);
    expect(result.transactionId).toBeDefined();
  });

  test('should handle payment failure', async () => {
    const processor = new PaymentProcessor();
    const payment = {
      method: PaymentType.CREDIT_CARD,
      amount: 1000,
      cardToken: 'invalid-token'
    };

    const result = await processor.process(payment);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cartão inválido');
  });

  test('should generate boleto correctly', async () => {
    const processor = new PaymentProcessor();
    const wonLot = new WonLot({
      id: 'lot-123',
      totalAmount: 1000
    });

    const boleto = await processor.generateBoleto(wonLot);

    expect(boleto.dueDate).toBeDefined();
    expect(boleto.barcode).toBeDefined();
    expect(boleto.pdfUrl).toBeDefined();
  });
});
```

#### **Document Validation Service**
```typescript
// tests/unit/validation-rules/document-validator.test.ts
describe('DocumentValidator', () => {
  test('should validate CPF document', () => {
    const validator = new DocumentValidator();
    const result = validator.validateCPF('123.456.789-00');

    expect(result.isValid).toBe(true);
    expect(result.checksum).toBeValid();
  });

  test('should validate document file size', () => {
    const validator = new DocumentValidator();
    const file = { size: 5 * 1024 * 1024 }; // 5MB

    const result = validator.validateFileSize(file);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Arquivo muito grande');
  });

  test('should validate document format', () => {
    const validator = new DocumentValidator();
    const allowedFormats = ['pdf', 'jpg', 'png'];

    expect(validator.validateFormat('document.pdf', allowedFormats)).toBe(true);
    expect(validator.validateFormat('document.txt', allowedFormats)).toBe(false);
  });
});
```

## 🔗 Testes de Integração

### **1. APIs do Dashboard**

#### **Dashboard Overview API**
```typescript
// tests/integration/bidder-apis/dashboard-overview.test.ts
describe('/api/bidder/dashboard/overview', () => {
  test('should return dashboard summary for authenticated bidder', async () => {
    const bidder = await createTestBidder();
    const response = await request(app)
      .get('/api/bidder/dashboard/overview')
      .set('Authorization', `Bearer ${bidder.token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('wonLotsCount');
    expect(response.body).toHaveProperty('totalSpent');
    expect(response.body).toHaveProperty('pendingPayments');
  });

  test('should require authentication', async () => {
    const response = await request(app)
      .get('/api/bidder/dashboard/overview');

    expect(response.status).toBe(401);
  });

  test('should return correct won lots count', async () => {
    const bidder = await createTestBidder();
    await createTestWonLot(bidder.id);

    const response = await request(app)
      .get('/api/bidder/dashboard/overview')
      .set('Authorization', `Bearer ${bidder.token}`);

    expect(response.body.wonLotsCount).toBe(1);
  });
});
```

#### **Won Lots API**
```typescript
// tests/integration/bidder-apis/won-lots.test.ts
describe('/api/bidder/won-lots', () => {
  test('should return paginated won lots', async () => {
    const bidder = await createTestBidder();

    // Create multiple won lots
    for (let i = 0; i < 15; i++) {
      await createTestWonLot(bidder.id, { title: `Lot ${i}` });
    }

    const response = await request(app)
      .get('/api/bidder/won-lots?page=1&limit=10')
      .set('Authorization', `Bearer ${bidder.token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(10);
    expect(response.body.pagination).toHaveProperty('totalPages');
  });

  test('should filter by payment status', async () => {
    const bidder = await createTestBidder();
    await createTestWonLot(bidder.id, { paymentStatus: PaymentStatus.PENDING });
    await createTestWonLot(bidder.id, { paymentStatus: PaymentStatus.COMPLETED });

    const response = await request(app)
      .get('/api/bidder/won-lots?paymentStatus=PENDING')
      .set('Authorization', `Bearer ${bidder.token}`);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].paymentStatus).toBe('PENDING');
  });
});
```

### **2. Sistema de Notificações**

#### **Notification Creation**
```typescript
// tests/integration/notification-system/notification-creation.test.ts
describe('Notification System', () => {
  test('should create notification when auction is won', async () => {
    const bidder = await createTestBidder();
    const auction = await createTestAuction();
    const lot = await createTestLot(auction.id);

    // Simulate auction end
    await endAuction(auction.id);

    const notifications = await getBidderNotifications(bidder.id);

    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe(NotificationType.AUCTION_WON);
  });

  test('should send email notification', async () => {
    const bidder = await createTestBidder();

    await createNotification({
      bidderId: bidder.id,
      type: NotificationType.AUCTION_WON,
      title: 'Parabéns!',
      message: 'Você ganhou o leilão!'
    });

    // Verify email was sent
    expect(mockEmailService.send).toHaveBeenCalledWith({
      to: bidder.email,
      subject: 'Parabéns!',
      template: 'auction-won'
    });
  });
});
```

### **3. Sistema de Documentos**

#### **Document Submission Workflow**
```typescript
// tests/integration/document-workflow/document-submission.test.ts
describe('Document Submission', () => {
  test('should accept valid document upload', async () => {
    const bidder = await createTestBidder();

    const response = await request(app)
      .post('/api/bidder/documents')
      .set('Authorization', `Bearer ${bidder.token}`)
      .attach('document', 'test-cpf.pdf')
      .field('type', DocumentType.CPF);

    expect(response.status).toBe(201);
    expect(response.body.documentId).toBeDefined();
    expect(response.body.status).toBe(DocumentStatus.PENDING);
  });

  test('should reject invalid document format', async () => {
    const bidder = await createTestBidder();

    const response = await request(app)
      .post('/api/bidder/documents')
      .set('Authorization', `Bearer ${bidder.token}`)
      .attach('document', 'test.txt')
      .field('type', DocumentType.CPF);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Formato não permitido');
  });

  test('should update document status after review', async () => {
    const admin = await createTestAdmin();
    const bidder = await createTestBidder();
    const document = await createTestDocument(bidder.id);

    await approveDocument(admin.id, document.id);

    const updatedDocument = await getDocument(document.id);
    expect(updatedDocument.status).toBe(DocumentStatus.APPROVED);
  });
});
```

## 🌐 Testes E2E (Playwright)

### **1. Fluxo Completo do Dashboard**

#### **Dashboard Navigation**
```typescript
// tests/ui/bidder-dashboard/dashboard-navigation.spec.ts
test.describe('Bidder Dashboard Navigation', () => {
  test('should navigate through all dashboard sections', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard');

    // Test navigation menu
    await expect(page.locator('[data-ai-id="dashboard-nav"]')).toBeVisible();

    // Navigate to won lots
    await page.click('[data-ai-id="nav-won-lots"]');
    await expect(page.locator('[data-ai-id="won-lots-section"]')).toBeVisible();

    // Navigate to payments
    await page.click('[data-ai-id="nav-payments"]');
    await expect(page.locator('[data-ai-id="payments-section"]')).toBeVisible();

    // Navigate to documents
    await page.click('[data-ai-id="nav-documents"]');
    await expect(page.locator('[data-ai-id="documents-section"]')).toBeVisible();
  });

  test('should display correct dashboard summary', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard');

    await expect(page.locator('[data-ai-id="dashboard-summary"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="won-lots-count"]')).toContainText('5');
    await expect(page.locator('[data-ai-id="total-spent"]')).toContainText('R$ 12.500');
  });
});
```

#### **Won Lots Management**
```typescript
// tests/ui/bidder-dashboard/won-lots-management.spec.ts
test.describe('Won Lots Management', () => {
  test('should display won lots correctly', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard/won-lots');

    await expect(page.locator('[data-ai-id="won-lots-grid"]')).toBeVisible();

    const lotCards = page.locator('[data-ai-id="won-lot-card"]');
    await expect(lotCards).toHaveCount(5);

    // Check first lot details
    const firstLot = lotCards.first();
    await expect(firstLot.locator('[data-ai-id="lot-title"]')).toBeVisible();
    await expect(firstLot.locator('[data-ai-id="lot-final-bid"]')).toBeVisible();
    await expect(firstLot.locator('[data-ai-id="lot-status"]')).toBeVisible();
  });

  test('should allow payment from won lot card', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard/won-lots');

    const lotCard = page.locator('[data-ai-id="won-lot-card"]').first();
    await lotCard.click('[data-ai-id="pay-button"]');

    await expect(page.locator('[data-ai-id="payment-modal"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="payment-methods"]')).toBeVisible();
  });

  test('should allow boleto generation', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard/won-lots');

    const lotCard = page.locator('[data-ai-id="won-lot-card"]').first();
    await lotCard.click('[data-ai-id="boleto-button"]');

    await expect(page.locator('[data-ai-id="boleto-modal"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="boleto-download"]')).toBeVisible();
  });
});
```

### **2. Sistema de Pagamentos**

#### **Payment Methods Management**
```typescript
// tests/ui/bidder-dashboard/payment-methods.spec.ts
test.describe('Payment Methods', () => {
  test('should display payment methods', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard/payments');

    await expect(page.locator('[data-ai-id="payment-methods-section"]')).toBeVisible();

    const methods = page.locator('[data-ai-id="payment-method-card"]');
    await expect(methods).toHaveCount(2); // 1 cartão, 1 PIX
  });

  test('should add new credit card', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard/payments');

    await page.click('[data-ai-id="add-payment-method"]');
    await page.selectOption('[data-ai-id="payment-type"]', 'CREDIT_CARD');

    await page.fill('[data-ai-id="card-number"]', '4111111111111111');
    await page.fill('[data-ai-id="card-expiry"]', '12/25');
    await page.fill('[data-ai-id="card-cvv"]', '123');
    await page.fill('[data-ai-id="card-holder"]', 'João Silva');

    await page.click('[data-ai-id="save-card"]');

    await expect(page.locator('[data-ai-id="success-message"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="payment-method-card"]')).toHaveCount(3);
  });

  test('should set default payment method', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard/payments');

    const card = page.locator('[data-ai-id="payment-method-card"]').first();
    await card.click('[data-ai-id="set-default"]');

    await expect(card.locator('[data-ai-id="default-badge"]')).toBeVisible();
  });
});
```

#### **Payment Processing**
```typescript
// tests/ui/bidder-dashboard/payment-processing.spec.ts
test.describe('Payment Processing', () => {
  test('should process PIX payment', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard/won-lots');

    const lotCard = page.locator('[data-ai-id="won-lot-card"]').first();
    await lotCard.click('[data-ai-id="pay-button"]');

    await page.click('[data-ai-id="payment-method-pix"]');
    await page.click('[data-ai-id="confirm-payment"]');

    await expect(page.locator('[data-ai-id="pix-qr-code"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="pix-copy-code"]')).toBeVisible();
  });

  test('should process credit card payment', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard/won-lots');

    const lotCard = page.locator('[data-ai-id="won-lot-card"]').first();
    await lotCard.click('[data-ai-id="pay-button"]');

    await page.click('[data-ai-id="payment-method-card"]');
    await page.click('[data-ai-id="confirm-payment"]');

    await expect(page.locator('[data-ai-id="payment-success"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="receipt-download"]')).toBeVisible();
  });

  test('should handle payment failure', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard/won-lots');

    const lotCard = page.locator('[data-ai-id="won-lot-card"]').first();
    await lotCard.click('[data-ai-id="pay-button"]');

    // Use declined card
    await page.fill('[data-ai-id="card-number"]', '4000000000000002');
    await page.click('[data-ai-id="confirm-payment"]');

    await expect(page.locator('[data-ai-id="payment-error"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="retry-payment"]')).toBeVisible();
  });
});
```

### **3. Sistema de Documentos**

#### **Document Submission**
```typescript
// tests/ui/bidder-dashboard/document-submission.spec.ts
test.describe('Document Submission', () => {
  test('should display required documents', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard/documents');

    await expect(page.locator('[data-ai-id="required-documents"]')).toBeVisible();

    const requiredDocs = [
      DocumentType.CPF,
      DocumentType.RG,
      DocumentType.PROOF_OF_ADDRESS
    ];

    for (const docType of requiredDocs) {
      await expect(page.locator(`[data-ai-id="doc-${docType}"]`)).toBeVisible();
    }
  });

  test('should upload CPF document', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard/documents');

    await page.click('[data-ai-id="upload-cpf"]');
    await page.setInputFiles('[data-ai-id="file-input"]', 'test-documents/cpf.pdf');

    await expect(page.locator('[data-ai-id="upload-progress"]')).toBeVisible();

    await page.waitForSelector('[data-ai-id="upload-success"]');
    await expect(page.locator('[data-ai-id="document-status"]')).toContainText('Pendente');
  });

  test('should handle document validation errors', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard/documents');

    await page.click('[data-ai-id="upload-cpf"]');
    await page.setInputFiles('[data-ai-id="file-input"]', 'test-documents/invalid.txt');

    await expect(page.locator('[data-ai-id="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="validation-error"]')).toContainText('Formato não permitido');
  });
});
```

#### **Document Status Tracking**
```typescript
// tests/ui/bidder-dashboard/document-status.spec.ts
test.describe('Document Status Tracking', () => {
  test('should display document status correctly', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard/documents');

    await expect(page.locator('[data-ai-id="document-status-cpf"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="document-status-rg"]')).toBeVisible();
  });

  test('should show approval notification', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard');

    // Simulate document approval
    await approveBidderDocument(bidderId, DocumentType.CPF);

    await expect(page.locator('[data-ai-id="notification-toast"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="notification-toast"]')).toContainText('Documento aprovado');
  });

  test('should handle document rejection', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard/documents');

    // Simulate document rejection
    await rejectBidderDocument(bidderId, DocumentType.CPF, 'Documento ilegível');

    await expect(page.locator('[data-ai-id="document-rejected"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="rejection-reason"]')).toContainText('Documento ilegível');
  });
});
```

### **4. Sistema de Notificações**

#### **Notification Center**
```typescript
// tests/ui/bidder-dashboard/notification-center.spec.ts
test.describe('Notification Center', () => {
  test('should display notifications', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard/notifications');

    await expect(page.locator('[data-ai-id="notification-list"]')).toBeVisible();

    const notifications = page.locator('[data-ai-id="notification-item"]');
    await expect(notifications).toHaveCount(3);
  });

  test('should mark notification as read', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard/notifications');

    const notification = page.locator('[data-ai-id="notification-item"]').first();
    await notification.click('[data-ai-id="mark-read"]');

    await expect(notification.locator('[data-ai-id="read-indicator"]')).toBeVisible();
  });

  test('should filter notifications by type', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard/notifications');

    await page.click('[data-ai-id="filter-auctions"]');

    const auctionNotifications = page.locator('[data-ai-id="notification-item"][data-type="AUCTION_WON"]');
    await expect(auctionNotifications).toHaveCount(2);
  });
});
```

#### **Real-time Notifications**
```typescript
// tests/ui/bidder-dashboard/real-time-notifications.spec.ts
test.describe('Real-time Notifications', () => {
  test('should receive real-time auction win notification', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard');

    // Simulate auction win
    await triggerAuctionWin(bidderId);

    await expect(page.locator('[data-ai-id="notification-toast"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-ai-id="notification-toast"]')).toContainText('Parabéns');
  });

  test('should update notification badge count', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard');

    const initialCount = await page.locator('[data-ai-id="notification-badge"]').textContent();

    // Simulate new notification
    await createNotification(bidderId, NotificationType.PAYMENT_DUE);

    await expect(page.locator('[data-ai-id="notification-badge"]')).toContainText(
      (parseInt(initialCount) + 1).toString()
    );
  });
});
```

### **5. Histórico de Participações**

#### **Participation History**
```typescript
// tests/ui/bidder-dashboard/participation-history.spec.ts
test.describe('Participation History', () => {
  test('should display participation history', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard/history');

    await expect(page.locator('[data-ai-id="history-list"]')).toBeVisible();

    const historyItems = page.locator('[data-ai-id="history-item"]');
    await expect(historyItems).toHaveCount(10);
  });

  test('should filter by result', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard/history');

    await page.click('[data-ai-id="filter-won"]');

    const wonItems = page.locator('[data-ai-id="history-item"][data-result="WON"]');
    await expect(wonItems).toHaveCount(3);
  });

  test('should show detailed bid information', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard/history');

    const historyItem = page.locator('[data-ai-id="history-item"]').first();
    await historyItem.click('[data-ai-id="view-details"]');

    await expect(page.locator('[data-ai-id="bid-details-modal"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="max-bid-value"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="bid-count"]')).toBeVisible();
  });
});
```

### **6. Visualização Admin como Arrematante**

#### **Admin Impersonation**
```typescript
// tests/ui/admin-impersonation/admin-impersonation.spec.ts
test.describe('Admin Bidder Impersonation', () => {
  test('should select bidder for impersonation', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/bidder-impersonation');

    await expect(page.locator('[data-ai-id="bidder-selector"]')).toBeVisible();

    await page.selectOption('[data-ai-id="bidder-selector"]', 'bidder-123');
    await page.click('[data-ai-id="start-impersonation"]');

    await expect(page.locator('[data-ai-id="impersonation-banner"]')).toBeVisible();
    await expect(page.url()).toContain('/dashboard');
  });

  test('should view dashboard as selected bidder', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/bidder-impersonation');

    await page.selectOption('[data-ai-id="bidder-selector"]', 'bidder-123');
    await page.click('[data-ai-id="start-impersonation"]');

    // Should see bidder's data, not admin's
    await expect(page.locator('[data-ai-id="won-lots-count"]')).toContainText('5');
    await expect(page.locator('[data-ai-id="bidder-name"]')).toContainText('João Silva');
  });

  test('should exit impersonation', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/bidder-impersonation');

    await page.selectOption('[data-ai-id="bidder-selector"]', 'bidder-123');
    await page.click('[data-ai-id="start-impersonation"]');

    await page.click('[data-ai-id="exit-impersonation"]');

    await expect(page.locator('[data-ai-id="impersonation-banner"]')).not.toBeVisible();
    await expect(page.url()).toContain('/admin');
  });

  test('should log impersonation activity', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/bidder-impersonation');

    await page.selectOption('[data-ai-id="bidder-selector"]', 'bidder-123');
    await page.click('[data-ai-id="start-impersonation"]');

    await page.click('[data-ai-id="exit-impersonation"]');

    // Check audit log
    await page.goto('/admin/audit-logs');
    await expect(page.locator('[data-ai-id="impersonation-log"]')).toBeVisible();
  });
});
```

#### **Admin Bidder Management**
```typescript
// tests/ui/admin-impersonation/bidder-management.spec.ts
test.describe('Admin Bidder Management', () => {
  test('should view bidder dashboard data', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/bidders/bidder-123/dashboard');

    await expect(page.locator('[data-ai-id="bidder-overview"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="bidder-metrics"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="recent-activity"]')).toBeVisible();
  });

  test('should manage bidder status', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/bidders/bidder-123');

    await page.click('[data-ai-id="bidder-actions"]');
    await page.click('[data-ai-id="activate-bidder"]');

    await expect(page.locator('[data-ai-id="bidder-status"]')).toContainText('Ativo');
  });

  test('should view bidder payment history', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/bidders/bidder-123/payments');

    await expect(page.locator('[data-ai-id="payment-history"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="payment-summary"]')).toBeVisible();
  });
});
```

## 📱 Testes de Responsividade

### **Mobile Experience**
```typescript
// tests/ui/bidder-dashboard/mobile-responsiveness.spec.ts
test.describe('Mobile Responsiveness', () => {
  test('should display correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginAsBidder(page);
    await page.goto('/dashboard');

    await expect(page.locator('[data-ai-id="mobile-nav"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="dashboard-cards"]')).toBeVisible();
  });

  test('should handle touch interactions', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginAsBidder(page);
    await page.goto('/dashboard/won-lots');

    const lotCard = page.locator('[data-ai-id="won-lot-card"]').first();
    await lotCard.tap(); // Touch tap instead of click

    await expect(page.locator('[data-ai-id="lot-details"]')).toBeVisible();
  });

  test('should show mobile-optimized payment flow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginAsBidder(page);
    await page.goto('/dashboard/payments');

    await expect(page.locator('[data-ai-id="mobile-payment-methods"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="mobile-keyboard-friendly"]')).toBeVisible();
  });
});
```

## 🐛 Testes de Edge Cases

### **Error Handling**
```typescript
// tests/ui/bidder-dashboard/error-handling.spec.ts
test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    await page.route('**/api/bidder/**', route => route.abort());
    await loginAsBidder(page);
    await page.goto('/dashboard');

    await expect(page.locator('[data-ai-id="error-message"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="retry-button"]')).toBeVisible();
  });

  test('should handle payment gateway timeout', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard/won-lots');

    // Mock slow payment response
    await page.route('**/api/bidder/payments', async route => {
      await new Promise(resolve => setTimeout(resolve, 10000));
      await route.fulfill({ status: 200, body: '{}' });
    });

    const lotCard = page.locator('[data-ai-id="won-lot-card"]').first();
    await lotCard.click('[data-ai-id="pay-button"]');

    await expect(page.locator('[data-ai-id="payment-timeout"]')).toBeVisible();
  });

  test('should handle invalid document upload', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard/documents');

    await page.click('[data-ai-id="upload-cpf"]');
    await page.setInputFiles('[data-ai-id="file-input"]', 'malicious-file.exe');

    await expect(page.locator('[data-ai-id="security-error"]')).toBeVisible();
  });
});
```

### **Data Validation**
```typescript
// tests/ui/bidder-dashboard/data-validation.spec.ts
test.describe('Data Validation', () => {
  test('should validate payment amount', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard/won-lots');

    const lotCard = page.locator('[data-ai-id="won-lot-card"]').first();
    await lotCard.click('[data-ai-id="pay-button"]');

    await page.fill('[data-ai-id="custom-amount"]', '-100');
    await page.click('[data-ai-id="confirm-payment"]');

    await expect(page.locator('[data-ai-id="amount-error"]')).toBeVisible();
  });

  test('should validate document file size', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/dashboard/documents');

    // Create a mock large file
    const largeFile = await createLargeFile(10 * 1024 * 1024); // 10MB
    await page.setInputFiles('[data-ai-id="file-input"]', largeFile);

    await expect(page.locator('[data-ai-id="file-size-error"]')).toBeVisible();
  });
});
```

## 📊 Testes de Performance

### **Load Testing**
```typescript
// tests/performance/bidder-dashboard-load.spec.ts
test.describe('Performance Tests', () => {
  test('should load dashboard within 2 seconds', async ({ page }) => {
    await loginAsBidder(page);

    const startTime = Date.now();
    await page.goto('/dashboard');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(2000);
  });

  test('should handle large won lots list', async ({ page }) => {
    // Create 100 won lots
    await createMultipleWonLots(bidderId, 100);

    await loginAsBidder(page);
    await page.goto('/dashboard/won-lots');

    await expect(page.locator('[data-ai-id="won-lots-grid"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="load-more"]')).toBeVisible();
  });
});
```

## 🔐 Testes de Segurança

### **Authentication & Authorization**
```typescript
// tests/security/bidder-authentication.spec.ts
test.describe('Security Tests', () => {
  test('should require authentication for dashboard access', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.url()).toContain('/login');
  });

  test('should not allow access to other bidders data', async ({ page }) => {
    await loginAsBidder(page, 'bidder-1');
    await page.goto('/dashboard');

    // Try to access another bidder's data
    await page.goto('/api/bidder/bidder-2/won-lots');

    await expect(page.locator('[data-ai-id="access-denied"]')).toBeVisible();
  });

  test('should validate admin permissions for impersonation', async ({ page }) => {
    await loginAsBidder(page); // Non-admin user
    await page.goto('/admin/bidder-impersonation');

    await expect(page.locator('[data-ai-id="access-denied"]')).toBeVisible();
  });
});
```

## 📋 Checklist de Testes

### **Funcionalidades Testadas**
- [ ] ✅ Dashboard overview e resumo
- [ ] ✅ Lotes arrematados (listagem, detalhes, ações)
- [ ] ✅ Sistema de pagamentos (métodos, processamento, histórico)
- [ ] ✅ Submissão e gestão de documentos
- [ ] ✅ Centro de notificações (visualização, filtros, ações)
- [ ] ✅ Histórico de participações
- [ ] ✅ Visualização admin como arrematante
- [ ] ✅ CRUDs admin para dados do arrematante
- [ ] ✅ Responsividade mobile
- [ ] ✅ Tratamento de erros
- [ ] ✅ Validação de dados
- [ ] ✅ Performance e carregamento
- [ ] ✅ Segurança e permissões

### **Tipos de Teste**
- [ ] ✅ Testes unitários (models, services)
- [ ] ✅ Testes de integração (APIs, database)
- [ ] ✅ Testes E2E (user journeys)
- [ ] ✅ Testes de responsividade
- [ ] ✅ Testes de performance
- [ ] ✅ Testes de segurança
- [ ] ✅ Testes de edge cases

---

*Documentação de testes criada em 26/10/2025 - Versão 1.0*
