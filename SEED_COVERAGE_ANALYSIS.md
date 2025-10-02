# Análise de Cobertura do Seed - BidExpert

## Resumo
- **Total de Tabelas Analisadas:** 45
- **Tabelas Populadas:** 1 (2%)
- **Tabelas Vazias:** 6 (13%)

## Tabelas Populadas

- **data_sources**: 2 registros

## Tabelas Vazias (Faltam no Seed)

- _InstallmentPaymentToLot
- reports
- _AuctionToCourt
- _AuctionToJudicialBranch
- _AuctionToJudicialDistrict
- _AuctionToLotCategory

## Recomendações

### Tabelas Críticas Faltantes:
- **_InstallmentPaymentToLot**: Necessário para testes completos
- **_AuctionToCourt**: Necessário para testes completos
- **_AuctionToJudicialBranch**: Necessário para testes completos
- **_AuctionToJudicialDistrict**: Necessário para testes completos
- **_AuctionToLotCategory**: Necessário para testes completos

### Próximos Passos:
1. Adicionar seed para tabelas vazias identificadas
2. Verificar relacionamentos many-to-many
3. Garantir dados suficientes para cenários de teste do TESTING_SCENARIOS.md
