# Relatório de Auditoria — Wizard de Criação de Leilões (BidExpert)
**Data:** 20 de Março de 2026 — 01:11 BRT  
**Auditor:** Perplexity Computer (agente externo)  
**Branch auditada:** `main` (Produção Vercel)  
**URL auditada:** https://bidexpertaifirebasestudio-git-main-augustos-projects-d51a961f.vercel.app/admin/wizard  
**Dados de referência:** [Superbid](https://www.superbid.net/leiloes) — Leilão Municipal Luiz Alves/SC + 5º Leilão Força Máxima  

---

## 1. Resumo Executivo

Foram testadas as **4 modalidades** do Wizard de criação de leilões:
1. **Leilão Judicial** — Fluxo de 5 steps (inclui step de processo judicial)
2. **Leilão Extrajudicial** — Fluxo de 4 steps
3. **Leilão Particular** — Fluxo de 4 steps
4. **Tomada de Preços** — Fluxo de 4 steps

**Resultado: ❌ NENHUMA MODALIDADE COMPLETA O FLUXO DE PUBLICAÇÃO COM SUCESSO**

O bug crítico é um único: `tenantId` ausente em `prisma.auctionStage.createMany()` dentro de `AuctionService.createAuction()`. Todas as modalidades que adicionam praças falham com esse erro. Além disso, foram identificados 2 outros bugs críticos e 13 gaps de negócio.

**Causa raiz confirmada via código-fonte** (`src/services/auction.service.ts` linha ~createMany):
```typescript
// ❌ CÓDIGO ATUAL — tenantId AUSENTE no mapeamento de praças
await tx.auctionStage.createMany({
  data: normalizedStages.map((stage: any) => ({
    name: stage.name,
    startDate: new Date(stage.startDate),
    endDate: stage.endDate ? new Date(stage.endDate) : null,
    discountPercent: stage.discountPercent ?? 100,
    auctionId: createdAuction.id,
    // ← tenantId: BigInt(tenantId) FALTANDO AQUI
  })),
});
```

```typescript
// ✅ CORREÇÃO — adicionar tenantId
await tx.auctionStage.createMany({
  data: normalizedStages.map((stage: any) => ({
    name: stage.name,
    startDate: new Date(stage.startDate),
    endDate: stage.endDate ? new Date(stage.endDate) : null,
    discountPercent: stage.discountPercent ?? 100,
    auctionId: createdAuction.id,
    tenantId: BigInt(tenantId), // ← ADICIONAR ESTA LINHA
  })),
});
```
O método privado `mapAuctionStagesForPersistence` já recebe e inclui `tenantId` corretamente, mas `createAuction` usa um mapeamento inline que ignora esse helper — inconsistência entre o helper e a implementação real.

---

## 2. Estrutura do Wizard (Mapeamento Completo)

### Step 1 — Tipo de Leilão (todas as modalidades)
| Opção | Ícone | Descrição |
|-------|-------|-----------|
| Leilão Judicial | Scale (balança) | Bens de processos judiciais |
| Leilão Extrajudicial | Building (prédio) | Venda de ativos de empresas e bancos |
| Leilão Particular | Users (pessoas) | Venda de bens de pessoas físicas ou jurídicas |
| Tomada de Preços | FileText (documento) | Processos de compra governamentais |

### Steps por modalidade
| Modalidade | Steps | Step Processo Judicial |
|-----------|-------|----------------------|
| JUDICIAL | 5 (Tipo → Processo → Detalhes → Loteamento → Revisão) | ✅ SIM |
| EXTRAJUDICIAL | 4 (Tipo → Detalhes → Loteamento → Revisão) | ❌ NÃO |
| PARTICULAR | 4 (Tipo → Detalhes → Loteamento → Revisão) | ❌ NÃO |
| TOMADA_DE_PRECOS | 4 (Tipo → Detalhes → Loteamento → Revisão) | ❌ NÃO |

### Step de Detalhes (campos completos — todos os campos disponíveis)
| Campo | Obrigatório | Tipo | Observação |
|-------|-------------|------|------------|
| Título do Leilão | ✅ | text | — |
| Descrição | ❌ | textarea | Opcional |
| Status | ✅ | select | RASCUNHO, EM_PREPARACAO, EM_BREVE, ABERTO, ABERTO_PARA_LANCES, ENCERRADO, FINALIZADO, CANCELADO, SUSPENSO |
| Categoria Principal | ✅ | combobox | Imóveis, Informática, Maquinário, Mobiliário, Veículos |
| Leiloeiro | ✅ | combobox | ~32 registros de seed (nomes genéricos) |
| Comitente/Vendedor | ✅ | combobox | ~32 registros de seed (nomes genéricos) |
| Processo Judicial | ❌ | combobox | Opcional; hint "Para bens de origem judicial" |
| Modalidade | ✅ | select | Pré-preenchido com a modalidade escolhida no Step 1 |
| Participação | ✅ | select | ONLINE, PRESENCIAL, HIBRIDO |
| Método | ✅ | select | STANDARD, DUTCH, SILENT |
| URL do Leilão Online | ❌ | text | — |
| CEP | ❌ | text + botão | Busca automática de endereço |
| Logradouro, Número, Complemento, Bairro | ❌ | text | — |
| Estado | ❌ | combobox | Todos 27 estados |
| Cidade | ❌ | combobox | Dependente do estado; **BUG: SC não carrega** |
| Latitude / Longitude | ❌ | number | Auto-preenchido por mapa |
| Link Google Maps | ❌ | text readonly | Auto-gerado |
| Mapa interativo | ❌ | Leaflet | Permite selecionar localização |
| Praças (seção) | ❌ | array | Cada praça: Nome, Preço Inicial, % Desconto, Data/Hora Início*, Data/Hora Fim* |
| Imagem Principal | ❌ | selector | Biblioteca de mídia |
| Destaque no Marketplace | ❌ | toggle | Default OFF |
| Permitir Lances Parcelados | ❌ | toggle | Default OFF |

### Step Loteamento (Step 4 para JUDICIAL, Step 3 para demais)
| Elemento | Descrição |
|---------|-----------|
| Tabela de ativos | Colunas: Imagem, Título do Bem, Status, Categoria, Processo, Valor (R$), Lote vinculado |
| Botões de ação | "Lotear Individualmente", "Agrupar em Lote Único", "Cadastrar Novo Ativo" |
| Estado vazio | "Nenhum resultado encontrado" quando sem ativos |
| Ativos disponíveis (seed) | **1 ativo** apenas para JUDICIAL; **0 ativos** para as demais modalidades |

### Step Revisão e Publicação (último step)
- Card "Detalhes do Leilão" com resumo dos dados preenchidos
- Card "Processo Judicial Vinculado" (apenas JUDICIAL)
- Card "Lotes Criados (N)" com lista dos lotes
- Botão "Publicar Leilão" (laranja)

---

## 3. Resultados por Modalidade

### Modalidade 1 — Leilão JUDICIAL

| Step | Status | Observações |
|------|--------|-------------|
| Step 1 — Tipo | ✅ OK | Seleção funcionou |
| Step 2 — Processo Judicial | ⚠️ PARCIAL | Lista carrega 4 processos de seed (nomes como "0098765-03.2024.8.26.0100-..."); dados não representam processos reais |
| Step 3 — Detalhes | ⚠️ COM BUGS | Cidades carregam; campos de data com bug de input |
| Step 4 — Loteamento | ✅ PARCIAL | 1 ativo disponível (Empilhadeira seed); lote criado com sucesso no contexto do wizard |
| Step 5 — Revisão/Publicar | ❌ FALHA SILENCIOSA | auctionId `50n` gerado no backend (leilão criado), mas sem praças; botão retorna à mesma tela sem mensagem de sucesso |

**Resultado:** Leilão criado no banco (`id=50`) **sem praças** — o erro de tenantId faz com que a criação de praças falhe, mas o leilão principal é persistido. Usuário não recebe feedback algum.

**Processos Judiciais disponíveis no seed:**
```
0098765-03.2024.8.26.0100-1772936948382
0098765-03.2024.8.26.0100-1772936260153
0098765-03.2024.8.26.0100-1772935965872
0098765-03.2024.8.26.0100-1772927107840
```

---

### Modalidade 2 — Leilão EXTRAJUDICIAL

| Step | Status | Observações |
|------|--------|-------------|
| Step 1 — Tipo | ✅ OK | — |
| Step 2 — Detalhes | ⚠️ COM BUGS | Sem step de processo judicial (correto); bug de data |
| Step 3 — Loteamento | ❌ VAZIO | 0 ativos disponíveis |
| Step 4 — Revisão/Publicar | ❌ ERRO CRÍTICO | `Argument 'tenantId' is missing` em `prisma.auctionStage.createMany()`. auctionId `50n` e `51n` gerados, indicando que o leilão é criado mas as praças falham |

**Mensagem de erro exata:**
```
Erro ao Publicar — Falha ao criar o leilão: Falha de validação ao criar leilão: 
Invalid `prisma.auctionStage.createMany()` invocation: {
  data: [{ name: "1ª Praça", startDate: new Date("2026-03-20T04:26:58.859Z"),
           endDate: new Date("2026-03-27T04:26:58.859Z"), discountPercent: 100, auctionId: 50n }]
}
Argument `tenantId` is missing.
```

---

### Modalidade 3 — Leilão PARTICULAR

| Step | Status | Observações |
|------|--------|-------------|
| Step 1 — Tipo | ✅ OK | — |
| Step 2 — Detalhes | ⚠️ COM BUGS | Mesmo formulário das demais; sem diferenciação para particular |
| Step 3 — Loteamento | ❌ VAZIO | 0 ativos disponíveis |
| Step 4 — Revisão/Publicar | ❌ ERRO CRÍTICO | Mesmo erro: `Argument 'tenantId' is missing`. auctionId `51n` |

---

### Modalidade 4 — TOMADA DE PREÇOS

| Step | Status | Observações |
|------|--------|-------------|
| Step 1 — Tipo | ✅ OK | Descrição: "Processos de compra governamentais" |
| Step 2 — Detalhes | ⚠️ COM BUGS | Campo "Modalidade" pré-preenchido como TOMADA_DE_PRECOS; sem step de processo judicial |
| Step 3 — Loteamento | ❌ INADEQUADO | 0 ativos; step de "bens físicos" é conceitualmente errado para Tomada de Preços |
| Step 4 — Revisão/Publicar | ❌ ERRO CRÍTICO | `Argument 'tenantId' is missing`. auctionId `53n`. **Bug extra: datas registradas como ano 0002 d.C.** |

**Mensagem de erro exata:**
```
Erro ao Publicar — Falha ao criar o leilão: Falha de validação ao criar leilão:
Invalid `prisma.auctionStage.createMany()` invocation: {
  data: [{ name: "1ª Praça", 
           startDate: new Date("0002-03-30T23:22:58.000Z"),  ← ANO 0002!
           endDate: new Date("0002-05-01T05:30:58.000Z"),    ← ANO 0002!
           discountPercent: 100, auctionId: 53n }]
}
Argument `tenantId` is missing.
```

---

## 4. Bugs Encontrados

### 🔴 BUG CRÍTICO #1 — `tenantId` ausente em `auctionStage.createMany()`
**Arquivo:** `src/services/auction.service.ts` — método `createAuction()`  
**Afeta:** 100% das modalidades ao tentar publicar com praças  
**Comportamento:** Toast de erro "Falha de validação ao criar leilão: Argument `tenantId` is missing"  
**Impacto:** Nenhum leilão pode ser publicado via Wizard se tiver praças configuradas  

**Correção:**
```typescript
// Dentro de createAuction(), no bloco tx.auctionStage.createMany():
data: normalizedStages.map((stage: any) => ({
  name: stage.name,
  startDate: new Date(stage.startDate as Date),
  endDate: stage.endDate ? new Date(stage.endDate as Date) : null,
  discountPercent: stage.discountPercent ?? 100,
  auctionId: createdAuction.id,
  tenantId: BigInt(tenantId), // ← LINHA FALTANTE
})),
```

**Nota:** O método privado `mapAuctionStagesForPersistence` já tem a implementação correta com `tenantId: BigInt(tenantId)`, mas o `createAuction` usa um mapeamento inline diferente que ignora esse helper.

---

### 🔴 BUG CRÍTICO #2 — Campo de Data/Hora registra ano como `0002`
**Localização:** Step de Detalhes — seção Praças — campos Data/Hora de Início e Fim  
**Afeta:** Todas as modalidades; confirmado em Tomada de Preços  
**Comportamento:** Ao digitar a data no campo `datetime-local`, o parser interpreta a entrada de forma incorreta e registra o ano como `0002` em vez de `2026`. Isso resulta em datas como `new Date("0002-03-30T23:22:58.000Z")`.  
**Impacto:** Datas inválidas para leilões; leilões com praças no passado remoto  
**Causa:** Provável bug no componente `<input type="datetime-local">` ou no tratamento do valor antes de enviar ao backend — o campo aceita a entrada visualmente mas serializa incorretamente.

---

### 🔴 BUG CRÍTICO #3 — Leilão Judicial criado sem praças (falha silenciosa)
**Localização:** Step 5 (Revisão/Publicar) — Modalidade JUDICIAL  
**Comportamento:** O botão "Publicar Leilão" mostra "Publicando..." e retorna à mesma tela sem mensagem de sucesso ou erro. O backend criou o leilão (ID `50n`) mas sem praças (erro de tenantId silenciado). Usuário fica sem saber se o leilão foi criado.  
**Violação de RN:** RN-003 — "Toast de feedback após submissão (nunca falhar silenciosamente)"  
**Impacto:** Leilão órfão criado sem praças, sem notificação ao usuário.

---

### 🟠 BUG ALTO #4 — Cidades de estados específicos não carregam
**Localização:** Step Detalhes — campo Cidade  
**Confirmado para:** SC (Santa Catarina)  
**Comportamento:** Ao selecionar Estado = SC, o dropdown de Cidade retorna "Nenhum resultado encontrado". O banco de dados de cidades não está populado para todos os estados.  
**Impacto:** Impossível cadastrar leilões com endereço em vários estados brasileiros.

---

### 🟠 BUG ALTO #5 — CEP de cidades menores não encontrado
**Localização:** Step Detalhes — campo CEP + botão "Buscar CEP"  
**Teste:** CEP 89265-000 (Luiz Alves/SC) retornou "CEP não encontrado"  
**Impacto:** Preenchimento automático de endereço não funciona para municípios pequenos.

---

### 🟡 BUG MÉDIO #6 — Nomes de leiloeiros e comitentes são apenas dados de seed
**Localização:** Step Detalhes — dropdowns Leiloeiro e Comitente  
**Comportamento:** Os únicos leiloeiros disponíveis são: "LEILOEIRO MG 01", "LEILOEIRO RJ 01", "LEILOEIRO SP 01" (genéricos de seed). Não há leiloeiros reais cadastrados.  
**Impacto:** Para uso em produção, necessário cadastrar leiloeiros reais antes de usar o wizard.

---

### 🟡 BUG MÉDIO #7 — Categoria "Serviço" não existe
**Localização:** Step Detalhes — campo Categoria Principal e Step Loteamento  
**Comportamento:** Categorias disponíveis: Imóveis, Informática, Maquinário, Mobiliário, Veículos. Não existe "Serviço" ou "Obra", impedindo categorizações corretas para Tomada de Preços.

---

### 🟡 BUG MÉDIO #8 — Admin-Plus com erros em múltiplos módulos
**Logs Vercel confirmados:**
```
POST /admin-plus/courts       → [AdminAction] Erro inesperado
POST /admin-plus/roles        → [AdminAction] Erro inesperado
POST /admin-plus/document-types → [AdminAction] Erro inesperado
POST /admin-plus/data-sources → [AdminAction] Erro inesperado
```
**Impacto:** Módulos de configuração avançada (tribunais, perfis, tipos de documento, fontes de dados) com falhas.

---

## 5. Gaps de Negócio

### GAP #1 — Tomada de Preços sem campos específicos de licitação
**Impacto:** ALTO  
**Descrição:** A modalidade "Tomada de Preços" é um processo licitatório regido pela Lei 14.133/2021 (Nova Lei de Licitações). O Wizard usa o mesmo formulário de leilão, sem nenhum campo específico como:
- Número do edital / processo licitatório
- Objeto da contratação (descrição do que será comprado/contratado)
- Valor estimado
- Modalidade licitatória (Pregão Eletrônico, Concorrência, Tomada de Preços)
- Prazo de entrega / execução
- Documentos de habilitação exigidos
- Critério de julgamento (menor preço, técnica e preço, etc.)

**Recomendação:** Criar step adicional específico para Tomada de Preços com campos de licitação.

---

### GAP #2 — Step de Loteamento inadequado para Tomada de Preços
**Impacto:** ALTO  
**Descrição:** O Step de Loteamento foi projetado para agrupar "bens físicos" (assets) em lotes. Para Tomada de Preços, o conceito é inverso: o órgão público está **comprando** serviços/obras, não vendendo bens. O step deveria ser "Itens do Edital" com campos como: descrição do item, unidade de medida, quantidade, valor unitário estimado.

---

### GAP #3 — 0 ativos disponíveis para Extrajudicial/Particular/Tomada de Preços
**Impacto:** MÉDIO  
**Descrição:** O banco seed tem 1 ativo apenas vinculado a processos judiciais. Modalidades não-judiciais têm 0 ativos disponíveis, tornando impossível testar o fluxo completo de loteamento para essas modalidades. O step mostra "Nenhum resultado encontrado" — usuário sem contexto não sabe que precisa cadastrar ativos antes.

**Recomendação:** Adicionar ao seed ativos para modalidades extrajudicial/particular, e exibir mensagem orientativa no estado vazio: "Você precisa cadastrar ativos em Gestão > Ativos antes de criar lotes."

---

### GAP #4 — Dados de leiloeiros e comitentes genéricos
**Impacto:** ALTO (produção)  
**Descrição:** Todos os leiloeiros disponíveis são genéricos ("LEILOEIRO MG 01") sem vínculo com leiloeiros reais. O wizard exige que leiloeiros sejam pré-cadastrados, mas não oferece fluxo de cadastro inline nem link para o módulo de cadastro de leiloeiros.

---

### GAP #5 — Processo Judicial obrigatório vs opcional
**Impacto:** MÉDIO  
**Descrição:** Para a modalidade JUDICIAL, o sistema exige associação a um processo, mas o campo aparece como "Opcional" no Step 3 de Detalhes. Há inconsistência: o Step 2 é dedicado à seleção do processo, mas o campo repete no Step 3 como opcional — podendo confundir o usuário.

---

### GAP #6 — Ausência de validação de datas futuras
**Impacto:** MÉDIO  
**Descrição:** O wizard permite avançar com datas de praças no passado ou com anos inválidos (bug #2). Não há validação no frontend alertando que datas precisam ser futuras.

---

### GAP #7 — Nomenclatura "Comitente/Vendedor" errada para Tomada de Preços
**Impacto:** BAIXO (UX)  
**Descrição:** Para Tomada de Preços o campo "Comitente/Vendedor" deveria se chamar "Órgão Público" ou "Entidade Licitante", pois não há venda envolvida.

---

### GAP #8 — Wizard sem persistência de rascunho
**Impacto:** MÉDIO  
**Descrição:** O estado do wizard é apenas client-side (React Context). Se o usuário atualizar a página, fechar o tab ou perder conexão, todo o progresso é perdido. Não há salvamento automático de rascunho.

---

### GAP #9 — Sem indicador de progresso percentual
**Impacto:** BAIXO (UX)  
**Descrição:** O stepper mostra os steps numerados mas sem indicação do tempo estimado ou percentual de conclusão. Para novos usuários, não fica claro o esforço total necessário.

---

### GAP #10 — Step de Loteamento sem opção de criação manual de lote
**Impacto:** MÉDIO  
**Descrição:** O único jeito de criar um lote no wizard é a partir de um ativo existente. Não existe opção de criar um lote manualmente com título, descrição e valores, sem associar a um ativo pré-cadastrado. Isso obriga um fluxo de 2 etapas (cadastrar ativo, depois criar lote) quando poderia ser direto no wizard.

---

### GAP #11 — Campo "Categoria Principal" limitado a 5 opções
**Impacto:** MÉDIO  
**Descrição:** Apenas 5 categorias: Imóveis, Informática, Maquinário, Mobiliário, Veículos. Faltam categorias comuns como: Agronegócio, Joias/Metais Preciosos, Arte, Animais, Serviços, Obras.

---

### GAP #12 — Sem campo de Modalidade de Lances (incremento, automático, etc.)
**Impacto:** MÉDIO  
**Descrição:** O wizard não oferece configuração de: incremento mínimo de lance, lance automático (robô), lance por procuração, tempo de extensão automática (soft close). Esses são campos críticos para a operação do pregão.

---

### GAP #13 — Nomes dos processos judiciais no seed são dados fake não representativos
**Impacto:** BAIXO (QA)  
**Descrição:** Os processos judiciais de seed têm números como "0098765-03.2024.8.26.0100-1772936948382" — o número após o segundo hífen é um timestamp, tornando os dados de seed inutilizáveis para demonstrações reais.

---

## 6. Resumo Consolidado de Erros — Tabela de Priorização

| # | Tipo | Severidade | Modalidade | Arquivo/URL | Descrição | Fix |
|---|------|-----------|-----------|-------------|-----------|-----|
| 1 | Bug Backend | 🔴 CRÍTICO | Todas | `auction.service.ts` | `tenantId` ausente em `auctionStage.createMany()` | Adicionar `tenantId: BigInt(tenantId)` |
| 2 | Bug Input | 🔴 CRÍTICO | Todas | `/admin/wizard` step praças | Data/hora registra ano como `0002` | Fix no parser datetime |
| 3 | Bug UX | 🔴 CRÍTICO | Judicial | `/admin/wizard` step 5 | Publicação silenciosa sem feedback | Adicionar toast de sucesso/erro |
| 4 | Bug Dados | 🟠 ALTO | Todas | `/admin/wizard` step detalhes | Cidades de SC (e outros estados) não carregam | Popular banco de cidades |
| 5 | Bug API | 🟠 ALTO | Todas | `/admin/wizard` step detalhes | CEPs de municípios pequenos não encontrados | Integrar API de CEP externa |
| 6 | Gap Dados | 🟠 ALTO | Ext/Part/TP | `/admin/wizard` step loteamento | 0 ativos disponíveis para modalidades não-judiciais | Adicionar ativos ao seed + orientação UX |
| 7 | Gap Backend | 🟠 ALTO | Todas | `admin-plus/*` | Erros em courts, roles, document-types, data-sources | Investigar [AdminAction] |
| 8 | Gap Negócio | 🟠 ALTO | Tomada Preços | Wizard completo | Sem campos específicos de licitação | Criar step custom |
| 9 | Gap Dados | 🟡 MÉDIO | Todas | Step detalhes | Leiloeiros/comitentes apenas genéricos de seed | Cadastrar entidades reais |
| 10 | Gap Negócio | 🟡 MÉDIO | Tomada Preços | Step loteamento | Loteamento inadequado para processo de compra | Redesenhar step |
| 11 | Gap UX | 🟡 MÉDIO | Todas | Step loteamento | Sem opção de criar lote manual sem ativo | Adicionar criação manual |
| 12 | Gap Dados | 🟡 MÉDIO | Todas | Step detalhes | Apenas 5 categorias disponíveis | Expandir categorias |
| 13 | Gap Funcional | 🟡 MÉDIO | Todas | Wizard geral | Sem persistência de rascunho | Implementar auto-save |
| 14 | Gap Funcional | 🟡 MÉDIO | Todas | Step detalhes | Sem campos de configuração de lances | Adicionar incremento, soft-close |
| 15 | Gap Negócio | 🟡 MÉDIO | Judicial | Step 2/3 | Processo judicial obrigatório vs opcional confuso | Clarificar obrigatoriedade |

---

## 7. Dados Disponíveis no Sistema (Seed)

### Leiloeiros disponíveis
- LEILOEIRO MG 01 (múltiplos registros com timestamps)
- LEILOEIRO RJ 01 (múltiplos registros)
- LEILOEIRO SP 01 (múltiplos registros)

### Comitentes disponíveis
- Leiloeiro Judicial RJ (múltiplos)
- Leiloeiro Judicial MG (múltiplos)
- ~32 registros total, 4 páginas

### Categorias disponíveis
Imóveis | Informática | Maquinário | Mobiliário | Veículos

### Processos Judiciais (seed)
4 processos com número formato: `0098765-03.2024.8.26.0100-{timestamp}`

### Ativos disponíveis para loteamento
- JUDICIAL: 1 ativo (Empilhadeira — status DISPONIVEL, vinculada a processo judicial)
- EXTRAJUDICIAL / PARTICULAR / TOMADA_DE_PRECOS: 0 ativos

---

## 8. Dados de Teste Utilizados (Referência Superbid)

| Modalidade | Leilão | Lotes |
|-----------|--------|-------|
| Extrajudicial — Veículos | 5º Leilão Força Máxima (AZ Leilões) | Retroescavadeira Case 580L (R$50k), Iveco Tector 240E25 (R$145k), Nissan Frontier 4x4 (R$48k) |
| Extrajudicial — Gov | Prefeitura Luiz Alves/SC | VW Gol 2014 (R$15.250), Ônibus M.Benz 1996 (R$55k), Retroescavadeira |
| Judicial | 2ª Vara Cível Campinas/SP (fictício baseado em padrões reais) | VW Gol 1.0 2014 Branco |
| Particular | Imóveis Curitiba/PR (fictício) | Apartamento 65m² Água Verde |
| Tomada de Preços | TP 001/2026 Prefeitura Luiz Alves/SC | Serviços de Pintura — 10 unidades escolares |

---

## 9. Ambiente e Logs Vercel

| Item | Valor |
|------|-------|
| Branch | `main` (Produção) |
| Deployment | `dpl_C2ijTk6SZRnypj2Xj3YDgTDYufjQ` |
| Projeto | `prj_4tz3zXk6sCgHUJg1TTSNnLQ9UgIs` |
| Leilões criados durante auditoria | IDs 50n, 51n, 53n (sem praças — bugados) |

### Logs Vercel Relevantes
```
04:35:55 POST /admin/wizard 200 | [PublicIdGenerator] Gerado...  ← publicação 4ª modalidade
04:31:15 POST /admin/wizard 200 | [PublicIdGenerator] Gerado...  ← publicação 3ª modalidade
04:26:25 POST /admin/wizard 200 | [PublicIdGenerator] Gerado...  ← publicação 2ª modalidade
04:12:46 POST /admin-plus/courts 200 | error [AdminAction] Erro inesperado
04:11:36 POST /admin-plus/document-types 200 | error [AdminAction] Erro inesperado
04:09:15 POST /admin-plus/roles 200 | error [AdminAction] Erro inesperado
```

---

## 10. Próximos Passos Recomendados

### P0 — Fix imediato (1 linha de código)
```typescript
// src/services/auction.service.ts — método createAuction()
// Adicionar tenantId no mapeamento de praças dentro da transação:
tenantId: BigInt(tenantId),
```

### P1 — Bugs a corrigir antes de produção
1. Fix parser de data/hora no wizard para evitar ano `0002`
2. Adicionar toast de sucesso na publicação JUDICIAL
3. Popular banco de cidades para todos os estados
4. Integrar API de CEP (ViaCEP ou similar)

### P2 — Melhorias funcionais
5. Adicionar ativos ao seed para modalidades extrajudicial/particular
6. Adicionar mensagem orientativa no estado vazio do loteamento
7. Criar step específico para Tomada de Preços (campos de licitação)
8. Implementar auto-save de rascunho do wizard

### P3 — Evolução
9. Adicionar categorias: Agronegócio, Joias, Arte, Serviços, Obras
10. Campos de configuração de lances (incremento, soft-close)
11. Opção de criação de lote manual sem ativo
12. Investigar e corrigir erros no Admin-Plus (courts, roles, document-types)

---

*Relatório gerado automaticamente por agente de auditoria externo em 20/03/2026.*  
*Dados de referência: [Superbid](https://www.superbid.net/leiloes) | [Repositório GitHub](https://github.com/augustodevcode/bidexpert_ai_firebase_studio)*
