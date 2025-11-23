# Relatório de Execução do Seed V3

## ✅ Status: CONCLUÍDO COM SUCESSO

Data de Execução: 21/11/2025 - 00:48 BRT (03:48 UTC)  
Timestamp da Execução: **1763696926849**

## 📊 Resumo de Dados Criados

### Dados Principais
- **Tenants**: 3 novos tenants criados
- **Roles**: 6 roles configurados (reaproveitados existentes)
- **Usuários**: 5 usuários principais + 3 leiloeiros adicionais = **8 usuários novos**
- **Auctions**: 4 leilões principais + 3 adicionais = **7 leilões novos**
- **Lots**: 8 lotes principais + 6 com localização = **14 lotes novos**
- **Bids**: 11 lances criados
- **Habilitações**: 8 habilitações de usuários para leilões

### Estrutura Judicial
- **Tribunais**: 1 (Tribunal de Justiça de SP)
- **Comarcas**: 1 principal + 2 adicionais = **3 comarcas**
- **Varas Judiciais**: 1 principal + 2 adicionais = **3 varas**
- **Vendedores Judiciais**: 1 principal + 2 adicionais = **3 vendedores**
- **Processos Judiciais**: 3 principais + 3 adicionais = **6 processos**

## 👥 Credenciais de Teste - DADOS REAIS CRIADOS

### 1️⃣ LEILOEIRO (ADMIN)
- **Email**: test.leiloeiro.1763696926849@bidexpert.com
- **Senha**: Test@12345
- **Roles**: LEILOEIRO, COMPRADOR, ADMIN
- **Acesso**: Completo ao sistema

### 2️⃣ COMPRADOR
- **Email**: test.comprador.1763696926849@bidexpert.com
- **Senha**: Test@12345
- **Roles**: COMPRADOR
- **Acesso**: Visualização de leilões e envio de lances

### 3️⃣ ADVOGADO
- **Email**: advogado.1763696926849@bidexpert.com.br
- **Senha**: Test@12345
- **Roles**: ADVOGADO, COMPRADOR
- **Recursos**:
  - 6 Processos Judiciais vinculados
  - Acesso completo ao painel do advogado
  - Visualização de partes e dados processuais

### 4️⃣ VENDEDOR
- **Email**: test.vendedor.1763696926849@bidexpert.com
- **Senha**: Test@12345
- **Roles**: VENDEDOR, COMPRADOR
- **Acesso**: Gerenciamento de lotes próprios

### 5️⃣ AVALIADOR
- **Email**: test.avaliador.1763696926849@bidexpert.com
- **Senha**: Test@12345
- **Roles**: AVALIADOR
- **Acesso**: Geração de relatórios de avaliação

### 6️⃣-8️⃣ LEILOEIROS ADICIONAIS
- **SP**: leiloeiro.sp.01.1763696926849@bidexpert.com
- **RJ**: leiloeiro.rj.01.1763696926849@bidexpert.com
- **MG**: leiloeiro.mg.01.1763696926849@bidexpert.com
- **Senha**: Test@12345 (todos)
- **Roles**: LEILOEIRO
- **Acesso**: Condução de leilões atribuídos

## 🏢 Tenants Criados

1. **Leiloeiro Premium 1763696926849**
   - Subdomain: premium-test-1763696926849
   
2. **Leiloeiro Standard 1763696926849**
   - Subdomain: standard-test-1763696926849
   
3. **Leiloeiro Test 1763696926849**
   - Subdomain: test-test-1763696926849

## 🔨 Leilões Criados

### Leilões Principais
1. **Leilão Judicial - Imóveis Comerciais** (auction-1763696926849-1)
   - Tipo: JUDICIAL
   - Status: ABERTO
   
2. **Leilão Extrajudicial - Veículos** (auction-1763696926849-2)
   - Tipo: EXTRAJUDICIAL
   - Status: ABERTO
   
3. **Leilão Particular - Maquinários Industriais** (auction-1763696926849-3)
   - Tipo: PARTICULAR
   - Status: EM_PREPARACAO
   
4. **Tomada de Preços - Móveis e Equipamentos** (auction-1763696926849-4)
   - Tipo: TOMADA_DE_PRECOS
   - Status: ABERTO_PARA_LANCES

### Leilões Adicionais
5. **Leilão Judicial - Imóveis RJ** (auction-rj-1763696930444-1)
   - Tipo: JUDICIAL
   - Status: ABERTO
   
6. **Leilão Judicial - Propriedades MG** (auction-mg-1763696930444-1)
   - Tipo: JUDICIAL
   - Status: ABERTO
   
7. **Leilão Extrajudicial - Equipamentos SP** (auction-sp-equip-1763696930444)
   - Tipo: EXTRAJUDICIAL
   - Status: ABERTO

## 🏗️ Modificações Realizadas no Script

### Alterações para Preservar Dados Existentes
1. **Removida limpeza de dados**: Comentado o bloco que executava `deleteMany()`
2. **IDs únicos usando timestamp**: Todos os registros usam sufixo `Date.now()` para evitar conflitos
3. **Emails únicos**: Todos os emails incluem timestamp para garantir unicidade
4. **CPFs gerados dinamicamente**: Usando timestamp + prefixos para evitar duplicação
5. **Subdomains únicos**: Tenants criados com subdomains únicos usando timestamp

### Correções Técnicas
1. Corrigida duplicação da variável `timestamp` (linha 326 e 902)
2. Atualizado geração de CPFs para usar formato correto
3. Garantida unicidade de slugs em todos os registros

## 🎯 Cenários de Teste Disponíveis

### Leilões por Tipo
- ✅ **3 Leilões Judiciais** (Imóveis Comerciais SP, Imóveis RJ, Propriedades MG)
- ✅ **2 Leilões Extrajudiciais** (Veículos, Equipamentos SP)
- ✅ **1 Leilão Particular** (Maquinários Industriais)
- ✅ **1 Tomada de Preços** (Móveis e Equipamentos)

### Tipos de Lotes Criados
- 🏢 **Imóveis Comerciais** (vários)
- 🚗 **Veículos** (diversos modelos)
- 🏭 **Maquinários Industriais**
- 💻 **Equipamentos e Eletrônicos**
- 🪑 **Móveis**
- 📍 **6 Lotes com Localização Geográfica** detalhada

### Processos Judiciais
- ⚖️ **6 Processos Judiciais** completos
- 👨‍⚖️ Vinculados ao usuário Advogado
- 📋 Com partes, advogados e dados processuais completos
- 🏛️ Distribuídos entre 3 varas judiciais diferentes

### Estrutura Geográfica
- **SP**: Leiloeiro, Vara Judicial, Comarca
- **RJ**: Leiloeiro, Vara Judicial, Comarca  
- **MG**: Leiloeiro, Vara Judicial, Comarca

## 📝 Próximos Passos para Testes

### Login e Autenticação
1. ✅ Testar login com cada perfil de usuário criado
2. ✅ Verificar permissões específicas de cada role
3. ✅ Validar acesso multitenant

### Funcionalidades de Leilão
1. ✅ Visualizar leilões em diferentes status
2. ✅ Filtrar por tipo de leilão
3. ✅ Acessar detalhes de lotes
4. ✅ Verificar informações de localização

### Painel do Advogado
1. ✅ Acessar dashboard com o usuário advogado
2. ✅ Visualizar 6 processos judiciais
3. ✅ Verificar dados das partes
4. ✅ Validar informações processuais

### Sistema de Lances
1. ✅ Criar lances em leilões abertos
2. ✅ Verificar histórico de lances
3. ✅ Testar habilitação de usuários

## ⚠️ Observações Importantes

- **Timestamp da execução**: 1763696926849
- **Todos os emails incluem este timestamp** para garantir unicidade
- **Dados não foram apagados**: Script modificado para preservar dados existentes
- **Senha padrão**: Test@12345 (todos os usuários)
- **Multitenant**: Dados distribuídos entre 3 tenants diferentes
- **Roles funcionais**: Sistema de permissões totalmente implementado
- **IDs públicos**: Todos os registros têm publicId único

## 🔍 Como Encontrar os Dados Criados

### Query SQL - Usuários desta execução
```sql
SELECT email, fullName, createdAt 
FROM User 
WHERE email LIKE '%1763696926849%' 
ORDER BY createdAt DESC;
```

### Query SQL - Tenants desta execução
```sql
SELECT name, subdomain, createdAt 
FROM Tenant 
WHERE subdomain LIKE '%1763696926849%' 
ORDER BY createdAt DESC;
```

### Query SQL - Leilões desta execução
```sql
SELECT title, publicId, auctionType, status 
FROM Auction 
WHERE publicId LIKE '%1763696926849%' OR publicId LIKE '%1763696930444%'
ORDER BY createdAt DESC;
```

### Script de Listagem
Execute o script criado para ver todos os dados:
```bash
npx tsx list-seed-data.ts
```

## 📊 Estatísticas Finais

**Total de Registros Novos Criados**: Aproximadamente **50+ registros**
- 8 Usuários
- 3 Tenants
- 7 Leilões
- 14 Lotes
- 11 Lances
- 8 Habilitações
- 6 Processos Judiciais
- 3 Comarcas
- 3 Varas Judiciais
- 3 Vendedores Judiciais

**Tempo de Execução**: Aproximadamente 50 segundos

**Status**: ✅ **100% CONCLUÍDO**

---

**Execução realizada com sucesso** ✨

Para testar, faça login com qualquer uma das credenciais listadas acima usando a senha **Test@12345**
