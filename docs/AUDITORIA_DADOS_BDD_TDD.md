# Auditoria de Dados - BDD e TDD

## BDD (Behavior Driven Development)

### Cenário: Leilão publicado sem responsáveis
- **DADO** um leilão com status publicado (EM_BREVE/ABERTO/ABERTO_PARA_LANCES/ENCERRADO/FINALIZADO)
- **E** sem comitente ou leiloeiro vinculados
- **QUANDO** o painel de auditoria é carregado
- **ENTÃO** o leilão deve aparecer em "Leilões sem Responsáveis Vinculados"

### Cenário: Leilão aberto sem agenda definida
- **DADO** um leilão aberto sem `auctionDate`/`endDate` e sem etapas com datas
- **QUANDO** o painel de auditoria é carregado
- **ENTÃO** o leilão deve aparecer em "Leilões sem Agenda Definida"

### Cenário: Lote vendido sem arrematante
- **DADO** um lote com status VENDIDO e `winnerId` ausente
- **QUANDO** o painel de auditoria é carregado
- **ENTÃO** o lote deve aparecer em "Lotes Vendidos sem Arrematante"

### Cenário: Ativo loteado sem vínculo
- **DADO** um ativo com status LOTEADO sem vínculo com lotes
- **QUANDO** o painel de auditoria é carregado
- **ENTÃO** o ativo deve aparecer em "Ativos Loteados sem Lote"

### Cenário: Venda direta sem imagem ou localização
- **DADO** uma venda direta sem imagem principal e sem localização
- **QUANDO** o painel de auditoria é carregado
- **ENTÃO** a venda direta deve aparecer em "Vendas Diretas sem Imagem" e "Vendas Diretas sem Localização"

## TDD (Test Driven Development)

### Casos de Teste Unitários
1. **buildAuditData** retorna leilões publicados sem responsáveis
2. **buildAuditData** retorna leilões abertos sem agenda
3. **buildAuditData** retorna lotes vendidos sem arrematante
4. **buildAuditData** retorna ativos sem mídia e sem localização
5. **buildAuditData** retorna vendas diretas sem mídia/localização/valor

### Casos de Teste UI/E2E
1. **Painel de auditoria** permite expandir accordions e visualizar mensagens
2. **Botão Atualizar Dados** permanece disponível e dispara recarregamento

### Regressão Visual
1. **Grid de indicadores** mantém layout e estilos esperados

## Observações
- Todos os testes devem ser executados via Vitest UI com provider Playwright conforme documentação de testes visuais.
- Elementos críticos devem manter `data-ai-id` estáveis para automação.
