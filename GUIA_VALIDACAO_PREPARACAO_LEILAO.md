# Guia de Validação Manual - Página de Preparação do Leilão

## Pré-requisitos

1. Servidor Next.js rodando: `npm run dev`
2. Banco de dados populado com dados de teste: `npm run seed-extended`
3. Usuário admin logado

## Credenciais de Teste

```
Email: test.leiloeiro@bidexpert.com
Senha: Test@12345
Roles: LEILOEIRO, COMPRADOR, ADMIN
```

## Passo a Passo

### 1. Acesso à Página

1. Faça login com as credenciais acima
2. Navegue para `/admin/auctions`
3. Clique no primeiro leilão da lista
4. Na URL, adicione `/prepare` ao final (ex: `/admin/auctions/1/prepare`)
5. Pressione Enter

**Resultado Esperado**:
- Página carrega com título "Preparação do Leilão"
- Sidebar admin visível na lateral esquerda
- Header admin visível no topo
- Conteúdo ocupando toda a largura disponível (full-width)
- 9 abas visíveis no topo do conteúdo

### 2. Aba Dashboard

**O que testar**:
- [ ] 4 cards de estatísticas visíveis (Total de Lotes, Habilitados, Lances, Valor Total)
- [ ] Seção de "Alertas e Pendências" visível
- [ ] Seção de "Ações Rápidas" com 4 botões
- [ ] Seção de "Linha do Tempo" mostrando histórico

**Ações**:
1. Verifique os valores nos cards
2. Clique nos links "Ver detalhes →" nos cards
3. Teste os botões de "Ações Rápidas"

### 3. Aba Loteamento

**O que testar**:
- [ ] Campo de busca funcional
- [ ] Seletor de filtro por origem
- [ ] Mensagem de estado vazio se não houver bens
- [ ] Seção de instruções "Como Funciona"

**Ações**:
1. Clique na aba "Loteamento"
2. Digite algo no campo de busca
3. Mude o filtro de origem
4. Verifique a mensagem de orientação no final

### 4. Aba Lotes

**O que testar**:
- [ ] 3 cards de performance (Total, Ativos, Valor Total)
- [ ] Campo de busca
- [ ] Botão "Adicionar Lote" funcional
- [ ] Mensagem de estado vazio ou lista de lotes
- [ ] Card de "Indicadores de Performance"

**Ações**:
1. Clique na aba "Lotes"
2. Verifique os valores nos cards de performance
3. Digite algo no campo de busca
4. Clique em "Criar Primeiro Lote" (se vazio)

### 5. Aba Habilitações

**O que testar**:
- [ ] 4 cards de estatísticas (Total, Pendentes, Aprovados, Rejeitados)
- [ ] Campo de busca
- [ ] Seletor de filtro por status
- [ ] Botão "Exportar"
- [ ] Seção de "Ações Disponíveis" com orientações

**Ações**:
1. Clique na aba "Habilitações"
2. Verifique os números nos cards
3. Teste os filtros
4. Clique em "Exportar" (pode estar desabilitado)

### 6. Aba Pregão

**O que testar**:
- [ ] 3 cards: Lances em Tempo Real, Participantes Ativos, Valor Atual
- [ ] Seção "Meta de Faturamento" com barra de progresso
- [ ] Comparação Meta vs Realizado
- [ ] Seção "Alertas de Risco"
- [ ] Seção "Lotes Mais Ativos"
- [ ] Seção "Atividade de Lances"

**Ações**:
1. Clique na aba "Pregão"
2. Verifique a barra de progresso da meta
3. Observe os valores de Meta e Realizado

### 7. Aba Arremates

**O que testar**:
- [ ] 4 cards: Lotes Arrematados, Valor Total, Aguardando Pagamento, Finalizados
- [ ] Botão "Exportar Relatório"
- [ ] Seção "Status de Pagamentos" com 3 estados
- [ ] Seção "Ações Disponíveis" com 3 botões

**Ações**:
1. Clique na aba "Arremates"
2. Verifique os cards de estatísticas
3. Observe a seção de status de pagamentos (cores diferentes)

### 8. Aba Financeiro

**O que testar**:
- [ ] 4 cards: Receita Total, Custos, Comissões, Lucro Líquido
- [ ] Seção "Cobranças" com 3 estados (Pagos, Pendentes, Atrasados)
- [ ] Seção "Notas Fiscais"
- [ ] Botão "Gerar Notas Pendentes"
- [ ] Seção "Movimentações Financeiras"
- [ ] Seção "Detalhamento de Custos"

**Ações**:
1. Clique na aba "Financeiro"
2. Verifique cores dos cards (verde para receita, vermelho para custos)
3. Observe o detalhamento de custos no final

### 9. Aba Marketing

**O que testar**:
- [ ] 4 cards de métricas: Visualizações, Cliques, Taxa de Conversão, Investimento
- [ ] Seção "Promoção no Site" com switches
- [ ] Seção "Anúncios Digitais" (Google Ads)
- [ ] Seção "Redes Sociais" (Facebook, Instagram)
- [ ] Seção "Email Marketing"
- [ ] Switches funcionando (ligar/desligar)

**Ações**:
1. Clique na aba "Marketing"
2. Ative/desative os switches de cada seção
3. Observe que ao ativar Google Ads aparecem opções adicionais
4. O mesmo ocorre com Email Marketing

### 10. Aba Analytics

**O que testar**:
- [ ] Seletor de período (24h, 7d, 30d, Todo período)
- [ ] Botão "Exportar"
- [ ] 4 cards de métricas principais
- [ ] Seção "Origem do Tráfego" com barras de progresso
- [ ] Seção "Comportamento do Usuário"
- [ ] Seção "Dispositivos" e "Navegadores"
- [ ] Seção "Funil de Conversão" com 6 etapas

**Ações**:
1. Clique na aba "Analytics"
2. Mude o período no seletor
3. Observe as barras de progresso de origem do tráfego
4. Verifique o funil de conversão no final

### 11. Layout e Responsividade

**O que testar**:
- [ ] Sidebar permanece visível ao navegar entre abas
- [ ] Header permanece visível ao rolar a página
- [ ] Conteúdo é full-width (sem max-width restritivo)
- [ ] Abas ficam colapsadas em telas menores (só ícones)
- [ ] Scroll funciona corretamente

**Ações**:
1. Redimensione a janela do navegador
2. Verifique que em telas pequenas as abas mostram só ícones
3. Role a página para baixo e observe se header permanece
4. Teste em diferentes tamanhos de tela

### 12. Navegação Entre Abas

**O que testar**:
- [ ] Clicar em cada aba muda o conteúdo
- [ ] Aba ativa fica destacada visualmente
- [ ] Transição suave entre abas
- [ ] Estado da aba persiste ao navegar

**Ações**:
1. Clique em cada uma das 9 abas sequencialmente
2. Observe a mudança de conteúdo
3. Volte para a primeira aba (Dashboard)

## Checklist Final

- [ ] Todas as 9 abas foram testadas
- [ ] Layout está correto (sidebar + header + full-width)
- [ ] Não há erros no console do navegador
- [ ] Todos os cards exibem dados (mesmo que zeros)
- [ ] Switches e botões respondem ao clique
- [ ] Mensagens de estado vazio aparecem quando apropriado
- [ ] Navegação entre abas funciona perfeitamente
- [ ] Responsividade funciona corretamente

## Problemas Conhecidos

Nenhum problema conhecido no momento. Se encontrar algum, documente aqui:

1. [Descrição do problema]
   - Passos para reproduzir:
   - Comportamento esperado:
   - Comportamento atual:

## Notas

- Os dados exibidos são baseados no seed de teste
- Se os valores estiverem todos em zero, execute `npm run seed-extended`
- A funcionalidade de tempo real será implementada posteriormente
- Alguns botões podem estar desabilitados intencionalmente (aguardando implementação completa)
