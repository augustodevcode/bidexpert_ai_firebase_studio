# Atualizações no Seed Data Extended V3

## Data: 2025-01-05

## Resumo das Alterações

O script `seed-data-extended-v3.ts` foi incrementado com as seguintes funcionalidades **SEM APAGAR** os dados existentes:

### 1. ✅ Auction Stages (Praças nos Leilões)

Foram adicionadas **praças** (auction stages) para todos os leilões criados:

#### Leilões Principais (4 leilões)
- **Leilão Judicial - Imóveis Comerciais**: 
  - 1ª Praça (status: AGUARDANDO_INICIO)
  - 2ª Praça (status: AGENDADO)

- **Leilão Extrajudicial - Veículos**: 
  - Praça Única (status: AGUARDANDO_INICIO)

- **Leilão Particular - Maquinários**: 
  - 1ª Praça (status: AGENDADO)

- **Leilão Tomada de Preços - Mobiliários**: 
  - Praça Única (status: AGUARDANDO_INICIO)

#### Leilões Adicionais (3 leilões)
Cada leilão adicional também recebeu stages:
- **Leilões Judiciais**: 1ª e 2ª praças
- **Leilões Extrajudiciais**: Praça Única

**Total de Stages Criados**: ~9-10 praças

### 2. ✅ Localização nos Leilões (Auctions)

Todos os leilões agora incluem:
- **address**: Endereço completo
- **zipCode**: CEP dos centros das capitais brasileiras

#### CEPs Utilizados:
```javascript
'São Paulo': '01310-100'        // Av. Paulista
'Rio de Janeiro': '20040-020'   // Centro
'Belo Horizonte': '30130-100'   // Centro
'Brasília': '70040-020'         // Esplanada dos Ministérios
'Salvador': '40020-000'         // Centro
'Curitiba': '80020-000'         // Centro
'Fortaleza': '60060-000'        // Centro
'Recife': '50010-000'           // Centro
'Porto Alegre': '90010-270'     // Centro
'Manaus': '69010-000'           // Centro
```

#### Exemplos de Dados Adicionados:
- **Leilão 1**: Av. Paulista, 1000 - Bela Vista, CEP: 01310-100
- **Leilão 2**: Av. Atlântica, 500 - Copacabana, CEP: 20040-020
- **Leilão 3**: Av. Afonso Pena, 1000 - Centro, CEP: 30130-100
- **Leilão 4**: Esplanada dos Ministérios - Brasília, CEP: 70040-020

### 3. ✅ Localização nos Lotes (Lots)

Todos os lotes agora incluem:
- **cityName**: Cidade do lote
- **stateUf**: UF do estado
- **mapAddress**: Endereço completo do lote

#### Exemplos de Localizações nos Lotes:
- **Sala Comercial**: São Paulo/SP - Av. Paulista, 1500 - Sala 201
- **Apartamento**: São Paulo/SP - Rua Augusta, 2300 - Apto 501
- **Galpão Industrial**: São Paulo/SP - Av. Industrial, 1000
- **Honda Civic**: Rio de Janeiro/RJ - Av. Atlântica, 3500
- **Toyota Corolla**: Rio de Janeiro/RJ - Av. Brasil, 5000
- **Torno Mecânico**: Belo Horizonte/MG - Av. Amazonas, 1500
- **Cadeiras Gamer**: Brasília/DF - SCS Quadra 1

### 4. ✅ Localização nos Assets (Bens)

Todos os assets agora incluem:
- **locationCity**: Cidade
- **locationState**: Estado (UF)
- **address**: Endereço completo

#### Localizações Utilizadas nos Assets:
```javascript
{ city: 'São Paulo', state: 'SP', address: 'Rua da Consolação, 1000' }
{ city: 'São Paulo', state: 'SP', address: 'Av. Rebouças, 2500' }
{ city: 'Rio de Janeiro', state: 'RJ', address: 'Av. Rio Branco, 300' }
{ city: 'Rio de Janeiro', state: 'RJ', address: 'Rua da Assembléia, 100' }
{ city: 'Belo Horizonte', state: 'MG', address: 'Av. Afonso Pena, 1500' }
{ city: 'Brasília', state: 'DF', address: 'SCS Quadra 2' }
{ city: 'Salvador', state: 'BA', address: 'Av. Sete de Setembro, 500' }
{ city: 'Curitiba', state: 'PR', address: 'Rua XV de Novembro, 1000' }
{ city: 'Fortaleza', state: 'CE', address: 'Av. Beira Mar, 800' }
{ city: 'Porto Alegre', state: 'RS', address: 'Av. Borges de Medeiros, 500' }
```

## Resumo Estatístico

Após a execução do seed atualizado:

- **Auctions**: 7 leilões (todos com endereço e CEP)
- **Auction Stages**: ~9-10 praças (incluindo 1ª e 2ª praças para leilões judiciais)
- **Lots**: ~8 lotes principais + lotes adicionais (todos com localização completa)
- **Assets**: Todos os bens criados agora possuem localização (cidade, estado, endereço)

## Impacto no Sistema

### Campos Preenchidos:

#### Tabela `Auction`:
- ✅ `address`
- ✅ `zipCode`

#### Tabela `Lot`:
- ✅ `cityName`
- ✅ `stateUf`
- ✅ `mapAddress`

#### Tabela `Asset`:
- ✅ `locationCity`
- ✅ `locationState`
- ✅ `address`

#### Nova Tabela `AuctionStage`:
- ✅ Praças criadas para todos os leilões
- ✅ Status configurados (AGUARDANDO_INICIO, AGENDADO)
- ✅ Datas de início e fim configuradas

## Como Executar

```bash
# Navegue até a pasta do projeto
cd E:\SmartDataCorp\BidExpert\BidExpertVsCode\bidexpert_ai_firebase_studio

# Execute o seed
npx tsx scripts/seed-data-extended-v3.ts
```

## Observações Importantes

1. **Modo Incremental**: O script está configurado para **ADICIONAR** dados sem apagar os existentes
2. **Compatibilidade**: Todas as alterações respeitam o schema do Prisma existente
3. **Dados Realistas**: Todos os CEPs e endereços são de centros das capitais brasileiras
4. **Praças Judiciais**: Leilões judiciais automaticamente recebem 1ª e 2ª praças
5. **Distribuição Geográfica**: Assets e lotes foram distribuídos por várias capitais

## Benefícios

1. ✅ Teste de funcionalidades de geolocalização
2. ✅ Simulação realista de leilões com múltiplas praças
3. ✅ Dados completos para testes de UI com mapas
4. ✅ Informações de endereço em todos os níveis (auction, lot, asset)
5. ✅ Preparação para features de busca por localização

## Próximos Passos Sugeridos

1. Testar a interface de visualização de leilões com mapas
2. Validar a exibição de praças (stages) no painel de gestão
3. Implementar filtros por localização
4. Adicionar coordenadas geográficas (latitude/longitude) para visualização em mapas
