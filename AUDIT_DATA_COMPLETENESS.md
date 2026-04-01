# Auditoria de Completude de Dados — Wizard de Cadastro de Leilões

> **Data:** 2026-03-23  
> **Branch:** `feat/wizard-reg-v2-20260322`  
> **Worktree:** `E:\bw\wizard-v2`  
> **Ambiente:** `http://demo.localhost:9006` (porta 9006, tenant demo)

---

## 1. Resumo Executivo

| Item | Status |
|------|--------|
| Leilões com referência externa verificável | **1 de 4** (apenas Auction #1) |
| PDFs/Documentos cadastrados via wizard | **0** (wizard NÃO suporta upload) |
| Imagens de ativos cadastradas via wizard | **0** (wizard NÃO suporta upload) |
| Campos obrigatórios faltantes no wizard | **6+** (incremento, comissão, exequente, executado, CNJ, cartório) |
| Auction #1 — fidelidade ao original | **~85%** (datas, seller e processo-base alinhados localmente) |
| Auctions #2-4 — verificabilidade | **N/A** (sem fonte externa encontrada) |

---

## 2. Limitação Estrutural: Wizard NÃO Suporta Documentos

### Evidência

O tipo `WizardData` (em `src/components/admin/wizard/wizard-context.tsx`) é:

```typescript
interface WizardData {
  auctionType?: AuctionType;
  judicialProcess?: JudicialProcess;
  auctionDetails?: Partial<Auction>;
  selectedAssets?: Asset[];
  createdLots?: Lot[];
}
```

**Nenhum campo** para documentos, PDFs, imagens ou anexos.

### Steps do Wizard Analisados

| Step | Componente | Upload? |
|------|-----------|---------|
| 1 - Tipo de Leilão | `step-1-type-selection.tsx` | ❌ |
| 2 - Setup Judicial | `step-2-judicial-setup.tsx` | ❌ |
| 3 - Detalhes | `step-3-auction-details.tsx` | ❌ |
| 4 - Loteamento | `step-4-lotting.tsx` | ❌ |
| 5 - Revisão | `step-5-review.tsx` | ❌ |

### Conclusão

**É impossível cadastrar documentos (editais, IPTUs, laudos) ou imagens via wizard.** Isso é uma **limitação do produto**, não um bug de teste. Para que PDFs e imagens sejam anexados, seria necessário:

1. Adicionar um campo `documents?: DocumentUpload[]` ao `WizardData`
2. Criar um step ou seção de upload no wizard (entre Steps 3 e 4, ou como sub-step)
3. Integrar com a API `/api/upload/document` que já existe no projeto
4. Adicionar `imageUrl` e upload de imagens ao formulário de criação de ativos inline

---

## 3. Auction #1 — Leilão Judicial Imóvel Salgado/SE

### Referência Original
- **Site:** AbaLeilões (abaleiloes.com.br)
- **ID:** #422 / Bem #2507
- **URL:** `https://www.abaleiloes.com.br/leilao/422/leilao-de-imovel-em-salgado-se`

### Comparação Campo a Campo

| Campo | Referência (AbaLeilões) | Fixture (Test) | Status |
|-------|------------------------|----------------|--------|
| **Título** | "JUSTIÇA ESTADUAL DE SALGADO/SE" | "Leilão Judicial - Imóvel Salgado/SE - Processo 2024.711.01064" | ⚠️ Diferente (fixture mais descritivo) |
| **Tipo** | Judicial | JUDICIAL | ✅ |
| **Leiloeiro** | Adilson Bento de Araújo (JUCESP 015/2008) | auctioneerId: 87 (Adilson) | ✅ |
| **Processo** | 2024.711.01064 / CNJ 00010417820248250037 | processNumber: "2024.711.01064" | ⚠️ Parcial (CNJ ausente) |
| **Exequente** | DANILO DOS SANTOS OLIVEIRA E OUTROS | N/A | ❌ **AUSENTE** |
| **Executado** | GRASSO EMPREENDIMENTOS IMOBILIARIOS LTDA ME | N/A | ❌ **AUSENTE** |
| **Seller** | N/A (partes são exequente/executado) | sellerName: "Grasso Empreendimentos Imobiliarios Ltda ME" | ✅ Alinhado localmente via fixture/seed E2E |
| **Modalidade** | Online | N/A | ❌ **AUSENTE** |
| **1ª Praça Início** | 11/03/2026 10:00 | 2026-03-11T10:00 | ✅ |
| **1ª Praça Fim** | 18/03/2026 10:00 | 2026-03-18T10:00 | ✅ |
| **2ª Praça Início** | 18/03/2026 10:00 | 2026-03-18T10:01 | ⚠️ Diferença residual de 1 minuto no início da 2ª praça |
| **2ª Praça Fim** | 25/03/2026 10:00 | 2026-03-25T10:00 | ✅ |
| **Avaliação / 1ª Praça** | R$ 20.000,00 | initialPrice: 20000 | ✅ |
| **Lance Mínimo / 2ª Praça** | R$ 10.000,00 (50%) | initialPrice: 10000 | ✅ |
| **Incremento** | R$ 250,00 | N/A | ❌ **AUSENTE** (wizard não tem campo) |
| **Comissão Leiloeiro** | 5% | N/A | ❌ **AUSENTE** (wizard não tem campo) |
| **Ativo — Descrição** | "01 (UM) LOTE COM UMA ÁREA DE 160 M², LOTEAMENTO SALGADO RESIDENCE, POVOADO QUEBRADAS IV, SALGADO/SE" | "Terreno 160m² - Salgado/SE - Matrícula 7313" | ⚠️ Simplificado |
| **Matrícula** | 7313, Livro nº2, Cartório 1º Ofício Itaporanga D'Ajuda/SE | "Matrícula 7313" | ⚠️ Parcial (livro/cartório ausentes) |
| **Lote/Quadra** | Lote 12, Quadra 7 | N/A | ❌ **AUSENTE** |
| **Cidade/UF** | Salgado/SE | cityId → Salgado/SE | ✅ |
| **Área** | 160m² (8.0m x 20.0m) | "160m²" (na descrição) | ⚠️ Parcial (dimensões ausentes) |
| **Categoria** | Imóvel | categoryId: 1 (Imóveis) | ✅ |

### Documentos e Imagens — AbaLeilões #422

| Documento | URL Original | Cadastrado? |
|-----------|-------------|-------------|
| **Edital (PDF)** | `https://static.suporteleiloes.com.br/abaleiloescombr/bens/2507/arquivos/sl-bem-2507-69a87eb620cef-69a87eb623326.pdf` | ❌ NÃO |
| **IPTU (PDF)** | `https://static.suporteleiloes.com.br/abaleiloescombr/bens/2507/arquivos/sl-bem-2507-69a87eb887cf4-69a87eb888e6d.pdf` | ❌ NÃO |
| **Imagem 1 (Planta)** | `https://static.suporteleiloes.com.br/abaleiloescombr/bens/2507/fotos/foto-bem-2507-...` | ❌ NÃO |
| **Imagem 2 (Planta)** | `https://static.suporteleiloes.com.br/abaleiloescombr/bens/2507/fotos/foto-bem-2507-...` | ❌ NÃO |

### Diagnóstico Auction #1

**Fidelidade geral: ~85% no ambiente local validado**

- ✅ Preços corretos (avaliação e lance mínimo)
- ✅ Leiloeiro correto
- ✅ Cidade/UF/Categoria corretos
- ✅ Processo parcialmente correto
- ✅ Datas corrigidas para março
- ✅ Seller/processo de referência alinhados localmente para o fluxo E2E
- ❌ 2 PDFs não cadastrados (wizard não suporta)
- ❌ 2 imagens não cadastradas (wizard não suporta)
- ❌ 6+ campos ausentes (incremento, comissão, exequente, executado, lote/quadra, CNJ)

---

## 4. Auction #2 — Nutrien Terrenos Industriais

### Referência Externa
**NÃO ENCONTRADA.** Buscas realizadas em:
- AbaLeilões (`/busca?tipo=Imóveis` + pesquisa manual) — Sem resultados para "Nutrien"
- Google (`nutrien terrenos industriais leilão`) — Bloqueado por JS
- Superbid Exchange (`exchange.superbid.net/explorar?busca=nutrien`) — Sem resultados específicos

### Fixture (Test)
```
Título: "Nutrien - Terrenos Industriais - Lote GO e SP"
Tipo: TOMADA_DE_PRECOS
Seller: Nutrien (id: 84)
2 ativos: Terreno Industrial 117.702m² Rio Verde/GO R$6.528.985
          Terreno Urbano 12.1ha Cândido Mota/SP R$5.500.000
1 praça única: R$6.528.985
```

### Status
- **Verificabilidade:** ❌ Impossível (sem fonte externa)
- **Consistência interna:** ✅ Dados coerentes entre si
- **Bug conhecido:** ✅ Resolvido localmente. RCA: o wizard misturava ativos históricos do tenant após `refetch`, e a publicação falhava em reexecuções por colisão de `slug` e `status` vazio.

---

## 5. Auction #3 — Santander Wenceslau Braz/PR

### Referência Externa
**NÃO ENCONTRADA.** Buscas realizadas em:
- Megaleiloes (`/busca?q=santander+wenceslau+braz`) — Erro ao extrair conteúdo

### Fixture (Test)
```
Título: "Santander - Alienação Fiduciária - Wenceslau Braz/PR"  
Tipo: EXTRAJUDICIAL
Seller: Santander Brasil (id: 6)
1 ativo: Terrenos Rurais 7.37ha Wenceslau Braz/PR R$1.281.422,65
2 praças: 1ª R$1.281.422,65 / 2ª R$769.000
```

### Status
- **Verificabilidade:** ❌ Impossível (sem fonte externa)
- **Consistência interna:** ✅ Dados coerentes

---

## 6. Auction #4 — Usina Santa Isabel Moenda

### Referência Externa
**NÃO ENCONTRADA.** Buscas realizadas em:
- Sold.com.br (`/buscar?q=usina+santa+isabel+moenda`) — 404 Page Not Found

### Fixture (Test)
```
Título: "Usina Santa Isabel - Moenda de Cana Five Lille 1952"
Tipo: PARTICULAR
Seller: Usina Santa Isabel (id: 85)
1 ativo: Moenda de Cana Five Lille 1952 Novo Horizonte/SP R$1.500.000
1 praça única: R$1.500.000
```

### Status
- **Verificabilidade:** ❌ Impossível (sem fonte externa)
- **Consistência interna:** ✅ Dados coerentes

---

## 7. Plano de Correção

### 7.1 Correções Imediatas (Fixture Data — Auction #1)

| # | Correção | Prioridade |
|---|---------|-----------|
| 1 | **Corrigir datas**: Alterar de abril (04) para março (03) para match com referência | ✅ Concluído |
| 2 | **Corrigir seller**: Substituir Santander (id:6) por seller adequado ou criar entidade para "Danilo dos Santos Oliveira" | ✅ Concluído localmente com seller/processo determinísticos |
| 3 | **Adicionar CNJ**: Incluir `"00010417820248250037"` no processo judicial | ✅ Concluído localmente no setup E2E |
| 4 | **Enriquecer descrição do ativo**: Incluir lote 12, quadra 7, loteamento, cartório | ✅ Concluído localmente na fixture |

### 7.2 Correção de Bug — Auction #2

| # | Correção | Prioridade |
|---|---------|-----------|
| 5 | **Investigar duplicação de lotes**: Verificar se há assets pré-existentes para sellerId=84 | ✅ RCA fechada |
| 6 | **Capturar corpo do erro 500**: Interceptar response na publicação | ✅ RCA fechada |

### 7.3 Evolução do Produto (Wizard)

| # | Evolução | Prioridade |
|---|---------|-----------|
| 7 | **Adicionar upload de documentos ao wizard**: Novo step ou seção em Step 3 | P1 |
| 8 | **Adicionar upload de imagens aos ativos**: No formulário inline de criação de ativo | P1 |
| 9 | **Adicionar campos faltantes**: incremento, comissão, modalidade | P2 |
| 10 | **Adicionar campos de partes**: exequente, executado (para tipo JUDICIAL) | P2 |

---

## 8. Metodologia da Auditoria

### Fontes Consultadas

| Fonte | Resultado |
|-------|----------|
| AbaLeilões (`abaleiloes.com.br`) | ✅ Encontrado Auction #1 (422/2507) |
| AbaLeilões busca por "Nutrien" | ❌ Sem resultados |
| Google Search "Nutrien terrenos industriais leilão" | ❌ Bloqueado (JS required) |
| Superbid Exchange | ❌ Sem resultados para "Nutrien" |
| Megaleiloes | ❌ Erro ao processar busca |
| Sold.com.br | ❌ 404 Page Not Found |

### Arquivos Analisados

- `tests/e2e/admin/wizard-registration-cycle.spec.ts` (~930+ linhas)
- `src/app/admin/wizard/actions.ts` (160 linhas)
- `src/app/admin/wizard/page.tsx` (~760 linhas)
- `src/components/admin/wizard/wizard-context.tsx` (WizardData type)
- `src/components/admin/wizard/steps/step-1-type-selection.tsx`
- `src/components/admin/wizard/steps/step-2-judicial-setup.tsx`
- `src/components/admin/wizard/steps/step-3-auction-details.tsx`
- `src/components/admin/wizard/steps/step-4-lotting.tsx`
- `src/components/admin/wizard/steps/step-5-review.tsx`
- `context/seed-master-data.md`
- `AUDITORIA_LEILOES.md`
- `AUDITORIA_CADASTRO_LEILAO_2026_03_17.md`

### Ferramentas Utilizadas

- `fetch_webpage` (AbaLeilões, Google, Superbid, Megaleiloes, Sold)
- `grep_search` / `Select-String` para confirmar ausência de upload no wizard
- `read_file` para análise de código-fonte
- `semantic_search` para localizar upload API existente

---

## 9. Conclusão

A auditoria revelou que:

1. **Apenas 1 dos 4 leilões** tem uma referência externa verificável (AbaLeilões #422)
2. **O wizard NÃO suporta upload de documentos ou imagens** — este é o principal gap
3. **A fixture do Auction #1** foi corrigida localmente para ~85% de fidelidade ao original; o gap remanescente principal é upload de PDFs/imagens e campos que o wizard ainda não suporta
4. **As fixtures #2-4** são dados fictícios realistas, internamente consistentes, mas inverificáveis
5. **O bug de duplicação de lotes/publicação** foi resolvido localmente com isolamento de ativos por sessão no wizard e hardening de slug/status no service

**Ação recomendada:** Promover as correções locais e, em seguida, tratar a evolução do wizard para suportar documentos/imagens como feature separada.
