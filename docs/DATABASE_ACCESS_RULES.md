# Regra de Acesso ao Banco de Dados

## Princípio
Todo acesso ao banco de dados DEVE ser feito através de services e actions, NUNCA diretamente através do prisma client.

## Motivação
1. Manter a consistência do código
2. Garantir que todas as regras de negócio sejam aplicadas
3. Facilitar testes e manutenção
4. Validar o codebase adequadamente

## Como Implementar

### ✅ CORRETO:
```typescript
// Usar services
const userResult = await services.user.createUser({...});
const tenant = await services.tenant.createTenant({...});
const settings = await services.platformSettings.getSettings(tenantId);
```

### ❌ INCORRETO:
```typescript
// NÃO usar prisma diretamente
await prisma.user.create({...});
await prisma.tenant.upsert({...});
await prisma.platformSettings.update({...});
```

## Services Disponíveis
- UserService
- TenantService
- PlatformSettingsService
- MentalTriggerSettingsService
- RoleService
- StateService
- CityService
- CourtService
- JudicialDistrictService
- JudicialBranchService
- SellerService
- AuctioneerService
- CategoryService
- SubcategoryService
- JudicialProcessService
- AssetService
- AuctionService
- AuctionStageService
- LotService
- AuctionHabilitationService
- BidService
- UserWinService
- InstallmentPaymentService
- DocumentTypeService
- UserDocumentService
- MediaItemService
- DirectSaleOfferService
- LotQuestionService
- ReviewService
- NotificationService
- UserLotMaxBidService
- VehicleMakeService
- VehicleModelService
- ContactMessageService
- DataSourceService
- DocumentTemplateService
- ReportService
- SubscriberService

## Implementação dos Services
Todo novo acesso ao banco deve ser implementado como um service na pasta `src/services/`

Exemplo de implementação de um service:
```typescript
export class ExampleService {
    async create(data: CreateExampleDto) {
        // Validações
        // Regras de negócio
        // Acesso ao banco via prisma
        return result;
    }

    async update(id: string, data: UpdateExampleDto) {
        // Validações
        // Regras de negócio
        // Acesso ao banco via prisma
        return result;
    }
    
    // ... outros métodos
}
```

## Verificação de Conformidade
1. Revisar PRs para garantir que não há uso direto do prisma
2. Usar linting para detectar imports diretos do prisma fora dos services
3. Testar toda a funcionalidade através dos services

## Observações
- Exceções a esta regra DEVEM ser documentadas e justificadas
- Migrations e seeds podem usar prisma diretamente apenas em casos específicos
- Em caso de dúvida, sempre criar um novo service