# 🏗️ ANÁLISE DE ARQUITETURA: Sistema de Logs e Validações

**Data:** 23 Novembro 2025
**Versão:** 1.0.0
**Tipo:** Análise Técnica de Arquitetura

---

## 📐 ARQUITETURA ATUAL (Estado Presente)

### 1. **Stack Tecnológico**
```typescript
Frontend: Next.js 14 (App Router) + React 18 + TypeScript
Backend: Next.js API Routes + Server Actions
Database: MySQL + Prisma ORM
Auth: NextAuth.js
UI: Tailwind CSS + shadcn/ui
Testing: Playwright (E2E) + Vitest (Unit)
```

### 2. **Estrutura de Pastas Atual**
```
src/
├── app/                       # Next.js App Router
│   ├── auctions/             # Módulo Leilões
│   ├── lots/                 # Módulo Lotes
│   ├── sellers/              # Módulo Vendedores
│   ├── auctioneers/          # Módulo Leiloeiros
│   ├── judicial-processes/   # Módulo Processos
│   └── admin/                # Admin Dashboard
├── components/
│   ├── crud/                 # Componentes CRUD genéricos
│   │   ├── crud-form-layout.tsx
│   │   ├── crud-form-actions.tsx
│   │   ├── crud-form-footer.tsx
│   │   └── validation-check-button.tsx
│   └── ui/                   # shadcn/ui components
├── repositories/             # Data Access Layer (38 repos)
│   ├── auction.repository.ts
│   ├── lot.repository.ts
│   ├── asset.repository.ts
│   └── ... (35 outros)
├── services/                 # Business Logic Layer (48 services)
│   ├── auction.service.ts
│   ├── lot.service.ts
│   ├── audit.service.ts      # ✅ JÁ EXISTE!
│   └── ... (45 outros)
└── types/                    # TypeScript types
```

### 3. **Modelos de Dados Existentes (Prisma)**

#### ✅ Já Temos Multi-Tenancy
```prisma
model Tenant {
  id          BigInt   @id @default(autoincrement())
  name        String
  subdomain   String   @unique
  domain      String?  @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  auctions    Auction[]
  lots        Lot[]
  assets      Asset[]
  // ... outros relacionamentos
}
```

#### ✅ Já Temos Timestamps
```prisma
model Auction {
  id          BigInt   @id @default(autoincrement())
  tenantId    BigInt
  // ... campos
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### ❌ FALTA: Audit Log Estruturado
```prisma
// NÃO EXISTE NO SCHEMA ATUAL
model AuditLog {
  // precisamos criar!
}
```

### 4. **Serviços Existentes**

#### ✅ Audit Service Existe
```typescript
// src/services/audit.service.ts
export class AuditService {
  // Implementação básica já existe!
  // Precisamos expandir
}
```

#### ✅ Repositories Completos
- 38 repositories implementados
- Seguem padrão consistente
- Suportam multi-tenancy

---

## 🎯 SOLUÇÃO PROPOSTA: Arquitetura Inteligente

### PRINCÍPIOS DE DESIGN

1. **DRY (Don't Repeat Yourself)**
   - Sistema de logging reutilizável
   - Validações compartilhadas
   - HOCs e hooks genéricos

2. **Separation of Concerns**
   - Repository: acesso a dados
   - Service: lógica de negócio + logging
   - Component: UI + validação em tempo real

3. **Performance First**
   - Validações client-side (instant feedback)
   - Logs async (não bloqueiam UI)
   - Batch operations quando possível

4. **Type Safety**
   - TypeScript strict mode
   - Zod schemas para validação runtime
   - Prisma types gerados automaticamente

---

## 🏛️ CAMADAS DA ARQUITETURA

### CAMADA 1: Database Schema (Prisma)

```prisma
// Adicionar ao schema.prisma

// ============================================
// AUDIT LOG SYSTEM
// ============================================

model AuditLog {
  id            BigInt    @id @default(autoincrement())
  tenantId      BigInt?   // null = global action
  userId        BigInt
  
  // O QUÊ foi feito
  entityType    String    // "Auction", "Lot", "Asset", etc
  entityId      BigInt
  action        AuditAction // CREATE, UPDATE, DELETE, PUBLISH, etc
  
  // DETALHES da ação
  changes       Json?     // { before: {...}, after: {...} }
  metadata      Json?     // { reason: "...", approvedBy: "..." }
  
  // ONDE aconteceu
  ipAddress     String?
  userAgent     String?
  location      String?   // cidade/estado se disponível
  
  // QUANDO
  timestamp     DateTime  @default(now())
  
  // Relações
  user          User      @relation(fields: [userId], references: [id])
  tenant        Tenant?   @relation(fields: [tenantId], references: [id])
  
  @@index([tenantId, entityType, entityId])
  @@index([userId])
  @@index([timestamp])
  @@index([action])
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  SOFT_DELETE
  RESTORE
  PUBLISH
  UNPUBLISH
  APPROVE
  REJECT
  EXPORT
  IMPORT
}

// ============================================
// VALIDATION RULES
// ============================================

model ValidationRule {
  id            BigInt    @id @default(autoincrement())
  entityType    String    // "Auction", "Lot", etc
  fieldName     String    // "title", "price", etc
  
  ruleType      ValidationType
  config        Json      // { min: 3, max: 100, pattern: "..." }
  
  isRequired    Boolean   @default(false)
  errorMessage  String
  severity      ValidationSeverity @default(ERROR)
  
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@unique([entityType, fieldName, ruleType])
  @@index([entityType])
}

enum ValidationType {
  REQUIRED
  MIN_LENGTH
  MAX_LENGTH
  PATTERN
  MIN_VALUE
  MAX_VALUE
  DATE_RANGE
  FILE_TYPE
  FILE_SIZE
  CUSTOM
}

enum ValidationSeverity {
  ERROR    // Bloqueia publicação
  WARNING  // Alerta mas permite
  INFO     // Apenas informativo
}

// ============================================
// FORM SUBMISSION TRACKING
// ============================================

model FormSubmission {
  id            BigInt    @id @default(autoincrement())
  tenantId      BigInt?
  userId        BigInt
  
  formType      String    // "AuctionForm", "LotForm", etc
  entityId      BigInt?   // ID da entidade criada/editada
  
  status        SubmissionStatus
  validationScore Int    // 0-100%
  
  data          Json      // Dados submetidos
  validationErrors Json?  // Lista de erros
  
  submittedAt   DateTime  @default(now())
  completedAt   DateTime?
  
  user          User      @relation(fields: [userId], references: [id])
  tenant        Tenant?   @relation(fields: [tenantId], references: [id])
  
  @@index([tenantId, formType])
  @@index([userId])
  @@index([status])
}

enum SubmissionStatus {
  DRAFT
  VALIDATING
  VALID
  INVALID
  SUBMITTED
  FAILED
}
```

### CAMADA 2: Repository Layer

```typescript
// src/repositories/audit-log.repository.ts

import { PrismaClient, AuditAction, AuditLog } from '@prisma/client';

export interface CreateAuditLogInput {
  tenantId?: bigint;
  userId: bigint;
  entityType: string;
  entityId: bigint;
  action: AuditAction;
  changes?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
}

export interface AuditLogFilters {
  tenantId?: bigint;
  userId?: bigint;
  entityType?: string;
  entityId?: bigint;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
}

export class AuditLogRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateAuditLogInput): Promise<AuditLog> {
    return this.prisma.auditLog.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        changes: data.changes || undefined,
        metadata: data.metadata || undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        location: data.location,
      },
    });
  }

  async findMany(filters: AuditLogFilters) {
    return this.prisma.auditLog.findMany({
      where: {
        tenantId: filters.tenantId,
        userId: filters.userId,
        entityType: filters.entityType,
        entityId: filters.entityId,
        action: filters.action,
        timestamp: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }

  async getEntityHistory(
    entityType: string,
    entityId: bigint,
    tenantId?: bigint
  ) {
    return this.findMany({
      tenantId,
      entityType,
      entityId,
    });
  }

  async getUserActivity(
    userId: bigint,
    startDate?: Date,
    endDate?: Date
  ) {
    return this.findMany({
      userId,
      startDate,
      endDate,
    });
  }
}
```

```typescript
// src/repositories/validation-rule.repository.ts

export class ValidationRuleRepository {
  constructor(private prisma: PrismaClient) {}

  async getRulesForEntity(entityType: string) {
    return this.prisma.validationRule.findMany({
      where: {
        entityType,
        isActive: true,
      },
      orderBy: {
        fieldName: 'asc',
      },
    });
  }

  async createRule(data: CreateValidationRuleInput) {
    return this.prisma.validationRule.create({ data });
  }

  async updateRule(id: bigint, data: UpdateValidationRuleInput) {
    return this.prisma.validationRule.update({
      where: { id },
      data,
    });
  }

  async toggleRule(id: bigint, isActive: boolean) {
    return this.updateRule(id, { isActive });
  }
}
```

### CAMADA 3: Service Layer

```typescript
// src/services/enhanced-audit.service.ts

import { AuditLogRepository } from '@/repositories/audit-log.repository';
import { AuditAction } from '@prisma/client';
import { headers } from 'next/headers';

export interface LogActionParams {
  userId: bigint;
  tenantId?: bigint;
  entityType: string;
  entityId: bigint;
  action: AuditAction;
  before?: any;
  after?: any;
  metadata?: any;
}

export class EnhancedAuditService {
  constructor(private auditRepo: AuditLogRepository) {}

  /**
   * Log de ação com captura automática de contexto
   */
  async logAction(params: LogActionParams): Promise<void> {
    // Capturar contexto da requisição
    const headersList = headers();
    const ipAddress = headersList.get('x-forwarded-for') || 
                      headersList.get('x-real-ip') || 
                      'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // Calcular diff se antes/depois fornecidos
    const changes = this.calculateDiff(params.before, params.after);

    // Criar log de forma assíncrona (não bloqueia)
    await this.auditRepo.create({
      userId: params.userId,
      tenantId: params.tenantId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      changes,
      metadata: params.metadata,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Calcula diff entre objetos
   */
  private calculateDiff(before?: any, after?: any): any {
    if (!before || !after) return null;

    const diff: any = { before: {}, after: {} };
    const allKeys = new Set([
      ...Object.keys(before),
      ...Object.keys(after),
    ]);

    for (const key of allKeys) {
      if (before[key] !== after[key]) {
        diff.before[key] = before[key];
        diff.after[key] = after[key];
      }
    }

    return Object.keys(diff.before).length > 0 ? diff : null;
  }

  /**
   * Gera relatório de auditoria
   */
  async generateAuditReport(filters: {
    tenantId?: bigint;
    startDate: Date;
    endDate: Date;
    entityTypes?: string[];
  }) {
    // Buscar logs
    const logs = await this.auditRepo.findMany({
      tenantId: filters.tenantId,
      startDate: filters.startDate,
      endDate: filters.endDate,
    });

    // Filtrar por entity types se especificado
    const filteredLogs = filters.entityTypes
      ? logs.filter(log => filters.entityTypes!.includes(log.entityType))
      : logs;

    // Calcular estatísticas
    const stats = {
      total: filteredLogs.length,
      byAction: this.groupBy(filteredLogs, 'action'),
      byEntityType: this.groupBy(filteredLogs, 'entityType'),
      byUser: this.groupBy(filteredLogs, 'userId'),
      timeline: this.groupByDate(filteredLogs),
    };

    return {
      logs: filteredLogs,
      stats,
      period: {
        start: filters.startDate,
        end: filters.endDate,
      },
    };
  }

  private groupBy(items: any[], key: string) {
    return items.reduce((acc, item) => {
      const value = item[key];
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  private groupByDate(items: any[]) {
    return items.reduce((acc, item) => {
      const date = item.timestamp.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
  }
}
```

```typescript
// src/services/validation.service.ts

import { ValidationRuleRepository } from '@/repositories/validation-rule.repository';
import { z } from 'zod';

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  errors: ValidationError[];
  warnings: ValidationWarning[];
  info: ValidationInfo[];
}

export interface ValidationError {
  field: string;
  message: string;
  value: any;
  rule: string;
}

export class ValidationService {
  constructor(private ruleRepo: ValidationRuleRepository) {}

  /**
   * Valida entidade completa
   */
  async validateEntity(
    entityType: string,
    data: any
  ): Promise<ValidationResult> {
    // Buscar regras ativas
    const rules = await this.ruleRepo.getRulesForEntity(entityType);

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];

    // Validar cada regra
    for (const rule of rules) {
      const fieldValue = data[rule.fieldName];
      const validation = this.validateField(rule, fieldValue);

      if (!validation.isValid) {
        switch (rule.severity) {
          case 'ERROR':
            errors.push({
              field: rule.fieldName,
              message: rule.errorMessage,
              value: fieldValue,
              rule: rule.ruleType,
            });
            break;
          case 'WARNING':
            warnings.push({
              field: rule.fieldName,
              message: rule.errorMessage,
              value: fieldValue,
            });
            break;
          case 'INFO':
            info.push({
              field: rule.fieldName,
              message: rule.errorMessage,
            });
            break;
        }
      }
    }

    // Calcular score
    const totalRules = rules.filter(r => r.severity === 'ERROR').length;
    const passedRules = totalRules - errors.length;
    const score = totalRules > 0 ? Math.round((passedRules / totalRules) * 100) : 100;

    return {
      isValid: errors.length === 0,
      score,
      errors,
      warnings,
      info,
    };
  }

  /**
   * Valida campo individual
   */
  private validateField(rule: any, value: any): { isValid: boolean } {
    switch (rule.ruleType) {
      case 'REQUIRED':
        return { isValid: value != null && value !== '' };

      case 'MIN_LENGTH':
        return {
          isValid: typeof value === 'string' && value.length >= rule.config.min,
        };

      case 'MAX_LENGTH':
        return {
          isValid: typeof value === 'string' && value.length <= rule.config.max,
        };

      case 'PATTERN':
        const regex = new RegExp(rule.config.pattern);
        return { isValid: regex.test(value) };

      case 'MIN_VALUE':
        return { isValid: Number(value) >= rule.config.min };

      case 'MAX_VALUE':
        return { isValid: Number(value) <= rule.config.max };

      // ... outros tipos

      default:
        return { isValid: true };
    }
  }

  /**
   * Valida em tempo real (para UI)
   */
  async validateFieldRealtime(
    entityType: string,
    fieldName: string,
    value: any
  ): Promise<ValidationError[]> {
    const rules = await this.ruleRepo.getRulesForEntity(entityType);
    const fieldRules = rules.filter(r => r.fieldName === fieldName);

    const errors: ValidationError[] = [];

    for (const rule of fieldRules) {
      const validation = this.validateField(rule, value);
      if (!validation.isValid && rule.severity === 'ERROR') {
        errors.push({
          field: fieldName,
          message: rule.errorMessage,
          value,
          rule: rule.ruleType,
        });
      }
    }

    return errors;
  }
}
```

### CAMADA 4: Enhanced Services (com Logging Integrado)

```typescript
// src/services/enhanced-auction.service.ts

import { AuctionService } from './auction.service';
import { EnhancedAuditService } from './enhanced-audit.service';
import { ValidationService } from './validation.service';
import { AuctionRepository } from '@/repositories/auction.repository';

export class EnhancedAuctionService extends AuctionService {
  constructor(
    auctionRepo: AuctionRepository,
    private auditService: EnhancedAuditService,
    private validationService: ValidationService
  ) {
    super(auctionRepo);
  }

  /**
   * Cria leilão com logging e validação
   */
  async createWithAudit(
    data: CreateAuctionInput,
    userId: bigint,
    tenantId: bigint
  ) {
    // 1. Validar dados
    const validation = await this.validationService.validateEntity(
      'Auction',
      data
    );

    if (!validation.isValid) {
      throw new Error(`Validação falhou: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // 2. Criar leilão
    const auction = await this.create(data);

    // 3. Log da ação (async, não bloqueia)
    await this.auditService.logAction({
      userId,
      tenantId,
      entityType: 'Auction',
      entityId: auction.id,
      action: 'CREATE',
      after: auction,
      metadata: {
        validationScore: validation.score,
      },
    });

    return auction;
  }

  /**
   * Atualiza leilão com logging de diff
   */
  async updateWithAudit(
    id: bigint,
    data: UpdateAuctionInput,
    userId: bigint,
    tenantId: bigint
  ) {
    // 1. Buscar estado anterior
    const before = await this.findById(id);

    if (!before) {
      throw new Error('Leilão não encontrado');
    }

    // 2. Validar mudanças
    const validation = await this.validationService.validateEntity(
      'Auction',
      { ...before, ...data }
    );

    if (!validation.isValid) {
      throw new Error(`Validação falhou: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // 3. Atualizar
    const after = await this.update(id, data);

    // 4. Log com diff
    await this.auditService.logAction({
      userId,
      tenantId,
      entityType: 'Auction',
      entityId: id,
      action: 'UPDATE',
      before,
      after,
      metadata: {
        validationScore: validation.score,
      },
    });

    return after;
  }

  /**
   * Soft delete com logging
   */
  async softDeleteWithAudit(
    id: bigint,
    userId: bigint,
    tenantId: bigint,
    reason: string
  ) {
    const before = await this.findById(id);

    await this.softDelete(id);

    await this.auditService.logAction({
      userId,
      tenantId,
      entityType: 'Auction',
      entityId: id,
      action: 'SOFT_DELETE',
      before,
      metadata: { reason },
    });
  }
}
```

### CAMADA 5: API Layer (Server Actions)

```typescript
// src/app/auctions/actions.ts

'use server';

import { auth } from '@/auth';
import { EnhancedAuctionService } from '@/services/enhanced-auction.service';
import { revalidatePath } from 'next/cache';

export async function createAuction(formData: FormData) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error('Não autenticado');
  }

  const data = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    // ... outros campos
  };

  const auctionService = new EnhancedAuctionService(/* deps */);

  const auction = await auctionService.createWithAudit(
    data,
    BigInt(session.user.id),
    BigInt(session.user.tenantId)
  );

  revalidatePath('/auctions');
  
  return { success: true, id: auction.id };
}

export async function updateAuction(id: string, formData: FormData) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error('Não autenticado');
  }

  const data = {
    title: formData.get('title') as string,
    // ... outros campos
  };

  const auctionService = new EnhancedAuctionService(/* deps */);

  await auctionService.updateWithAudit(
    BigInt(id),
    data,
    BigInt(session.user.id),
    BigInt(session.user.tenantId)
  );

  revalidatePath(`/auctions/${id}`);
  
  return { success: true };
}
```

### CAMADA 6: UI Components

```typescript
// src/components/crud/enhanced-crud-form.tsx

'use client';

import { useState, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { ValidationResult } from '@/services/validation.service';

interface EnhancedCRUDFormProps {
  entityType: string;
  initialData?: any;
  onSubmit: (formData: FormData) => Promise<any>;
  children: React.ReactNode;
}

export function EnhancedCRUDForm({
  entityType,
  initialData,
  onSubmit,
  children,
}: EnhancedCRUDFormProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [formData, setFormData] = useState(initialData || {});

  // Validação em tempo real (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      const result = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          data: formData,
        }),
      }).then(r => r.json());

      setValidationResult(result);
    }, 500);

    return () => clearTimeout(timer);
  }, [formData, entityType]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form action={onSubmit}>
      {/* Barra de progresso de validação */}
      <ValidationProgress score={validationResult?.score || 0} />

      {/* Campos do formulário com validação inline */}
      <div className="space-y-4">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              onChange: (e: any) => handleFieldChange(child.props.name, e.target.value),
              error: validationResult?.errors.find(err => err.field === child.props.name),
              warning: validationResult?.warnings.find(warn => warn.field === child.props.name),
            });
          }
          return child;
        })}
      </div>

      {/* Lista de erros */}
      {validationResult && (
        <ValidationSummary
          errors={validationResult.errors}
          warnings={validationResult.warnings}
          info={validationResult.info}
        />
      )}

      {/* Botão de submit (só habilitado se válido) */}
      <SubmitButton disabled={!validationResult?.isValid} />
    </form>
  );
}

function ValidationProgress({ score }: { score: number }) {
  const color = score === 100 ? 'bg-green-500' :
                score >= 80 ? 'bg-yellow-500' :
                'bg-red-500';

  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">Validação</span>
        <span className="text-sm font-medium">{score}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`${color} h-2.5 rounded-full transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function ValidationSummary({ errors, warnings, info }: any) {
  return (
    <div className="mt-4 space-y-2">
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <h4 className="font-semibold text-red-800 mb-2">Erros (bloqueiam publicação):</h4>
          <ul className="list-disc list-inside text-sm text-red-700">
            {errors.map((err: any, idx: number) => (
              <li key={idx}>{err.field}: {err.message}</li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <h4 className="font-semibold text-yellow-800 mb-2">Avisos:</h4>
          <ul className="list-disc list-inside text-sm text-yellow-700">
            {warnings.map((warn: any, idx: number) => (
              <li key={idx}>{warn.field}: {warn.message}</li>
            ))}
          </ul>
        </div>
      )}

      {info.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <h4 className="font-semibold text-blue-800 mb-2">Informações:</h4>
          <ul className="list-disc list-inside text-sm text-blue-700">
            {info.map((i: any, idx: number) => (
              <li key={idx}>{i.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

```typescript
// src/components/audit/audit-timeline.tsx

'use client';

import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLog {
  id: bigint;
  action: string;
  timestamp: Date;
  user: {
    fullName: string;
    avatarUrl?: string;
  };
  changes?: any;
  metadata?: any;
}

export function AuditTimeline({ logs }: { logs: AuditLog[] }) {
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {logs.map((log, idx) => (
          <li key={log.id.toString()}>
            <div className="relative pb-8">
              {idx !== logs.length - 1 && (
                <span
                  className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              
              <div className="relative flex items-start space-x-3">
                {/* Avatar */}
                <div className="relative">
                  <img
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-400 ring-8 ring-white"
                    src={log.user.avatarUrl || '/default-avatar.png'}
                    alt={log.user.fullName}
                  />
                  
                  {/* Badge de ação */}
                  <span className="absolute -bottom-0.5 -right-1 rounded-tl bg-white px-0.5 py-px">
                    {getActionIcon(log.action)}
                  </span>
                </div>

                {/* Conteúdo */}
                <div className="min-w-0 flex-1">
                  <div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">
                        {log.user.fullName}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {getActionDescription(log.action)}
                    </p>
                  </div>
                  
                  {/* Diff de mudanças */}
                  {log.changes && (
                    <div className="mt-2 text-sm text-gray-700">
                      <ChangeDiff changes={log.changes} />
                    </div>
                  )}
                  
                  {/* Metadata */}
                  {log.metadata?.reason && (
                    <div className="mt-2 text-sm italic text-gray-600">
                      Razão: {log.metadata.reason}
                    </div>
                  )}
                  
                  <div className="mt-2 text-xs text-gray-500">
                    {formatDistanceToNow(new Date(log.timestamp), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChangeDiff({ changes }: { changes: any }) {
  return (
    <div className="bg-gray-50 rounded p-2 space-y-1">
      {Object.keys(changes.before).map(key => (
        <div key={key} className="text-xs">
          <span className="font-medium">{key}:</span>
          <span className="text-red-600 line-through ml-2">
            {JSON.stringify(changes.before[key])}
          </span>
          <span className="text-green-600 ml-2">
            {JSON.stringify(changes.after[key])}
          </span>
        </div>
      ))}
    </div>
  );
}
```

---

## 🚀 ESTRATÉGIAS DE IMPLEMENTAÇÃO

### 1. **Performance Optimization**

#### Client-Side Validation (Instant Feedback)
```typescript
// Validação rápida no cliente sem chamada de API
// Usar Zod schemas compartilhados entre client/server

import { z } from 'zod';

export const auctionSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  startDate: z.date().min(new Date()),
  // ...
});

// No componente
const result = auctionSchema.safeParse(formData);
```

#### Debounced Validation
```typescript
// Aguardar 500ms após usuário parar de digitar
const debouncedValidate = useDebouncedCallback(async (data) => {
  await validateEntity(data);
}, 500);
```

#### Batch Logging
```typescript
// Acumular logs e enviar em lote a cada 5 segundos
class AuditBatcher {
  private queue: AuditLog[] = [];
  
  add(log: AuditLog) {
    this.queue.push(log);
  }
  
  async flush() {
    if (this.queue.length === 0) return;
    
    await prisma.auditLog.createMany({
      data: this.queue,
    });
    
    this.queue = [];
  }
}

setInterval(() => auditBatcher.flush(), 5000);
```

### 2. **Multi-Tenancy Isolation**

#### Row-Level Security
```typescript
// Sempre adicionar tenantId em queries
async findAuctions(userId: bigint, tenantId: bigint) {
  return prisma.auction.findMany({
    where: {
      tenantId, // SEMPRE obrigatório!
      // ... outros filtros
    },
  });
}
```

#### Middleware de Tenant
```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  const tenantId = getTenantFromRequest(request);
  
  if (!tenantId) {
    return NextResponse.redirect('/select-tenant');
  }
  
  // Adicionar tenantId no header para uso em server actions
  request.headers.set('x-tenant-id', tenantId);
  
  return NextResponse.next();
}
```

### 3. **Type Safety com Prisma**

```typescript
// Gerar tipos a partir do schema
import { Auction, Lot, Prisma } from '@prisma/client';

// Tipos de input inferidos
type AuctionCreateInput = Prisma.AuctionCreateInput;
type AuctionUpdateInput = Prisma.AuctionUpdateInput;

// Tipos de retorno com includes
type AuctionWithLots = Prisma.AuctionGetPayload<{
  include: { lots: true }
}>;
```

### 4. **Error Handling Consistente**

```typescript
// src/lib/errors.ts

export class ValidationError extends Error {
  constructor(
    public field: string,
    message: string,
    public code: string = 'VALIDATION_ERROR'
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuditError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuditError';
  }
}

// Tratamento centralizado
export async function handleServiceError(error: unknown) {
  if (error instanceof ValidationError) {
    return {
      success: false,
      error: error.message,
      field: error.field,
      code: error.code,
    };
  }
  
  if (error instanceof AuditError) {
    // Log crítico - falha de auditoria é grave!
    await logCriticalError(error);
    return {
      success: false,
      error: 'Erro ao registrar ação. Operação abortada.',
    };
  }
  
  // Erro genérico
  return {
    success: false,
    error: 'Erro inesperado',
  };
}
```

---

## 📊 ANÁLISE DE IMPACTO

### O que MUDA?

| Componente | Mudança | Impacto |
|------------|---------|---------|
| **Schema Prisma** | +3 models (AuditLog, ValidationRule, FormSubmission) | MÉDIO - Requer migração |
| **Repositories** | +3 novos (audit-log, validation-rule, form-submission) | BAIXO - Adição, não alteração |
| **Services** | Wrappers "Enhanced" para existentes | BAIXO - Não quebra código atual |
| **API Actions** | Trocar `service.create()` por `service.createWithAudit()` | MÉDIO - Buscar/substituir |
| **UI Components** | Adicionar `EnhancedCRUDForm` como alternativa | BAIXO - Opt-in gradual |
| **Testes** | +30 testes para validação/logging | MÉDIO - Cobertura completa |

### O que NÃO MUDA?

- ✅ Estrutura de pastas atual
- ✅ Repositories existentes (não são alterados)
- ✅ Services básicos (são wrappados, não modificados)
- ✅ UI dos módulos (apenas enriquecem com validação visual)
- ✅ Fluxos de autenticação
- ✅ Multi-tenancy atual (apenas adiciona logs)

### Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Performance degradada por logging | MÉDIA | ALTO | Logging async + batch |
| Quebra de código existente | BAIXA | ALTO | Wrappers opt-in, não substituição forçada |
| Validações muito rígidas | MÉDIA | MÉDIO | Severidade configurável (ERROR/WARNING/INFO) |
| Logs ocupam muito espaço | ALTA | MÉDIO | Política de retenção + arquivamento |
| Complexidade aumentada | MÉDIA | MÉDIO | Documentação detalhada + exemplos |

---

## ✅ DECISÕES ARQUITETURAIS

### 1. **Logging Assíncrono**
**Decisão:** Todos os logs são criados de forma assíncrona e não bloqueiam operações principais.
**Razão:** Performance e UX - usuário não deve esperar log ser salvo.
**Trade-off:** Em caso de falha de log, operação principal já terá ocorrido (eventual consistency).

### 2. **Validação Client + Server**
**Decisão:** Validação duplicada no cliente (UX) e servidor (segurança).
**Razão:** Feedback instant+ garantia de integridade.
**Trade-off:** Código de validação duplicado (mitigado com Zod schemas compartilhados).

### 3. **Soft Delete com Audit**
**Decisão:** Deletar não remove registro, apenas marca como deletado + log.
**Razão:** Compliance e rastreabilidade total.
**Trade-off:** Banco de dados cresce mais (mitigado com arquivamento periódico).

### 4. **Validações Configuráveis**
**Decisão:** Regras de validação em banco (ValidationRule model).
**Razão:** Flexibilidade para ajustar regras sem deploy.
**Trade-off:** Consulta extra ao banco (mitigado com cache em memória).

### 5. **Wrappers ao invés de Modificações**
**Decisão:** `EnhancedAuctionService` wraps `AuctionService`, não substitui.
**Razão:** Backward compatibility e rollback fácil.
**Trade-off:** Camada extra de abstração.

---

## 🎯 PRÓXIMO PASSO

Criação do **ROADMAP DE IMPLEMENTAÇÃO** detalhado ➡️

