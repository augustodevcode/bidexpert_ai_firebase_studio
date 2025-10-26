# Script de Seed Estendido para BidExpert

## Visão Geral

Este script foi atualizado para gerar um dataset significativamente maior e mais completo para testes e desenvolvimento da plataforma BidExpert.

## Requisitos Atendidos

- ✅ 2000+ ativos ativos
- ✅ 1000+ lotes
- ✅ 500+ leilões
- ✅ 20+ categorias
- ✅ 100+ arrematantes que fizeram pagamento
- ✅ Dados distribuídos em praticamente todas as tabelas da plataforma

## Como Usar

### Executar o Script de Seed

```bash
npx tsx scripts/seed-data-extended.ts
```

Este comando irá:
1. Limpar todos os dados existentes
2. Criar a infraestrutura core (tenant, usuários, perfis, etc.)
3. Popular todas as tabelas com dados consistentes e interligados
4. Gerar interações (lances, arremates, pagamentos)

### Verificar os Resultados

Para verificar se os requisitos foram atendidos:

```bash
npx tsx scripts/verify-requirements.ts
```

Para ver um resumo completo dos dados gerados:

```bash
npx tsx scripts/check-counts.ts
```

## Estrutura de Dados Gerada

O script gera dados para todas as entidades principais da plataforma:

- **Usuários**: Admin, arrematantes, leiloeiros, vendedores
- **Localizações**: Estados e cidades brasileiras
- **Infraestrutura judicial**: Tribunais, comarcas, varas
- **Categorias e subcategorias**: Mais de 20 categorias com subcategorias
- **Veículos**: Marcas e modelos diversos
- **Ativos**: 3000+ itens variados
- **Leilões**: 750+ leilões judiciais e extrajudiciais
- **Lotes**: Agrupamentos de ativos para leilão
- **Interações**: Lances, arremates, pagamentos, perguntas, avaliações

## Configurações

As constantes de geração podem ser ajustadas no início do script `seed-data-extended.ts`:

```typescript
const TOTAL_USERS = 300;        // Usuários arrematantes
const TOTAL_SELLERS = 150;      // Vendedores
const TOTAL_AUCTIONEERS = 50;   // Leiloeiros
const TOTAL_ASSETS = 3000;      // Ativos
const TOTAL_AUCTIONS = 750;     // Leilões
const MAX_LOTS_PER_AUCTION = 15; // Máximo de lotes por leilão
const MAX_BIDS_PER_LOT = 100;   // Máximo de lances por lote
```

## Tempo de Execução

Devido ao tamanho do dataset, o script pode levar vários minutos para completar. A geração de 3000+ ativos e 750+ leilões com interações é uma operação pesada.

## Solução de Problemas

Se encontrar erros durante a execução:

1. Verifique se o banco de dados está acessível
2. Certifique-se de que todas as migrations foram aplicadas
3. Verifique as permissões do usuário do banco de dados

## Manutenção

Sempre que o schema do Prisma for atualizado, execute:

```bash
npx prisma generate
```

Antes de executar o script de seed.