# 🗺️ ROADMAP DE IMPLEMENTAÇÃO: Logs e Validações

**Data:** 23 Novembro 2025
**Versão:** 1.0.0
**Duração Estimada:** 8-10 dias úteis

---

## 📋 VISÃO GERAL

### Abordagem: **Incremental e Modular**

Implementaremos em fases pequenas e testáveis, começando pela infraestrutura base e adicionando módulos gradualmente.

### Princípios:

1. **Baby Steps:** Cada PR é pequeno e focado
2. **Test-First:** Testes antes de features
3. **Documentation-Driven:** Docs junto com código
4. **No Breaking Changes:** Compatibilidade sempre
5. **Deploy Gradual:** Features com feature flags

---

## 🎯 FASES DO PROJETO

```
FASE 1: Fundação (Database + Repositories)          [2 dias]
FASE 2: Serviços Core (Audit + Validation)         [2 dias]
FASE 3: Módulo Piloto (Auctions)                    [2 dias]
FASE 4: Expansão (Lots + Assets + Processos)       [2 dias]
FASE 5: UI Enhancements + Relatórios                [1 dia]
FASE 6: Testes E2E + QA                             [1 dia]
```

**Total:** 10 dias úteis (2 semanas)

---

## 📅 FASE 1: FUNDAÇÃO (Dias 1-2)

### Objetivo
Criar estrutura de dados e camada de acesso básica.

### Tarefas

#### DIA 1: Database Schema

**1.1. Criar Migration de Audit Log** [2h]
```bash
Arquivo: prisma/migrations/XXX_add_audit_log/migration.sql
```

```sql
-- CreateEnum para AuditAction
CREATE TYPE "AuditAction" AS ENUM (
  'CREATE',
  'UPDATE',
  'DELETE',
  'SOFT_DELETE',
  'RESTORE',
  'PUBLISH',
  'UNPUBLISH',
  'APPROVE',
  'REJECT',
  'EXPORT',
  'IMPORT'
);

-- CreateTable AuditLog
CREATE TABLE "AuditLog" (
    "id" BIGSERIAL NOT NULL,
    "tenantId" BIGINT,
    "userId" BIGINT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" BIGINT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "changes" JSONB,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_entityType_entityId_idx" ON "AuditLog"("tenantId", "entityType", "entityId");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

**Atualizar schema.prisma** [30min]
```prisma
// Adicionar ao schema.prisma conforme ANALISE_ARQUITETURA_LOGGING_VALIDACAO.md
```

**Executar Migration** [10min]
```bash
npx prisma migrate dev --name add_audit_log
npx prisma generate
```

**1.2. Criar Migration de Validation Rules** [1.5h]
```sql
-- CreateEnum para ValidationType
CREATE TYPE "ValidationType" AS ENUM (
  'REQUIRED',
  'MIN_LENGTH',
  'MAX_LENGTH',
  'PATTERN',
  'MIN_VALUE',
  'MAX_VALUE',
  'DATE_RANGE',
  'FILE_TYPE',
  'FILE_SIZE',
  'CUSTOM'
);

-- CreateEnum para ValidationSeverity
CREATE TYPE "ValidationSeverity" AS ENUM (
  'ERROR',
  'WARNING',
  'INFO'
);

-- CreateTable ValidationRule
CREATE TABLE "ValidationRule" (
    "id" BIGSERIAL NOT NULL,
    "entityType" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "ruleType" "ValidationType" NOT NULL,
    "config" JSONB NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT NOT NULL,
    "severity" "ValidationSeverity" NOT NULL DEFAULT 'ERROR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ValidationRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ValidationRule_entityType_fieldName_ruleType_key" ON "ValidationRule"("entityType", "fieldName", "ruleType");
CREATE INDEX "ValidationRule_entityType_idx" ON "ValidationRule"("entityType");
```

**Executar Migration** [10min]
```bash
npx prisma migrate dev --name add_validation_rules
npx prisma generate
```

**1.3. Seed de Validation Rules Básicas** [1h]
```typescript
// prisma/seeds/validation-rules.seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedValidationRules() {
  console.log('🌱 Seeding validation rules...');

  // Regras para Auction
  await prisma.validationRule.createMany({
    data: [
      {
        entityType: 'Auction',
        fieldName: 'title',
        ruleType: 'REQUIRED',
        config: {},
        isRequired: true,
        errorMessage: 'Título é obrigatório',
        severity: 'ERROR',
      },
      {
        entityType: 'Auction',
        fieldName: 'title',
        ruleType: 'MIN_LENGTH',
        config: { min: 10 },
        errorMessage: 'Título deve ter no mínimo 10 caracteres',
        severity: 'ERROR',
      },
      {
        entityType: 'Auction',
        fieldName: 'description',
        ruleType: 'MIN_LENGTH',
        config: { min: 50 },
        errorMessage: 'Descrição deve ter no mínimo 50 caracteres',
        severity: 'WARNING',
      },
      // ... mais regras
    ],
  });

  // Regras para Lot
  await prisma.validationRule.createMany({
    data: [
      {
        entityType: 'Lot',
        fieldName: 'title',
        ruleType: 'REQUIRED',
        config: {},
        isRequired: true,
        errorMessage: 'Título do lote é obrigatório',
        severity: 'ERROR',
      },
      {
        entityType: 'Lot',
        fieldName: 'price',
        ruleType: 'MIN_VALUE',
        config: { min: 0.01 },
        errorMessage: 'Preço deve ser maior que zero',
        severity: 'ERROR',
      },
      // ... mais regras
    ],
  });

  console.log('✅ Validation rules seeded');
}

seedValidationRules()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Checklist DIA 1:**
- [ ] Migration de AuditLog criada e executada
- [ ] Migration de ValidationRule criada e executada
- [ ] Schema Prisma atualizado
- [ ] Seed de regras básicas criado
- [ ] `npx prisma generate` executado com sucesso
- [ ] Commit: `feat: add audit log and validation rule schemas`

---

#### DIA 2: Repositories

**2.1. Criar AuditLogRepository** [2h]

```typescript
// src/repositories/audit-log.repository.ts

import { PrismaClient, AuditAction, AuditLog, Prisma } from '@prisma/client';

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
  limit?: number;
  offset?: number;
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
        changes: data.changes || Prisma.JsonNull,
        metadata: data.metadata || Prisma.JsonNull,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        location: data.location,
      },
    });
  }

  async createMany(logs: CreateAuditLogInput[]): Promise<number> {
    const result = await this.prisma.auditLog.createMany({
      data: logs.map(log => ({
        tenantId: log.tenantId,
        userId: log.userId,
        entityType: log.entityType,
        entityId: log.entityId,
        action: log.action,
        changes: log.changes || Prisma.JsonNull,
        metadata: log.metadata || Prisma.JsonNull,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        location: log.location,
      })),
    });
    return result.count;
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
      take: filters.limit || 100,
      skip: filters.offset || 0,
    });
  }

  async count(filters: Omit<AuditLogFilters, 'limit' | 'offset'>): Promise<number> {
    return this.prisma.auditLog.count({
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
    endDate?: Date,
    limit?: number
  ) {
    return this.findMany({
      userId,
      startDate,
      endDate,
      limit,
    });
  }

  async getRecentActivity(tenantId: bigint, limit: number = 20) {
    return this.findMany({
      tenantId,
      limit,
    });
  }
}
```

**Teste do Repository** [1h]
```typescript
// src/repositories/__tests__/audit-log.repository.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { AuditLogRepository } from '../audit-log.repository';
import { PrismaClient } from '@prisma/client';

describe('AuditLogRepository', () => {
  let prisma: PrismaClient;
  let repo: AuditLogRepository;

  beforeEach(() => {
    prisma = new PrismaClient();
    repo = new AuditLogRepository(prisma);
  });

  it('should create audit log', async () => {
    const log = await repo.create({
      userId: BigInt(1),
      entityType: 'Auction',
      entityId: BigInt(10),
      action: 'CREATE',
      ipAddress: '192.168.1.1',
    });

    expect(log.id).toBeDefined();
    expect(log.entityType).toBe('Auction');
    expect(log.action).toBe('CREATE');
  });

  it('should find logs by entity', async () => {
    const logs = await repo.getEntityHistory('Auction', BigInt(10));
    expect(Array.isArray(logs)).toBe(true);
  });

  it('should find logs by user', async () => {
    const logs = await repo.getUserActivity(BigInt(1));
    expect(Array.isArray(logs)).toBe(true);
  });

  it('should count logs with filters', async () => {
    const count = await repo.count({
      entityType: 'Auction',
    });
    expect(typeof count).toBe('number');
  });
});
```

**2.2. Criar ValidationRuleRepository** [1.5h]

```typescript
// src/repositories/validation-rule.repository.ts

import { PrismaClient, ValidationRule, ValidationType, ValidationSeverity } from '@prisma/client';

export interface CreateValidationRuleInput {
  entityType: string;
  fieldName: string;
  ruleType: ValidationType;
  config: any;
  isRequired?: boolean;
  errorMessage: string;
  severity?: ValidationSeverity;
  isActive?: boolean;
}

export class ValidationRuleRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateValidationRuleInput): Promise<ValidationRule> {
    return this.prisma.validationRule.create({ data });
  }

  async findById(id: bigint): Promise<ValidationRule | null> {
    return this.prisma.validationRule.findUnique({
      where: { id },
    });
  }

  async getRulesForEntity(entityType: string): Promise<ValidationRule[]> {
    return this.prisma.validationRule.findMany({
      where: {
        entityType,
        isActive: true,
      },
      orderBy: [
        { severity: 'desc' }, // ERROR primeiro
        { fieldName: 'asc' },
      ],
    });
  }

  async getRulesForField(entityType: string, fieldName: string): Promise<ValidationRule[]> {
    return this.prisma.validationRule.findMany({
      where: {
        entityType,
        fieldName,
        isActive: true,
      },
    });
  }

  async update(id: bigint, data: Partial<CreateValidationRuleInput>): Promise<ValidationRule> {
    return this.prisma.validationRule.update({
      where: { id },
      data,
    });
  }

  async toggleActive(id: bigint, isActive: boolean): Promise<ValidationRule> {
    return this.update(id, { isActive });
  }

  async delete(id: bigint): Promise<void> {
    await this.prisma.validationRule.delete({
      where: { id },
    });
  }

  async getAllEntityTypes(): Promise<string[]> {
    const results = await this.prisma.validationRule.findMany({
      select: { entityType: true },
      distinct: ['entityType'],
    });
    return results.map(r => r.entityType);
  }
}
```

**Teste do Repository** [30min]
```typescript
// src/repositories/__tests__/validation-rule.repository.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationRuleRepository } from '../validation-rule.repository';
import { PrismaClient } from '@prisma/client';

describe('ValidationRuleRepository', () => {
  let prisma: PrismaClient;
  let repo: ValidationRuleRepository;

  beforeEach(() => {
    prisma = new PrismaClient();
    repo = new ValidationRuleRepository(prisma);
  });

  it('should create validation rule', async () => {
    const rule = await repo.create({
      entityType: 'Auction',
      fieldName: 'title',
      ruleType: 'MIN_LENGTH',
      config: { min: 10 },
      errorMessage: 'Título muito curto',
      severity: 'ERROR',
    });

    expect(rule.id).toBeDefined();
    expect(rule.entityType).toBe('Auction');
  });

  it('should get rules for entity', async () => {
    const rules = await repo.getRulesForEntity('Auction');
    expect(Array.isArray(rules)).toBe(true);
  });

  it('should get rules for field', async () => {
    const rules = await repo.getRulesForField('Auction', 'title');
    expect(Array.isArray(rules)).toBe(true);
  });

  it('should toggle rule active status', async () => {
    const rule = await repo.create({
      entityType: 'Test',
      fieldName: 'field',
      ruleType: 'REQUIRED',
      config: {},
      errorMessage: 'Test',
    });

    const updated = await repo.toggleActive(rule.id, false);
    expect(updated.isActive).toBe(false);
  });
});
```

**Checklist DIA 2:**
- [ ] AuditLogRepository implementado
- [ ] Testes de AuditLogRepository passando
- [ ] ValidationRuleRepository implementado
- [ ] Testes de ValidationRuleRepository passando
- [ ] `npm test` passando 100%
- [ ] Commit: `feat: add audit log and validation rule repositories`

---

## 📅 FASE 2: SERVIÇOS CORE (Dias 3-4)

### Objetivo
Implementar lógica de negócio para logging e validação.

#### DIA 3: Enhanced Audit Service

**3.1. Criar EnhancedAuditService** [3h]

```typescript
// src/services/enhanced-audit.service.ts

import { AuditLogRepository, CreateAuditLogInput } from '@/repositories/audit-log.repository';
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
  metadata?: Record<string, any>;
}

export interface AuditReportFilters {
  tenantId?: bigint;
  startDate: Date;
  endDate: Date;
  entityTypes?: string[];
  userIds?: bigint[];
  actions?: AuditAction[];
}

export interface AuditReport {
  logs: any[];
  stats: {
    total: number;
    byAction: Record<string, number>;
    byEntityType: Record<string, number>;
    byUser: Record<string, number>;
    timeline: Record<string, number>;
  };
  period: {
    start: Date;
    end: Date;
  };
}

export class EnhancedAuditService {
  constructor(private auditRepo: AuditLogRepository) {}

  /**
   * Registra ação com captura automática de contexto
   */
  async logAction(params: LogActionParams): Promise<void> {
    try {
      // Capturar contexto da requisição (se disponível)
      let ipAddress = 'unknown';
      let userAgent = 'unknown';

      try {
        const headersList = headers();
        ipAddress = headersList.get('x-forwarded-for') || 
                    headersList.get('x-real-ip') || 
                    'unknown';
        userAgent = headersList.get('user-agent') || 'unknown';
      } catch {
        // Headers não disponíveis (ex: script direto)
      }

      // Calcular diff se antes/depois fornecidos
      const changes = this.calculateDiff(params.before, params.after);

      // Criar log
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
    } catch (error) {
      // Log crítico - não deve falhar silenciosamente
      console.error('❌ CRITICAL: Failed to create audit log', error);
      // TODO: Enviar alerta para sistema de monitoramento
      throw error;
    }
  }

  /**
   * Calcula diferenças entre dois objetos
   */
  private calculateDiff(before?: any, after?: any): any {
    if (!before || !after) return null;

    const diff: any = { before: {}, after: {} };
    const allKeys = new Set([
      ...Object.keys(before),
      ...Object.keys(after),
    ]);

    for (const key of allKeys) {
      // Ignorar campos internos
      if (key.startsWith('_') || key === 'updatedAt') continue;

      // Comparar valores
      const beforeVal = before[key];
      const afterVal = after[key];

      if (!this.areEqual(beforeVal, afterVal)) {
        diff.before[key] = beforeVal;
        diff.after[key] = afterVal;
      }
    }

    return Object.keys(diff.before).length > 0 ? diff : null;
  }

  private areEqual(a: any, b: any): boolean {
    // Comparação profunda simples
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    
    // Para objetos complexos, serializar
    if (typeof a === 'object') {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    
    return false;
  }

  /**
   * Busca histórico de uma entidade
   */
  async getEntityHistory(entityType: string, entityId: bigint, tenantId?: bigint) {
    return this.auditRepo.getEntityHistory(entityType, entityId, tenantId);
  }

  /**
   * Busca atividade de um usuário
   */
  async getUserActivity(userId: bigint, startDate?: Date, endDate?: Date) {
    return this.auditRepo.getUserActivity(userId, startDate, endDate);
  }

  /**
   * Gera relatório de auditoria
   */
  async generateAuditReport(filters: AuditReportFilters): Promise<AuditReport> {
    // Buscar logs
    const logs = await this.auditRepo.findMany({
      tenantId: filters.tenantId,
      startDate: filters.startDate,
      endDate: filters.endDate,
    });

    // Filtrar por critérios adicionais
    let filteredLogs = logs;

    if (filters.entityTypes && filters.entityTypes.length > 0) {
      filteredLogs = filteredLogs.filter(log => 
        filters.entityTypes!.includes(log.entityType)
      );
    }

    if (filters.userIds && filters.userIds.length > 0) {
      filteredLogs = filteredLogs.filter(log => 
        filters.userIds!.some(id => id === log.userId)
      );
    }

    if (filters.actions && filters.actions.length > 0) {
      filteredLogs = filteredLogs.filter(log => 
        filters.actions!.includes(log.action)
      );
    }

    // Calcular estatísticas
    const stats = {
      total: filteredLogs.length,
      byAction: this.groupBy(filteredLogs, 'action'),
      byEntityType: this.groupBy(filteredLogs, 'entityType'),
      byUser: this.groupByUser(filteredLogs),
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

  private groupBy(items: any[], key: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const value = item[key]?.toString() || 'unknown';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  private groupByUser(items: any[]): Record<string, number> {
    return items.reduce((acc, item) => {
      const userName = item.user?.fullName || 'Unknown User';
      acc[userName] = (acc[userName] || 0) + 1;
      return acc;
    }, {});
  }

  private groupByDate(items: any[]): Record<string, number> {
    return items.reduce((acc, item) => {
      const date = new Date(item.timestamp).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Exporta relatório para formato específico
   */
  async exportReport(
    report: AuditReport,
    format: 'json' | 'csv' | 'pdf' = 'json'
  ): Promise<string | Buffer> {
    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      
      case 'csv':
        return this.generateCSV(report);
      
      case 'pdf':
        // TODO: Implementar geração de PDF
        throw new Error('PDF export not yet implemented');
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private generateCSV(report: AuditReport): string {
    const headers = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'IP Address'];
    const rows = report.logs.map(log => [
      new Date(log.timestamp).toISOString(),
      log.user?.fullName || 'Unknown',
      log.action,
      log.entityType,
      log.entityId.toString(),
      log.ipAddress || 'N/A',
    ]);

    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
  }
}
```

**Testes** [1.5h]
```typescript
// src/services/__tests__/enhanced-audit.service.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnhancedAuditService } from '../enhanced-audit.service';
import { AuditLogRepository } from '@/repositories/audit-log.repository';

describe('EnhancedAuditService', () => {
  let service: EnhancedAuditService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      create: vi.fn(),
      findMany: vi.fn(),
      getEntityHistory: vi.fn(),
      getUserActivity: vi.fn(),
    };
    service = new EnhancedAuditService(mockRepo);
  });

  describe('logAction', () => {
    it('should create audit log with diff', async () => {
      const before = { title: 'Old Title', price: 100 };
      const after = { title: 'New Title', price: 100 };

      await service.logAction({
        userId: BigInt(1),
        tenantId: BigInt(1),
        entityType: 'Auction',
        entityId: BigInt(10),
        action: 'UPDATE',
        before,
        after,
      });

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATE',
          changes: {
            before: { title: 'Old Title' },
            after: { title: 'New Title' },
          },
        })
      );
    });

    it('should handle errors and not fail silently', async () => {
      mockRepo.create.mockRejectedValue(new Error('DB Error'));

      await expect(service.logAction({
        userId: BigInt(1),
        entityType: 'Test',
        entityId: BigInt(1),
        action: 'CREATE',
      })).rejects.toThrow('DB Error');
    });
  });

  describe('generateAuditReport', () => {
    it('should generate report with stats', async () => {
      mockRepo.findMany.mockResolvedValue([
        {
          id: BigInt(1),
          action: 'CREATE',
          entityType: 'Auction',
          userId: BigInt(1),
          timestamp: new Date('2025-01-15'),
          user: { fullName: 'John Doe' },
        },
        {
          id: BigInt(2),
          action: 'UPDATE',
          entityType: 'Auction',
          userId: BigInt(1),
          timestamp: new Date('2025-01-15'),
          user: { fullName: 'John Doe' },
        },
      ]);

      const report = await service.generateAuditReport({
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
      });

      expect(report.stats.total).toBe(2);
      expect(report.stats.byAction['CREATE']).toBe(1);
      expect(report.stats.byAction['UPDATE']).toBe(1);
      expect(report.stats.byEntityType['Auction']).toBe(2);
    });
  });

  describe('exportReport', () => {
    it('should export as JSON', async () => {
      const report = {
        logs: [],
        stats: { total: 0, byAction: {}, byEntityType: {}, byUser: {}, timeline: {} },
        period: { start: new Date(), end: new Date() },
      };

      const json = await service.exportReport(report, 'json');
      expect(typeof json).toBe('string');
      expect(() => JSON.parse(json as string)).not.toThrow();
    });

    it('should export as CSV', async () => {
      const report = {
        logs: [
          {
            timestamp: new Date('2025-01-15'),
            user: { fullName: 'John Doe' },
            action: 'CREATE',
            entityType: 'Auction',
            entityId: BigInt(1),
            ipAddress: '192.168.1.1',
          },
        ],
        stats: { total: 1, byAction: {}, byEntityType: {}, byUser: {}, timeline: {} },
        period: { start: new Date(), end: new Date() },
      };

      const csv = await service.exportReport(report, 'csv');
      expect(csv).toContain('Timestamp,User,Action');
      expect(csv).toContain('John Doe');
    });
  });
});
```

**Checklist DIA 3:**
- [ ] EnhancedAuditService implementado
- [ ] Testes passando 100%
- [ ] Documentação do serviço criada
- [ ] Commit: `feat: add enhanced audit service with reporting`

---

#### DIA 4: Validation Service

**4.1. Criar ValidationService** [3h]

```typescript
// src/services/validation.service.ts

import { ValidationRuleRepository } from '@/repositories/validation-rule.repository';
import { ValidationRule, ValidationType, ValidationSeverity } from '@prisma/client';

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
  rule: ValidationType;
  severity: 'ERROR';
}

export interface ValidationWarning {
  field: string;
  message: string;
  value: any;
  rule: ValidationType;
  severity: 'WARNING';
}

export interface ValidationInfo {
  field: string;
  message: string;
  severity: 'INFO';
}

export class ValidationService {
  // Cache de regras em memória (performance)
  private rulesCache: Map<string, ValidationRule[]> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutos
  private cacheTimestamps: Map<string, number> = new Map();

  constructor(private ruleRepo: ValidationRuleRepository) {}

  /**
   * Valida entidade completa
   */
  async validateEntity(
    entityType: string,
    data: Record<string, any>
  ): Promise<ValidationResult> {
    // Buscar regras (com cache)
    const rules = await this.getRulesWithCache(entityType);

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];

    // Validar cada regra
    for (const rule of rules) {
      const fieldValue = data[rule.fieldName];
      const validation = this.validateField(rule, fieldValue);

      if (!validation.isValid) {
        const issue = {
          field: rule.fieldName,
          message: rule.errorMessage,
          value: fieldValue,
          rule: rule.ruleType,
        };

        switch (rule.severity) {
          case 'ERROR':
            errors.push({ ...issue, severity: 'ERROR' });
            break;
          case 'WARNING':
            warnings.push({ ...issue, severity: 'WARNING' });
            break;
          case 'INFO':
            info.push({
              field: rule.fieldName,
              message: rule.errorMessage,
              severity: 'INFO',
            });
            break;
        }
      }
    }

    // Calcular score (baseado em regras ERROR)
    const errorRules = rules.filter(r => r.severity === 'ERROR');
    const passedRules = errorRules.length - errors.length;
    const score = errorRules.length > 0 
      ? Math.round((passedRules / errorRules.length) * 100)
      : 100;

    return {
      isValid: errors.length === 0,
      score,
      errors,
      warnings,
      info,
    };
  }

  /**
   * Valida campo individual (para validação em tempo real)
   */
  async validateField(
    entityType: string,
    fieldName: string,
    value: any
  ): Promise<ValidationError[]> {
    const rules = await this.getRulesWithCache(entityType);
    const fieldRules = rules.filter(r => r.fieldName === fieldName);

    const errors: ValidationError[] = [];

    for (const rule of fieldRules) {
      const validation = this.validateFieldValue(rule, value);
      
      if (!validation.isValid && rule.severity === 'ERROR') {
        errors.push({
          field: fieldName,
          message: rule.errorMessage,
          value,
          rule: rule.ruleType,
          severity: 'ERROR',
        });
      }
    }

    return errors;
  }

  /**
   * Valida valor de um campo contra uma regra
   */
  private validateFieldValue(rule: ValidationRule, value: any): { isValid: boolean } {
    const config = rule.config as any;

    switch (rule.ruleType) {
      case 'REQUIRED':
        return {
          isValid: value !== null && value !== undefined && value !== '',
        };

      case 'MIN_LENGTH':
        if (typeof value !== 'string') return { isValid: false };
        return { isValid: value.length >= (config.min || 0) };

      case 'MAX_LENGTH':
        if (typeof value !== 'string') return { isValid: false };
        return { isValid: value.length <= (config.max || Infinity) };

      case 'PATTERN':
        if (typeof value !== 'string') return { isValid: false };
        const regex = new RegExp(config.pattern);
        return { isValid: regex.test(value) };

      case 'MIN_VALUE':
        const numValue = Number(value);
        if (isNaN(numValue)) return { isValid: false };
        return { isValid: numValue >= (config.min || -Infinity) };

      case 'MAX_VALUE':
        const maxNumValue = Number(value);
        if (isNaN(maxNumValue)) return { isValid: false };
        return { isValid: maxNumValue <= (config.max || Infinity) };

      case 'DATE_RANGE':
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) return { isValid: false };
        
        const minDate = config.min ? new Date(config.min) : null;
        const maxDate = config.max ? new Date(config.max) : null;
        
        if (minDate && dateValue < minDate) return { isValid: false };
        if (maxDate && dateValue > maxDate) return { isValid: false };
        
        return { isValid: true };

      case 'FILE_TYPE':
        if (!value || !value.type) return { isValid: false };
        const allowedTypes = config.allowedTypes || [];
        return { isValid: allowedTypes.includes(value.type) };

      case 'FILE_SIZE':
        if (!value || !value.size) return { isValid: false };
        const maxSize = config.maxSize || Infinity;
        return { isValid: value.size <= maxSize };

      case 'CUSTOM':
        // Para regras customizadas, usar função eval (cuidado!)
        // TODO: Implementar sistema de plugins seguro
        return { isValid: true };

      default:
        console.warn(`Unknown validation type: ${rule.ruleType}`);
        return { isValid: true };
    }
  }

  /**
   * Busca regras com cache
   */
  private async getRulesWithCache(entityType: string): Promise<ValidationRule[]> {
    const now = Date.now();
    const cacheKey = entityType;
    const lastFetch = this.cacheTimestamps.get(cacheKey) || 0;

    // Cache válido?
    if (now - lastFetch < this.cacheTTL && this.rulesCache.has(cacheKey)) {
      return this.rulesCache.get(cacheKey)!;
    }

    // Buscar do banco
    const rules = await this.ruleRepo.getRulesForEntity(entityType);

    // Atualizar cache
    this.rulesCache.set(cacheKey, rules);
    this.cacheTimestamps.set(cacheKey, now);

    return rules;
  }

  /**
   * Limpa cache (útil após criar/atualizar regras)
   */
  clearCache(entityType?: string) {
    if (entityType) {
      this.rulesCache.delete(entityType);
      this.cacheTimestamps.delete(entityType);
    } else {
      this.rulesCache.clear();
      this.cacheTimestamps.clear();
    }
  }

  /**
   * Gera schema Zod a partir das regras (para validação client-side)
   */
  async generateZodSchema(entityType: string): Promise<string> {
    const rules = await this.getRulesWithCache(entityType);
    
    const fieldSchemas: Record<string, string[]> = {};

    for (const rule of rules) {
      if (!fieldSchemas[rule.fieldName]) {
        fieldSchemas[rule.fieldName] = [];
      }

      switch (rule.ruleType) {
        case 'REQUIRED':
          if (rule.isRequired) {
            fieldSchemas[rule.fieldName].push('z.string()');
          } else {
            fieldSchemas[rule.fieldName].push('z.string().optional()');
          }
          break;

        case 'MIN_LENGTH':
          const config = rule.config as any;
          fieldSchemas[rule.fieldName].push(`.min(${config.min}, '${rule.errorMessage}')`);
          break;

        case 'MAX_LENGTH':
          const maxConfig = rule.config as any;
          fieldSchemas[rule.fieldName].push(`.max(${maxConfig.max}, '${rule.errorMessage}')`);
          break;

        // ... outros tipos
      }
    }

    // Gerar código Zod
    const schemaCode = `
import { z } from 'zod';

export const ${entityType}Schema = z.object({
${Object.entries(fieldSchemas).map(([field, validations]) => 
  `  ${field}: ${validations.join('')},`
).join('\n')}
});

export type ${entityType}Input = z.infer<typeof ${entityType}Schema>;
    `.trim();

    return schemaCode;
  }
}
```

**Testes** [1.5h]
```typescript
// src/services/__tests__/validation.service.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ValidationService } from '../validation.service';
import { ValidationRuleRepository } from '@/repositories/validation-rule.repository';

describe('ValidationService', () => {
  let service: ValidationService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      getRulesForEntity: vi.fn(),
      getRulesForField: vi.fn(),
    };
    service = new ValidationService(mockRepo);
  });

  describe('validateEntity', () => {
    it('should validate entity successfully', async () => {
      mockRepo.getRulesForEntity.mockResolvedValue([
        {
          fieldName: 'title',
          ruleType: 'REQUIRED',
          config: {},
          severity: 'ERROR',
          errorMessage: 'Título é obrigatório',
          isRequired: true,
        },
        {
          fieldName: 'title',
          ruleType: 'MIN_LENGTH',
          config: { min: 10 },
          severity: 'ERROR',
          errorMessage: 'Título deve ter no mínimo 10 caracteres',
        },
      ]);

      const result = await service.validateEntity('Auction', {
        title: 'Valid Title Here',
      });

      expect(result.isValid).toBe(true);
      expect(result.score).toBe(100);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect validation errors', async () => {
      mockRepo.getRulesForEntity.mockResolvedValue([
        {
          fieldName: 'title',
          ruleType: 'REQUIRED',
          config: {},
          severity: 'ERROR',
          errorMessage: 'Título é obrigatório',
          isRequired: true,
        },
      ]);

      const result = await service.validateEntity('Auction', {
        title: '',
      });

      expect(result.isValid).toBe(false);
      expect(result.score).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('title');
    });

    it('should handle warnings separately', async () => {
      mockRepo.getRulesForEntity.mockResolvedValue([
        {
          fieldName: 'description',
          ruleType: 'MIN_LENGTH',
          config: { min: 50 },
          severity: 'WARNING',
          errorMessage: 'Descrição curta pode reduzir conversão',
        },
      ]);

      const result = await service.validateEntity('Auction', {
        description: 'Short description',
      });

      expect(result.isValid).toBe(true); // Warnings não invalidam
      expect(result.score).toBe(100);
      expect(result.warnings).toHaveLength(1);
    });

    it('should calculate correct score', async () => {
      mockRepo.getRulesForEntity.mockResolvedValue([
        {
          fieldName: 'field1',
          ruleType: 'REQUIRED',
          config: {},
          severity: 'ERROR',
          errorMessage: 'Error 1',
        },
        {
          fieldName: 'field2',
          ruleType: 'REQUIRED',
          config: {},
          severity: 'ERROR',
          errorMessage: 'Error 2',
        },
      ]);

      const result = await service.validateEntity('Test', {
        field1: 'valid',
        field2: '', // inválido
      });

      expect(result.score).toBe(50); // 1 de 2 passou = 50%
    });
  });

  describe('validateField', () => {
    it('should validate single field', async () => {
      mockRepo.getRulesForEntity.mockResolvedValue([
        {
          fieldName: 'email',
          ruleType: 'PATTERN',
          config: { pattern: '^[^@]+@[^@]+\\.[^@]+$' },
          severity: 'ERROR',
          errorMessage: 'Email inválido',
        },
      ]);

      const errors = await service.validateField('User', 'email', 'invalid-email');
      
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Email inválido');
    });
  });

  describe('rule validators', () => {
    it('should validate MIN_VALUE', async () => {
      mockRepo.getRulesForEntity.mockResolvedValue([
        {
          fieldName: 'price',
          ruleType: 'MIN_VALUE',
          config: { min: 0 },
          severity: 'ERROR',
          errorMessage: 'Preço deve ser positivo',
        },
      ]);

      const result = await service.validateEntity('Lot', {
        price: -10,
      });

      expect(result.errors).toHaveLength(1);
    });

    it('should validate DATE_RANGE', async () => {
      mockRepo.getRulesForEntity.mockResolvedValue([
        {
          fieldName: 'startDate',
          ruleType: 'DATE_RANGE',
          config: {
            min: new Date('2025-01-01').toISOString(),
            max: new Date('2025-12-31').toISOString(),
          },
          severity: 'ERROR',
          errorMessage: 'Data fora do range permitido',
        },
      ]);

      const result = await service.validateEntity('Auction', {
        startDate: new Date('2024-12-31'),
      });

      expect(result.errors).toHaveLength(1);
    });
  });

  describe('cache', () => {
    it('should cache rules', async () => {
      mockRepo.getRulesForEntity.mockResolvedValue([]);

      await service.validateEntity('Test', {});
      await service.validateEntity('Test', {});

      expect(mockRepo.getRulesForEntity).toHaveBeenCalledTimes(1);
    });

    it('should clear cache', async () => {
      mockRepo.getRulesForEntity.mockResolvedValue([]);

      await service.validateEntity('Test', {});
      service.clearCache('Test');
      await service.validateEntity('Test', {});

      expect(mockRepo.getRulesForEntity).toHaveBeenCalledTimes(2);
    });
  });
});
```

**Checklist DIA 4:**
- [ ] ValidationService implementado
- [ ] Testes passando 100%
- [ ] Cache funcionando corretamente
- [ ] Commit: `feat: add validation service with caching`

---

**CONTINUA...**

Esse é o início do roadmap detalhado. Deseja que eu continue com as Fases 3-6 (Módulo Piloto, Expansão, UI e Testes)?

