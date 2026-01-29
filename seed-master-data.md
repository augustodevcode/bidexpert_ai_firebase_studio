# Seed Master Data - Documentação Consolidada

## Visão Geral

Este documento consolida todas as informações de seed data encontradas no projeto BidExpert, criando um guia abrangente para geração de dados de teste em larga escala.

## Requisitos de Dados

Baseado na análise de múltiplos arquivos de documentação, o sistema requer os seguintes volumes de dados:

### Volumes Mínimos Necessários
- ✅ **2000+ ativos ativos** (configurado para gerar 3000)
- ✅ **1000+ lotes** (através de aumento de leilões e lotes por leilão)
- ✅ **500+ leilões** (configurado para gerar 750)
- ✅ **20+ categorias** (configurado para gerar 30+)
- ✅ **100+ arrematantes com pagamento** (sistema de rastreamento implementado)

### Configurações Atualizadas (final-summary.md)
```typescript
TOTAL_USERS: 150 → 300
TOTAL_SELLERS: 75 → 150
TOTAL_AUCTIONEERS: 25 → 50
TOTAL_ASSETS: 2500 → 3000
TOTAL_AUCTIONS: 600 → 750
MAX_LOTS_PER_AUCTION: 10 → 15
MAX_BIDS_PER_LOT: 50 → 100
```

## Estado Atual dos Dados (Verificado em `verify-seed-data.ts`)

### Contagem Atual de Registros: ~53 total

#### Infraestrutura Core (9 registros)
- 1 Tenant ✅
- 7 Roles ✅
- 1 PlatformSettings ✅

#### Mídia e Configurações (1 registro)
- 1 BidderProfile ✅

#### Categorias e Subcategorias (14 registros)
- 4 LotCategory ✅
- 10 Subcategory ✅

#### Localizações (Não verificado - banco remoto inacessível)
- Estados brasileiros
- Cidades

#### Participantes (8 registros)
- 8 Users ✅ (incluindo admin e usuários de teste)

#### Ativos e Leilões (26 registros)
- 11 Assets ✅
- 4 Auctions ✅
- 11 Lots ✅

#### Interações (1 registro)
- 1 DirectSaleOffer ✅

#### Tabelas Vazias (necessitam seed)
- Bid: 0 (necessita lances)
- JudicialProcess: 0 (necessita processos judiciais)
- PaymentMethod: 0 (necessita métodos de pagamento)
- ParticipationHistory: 0 (necessita histórico)
- UserWin/WonLot: 0 (necessita vencedores)
- ITSM_Ticket: 0 (sistema de tickets)
- Review/LotQuestion: 0 (avaliações e perguntas)
- AuditLog/Notification: 0 (logs e notificações)

## Atualizações V3 (SEED_V3_UPDATES.md)

### Dados de Localização Adicionados
- Endereços específicos para leilões em capitais brasileiras
- CEPs válidos para São Paulo, Belo Horizonte, Curitiba
- Localizações para ativos (galpões industriais, imóveis comerciais)

### Exemplos de Localizações
```typescript
// Leilões
- Leilão 1: Av. Paulista, 1000 - Bela Vista, CEP: 01310-100
- Leilão 2: Rua XV de Novembro, 500 - Centro, CEP: 80020-300
- Leilão 3: Av. Afonso Pena, 1000 - Centro, CEP: 30130-100

// Ativos
- Galpão Industrial: São Paulo/SP - Av. Industrial, 1000
- Imóvel Comercial: Curitiba/PR - Rua XV de Novembro, 1000
```

## Diretrizes de Implementação

### Uso Obrigatório de Services (scripts/README.md)

**IMPORTANTE**: NÃO usar comandos Prisma diretamente. SEMPRE usar serviços do codebase.

#### Estrutura Correta
```typescript
// ❌ NÃO FAÇA ISSO:
const user = await prisma.user.create({
    data: { ... }
});

// ✅ FAÇA ISSO:
import { UserService } from '../src/services/user.service';
const services = {
    user: new UserService(),
};
const user = await services.user.create({ ... });
```

#### Serviços Necessários
- UserService
- RoleService
- AuctionService
- AssetService
- LotService
- BidService
- PaymentService
- JudicialProcessService

### Gestão de Transações
- Usar TransactionManager para consistência
- Evitar transações aninhadas

### Logging e Validação
- Usar seedLogger para progresso
- Implementar SeedValidator quando necessário

## Problemas Identificados e Correções (ERROS_SEED_EXTENDED.md)

### Erros Comuns
1. **Imports de Services Quebrados**
   - Problema: Services não encontrados
   - Solução: Usar chamadas diretas do Prisma como fallback

2. **Transações Complexas**
   - Problema: Rollbacks em cascata
   - Solução: Simplificar transações ou usar abordagem sequencial

3. **Validações Excessivas**
   - Problema: Services rejeitam dados de teste
   - Solução: Criar dados que passam nas validações

### Correções Implementadas
```typescript
// Substituir imports problemáticos
// ❌ import { UserService } from '../src/services/user.service';
// ✅ const user = await prisma.user.create({ data: {...} });
```

## Estrutura do Dataset Expandido

### Infraestrutura Core
- 1 Tenant
- 6 Perfis (Roles)
- 1 Usuário Admin
- 5 Tipos de Documentos

### Mídia
- 5+ itens de mídia

### Categorias e Veículos
- 30+ categorias (expandido)
- 20+ marcas de veículos
- 100+ modelos de veículos

### Localizações
- 8+ estados brasileiros (expandido)
- 100+ cidades

### Infraestrutura Judicial
- 10+ tribunais
- 30+ comarcas
- 50+ varas

### Participantes
- 50 leiloeiros (expandido)
- 150 vendedores (expandido, 37 judiciais)
- 48 processos judiciais
- 300 usuários (expandido)

### Ativos e Leilões
- 3000 ativos (expandido)
- 750 leilões (expandido)
- 15 lotes por leilão (média)

### Interações
- 100 lances por lote (média)
- Sistema de pagamentos robusto

## Como Executar

### Seed canônico (RECOMENDADO)
```bash
npm run db:seed:ultimate
```

### Verificação
```bash
npm run seed:verify
# ou (ferramentas auxiliares)
npx tsx scripts/check-counts.ts
npx tsx scripts/check-seed-status.ts
```

## Estratégia de Implementação

### Fase 1: Infraestrutura Base
1. Criar tenant, roles, admin user
2. Configurar tipos de documento
3. Criar mídia base

### Fase 2: Categorias e Localizações
1. Gerar 30+ categorias com subcategorias
2. Criar dados geográficos (estados, cidades)
3. Configurar infraestrutura judicial

### Fase 3: Participantes
1. Criar 50 leiloeiros
2. Gerar 150 vendedores (37 judiciais)
3. Criar 300 usuários/arrematantes
4. Associar processos judiciais

### Fase 4: Ativos e Leilões
1. Gerar 3000 ativos diversos
2. Criar 750 leilões com localizações
3. Distribuir ativos em lotes (15 por leilão médio)

### Fase 5: Interações
1. Gerar lances (100 por lote médio)
2. Implementar sistema de pagamentos
3. Garantir 100+ arrematantes pagantes
4. Criar avaliações e notificações

## Próximos Passos para Implementação Completa

### Execução do Seed (canônico)
1. **Executar Seed (canônico)**
   ```bash
   npm run db:seed:ultimate
   ```

2. **Implementar Seed Master Completo**
   - Usar `scripts/ultimate-master-seed.ts` como fonte única canônica
   - Garantir 100+ arrematantes com pagamento

### Verificação Final
```bash
npx tsx scripts/verify-seed-data.ts
```

## Validações e Testes

### Verificações Automáticas
- Contagem de registros por tabela
- Integridade referencial
- Consistência de dados
- Status de pagamentos

### Testes de Carga
- Performance com 3000 ativos
- Consultas com 750 leilões
- Interações com 100+ lances por lote

## Manutenção e Updates

### Monitoramento Contínuo
- Logs de execução do seed
- Métricas de performance
- Validações de integridade

### Expansão Futura
- Aumento gradual dos volumes
- Adição de novos tipos de dados
- Otimização de performance

## Próximos Passos para Implementação Completa

### Expansão para Requisitos Mínimos
Para atingir os requisitos de **2000+ ativos, 1000+ lotes, 500+ leilões**:

1. **Executar Seed Expandido**
   ```bash
   npx tsx scripts/seed-data-extended.ts
   ```

2. **Implementar Seed Master Completo**
   - Usar `seed-master-data.ts` como base
   - Implementar geração massiva de dados usando services
   - Garantir 100+ arrematantes com pagamento

3. **Verificação Final**
   ```bash
   npx tsx scripts/verify-seed-data.ts
   ```

### Limitações Identificadas
- **Banco remoto inacessível**: Algumas tabelas não puderam ser verificadas
- **Constraints de FK**: Scripts de limpeza precisam respeitar dependências
- **Services vs Prisma direto**: Preferir services para validação de dados

## Conclusão

✅ **Documentação Consolidada**: Criado `seed-master-data.md` com todas as informações reunidas
✅ **Estado Atual Verificado**: 53 registros confirmados no banco local
✅ **Scripts Preparados**: `seed-master-data.ts` e `verify-seed-data.ts` criados
✅ **Estratégia Definida**: Uso obrigatório de services, limpeza segura, validação de dados

O sistema está pronto para expansão controlada dos dados de seed, mantendo consistência e integridade referencial.</content>
<parameter name="filePath">e:\SmartDataCorp\BidExpert\BidExpertVsCode\bidexpert_ai_firebase_studio\seed-master-data.md
## Atualiza��o (2025) - Ultimate Master Seed Reconstru�do

O arquivo scripts/ultimate-master-seed.ts foi reconstru�do combinando:
- scripts/seed-data-extended-v3.ts (L�gica Base Completa)
- scripts/seed-populate-missing.ts (Dados Complementares)

Ele agora restaura o banco e popula toda a massa de dados necess�ria para Demo e HML.
