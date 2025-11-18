# 🚀 GUIA DE INTEGRAÇÃO - 5 GAPS IMPLEMENTADOS

## **Dependências Necessárias**

Todas já estão em `package.json`:
- ✅ `winston` v3.13.1 - Logging
- ✅ `zod` v3.23.8 - Validação
- ✅ `next` v14.2.3 - Framework
- ✅ `@prisma/client` v6.19.0 - ORM (uma vez funcional)

Nada novo a instalar.

---

## **PASSO 1: Corrigir Prisma (BLOQUEADOR)**

Antes de tudo, o servidor precisa subir sem erros. Problema atual:

```
Cannot read properties of undefined (reading 'lotCategory')
Cannot read properties of undefined (reading 'tenant')
```

### Ação:
1. **Verificar `src/lib/prisma.ts` ou `src/lib/prisma-client.ts`:**
   ```bash
   find src -name "*prisma*" -type f
   ```

2. **Garantir export correto:**
   ```typescript
   // CORRETO:
   export const prisma = new PrismaClient();
   
   // OU (com singleton pattern):
   const globalForPrisma = global as unknown as { prisma: PrismaClient };
   export const prisma = globalForPrisma.prisma || new PrismaClient();
   if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
   ```

3. **Rodar `npx prisma generate`** explicitamente
4. **Limpar `.next` e rodar `npm run dev:9005`** novamente

**Validação:** Quando `/admin/dashboard` carregar sem erro 500, o Prisma está OK.

---

## **PASSO 2: Integração - Audit Logs**

### Arquivo: `src/services/audit.service.ts` (criar)

```typescript
import { prisma } from '@/lib/prisma';
import { logDatabaseChange } from '@/lib/audit';

export async function createAuditLog(
  userId: string,
  tenantId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  entity: string,
  entityId: string,
  oldValue?: any,
  newValue?: any
) {
  // Log local (arquivo)
  logDatabaseChange(userId, tenantId, action, entity, entityId, oldValue, newValue);

  // TODO: Salvar em BD quando Prisma OK
  // await prisma.auditLog.create({
  //   data: {
  //     userId,
  //     tenantId,
  //     action,
  //     entity,
  //     entityId,
  //     oldValue: oldValue ? JSON.stringify(oldValue) : null,
  //     newValue: newValue ? JSON.stringify(newValue) : null,
  //     changes: summarizeChanges(oldValue, newValue),
  //     createdAt: new Date(),
  //   },
  // });
}
```

### Integração no Repositório (exemplo):

```typescript
// src/repositories/auction.repository.ts
import { createAuditLog } from '@/services/audit.service';

export class AuctionRepository {
  async update(id: string, data: any, userId: string, tenantId: string) {
    const old = await this.findById(id);
    const updated = await prisma.auction.update({
      where: { id },
      data,
    });

    await createAuditLog(userId, tenantId, 'UPDATE', 'Auction', id, old, updated);
    return updated;
  }
}
```

---

## **PASSO 3: Integração - Feature Flags com Prisma**

### Schema Prisma (adicionar): `prisma/schema.prisma`

```prisma
model PlatformSettings {
  id String @id @default(cuid())
  tenantId String @unique
  
  // Feature Flags JSON (serializado)
  featureFlags Json @default("{}")
  
  // Blockchain
  blockchainEnabled Boolean @default(false)
  blockchainNetwork String @default("NONE")
  blockchainNodeUrl String?
  
  // Lawyer Portal
  lawyerPortalEnabled Boolean @default(true)
  lawyerMonetizationModel String @default("SUBSCRIPTION")
  lawyerSubscriptionPrice Int? // em centavos
  lawyerPerUsePrice Int?
  lawyerRevenueSharePercent Int?
  
  // Soft Close
  softCloseEnabled Boolean @default(true)
  softCloseMinutes Int @default(5)
  softCloseMaxExtensions Int @default(3)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([tenantId])
}
```

### Implementação: `src/services/platform-settings.service.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { FeatureFlags, validateFeatureFlags } from '@/lib/feature-flags';

export class PlatformSettingsService {
  async getFeatureFlags(tenantId: string): Promise<FeatureFlags> {
    const settings = await prisma.platformSettings.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      return defaultFeatureFlags;
    }

    return settings.featureFlags as FeatureFlags;
  }

  async updateFeatureFlags(
    tenantId: string,
    flags: Partial<FeatureFlags>
  ): Promise<FeatureFlags> {
    const validated = validateFeatureFlags(flags);

    const settings = await prisma.platformSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        featureFlags: validated,
      },
      update: {
        featureFlags: validated,
      },
    });

    return settings.featureFlags as FeatureFlags;
  }
}

export const platformSettingsService = new PlatformSettingsService();
```

---

## **PASSO 4: API Routes**

### Criar: `src/app/api/realtime/bids/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { bidEventEmitter } from '@/lib/bid-events';
import { createAuditLog } from '@/services/audit.service';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    const tenantId = req.headers.get('x-tenant-id');
    const { auctionId, lotId, bidderId, bidAmount } = await req.json();

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Missing auth headers' }, { status: 401 });
    }

    // Emitir para listeners em tempo real
    bidEventEmitter.emitNewBid({
      auctionId,
      lotId,
      bidderId,
      bidAmount,
      bidTime: new Date(),
      isAutomatic: false,
    });

    // Log de auditoria
    await createAuditLog(userId, tenantId, 'CREATE', 'Bid', lotId, null, {
      auctionId,
      bidderId,
      amount: bidAmount,
    });

    return NextResponse.json({ success: true, bidAmount });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
```

### Criar: `src/app/api/feature-flags/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { platformSettingsService } from '@/services/platform-settings.service';

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || 'default';
    const flags = await platformSettingsService.getFeatureFlags(tenantId);

    return NextResponse.json({ tenantId, flags });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || 'default';
    const body = await req.json();
    const flags = await platformSettingsService.updateFeatureFlags(tenantId, body);

    return NextResponse.json({ success: true, flags });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 400 }
    );
  }
}
```

---

## **PASSO 5: UI Admin - Settings**

### Criar: `src/app/admin/settings/realtime/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { FeatureFlags } from '@/lib/feature-flags';

export default function RealtimeSettingsPage() {
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlags();
  }, []);

  async function fetchFlags() {
    const res = await fetch('/api/feature-flags');
    const data = await res.json();
    setFlags(data.flags);
    setLoading(false);
  }

  async function saveFlags(updated: Partial<FeatureFlags>) {
    const res = await fetch('/api/feature-flags', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    const data = await res.json();
    setFlags(data.flags);
  }

  if (loading) return <div>Carregando...</div>;
  if (!flags) return <div>Erro ao carregar configurações</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Configurações em Tempo Real</h1>

      {/* Blockchain */}
      <div className="mb-8 p-4 border rounded">
        <label className="flex items-center gap-3">
          <Switch
            checked={flags.blockchainEnabled}
            onCheckedChange={(checked) =>
              saveFlags({ blockchainEnabled: checked })
            }
          />
          <span className="font-medium">Habilitar Blockchain</span>
        </label>
        {flags.blockchainEnabled && (
          <div className="mt-3 text-sm text-yellow-600">
            ⚠️ Blockchain requer configuração de nós Hyperledger
          </div>
        )}
      </div>

      {/* Soft Close */}
      <div className="mb-8 p-4 border rounded">
        <label className="flex items-center gap-3 mb-3">
          <Switch
            checked={flags.softCloseEnabled}
            onCheckedChange={(checked) => saveFlags({ softCloseEnabled: checked })}
          />
          <span className="font-medium">Soft Close Automático</span>
        </label>
        {flags.softCloseEnabled && (
          <div className="space-y-3 ml-7">
            <div>
              <label>Minutos antes do final para ativar:</label>
              <Input
                type="number"
                value={flags.softCloseMinutes}
                onChange={(e) => saveFlags({ softCloseMinutes: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label>Máximo de extensões:</label>
              <Input
                type="number"
                value={flags.softCloseMaxExtensions}
                onChange={(e) => saveFlags({ softCloseMaxExtensions: parseInt(e.target.value) })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Lawyer Monetization */}
      <div className="mb-8 p-4 border rounded">
        <h3 className="font-medium mb-3">Modelo de Monetização do Portal de Advogados</h3>
        <RadioGroup
          value={flags.lawyerMonetizationModel}
          onValueChange={(value) => 
            saveFlags({ lawyerMonetizationModel: value as any })
          }
        >
          <label className="flex items-center gap-2 mb-2">
            <RadioGroupItem value="SUBSCRIPTION" />
            <span>Assinatura Mensal</span>
          </label>
          <label className="flex items-center gap-2 mb-2">
            <RadioGroupItem value="PAY_PER_USE" />
            <span>Pagar por Uso</span>
          </label>
          <label className="flex items-center gap-2">
            <RadioGroupItem value="REVENUE_SHARE" />
            <span>Divisão de Receita</span>
          </label>
        </RadioGroup>
      </div>

      <button
        onClick={() => alert('Configurações salvas!')}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Salvar
      </button>
    </div>
  );
}
```

---

## **PASSO 6: Testes E2E**

Atualizar `tests/e2e/realtime-features.spec.ts`:

```typescript
test('should toggle blockchain feature flag', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/admin/settings/realtime`);
  
  const blockchainSwitch = page.locator('input[name="blockchain"]');
  await blockchainSwitch.click();
  
  const warning = page.locator('text=Blockchain requer');
  await expect(warning).toBeVisible();
});
```

---

## **CHECKLIST DE IMPLEMENTAÇÃO**

- [ ] Prisma funcionando (verificar `/admin/dashboard`)
- [ ] Schema `PlatformSettings` adicionado e migrado
- [ ] `src/services/platform-settings.service.ts` criado
- [ ] API routes criadas e testadas
- [ ] UI admin page criada
- [ ] Testes E2E atualizados
- [ ] Audit logs persistindo em BD
- [ ] Soft close sendo disparado corretamente
- [ ] Feature flags visíveis em `/api/feature-flags` (GET)

---

## **PRÓXIMOS PASSOS APÓS INTEGRAÇÃO**

1. **WebSocket real-time:** Integrar Socket.io ou Firebase Realtime
2. **Service Worker:** Implementar offline-first PWA
3. **Integrations API:** POST com FIPE/cartório/tribunal queries
4. **Admin Dashboard:** UI para audit logs e metrics

**Você quer prosseguir com integração Prisma agora ou aguardar aprovação?**
