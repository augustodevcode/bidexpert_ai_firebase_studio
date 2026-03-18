# Relatório de Auditoria — Cadastro de Leilão BidExpert
**Data:** 17 de Março de 2026 — 00:40 BRT  
**Auditor:** Perplexity Computer (agent externo)  
**Branch auditada:** `demo-stable` (Preview Vercel)  
**URL auditada:** https://bidexpertaifirebasestudio-git-d4a96e-augustos-projects-d51a961f.vercel.app/  
**Leilão de referência:** [ABA Leilões nº 413 — Justiça Estadual de Itabainhinha/SE](https://www.abaleiloes.com.br/leiloes/413)

---

## 1. Resumo Executivo

A auditoria cobriu o fluxo completo de cadastro de um leilão judicial com lotes loteados, simulando dados reais do leilão nº 413 da ABA Leilões. Foram identificados **5 bugs críticos**, **4 bugs de severidade alta**, **4 gaps de negócio** e **2 itens de dados inexistentes** que impedem completamente o fluxo principal de cadastro.

**Resultado geral: ❌ FLUXO DE CADASTRO DE LEILÃO NÃO FUNCIONAL**

O formulário de criação de leilão (tanto v1 `/admin/auctions/new` quanto v2 `/admin/auctions-v2/new`) falha silenciosamente ao tentar salvar — não cria o leilão, não exibe mensagem de erro, não redireciona. Os logs do Vercel confirmam erro `AuctionService.create` e erro Prisma no momento exato das tentativas.

---

## 2. Dados de Referência — Leilão ABA 413

| Campo | Valor |
|-------|-------|
| Título | JUSTIÇA ESTADUAL DE ITABAINHINHA/SE |
| Modalidade | Online / Judicial |
| Leiloeiro | Adilson Bento de Araújo (ABA Leilões — JUCESP 015/2008) |
| 1ª Praça Abertura | 11/03/2026 às 09:00 |
| 1ª Praça Encerramento | 18/03/2026 às 09:00 |
| 2ª Praça Abertura | 18/03/2026 às 09:00 |
| 2ª Praça Encerramento | 25/03/2026 às 09:00 |
| Processo | 00002667420218250035 (2021.700.00270) |
| Exequente | BANCO DO BRASIL S/A |
| Executado | JOSE DOS SANTOS SOARES |

**Lote 1:**  
- Terreno 150 m² — Rua F, nº 13, Q.04, Bairro Paraíso, Itabaianinha/SE  
- Avaliação: R$ 50.000,00 | Lance mínimo 1ª: R$ 50.000,00 | Lance mínimo 2ª: R$ 25.000,00  
- IPTU em aberto: R$ 517,94 | Hipoteca 1º Grau: Banco do Brasil

---

## 3. Fluxo de Acesso

### 3.1 Vercel Deployment Protection
- **Status:** `BLOQUEANTE` na 1ª tentativa  
- **Comportamento:** URL de preview redireciona para `vercel.com/login` exigindo OTP por e-mail  
- **Resolução:** Gerado link de bypass via `_vercel_share` token (expira em 23h)  
- **Impacto:** Agentes e QAs externos não conseguem acessar sem bypass manual

### 3.2 Login na Aplicação
| Tentativa | URL | Resultado |
|-----------|-----|-----------|
| `/login` | BUG — retorna 404 | ❌ |
| `/auth/login` | Login funcional com `admin@bidexpert.com.br / Admin@123` | ✅ |
| Pós-login | Redirecionado para `/dashboard/overview` | ✅ |

---

## 4. Mapeamento do Painel Admin

### 4.1 Menu Principal Identificado
- Dashboard
- Admin Plus
- Pregões ao Vivo
- Assistente de Leilão (AI)
- **GERENCIAMENTO:**
  - Leilões (`/admin/auctions`)
  - Leilões SuperGrid (`/admin/auctions-supergrid`)
  - Lotes (`/admin/lots`)
  - Ativos/Bens (`/admin/assets`)
  - Loteamento (`/admin/lotting`)
  - Participantes
  - Gestão Judicial
  - Catálogo e Mídia
- ANÁLISE E RELATÓRIOS
- PLATAFORMA
- Dev Console

### 4.2 Estado do Banco (pré-auditoria)
- Leilões cadastrados: **78**
- Lotes cadastrados: **151**

---

## 5. Bugs Encontrados

### 🔴 CRÍTICO — Bug #1: Falha Silenciosa no Formulário v2 (auctions-v2/new)
**URL:** `/admin/auctions-v2/new`  
**Comportamento:** Clicar em "Criar leilão" exibe spinner brevemente → retorna à mesma URL sem criar leilão. Nenhuma mensagem de erro, nenhum feedback ao usuário.  
**Log Vercel confirmando:**
```
03:56:22 | POST | /admin/auctions-v2/new | 200 | error | Error in AuctionService.cre...
03:55:39 | POST | /admin/auctions-v2/new | 200 | error | Error in AuctionService.cre...
03:55:17 | POST | /admin/auctions-v2/new | 200 |  | prisma:error Error in Postg...
```
**Causa raiz provável:** Erro no `AuctionService.create` + erro Prisma/PostgreSQL.  
**Violação de RN:** RN-003 — "Toast de feedback após submissão (nunca falhar silenciosamente)"  
**Impacto:** Fluxo de criação de leilão 100% bloqueado.

---

### 🔴 CRÍTICO — Bug #2: Falha Silenciosa no Formulário v1 (auctions/new)
**URL:** `/admin/auctions/new`  
**Comportamento:** Mesmo preenchendo todos os campos obrigatórios (Título, Status, Categoria, Leiloeiro, Comitente, Modalidade, Participação, Método), o botão Salvar exibe spinner e retorna à mesma página sem criar leilão.  
**Log Vercel:**
```
03:22:28 | POST | /admin/auctions | 200 | error | [getAuctions] Error: Syntax...
```
**Impacto:** Fluxo de criação de leilão 100% bloqueado (ambas as versões do formulário).

---

### 🔴 CRÍTICO — Bug #3: SyntaxError BigInt em SuperGrid/Lotes/Lotting
**URLs afetadas:** `/admin/auctions-supergrid`, `/admin/lots`, `/admin/lotting`  
**Log Vercel:**
```
03:22:35 | POST | /admin/auctions-supergrid | 500 | error | SyntaxError: Cannot convert...
03:22:34 | POST | /admin/auctions-supergrid | 500 | error | SyntaxError: Cannot convert...
03:22:37 | POST | /admin/lots | 200 | error | [getAuctions] Error: Syntax...
03:22:46 | POST | /admin/lotting | 200 | error | [getAuctions] Error: Syntax...
```
**Causa raiz provável:** Conversão BigInt para JSON sem `toJSON` handler — IDs BigInt (RN-012) não podem ser serializados nativamente.  
**Impacto:** Listas de leilões/lotes no SuperGrid e Lotting falham em carregar dados.

---

### 🔴 CRÍTICO — Bug #4: Erro Prisma ao Criar Leilão (PostgreSQL)
**Log Vercel:**
```
03:55:17 | POST | /admin/auctions-v2/new | 200 | prisma:error Error in Postg...
```
**Causa raiz provável:** Erro de constraint, campo obrigatório faltando, ou tipo de dado incompatível no schema do PostgreSQL.  
**Impacto:** Impossibilita persistência no banco.

---

### 🔴 CRÍTICO — Bug #5: Lote não pode ser criado sem leilão associado
**URL:** `/admin/lots/new`  
**Comportamento:** Campo "Leilão Associado" é obrigatório e depende de um leilão existente. Como o leilão não pode ser criado (Bug #1/#2), o fluxo de criação de lote fica bloqueado em cascata.  
**Busca por "JUSTIÇA" no seletor:** retornou "Nenhum resultado encontrado" — confirmando que nenhum leilão foi criado.

---

### 🟠 ALTA — Bug #6: `/login` retorna 404
**URL:** `/login`  
**Comportamento:** Página não encontrada. Login correto está em `/auth/login`.  
**Impacto:** Usuários que tentam acessar a URL óbvia de login são bloqueados.

---

### 🟠 ALTA — Bug #7: `/admin` em carregamento infinito
**URL:** `/admin`  
**Comportamento:** Exibe spinner de loading indefinidamente. Nunca renderiza conteúdo.  
**Impacto:** A rota administrativa principal é inacessível.

---

### 🟠 ALTA — Bug #8: Dropdown de Cidade não carrega após selecionar Estado
**URL:** `/admin/auctions-v2/new`  
**Comportamento:** Após selecionar "Sergipe" (SE) no campo Estado, o dropdown de Cidade permanece vazio.  
**Violação de RN:** RN-004 (Endereçamento Unificado) — "Campos estruturados: cityId, stateId"  
**Impacto:** Impossibilita preencher endereço completo no leilão.

---

### 🟠 ALTA — Bug #9: Botão "Novo Lote" na lista não funciona
**URL:** `/admin/lots`  
**Comportamento:** Clique no botão "Novo Lote" não navega para o formulário de criação. Necessário acessar `/admin/lots/new` diretamente via URL.  
**Violação de RN:** RN-013 (Testabilidade — botões de ação crítica com `data-ai-id`)  
**Impacto:** UX quebrado para criação de lotes.

---

### 🟡 MÉDIO — Bug #10: Campos de data/hora requerem valor incompleto
**URL:** `/admin/auctions-v2/new`  
**Comportamento:** Campos de data (Início/Fim das Praças) exigem componente de hora além da data. Erro nativo do browser: _"Please enter a valid value. The field is incomplete or has an invalid date."_  
**Impacto:** Validação de praças falha sem hora configurada.

---

### 🟡 MÉDIO — Bug #11: Erros Prisma em /admin/sellers e /admin/assets
**Logs Vercel:**
```
03:23:07 | POST | /admin/sellers | 200 | error | [getSellers] Error: Error:...
03:22:38 | POST | /admin/assets | 200 | prisma:error Invalid `pris...
03:17:10 | POST | /admin/lots/analysis | 500 | error | [Action - analyzeAuctionDat...
03:16:34 | POST | /admin/users/analysis | 500 | prisma:error Invalid `pris...
```
**Impacto:** Módulos de vendedores, ativos e análise com falhas de banco.

---

## 6. Gaps de Negócio (vs. Regras RN)

### GAP #1 — Dados de Leiloeiro Inexistentes
**Seção:** Formulário de Leilão → Campo "Leiloeiro"  
**Problema:** "Adilson Bento de Araújo (ABA Leilões)" não existe no sistema. Os leiloeiros disponíveis são genéricos: "LEILOEIRO MG 01", "LEILOEIRO RJ 01", "LEILOEIRO SP 01".  
**Impacto:** Impossível cadastrar leilões externos com leiloeiros reais. O sistema não tem fluxo de cadastro/importação de leiloeiros externos.  
**Regra afetada:** RN-020 — "Leiloeiro vinculado e ativo"

---

### GAP #2 — Processo Judicial não Cadastrado
**Seção:** Formulário de Leilão → Campo "Processo Judicial"  
**Problema:** Processo "00002667420218250035" não existe. O sistema parece exigir que o processo seja pré-cadastrado em "Gestão Judicial" antes de ser associado ao leilão.  
**Impacto:** Fluxo de cadastro de leilão judicial requer etapa prévia não documentada no formulário.

---

### GAP #3 — Falta de Campos Específicos para Leilão Judicial
**Seção:** Formulários de Leilão (v1 e v2)  
**Campos ausentes identificados:**
- Exequente / Executado
- Número do processo formatado (ex: 2021.700.00270)
- Número de praças configurável com lance mínimo por praça (v1 não tem)
- Campo "Regras de prorrogação" (ex: 3 min antes do fim = +3 min)
- Valor de avaliação separado do lance mínimo  
**Impacto:** Dados judiciais obrigatórios por lei (ex: Art. 21 CNJ Res. 236/2016) não podem ser registrados.

---

### GAP #4 — Formulário de Lote Sem Campos de Endereço
**URL:** `/admin/lots/new`  
**Campos disponíveis:** Título, Tipo do Bem, Status, Leilão Associado, Propriedades, Lance Inicial, Incremento Mínimo  
**Campos ausentes:**
- Endereço do lote (fundamental para imóveis)
- Valor de avaliação (diferente do lance mínimo)
- Lance mínimo por praça (praça 1 x praça 2)
- Número do processo
- Matrícula/Registro (imóvel)
- Ônus/gravames (hipoteca, IPTU)  
**Violação de RN:** RN-004 (Endereçamento), RN-011 (campo Propriedades não substitui campos estruturados)

---

## 7. Campos do Formulário de Leilão (Mapeamento Completo)

### Formulário v2 (`/admin/auctions-v2/new`)
**Campos disponíveis:**
- Título do Leilão *(obrigatório)*
- Descrição
- Status *(obrigatório)*
- Categoria Principal *(obrigatório)*
- Leiloeiro *(obrigatório — dropdown com busca)*
- Comitente/Vendedor *(obrigatório — dropdown com busca)*
- Processo Judicial *(dropdown com busca)*
- Modalidade *(obrigatório)*: JUDICIAL, EXTRAJUDICIAL, AMIGÁVEL
- Participação *(obrigatório)*: ONLINE, PRESENCIAL, HIBRIDO
- Método *(obrigatório)*: STANDARD, etc.
- URL do Leilão Online
- CEP, Logradouro, Número, Complemento, Bairro, Estado, Cidade
- Praças: Nome, Preço Inicial (%), Data Início, Data Fim
- Imagem de capa
- Destaque no Marketplace (toggle)
- Permitir Lances Parcelados (toggle)

**Campos ausentes identificados:**
- Exequente / Executado
- Regras de prorrogação de lance
- Número do processo (campo livre, não dropdown)
- Valor de avaliação global

### Formulário v1 (`/admin/auctions/new`)
Possui campos similares ao v2, porém sem seção de Praças dedicada.

---

## 8. Logs Vercel — Resumo dos Erros Capturados

| Horário | Método | Path | Status | Nível | Descrição |
|---------|--------|------|--------|-------|-----------|
| 03:56:22 | POST | /admin/auctions-v2/new | 200 | error | `Error in AuctionService.create` |
| 03:55:39 | POST | /admin/auctions-v2/new | 200 | error | `Error in AuctionService.create` |
| 03:55:17 | POST | /admin/auctions-v2/new | 200 | — | `prisma:error Error in PostgreSQL` |
| 03:22:35 | POST | /admin/auctions-supergrid | 500 | error | `SyntaxError: Cannot convert... (BigInt)` |
| 03:22:34 | POST | /admin/auctions-supergrid | 500 | error | `SyntaxError: Cannot convert... (BigInt)` |
| 03:22:37 | POST | /admin/lots | 200 | error | `[getAuctions] Error: Syntax...` |
| 03:22:46 | POST | /admin/lotting | 200 | error | `[getLottingSnapshotAction] Error` |
| 03:22:46 | POST | /admin/lotting | 200 | error | `[getAuctions] Error: SyntaxError` |
| 03:22:45 | POST | /admin/lotting | 200 | — | `prisma:error Invalid prisma...` |
| 03:22:38 | POST | /admin/assets | 200 | — | `prisma:error Invalid prisma...` |
| 03:22:28 | POST | /admin/auctions | 200 | error | `[getAuctions] Error: Syntax...` |
| 03:23:07 | POST | /admin/sellers | 200 | error | `[getSellers] Error` |
| 03:17:10 | POST | /admin/lots/analysis | 500 | error | `[Action - analyzeAuctionDat...]` |
| 03:16:34 | POST | /admin/users/analysis | 500 | — | `prisma:error Invalid prisma...` |
| 03:24:22 | POST | / | 200 | error | `[CategoryRepository.findAll...]` |

---

## 9. Análise de Causa Raiz (Hipóteses)

### 9.1 Erro `AuctionService.create` + Prisma PostgreSQL
A mensagem `prisma:error Error in PostgreSQL` junto com `Error in AuctionService.create` sugere:
1. **Constraint violation**: campo obrigatório no schema não preenchido (ex: `tenantId`, `publicId`, ou FK)
2. **Tipo incorreto**: campo esperando `BigInt` recebendo `String` ou `null`
3. **Registro pai inexistente**: FK para leiloeiro/comitente/processo não encontrada no banco

**Ação recomendada:** Verificar `src/lib/services/auction-service.ts` + `prisma/schema.prisma` para validar campos obrigatórios não expostos no formulário.

### 9.2 SyntaxError `Cannot convert` (BigInt)
Ocorre em múltiplos POSTs de listagem. É um erro clássico de serialização JSON de BigInt:
```javascript
JSON.stringify({ id: BigInt(1) }) // Erro: Cannot convert a BigInt value to JSON
```
**Ação recomendada:** Adicionar `replacer` global no JSON.stringify ou `toJSON` no BigInt prototype. Já documentado em RN-012 e RN-021 mas não implementado.

### 9.3 Dropdown de Cidade sem opções
O campo Cidade depende de uma query que busca cidades por `stateId`. A ausência de opções para Sergipe indica que:
- As cidades de Sergipe não estão no banco de dados do ambiente de preview
- Ou a query está falhando silenciosamente  

---

## 10. Checklist de Conformidade com Regras de Negócio

| RN | Descrição | Status | Observação |
|----|-----------|--------|------------|
| RN-003 | Toast de feedback / nunca falhar silenciosamente | ❌ VIOLADA | Formulário falha sem feedback |
| RN-004 | AddressGroup — cidade/estado funcionais | ❌ VIOLADA | Dropdown cidade não carrega |
| RN-012 | PKs BigInt com serialização correta | ❌ VIOLADA | SyntaxError BigInt em múltiplos módulos |
| RN-013 | data-ai-id em botões de ação crítica | ⚠️ NÃO VERIFICADO | Botão "Novo Lote" não funciona |
| RN-014 | Feedback de erro pós-submissão | ❌ VIOLADA | Nenhum toast de erro exibido |
| RN-020 | Leilão só publicado com lotes, praças e leiloeiro ativos | ⚠️ PARCIAL | Validação presente mas com erro de backend |
| RN-021 | IDs BigInt no frontend/backend | ❌ VIOLADA | Erros de serialização |

---

## 11. Priorização de Correções

### P0 — Bloqueadores (Corrigir imediatamente)
1. **Bug #1/2**: `AuctionService.create` — investigar e corrigir o erro Prisma/PostgreSQL que impede criação de leilões
2. **Bug #3**: Serialização BigInt → implementar `toJSON`/replacer global

### P1 — Alta Prioridade
3. **Bug #6**: Adicionar redirect `/login` → `/auth/login`
4. **Bug #7**: Corrigir loop de carregamento em `/admin`
5. **Bug #8**: Corrigir query de cidades por estado no formulário de leilão
6. **Bug #9**: Corrigir botão "Novo Lote" na lista

### P2 — Funcionalidade
7. **GAP #1**: Criar fluxo de cadastro de leiloeiros externos
8. **GAP #2**: Integrar cadastro de processo judicial antes do leilão (ou criar inline)
9. **GAP #3**: Adicionar campos judiciais ao formulário de leilão
10. **GAP #4**: Adicionar campos de endereço e avaliação ao formulário de lote

### P3 — Polimento
11. **Bug #10**: Melhorar componente de data/hora nas praças
12. **Bug #11**: Corrigir erros Prisma em sellers/assets/analysis

---

## 12. Ambiente e Configurações

| Item | Valor |
|------|-------|
| URL Preview | `bidexpertaifirebasestudio-git-d4a96e-augustos-projects-d51a961f.vercel.app` |
| Branch | `demo-stable` |
| Deployment ID | `dpl_9vGfjDt5KUvq1NSgEKdZ4c1N7W7Z` |
| Projeto Vercel ID | `prj_4tz3zXk6sCgHUJg1TTSNnLQ9UgIs` |
| Banco | PostgreSQL (Vercel Postgres / pgbouncer) |
| Framework | Next.js + Prisma ORM |
| Tenant (preview) | `demo` / `demo-stable` |

---

*Documento gerado automaticamente por agente de auditoria externo em 17/03/2026.*  
*Referências: [ABA Leilões #413](https://www.abaleiloes.com.br/leiloes/413) | [Repositório GitHub](https://github.com/augustodevcode/bidexpert_ai_firebase_studio)*
